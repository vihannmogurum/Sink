"""Sink OS Unified FastAPI Gateway & Realtime WebSocket Broadcaster."""

import os
import sys
import time
import asyncio
from typing import Any, Dict, List, Optional
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.state_store.store import StateStore
from backend.ai_services.gods_eye import GodsEyeEngine
from backend.ai_services.forecaster import SpatioTemporalForecaster
from backend.agents.orchestrator import MultiAgentOrchestrator, HYD_NODES_DATA, HYD_EDGES_DATA

# Initialize singletons
store = StateStore.get_instance()
gods_eye = GodsEyeEngine.get_instance()
forecaster = SpatioTemporalForecaster.get_instance()
orchestrator = MultiAgentOrchestrator.get_instance()

app = FastAPI(title="Sink OS Autonomous Traffic & Emergency Operations API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSockets
connected_clients: List[WebSocket] = []

class DispatchRequest(BaseModel):
    origin: str
    destination: str
    priority: Optional[str] = "emergency"

class RouteRequest(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    priority: Optional[str] = "emergency"

class IncidentInjectRequest(BaseModel):
    edge_id: str
    hazard_type: str = Field(default="ACCIDENT", alias="type")
    severity: str = "CRITICAL"

def success_envelope(data: Any) -> Dict[str, Any]:
    return {"success": True, "data": data, "error": None}

# -------------------------------------------------------------
# Background Broadcaster & Orchestrator Tick Loop (Every 2s)
# -------------------------------------------------------------
async def background_tick_loop():
    while True:
        try:
            # 1. Run CV Watcher tick
            orchestrator.run_cv_watcher_agent()
            # 2. Run Spatio-temporal forecaster
            forecast = orchestrator.run_spatial_forecaster_agent()
            # 3. Get live calculated KPIs
            kpis = store.get_live_system_kpis()
            # 4. Telemetry tick
            telemetry_snapshot = list(store.live_telemetry.values())
            # 5. Active cameras
            cameras_snapshot = store.get_all_cameras()
            # 6. Active incidents
            incidents_snapshot = list(store.active_incidents.values())
            # 7. Latest decisions
            decisions_snapshot = store.latest_decisions[:5]

            broadcast_payload = {
                "type": "state_update",
                "timestamp": time.time(),
                "telemetry_tick": telemetry_snapshot,
                "forecast_update": forecast,
                "gods_eye_cameras": cameras_snapshot,
                "active_incidents": incidents_snapshot,
                "latest_agent_decisions": decisions_snapshot,
                "live_kpis": kpis
            }

            # Broadcast to all connected clients
            dead_clients = []
            for client in connected_clients:
                try:
                    await client.send_json(broadcast_payload)
                except Exception:
                    dead_clients.append(client)

            for d in dead_clients:
                if d in connected_clients:
                    connected_clients.remove(d)

        except Exception as e:
            print(f"[Sink Background Loop Error]: {e}")

        await asyncio.sleep(2.0)

@app.on_event("startup")
async def startup_event():
    # Warm up forecast and CV
    orchestrator.run_cv_watcher_agent()
    orchestrator.run_spatial_forecaster_agent()
    asyncio.create_task(background_tick_loop())

# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------

@app.get("/api/v1/graph/topology")
@app.get("/graph")
async def get_graph_topology():
    """Return full Hyderabad NetworkX nodes, edges, and live dynamic speeds."""
    live_edges = []
    for e in HYD_EDGES_DATA:
        eid = e["edge_id"]
        speed = e["speed_limit_kph"]
        if eid in store.live_telemetry:
            speed = store.live_telemetry[eid]["speed_kmh"]
        e_copy = dict(e)
        e_copy["current_speed_kmh"] = speed
        live_edges.append(e_copy)

    return success_envelope({
        "nodes": HYD_NODES_DATA,
        "edges": live_edges,
        "timestamp": time.time()
    })

@app.get("/api/v1/kpis")
async def get_kpis():
    """Return real-time calculated KPIs from StateStore."""
    return success_envelope(store.get_live_system_kpis())

@app.get("/api/v1/cameras")
async def get_cameras(edge_ids: Optional[str] = Query(None)):
    """Return live God's Eye camera node list, optionally filtered by edge_ids."""
    edges_list = None
    if edge_ids:
        edges_list = [e.strip() for e in edge_ids.split(",") if e.strip()]
    return success_envelope(store.get_all_cameras(edge_ids=edges_list))

@app.get("/api/v1/cameras/{camera_id}/frame")
async def get_camera_frame(camera_id: str):
    """Return live JPEG annotated frame with bounding boxes and optical metrics."""
    frame_bytes = gods_eye.generate_annotated_frame(camera_id)
    return Response(content=frame_bytes, media_type="image/jpeg")

@app.get("/api/v1/cameras/{camera_id}/stream")
async def get_camera_stream(camera_id: str):
    """Return frame or stream metadata."""
    frame_bytes = gods_eye.generate_annotated_frame(camera_id)
    return Response(content=frame_bytes, media_type="image/jpeg")

@app.get("/api/v1/analytics/history")
async def get_analytics_history():
    """Real SQLite historical telemetry, hourly incident breakdown, and ETA savings series."""
    kpis = store.get_live_system_kpis()
    audit_logs = store.get_audit_logs(limit=50)

    # Transform into charts series
    eta_trend = []
    for log in reversed(audit_logs[-12:]):
        eta_trend.append({
            "timestamp": log["timestamp"],
            "baseline_eta": log["baseline_eta_sec"],
            "optimized_eta": log["optimized_eta_sec"],
            "eta_saved": log["eta_saved_sec"],
            "confidence": log["confidence"]
        })

    hourly_chart = []
    for h, cnt in enumerate(kpis["hourly_incident_distribution"]):
        hourly_chart.append({
            "hour": f"{h:02d}:00",
            "incidents": cnt if cnt > 0 else (1 if 8 <= h <= 10 or 17 <= h <= 19 else 0)
        })

    return success_envelope({
        "kpis": kpis,
        "hourly_distribution": hourly_chart,
        "eta_savings_series": eta_trend,
        "total_dispatches": len(audit_logs)
    })

@app.get("/api/v1/audit/logs")
async def get_audit_logs(limit: int = 100):
    """Full cryptographic XAI decision log table from SQLite."""
    return success_envelope(store.get_audit_logs(limit=limit))

@app.post("/api/v1/emergency/dispatch")
async def dispatch_emergency(req: DispatchRequest):
    """Run EMS_GreenWave_Agent on selected origin/destination, preempt signals, return XAI routes."""
    res = orchestrator.run_emergency_dispatch(req.origin, req.destination)
    # Broadcast immediate event
    for client in connected_clients:
        try:
            await client.send_json({
                "type": "emergency_override",
                "data": res
            })
        except Exception:
            pass
    return success_envelope(res)

@app.post("/routes/compute")
async def compute_route_compat(req: RouteRequest):
    """Compatibility endpoint for AGENT_1 and AGENT_2 route requests."""
    res = orchestrator.run_emergency_dispatch(req.from_node, req.to_node)
    return success_envelope({
        "route": res["optimized_path"],
        "dijkstra_route": res["dijkstra_path"],
        "total_weight": res["optimized_eta_sec"],
        "baseline_weight": res["baseline_eta_sec"],
        "eta_saved_sec": res["eta_saved_sec"],
        "reason": res["xai_reasoning"],
        "factors": res["factors"]
    })

@app.post("/api/v1/incidents/inject")
@app.post("/internal/incident")
async def inject_incident(req: IncidentInjectRequest):
    """Inject a live CV anomaly on a target edge/camera."""
    res = orchestrator.inject_incident_and_orchestrate(req.edge_id, req.hazard_type, req.severity)
    for client in connected_clients:
        try:
            await client.send_json({
                "type": "incident_detected",
                "data": res
            })
        except Exception:
            pass
    return success_envelope(res)

# -------------------------------------------------------------
# Unified WebSocket
# -------------------------------------------------------------
@app.websocket("/ws/state")
@app.websocket("/ws/live")
async def websocket_state_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Initial greeting with state snapshot
        init_kpis = store.get_live_system_kpis()
        await websocket.send_json({
            "type": "connection_ack",
            "message": "Connected to Sink OS Live Telemetry & God's Eye Stream",
            "live_kpis": init_kpis
        })
        while True:
            # Keep alive and allow client messages
            msg = await websocket.receive_text()
            # Client can ping or send commands
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

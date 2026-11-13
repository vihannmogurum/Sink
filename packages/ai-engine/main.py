"""UrbanFlow AI Engine & Services (AGENT_3) FastAPI Application. Runs on port 8001."""

import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Ensure packages/ai-engine is on sys.path
ai_engine_dir = Path(__file__).resolve().parent
if str(ai_engine_dir) not in sys.path:
    sys.path.insert(0, str(ai_engine_dir))

load_dotenv()

from config import settings
from forecaster.pipeline import CongestionForecaster
from incident_engine.detector import IncidentDetector
from incident_engine.mock_feed import generate_mock_telemetry_batch
from routing_engine.optimizer import RouteOptimizer
from routing_engine.preemption import EmergencyPreemptionEngine
from routing_engine.road_graph import UrbanRoadGraph
from agents.traffic_monitor import TrafficMonitorAgent
from agents.incident_analyzer import IncidentAnalyzerAgent
from agents.response_coordinator import ResponseCoordinatorAgent
from agents.xai_logger import XAILogger

from schemas.forecasting import ForecastRequest, ForecastResponse
from schemas.incidents import (
    IncidentDetectionRequest,
    IncidentDetectionResponse,
    SimulateIncidentRequest,
)
from schemas.routing import (
    EmergencyPreemptionRequest,
    EmergencyPreemptionResponse,
    NetworkGraphResponse,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
)
from schemas.agents_xai import (
    MultiAgentCycleRequest,
    MultiAgentCycleResponse,
)

# Initialize Core Services
road_graph = UrbanRoadGraph()
forecaster = CongestionForecaster()
incident_detector = IncidentDetector(
    speed_drop_zscore_threshold=settings.speed_drop_zscore_threshold,
    density_spike_threshold=settings.density_spike_threshold_veh_per_km,
    cv_confidence_threshold=settings.cv_confidence_threshold,
)
route_optimizer = RouteOptimizer(road_graph=road_graph)
preemption_engine = EmergencyPreemptionEngine(
    road_graph=road_graph,
    preemption_multiplier=settings.preemption_weight_multiplier,
)

# Multi-Agent Coordination Layer
xai_logger = XAILogger(max_history=300)
traffic_monitor_agent = TrafficMonitorAgent(xai_logger=xai_logger)
incident_analyzer_agent = IncidentAnalyzerAgent(xai_logger=xai_logger)
response_coordinator_agent = ResponseCoordinatorAgent(
    road_graph=road_graph,
    optimizer=route_optimizer,
    preemption_engine=preemption_engine,
    xai_logger=xai_logger,
)


def envelope(data: Any = None, error: Any = None) -> dict[str, Any]:
    """Strict response envelope mandated by AGENTS.md."""
    return {
        "success": error is None,
        "data": data,
        "error": error,
    }


app = FastAPI(
    title="UrbanFlow AI Engine",
    description="Adaptive Multi-Agent Traffic Intelligence & Emergency Response Optimization Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, Any]:
    return envelope({
        "status": "healthy",
        "service": settings.service_name,
        "agent_role": "AGENT_3",
        "port": settings.port,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


# -------------------------------------------------------------------------
# 1. Traffic Congestion Forecasting Endpoints (+15m & +30m Horizons)
# -------------------------------------------------------------------------

@app.post("/forecast/predict")
async def predict_traffic(request: Optional[ForecastRequest] = None) -> dict[str, Any]:
    segment_ids = request.segment_ids if request else None
    ts = request.timestamp if request else None
    forecast_result = forecaster.predict(segment_ids=segment_ids, timestamp_str=ts)
    return envelope(forecast_result.model_dump())


@app.get("/forecast/segments")
async def get_monitored_segments() -> dict[str, Any]:
    forecast_result = forecaster.predict()
    return envelope({
        "segments": forecast_result.model_dump()["forecasts"],
        "total_monitored": len(forecast_result.forecasts),
    })


# -------------------------------------------------------------------------
# 2. Incident & Anomaly Detection Endpoints
# -------------------------------------------------------------------------

@app.post("/incidents/detect")
async def detect_incidents(request: IncidentDetectionRequest) -> dict[str, Any]:
    detection_res = incident_detector.analyze_telemetry(request.telemetry)
    # Synchronize graph edge penalties with newly confirmed incidents
    for inc in detection_res.incidents:
        blocked = inc.severity.value in ["critical", "high"]
        road_graph.set_edge_incident(
            edge_id=inc.edge_id,
            incident_id=inc.incident_id,
            penalty_multiplier=5.0 if blocked else 2.5,
            blocked=blocked,
        )
    return envelope(detection_res.model_dump())


@app.get("/incidents/active")
async def get_active_incidents() -> dict[str, Any]:
    active_list = list(incident_detector.active_incidents.values())
    return envelope({
        "active_incidents": [inc.model_dump() for inc in active_list],
        "count": len(active_list),
    })


@app.post("/incidents/simulate")
async def simulate_incident(request: SimulateIncidentRequest) -> dict[str, Any]:
    incident_rec = incident_detector.register_manual_incident(
        edge_id=request.edge_id,
        incident_type=request.incident_type,
        severity=request.severity,
        affected_lanes=request.affected_lanes,
        description=request.description,
    )
    # Apply to graph
    blocked = request.severity.value in ["critical", "high"]
    road_graph.set_edge_incident(
        edge_id=request.edge_id,
        incident_id=incident_rec.incident_id,
        penalty_multiplier=5.0 if blocked else 2.5,
        blocked=blocked,
    )
    return envelope(incident_rec.model_dump())


@app.delete("/incidents/{edge_id}")
async def clear_incident(edge_id: str) -> dict[str, Any]:
    cleared = incident_detector.clear_incident(edge_id)
    if cleared:
        road_graph.clear_edge_incident(edge_id)
        return envelope({"message": f"Incident cleared on {edge_id}", "edge_id": edge_id})
    raise HTTPException(status_code=404, detail=f"No active incident found on {edge_id}")


# -------------------------------------------------------------------------
# 3. Dynamic Graph Routing & Emergency Preemption Endpoints
# -------------------------------------------------------------------------

@app.post("/routes/optimize")
async def optimize_route(request: RouteOptimizeRequest) -> dict[str, Any]:
    try:
        route_res = route_optimizer.optimize_route(request)
        return envelope(route_res.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/routes/emergency-preemption")
async def emergency_preemption(request: EmergencyPreemptionRequest) -> dict[str, Any]:
    try:
        preemption_res = preemption_engine.calculate_emergency_corridor(request)
        # Log XAI preemption decision
        xai_logger.record_decision(
            agent_role=response_coordinator_agent.role,
            trigger_event=f"Emergency Preemption requested for {request.vehicle_id} ({request.vehicle_type})",
            decision_category="EMERGENCY_OVERRIDE",
            selected_action=f"Activate code-3 green-wave corridor: {' -> '.join(preemption_res.corridor_nodes)}",
            rejected_alternatives=["Standard traffic routing", "Static priority beacon"],
            influencing_factors=[],
            human_explanation=(
                f"Emergency vehicle preemption engaged for {request.vehicle_type} {request.vehicle_id}. "
                f"Travel time reduced by {preemption_res.travel_time_saved_pct}% "
                f"({preemption_res.normal_travel_time_minutes} min -> {preemption_res.preempted_travel_time_minutes} min) "
                f"with {len(preemption_res.green_wave_actions)} synchronized green waves."
            ),
            confidence=0.99,
        )
        return envelope(preemption_res.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/graph/network")
async def get_graph_network() -> dict[str, Any]:
    summary = road_graph.to_network_summary()
    return envelope(summary.model_dump())


# -------------------------------------------------------------------------
# 4. Cooperating Multi-Agent & XAI Endpoints
# -------------------------------------------------------------------------

@app.post("/agents/step")
async def run_multi_agent_step(request: Optional[MultiAgentCycleRequest] = None) -> dict[str, Any]:
    cycle_id = f"CYCLE-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.utcnow().isoformat() + "Z"

    # Step 1: Telemetry Ingestion (use provided or generate mock)
    force_edge = request.force_incident_edge if request else None
    telemetry_data = generate_mock_telemetry_batch(inject_anomaly_edge=force_edge)

    # Step 2: Traffic Monitor Agent
    tm_state, tm_actions = traffic_monitor_agent.monitor_stream(telemetry_data)

    # Step 3: Incident Analyzer Agent
    detection_res = incident_detector.analyze_telemetry(telemetry_data)
    ia_state, ia_actions = incident_analyzer_agent.analyze_incidents(detection_res.incidents)

    # Step 4: Response Coordinator Agent
    rc_state, rc_actions = response_coordinator_agent.coordinate_response(
        confirmed_incidents=detection_res.incidents,
        trigger_reroute=True,
    )

    all_actions = tm_actions + ia_actions + rc_actions
    recent_xai = xai_logger.get_logs(limit=10)

    cycle_response = MultiAgentCycleResponse(
        cycle_id=cycle_id,
        timestamp=now_str,
        agent_states={
            "traffic_monitor": tm_state,
            "incident_analyzer": ia_state,
            "response_coordinator": rc_state,
        },
        actions_taken=all_actions,
        xai_logs=recent_xai,
    )
    return envelope(cycle_response.model_dump())


@app.get("/agents/xai-logs")
async def get_xai_logs(limit: int = Query(default=50, ge=1, le=200)) -> dict[str, Any]:
    logs = xai_logger.get_logs(limit=limit)
    return envelope({
        "total": len(logs),
        "limit": limit,
        "logs": [item.model_dump() for item in logs],
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)

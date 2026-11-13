"""UrbanFlow API gateway."""

import importlib
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from routing import emergency_preemption, find_shortest_path, graph, load_graph, update_graph_edge
from websocket import broadcast, router as websocket_router

load_dotenv()
last_computed_routes: dict[str, dict[str, Any]] = {}


class RouteRequest(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    priority: str


class IncidentRequest(BaseModel):
    edge_id: str
    incident_type: str = Field(alias="type")
    severity: str


def success(data: dict[str, Any]) -> dict[str, Any]:
    return {"success": True, "data": data, "error": None}


def _database_module() -> Any:
    return importlib.import_module("packages.database.db")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        load_graph()
    except ModuleNotFoundError:
        pass
    yield


app = FastAPI(title="UrbanFlow AI API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(websocket_router)


@app.get("/graph")
async def get_graph() -> dict[str, Any]:
    database = _database_module()
    return success({"nodes": database.get_all_nodes(), "edges": database.get_all_edges()})


@app.post("/routes/compute")
async def compute_route(request: RouteRequest) -> dict[str, Any]:
    if request.priority not in {"normal", "emergency"}:
        raise HTTPException(status_code=422, detail="priority must be normal or emergency")
    if request.priority == "emergency":
        route_result = emergency_preemption(request.from_node, request.to_node)
        reason = f"Emergency corridor cleared from {request.from_node} to {request.to_node}. All signals preempted."
        event_name = "emergency_override"
    else:
        route_result = find_shortest_path(graph, request.from_node, request.to_node)
        reason = f"Shortest path computed. Total travel time: {route_result['total_weight']} min."
        event_name = "route_recalculated"
    data = {**route_result, "reason": reason}
    last_computed_routes["latest"] = route_result
    await broadcast(event_name, data)
    return success(data)


@app.get("/routes/{vehicle_id}")
async def get_vehicle_route(vehicle_id: str) -> dict[str, Any]:
    route_result = last_computed_routes.get(vehicle_id) or last_computed_routes.get("latest")
    if route_result is None:
        raise HTTPException(status_code=404, detail="No route has been computed")
    return success(route_result)


@app.post("/internal/incident")
async def create_incident(incident: IncidentRequest) -> dict[str, Any]:
    database = _database_module()
    database.log_incident(incident.edge_id, incident.incident_type, incident.severity)
    database.set_edge_blocked(incident.edge_id, True)
    update_graph_edge(incident.edge_id, 999999)
    data = {"edge_id": incident.edge_id, "type": incident.incident_type, "severity": incident.severity}
    await broadcast("incident_detected", data)
    return success(data)

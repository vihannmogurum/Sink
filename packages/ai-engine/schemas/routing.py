"""Schemas for routing and emergency preemption."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RouteAlgorithm(str, Enum):
    ASTAR = "astar"
    DIJKSTRA = "dijkstra"


class Coordinate(BaseModel):
    latitude: float
    longitude: float


class PathDetail(BaseModel):
    route_id: str
    nodes: list[str]
    edge_ids: list[str]
    total_travel_time_minutes: float
    total_distance_km: float
    average_speed_kmh: float
    congestion_score: float  # 0 to 1
    has_incidents: bool
    incident_edge_ids: list[str]
    rank: int = 1
    description: str


class RouteOptimizeRequest(BaseModel):
    origin: str
    destination: str
    algorithm: RouteAlgorithm = RouteAlgorithm.ASTAR
    alternatives: int = Field(default=2, ge=0, le=5)
    avoid_incident_edges: bool = True


class RouteOptimizeResponse(BaseModel):
    origin: str
    destination: str
    algorithm: str
    primary_route: PathDetail
    alternative_routes: list[PathDetail]


class GreenWaveAction(BaseModel):
    intersection_id: str
    phase_action: str  # e.g., "force_green_north_south"
    duration_seconds: int
    estimated_arrival_seconds: float
    lane_cleared: str


class EmergencyPreemptionRequest(BaseModel):
    origin: str
    destination: str
    vehicle_id: str = "EMERGENCY_01"
    vehicle_type: str = "ambulance"  # ambulance, fire_truck, police


class EmergencyPreemptionResponse(BaseModel):
    vehicle_id: str
    vehicle_type: str
    origin: str
    destination: str
    corridor_nodes: list[str]
    corridor_edges: list[str]
    normal_travel_time_minutes: float
    preempted_travel_time_minutes: float
    time_saved_minutes: float
    travel_time_saved_pct: float
    green_wave_actions: list[GreenWaveAction]
    priority_level: str = "CRITICAL_CODE_3"


class NodeInfo(BaseModel):
    id: str
    label: str
    latitude: float
    longitude: float


class EdgeInfo(BaseModel):
    edge_id: str
    from_node: str
    to_node: str
    length_km: float
    free_flow_speed_kmh: float
    current_speed_kmh: float
    effective_weight: float
    congestion_level: str
    is_blocked: bool
    active_incident_id: Optional[str] = None


class NetworkGraphResponse(BaseModel):
    nodes: list[NodeInfo]
    edges: list[EdgeInfo]
    total_nodes: int
    total_edges: int

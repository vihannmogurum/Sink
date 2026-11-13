"""Shared data contracts and type definitions for UrbanFlow AI.

All keys and field names are strictly snake_case.
These TypedDict definitions match the schemas specified in AGENT_SYNC.md.
"""

from typing import Any, List, TypedDict


class Node(TypedDict):
    """Represents a network intersection or junction in the road topology."""
    node_id: str
    name: str
    lat: float
    lng: float
    node_type: str
    connected_edges: List[str]


class Edge(TypedDict):
    """Represents a road segment between two nodes in the network."""
    edge_id: str
    from_node: str
    to_node: str
    length: float
    speed_limit: float
    current_speed: float
    congestion_level: float
    is_blocked: bool
    forecast_15min: float


class Incident(TypedDict):
    """Represents a traffic disruption incident detected on an edge."""
    incident_id: str
    edge_id: str
    type: str
    severity: str
    description: str
    timestamp: str
    is_resolved: bool
    affected_vehicles: List[str]


class WSEvent(TypedDict):
    """Standardized WebSocket and Event Bus message envelope."""
    event: str
    timestamp: str
    payload: dict[str, Any]


class RouteResult(TypedDict):
    """Result computed for a vehicle's route navigation or reroute."""
    vehicle_id: str
    route: List[str]
    total_distance: float
    estimated_duration: float
    priority: str
    reason: str
    status: str

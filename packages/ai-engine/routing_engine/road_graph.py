"""NetworkX-backed dynamic road network graph with real-time incident penalties."""

import math
import networkx as nx
from schemas.routing import Coordinate, EdgeInfo, NetworkGraphResponse, NodeInfo


# Default City Grid Topography (Coordinates in Downtown Metro Grid)
DEFAULT_NODES = {
    "A": {"label": "West Junction", "lat": 37.7749, "lon": -122.4194},
    "B": {"label": "Central Station", "lat": 37.7785, "lon": -122.4130},
    "C": {"label": "Market Square", "lat": 37.7710, "lon": -122.4150},
    "D": {"label": "East Hub", "lat": 37.7760, "lon": -122.4070},
    "E": {"label": "Hospital Zone", "lat": 37.7800, "lon": -122.4010},
    "F": {"label": "South Pier", "lat": 37.7680, "lon": -122.4100},
}

DEFAULT_EDGES = [
    {"edge_id": "EDGE_A_B", "u": "A", "v": "B", "length_km": 2.2, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_B_A", "u": "B", "v": "A", "length_km": 2.2, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_A_C", "u": "A", "v": "C", "length_km": 1.8, "free_flow_speed": 45.0},
    {"edge_id": "EDGE_C_A", "u": "C", "v": "A", "length_km": 1.8, "free_flow_speed": 45.0},
    {"edge_id": "EDGE_B_C", "u": "B", "v": "C", "length_km": 1.5, "free_flow_speed": 40.0},
    {"edge_id": "EDGE_C_B", "u": "C", "v": "B", "length_km": 1.5, "free_flow_speed": 40.0},
    {"edge_id": "EDGE_B_D", "u": "B", "v": "D", "length_km": 2.5, "free_flow_speed": 55.0},
    {"edge_id": "EDGE_D_B", "u": "D", "v": "B", "length_km": 2.5, "free_flow_speed": 55.0},
    {"edge_id": "EDGE_C_D", "u": "C", "v": "D", "length_km": 2.0, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_D_C", "u": "D", "v": "C", "length_km": 2.0, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_D_E", "u": "D", "v": "E", "length_km": 1.9, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_E_D", "u": "E", "v": "D", "length_km": 1.9, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_C_F", "u": "C", "v": "F", "length_km": 2.4, "free_flow_speed": 45.0},
    {"edge_id": "EDGE_F_C", "u": "F", "v": "C", "length_km": 2.4, "free_flow_speed": 45.0},
    {"edge_id": "EDGE_F_D", "u": "F", "v": "D", "length_km": 2.8, "free_flow_speed": 50.0},
    {"edge_id": "EDGE_D_F", "u": "D", "v": "F", "length_km": 2.8, "free_flow_speed": 50.0},
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class UrbanRoadGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.edge_lookup: dict[str, tuple[str, str]] = {}
        self._initialize_network()

    def _initialize_network(self):
        for node_id, data in DEFAULT_NODES.items():
            self.graph.add_node(
                node_id,
                label=data["label"],
                lat=data["lat"],
                lon=data["lon"],
            )

        for edge in DEFAULT_EDGES:
            u, v = edge["u"], edge["v"]
            length_km = edge["length_km"]
            free_flow = edge["free_flow_speed"]
            # base travel time in minutes: (km / (km/h)) * 60
            base_time_mins = (length_km / free_flow) * 60.0

            self.graph.add_edge(
                u,
                v,
                edge_id=edge["edge_id"],
                length_km=length_km,
                free_flow_speed=free_flow,
                current_speed=free_flow,
                weight=base_time_mins,
                is_blocked=False,
                active_incident_id=None,
                incident_penalty=0.0,
            )
            self.edge_lookup[edge["edge_id"]] = (u, v)

    def update_edge_speed(self, edge_id: str, current_speed_kmh: float):
        if edge_id in self.edge_lookup:
            u, v = self.edge_lookup[edge_id]
            data = self.graph[u][v]
            data["current_speed"] = max(5.0, current_speed_kmh)
            self._recalculate_weight(u, v)

    def set_edge_incident(self, edge_id: str, incident_id: str, penalty_multiplier: float = 3.0, blocked: bool = False):
        if edge_id in self.edge_lookup:
            u, v = self.edge_lookup[edge_id]
            data = self.graph[u][v]
            data["active_incident_id"] = incident_id
            data["is_blocked"] = blocked
            data["incident_penalty"] = 999999.0 if blocked else penalty_multiplier
            self._recalculate_weight(u, v)

    def clear_edge_incident(self, edge_id: str):
        if edge_id in self.edge_lookup:
            u, v = self.edge_lookup[edge_id]
            data = self.graph[u][v]
            data["active_incident_id"] = None
            data["is_blocked"] = False
            data["incident_penalty"] = 0.0
            self._recalculate_weight(u, v)

    def _recalculate_weight(self, u: str, v: str):
        data = self.graph[u][v]
        if data.get("is_blocked"):
            data["weight"] = 999999.0
            return

        speed = max(5.0, data.get("current_speed", data["free_flow_speed"]))
        base_time = (data["length_km"] / speed) * 60.0
        penalty = data.get("incident_penalty", 0.0)
        data["weight"] = base_time * (1.0 + penalty)

    def get_node_coords(self, node_id: str) -> tuple[float, float]:
        node = self.graph.nodes[node_id]
        return (node["lat"], node["lon"])

    def to_network_summary(self) -> NetworkGraphResponse:
        nodes_list = []
        for n, d in self.graph.nodes(data=True):
            nodes_list.append(
                NodeInfo(
                    id=n,
                    label=d.get("label", n),
                    latitude=d.get("lat", 0.0),
                    longitude=d.get("lon", 0.0),
                )
            )

        edges_list = []
        for u, v, d in self.graph.edges(data=True):
            ratio = d["current_speed"] / max(1.0, d["free_flow_speed"])
            cong = "severe" if ratio < 0.35 else "heavy" if ratio < 0.60 else "moderate" if ratio < 0.85 else "low"
            edges_list.append(
                EdgeInfo(
                    edge_id=d["edge_id"],
                    from_node=u,
                    to_node=v,
                    length_km=d["length_km"],
                    free_flow_speed_kmh=d["free_flow_speed"],
                    current_speed_kmh=d["current_speed"],
                    effective_weight=round(d["weight"], 2),
                    congestion_level=cong,
                    is_blocked=d["is_blocked"],
                    active_incident_id=d.get("active_incident_id"),
                )
            )

        return NetworkGraphResponse(
            nodes=nodes_list,
            edges=edges_list,
            total_nodes=len(nodes_list),
            total_edges=len(edges_list),
        )

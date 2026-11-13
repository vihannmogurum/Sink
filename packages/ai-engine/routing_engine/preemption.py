"""Emergency Vehicle Preemption (EVP) engine & Green-Wave corridor actions."""

import networkx as nx
from schemas.routing import (
    EmergencyPreemptionRequest,
    EmergencyPreemptionResponse,
    GreenWaveAction,
)
from .road_graph import UrbanRoadGraph, haversine_km


class EmergencyPreemptionEngine:
    def __init__(self, road_graph: UrbanRoadGraph, preemption_multiplier: float = 0.15):
        self.road_graph = road_graph
        self.preemption_multiplier = preemption_multiplier

    def _heuristic(self, u: str, v: str) -> float:
        lat1, lon1 = self.road_graph.get_node_coords(u)
        lat2, lon2 = self.road_graph.get_node_coords(v)
        dist_km = haversine_km(lat1, lon1, lat2, lon2)
        return (dist_km / 80.0) * 60.0  # Emergency high speed heuristic

    def calculate_emergency_corridor(self, request: EmergencyPreemptionRequest) -> EmergencyPreemptionResponse:
        origin = request.origin.upper()
        destination = request.destination.upper()
        g = self.road_graph.graph

        if origin not in g.nodes or destination not in g.nodes:
            raise ValueError(f"Origin '{origin}' or destination '{destination}' not in graph")

        corridor_nodes = nx.astar_path(
            g,
            origin,
            destination,
            heuristic=self._heuristic,
            weight="weight",
        )

        normal_travel_time = 0.0
        preempted_travel_time = 0.0
        corridor_edges: list[str] = []
        green_wave_actions: list[GreenWaveAction] = []
        cumulative_seconds = 0.0

        for i in range(len(corridor_nodes) - 1):
            u = corridor_nodes[i]
            v = corridor_nodes[i + 1]
            data = g[u][v]
            edge_id = data["edge_id"]
            corridor_edges.append(edge_id)

            edge_normal_time_mins = data["weight"]
            # Preempted time: speed elevated to 80 km/h, zero wait at traffic lights
            edge_preempted_time_mins = max(0.1, (data["length_km"] / 85.0) * 60.0 * 0.70)

            normal_travel_time += edge_normal_time_mins
            preempted_travel_time += edge_preempted_time_mins

            # Green wave action for intersection v
            arrival_sec = cumulative_seconds + (edge_preempted_time_mins * 60.0)
            cumulative_seconds = arrival_sec

            action = GreenWaveAction(
                intersection_id=f"INT_{v}",
                phase_action=f"force_green_corridor_{u}_to_{v}",
                duration_seconds=45,
                estimated_arrival_seconds=round(arrival_sec, 1),
                lane_cleared=f"Left & Center Transit Lanes on {edge_id}",
            )
            green_wave_actions.append(action)

        time_saved = max(0.0, normal_travel_time - preempted_travel_time)
        saved_pct = round((time_saved / max(0.1, normal_travel_time)) * 100.0, 1)

        return EmergencyPreemptionResponse(
            vehicle_id=request.vehicle_id,
            vehicle_type=request.vehicle_type,
            origin=origin,
            destination=destination,
            corridor_nodes=corridor_nodes,
            corridor_edges=corridor_edges,
            normal_travel_time_minutes=round(normal_travel_time, 2),
            preempted_travel_time_minutes=round(preempted_travel_time, 2),
            time_saved_minutes=round(time_saved, 2),
            travel_time_saved_pct=saved_pct,
            green_wave_actions=green_wave_actions,
            priority_level="CRITICAL_CODE_3",
        )

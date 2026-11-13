"""Dijkstra & A* adaptive routing optimizer with ranked alternative routes."""

import networkx as nx
from schemas.routing import (
    PathDetail,
    RouteAlgorithm,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
)
from .road_graph import UrbanRoadGraph, haversine_km


class RouteOptimizer:
    def __init__(self, road_graph: UrbanRoadGraph):
        self.road_graph = road_graph

    def _heuristic(self, u: str, v: str) -> float:
        """
        Admissible A* heuristic: Euclidean/Haversine distance divided by max speed (60 km/h) in minutes.
        """
        lat1, lon1 = self.road_graph.get_node_coords(u)
        lat2, lon2 = self.road_graph.get_node_coords(v)
        dist_km = haversine_km(lat1, lon1, lat2, lon2)
        max_speed_kmh = 60.0
        # return travel time in minutes as lower-bound heuristic
        return (dist_km / max_speed_kmh) * 60.0

    def _build_path_detail(self, node_list: list[str], rank: int = 1, desc_prefix: str = "Optimal") -> PathDetail:
        g = self.road_graph.graph
        edge_ids: list[str] = []
        total_time = 0.0
        total_dist = 0.0
        incident_edges: list[str] = []

        for i in range(len(node_list) - 1):
            u = node_list[i]
            v = node_list[i + 1]
            data = g[u][v]
            edge_ids.append(data["edge_id"])
            total_time += data["weight"]
            total_dist += data["length_km"]
            if data.get("active_incident_id"):
                incident_edges.append(data["edge_id"])

        avg_speed = (total_dist / (total_time / 60.0)) if total_time > 0 else 0.0
        congestion_score = round(max(0.0, min(1.0, 1.0 - (avg_speed / 55.0))), 2)

        return PathDetail(
            route_id=f"RT-{node_list[0]}-{node_list[-1]}-RANK{rank}",
            nodes=node_list,
            edge_ids=edge_ids,
            total_travel_time_minutes=round(total_time, 2),
            total_distance_km=round(total_dist, 2),
            average_speed_kmh=round(avg_speed, 1),
            congestion_score=congestion_score,
            has_incidents=len(incident_edges) > 0,
            incident_edge_ids=incident_edges,
            rank=rank,
            description=f"{desc_prefix} path via {' -> '.join(node_list)} ({round(total_time, 1)} min)",
        )

    def optimize_route(self, request: RouteOptimizeRequest) -> RouteOptimizeResponse:
        origin = request.origin.upper()
        destination = request.destination.upper()
        g = self.road_graph.graph

        if origin not in g.nodes or destination not in g.nodes:
            raise ValueError(f"Origin '{origin}' or destination '{destination}' not in graph")

        # 1. Primary Route Computation
        if request.algorithm == RouteAlgorithm.ASTAR:
            primary_nodes = nx.astar_path(
                g,
                origin,
                destination,
                heuristic=self._heuristic,
                weight="weight",
            )
        else:
            primary_nodes = nx.dijkstra_path(
                g,
                origin,
                destination,
                weight="weight",
            )

        primary_path = self._build_path_detail(primary_nodes, rank=1, desc_prefix=f"Primary ({request.algorithm.value.upper()})")

        # 2. Ranked Alternative Routes (K-shortest loopless paths)
        alternatives: list[PathDetail] = []
        if request.alternatives > 0:
            try:
                # Generate diverse simple paths
                all_paths_generator = nx.shortest_simple_paths(g, origin, destination, weight="weight")
                rank_counter = 2
                for path in all_paths_generator:
                    if path == primary_nodes:
                        continue
                    alt_detail = self._build_path_detail(path, rank=rank_counter, desc_prefix=f"Alternative #{rank_counter - 1}")
                    alternatives.append(alt_detail)
                    rank_counter += 1
                    if len(alternatives) >= request.alternatives:
                        break
            except (nx.NetworkXNoPath, nx.NetworkXError):
                pass

        return RouteOptimizeResponse(
            origin=origin,
            destination=destination,
            algorithm=request.algorithm.value,
            primary_route=primary_path,
            alternative_routes=alternatives,
        )

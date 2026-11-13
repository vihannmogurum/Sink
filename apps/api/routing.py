"""In-memory graph routing and temporary emergency preemption."""

import heapq
import importlib
import sys
from dataclasses import dataclass
from pathlib import Path
from threading import Lock, Thread
from time import sleep
from typing import Any

project_root = Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))


@dataclass
class GraphEdge:
    edge_id: str
    from_node: str
    to_node: str
    effective_weight: float


graph: dict[str, list[tuple[str, str]]] = {}
edges_by_id: dict[str, GraphEdge] = {}
graph_lock = Lock()


def _database_module() -> Any:
    return importlib.import_module("packages.database.db")


def _value(record: Any, *keys: str, default: Any = None) -> Any:
    for key in keys:
        if isinstance(record, dict) and key in record:
            return record[key]
        if hasattr(record, key):
            return getattr(record, key)
        try:
            return record[key]
        except (KeyError, IndexError, TypeError):
            continue
    return default


def _rebuild_adjacency() -> None:
    graph.clear()
    for edge in edges_by_id.values():
        graph.setdefault(edge.from_node, []).append((edge.to_node, edge.edge_id))
        graph.setdefault(edge.to_node, [])


def load_graph() -> None:
    database = _database_module()
    nodes = database.get_all_nodes()
    edges = database.get_all_edges()
    with graph_lock:
        graph.clear()
        edges_by_id.clear()
        for node in nodes:
            node_id = str(_value(node, "node_id", "id"))
            if node_id != "None":
                graph[node_id] = []
        for edge in edges:
            edge_id = str(_value(edge, "edge_id", "id"))
            from_node = str(_value(edge, "from_node", "source_node", "from"))
            to_node = str(_value(edge, "to_node", "target_node", "to"))
            weight = float(_value(edge, "effective_weight", "weight", "travel_time", default=1.0))
            if "None" not in {edge_id, from_node, to_node}:
                edges_by_id[edge_id] = GraphEdge(edge_id, from_node, to_node, weight)
        _rebuild_adjacency()


def find_shortest_path(current_graph: dict[str, list[tuple[str, str]]], from_node: str, to_node: str) -> dict:
    if from_node not in current_graph or to_node not in current_graph:
        return {"route": [], "total_weight": 0.0}
    queue: list[tuple[float, str, list[str]]] = [(0.0, from_node, [from_node])]
    distances = {from_node: 0.0}
    while queue:
        total_weight, node_id, route = heapq.heappop(queue)
        if node_id == to_node:
            return {"route": route, "total_weight": float(total_weight)}
        if total_weight > distances.get(node_id, float("inf")):
            continue
        for neighbor_id, edge_id in current_graph.get(node_id, []):
            candidate_weight = total_weight + edges_by_id[edge_id].effective_weight
            if candidate_weight < distances.get(neighbor_id, float("inf")):
                distances[neighbor_id] = candidate_weight
                heapq.heappush(queue, (candidate_weight, neighbor_id, route + [neighbor_id]))
    return {"route": [], "total_weight": 0.0}


def update_graph_edge(edge_id: str, effective_weight: float) -> None:
    with graph_lock:
        if edge_id not in edges_by_id:
            raise KeyError(f"Unknown edge_id: {edge_id}")
        edges_by_id[edge_id].effective_weight = float(effective_weight)


def _restore_weights(saved_weights: dict[str, float]) -> None:
    sleep(60)
    with graph_lock:
        for edge_id, effective_weight in saved_weights.items():
            if edge_id in edges_by_id:
                edges_by_id[edge_id].effective_weight = effective_weight


def emergency_preemption(from_node: str, to_node: str) -> dict:
    with graph_lock:
        route = find_shortest_path(graph, from_node, to_node)
        saved_weights = {edge_id: edge.effective_weight for edge_id, edge in edges_by_id.items()}
        for edge in edges_by_id.values():
            edge.effective_weight = 0.0
    Thread(target=_restore_weights, args=(saved_weights,), daemon=True).start()
    return route

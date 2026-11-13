import {
  GraphTopology,
  IncidentInjectionPayload,
  EmergencyDispatchPayload,
  graph_topology_schema,
  incident_injection_payload_schema,
  emergency_dispatch_payload_schema,
} from '../schemas/contracts';
import { getMockGraphTopology } from './mockEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/**
 * Fetch Graph Topology (Nodes & Edges)
 * Fails over to synthetic mock engine if AGENT_2 backend is offline.
 */
export async function fetchGraph(): Promise<GraphTopology> {
  try {
    const res = await fetch(`${API_BASE_URL}/graph`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // Fail fast if offline
    });

    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}`);
    }

    const payload: ApiResponse<unknown> = await res.json();
    if (payload.success && payload.data) {
      return graph_topology_schema.parse(payload.data);
    }
    throw new Error(payload.error?.message || 'Invalid API envelope payload');
  } catch (err) {
    console.warn('[API Service] AGENT_2 API unreachable. Falling back to Mock Engine:', err);
    return getMockGraphTopology();
  }
}

/**
 * Inject Incident on an edge
 * Fails over cleanly if AGENT_2 backend is offline.
 */
export async function injectIncident(
  payload: IncidentInjectionPayload
): Promise<{ incident_id: string; status: string }> {
  incident_injection_payload_schema.parse(payload);

  try {
    const res = await fetch(`${API_BASE_URL}/incident/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error(json.error?.message || 'Incident injection failed');
  } catch (err) {
    console.warn('[API Service] Failover: Mocking incident injection acknowledgment:', err);
    return {
      incident_id: `inc_mock_${Date.now()}`,
      status: 'acknowledged_mock',
    };
  }
}

export interface EmergencyDispatchResult {
  dispatch_id: string;
  clear_corridor_active: boolean;
  path_edge_ids: string[];
}

/**
 * Calculates a dynamic path between two nodes in the graph topology
 */
function calculatePathEdges(originId: string, destId: string, graph: GraphTopology): string[] {
  // Direct edge check
  const directEdge = graph.edges.find(
    (e) =>
      (e.source_node_id === originId && e.target_node_id === destId) ||
      (e.source_node_id === destId && e.target_node_id === originId)
  );
  if (directEdge) return [directEdge.edge_id];

  // Breadth-first search / path traversal
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: originId, path: [] }];
  const visited = new Set<string>([originId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.nodeId === destId) {
      return current.path;
    }

    for (const edge of graph.edges) {
      let nextNodeId: string | null = null;
      if (edge.source_node_id === current.nodeId) {
        nextNodeId = edge.target_node_id;
      } else if (edge.target_node_id === current.nodeId) {
        nextNodeId = edge.source_node_id;
      }

      if (nextNodeId && !visited.has(nextNodeId)) {
        visited.add(nextNodeId);
        queue.push({
          nodeId: nextNodeId,
          path: [...current.path, edge.edge_id],
        });
      }
    }
  }

  // Fallback: Return first connecting edge if disconnected
  return graph.edges.length > 0 ? [graph.edges[0].edge_id] : [];
}

/**
 * Dispatch Emergency Preemption
 * Computes dynamic corridor path and fails over cleanly if AGENT_2 backend is offline.
 */
export async function dispatchEmergency(
  payload: EmergencyDispatchPayload,
  graphTopology?: GraphTopology | null
): Promise<EmergencyDispatchResult> {
  emergency_dispatch_payload_schema.parse(payload);

  const topology = graphTopology || getMockGraphTopology();
  const calculatedEdges = calculatePathEdges(payload.origin_node_id, payload.destination_node_id, topology);

  try {
    const res = await fetch(`${API_BASE_URL}/emergency/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return {
        dispatch_id: json.data.dispatch_id || `emg_${Date.now()}`,
        clear_corridor_active: true,
        path_edge_ids: json.data.path_edge_ids || calculatedEdges,
      };
    }
    throw new Error(json.error?.message || 'Emergency dispatch failed');
  } catch (err) {
    console.warn('[API Service] Failover: Calculating synthetic emergency preemption corridor:', err);
    return {
      dispatch_id: `emg_mock_${Date.now()}`,
      clear_corridor_active: true,
      path_edge_ids: calculatedEdges,
    };
  }
}

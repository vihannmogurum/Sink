import {
  GraphTopology,
  IncidentInjectionPayload,
  EmergencyDispatchPayload,
  graph_topology_schema,
  incident_injection_payload_schema,
  emergency_dispatch_payload_schema,
} from '../schemas/contracts';
import { getMockGraphTopology } from './mockEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

/**
 * Fetch Graph Topology (Nodes & Edges)
 * Checks AGENT_2 FastAPI /graph (and fallback /api/v1/graph), fails over to synthetic mock engine if offline.
 */
export async function fetchGraph(): Promise<GraphTopology> {
  try {
    const res = await fetch(`${API_BASE_URL}/graph`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}`);
    }

    const payload: ApiResponse<any> = await res.json();
    if (payload.success && payload.data) {
      // If backend returns { nodes, edges }, adapt to GraphTopology schema
      const rawData = payload.data;
      if (Array.isArray(rawData.nodes) && Array.isArray(rawData.edges)) {
        return {
          grid_id: rawData.grid_id || 'grid_hyd_metro_01',
          city: rawData.city || 'Hyderabad Metropolitan Grid',
          timestamp: rawData.timestamp || new Date().toISOString(),
          nodes: rawData.nodes,
          edges: rawData.edges,
        };
      }
      return graph_topology_schema.parse(rawData);
    }
    throw new Error(payload.error?.message || 'Invalid API envelope payload');
  } catch (err) {
    console.warn('[API Service] AGENT_2 API unreachable. Falling back to Mock Engine:', err);
    return getMockGraphTopology();
  }
}

/**
 * Inject Incident on an edge
 * Communicates with AGENT_2 FastAPI /internal/incident, falls over cleanly if offline.
 */
export async function injectIncident(
  payload: IncidentInjectionPayload
): Promise<{ incident_id: string; status: string }> {
  incident_injection_payload_schema.parse(payload);

  try {
    // Try AGENT_2 FastAPI route: POST /internal/incident
    const res = await fetch(`${API_BASE_URL}/internal/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edge_id: payload.edge_id,
        type: payload.type,
        severity: payload.severity,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          incident_id: json.data.edge_id || `inc_${Date.now()}`,
          status: 'incident_detected_live',
        };
      }
    }
  } catch (err) {
    console.warn('[API Service] AGENT_2 backend /internal/incident unavailable, falling back:', err);
  }

  return {
    incident_id: `inc_mock_${Date.now()}`,
    status: 'acknowledged_mock',
  };
}

export interface EmergencyDispatchResult {
  dispatch_id: string;
  clear_corridor_active: boolean;
  path_edge_ids: string[];
}

/**
 * Helper to compute Dijkstra/BFS fallback path between two nodes
 */
function calculatePathEdges(originId: string, destId: string, graph: GraphTopology): string[] {
  const directEdge = graph.edges.find(
    (e) =>
      (e.source_node_id === originId && e.target_node_id === destId) ||
      (e.source_node_id === destId && e.target_node_id === originId)
  );
  if (directEdge) return [directEdge.edge_id];

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

  return graph.edges.length > 0 ? [graph.edges[0].edge_id] : [];
}

/**
 * Dispatch Emergency Preemption
 * Communicates with AGENT_2's FastAPI POST /routes/compute (with priority="emergency")
 * and returns the calculated route or fails over cleanly.
 */
export async function dispatchEmergency(
  payload: EmergencyDispatchPayload,
  graphTopology?: GraphTopology | null
): Promise<EmergencyDispatchResult> {
  emergency_dispatch_payload_schema.parse(payload);

  const topology = graphTopology || getMockGraphTopology();
  const fallbackEdges = calculatePathEdges(payload.origin_node_id, payload.destination_node_id, topology);

  try {
    // AGENT_2 FastAPI route: POST /routes/compute
    const res = await fetch(`${API_BASE_URL}/routes/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: payload.origin_node_id,
        to: payload.destination_node_id,
        priority: 'emergency',
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const routeNodes: string[] = json.data.route || [];
        // Map sequence of route nodes to edge IDs
        const pathEdges: string[] = [];
        for (let i = 0; i < routeNodes.length - 1; i++) {
          const u = routeNodes[i];
          const v = routeNodes[i + 1];
          const found = topology.edges.find(
            (e) => (e.source_node_id === u && e.target_node_id === v) ||
                   (e.source_node_id === v && e.target_node_id === u)
          );
          if (found) pathEdges.push(found.edge_id);
        }

        return {
          dispatch_id: `emg_live_${Date.now()}`,
          clear_corridor_active: true,
          path_edge_ids: pathEdges.length > 0 ? pathEdges : fallbackEdges,
        };
      }
    }
  } catch (err) {
    console.warn('[API Service] AGENT_2 live /routes/compute offline. Using internal routing engine:', err);
  }

  return {
    dispatch_id: `emg_mock_${Date.now()}`,
    clear_corridor_active: true,
    path_edge_ids: fallbackEdges,
  };
}

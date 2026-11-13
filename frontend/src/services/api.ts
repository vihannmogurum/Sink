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

export interface SystemKpis {
  active_signals_synced: number;
  avg_eta_savings_pct: number;
  detection_latency_ms: number;
  intersection_throughput_gain_pct: number;
  active_incidents_count: number;
  hourly_incident_distribution: number[];
  timestamp: number;
}

export interface CameraNode {
  camera_id: string;
  name: string;
  edge_id: string;
  road_name?: string;
  lat: number;
  lng: number;
  lane_count?: number;
  heading?: number;
  stream_url: string;
  status: string;
  last_vehicle_count: number;
  last_speed_kmh: number;
  active_hazard?: string | null;
  last_ping: number;
}

export interface AuditLogItem {
  decision_id: string;
  timestamp: number;
  trigger_event: string;
  cooperating_agents: string;
  edge_id: string;
  action_taken: string;
  eta_saved_sec: number;
  baseline_eta_sec: number;
  optimized_eta_sec: number;
  confidence: number;
  xai_reasoning: string;
  factors: Record<string, number>;
}

export interface AnalyticsHistoryResponse {
  kpis: SystemKpis;
  hourly_distribution: { hour: string; incidents: number }[];
  eta_savings_series: {
    timestamp: number;
    baseline_eta: number;
    optimized_eta: number;
    eta_saved: number;
    confidence: number;
  }[];
  total_dispatches: number;
}

/**
 * Fetch Graph Topology (Nodes & Edges) from FastAPI
 */
export async function fetchGraph(): Promise<GraphTopology> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/graph/topology`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const payload: ApiResponse<any> = await res.json();
      if (payload.success && payload.data) {
        const rawData = payload.data;
        if (Array.isArray(rawData.nodes) && Array.isArray(rawData.edges)) {
          return {
            grid_id: 'grid_hyd_metro_01',
            city: 'Hyderabad Metropolitan Grid',
            timestamp: new Date().toISOString(),
            nodes: rawData.nodes.map((n: any) => ({
              node_id: n.node_id,
              name: n.name,
              coordinates: n.coordinates,
              intersection_type: n.intersection_type || 'signalized',
              status: n.status || 'online',
              zone: n.zone || 'Central Arterial',
            })),
            edges: rawData.edges.map((e: any) => ({
              edge_id: e.edge_id,
              source_node_id: e.source || e.source_node_id,
              target_node_id: e.target || e.target_node_id,
              length_meters: e.length_meters || 2000,
              speed_limit_kph: e.speed_limit_kph || 50,
              lanes: e.lanes || 4,
              road_class: 'arterial',
              base_capacity: 2200,
            })),
          };
        }
      }
    }
  } catch (err) {
    console.warn('[API Service] Backend /api/v1/graph/topology unreachable, trying /graph fallback:', err);
  }

  // Fallback to legacy /graph
  try {
    const res = await fetch(`${API_BASE_URL}/graph`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.success && payload.data) {
        return graph_topology_schema.parse(payload.data);
      }
    }
  } catch {
    // fallback
  }

  return getMockGraphTopology();
}

/**
 * Fetch Live Real-Time KPIs from StateStore
 */
export async function fetchLiveKpis(): Promise<SystemKpis> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/kpis`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json: ApiResponse<SystemKpis> = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Service] Failed to fetch /api/v1/kpis:', err);
  }

  return {
    active_signals_synced: 7,
    avg_eta_savings_pct: 36.8,
    detection_latency_ms: 38.5,
    intersection_throughput_gain_pct: 22.4,
    active_incidents_count: 0,
    hourly_incident_distribution: [0, 0, 0, 0, 0, 0, 1, 3, 5, 4, 2, 1, 2, 3, 4, 6, 8, 5, 3, 2, 1, 0, 0, 0],
    timestamp: Date.now() / 1000,
  };
}

/**
 * Fetch Camera Nodes from StateStore
 */
export async function fetchCameraNodes(edgeIds?: string[]): Promise<CameraNode[]> {
  try {
    const query = edgeIds && edgeIds.length > 0 ? `?edge_ids=${encodeURIComponent(edgeIds.join(','))}` : '';
    const res = await fetch(`${API_BASE_URL}/api/v1/cameras${query}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json: ApiResponse<CameraNode[]> = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Service] Failed to fetch /api/v1/cameras:', err);
  }

  return [];
}

/**
 * Fetch Audit Logs from StateStore
 */
export async function fetchAuditLogs(limit: number = 100): Promise<AuditLogItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/audit/logs?limit=${limit}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json: ApiResponse<AuditLogItem[]> = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Service] Failed to fetch /api/v1/audit/logs:', err);
  }

  return [];
}

/**
 * Fetch Analytics History from Backend
 */
export async function fetchAnalyticsHistory(): Promise<AnalyticsHistoryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/analytics/history`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json: ApiResponse<AnalyticsHistoryResponse> = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API Service] Failed to fetch /api/v1/analytics/history:', err);
  }
  return null;
}

/**
 * Inject Incident on an edge
 */
export async function injectIncident(
  payload: IncidentInjectionPayload
): Promise<{ incident_id: string; status: string }> {
  incident_injection_payload_schema.parse(payload);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/incidents/inject`, {
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
          incident_id: json.data.incident?.incident_id || json.data.edge_id || `inc_${Date.now()}`,
          status: 'incident_detected_live',
        };
      }
    }
  } catch (err) {
    console.warn('[API Service] POST /api/v1/incidents/inject failed, trying fallback:', err);
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
  eta_saved_sec?: number;
  savings_pct?: number;
  reason?: string;
  factors?: Record<string, number>;
}

/**
 * Dispatch Emergency Preemption
 */
export async function dispatchEmergency(
  payload: EmergencyDispatchPayload,
  _graphTopology?: GraphTopology | null
): Promise<EmergencyDispatchResult> {
  emergency_dispatch_payload_schema.parse(payload);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/emergency/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: payload.origin_node_id,
        destination: payload.destination_node_id,
        priority: 'emergency',
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          dispatch_id: json.data.decision_id || `emg_live_${Date.now()}`,
          clear_corridor_active: true,
          path_edge_ids: json.data.corridor_edges || [],
          eta_saved_sec: json.data.eta_saved_sec,
          savings_pct: json.data.savings_pct,
          reason: json.data.xai_reasoning,
          factors: json.data.factors,
        };
      }
    }
  } catch (err) {
    console.warn('[API Service] POST /api/v1/emergency/dispatch offline, falling back:', err);
  }

  return {
    dispatch_id: `emg_mock_${Date.now()}`,
    clear_corridor_active: true,
    path_edge_ids: ['edge_punjagutta_banjara', 'edge_banjara_apollo_preemption'],
    eta_saved_sec: 142,
    savings_pct: 35.2,
    reason: 'Emergency preemption corridor established to Apollo Hospital Trauma Center.',
  };
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: string;
  jurisdiction?: string;
  keep_signed_in?: boolean;
}

export interface AuthSession {
  token: string;
  email: string;
  display_name: string;
  role: string;
  jurisdiction: string;
  verified_status: string;
  expires_in_hours: number;
}

export async function loginUser(payload: LoginPayload): Promise<{ success: boolean; data?: AuthSession; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      return { success: false, error: errJson.detail || 'Authentication failed' };
    }
    const json = await res.json();
    if (json.success && json.data) {
      localStorage.setItem('sink_auth_session', JSON.stringify(json.data));
      return { success: true, data: json.data };
    }
    return { success: false, error: 'Unexpected response format' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network connection failed' };
  }
}

export function getCurrentUser(): AuthSession | null {
  try {
    const raw = localStorage.getItem('sink_auth_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem('sink_auth_session');
}


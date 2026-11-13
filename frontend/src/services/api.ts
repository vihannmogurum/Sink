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

/**
 * Dispatch Emergency Preemption
 * Fails over cleanly if AGENT_2 backend is offline.
 */
export async function dispatchEmergency(
  payload: EmergencyDispatchPayload
): Promise<{ dispatch_id: string; clear_corridor_active: boolean }> {
  emergency_dispatch_payload_schema.parse(payload);

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
      return json.data;
    }
    throw new Error(json.error?.message || 'Emergency dispatch failed');
  } catch (err) {
    console.warn('[API Service] Failover: Mocking emergency preemption corridor:', err);
    return {
      dispatch_id: `emg_mock_${Date.now()}`,
      clear_corridor_active: true,
    };
  }
}

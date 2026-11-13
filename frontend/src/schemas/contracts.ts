import { z } from 'zod';

// -------------------------------------------------------------
// Envelope Validator
// -------------------------------------------------------------
export const api_envelope_schema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .nullable(),
  });

// -------------------------------------------------------------
// 1. Graph Topology: Nodes and Edges
// -------------------------------------------------------------
export const graph_node_schema = z.object({
  node_id: z.string(),
  name: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  intersection_type: z.enum(['signalized', 'roundabout', 'merge', 'freeway_ramp']),
  status: z.enum(['online', 'degraded', 'offline']),
  zone: z.string(),
});

export const graph_edge_schema = z.object({
  edge_id: z.string(),
  source_node_id: z.string(),
  target_node_id: z.string(),
  length_meters: z.number().positive(),
  speed_limit_kph: z.number().positive(),
  lanes: z.number().int().positive(),
  road_class: z.enum(['arterial', 'collector', 'highway', 'local']),
  base_capacity: z.number().positive(),
});

export const graph_topology_schema = z.object({
  grid_id: z.string(),
  city: z.string(),
  timestamp: z.string(),
  nodes: z.array(graph_node_schema),
  edges: z.array(graph_edge_schema),
});

export type GraphNode = z.infer<typeof graph_node_schema>;
export type GraphEdge = z.infer<typeof graph_edge_schema>;
export type GraphTopology = z.infer<typeof graph_topology_schema>;

// -------------------------------------------------------------
// 2. Telemetry Tick: Live Edge Speeds & CV Anomalies
// -------------------------------------------------------------
export const cv_anomaly_schema = z.object({
  anomaly_id: z.string(),
  edge_id: z.string(),
  type: z.enum(['sudden_braking', 'lane_obstruction', 'debris', 'stalled_vehicle', 'pedestrian_hazard']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence_score: z.number().min(0).max(1),
  detected_at: z.string(),
});

export const edge_telemetry_schema = z.object({
  edge_id: z.string(),
  current_speed_kph: z.number().nonnegative(),
  congestion_index: z.number().min(0).max(1), // 0: free flow, 1: standstill
  vehicle_count: z.number().int().nonnegative(),
  flow_rate_vph: z.number().nonnegative(),
  status: z.enum(['normal', 'congested', 'blocked', 'rerouted']),
});

export const telemetry_tick_schema = z.object({
  tick_id: z.string(),
  timestamp: z.string(),
  edge_telemetry: z.array(edge_telemetry_schema),
  cv_anomalies: z.array(cv_anomaly_schema),
});

export type CvAnomaly = z.infer<typeof cv_anomaly_schema>;
export type EdgeTelemetry = z.infer<typeof edge_telemetry_schema>;
export type TelemetryTick = z.infer<typeof telemetry_tick_schema>;

// -------------------------------------------------------------
// 3. Forecast Update: +15m and +30m Speeds & Congestion
// -------------------------------------------------------------
export const edge_forecast_horizon_schema = z.object({
  edge_id: z.string(),
  predicted_speed_kph: z.number().nonnegative(),
  predicted_congestion_index: z.number().min(0).max(1),
  confidence_interval: z.object({
    lower_kph: z.number().nonnegative(),
    upper_kph: z.number().nonnegative(),
  }),
});

export const forecast_update_schema = z.object({
  forecast_id: z.string(),
  generated_at: z.string(),
  model_version: z.string(),
  horizon_15m: z.array(edge_forecast_horizon_schema),
  horizon_30m: z.array(edge_forecast_horizon_schema),
});

export type EdgeForecastHorizon = z.infer<typeof edge_forecast_horizon_schema>;
export type ForecastUpdate = z.infer<typeof forecast_update_schema>;

// -------------------------------------------------------------
// 4. Agent Decision: Multi-Agent XAI Logs
// -------------------------------------------------------------
export const agent_decision_schema = z.object({
  decision_id: z.string(),
  agent_id: z.enum(['AGENT_1', 'AGENT_2', 'AGENT_3', 'AGENT_4', 'AGENT_5']),
  decision_type: z.enum(['signal_timing_adjust', 'dynamic_reroute', 'speed_limit_change', 'incident_mitigation', 'emergency_preemption']),
  target_entity_id: z.string(), // node_id or edge_id
  action_parameters: z.record(z.any()),
  explanation_xai: z.object({
    rationale: z.string(),
    primary_factors: z.array(z.string()),
    expected_delay_reduction_pct: z.number(),
    safety_confidence: z.number().min(0).max(1),
  }),
  status: z.enum(['proposed', 'active', 'reverted', 'completed']),
  created_at: z.string(),
});

export type AgentDecision = z.infer<typeof agent_decision_schema>;

// Incident & Emergency Action Payloads
export const incident_injection_payload_schema = z.object({
  edge_id: z.string(),
  type: z.enum(['crash', 'roadwork', 'stall', 'hazard']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  notes: z.string().optional(),
});

export const emergency_dispatch_payload_schema = z.object({
  origin_node_id: z.string(),
  destination_node_id: z.string(),
  priority_tier: z.enum(['priority_1_code_3', 'priority_2_urgent', 'priority_3_standard']),
  vehicle_type: z.enum(['ambulance', 'fire_truck', 'police', 'rescue']),
});

export type IncidentInjectionPayload = z.infer<typeof incident_injection_payload_schema>;
export type EmergencyDispatchPayload = z.infer<typeof emergency_dispatch_payload_schema>;

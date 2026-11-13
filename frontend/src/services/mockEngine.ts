import {
  GraphTopology,
  TelemetryTick,
  ForecastUpdate,
  AgentDecision,
  graph_topology_schema,
  telemetry_tick_schema,
  forecast_update_schema,
  agent_decision_schema,
} from '../schemas/contracts';

// -------------------------------------------------------------
// 5 Nodes, 6 Edges Topology (San Francisco Core Corridor)
// -------------------------------------------------------------
export const synthetic_nodes = [
  {
    node_id: 'node_embarcadero',
    name: 'Embarcadero & Market',
    coordinates: { lat: 37.7946, lng: -122.3948 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Downtown Core',
  },
  {
    node_id: 'node_montgomery',
    name: 'Montgomery Financial Transit',
    coordinates: { lat: 37.7894, lng: -122.4013 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Financial District',
  },
  {
    node_id: 'node_powell',
    name: 'Powell Cable Junction',
    coordinates: { lat: 37.7844, lng: -122.4079 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Union Square Corridor',
  },
  {
    node_id: 'node_civic_center',
    name: 'Civic Center Plaza Ramp',
    coordinates: { lat: 37.7793, lng: -122.4148 },
    intersection_type: 'roundabout' as const,
    status: 'online' as const,
    zone: 'Civic Sector',
  },
  {
    node_id: 'node_mission_16th',
    name: '16th & Mission Arterial Hub',
    coordinates: { lat: 37.7650, lng: -122.4197 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Mission Transit Hub',
  },
];

export const synthetic_edges = [
  {
    edge_id: 'edge_emb_mont',
    source_node_id: 'node_embarcadero',
    target_node_id: 'node_montgomery',
    length_meters: 650,
    speed_limit_kph: 45,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 1800,
  },
  {
    edge_id: 'edge_mont_pow',
    source_node_id: 'node_montgomery',
    target_node_id: 'node_powell',
    length_meters: 720,
    speed_limit_kph: 40,
    lanes: 3,
    road_class: 'arterial' as const,
    base_capacity: 1500,
  },
  {
    edge_id: 'edge_pow_civic',
    source_node_id: 'node_powell',
    target_node_id: 'node_civic_center',
    length_meters: 800,
    speed_limit_kph: 45,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 1900,
  },
  {
    edge_id: 'edge_civic_mission',
    source_node_id: 'node_civic_center',
    target_node_id: 'node_mission_16th',
    length_meters: 1650,
    speed_limit_kph: 60,
    lanes: 4,
    road_class: 'highway' as const,
    base_capacity: 2400,
  },
  {
    edge_id: 'edge_emb_pow_bypass',
    source_node_id: 'node_embarcadero',
    target_node_id: 'node_powell',
    length_meters: 1400,
    speed_limit_kph: 50,
    lanes: 2,
    road_class: 'collector' as const,
    base_capacity: 1200,
  },
  {
    edge_id: 'edge_mont_mission_express',
    source_node_id: 'node_montgomery',
    target_node_id: 'node_mission_16th',
    length_meters: 2500,
    speed_limit_kph: 65,
    lanes: 3,
    road_class: 'highway' as const,
    base_capacity: 2200,
  },
];

export const getMockGraphTopology = (): GraphTopology => {
  const data: GraphTopology = {
    grid_id: 'grid_sf_core_01',
    city: 'San Francisco',
    timestamp: new Date().toISOString(),
    nodes: synthetic_nodes,
    edges: synthetic_edges,
  };
  return graph_topology_schema.parse(data);
};

export const getMockTelemetryTick = (): TelemetryTick => {
  const edgeTelemetry = synthetic_edges.map((edge, index) => {
    // Dynamic slight variations
    const jitter = Math.sin(Date.now() / 3000 + index) * 0.15;
    const baseCongestion = index === 1 ? 0.65 : 0.22;
    const congestion = Math.min(Math.max(baseCongestion + jitter, 0.05), 0.95);
    const speed = Math.round(edge.speed_limit_kph * (1 - congestion * 0.7));

    return {
      edge_id: edge.edge_id,
      current_speed_kph: speed,
      congestion_index: parseFloat(congestion.toFixed(3)),
      vehicle_count: Math.round(edge.base_capacity * congestion * 0.1),
      flow_rate_vph: Math.round(edge.base_capacity * (1 - congestion * 0.4)),
      status: congestion > 0.75 ? ('congested' as const) : ('normal' as const),
    };
  });

  const data: TelemetryTick = {
    tick_id: `tick_${Date.now()}`,
    timestamp: new Date().toISOString(),
    edge_telemetry: edgeTelemetry,
    cv_anomalies: [
      {
        anomaly_id: 'anom_9012',
        edge_id: 'edge_mont_pow',
        type: 'sudden_braking',
        severity: 'medium',
        confidence_score: 0.89,
        detected_at: new Date(Date.now() - 45000).toISOString(),
      },
    ],
  };

  return telemetry_tick_schema.parse(data);
};

export const getMockForecastUpdate = (): ForecastUpdate => {
  const data: ForecastUpdate = {
    forecast_id: `fc_${Date.now()}`,
    generated_at: new Date().toISOString(),
    model_version: 'ai-engine-v1.4-transformer',
    horizon_15m: synthetic_edges.map((edge) => ({
      edge_id: edge.edge_id,
      predicted_speed_kph: Math.round(edge.speed_limit_kph * 0.8),
      predicted_congestion_index: 0.35,
      confidence_interval: {
        lower_kph: Math.round(edge.speed_limit_kph * 0.7),
        upper_kph: Math.round(edge.speed_limit_kph * 0.9),
      },
    })),
    horizon_30m: synthetic_edges.map((edge) => ({
      edge_id: edge.edge_id,
      predicted_speed_kph: Math.round(edge.speed_limit_kph * 0.68),
      predicted_congestion_index: 0.48,
      confidence_interval: {
        lower_kph: Math.round(edge.speed_limit_kph * 0.55),
        upper_kph: Math.round(edge.speed_limit_kph * 0.8),
      },
    })),
  };

  return forecast_update_schema.parse(data);
};

export const getMockAgentDecisions = (): AgentDecision[] => {
  const decisions: AgentDecision[] = [
    {
      decision_id: 'dec_8819',
      agent_id: 'AGENT_3',
      decision_type: 'signal_timing_adjust',
      target_entity_id: 'node_montgomery',
      action_parameters: { green_phase_delta_sec: 12, direction: 'eastbound' },
      explanation_xai: {
        rationale: 'Mitigate queued queue spillback on Montgomery corridor prior to 15m surge.',
        primary_factors: ['CV braking spike on edge_mont_pow', 'Upstream inflow +14%'],
        expected_delay_reduction_pct: 18.5,
        safety_confidence: 0.96,
      },
      status: 'active',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      decision_id: 'dec_8820',
      agent_id: 'AGENT_2',
      decision_type: 'dynamic_reroute',
      target_entity_id: 'edge_emb_pow_bypass',
      action_parameters: { divert_ratio: 0.25, advisory_vms: true },
      explanation_xai: {
        rationale: 'Redistribute Embarcadero arterial traffic via collector bypass.',
        primary_factors: ['Capacity reserve on collector >60%', 'Downstream arterial delay'],
        expected_delay_reduction_pct: 22.0,
        safety_confidence: 0.94,
      },
      status: 'proposed',
      created_at: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  return decisions.map((d) => agent_decision_schema.parse(d));
};

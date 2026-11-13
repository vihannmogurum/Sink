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
// Real Hyderabad Metropolitan & Cyberabad IT Corridor Nodes
// Coordinates focused around central Hyderabad & West IT Corridor
// -------------------------------------------------------------
export const hyd_nodes = [
  {
    node_id: 'node_punjagutta_flyover',
    name: 'Punjagutta Central Junction & Flyover',
    coordinates: { lat: 17.4265, lng: 78.4526 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Central Metropolitan Arterial',
  },
  {
    node_id: 'node_banjara_hills_rd2',
    name: 'Banjara Hills Road No. 2 (KBR Park Junction)',
    coordinates: { lat: 17.4223, lng: 78.4312 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Banjara Commercial Corridor',
  },
  {
    node_id: 'node_jubilee_checkpost',
    name: 'Jubilee Hills Check Post (Road No. 36)',
    coordinates: { lat: 17.4318, lng: 78.4072 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Jubilee Transit Spine',
  },
  {
    node_id: 'node_hitec_city_cyber_towers',
    name: 'Cyber Towers Junction (Hitec City)',
    coordinates: { lat: 17.4504, lng: 78.3808 },
    intersection_type: 'roundabout' as const,
    status: 'online' as const,
    zone: 'Cyberabad IT Corridor',
  },
  {
    node_id: 'node_apollo_hospital_jubilee',
    name: 'Apollo Hospital Jubilee Hills (Emergency Hub)',
    coordinates: { lat: 17.4172, lng: 78.4124 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Apollo Emergency Trauma Care',
  },
  {
    node_id: 'node_gachibowli_orrs',
    name: 'Gachibowli Bio-Diversity Junction',
    coordinates: { lat: 17.4385, lng: 78.3615 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Financial District Gateway',
  },
];

export const hyd_edges = [
  {
    edge_id: 'edge_punjagutta_banjara',
    source_node_id: 'node_punjagutta_flyover',
    target_node_id: 'node_banjara_hills_rd2',
    length_meters: 2400,
    speed_limit_kph: 50,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2200,
  },
  {
    edge_id: 'edge_banjara_jubilee',
    source_node_id: 'node_banjara_hills_rd2',
    target_node_id: 'node_jubilee_checkpost',
    length_meters: 2800,
    speed_limit_kph: 50,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2400,
  },
  {
    edge_id: 'edge_jubilee_hitec',
    source_node_id: 'node_jubilee_checkpost',
    target_node_id: 'node_hitec_city_cyber_towers',
    length_meters: 3600,
    speed_limit_kph: 60,
    lanes: 6,
    road_class: 'highway' as const,
    base_capacity: 3200,
  },
  {
    edge_id: 'edge_hitec_gachibowli',
    source_node_id: 'node_hitec_city_cyber_towers',
    target_node_id: 'node_gachibowli_orrs',
    length_meters: 2500,
    speed_limit_kph: 60,
    lanes: 6,
    road_class: 'highway' as const,
    base_capacity: 3000,
  },
  {
    edge_id: 'edge_banjara_apollo_preemption',
    source_node_id: 'node_banjara_hills_rd2',
    target_node_id: 'node_apollo_hospital_jubilee',
    length_meters: 2100,
    speed_limit_kph: 45,
    lanes: 3,
    road_class: 'collector' as const,
    base_capacity: 1800,
  },
  {
    edge_id: 'edge_jubilee_apollo_link',
    source_node_id: 'node_jubilee_checkpost',
    target_node_id: 'node_apollo_hospital_jubilee',
    length_meters: 1800,
    speed_limit_kph: 45,
    lanes: 3,
    road_class: 'collector' as const,
    base_capacity: 1700,
  },
  {
    edge_id: 'edge_punjagutta_jubilee_bypass',
    source_node_id: 'node_punjagutta_flyover',
    target_node_id: 'node_jubilee_checkpost',
    length_meters: 4800,
    speed_limit_kph: 55,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2600,
  },
];

// -------------------------------------------------------------
// Cyberabad IT Corridor Secondary Detailed Slice
// -------------------------------------------------------------
export const cyberabad_nodes = [
  {
    node_id: 'node_mindspace_junction',
    name: 'Mindspace IT Hub & Inorbit Mall',
    coordinates: { lat: 17.4328, lng: 78.3846 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Madhapur Tech Core',
  },
  {
    node_id: 'node_hitec_city_cyber_towers',
    name: 'Cyber Towers Junction (Hitec City)',
    coordinates: { lat: 17.4504, lng: 78.3808 },
    intersection_type: 'roundabout' as const,
    status: 'online' as const,
    zone: 'Cyberabad IT Corridor',
  },
  {
    node_id: 'node_gachibowli_orrs',
    name: 'Gachibowli Bio-Diversity Junction',
    coordinates: { lat: 17.4385, lng: 78.3615 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Financial District Gateway',
  },
  {
    node_id: 'node_aig_hospital',
    name: 'AIG Hospital & Gachibowli Health City',
    coordinates: { lat: 17.4412, lng: 78.3688 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Specialty Emergency Center',
  },
];

export const cyberabad_edges = [
  {
    edge_id: 'edge_mindspace_cyber_towers',
    source_node_id: 'node_mindspace_junction',
    target_node_id: 'node_hitec_city_cyber_towers',
    length_meters: 2100,
    speed_limit_kph: 50,
    lanes: 6,
    road_class: 'highway' as const,
    base_capacity: 3200,
  },
  {
    edge_id: 'edge_mindspace_aig',
    source_node_id: 'node_mindspace_junction',
    target_node_id: 'node_aig_hospital',
    length_meters: 1700,
    speed_limit_kph: 45,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2200,
  },
  {
    edge_id: 'edge_aig_gachibowli',
    source_node_id: 'node_aig_hospital',
    target_node_id: 'node_gachibowli_orrs',
    length_meters: 950,
    speed_limit_kph: 50,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2500,
  },
];

export const getMockGraphTopology = (
  zone: 'Hyderabad Metropolitan Grid' | 'Cyberabad IT Corridor' = 'Hyderabad Metropolitan Grid'
): GraphTopology => {
  if (zone === 'Cyberabad IT Corridor') {
    const data: GraphTopology = {
      grid_id: 'grid_hyd_cyberabad_02',
      city: 'Cyberabad IT Corridor',
      timestamp: new Date().toISOString(),
      nodes: cyberabad_nodes,
      edges: cyberabad_edges,
    };
    return graph_topology_schema.parse(data);
  }

  const data: GraphTopology = {
    grid_id: 'grid_hyd_metro_01',
    city: 'Hyderabad Metropolitan Grid',
    timestamp: new Date().toISOString(),
    nodes: hyd_nodes,
    edges: hyd_edges,
  };
  return graph_topology_schema.parse(data);
};

export const getMockTelemetryTick = (edges = hyd_edges): TelemetryTick => {
  const edgeTelemetry = edges.map((edge, index) => {
    const jitter = Math.sin(Date.now() / 3000 + index) * 0.15;
    const baseCongestion = index === 0 ? 0.72 : 0.28;
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
        edge_id: edges[0] ? edges[0].edge_id : 'edge_punjagutta_banjara',
        type: 'sudden_braking',
        severity: 'high',
        confidence_score: 0.92,
        detected_at: new Date(Date.now() - 45000).toISOString(),
      },
    ],
  };

  return telemetry_tick_schema.parse(data);
};

export const getMockForecastUpdate = (edges = hyd_edges): ForecastUpdate => {
  const data: ForecastUpdate = {
    forecast_id: `fc_${Date.now()}`,
    generated_at: new Date().toISOString(),
    model_version: 'ai-engine-v1.4-hyderabad-transformer',
    horizon_15m: edges.map((edge) => ({
      edge_id: edge.edge_id,
      predicted_speed_kph: Math.round(edge.speed_limit_kph * 0.75),
      predicted_congestion_index: 0.42,
      confidence_interval: {
        lower_kph: Math.round(edge.speed_limit_kph * 0.65),
        upper_kph: Math.round(edge.speed_limit_kph * 0.88),
      },
    })),
    horizon_30m: edges.map((edge) => ({
      edge_id: edge.edge_id,
      predicted_speed_kph: Math.round(edge.speed_limit_kph * 0.62),
      predicted_congestion_index: 0.55,
      confidence_interval: {
        lower_kph: Math.round(edge.speed_limit_kph * 0.5),
        upper_kph: Math.round(edge.speed_limit_kph * 0.75),
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
      target_entity_id: 'node_punjagutta_flyover',
      action_parameters: { green_phase_delta_sec: 18, direction: 'westbound_banjara' },
      explanation_xai: {
        rationale: 'Mitigate queued spillback on Punjagutta Flyover bottleneck toward Banjara Hills Rd No. 2.',
        primary_factors: ['CV braking cluster on Punjagutta corridor', 'Downstream junction volume +22%'],
        expected_delay_reduction_pct: 26.5,
        safety_confidence: 0.96,
      },
      status: 'active',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      decision_id: 'dec_8820',
      agent_id: 'AGENT_2',
      decision_type: 'emergency_preemption',
      target_entity_id: 'edge_banjara_apollo_preemption',
      action_parameters: { clear_corridor: true, advisory_vms: true },
      explanation_xai: {
        rationale: 'Preempt emergency green wave corridor for Code 3 trauma ambulance to Apollo Hospital Jubilee Hills.',
        primary_factors: ['Inbound Ambulance from Banjara Rd 2', 'Corridor Clearance Active'],
        expected_delay_reduction_pct: 42.0,
        safety_confidence: 0.99,
      },
      status: 'active',
      created_at: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  return decisions.map((d) => agent_decision_schema.parse(d));
};

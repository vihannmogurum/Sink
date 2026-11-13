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
// Real San Francisco Arterials, Corridors & Medical Center Hubs
// -------------------------------------------------------------
export const sf_nodes = [
  {
    node_id: 'node_embarcadero_market',
    name: 'The Ferry Building & Market St',
    coordinates: { lat: 37.7955, lng: -122.3937 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SFMTA Downtown Core',
  },
  {
    node_id: 'node_market_montgomery',
    name: 'Market St & Montgomery Transit Hub',
    coordinates: { lat: 37.7892, lng: -122.4014 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SFMTA Financial Corridor',
  },
  {
    node_id: 'node_market_powell',
    name: 'Market St & 4th / Powell Cable',
    coordinates: { lat: 37.7845, lng: -122.4074 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SFMTA Union Square Corridor',
  },
  {
    node_id: 'node_civic_van_ness',
    name: 'Civic Center Plaza & Van Ness Ave',
    coordinates: { lat: 37.7778, lng: -122.4189 },
    intersection_type: 'roundabout' as const,
    status: 'online' as const,
    zone: 'SFMTA Civic Center Core',
  },
  {
    node_id: 'node_ucsf_mission_bay',
    name: 'UCSF Medical Center at Mission Bay',
    coordinates: { lat: 37.7678, lng: -122.3912 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Emergency Trauma Hub',
  },
  {
    node_id: 'node_zuckerberg_sfgh',
    name: 'Zuckerberg SF General Hospital (Potrero)',
    coordinates: { lat: 37.7558, lng: -122.4047 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'Level 1 Trauma Center',
  },
];

export const sf_edges = [
  {
    edge_id: 'edge_market_arterial_1',
    source_node_id: 'node_embarcadero_market',
    target_node_id: 'node_market_montgomery',
    length_meters: 850,
    speed_limit_kph: 40,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 1900,
  },
  {
    edge_id: 'edge_market_arterial_2',
    source_node_id: 'node_market_montgomery',
    target_node_id: 'node_market_powell',
    length_meters: 650,
    speed_limit_kph: 35,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 1800,
  },
  {
    edge_id: 'edge_market_arterial_3',
    source_node_id: 'node_market_powell',
    target_node_id: 'node_civic_van_ness',
    length_meters: 1100,
    speed_limit_kph: 45,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2100,
  },
  {
    edge_id: 'edge_embarcadero_ucsf_express',
    source_node_id: 'node_embarcadero_market',
    target_node_id: 'node_ucsf_mission_bay',
    length_meters: 2800,
    speed_limit_kph: 55,
    lanes: 4,
    road_class: 'highway' as const,
    base_capacity: 2600,
  },
  {
    edge_id: 'edge_powell_sfgh_corridor',
    source_node_id: 'node_market_powell',
    target_node_id: 'node_zuckerberg_sfgh',
    length_meters: 3200,
    speed_limit_kph: 50,
    lanes: 3,
    road_class: 'arterial' as const,
    base_capacity: 2000,
  },
  {
    edge_id: 'edge_ucsf_sfgh_link',
    source_node_id: 'node_ucsf_mission_bay',
    target_node_id: 'node_zuckerberg_sfgh',
    length_meters: 1800,
    speed_limit_kph: 45,
    lanes: 3,
    road_class: 'collector' as const,
    base_capacity: 1600,
  },
  {
    edge_id: 'edge_civic_sfgh_potrero',
    source_node_id: 'node_civic_van_ness',
    target_node_id: 'node_zuckerberg_sfgh',
    length_meters: 2600,
    speed_limit_kph: 50,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2200,
  },
];

// -------------------------------------------------------------
// Seattle (SDOT) Secondary Corridor Nodes & Edges
// -------------------------------------------------------------
export const seattle_nodes = [
  {
    node_id: 'node_pike_place',
    name: 'Pike Place Market & 1st Ave',
    coordinates: { lat: 47.6087, lng: -122.3400 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SDOT Downtown Core',
  },
  {
    node_id: 'node_westlake_center',
    name: 'Westlake Transit Hub (4th & Pine)',
    coordinates: { lat: 47.6114, lng: -122.3370 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SDOT Retail Core',
  },
  {
    node_id: 'node_pioneer_square',
    name: 'Pioneer Square & 2nd Ave Ext',
    coordinates: { lat: 47.6015, lng: -122.3332 },
    intersection_type: 'signalized' as const,
    status: 'online' as const,
    zone: 'SDOT Historic District',
  },
  {
    node_id: 'node_harborview_medical',
    name: 'Harborview Medical Center (First Hill)',
    coordinates: { lat: 47.6046, lng: -122.3244 },
    intersection_type: 'freeway_ramp' as const,
    status: 'online' as const,
    zone: 'Level 1 Trauma Hospital',
  },
];

export const seattle_edges = [
  {
    edge_id: 'edge_sea_pike_westlake',
    source_node_id: 'node_pike_place',
    target_node_id: 'node_westlake_center',
    length_meters: 600,
    speed_limit_kph: 40,
    lanes: 3,
    road_class: 'arterial' as const,
    base_capacity: 1700,
  },
  {
    edge_id: 'edge_sea_westlake_pioneer',
    source_node_id: 'node_westlake_center',
    target_node_id: 'node_pioneer_square',
    length_meters: 1300,
    speed_limit_kph: 45,
    lanes: 4,
    road_class: 'arterial' as const,
    base_capacity: 2000,
  },
  {
    edge_id: 'edge_sea_pioneer_harborview',
    source_node_id: 'node_pioneer_square',
    target_node_id: 'node_harborview_medical',
    length_meters: 1100,
    speed_limit_kph: 45,
    lanes: 3,
    road_class: 'collector' as const,
    base_capacity: 1500,
  },
];

export const getMockGraphTopology = (city: 'San Francisco' | 'Seattle' = 'San Francisco'): GraphTopology => {
  if (city === 'Seattle') {
    const data: GraphTopology = {
      grid_id: 'grid_sea_sdot_01',
      city: 'Seattle (SDOT)',
      timestamp: new Date().toISOString(),
      nodes: seattle_nodes,
      edges: seattle_edges,
    };
    return graph_topology_schema.parse(data);
  }

  const data: GraphTopology = {
    grid_id: 'grid_sf_sfmta_01',
    city: 'San Francisco (SFMTA)',
    timestamp: new Date().toISOString(),
    nodes: sf_nodes,
    edges: sf_edges,
  };
  return graph_topology_schema.parse(data);
};

export const getMockTelemetryTick = (edges = sf_edges): TelemetryTick => {
  const edgeTelemetry = edges.map((edge, index) => {
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
        edge_id: edges[1] ? edges[1].edge_id : 'edge_market_arterial_2',
        type: 'sudden_braking',
        severity: 'medium',
        confidence_score: 0.89,
        detected_at: new Date(Date.now() - 45000).toISOString(),
      },
    ],
  };

  return telemetry_tick_schema.parse(data);
};

export const getMockForecastUpdate = (edges = sf_edges): ForecastUpdate => {
  const data: ForecastUpdate = {
    forecast_id: `fc_${Date.now()}`,
    generated_at: new Date().toISOString(),
    model_version: 'ai-engine-v1.4-sf-transformer',
    horizon_15m: edges.map((edge) => ({
      edge_id: edge.edge_id,
      predicted_speed_kph: Math.round(edge.speed_limit_kph * 0.8),
      predicted_congestion_index: 0.35,
      confidence_interval: {
        lower_kph: Math.round(edge.speed_limit_kph * 0.7),
        upper_kph: Math.round(edge.speed_limit_kph * 0.9),
      },
    })),
    horizon_30m: edges.map((edge) => ({
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
      target_entity_id: 'node_market_montgomery',
      action_parameters: { green_phase_delta_sec: 14, direction: 'westbound' },
      explanation_xai: {
        rationale: 'Mitigate queued queue spillback on Market St transit corridor prior to 15m surge.',
        primary_factors: ['CV braking spike at Montgomery Hub', 'Upstream inflow +14%'],
        expected_delay_reduction_pct: 21.5,
        safety_confidence: 0.96,
      },
      status: 'active',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      decision_id: 'dec_8820',
      agent_id: 'AGENT_2',
      decision_type: 'emergency_preemption',
      target_entity_id: 'edge_embarcadero_ucsf_express',
      action_parameters: { clear_corridor: true, advisory_vms: true },
      explanation_xai: {
        rationale: 'Preempt green-wave corridor for trauma transit to UCSF Medical Center at Mission Bay.',
        primary_factors: ['Code 3 Ambulance Inbound', 'The Embarcadero Signal Synchrony'],
        expected_delay_reduction_pct: 38.0,
        safety_confidence: 0.98,
      },
      status: 'active',
      created_at: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  return decisions.map((d) => agent_decision_schema.parse(d));
};

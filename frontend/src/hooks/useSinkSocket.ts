import { useState, useEffect, useRef } from 'react';
import {
  TelemetryTick,
  ForecastUpdate,
  AgentDecision,
} from '../schemas/contracts';
import {
  getMockTelemetryTick,
  getMockForecastUpdate,
  getMockAgentDecisions,
} from '../services/mockEngine';
import { SystemKpis } from '../services/api';

export interface SinkSocketState {
  isConnected: boolean;
  isMockFallback: boolean;
  latestTick: TelemetryTick | null;
  latestForecast: ForecastUpdate | null;
  agentDecisions: AgentDecision[];
  liveKpis: SystemKpis | null;
  godsEyeCameras: any[];
  activeIncidents: any[];
  connectionError: string | null;
}

export const useSinkSocket = (
  wsUrl: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/state'
): SinkSocketState => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMockFallback, setIsMockFallback] = useState(false);
  const [latestTick, setLatestTick] = useState<TelemetryTick | null>(null);
  const [latestForecast, setLatestForecast] = useState<ForecastUpdate | null>(null);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
  const [liveKpis, setLiveKpis] = useState<SystemKpis | null>(null);
  const [godsEyeCameras, setGodsEyeCameras] = useState<any[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mockIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let unmounted = false;

    const startMockTicker = () => {
      if (unmounted) return;
      setIsMockFallback(true);
      setIsConnected(true);
      setConnectionError('Live server on port 8000 offline. Running in Mock Fallback mode.');

      setLatestTick(getMockTelemetryTick());
      setLatestForecast(getMockForecastUpdate());
      setAgentDecisions(getMockAgentDecisions());

      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = window.setInterval(() => {
        if (!unmounted) {
          setLatestTick(getMockTelemetryTick());
        }
      }, 2500);
    };

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      const connectionTimeout = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('[useSinkSocket] WebSocket timed out. Activating fallback ticker.');
          ws.close();
          startMockTicker();
        }
      }, 3000);

      ws.onopen = () => {
        if (unmounted) return;
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setIsMockFallback(false);
        setConnectionError(null);
        if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
        console.info('[useSinkSocket] Connected to Sink OS WebSocket State Broadcaster');
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const message = JSON.parse(event.data);

          // 1. Unified state_update broadcast
          if (message.type === 'state_update') {
            if (message.live_kpis) {
              setLiveKpis(message.live_kpis);
            }
            if (message.gods_eye_cameras) {
              setGodsEyeCameras(message.gods_eye_cameras);
            }
            if (message.active_incidents) {
              setActiveIncidents(message.active_incidents);
            }
            if (message.forecast_update) {
              const fu = message.forecast_update;
              const h15 = fu.t_plus_15m
                ? Object.values(fu.t_plus_15m).map((item: any) => ({
                    edge_id: item.edge_id,
                    predicted_speed_kph: item.predicted_speed_kmh || 45,
                    predicted_congestion_index: item.congestion_level === 'severe' ? 0.85 : item.congestion_level === 'congested' ? 0.5 : 0.2,
                    confidence_interval: {
                      lower_kph: Math.max(10, (item.predicted_speed_kmh || 45) - 8),
                      upper_kph: (item.predicted_speed_kmh || 45) + 8,
                    },
                  }))
                : fu.horizon_15m || [];

              const h30 = fu.t_plus_30m
                ? Object.values(fu.t_plus_30m).map((item: any) => ({
                    edge_id: item.edge_id,
                    predicted_speed_kph: item.predicted_speed_kmh || 42,
                    predicted_congestion_index: item.congestion_level === 'severe' ? 0.9 : item.congestion_level === 'congested' ? 0.6 : 0.25,
                    confidence_interval: {
                      lower_kph: Math.max(8, (item.predicted_speed_kmh || 42) - 10),
                      upper_kph: (item.predicted_speed_kmh || 42) + 10,
                    },
                  }))
                : fu.horizon_30m || [];

              setLatestForecast({
                forecast_id: `fc_${Date.now()}`,
                generated_at: new Date().toISOString(),
                model_version: 'ST-GNN-v2.1',
                horizon_15m: h15,
                horizon_30m: h30,
              });
            }
            if (Array.isArray(message.telemetry_tick)) {
              setLatestTick({
                tick_id: `tick_${Date.now()}`,
                timestamp: new Date().toISOString(),
                edge_telemetry: message.telemetry_tick.map((t: any) => ({
                  edge_id: t.edge_id,
                  current_speed_kph: t.speed_kmh,
                  congestion_index: t.density_score,
                  vehicle_count: t.vehicle_count,
                  flow_rate_vph: t.vehicle_count * 20,
                  status: t.density_score > 0.7 ? 'congested' : 'normal',
                })),
                cv_anomalies: (message.active_incidents || []).map((inc: any) => ({
                  anomaly_id: inc.incident_id,
                  edge_id: inc.edge_id,
                  type: 'sudden_braking',
                  severity: 'high',
                  confidence_score: inc.confidence || 0.92,
                  detected_at: new Date(inc.timestamp * 1000).toISOString(),
                })),
              });
            }
            if (Array.isArray(message.latest_agent_decisions)) {
              const adaptedDecisions: AgentDecision[] = message.latest_agent_decisions.map((d: any) => ({
                decision_id: d.decision_id,
                agent_id: 'AGENT_5',
                decision_type: 'emergency_preemption',
                target_entity_id: d.edge_id || 'hyd_corridor',
                action_parameters: d,
                explanation_xai: {
                  rationale: d.xai_reasoning || 'Autonomous corridor cleared.',
                  primary_factors: Object.keys(d.factors || {}).map((k) => `${k}: ${Math.round((d.factors[k] || 0) * 100)}%`),
                  expected_delay_reduction_pct: d.eta_saved_sec ? Math.round((d.eta_saved_sec / (d.baseline_eta_sec || 1)) * 100) : 35,
                  safety_confidence: d.confidence || 0.96,
                },
                status: 'active',
                created_at: new Date(d.timestamp * 1000).toISOString(),
              }));
              setAgentDecisions(adaptedDecisions);
            }
            return;
          }

          // 2. Emergency override event
          if (message.type === 'emergency_override' || message.event === 'emergency_override') {
            const data = message.data || message.payload;
            const newDec: AgentDecision = {
              decision_id: data?.decision_id || `DEC_${Date.now()}`,
              agent_id: 'AGENT_5',
              decision_type: 'emergency_preemption',
              target_entity_id: data?.corridor_edges?.[0] || 'apollo_corridor',
              action_parameters: data,
              explanation_xai: {
                rationale: data?.xai_reasoning || 'Emergency preemption activated to Apollo Hospital Jubilee Hills.',
                primary_factors: Object.keys(data?.factors || {}).map((k) => `${k}: ${Math.round(data.factors[k] * 100)}%`),
                expected_delay_reduction_pct: data?.savings_pct || 36.8,
                safety_confidence: 0.98,
              },
              status: 'active',
              created_at: new Date().toISOString(),
            };
            setAgentDecisions((prev) => [newDec, ...prev.slice(0, 49)]);
          }

          if (message.type === 'connection_ack' && message.live_kpis) {
            setLiveKpis(message.live_kpis);
          }
        } catch (err) {
          console.error('[useSinkSocket] Error processing message:', err);
        }
      };

      ws.onerror = () => {
        if (unmounted) return;
        clearTimeout(connectionTimeout);
        startMockTicker();
      };

      ws.onclose = () => {
        if (unmounted) return;
        clearTimeout(connectionTimeout);
        startMockTicker();
      };
    } catch {
      startMockTicker();
    }

    return () => {
      unmounted = true;
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [wsUrl]);

  return {
    isConnected,
    isMockFallback,
    latestTick,
    latestForecast,
    agentDecisions,
    liveKpis,
    godsEyeCameras,
    activeIncidents,
    connectionError,
  };
};

import { useState, useEffect, useRef } from 'react';
import {
  TelemetryTick,
  ForecastUpdate,
  AgentDecision,
  telemetry_tick_schema,
  forecast_update_schema,
  agent_decision_schema,
} from '../schemas/contracts';
import {
  getMockTelemetryTick,
  getMockForecastUpdate,
  getMockAgentDecisions,
} from '../services/mockEngine';

export interface SinkSocketState {
  isConnected: boolean;
  isMockFallback: boolean;
  latestTick: TelemetryTick | null;
  latestForecast: ForecastUpdate | null;
  agentDecisions: AgentDecision[];
  connectionError: string | null;
}

export const useSinkSocket = (
  wsUrl: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live'
): SinkSocketState => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMockFallback, setIsMockFallback] = useState(false);
  const [latestTick, setLatestTick] = useState<TelemetryTick | null>(null);
  const [latestForecast, setLatestForecast] = useState<ForecastUpdate | null>(null);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
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
          console.warn('[useSinkSocket] WebSocket timed out. Activating mock engine.');
          ws.close();
          startMockTicker();
        }
      }, 2500);

      ws.onopen = () => {
        if (unmounted) return;
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setIsMockFallback(false);
        setConnectionError(null);
        if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
        console.info('[useSinkSocket] Connected to AGENT_2 backend on /ws/live');
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const message = JSON.parse(event.data);
          // 1. Check AGENT_2 event envelopes: { event: "emergency_override" | "route_recalculated" | "incident_detected", payload: {...} }
          if (message.event === 'emergency_override' || message.event === 'route_recalculated') {
            const decisionPayload: AgentDecision = {
              decision_id: `DEC_${Date.now()}`,
              agent_id: 'AGENT_2',
              decision_type: message.event === 'emergency_override' ? 'emergency_preemption' : 'dynamic_reroute',
              target_entity_id: message.payload?.route?.[0] || 'grid_route',
              action_parameters: message.payload || {},
              explanation_xai: {
                rationale: message.payload?.reason || 'Route recalculated dynamically by Dijkstra engine.',
                primary_factors: [`Travel time: ${message.payload?.total_weight || 0} min`, 'Dijkstra shortest path'],
                expected_delay_reduction_pct: 35.0,
                safety_confidence: 0.98,
              },
              status: 'active',
              created_at: message.timestamp || new Date().toISOString(),
            };
            setAgentDecisions((prev) => [decisionPayload, ...prev.slice(0, 49)]);
          } else if (message.event === 'incident_detected') {
            // Incorporate anomaly into tick stream
            setLatestTick((prev) => {
              if (!prev) return getMockTelemetryTick();
              return {
                ...prev,
                cv_anomalies: [
                  {
                    anomaly_id: `anom_${Date.now()}`,
                    edge_id: message.payload.edge_id,
                    type: message.payload.type || 'sudden_braking',
                    severity: message.payload.severity || 'high',
                    confidence_score: 0.95,
                    detected_at: new Date().toISOString(),
                  },
                  ...prev.cv_anomalies,
                ],
              };
            });
          }

          // 2. Also check standard telemetry/forecast message types
          if (message.type === 'telemetry_tick') {
            const parsed = telemetry_tick_schema.safeParse(message.payload);
            if (parsed.success) setLatestTick(parsed.data);
          } else if (message.type === 'forecast_update') {
            const parsed = forecast_update_schema.safeParse(message.payload);
            if (parsed.success) setLatestForecast(parsed.data);
          } else if (message.type === 'agent_decision') {
            const parsed = agent_decision_schema.safeParse(message.payload);
            if (parsed.success) {
              setAgentDecisions((prev) => [parsed.data, ...prev.slice(0, 49)]);
            }
          }
        } catch (err) {
          console.error('[useSinkSocket] Error parsing WS message:', err);
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
    connectionError,
  };
};

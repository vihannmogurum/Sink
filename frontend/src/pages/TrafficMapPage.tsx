import React, { useState, useEffect } from 'react';
import { fetchGraph, dispatchEmergency } from '../services/api';
import { useSinkSocket } from '../hooks/useSinkSocket';
import { GraphTopology } from '../schemas/contracts';
import { SinkMapCanvas } from './map/SinkMapCanvas';
import { HorizonScrubber } from './map/HorizonScrubber';
import { IncidentFeed } from './map/IncidentFeed';
import { AgentAuditDrawer } from './map/AgentAuditDrawer';
import { ChaosDock } from './map/ChaosDock';
import { TrafficHudProvider, useTrafficHud } from '../context/TrafficHudContext';

const TrafficMapContent: React.FC = () => {
  const [graph, setGraph] = useState<GraphTopology | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [emergencyEdgeIds, setEmergencyEdgeIds] = useState<string[]>([]);

  const { isConnected, isMockFallback, latestTick, latestForecast, agentDecisions } = useSinkSocket();
  const { selectedEdgeId } = useTrafficHud();

  useEffect(() => {
    fetchGraph().then((data) => {
      setGraph(data);
    });
  }, []);

  const handleDispatchEmergency = async () => {
    if (!graph || graph.nodes.length < 2) return;
    const res = await dispatchEmergency({
      origin_node_id: graph.nodes[0].node_id,
      destination_node_id: graph.nodes[graph.nodes.length - 1].node_id,
      priority_tier: 'priority_1_code_3',
      vehicle_type: 'ambulance',
    });
    setEmergencyEdgeIds(['edge_emb_mont', 'edge_mont_pow']);
    setActionNotice(`Emergency green-wave corridor active: ${res.dispatch_id}`);
    setTimeout(() => {
      setEmergencyEdgeIds([]);
      setActionNotice(null);
    }, 8000);
  };

  const selectedEdge = graph?.edges.find((e) => e.edge_id === selectedEdgeId) || null;
  const selectedTelemetry = latestTick?.edge_telemetry.find((t) => t.edge_id === selectedEdgeId) || null;
  const forecast15 = latestForecast?.horizon_15m.find((h) => h.edge_id === selectedEdgeId) || null;
  const forecast30 = latestForecast?.horizon_30m.find((h) => h.edge_id === selectedEdgeId) || null;

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden rounded-xl bg-slate-950">
      {/* Tactical Horizon Scrubber Pill (Top Centered) */}
      <HorizonScrubber
        onDispatchEmergency={handleDispatchEmergency}
        isEmergencyActive={emergencyEdgeIds.length > 0}
      />

      {/* Floating Left Incident Feed */}
      <IncidentFeed
        anomalies={latestTick?.cv_anomalies || []}
        graph={graph}
      />

      {/* Main Full-Bleed Map Canvas */}
      <SinkMapCanvas
        graph={graph}
        latestTick={latestTick}
        forecastUpdate={latestForecast}
        emergencyEdgeIds={emergencyEdgeIds}
      />

      {/* Floating Chaos Dock (Bottom Centered) */}
      <ChaosDock
        activeEdgeId={selectedEdgeId || 'edge_emb_mont'}
        onIncidentInjected={(_id, msg) => {
          setActionNotice(msg);
          setTimeout(() => setActionNotice(null), 5000);
        }}
      />

      {/* Right XAI Inspector Slide-Over Drawer */}
      <AgentAuditDrawer
        edge={selectedEdge}
        telemetry={selectedTelemetry}
        forecast15={forecast15}
        forecast30={forecast30}
        decisions={agentDecisions}
      />

      {/* System Toast Notice */}
      {actionNotice && (
        <div className="absolute top-20 right-4 z-[450] max-w-sm rounded-lg bg-emerald-500/90 text-white p-3 text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-fadeIn">
          {actionNotice}
        </div>
      )}

      {/* Live Mesh Connectivity Badge */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 border border-slate-800 text-[11px] font-mono text-slate-300">
        <span
          className={`h-2 w-2 rounded-full ${
            isMockFallback ? 'bg-amber-400 animate-pulse' : isConnected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <span>{isMockFallback ? 'Mock Mesh: Port 8000' : 'Live Sync: Port 8000'}</span>
      </div>
    </div>
  );
};

export const TrafficMapPage: React.FC = () => {
  return (
    <TrafficHudProvider>
      <TrafficMapContent />
    </TrafficHudProvider>
  );
};

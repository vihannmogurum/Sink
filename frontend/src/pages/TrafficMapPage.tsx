import React, { useState, useEffect } from 'react';
import { fetchGraph, dispatchEmergency } from '../services/api';
import { useSinkSocket } from '../hooks/useSinkSocket';
import { GraphTopology } from '../schemas/contracts';
import { SinkMapCanvas } from './map/SinkMapCanvas';
import { HorizonScrubber } from './map/HorizonScrubber';
import { RouteSearchBar } from './map/RouteSearchBar';
import { IncidentFeed } from './map/IncidentFeed';
import { AgentAuditDrawer } from './map/AgentAuditDrawer';
import { ChaosDock } from './map/ChaosDock';
import { useTrafficHud } from '../context/TrafficHudContext';
import { getMockGraphTopology } from '../services/mockEngine';

export const TrafficMapPage: React.FC = () => {
  const [graph, setGraph] = useState<GraphTopology | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [emergencyEdgeIds, setEmergencyEdgeIds] = useState<string[]>([]);

  const { isConnected, isMockFallback, latestTick, latestForecast, agentDecisions } = useSinkSocket();
  const {
    selectedCity,
    selectedEdgeId,
    dispatchMode,
    setDispatchMode,
    selectedOrigin,
    setSelectedOrigin,
    selectedDestination,
    setSelectedDestination,
    cancelDispatchMode,
  } = useTrafficHud();

  // Load graph whenever active city changes (San Francisco vs Seattle)
  useEffect(() => {
    const isSeattle = selectedCity.includes('Seattle');
    fetchGraph().then((data) => {
      // If mock engine fallback is active, generate city-specific nodes and edges
      if (data.grid_id.includes('sf') && isSeattle) {
        setGraph(getMockGraphTopology('Seattle'));
      } else if (!isSeattle) {
        setGraph(getMockGraphTopology('San Francisco'));
      } else {
        setGraph(data);
      }
    });
  }, [selectedCity]);

  // Handle entering Dispatch Mode
  const handleStartDispatchMode = () => {
    setDispatchMode(true);
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setActionNotice('Dispatch Mode: Click any node to select Origin, then click Destination.');
  };

  // Handle Node clicks while in Dispatch Mode
  const handleNodeClickInDispatchMode = async (nodeId: string) => {
    if (!dispatchMode || !graph) return;

    if (!selectedOrigin) {
      setSelectedOrigin(nodeId);
      const originNode = graph.nodes.find((n) => n.node_id === nodeId);
      setActionNotice(`Origin set: ${originNode?.name || nodeId}. Now click Destination node.`);
    } else if (!selectedDestination && nodeId !== selectedOrigin) {
      setSelectedDestination(nodeId);
      const destNode = graph.nodes.find((n) => n.node_id === nodeId);
      const originNode = graph.nodes.find((n) => n.node_id === selectedOrigin);
      setActionNotice(`Routing emergency wave: ${originNode?.name} → ${destNode?.name}...`);

      try {
        const res = await dispatchEmergency(
          {
            origin_node_id: selectedOrigin,
            destination_node_id: nodeId,
            priority_tier: 'priority_1_code_3',
            vehicle_type: 'ambulance',
          },
          graph
        );

        setEmergencyEdgeIds(res.path_edge_ids);
        cancelDispatchMode();
        setActionNotice(
          `Emergency green wave engaged: ${res.dispatch_id} (${res.path_edge_ids.length} corridor edges active)`
        );

        setTimeout(() => {
          setEmergencyEdgeIds([]);
          setActionNotice(null);
        }, 15000);
      } catch (err) {
        console.error('Dispatch failed:', err);
        setActionNotice('Failed to dispatch emergency preemption.');
        cancelDispatchMode();
      }
    }
  };

  const selectedEdge = graph?.edges.find((e) => e.edge_id === selectedEdgeId) || null;
  const selectedTelemetry = latestTick?.edge_telemetry.find((t) => t.edge_id === selectedEdgeId) || null;
  const forecast15 = latestForecast?.horizon_15m.find((h) => h.edge_id === selectedEdgeId) || null;
  const forecast30 = latestForecast?.horizon_30m.find((h) => h.edge_id === selectedEdgeId) || null;

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden rounded-xl bg-slate-950">
      {/* Tactical Horizon Scrubber Pill (Top Centered) */}
      <HorizonScrubber
        onStartDispatchMode={handleStartDispatchMode}
        isEmergencyActive={emergencyEdgeIds.length > 0}
      />

      {/* Floating Route Search Bars (Current Location & Destination) */}
      <RouteSearchBar
        graph={graph}
        onDispatchRoute={async (orig, dest) => {
          if (!graph) return;
          try {
            const res = await dispatchEmergency(
              {
                origin_node_id: orig,
                destination_node_id: dest,
                priority_tier: 'priority_1_code_3',
                vehicle_type: 'ambulance',
              },
              graph
            );
            setEmergencyEdgeIds(res.path_edge_ids);
            cancelDispatchMode();
            setActionNotice(
              `Emergency Corridor Active: ${res.dispatch_id} (${res.path_edge_ids.length} corridor edges locked)`
            );
            setTimeout(() => {
              setEmergencyEdgeIds([]);
              setActionNotice(null);
            }, 15000);
          } catch (err) {
            console.error('Dispatch failed:', err);
            setActionNotice('Failed to dispatch route.');
          }
        }}
        isEmergencyActive={emergencyEdgeIds.length > 0}
      />

      {/* Floating Left Incident Feed (Hidden in dispatch selection mode) */}
      {!dispatchMode && (
        <IncidentFeed
          anomalies={latestTick?.cv_anomalies || []}
          graph={graph}
        />
      )}

      {/* Main Full-Bleed Map Canvas */}
      <SinkMapCanvas
        graph={graph}
        latestTick={latestTick}
        forecastUpdate={latestForecast}
        emergencyEdgeIds={emergencyEdgeIds}
        onNodeClickInDispatchMode={handleNodeClickInDispatchMode}
      />

      {/* Floating Chaos Dock (Bottom Centered) */}
      {!dispatchMode && (
        <ChaosDock
          activeEdgeId={selectedEdgeId || (graph?.edges[0]?.edge_id ?? 'edge_market_arterial_1')}
          onIncidentInjected={(_id, msg) => {
            setActionNotice(msg);
            setTimeout(() => setActionNotice(null), 5000);
          }}
        />
      )}

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
        <div className="absolute top-20 right-4 z-[450] max-w-sm rounded-lg bg-emerald-500/95 text-white p-3 text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-fadeIn flex items-center justify-between gap-3">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-white/80 hover:text-white underline text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Mesh Connectivity Badge */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 border border-slate-800 text-[11px] font-mono text-slate-300">
        <span
          className={`h-2 w-2 rounded-full ${
            isMockFallback ? 'bg-amber-400 animate-pulse' : isConnected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <span>
          {isMockFallback
            ? `Mock Mesh (${selectedCity}): Port 8000`
            : `Live Sync (${selectedCity}): Port 8000`}
        </span>
      </div>
    </div>
  );
};

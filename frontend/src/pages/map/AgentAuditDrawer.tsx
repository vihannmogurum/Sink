import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  GraphEdge,
  EdgeTelemetry,
  AgentDecision,
  EdgeForecastHorizon,
} from '../../schemas/contracts';
import { X, Cpu, Zap, ShieldCheck, Camera } from 'lucide-react';
import { Button } from '../../components/ui';
import { useTrafficHud } from '../../context/TrafficHudContext';

interface AgentAuditDrawerProps {
  edge: GraphEdge | null;
  telemetry: EdgeTelemetry | null;
  forecast15?: EdgeForecastHorizon | null;
  forecast30?: EdgeForecastHorizon | null;
  decisions: AgentDecision[];
}

// 1-to-1 canonical edge to camera map for Hyderabad
const EDGE_TO_CAMERA: Record<string, { id: string; name: string }> = {
  edge_punjagutta_banjara: { id: 'CAM-HYD-01', name: 'Punjagutta Central Flyover' },
  edge_banjara_jubilee: { id: 'CAM-HYD-02', name: 'Banjara Hills Rd No. 2' },
  edge_jubilee_hitec: { id: 'CAM-HYD-03', name: 'HITEC City Cyber Towers' },
  edge_hitec_gachibowli: { id: 'CAM-HYD-04', name: 'Gachibowli Bio-Diversity' },
  edge_banjara_apollo_preemption: { id: 'CAM-HYD-05', name: 'Apollo Trauma Preemption' },
  edge_jubilee_apollo_link: { id: 'CAM-HYD-06', name: 'Film Nagar Apollo Link' },
  edge_punjagutta_jubilee_bypass: { id: 'CAM-HYD-07', name: 'Road No. 36 Direct Express' },
  edge_begumpet_punjagutta: { id: 'CAM-HYD-08', name: 'Begumpet Airport Spine' },
};

export const AgentAuditDrawer: React.FC<AgentAuditDrawerProps> = ({
  edge,
  telemetry,
  forecast15,
  forecast30,
  decisions,
}) => {
  const { isDrawerOpen, resetSelection } = useTrafficHud();

  if (!isDrawerOpen || !edge) return null;

  // Relevant agent decision for this target edge
  const relevantDecisions = decisions.filter(
    (d) => d.target_entity_id === edge.edge_id || d.target_entity_id === edge.source_node_id
  );
  const primaryDecision = relevantDecisions[0] || decisions[0];

  // Dynamic Speed vs Time Data for Recharts
  const currentSpeed = telemetry?.current_speed_kph ?? Math.round(edge.speed_limit_kph * 0.7);
  const speed15m = forecast15?.predicted_speed_kph ?? Math.round(currentSpeed * 0.85);
  const speed30m = forecast30?.predicted_speed_kph ?? Math.round(currentSpeed * 0.7);

  const speedChartData = [
    { time: '-15m', speed: Math.min(Math.round(currentSpeed * 1.1), edge.speed_limit_kph) },
    { time: '-10m', speed: Math.min(Math.round(currentSpeed * 1.05), edge.speed_limit_kph) },
    { time: '-5m', speed: currentSpeed },
    { time: 'Now', speed: currentSpeed },
    { time: '+15m', speed: speed15m },
    { time: '+30m', speed: speed30m },
  ];

  // Lookup exact camera metadata for the clicked edge
  const cleanEdgeId = edge.edge_id.replace('_rev', '');
  const camMeta = EDGE_TO_CAMERA[cleanEdgeId] || { id: 'CAM-HYD-01', name: 'Punjagutta Central Flyover' };
  const cameraId = camMeta.id;
  const cameraName = camMeta.name;

  return (
    <div className="absolute top-0 right-0 z-[500] h-full w-96 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 select-none animate-slideLeft">
      {/* Drawer Header with Close (X) button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              XAI Telemetry Inspector
            </h2>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{edge.edge_id}</p>
        </div>
        <button
          onClick={resetSelection}
          title="Close Inspector (Esc)"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Live God's Eye Surveillance Feed */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
              <Camera className="h-3.5 w-3.5" />
              <span>LIVE CV // {cameraId} ({cameraName})</span>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={`http://localhost:8000/api/v1/cameras/${cameraId}/frame?t=${Date.now()}`}
              alt={`Live Camera Feed ${cameraId}`}
              key={`${cameraId}-${edge.edge_id}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute bottom-2 left-2 right-2 rounded bg-slate-950/70 backdrop-blur-xs px-2 py-1 text-[10px] font-mono text-slate-300 flex items-center justify-between pointer-events-none">
              <span>BOUNDING BOX DETECTION: ACTIVE</span>
              <span className="text-emerald-400">30 FPS</span>
            </div>
          </div>
        </div>

        {/* Edge Overview Card */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
            <span className="text-[10px] uppercase text-slate-400">Current Velocity</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {currentSpeed} km/h
            </div>
            <span className="text-[10px] text-slate-500">Limit: {edge.speed_limit_kph} km/h</span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
            <span className="text-[10px] uppercase text-slate-400">Flow Density</span>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
              {telemetry ? Math.round(telemetry.congestion_index * 100) : 48}%
            </div>
            <span className="text-[10px] text-slate-500">
              {telemetry?.vehicle_count ?? 42} vpm
            </span>
          </div>
        </div>

        {/* Recharts Area Speed Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 font-mono">
              Speed Horizon (ST-GNN)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">t-15m ➔ t+30m</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#speedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Agent XAI Rationale & Factors */}
        {primaryDecision ? (
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                {primaryDecision.agent_id} Optimization
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400">
                {primaryDecision.decision_type.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Agent Rationale
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium">
                {primaryDecision.explanation_xai.rationale}
              </p>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Primary Decision Factors
              </div>
              <ul className="space-y-1">
                {primaryDecision.explanation_xai.primary_factors.map((factor, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono"
                  >
                    <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">ETA / Delay Improvement:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                -{primaryDecision.explanation_xai.expected_delay_reduction_pct}%
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 p-4 text-center text-xs text-slate-500">
            No active agent optimization required on this corridor.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <Button variant="outline" size="sm" onClick={resetSelection} className="w-full text-xs">
          Dismiss Inspector (Close)
        </Button>
      </div>
    </div>
  );
};

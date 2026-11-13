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
import { X, Cpu, Zap, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '../../components/ui';
import { useTrafficHud } from '../../context/TrafficHudContext';

interface AgentAuditDrawerProps {
  edge: GraphEdge | null;
  telemetry: EdgeTelemetry | null;
  forecast15?: EdgeForecastHorizon | null;
  forecast30?: EdgeForecastHorizon | null;
  decisions: AgentDecision[];
}

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

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Live Flow Speed
            </span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {currentSpeed} <span className="text-xs font-normal text-slate-400">kph</span>
            </div>
            <div className="text-[10px] text-slate-500">Limit: {edge.speed_limit_kph} kph</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Capacity Load
            </span>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
              {telemetry ? `${Math.round(telemetry.congestion_index * 100)}%` : '42%'}
            </div>
            <div className="text-[10px] text-slate-500">{edge.base_capacity} vph capacity</div>
          </div>
        </div>

        {/* Speed vs Time Recharts AreaChart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Velocity Horizon (Speed vs Time)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">kph</span>
          </div>

          <div className="h-44 w-full rounded-lg border border-slate-800 bg-slate-900/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

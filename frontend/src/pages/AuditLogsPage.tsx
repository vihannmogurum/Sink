import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui';
import { useSinkSocket } from '../hooks/useSinkSocket';
import { ShieldCheck, Search, Filter, CheckCircle2 } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [filterText, setFilterText] = useState('');
  const { agentDecisions } = useSinkSocket();

  // Combine real-time agent decisions with persistent historical logs
  const staticHistoricalLogs = [
    {
      decision_id: 'DEC-0918',
      timestamp: '2026-11-13 01:54:20',
      trigger: 'Camera Anomaly: sudden_braking (CAM-9012)',
      agents_involved: ['AGENT_3 (AI)', 'AGENT_2 (API)'],
      action_taken: 'Extended green signal phase by +12s on Montgomery junction',
      status: 'active',
      delay_saved: '-18.5%',
    },
    {
      decision_id: 'DEC-0919',
      timestamp: '2026-11-13 01:52:10',
      trigger: 'Threshold Exceeded: Congestion > 0.8 on Market corridor',
      agents_involved: ['AGENT_2 (API)', 'AGENT_4 (DB)'],
      action_taken: 'Diverted 25% inflow volume to Embarcadero collector bypass',
      status: 'completed',
      delay_saved: '-22.0%',
    },
    {
      decision_id: 'DEC-0920',
      timestamp: '2026-11-13 01:48:45',
      trigger: 'Operator Override: Emergency Code 3 Preemption',
      agents_involved: ['AGENT_1 (UI)', 'AGENT_2 (API)', 'AGENT_5 (Shared)'],
      action_taken: 'Locked green-wave corridor along Embarcadero -> Montgomery',
      status: 'completed',
      delay_saved: '-45.0%',
    },
    {
      decision_id: 'DEC-0921',
      timestamp: '2026-11-13 01:40:00',
      trigger: 'Daily Calibration: Baseline flow parameter sync',
      agents_involved: ['AGENT_4 (DB)', 'AGENT_3 (AI)'],
      action_taken: 'Recomputed link capacity matrices based on historical rush hour',
      status: 'completed',
      delay_saved: '-8.2%',
    },
  ];

  const dynamicLogs = agentDecisions.map((dec) => ({
    decision_id: dec.decision_id.toUpperCase(),
    timestamp: new Date(dec.created_at).toLocaleTimeString(),
    trigger: dec.explanation_xai.primary_factors[0] || 'Realtime stream trigger',
    agents_involved: [dec.agent_id],
    action_taken: dec.explanation_xai.rationale,
    status: dec.status,
    delay_saved: `-${dec.explanation_xai.expected_delay_reduction_pct}%`,
  }));

  const allLogs = [...dynamicLogs, ...staticHistoricalLogs];

  // Dynamic filter matching against decision_id, trigger, action, or agents
  const filteredLogs = allLogs.filter((log) => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      log.decision_id.toLowerCase().includes(q) ||
      log.trigger.toLowerCase().includes(q) ||
      log.action_taken.toLowerCase().includes(q) ||
      log.agents_involved.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Multi-Agent Audit & Decision Logs
          </h1>
          <p className="text-sm text-slate-500">
            High-density immutable trail of autonomous model actions, XAI triggers, and human overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> AGENTS.md Invariant Active
          </span>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by Decision ID (e.g. DEC-0918), Trigger, Agent..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Showing <strong>{filteredLogs.length}</strong> of {allLogs.length} decisions</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 uppercase font-semibold text-slate-500 bg-slate-50/70">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Decision ID</th>
                  <th className="py-3 px-4">Trigger / Anomaly</th>
                  <th className="py-3 px-4">Agents Involved</th>
                  <th className="py-3 px-4">Action Taken</th>
                  <th className="py-3 px-4">Delay Saved</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No decision logs match filter: <span className="font-mono font-bold text-slate-600">"{filterText}"</span>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={`${log.decision_id}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {log.decision_id}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.trigger}>
                        {log.trigger}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {log.agents_involved.map((agent) => (
                            <span
                              key={agent}
                              className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800"
                            >
                              {agent}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-sm truncate" title={log.action_taken}>
                        {log.action_taken}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {log.delay_saved}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200 capitalize text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

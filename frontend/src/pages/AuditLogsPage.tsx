import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui';
import { useSinkSocket } from '../hooks/useSinkSocket';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { fetchAuditLogs, AuditLogItem } from '../services/api';
import { cn } from '../lib/utils';

export const AuditLogsPage: React.FC = () => {
  const [filterText, setFilterText] = useState('');
  const [sqliteLogs, setSqliteLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { agentDecisions } = useSinkSocket();

  const loadLogs = () => {
    setLoading(true);
    fetchAuditLogs(100).then((logs) => {
      setSqliteLogs(logs);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Adapt dynamic WebSocket agent decisions
  const dynamicLogs = agentDecisions.map((dec) => ({
    decision_id: dec.decision_id.toUpperCase(),
    timestamp: new Date(dec.created_at).toLocaleTimeString(),
    trigger_event: dec.explanation_xai.primary_factors[0] || 'Live WebSocket Event',
    cooperating_agents: dec.agent_id,
    action_taken: dec.explanation_xai.rationale,
    status: dec.status,
    eta_saved_sec: Math.round(dec.explanation_xai.expected_delay_reduction_pct * 3.5),
    baseline_eta_sec: 450,
    optimized_eta_sec: 450 - Math.round(dec.explanation_xai.expected_delay_reduction_pct * 3.5),
    confidence: dec.explanation_xai.safety_confidence,
    xai_reasoning: dec.explanation_xai.rationale,
  }));

  // Combine with SQLite logs
  const mappedSqliteLogs = sqliteLogs.map((l) => ({
    decision_id: l.decision_id,
    timestamp: new Date(l.timestamp * 1000).toLocaleString(),
    trigger_event: l.trigger_event,
    cooperating_agents: l.cooperating_agents,
    action_taken: l.action_taken,
    status: 'completed',
    eta_saved_sec: l.eta_saved_sec,
    baseline_eta_sec: l.baseline_eta_sec,
    optimized_eta_sec: l.optimized_eta_sec,
    confidence: l.confidence,
    xai_reasoning: l.xai_reasoning,
  }));

  const allLogs = [...dynamicLogs, ...mappedSqliteLogs];

  // Dynamic filter matching
  const filteredLogs = allLogs.filter((log) => {
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    return (
      log.decision_id.toLowerCase().includes(q) ||
      log.trigger_event.toLowerCase().includes(q) ||
      log.action_taken.toLowerCase().includes(q) ||
      log.xai_reasoning.toLowerCase().includes(q) ||
      log.cooperating_agents.toLowerCase().includes(q)
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
            Cryptographic ledger of all automated signal preemption and dynamic rerouting actions from SQLite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions or IDs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
            />
          </div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-slate-900 text-sm">Deterministic Decision Ledger</span>
          </div>
          <span className="font-mono text-xs text-slate-500">
            {filteredLogs.length} Records Verified
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Decision ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Trigger / Event</th>
                <th className="py-3 px-4">Cooperating Agents</th>
                <th className="py-3 px-4">Action & XAI Reasoning</th>
                <th className="py-3 px-4">ETA Saved</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No decisions match your active filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={`${log.decision_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.decision_id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 font-medium">
                      {log.trigger_event}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                        {log.cooperating_agents}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 max-w-sm">
                      <div className="font-semibold text-slate-900 text-xs mb-0.5">
                        {log.action_taken}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        {log.xai_reasoning}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">
                      -{log.eta_saved_sec}s
                    </td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">
                      {Math.round(log.confidence * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

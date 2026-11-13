import React, { useState } from 'react';
import { AlertTriangle, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { injectIncident } from '../../services/api';
import { IncidentInjectionPayload } from '../../schemas/contracts';

interface ChaosDockProps {
  activeEdgeId?: string;
  onIncidentInjected: (incidentId: string, message: string) => void;
}

export const ChaosDock: React.FC<ChaosDockProps> = ({
  activeEdgeId = 'edge_emb_mont',
  onIncidentInjected,
}) => {
  const [loading, setLoading] = useState(false);

  const handleInject = async (type: IncidentInjectionPayload['type'], severity: IncidentInjectionPayload['severity']) => {
    setLoading(true);
    try {
      const res = await injectIncident({
        edge_id: activeEdgeId,
        type,
        severity,
        notes: `Chaos Dock trigger: ${type} [${severity}] at ${new Date().toLocaleTimeString()}`,
      });
      onIncidentInjected(res.incident_id, `Chaos Injected: ${type} on ${activeEdgeId} (${res.status})`);
    } catch (err) {
      console.error('Failed to trigger chaos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 rounded-xl bg-slate-950/90 backdrop-blur-md px-3.5 py-2 border border-slate-800 shadow-2xl select-none text-xs">
      <div className="flex items-center gap-1.5 font-mono font-bold text-rose-400 mr-2 border-r border-slate-800 pr-3">
        <Flame className="h-4 w-4 text-rose-500 animate-bounce" />
        <span>Chaos Engine</span>
      </div>

      <button
        onClick={() => handleInject('crash', 'critical')}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-semibold px-3 py-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Inject Crash</span>
      </button>

      <button
        onClick={() => handleInject('roadwork', 'medium')}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>Inject Roadwork</span>
      </button>

      <button
        onClick={() => handleInject('stall', 'low')}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
        <span>Inject Stall</span>
      </button>
    </div>
  );
};

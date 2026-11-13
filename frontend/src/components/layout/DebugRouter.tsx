import React from 'react';
import { useLocation } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const DebugRouter: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-md bg-slate-900/90 backdrop-blur px-2.5 py-1.5 text-xs font-mono text-emerald-400 border border-slate-700 shadow-lg select-none">
      <Terminal className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-slate-400">route:</span>
      <span className="font-semibold">{location.pathname}</span>
    </div>
  );
};

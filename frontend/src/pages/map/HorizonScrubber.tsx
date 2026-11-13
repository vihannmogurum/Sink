import React from 'react';
import { Siren, Clock, Radio } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTrafficHud } from '../../context/TrafficHudContext';

export type TimeHorizon = 'live' | '15m' | '30m';

interface HorizonScrubberProps {
  onDispatchEmergency: () => void;
  isEmergencyActive?: boolean;
}

export const HorizonScrubber: React.FC<HorizonScrubberProps> = ({
  onDispatchEmergency,
  isEmergencyActive = false,
}) => {
  const { horizon, setHorizon } = useTrafficHud();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 rounded-xl bg-slate-950/85 backdrop-blur-md p-1.5 border border-slate-800 shadow-2xl select-none">
      {/* Time Horizon Selector */}
      <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-1 border border-slate-800/80">
        <button
          onClick={() => setHorizon('live')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold font-mono transition-all',
            horizon === 'live'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
        >
          <Radio className="h-3 w-3 text-emerald-300" />
          <span>Live Now</span>
        </button>

        <button
          onClick={() => setHorizon('15m')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold font-mono transition-all',
            horizon === '15m'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
        >
          <Clock className="h-3 w-3 text-indigo-300" />
          <span>+15 Min</span>
        </button>

        <button
          onClick={() => setHorizon('30m')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold font-mono transition-all',
            horizon === '30m'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
        >
          <Clock className="h-3 w-3 text-purple-300" />
          <span>+30 Min</span>
        </button>
      </div>

      <div className="h-5 w-px bg-slate-800" />

      {/* Primary Dispatch Emergency Button */}
      <button
        onClick={onDispatchEmergency}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all shadow-md',
          isEmergencyActive
            ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        )}
      >
        <Siren className="h-3.5 w-3.5" />
        <span>{isEmergencyActive ? 'Corridor Active' : 'Dispatch Emergency'}</span>
      </button>
    </div>
  );
};

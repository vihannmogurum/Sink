import React from 'react';
import { Siren, Clock, Radio, X, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTrafficHud } from '../../context/TrafficHudContext';

export type TimeHorizon = 'live' | '15m' | '30m';

interface HorizonScrubberProps {
  onStartDispatchMode: () => void;
  isEmergencyActive?: boolean;
}

export const HorizonScrubber: React.FC<HorizonScrubberProps> = ({
  onStartDispatchMode,
  isEmergencyActive = false,
}) => {
  const {
    horizon,
    setHorizon,
    dispatchMode,
    selectedOrigin,
    selectedDestination,
    cancelDispatchMode,
  } = useTrafficHud();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 rounded-xl bg-slate-950/90 backdrop-blur-md p-1.5 border border-slate-800 shadow-2xl select-none">
      {/* Time Horizon Selector (Hidden or muted in dispatch selection mode) */}
      {!dispatchMode && (
        <>
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
        </>
      )}

      {/* Emergency Dispatch Button or Interactive Selection Prompt */}
      {!dispatchMode ? (
        <button
          onClick={onStartDispatchMode}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all shadow-md',
            isEmergencyActive
              ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          )}
        >
          <Siren className="h-3.5 w-3.5" />
          <span>{isEmergencyActive ? 'Corridor Active (Click to Re-route)' : 'Dispatch Emergency'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Guiding Prompt Pill */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold font-mono text-amber-300 animate-pulse">
            <MapPin className="h-4 w-4 text-amber-400" />
            <span>
              {!selectedOrigin
                ? 'Click map to select Origin Node...'
                : !selectedDestination
                ? 'Select Destination Node...'
                : 'Routing Emergency Corridor...'}
            </span>
          </div>

          {/* Cancel Selection Mode Button */}
          <button
            onClick={cancelDispatchMode}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 text-xs font-semibold font-mono border border-slate-700 transition-colors shadow-sm"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
};

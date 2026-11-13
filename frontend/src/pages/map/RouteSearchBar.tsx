import React, { useState } from 'react';
import { GraphTopology } from '../../schemas/contracts';
import { useTrafficHud } from '../../context/TrafficHudContext';
import {
  Navigation,
  MapPin,
  Siren,
  X,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface RouteSearchBarProps {
  graph: GraphTopology | null;
  onDispatchRoute: (originNodeId: string, destNodeId: string) => void;
  onClearRoute?: () => void;
  isEmergencyActive?: boolean;
}

export const RouteSearchBar: React.FC<RouteSearchBarProps> = ({
  graph,
  onDispatchRoute,
  onClearRoute,
  isEmergencyActive = false,
}) => {
  const {
    dispatchMode,
    setDispatchMode,
    selectedOrigin,
    setSelectedOrigin,
    selectedDestination,
    setSelectedDestination,
    cancelDispatchMode,
    triggerFlyTo,
  } = useTrafficHud();

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const nodes = graph?.nodes || [];

  const originNode = nodes.find((n) => n.node_id === selectedOrigin);
  const destNode = nodes.find((n) => n.node_id === selectedDestination);

  const filteredOriginNodes = nodes.filter((n) =>
    n.name.toLowerCase().includes(originQuery.toLowerCase()) ||
    n.zone.toLowerCase().includes(originQuery.toLowerCase())
  );

  const filteredDestNodes = nodes.filter((n) =>
    n.node_id !== selectedOrigin &&
    (n.name.toLowerCase().includes(destQuery.toLowerCase()) ||
     n.zone.toLowerCase().includes(destQuery.toLowerCase()))
  );

  const handleSelectOrigin = (nodeId: string) => {
    setSelectedOrigin(nodeId);
    setShowOriginDropdown(false);
    const node = nodes.find((n) => n.node_id === nodeId);
    if (node) {
      setOriginQuery(node.name);
      triggerFlyTo([node.coordinates.lat, node.coordinates.lng], nodeId);
    }
  };

  const handleSelectDest = (nodeId: string) => {
    setSelectedDestination(nodeId);
    setShowDestDropdown(false);
    const node = nodes.find((n) => n.node_id === nodeId);
    if (node) {
      setDestQuery(node.name);
    }
  };

  const handleUseCurrentLocation = () => {
    if (nodes.length > 0) {
      handleSelectOrigin(nodes[0].node_id);
    }
  };

  const handleExecuteDispatch = () => {
    if (selectedOrigin && selectedDestination) {
      onDispatchRoute(selectedOrigin, selectedDestination);
    }
  };

  const handleClearAll = () => {
    cancelDispatchMode();
    setOriginQuery('');
    setDestQuery('');
    if (onClearRoute) onClearRoute();
  };

  return (
    <div className="absolute top-20 right-4 z-[400] w-88 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 space-y-3 select-none text-xs text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono">
            Corridor Preemption Router
          </span>
        </div>
        {(selectedOrigin || selectedDestination || dispatchMode) && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Input Group */}
      <div className="space-y-2 relative">
        {/* Origin / Current Location Input */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <Navigation className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Current Location / Origin node..."
              value={originNode ? originNode.name : originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                if (selectedOrigin) setSelectedOrigin(null);
                setShowOriginDropdown(true);
              }}
              onFocus={() => {
                setShowOriginDropdown(true);
                setShowDestDropdown(false);
              }}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            {selectedOrigin ? (
              <button
                onClick={() => {
                  setSelectedOrigin(null);
                  setOriginQuery('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleUseCurrentLocation}
                title="Detect Nearest Grid Node"
                className="rounded bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 whitespace-nowrap border border-slate-700 transition-colors"
              >
                GPS
              </button>
            )}
          </div>

          {/* Origin Autocomplete Dropdown */}
          {showOriginDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 shadow-2xl z-50 divide-y divide-slate-800/60">
              {filteredOriginNodes.map((node) => (
                <div
                  key={node.node_id}
                  onClick={() => handleSelectOrigin(node.node_id)}
                  className="px-3 py-2 hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{node.name}</div>
                    <div className="text-[10px] text-slate-400">{node.zone} • {node.intersection_type}</div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">{node.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Location Input */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <input
              type="text"
              placeholder="Destination Location / Target node..."
              value={destNode ? destNode.name : destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                if (selectedDestination) setSelectedDestination(null);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                setShowDestDropdown(true);
                setShowOriginDropdown(false);
              }}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            {selectedDestination && (
              <button
                onClick={() => {
                  setSelectedDestination(null);
                  setDestQuery('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Destination Autocomplete Dropdown */}
          {showDestDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 shadow-2xl z-50 divide-y divide-slate-800/60">
              {filteredDestNodes.map((node) => (
                <div
                  key={node.node_id}
                  onClick={() => handleSelectDest(node.node_id)}
                  className="px-3 py-2 hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{node.name}</div>
                    <div className="text-[10px] text-slate-400">{node.zone} • {node.intersection_type}</div>
                  </div>
                  <span className="text-[9px] font-mono text-blue-400 uppercase">{node.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons & Map Point Selection Mode Toggle */}
      <div className="pt-1 flex items-center gap-2">
        <button
          onClick={() => {
            setDispatchMode(!dispatchMode);
            setShowOriginDropdown(false);
            setShowDestDropdown(false);
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold font-mono border transition-all',
            dispatchMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>{dispatchMode ? 'Click Map Mode ON' : 'Pick on Map'}</span>
        </button>

        <button
          disabled={!selectedOrigin || !selectedDestination}
          onClick={handleExecuteDispatch}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all shadow-md',
            selectedOrigin && selectedDestination
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          )}
        >
          <Siren className="h-3.5 w-3.5" />
          <span>Lock Wave</span>
        </button>
      </div>

      {/* Status Notice */}
      {isEmergencyActive && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-2 flex items-center gap-2 text-[10px] font-mono text-blue-300">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>Green Wave Preemption Corridor Active across Grid</span>
        </div>
      )}
    </div>
  );
};

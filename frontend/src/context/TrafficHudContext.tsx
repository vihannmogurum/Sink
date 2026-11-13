import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeHorizon } from '../pages/map/HorizonScrubber';

interface TrafficHudContextType {
  horizon: TimeHorizon;
  setHorizon: (horizon: TimeHorizon) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (edgeId: string | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  flyToCoords: [number, number] | null;
  triggerFlyTo: (coords: [number, number], edgeId?: string) => void;
  resetSelection: () => void;

  // Dynamic Dispatch Mode states
  dispatchMode: boolean;
  setDispatchMode: (mode: boolean) => void;
  selectedOrigin: string | null;
  setSelectedOrigin: (nodeId: string | null) => void;
  selectedDestination: string | null;
  setSelectedDestination: (nodeId: string | null) => void;
  cancelDispatchMode: () => void;
}

const TrafficHudContext = createContext<TrafficHudContextType | undefined>(undefined);

export const TrafficHudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [horizon, setHorizonState] = useState<TimeHorizon>('live');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

  // Dispatch selection mode state
  const [dispatchMode, setDispatchMode] = useState<boolean>(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const setHorizon = (newHorizon: TimeHorizon) => {
    console.log(`[TrafficHud] Forecast Horizon State Changed: ${newHorizon.toUpperCase()}`);
    setHorizonState(newHorizon);
  };

  const triggerFlyTo = (coords: [number, number], edgeId?: string) => {
    console.log(`[TrafficHud] triggerFlyTo at [${coords[0]}, ${coords[1]}], edge: ${edgeId}`);
    setFlyToCoords(coords);
    if (edgeId) {
      setSelectedEdgeId(edgeId);
      setIsDrawerOpen(true);
    }
  };

  const resetSelection = () => {
    console.log('[TrafficHud] Resetting active selection and closing drawer.');
    setSelectedEdgeId(null);
    setIsDrawerOpen(false);
  };

  const cancelDispatchMode = () => {
    console.log('[TrafficHud] Cancelling dispatch selection mode.');
    setDispatchMode(false);
    setSelectedOrigin(null);
    setSelectedDestination(null);
  };

  // Close drawer or cancel dispatch on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dispatchMode) {
          cancelDispatchMode();
        } else if (isDrawerOpen) {
          resetSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, dispatchMode]);

  return (
    <TrafficHudContext.Provider
      value={{
        horizon,
        setHorizon,
        selectedEdgeId,
        setSelectedEdgeId,
        isDrawerOpen,
        setIsDrawerOpen,
        flyToCoords,
        triggerFlyTo,
        resetSelection,
        dispatchMode,
        setDispatchMode,
        selectedOrigin,
        setSelectedOrigin,
        selectedDestination,
        setSelectedDestination,
        cancelDispatchMode,
      }}
    >
      {children}
    </TrafficHudContext.Provider>
  );
};

export const useTrafficHud = () => {
  const context = useContext(TrafficHudContext);
  if (!context) {
    throw new Error('useTrafficHud must be used within a TrafficHudProvider');
  }
  return context;
};

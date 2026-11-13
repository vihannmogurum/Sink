import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeHorizon } from '../pages/map/HorizonScrubber';

export type ActiveCity = 'Hyderabad Metropolitan Grid' | 'Cyberabad IT Corridor';

interface TrafficHudContextType {
  horizon: TimeHorizon;
  setHorizon: (horizon: TimeHorizon) => void;
  selectedCity: ActiveCity;
  setSelectedCity: (city: ActiveCity) => void;
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
  const [selectedCity, setSelectedCityState] = useState<ActiveCity>('Hyderabad Metropolitan Grid');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);

  // Dispatch selection mode state
  const [dispatchMode, setDispatchMode] = useState<boolean>(false);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const setSelectedCity = (city: ActiveCity) => {
    console.log(`[TrafficHud] City Sector Switched: ${city}`);
    setSelectedCityState(city);
    if (city === 'Cyberabad IT Corridor') {
      setFlyToCoords([17.4412, 78.3755]);
    } else {
      setFlyToCoords([17.4399, 78.4983]);
    }
  };

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
        selectedCity,
        setSelectedCity,
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

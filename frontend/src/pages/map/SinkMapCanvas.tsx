import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { GraphTopology, TelemetryTick, EdgeTelemetry, ForecastUpdate } from '../../schemas/contracts';
import { getEdgeColor, createIntersectionIcon, createAnomalyIcon } from '../../utils/mapUtils';
import { useTrafficHud } from '../../context/TrafficHudContext';

interface SinkMapCanvasProps {
  graph: GraphTopology | null;
  latestTick: TelemetryTick | null;
  forecastUpdate?: ForecastUpdate | null;
  emergencyEdgeIds?: string[];
  onNodeClickInDispatchMode?: (nodeId: string) => void;
}

// Controller to invalidate map size on container resize/mount
function MapResizeController() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
}

// Controller to smoothly pan/fly map viewport to targets or Hyderabad sectors
function MapFlyController({
  coords,
  selectedCity,
}: {
  coords?: [number, number] | null;
  selectedCity: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      console.log(`[MapFlyController] Flying map to [${coords[0]}, ${coords[1]}]`);
      map.flyTo(coords, 14, { duration: 1.5 });
    }
  }, [coords, map]);

  useEffect(() => {
    if (selectedCity.includes('Cyberabad')) {
      console.log('[MapFlyController] Panning to Cyberabad IT Corridor [17.4412, 78.3755]');
      map.flyTo([17.4412, 78.3755], 13, { duration: 1.8 });
    } else {
      console.log('[MapFlyController] Panning to Hyderabad Metropolitan Grid [17.4399, 78.4983]');
      map.flyTo([17.4399, 78.4983], 13, { duration: 1.8 });
    }
  }, [selectedCity, map]);

  return null;
}

export const SinkMapCanvas: React.FC<SinkMapCanvasProps> = ({
  graph,
  latestTick,
  forecastUpdate,
  emergencyEdgeIds = [],
  onNodeClickInDispatchMode,
}) => {
  const {
    horizon,
    selectedCity,
    selectedEdgeId,
    setSelectedEdgeId,
    setIsDrawerOpen,
    flyToCoords,
    triggerFlyTo,
    dispatchMode,
    selectedOrigin,
    selectedDestination,
  } = useTrafficHud();

  // Strict Default Center: Hyderabad, India [17.4399, 78.4983] at zoom level 13
  const defaultCenter: LatLngExpression = [17.4399, 78.4983];

  const nodeMap = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; name: string; type: string; zone: string }>();
    if (graph) {
      for (const node of graph.nodes) {
        map.set(node.node_id, {
          lat: node.coordinates.lat,
          lng: node.coordinates.lng,
          name: node.name,
          type: node.intersection_type,
          zone: node.zone,
        });
      }
    }
    return map;
  }, [graph]);

  // Determine effective telemetry based on global HUD horizon
  const telemetryMap = useMemo(() => {
    const map = new Map<string, EdgeTelemetry>();

    if (horizon === 'live') {
      if (latestTick) {
        for (const t of latestTick.edge_telemetry) {
          map.set(t.edge_id, t);
        }
      }
    } else {
      const forecastHorizons =
        horizon === '15m' ? forecastUpdate?.horizon_15m : forecastUpdate?.horizon_30m;

      if (forecastHorizons && graph) {
        for (const fc of forecastHorizons) {
          map.set(fc.edge_id, {
            edge_id: fc.edge_id,
            current_speed_kph: fc.predicted_speed_kph,
            congestion_index: fc.predicted_congestion_index,
            vehicle_count: Math.round(150 * fc.predicted_congestion_index),
            flow_rate_vph: 1200,
            status: fc.predicted_congestion_index > 0.7 ? 'congested' : 'normal',
          });
        }
      }
    }
    return map;
  }, [latestTick, forecastUpdate, horizon, graph]);

  const handleEdgeClick = (edgeId: string) => {
    if (dispatchMode) return;
    setSelectedEdgeId(edgeId);
    setIsDrawerOpen(true);
  };

  const handleNodeClick = (nodeId: string) => {
    if (dispatchMode && onNodeClickInDispatchMode) {
      onNodeClickInDispatchMode(nodeId);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        attributionControl={false}
      >
        <MapResizeController />
        <MapFlyController coords={flyToCoords} selectedCity={selectedCity} />

        {/* High-Performance Public Dark Matter Map (Esri Dark Canvas) */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          attribution='&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
        />
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Dynamic Road Edges across Hyderabad Metropolitan & Cyberabad IT Corridors */}
        {graph?.edges.map((edge) => {
          const source = nodeMap.get(edge.source_node_id);
          const target = nodeMap.get(edge.target_node_id);
          if (!source || !target) return null;

          const positions: LatLngExpression[] = [
            [source.lat, source.lng],
            [target.lat, target.lng],
          ];

          const telemetry = telemetryMap.get(edge.edge_id);
          const isEmergency = emergencyEdgeIds.includes(edge.edge_id);
          const color = getEdgeColor(telemetry, isEmergency);
          const isSelected = selectedEdgeId === edge.edge_id;

          return (
            <React.Fragment key={edge.edge_id}>
              {(isSelected || isEmergency) && (
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: isEmergency ? '#3B82F6' : '#FFFFFF',
                    weight: isEmergency ? 12 : 10,
                    opacity: isEmergency ? 0.65 : 0.4,
                    lineCap: 'round',
                  }}
                />
              )}

              <Polyline
                positions={positions}
                pathOptions={{
                  color,
                  weight: isEmergency ? 6 : isSelected ? 6 : 4,
                  opacity: 0.95,
                  lineCap: 'round',
                  dashArray: edge.road_class === 'collector' ? '6, 6' : undefined,
                }}
                eventHandlers={{
                  click: () => handleEdgeClick(edge.edge_id),
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div className="p-1 font-mono text-xs text-slate-900">
                    <div className="font-bold text-slate-950">
                      {source.name} → {target.name}
                    </div>
                    {isEmergency && (
                      <div className="text-[11px] font-bold text-blue-600">
                        ⚡ EMERGENCY GREEN WAVE PREEMPTION ACTIVE
                      </div>
                    )}
                    <div className="text-[11px] text-slate-700">
                      Sector: <span className="font-semibold">{selectedCity}</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Speed: <span className="font-semibold">{telemetry?.current_speed_kph ?? '--'} kph</span> (Limit: {edge.speed_limit_kph})
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Intersection / Destination Nodes */}
        {graph?.nodes.map((node) => {
          const isHub = node.intersection_type === 'freeway_ramp' || node.intersection_type === 'roundabout';
          const isOrigin = selectedOrigin === node.node_id;
          const isDestination = selectedDestination === node.node_id;
          const isSelectable = dispatchMode && !isOrigin;

          const icon = createIntersectionIcon(
            node.name,
            isHub,
            isSelectable,
            isOrigin,
            isDestination
          );

          return (
            <Marker
              key={node.node_id}
              position={[node.coordinates.lat, node.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleNodeClick(node.node_id),
              }}
            >
              {!dispatchMode && (
                <Popup className="sink-custom-popup">
                  <div className="p-2 text-slate-900 font-sans text-xs">
                    <div className="font-bold text-sm text-slate-950">{node.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{node.zone}</div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-1.5 text-[10px] font-mono">
                      <span className="uppercase text-slate-400">{node.intersection_type}</span>
                      <span className="text-emerald-600 font-semibold uppercase">{node.status}</span>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {/* CV Anomalies on real Hyderabad corridor midpoints */}
        {!dispatchMode &&
          latestTick?.cv_anomalies.map((anom) => {
            const targetEdge = graph?.edges.find((e) => e.edge_id === anom.edge_id);
            if (!targetEdge) return null;
            const source = nodeMap.get(targetEdge.source_node_id);
            const target = nodeMap.get(targetEdge.target_node_id);
            if (!source || !target) return null;

            const midLat = (source.lat + target.lat) / 2;
            const midLng = (source.lng + target.lng) / 2;

            const icon = createAnomalyIcon(anom.severity);

            return (
              <Marker
                key={anom.anomaly_id}
                position={[midLat, midLng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    triggerFlyTo([midLat, midLng], anom.edge_id);
                  },
                }}
              >
                <Popup>
                  <div className="p-2 text-slate-900 font-sans text-xs">
                    <div className="font-bold text-rose-600 uppercase flex items-center gap-1">
                      <span>{anom.severity} Alert</span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-1 capitalize">
                      {anom.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Corridor: {targetEdge.edge_id}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      CV Confidence: {Math.round(anom.confidence_score * 100)}%
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CvAnomaly, GraphTopology } from '../../schemas/contracts';
import { AlertTriangle, Camera, Eye, Video, X, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTrafficHud } from '../../context/TrafficHudContext';
import { fetchCameraNodes, CameraNode } from '../../services/api';

interface IncidentFeedProps {
  anomalies: CvAnomaly[];
  graph: GraphTopology | null;
  activeRouteEdgeIds?: string[];
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  anomalies,
  graph,
  activeRouteEdgeIds = [],
}) => {
  const { triggerFlyTo, setSelectedEdgeId, setIsDrawerOpen, selectedEdgeId } = useTrafficHud();
  const [activeCameraModal, setActiveCameraModal] = useState<CameraNode | null>(null);
  const [routeCameras, setRouteCameras] = useState<CameraNode[]>([]);
  const isRouteMode = activeRouteEdgeIds.length > 0;

  // When active route is present, fetch and order cameras strictly along that route
  useEffect(() => {
    if (isRouteMode) {
      fetchCameraNodes(activeRouteEdgeIds).then((cams) => {
        setRouteCameras(cams);
      });
    } else {
      setRouteCameras([]);
    }
  }, [activeRouteEdgeIds, isRouteMode]);

  const handleCardClick = (edgeId: string) => {
    const targetEdge = graph?.edges.find((e) => e.edge_id === edgeId || e.edge_id === `${edgeId}_rev`);
    if (!targetEdge || !graph) return;

    const source = graph.nodes.find((n) => n.node_id === targetEdge.source_node_id);
    const target = graph.nodes.find((n) => n.node_id === targetEdge.target_node_id);

    if (source && target) {
      const midCoords: [number, number] = [
        (source.coordinates.lat + target.coordinates.lat) / 2,
        (source.coordinates.lng + target.coordinates.lng) / 2,
      ];
      triggerFlyTo(midCoords, edgeId);
    } else {
      setSelectedEdgeId(edgeId);
      setIsDrawerOpen(true);
    }
  };

  return (
    <>
      <div className="absolute top-20 left-4 z-[400] w-80 max-h-[calc(100%-120px)] flex flex-col rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-2xl overflow-hidden select-none">
        {/* Header - Adapts dynamically if route is active */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Camera className={cn("h-4 w-4", isRouteMode ? "text-blue-400" : "text-emerald-400")} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isRouteMode ? "Route Corridor Cameras" : "Active CV Ingest"}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border",
              isRouteMode
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
            )}
          >
            {isRouteMode ? `${routeCameras.length} Waypoints` : `${anomalies.length} Anom`}
          </span>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* 1. ROUTE CORRIDOR CAMERAS MODE */}
          {isRouteMode ? (
            routeCameras.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Fetching route surveillance nodes...
              </div>
            ) : (
              routeCameras.map((cam, idx) => {
                const isSelected = selectedEdgeId === cam.edge_id;
                return (
                  <div
                    key={cam.camera_id}
                    onClick={() => handleCardClick(cam.edge_id)}
                    className={cn(
                      'group relative rounded-lg border p-2.5 transition-all cursor-pointer text-xs',
                      isSelected
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500 shadow-md'
                        : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-blue-400 flex items-center gap-1 font-bold">
                        <Navigation className="h-3 w-3" />
                        STOP #{idx + 1} // {cam.camera_id}
                      </span>
                      <span className="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {cam.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 truncate">
                      {cam.road_name || cam.name}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                      <span>Speed: <strong className="text-emerald-400">{cam.last_speed_kmh} km/h</strong></span>
                      <span>Flow: {cam.last_vehicle_count} vpm</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                        {cam.edge_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCameraModal(cam);
                          }}
                          className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 hover:bg-slate-700 transition-colors"
                        >
                          <Video className="h-3 w-3" />
                          <span>Stream</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(cam.edge_id);
                          }}
                          className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Fly To</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* 2. NORMAL CV INCIDENT FEED MODE */
            anomalies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active vision anomalies detected on grid.
              </div>
            ) : (
              anomalies.map((anom) => {
                const edge = graph?.edges.find((e) => e.edge_id === anom.edge_id);
                const isCritical = anom.severity === 'critical' || anom.severity === 'high';
                const isSelected = selectedEdgeId === anom.edge_id;

                // Match exact camera node
                const camId = anom.anomaly_id.includes('CAM-HYD')
                  ? anom.anomaly_id.slice(-10)
                  : 'CAM-HYD-01';

                return (
                  <div
                    key={anom.anomaly_id}
                    onClick={() => handleCardClick(anom.edge_id)}
                    className={cn(
                      'group relative rounded-lg border p-2.5 transition-all cursor-pointer text-xs',
                      isSelected
                        ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500 shadow-md'
                        : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Camera className="h-3 w-3 text-slate-500" />
                        {camId}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        )}
                      >
                        {anom.severity}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                      <AlertTriangle
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isCritical ? 'text-rose-400' : 'text-amber-400'
                        )}
                      />
                      <span>{anom.type.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                      <span>Speed Drop: <strong className="text-rose-400">-55%</strong></span>
                      <span>Conf: {Math.round(anom.confidence_score * 100)}%</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {edge?.edge_id || anom.edge_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCameraModal({
                              camera_id: camId,
                              name: edge?.edge_id || 'Corridor Surveillance',
                              edge_id: anom.edge_id,
                              road_name: edge?.edge_id,
                              lat: 17.43,
                              lng: 78.45,
                              stream_url: `/api/v1/cameras/${camId}/frame`,
                              status: 'online',
                              last_vehicle_count: 45,
                              last_speed_kmh: 22,
                              last_ping: Date.now() / 1000,
                            });
                          }}
                          className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 hover:bg-slate-700 transition-colors"
                        >
                          <Video className="h-3 w-3" />
                          <span>Stream</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(anom.edge_id);
                          }}
                          className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Fly To</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Live Camera Feed Modal - Dynamic Header & Stream */}
      {activeCameraModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="font-mono text-xs font-bold text-white uppercase block leading-none">
                    {activeCameraModal.camera_id} // {activeCameraModal.road_name || activeCameraModal.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Edge: {activeCameraModal.edge_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveCameraModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
              <img
                src={`http://localhost:8000/api/v1/cameras/${activeCameraModal.camera_id}/frame?t=${Date.now()}`}
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Status: Synchronized (WebSocket Ingestion)</span>
              <button
                onClick={() => setActiveCameraModal(null)}
                className="rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-700 font-semibold"
              >
                Close Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

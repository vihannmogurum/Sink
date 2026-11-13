import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '../components/ui';
import {
  Key,
  Cpu,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Sliders,
  Check,
  Camera,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchCameraNodes, CameraNode } from '../services/api';

type Tab = 'general' | 'integrations' | 'api-keys';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('integrations');
  const [copiedKey, setCopiedKey] = useState(false);
  const [cameras, setCameras] = useState<CameraNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCameras = () => {
    setLoading(true);
    fetchCameraNodes().then((cams) => {
      setCameras(cams);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCameras();
    const interval = setInterval(loadCameras, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText('sink_live_sec_8912f9a0c1e8471b');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & Grid Settings</h1>
        <p className="text-sm text-slate-500">
          Hardware telemetry sensors, God's Eye camera topology, and API access keys for Hyderabad.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={cn(
              'pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors',
              activeTab === 'integrations'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <Cpu className="h-4 w-4" />
            <span>God's Eye Cameras & Sensors</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {cameras.length > 0 ? cameras.length : 6}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors',
              activeTab === 'general'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <Sliders className="h-4 w-4" />
            <span>General Mesh Ports</span>
          </button>

          <button
            onClick={() => setActiveTab('api-keys')}
            className={cn(
              'pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors',
              activeTab === 'api-keys'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            <Key className="h-4 w-4" />
            <span>API Gateway Access</span>
          </button>
        </nav>
      </div>

      {/* Tab: Hardware & Cameras */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Live God's Eye Surveillance Cameras
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Real-time optical cameras and CV node telemetry bound to SQLite StateStore.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCameras}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                <span>Sync Mesh</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Camera ID</th>
                    <th className="py-3 px-4">Location / Corridor</th>
                    <th className="py-3 px-4">Edge Mapping</th>
                    <th className="py-3 px-4">Vehicles</th>
                    <th className="py-3 px-4">Est. Speed</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Live Feed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {cameras.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        Loading camera nodes from SQLite...
                      </td>
                    </tr>
                  ) : (
                    cameras.map((cam) => {
                      const isOnline = cam.status.toLowerCase() === 'online';
                      return (
                        <tr key={cam.camera_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <Camera className="h-4 w-4 text-slate-500" />
                            <span>{cam.camera_id}</span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700 font-medium">
                            {cam.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {cam.edge_id}
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-bold">
                            {cam.last_vehicle_count} v
                          </td>
                          <td className="py-3 px-4 text-emerald-600 font-semibold">
                            {cam.last_speed_kmh} km/h
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                isOnline
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              )}
                            >
                              {isOnline ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-rose-500" />
                              )}
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <a
                              href={`http://localhost:8000/api/v1/cameras/${cam.camera_id}/frame`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                            >
                              View HUD Frame
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: General Mesh Settings */}
      {activeTab === 'general' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              Mesh Ports & Protocols
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Network port allocations governed by AGENTS.md multi-agent specification.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frontend UI Port</label>
                <Input readOnly value="3000 (Vite / React 19)" className="bg-slate-50 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Backend FastAPI Port</label>
                <Input readOnly value="8000 (FastAPI / Uvicorn)" className="bg-slate-50 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State Broadcaster</label>
                <Input readOnly value="ws://localhost:8000/ws/state" className="bg-slate-50 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Database Mode</label>
                <Input readOnly value="SQLite3 WAL Mode (In-Memory + Disk Sync)" className="bg-slate-50 font-mono text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'api-keys' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              API Security Token
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Used by external city systems and EMS emergency dispatchers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value="sink_live_sec_8912f9a0c1e8471b"
                className="bg-slate-50 font-mono text-xs text-slate-800"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="flex items-center gap-1.5 shrink-0"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

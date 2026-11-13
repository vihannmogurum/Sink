import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '../components/ui';
import {
  Server,
  Key,
  Cpu,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'general' | 'integrations' | 'api-keys';

interface HardwareSensor {
  id: string;
  name: string;
  type: 'Optical Camera' | 'Inductive Loop' | 'Radar Velocity' | 'Signal Controller';
  location: string;
  ip: string;
  status: 'Online' | 'Offline';
  latency_ms: number;
}

const hardwareDevices: HardwareSensor[] = [
  {
    id: 'CAM-SF-01',
    name: 'Market & 4th Wide-Angle Vision',
    type: 'Optical Camera',
    location: 'Intersection Market St / 4th St',
    ip: '192.168.10.24',
    status: 'Online',
    latency_ms: 14,
  },
  {
    id: 'CAM-SF-02',
    name: 'Montgomery Arterial PTZ',
    type: 'Optical Camera',
    location: 'Montgomery Financial Transit Corridor',
    ip: '192.168.10.25',
    status: 'Online',
    latency_ms: 18,
  },
  {
    id: 'LOOP-SF-08',
    name: 'Embarcadero South Inductive Array',
    type: 'Inductive Loop',
    location: 'Embarcadero Corridor Node 1',
    ip: '192.168.12.102',
    status: 'Online',
    latency_ms: 6,
  },
  {
    id: 'RAD-SF-04',
    name: 'Powell Cable Junction Doppler',
    type: 'Radar Velocity',
    location: 'Powell Cable Turnaround',
    ip: '192.168.12.115',
    status: 'Offline',
    latency_ms: 0,
  },
  {
    id: 'CTRL-SF-14',
    name: 'Civic Center Master Phase Controller',
    type: 'Signal Controller',
    location: 'Civic Center Plaza Ramp',
    ip: '192.168.15.8',
    status: 'Online',
    latency_ms: 9,
  },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('integrations');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText('sk_sink_prod_89fa943bd94112e8b093');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Infrastructure Settings</h1>
        <p className="text-sm text-slate-500">
          Manage hardware telemetry integrations, distributed mesh ports, and developer access keys.
        </p>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all -mb-px',
            activeTab === 'general'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Sliders className="h-4 w-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={cn(
            'flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all -mb-px',
            activeTab === 'integrations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Cpu className="h-4 w-4" />
          <span>Integrations (Hardware & Sensors)</span>
        </button>

        <button
          onClick={() => setActiveTab('api-keys')}
          className={cn(
            'flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all -mb-px',
            activeTab === 'api-keys'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Key className="h-4 w-4" />
          <span>API Keys</span>
        </button>
      </div>

      {/* Tab: Integrations (Hardware / Sensors) */}
      {activeTab === 'integrations' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Connected Field Hardware</CardTitle>
              <CardDescription className="text-xs">
                Real-time optical cameras, inductive loops, and signal phase controllers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 font-semibold border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                4 Online
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700 font-semibold border border-rose-200">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                1 Offline
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 uppercase font-semibold text-slate-500 bg-slate-50/70">
                  <tr>
                    <th className="py-3 px-4">Device ID</th>
                    <th className="py-3 px-4">Sensor / Unit Name</th>
                    <th className="py-3 px-4">Device Class</th>
                    <th className="py-3 px-4">Intersection Location</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hardwareDevices.map((dev) => {
                    const isOnline = dev.status === 'Online';
                    return (
                      <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {dev.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {dev.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {dev.type}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {dev.location}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {dev.ip}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {isOnline ? `${dev.latency_ms} ms` : '--'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                              isOnline
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            )}
                          >
                            {isOnline ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Online
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                Offline
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: General Settings */}
      {activeTab === 'general' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-base font-semibold">Multi-Agent Service Endpoints</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Port bindings and cluster coordinates strictly adhering to AGENT_SYNC.md
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="AGENT_1 Frontend Territory (Port 3000)"
                defaultValue="http://localhost:3000"
                readOnly
                className="bg-slate-50 font-mono text-emerald-700"
              />
              <Input
                label="AGENT_2 Core REST/WS Gateway (Port 8000)"
                defaultValue="http://localhost:8000"
                className="font-mono"
              />
              <Input
                label="AGENT_3 AI Engine Cluster (Port 8001)"
                defaultValue="http://localhost:8001"
                className="font-mono"
              />
              <Input
                label="AGENT_4 Database & Redis (Port 5432 / 6379)"
                defaultValue="postgresql://localhost:5432"
                className="font-mono"
              />
            </div>
            <div className="pt-2">
              <Button size="sm">Save General Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'api-keys' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-slate-700" />
              <CardTitle className="text-base font-semibold">Service Access Credentials</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Bearer tokens utilized for cross-agent REST requests and secure WebSocket ingestion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Production Ingest Secret</span>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value="sk_sink_prod_89fa943bd94112e8b093"
                  readOnly
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800"
                />
                <Button size="sm" variant="outline" onClick={handleCopyKey} className="shrink-0 gap-1.5 text-xs">
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button size="sm" variant="secondary" className="shrink-0 gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Roll Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

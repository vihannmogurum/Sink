import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { Radio, Lock, ArrowRight, Zap, Activity } from 'lucide-react';
import { z } from 'zod';
import { fetchLiveKpis, SystemKpis } from '../services/api';
import { useSinkSocket } from '../hooks/useSinkSocket';

const loginSchema = z.object({
  role: z.enum(['AGENT_1', 'AGENT_2', 'AGENT_3', 'AGENT_4', 'AGENT_5']),
  jurisdiction: z.enum(['Hyderabad Metropolitan Grid', 'Cyberabad IT Corridor']),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'AGENT_1' | 'AGENT_2' | 'AGENT_3' | 'AGENT_4' | 'AGENT_5'>('AGENT_1');
  const [jurisdiction, setJurisdiction] = useState<'Hyderabad Metropolitan Grid' | 'Cyberabad IT Corridor'>('Hyderabad Metropolitan Grid');
  const [email, setEmail] = useState('rohith@sink.local');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const { liveKpis: socketKpis } = useSinkSocket();
  const [kpis, setKpis] = useState<SystemKpis>({
    active_signals_synced: 7,
    avg_eta_savings_pct: 36.8,
    detection_latency_ms: 38.5,
    intersection_throughput_gain_pct: 22.4,
    active_incidents_count: 0,
    hourly_incident_distribution: [],
    timestamp: Date.now() / 1000,
  });

  useEffect(() => {
    fetchLiveKpis().then((data) => {
      if (data) setKpis(data);
    });
  }, []);

  const activeKpis = socketKpis || kpis;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ role, jurisdiction, email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'email') {
          fieldErrors.email = issue.message;
        } else if (issue.path[0] === 'password') {
          fieldErrors.password = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    navigate('/app/map');
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-100">
      {/* Left Column: Clean Authentication Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 lg:px-20 bg-white shadow-xl z-10">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Brand header */}
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Radio className="h-5 w-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to Sink OS
            </h1>
            <p className="text-xs text-slate-500">
              Autonomous Urban Grid & Real-Time Traffic Orchestration for Hyderabad
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Primary Jurisdiction Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Urban Grid Focus
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
              >
                <option value="Hyderabad Metropolitan Grid">Hyderabad Metropolitan Grid (Central Arterials)</option>
                <option value="Cyberabad IT Corridor">Cyberabad IT Corridor (Hitec City & Gachibowli)</option>
              </select>
            </div>

            {/* Operator Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Agent Designation
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
              >
                <option value="AGENT_1">AGENT_1 (UI / Geospatial Deck)</option>
                <option value="AGENT_2">AGENT_2 (API & Preemption Routing)</option>
                <option value="AGENT_3">AGENT_3 (God's Eye Vision & ST-GNN)</option>
                <option value="AGENT_4">AGENT_4 (SQLite State & KPI Engine)</option>
                <option value="AGENT_5">AGENT_5 (Multi-Agent Orchestrator)</option>
              </select>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Operator ID (Email)
              </label>
              <Input
                type="email"
                placeholder="name@sink.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-slate-300 text-slate-900"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Access Key
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Demo: password123</span>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-slate-300 text-slate-900"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              <span>Authenticate Operator Session</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Help */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Full-Stack Multi-Agent Node Access</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Role permissions and telemetry ingestion boundaries are mapped automatically per AGENTS.md.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Dark Tactical Ambient Display with LIVE COMPUTED BENCHMARKS */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Ambient background grid pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #38bdf8 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SINK MESH ENGINE // LIVE KERNEL ACTIVE</span>
          </div>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 font-mono text-xs text-slate-300 border border-slate-700">
            {jurisdiction}
          </span>
        </div>

        {/* Center Live Benchmarks */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Autonomous Urban Flow at Machine Speed
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time vector orchestration dynamically coordinating phase timing across Punjagutta Flyover, Banjara Hills Road No. 2, and trauma preemption corridors to Apollo Hospital Jubilee Hills.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-mono uppercase font-bold">CV Latency p99</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {activeKpis.detection_latency_ms} ms
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Real-time God's Eye CV loop</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-mono uppercase font-bold">ETA Savings</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                -{activeKpis.avg_eta_savings_pct}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dynamic A* vs Dijkstra Free-flow</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Active Signal Nodes Synced</span>
              <span className="text-emerald-400 font-bold">{activeKpis.active_signals_synced} Intersections</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Throughput Improvement</span>
              <span className="text-blue-400 font-bold">+{activeKpis.intersection_throughput_gain_pct}% Flow</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Active Incidents Resolved</span>
              <span className="text-purple-400 font-bold">{activeKpis.active_incidents_count} Mitigated</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Sink Autonomous Fleet v0.4 (Full-Stack)</span>
          <span>Hyderabad Metropolitan Certified Contracts</span>
        </div>
      </div>
    </div>
  );
};

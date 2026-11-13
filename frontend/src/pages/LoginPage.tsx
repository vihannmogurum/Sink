import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { Radio, Lock, ArrowRight, Zap, Activity } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  role: z.enum(['AGENT_1', 'AGENT_2', 'AGENT_3', 'AGENT_4', 'AGENT_5']),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'AGENT_1' | 'AGENT_2' | 'AGENT_3' | 'AGENT_4' | 'AGENT_5'>('AGENT_1');
  const [email, setEmail] = useState('rohith@sink.local');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ role, email, password });
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
      return; // Do not submit
    }

    // Valid authentication
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
              Autonomous Traffic & Real-Time Urban Grid Orchestration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Operator Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Agent Designation
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium"
              >
                <option value="AGENT_1">AGENT_1 (Rohith — Frontend /apps/web, Port 3000)</option>
                <option value="AGENT_2">AGENT_2 (Vihann — Core API /apps/api, Port 8000)</option>
                <option value="AGENT_3">AGENT_3 (Madhu — AI Engine /packages/ai-engine, Port 8001)</option>
                <option value="AGENT_4">AGENT_4 (Mansi — Database /packages/database, Port 5432)</option>
                <option value="AGENT_5">AGENT_5 (Shloka — Shared Types & QA, Port 3001)</option>
              </select>
            </div>

            <Input
              label="Operator Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              placeholder="agent@sink.local"
            />

            <Input
              label="Session Security Token"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              placeholder="Enter secure token"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-emerald-600" /> Verified Territory Lock
              </span>
              <span className="font-mono text-slate-400">Strict snake_case</span>
            </div>

            <Button type="submit" className="w-full justify-center gap-2 mt-2">
              <span>Enter Command Grid</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Protected under Sink Multi-Agent Protocol & AGENTS.md
          </div>
        </div>
      </div>

      {/* Right Column: System Status / Benchmark Telemetry Display */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

        {/* Top Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>5-AGENT MESH ACTIVE</span>
          </div>
          <span className="font-mono text-xs text-slate-400">SAN FRANCISCO METRO GRID</span>
        </div>

        {/* Center Live Benchmarks */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Autonomous Urban Flow at Machine Speed
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time vector orchestration dynamically adjusting phase timing, routing corridors, and preemption waves with zero human latency.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-mono uppercase font-bold">Latency p99</span>
              </div>
              <div className="text-2xl font-bold font-mono">18.4 ms</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Distributed cross-module bus</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-mono uppercase font-bold">Throughput</span>
              </div>
              <div className="text-2xl font-bold font-mono">128k vph</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Real-time edge ingestion</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>AGENT_1 (UI / Router)</span>
              <span className="text-emerald-400 font-bold">Port 3000 Active</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>AGENT_2 (Gateway / WS)</span>
              <span className="text-indigo-400 font-bold">Port 8000 Standby</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>AGENT_3 (AI Transformer)</span>
              <span className="text-purple-400 font-bold">Port 8001 Standby</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Sink Autonomous Fleet v0.1</span>
          <span>Zero Unilateral Mutation Rule</span>
        </div>
      </div>
    </div>
  );
};

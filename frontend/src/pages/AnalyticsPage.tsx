import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Calendar,
} from 'lucide-react';

const incidentTimeData = [
  { hour: '00:00', incidents: 3, resolvedByAi: 3 },
  { hour: '03:00', incidents: 1, resolvedByAi: 1 },
  { hour: '06:00', incidents: 8, resolvedByAi: 7 },
  { hour: '09:00', incidents: 26, resolvedByAi: 24 },
  { hour: '12:00', incidents: 18, resolvedByAi: 17 },
  { hour: '15:00', incidents: 22, resolvedByAi: 20 },
  { hour: '18:00', incidents: 34, resolvedByAi: 31 },
  { hour: '21:00', incidents: 12, resolvedByAi: 11 },
];

const latencyTrends = [
  { day: 'Mon', p50: 12, p99: 44 },
  { day: 'Tue', p50: 14, p99: 41 },
  { day: 'Wed', p50: 11, p99: 38 },
  { day: 'Thu', p50: 13, p99: 42 },
  { day: 'Fri', p50: 15, p99: 49 },
  { day: 'Sat', p50: 9, p99: 28 },
  { day: 'Sun', p50: 8, p99: 25 },
];

export const AnalyticsPage: React.FC = () => {
  // Force a window resize event on mount to guarantee Recharts SVG layouts align cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historical Fleet Analytics</h1>
          <p className="text-sm text-slate-500">
            Cross-grid metrics, agent autonomous optimization outcomes, and incident time horizons.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">Trailing 7 Days</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600 font-semibold">Mesh Synced</span>
        </div>
      </div>

      {/* KPI Metrics Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Avg ETA Delay Savings
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>-22.4%</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardTitle>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              +4.1% efficiency vs static signal timing
            </p>
          </CardHeader>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Intersections Optimized
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>184 Signals</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-1">
              Across 5 grid sectors in San Francisco
            </p>
          </CardHeader>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Mean Time to Clearance
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>4.2 min</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-1">
              Autonomous green-wave preemption active
            </p>
          </CardHeader>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4">
            <CardDescription className="text-xs uppercase font-semibold text-slate-400">
              Autonomous Safety Score
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>99.8%</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardTitle>
            <p className="text-[11px] text-slate-500 mt-1">
              Zero safety override disengagements
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Main Wide Recharts BarChart: Incidents by Time of Day */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Incidents by Time of Day & AI Resolution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Correlates rush hour bottlenecks with AGENT_3 & AGENT_2 mitigation interventions
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded bg-slate-800" /> Total Hazards
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Autonomous Clearance
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="incidents" name="Total Incidents" fill="#1E293B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedByAi" name="Autonomous AI Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-base font-semibold">Corridor Latency Percentiles (p50 / p99)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Transit delay tail distributions across core arterial sectors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Autonomous Intervention Breakdown</CardTitle>
            <CardDescription className="text-xs">Distribution of multi-agent decisions across modules</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Signal Timing Adaptive Adjustments</span>
                <span>64%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Dynamic Arterial Bypass Reroutes</span>
                <span>24%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Emergency Green-Wave Preemptions</span>
                <span>12%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

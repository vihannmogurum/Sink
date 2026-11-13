import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Building2, 
  Mail, 
  KeyRound, 
  Radio,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { loginUser, getCurrentUser } from '../services/api';

type UserRole = 'Traffic Operator' | 'EMS Dispatcher' | 'System Admin';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // If already logged in, redirect to app
  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) {
      navigate('/app/map');
    }
  }, [navigate]);

  const [role, setRole] = useState<UserRole>('Traffic Operator');
  const [email, setEmail] = useState('operator@hyderabad.traffic.gov.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [activeCityNetwork, setActiveCityNetwork] = useState('Hyderabad Metropolitan Grid (HMDA Zone 1-4)');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Role quick switch preset handler
  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage(null);
    if (selectedRole === 'Traffic Operator') {
      setEmail('operator@hyderabad.traffic.gov.in');
      setActiveCityNetwork('Hyderabad Metropolitan Grid (HMDA Zone 1-4)');
    } else if (selectedRole === 'EMS Dispatcher') {
      setEmail('dispatcher@hyderabad.traffic.gov.in');
      setActiveCityNetwork('Cyberabad IT Corridor (Hitec City & Gachibowli)');
    } else if (selectedRole === 'System Admin') {
      setEmail('admin@hyderabad.traffic.gov.in');
      setActiveCityNetwork('Hyderabad Metropolitan Grid (HMDA Zone 1-4)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const jurisdictionClean = activeCityNetwork.includes('Cyberabad')
      ? 'Cyberabad IT Corridor'
      : 'Hyderabad Metropolitan Grid';

    const res = await loginUser({
      email,
      password,
      role,
      jurisdiction: jurisdictionClean,
      keep_signed_in: keepSignedIn,
    });

    setIsLoading(false);
    if (res.success) {
      navigate('/app/map');
    } else {
      setErrorMessage(res.error || 'Authentication rejected by Municipal Access Gateway');
    }
  };

  const handleSsoClick = () => {
    // Quick Municipal SSO simulation
    setIsLoading(true);
    setTimeout(async () => {
      const res = await loginUser({
        email: 'operator@hyderabad.traffic.gov.in',
        password: 'password123',
        role: 'Traffic Operator',
        jurisdiction: 'Hyderabad Metropolitan Grid',
        keep_signed_in: true,
      });
      setIsLoading(false);
      if (res.success) {
        navigate('/app/map');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] text-slate-900 flex flex-col font-sans select-none">
      {/* Top Municipal System Bar */}
      <div className="w-full bg-[#0a0f1d] border-b border-slate-800 text-slate-300 text-xs px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px]">
              ✦
            </div>
            <span className="tracking-wider">SINK</span>
            <span className="text-[10px] font-mono uppercase bg-slate-800/90 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
              MUNICIPAL CORE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Network Status: <strong className="text-emerald-400 font-semibold">Operational 99.98%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>256-BIT SSL ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-center max-w-7xl mx-auto w-full p-4 lg:p-8 gap-8 my-auto">
        
        {/* Left Column: Sign In Workspace Card */}
        <div className="w-full lg:w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Version Badge & Title */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-[#0b1329] flex items-center justify-center text-blue-400 text-xs">
                ✦
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Sink</span>
              <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                v2.14 LTS
              </span>
            </div>

            <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-1">
              MUNICIPAL TRAFFIC & EMERGENCY OPERATIONS
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Sign in to workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Enter your municipal credentials or access token
            </p>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleSelect('Traffic Operator')}
                className={`py-2 rounded-lg transition-all ${
                  role === 'Traffic Operator'
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Traffic Operator
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('EMS Dispatcher')}
                className={`py-2 rounded-lg transition-all ${
                  role === 'EMS Dispatcher'
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EMS Dispatcher
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('System Admin')}
                className={`py-2 rounded-lg transition-all ${
                  role === 'System Admin'
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                System Admin
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Work Email</label>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    NIC / GovNet Verified
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                    placeholder="operator@hyderabad.traffic.gov.in"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('password123');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot? (Reset to demo)
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Select Active City Network */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">Select Active City Network</label>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Connected • 1.4k nodes</span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <select
                    value={activeCityNetwork}
                    onChange={(e) => setActiveCityNetwork(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-8 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="Hyderabad Metropolitan Grid (HMDA Zone 1-4)">
                      Hyderabad Metropolitan Grid (HMDA Zone 1-4)
                    </option>
                    <option value="Cyberabad IT Corridor (Hitec City & Gachibowli)">
                      Cyberabad IT Corridor (Hitec City & Gachibowli)
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Keep Signed In & Token info */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Keep signed in for 12 hours (Shift)</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  Token: SecAuto-9X
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0b1329] hover:bg-[#152349] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm mt-3 disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign in to Workspace'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <span className="bg-white px-2">OR</span>
              </div>
            </div>

            {/* Municipal SSO Button */}
            <button
              type="button"
              onClick={handleSsoClick}
              disabled={isLoading}
              className="w-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Continue with Municipal SSO (GovNet Key)</span>
            </button>
          </div>

          {/* Legal / Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Authorized municipal personnel only. All access is cryptographically logged and audited under GovNet Security Directives (MTA-SEC-809).
            </span>
          </div>
        </div>

        {/* Right Column: Tactical Live Telemetry Display */}
        <div className="w-full lg:flex-1 bg-[#090e1c] rounded-2xl shadow-2xl border border-slate-800 p-8 sm:p-10 flex flex-col justify-between text-slate-100 relative overflow-hidden">
          
          {/* Subtle Ambient Background Grids */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
          />

          {/* Header Banner */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider uppercase bg-blue-950/80 text-blue-400 px-2.5 py-1 rounded border border-blue-800/50 font-semibold">
                REAL-TIME GRAPH ROUTING ONLINE
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>5 Active Services Connected</span>
              </div>
              <span>•</span>
              <span>Latency 14ms</span>
            </div>
          </div>

          {/* Center Tactical Card */}
          <div className="relative z-10 my-6 rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 shadow-inner backdrop-blur-sm">
            {/* Corridor Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Hyderabad Metropolitan Grid
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    CORRIDOR OVERVIEW — CENTRAL CORRIDOR IV (GACHIBOWLI TO BEGUMPET)
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-[10px] px-2.5 py-1 rounded-md font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE STREAM
              </span>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  SIGNALS SYNCED
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  1,482
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  100% Online (Zero drop)
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  EMS PREEMPTION
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  Active
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Avg delay -38%
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  SENSOR INGESTION
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  42.8k
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  events / sec
                </div>
              </div>
            </div>

            {/* Dynamic Phase Coordination Matrix */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 uppercase font-semibold">
                  DYNAMIC PHASE COORDINATION MATRIX
                </span>
                <span className="text-emerald-400 font-bold">
                  Phase 04 • Green Wave Active
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 w-[42%]" title="NODE-41 (42s)" />
                <div className="h-full bg-emerald-500 w-[28%]" title="NODE-42 (28s)" />
                <div className="h-full bg-teal-400 w-[18%]" title="NODE-43 (18s)" />
                <div className="h-full bg-cyan-300 w-[12%]" title="CLEAR (12s)" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
                <span>NODE-41 (42s)</span>
                <span>NODE-42 (28s)</span>
                <span>NODE-43 (18s)</span>
                <span>CLEAR (12s)</span>
              </div>
            </div>

            {/* Vector Wave Diagram (Authentic Wireframe Matching User Screenshot) */}
            <div className="relative h-24 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none">
                {/* Horizontal Baseline */}
                <line x1="20" y1="40" x2="160" y2="40" stroke="#2dd4bf" strokeWidth="2.5" />
                {/* Preemption Drop Step */}
                <line x1="160" y1="40" x2="160" y2="65" stroke="#2dd4bf" strokeWidth="2.5" />
                <line x1="160" y1="65" x2="340" y2="65" stroke="#2dd4bf" strokeWidth="2.5" />
                <line x1="340" y1="65" x2="340" y2="40" stroke="#2dd4bf" strokeWidth="2.5" />
                <line x1="340" y1="40" x2="480" y2="40" stroke="#2dd4bf" strokeWidth="2.5" />

                {/* Nodes on Line */}
                <polygon points="80,36 84,40 80,44 76,40" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                <polygon points="250,61 254,65 250,69 246,65" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                <polygon points="420,36 424,40 420,44 416,40" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
              </svg>

              {/* Labels on SVG */}
              <span className="absolute left-16 top-3 text-[9px] font-mono text-slate-400">
                INT-01
              </span>
              <span className="absolute left-[36%] top-7 text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">
                PRIORITY-EMG
              </span>
              <span className="absolute right-[28%] top-3 text-[9px] font-mono text-slate-400">
                INT-03
              </span>
              <span className="absolute right-6 bottom-3 text-[9px] font-mono text-teal-300">
                FLYOVER-GATE
              </span>
              <span className="absolute right-4 top-2 text-[9px] font-mono text-slate-500">
                T-Frame: 1,482ms
              </span>
              <span className="absolute left-4 bottom-2 text-[9px] font-mono text-slate-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                HMDA Corridor Wave: SYNCHRONIZED
              </span>
            </div>
          </div>

          {/* Bottom Endorsement & Verification Footer */}
          <div className="relative z-10 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono mb-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                99 OPERATIONAL EFFICACY REVIEW
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                GovNet Level 4 Verified
              </span>
            </div>
            <p className="text-xs text-slate-300 italic font-serif leading-relaxed mb-3">
              "Sink decreased our emergency response routing times across 22 metropolitan intersections by 4.2 minutes within 30 days of deployment."
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <div className="font-bold text-white">Srikanth Rao</div>
                <div className="text-[10px] text-slate-400">Commissioner of Urban Mobility & Traffic Systems</div>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                <div>Municipal Transport Authority</div>
                <div>Zone 1 Command Desk</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Global Bottom Security & Compliance Footer */}
      <div className="w-full bg-[#f4f7fc] border-t border-slate-200 py-3 px-8 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-700">SYS.VER: v2.14.0-enterprise</span>
          <span>•</span>
          <span>SOC2 Type II</span>
          <span>•</span>
          <span>FedRAMP Ready</span>
          <span>•</span>
          <span>ISO 27001</span>
        </div>

        <div className="flex items-center gap-6">
          <span>Cert: NIC-GOV-2025</span>
          <span>Primary Gateway: in-hyd-node-01</span>
          <div className="flex items-center gap-4 text-slate-600 font-sans">
            <a href="#privacy" className="hover:underline">Security Policy</a>
            <a href="#privacy" className="hover:underline">Privacy Framework</a>
            <a href="#support" className="hover:underline">Municipal Dispatch Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Building2, LogOut, ShieldCheck } from 'lucide-react';
import { useTrafficHud, ActiveCity } from '../../context/TrafficHudContext';
import { getCurrentUser, logoutUser } from '../../services/api';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useTrafficHud();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const sectors: ActiveCity[] = [
    'Hyderabad Metropolitan Grid',
    'Cyberabad IT Corridor',
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Grid / Sector Selector */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Active Urban Sector
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as ActiveCity)}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 pointer-events-none -ml-4" />
          </div>
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* System Health Pulse */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-600">
            {selectedCity.includes('Cyberabad') ? 'Cyberabad IT Mesh Live' : 'Hyderabad Metro Mesh Live'}
          </span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="System notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-xs">
            {currentUser?.display_name ? currentUser.display_name.slice(0, 2).toUpperCase() : 'OP'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {currentUser?.display_name || 'Rohith'}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>{currentUser?.role || 'Traffic Operator'}</span>
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Sign out of municipal session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

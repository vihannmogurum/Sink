import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Map, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Radio
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTrafficHud } from '../../context/TrafficHudContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Live Traffic Map', path: '/app/map', icon: Map },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart3 },
  { name: 'Infrastructure Settings', path: '/app/settings', icon: Settings },
  { name: 'Agent Audit Logs', path: '/app/audit', icon: ShieldAlert },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { selectedCity } = useTrafficHud();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
              <Radio className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-none">
                SINK OS
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {selectedCity.includes('Cyberabad') ? 'Cyberabad IT Corridor' : 'Hyderabad Metro Grid'}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900 z-10 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  collapsed && 'justify-center px-0'
                )
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Territory Indicator */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed ? (
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Territory</span>
              <span className="text-emerald-600 font-bold">Port 3000</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">AGENT_1 /frontend</p>
          </div>
        ) : (
          <div className="flex justify-center" title="AGENT_1 | Port 3000">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
        )}
      </div>
    </aside>
  );
};

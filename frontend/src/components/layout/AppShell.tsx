import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DebugRouter } from './DebugRouter';
import { TrafficHudProvider } from '../../context/TrafficHudContext';

export const AppShell: React.FC = () => {
  return (
    <TrafficHudProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <Outlet />
          </main>
        </div>
        <DebugRouter />
      </div>
    </TrafficHudProvider>
  );
};

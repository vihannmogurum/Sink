import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout';
import { LoginPage } from './pages/LoginPage';
import { TrafficMapPage } from './pages/TrafficMapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DebugDataPage } from './pages/DebugDataPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect to /app/map */}
        <Route path="/" element={<Navigate to="/app/map" replace />} />

        {/* Authenticated Application Shell */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/map" replace />} />
          <Route path="map" element={<TrafficMapPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="debug-data" element={<DebugDataPage />} />
        </Route>

        {/* Strict Wildcard Catch-All / 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

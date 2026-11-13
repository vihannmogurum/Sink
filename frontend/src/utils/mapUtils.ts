import L from 'leaflet';
import { EdgeTelemetry } from '../schemas/contracts';

/**
 * Returns hexadecimal color code based on edge condition:
 * - Cobalt (#3B82F6) for active emergency preemption corridor
 * - Crimson (#EF4444) for blocked / severe congestion (congestion_index >= 0.75 or speed < 15 kph)
 * - Amber (#F59E0B) for slowing / moderate congestion (congestion_index >= 0.4 or speed < 30 kph)
 * - Emerald (#10B981) for free-flowing traffic
 */
export function getEdgeColor(
  telemetry?: EdgeTelemetry,
  isEmergencyCorridor: boolean = false
): string {
  if (isEmergencyCorridor) {
    return '#3B82F6'; // Cobalt
  }

  if (!telemetry) {
    return '#64748B'; // Slate neutral fallback
  }

  if (telemetry.status === 'blocked' || telemetry.congestion_index >= 0.75 || telemetry.current_speed_kph < 15) {
    return '#EF4444'; // Crimson
  }

  if (telemetry.status === 'congested' || telemetry.congestion_index >= 0.4 || telemetry.current_speed_kph < 30) {
    return '#F59E0B'; // Amber
  }

  return '#10B981'; // Emerald
}

/**
 * Creates custom L.divIcon using crisp HTML/Tailwind for intersections.
 * Avoids default Leaflet marker PNG lookup errors in Vite bundling.
 */
export function createIntersectionIcon(name: string, isHub: boolean = false): L.DivIcon {
  const shortLabel = name.split(' ')[0];
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
      <div class="absolute h-8 w-8 rounded-full ${isHub ? 'bg-indigo-500/30 ring-2 ring-indigo-400' : 'bg-slate-700/40 ring-1 ring-slate-400'} animate-ping opacity-75"></div>
      <div class="relative flex h-6 w-6 items-center justify-center rounded-full ${isHub ? 'bg-indigo-600 border-2 border-white' : 'bg-slate-900 border-2 border-slate-300'} shadow-md">
        <div class="h-2 w-2 rounded-full ${isHub ? 'bg-white' : 'bg-emerald-400'}"></div>
      </div>
      <div class="absolute -bottom-5 whitespace-nowrap rounded bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-200 border border-slate-700 shadow-sm pointer-events-none opacity-85 group-hover:opacity-100">
        ${shortLabel}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-intersection-marker',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * Creates custom L.divIcon for CV camera anomalies and road hazards.
 */
export function createAnomalyIcon(severity: 'low' | 'medium' | 'high' | 'critical'): L.DivIcon {
  const isCritical = severity === 'critical' || severity === 'high';
  const colorBg = isCritical ? 'bg-rose-600' : 'bg-amber-500';
  const ringColor = isCritical ? 'ring-rose-400/50' : 'ring-amber-400/50';

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
      <div class="absolute h-7 w-7 rounded-full ${colorBg} opacity-40 animate-ping"></div>
      <div class="relative flex h-6 w-6 items-center justify-center rounded-full ${colorBg} text-white shadow-lg ring-4 ${ringColor}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="absolute -top-6 whitespace-nowrap rounded bg-rose-950/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-200 border border-rose-700 shadow-sm uppercase pointer-events-none">
        ${severity} hazard
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-anomaly-marker',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

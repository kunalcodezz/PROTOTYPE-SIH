/**
 * OceanVision 3D - Global Oceanographic Analytics Dashboard
 */

import React from 'react';
import { OceanStats, OceanAnomaly, OceanObservation } from '../../types/ocean';
import {
  BarChart3,
  TrendingUp,
  Thermometer,
  Droplets,
  Waves,
  Wind,
  ShieldCheck,
  Radio,
  AlertTriangle,
  Globe2,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface GlobalAnalyticsViewProps {
  stats: OceanStats | null;
  anomalies: OceanAnomaly[];
  observations: OceanObservation[];
  onFlyToLocation: (lat: number, lon: number, name: string) => void;
  onAskAI: (query: string) => void;
}

export const GlobalAnalyticsView: React.FC<GlobalAnalyticsViewProps> = ({
  stats,
  anomalies,
  observations,
  onFlyToLocation,
  onAskAI,
}) => {
  if (!stats) return null;

  // Regional breakdown data for charts
  const regionalData = [
    { name: 'Arabian Sea', sst: 28.4, salinity: 36.2, wave: 1.9, error: 0.6 },
    { name: 'Bay of Bengal', sst: 29.2, salinity: 32.4, wave: 1.4, error: 1.4 },
    { name: 'Equatorial Pacific', sst: 29.8, salinity: 34.8, wave: 1.8, error: 0.3 },
    { name: 'Gulf Stream', sst: 26.5, salinity: 36.5, wave: 2.3, error: 0.5 },
    { name: 'Southern Ocean', sst: 3.2, salinity: 34.0, wave: 4.8, error: 1.7 },
    { name: 'Mediterranean', sst: 24.8, salinity: 38.6, wave: 1.2, error: 0.4 },
  ];

  // Observational platform breakdown
  const platformCounts = [
    { name: 'Argo Profiler Floats', count: observations.filter((o) => o.type === 'Argo Float').length, color: '#06b6d4' },
    { name: 'Moored MetOcean Buoys', count: observations.filter((o) => o.type === 'Buoy').length, color: '#f59e0b' },
    { name: 'Research Vessels', count: observations.filter((o) => o.type === 'Research Vessel').length, color: '#10b981' },
    { name: 'Coastal Observatories', count: observations.filter((o) => o.type === 'Ocean Station').length, color: '#8b5cf6' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 custom-scrollbar select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Global Oceanographic Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              SYNTHESIS v2.4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Integrated metrics combining numerical ocean model grids with active in-situ sensor networks
          </p>
        </div>

        <button
          onClick={() => onAskAI('Provide a global synthesis of current ocean temperatures, salinity patterns, and model assimilation skill score across major basins.')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 w-fit"
        >
          <Activity className="w-4 h-4" />
          <span>Generate AI Global Synthesis</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mean Temp */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>GLOBAL MEAN SST</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 font-mono">
            {stats.meanTemperature}<span className="text-lg text-slate-400">°C</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span>Range: {stats.minTemperature}°C – {stats.maxTemperature}°C</span>
          </div>
        </div>

        {/* Mean Salinity */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>MEAN SEA SALINITY</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 font-mono">
            {stats.meanSalinity}<span className="text-lg text-slate-400"> PSU</span>
          </div>
          <div className="text-[11px] text-cyan-300 flex items-center gap-1 font-mono">
            <span>Halocline: 30.5 – 38.9 PSU</span>
          </div>
        </div>

        {/* In-Situ Network */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE IN-SITU PLATFORMS</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {stats.totalObservationStations}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            100% telemetry online
          </div>
        </div>

        {/* Skill Score */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>MODEL SKILL SCORE</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono">
            {stats.assimilationSkillScore}%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            High assimilation fidelity
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basin Comparison Chart */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Major Ocean Basins: SST vs Salinity</h3>
            <span className="text-[11px] font-mono text-cyan-400">Dual Parameter Axis</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="sst" name="Sea Temp (°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salinity" name="Salinity (PSU)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Discrepancy Error per Basin */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Regional Model Discrepancy (Δ Bias)</h3>
            <span className="text-[11px] font-mono text-amber-400">Tolerance Boundary: ±0.8</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="error" name="Absolute Error Delta" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Observation Platform Breakdown & Top Detected Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Observational Sensor Network Breakdown */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-slate-100">Observational Fleet Distribution</h3>
          <div className="space-y-2.5 pt-2">
            {platformCounts.map((p, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-200">{p.name}</span>
                </div>
                <span className="font-bold text-slate-100">{p.count} Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Anomalies List */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Active Ocean Anomalies & Discrepancies
            </h3>
            <span className="text-xs font-mono text-amber-400">{anomalies.length} Highlighted</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                onClick={() => onFlyToLocation(anom.latitude, anom.longitude, anom.locationName)}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {anom.locationName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        anom.severity === 'Significant'
                          ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                      }`}
                    >
                      {anom.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{anom.physicalCause}</p>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-amber-400">
                    {anom.difference > 0 ? `+${anom.difference}` : anom.difference} {anom.unit}
                  </div>
                  <div className="text-[10px] text-slate-500">Click to fly in 3D</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

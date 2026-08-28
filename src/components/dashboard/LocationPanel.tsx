/**
 * OceanVision 3D - Context-Sensitive Location & Observation Inspector
 */

import React, { useState } from 'react';
import {
  OceanLocationDetails,
  OceanObservation,
  AnomalySeverity,
} from '../../types/ocean';
import { formatCoordinates } from '../../utils/geoUtils';
import {
  X,
  Compass,
  Thermometer,
  Droplets,
  Wind,
  Waves,
  TrendingUp,
  Radio,
  MapPin,
  Bot,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface LocationPanelProps {
  locationData: OceanLocationDetails | null;
  selectedObservation: OceanObservation | null;
  onClose: () => void;
  onOpenModelComparison: () => void;
  onAskAIAboutLocation: (summary: string) => void;
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  locationData,
  selectedObservation,
  onClose,
  onOpenModelComparison,
  onAskAIAboutLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeseries' | 'depthProfile'>('overview');

  if (!locationData && !selectedObservation) return null;

  const lat = selectedObservation ? selectedObservation.latitude : locationData?.latitude ?? 0;
  const lon = selectedObservation ? selectedObservation.longitude : locationData?.longitude ?? 0;
  const regionName = selectedObservation?.region || locationData?.oceanRegion || 'Open Ocean';
  const placeName = selectedObservation?.name || locationData?.placeName || 'Ocean Geographic Coordinate';

  const obs = selectedObservation || locationData?.nearestObservation?.observation;
  const distKm = selectedObservation ? 0 : locationData?.nearestObservation?.distanceKm ?? null;

  const model = locationData?.model;
  const metrics = locationData?.comparisonMetrics || [];

  const handleTriggerAI = () => {
    const query = `Analyze the current ocean conditions at ${placeName} (${formatCoordinates(lat, lon)}). Model temperature is ${model?.temperature}°C, salinity ${model?.salinity} PSU. Explain any discrepancies with nearby in-situ observations.`;
    onAskAIAboutLocation(query);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-2xl shadow-2xl w-96 max-h-[85vh] flex flex-col text-slate-200 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 mt-0.5">
            {selectedObservation ? <Radio className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                {selectedObservation ? selectedObservation.type : regionName}
              </span>
              {distKm !== null && distKm > 0 && (
                <span className="text-[10px] font-mono text-slate-400">Nearest Obs: {distKm} km</span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-100 mt-1 leading-snug">{placeName}</h3>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              {formatCoordinates(lat, lon)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 my-3 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Model
        </button>
        <button
          onClick={() => setActiveTab('timeseries')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
            activeTab === 'timeseries'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          7-Day Trend
        </button>
        {obs?.depthProfile && (
          <button
            onClick={() => setActiveTab('depthProfile')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
              activeTab === 'depthProfile'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CTD Depth
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar text-xs">
        {activeTab === 'overview' && (
          <>
            {/* Model & Observed Value Comparison Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Ocean Parameters</span>
                <span className="text-cyan-400">Model vs Observed</span>
              </div>

              {/* Temperature */}
              <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span>Sea Surface Temperature</span>
                  </div>
                  {obs && model && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        Math.abs(model.temperature - obs.temperature) < 0.5
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      }`}
                    >
                      Δ {(model.temperature - obs.temperature).toFixed(1)}°C
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">NUMERICAL MODEL</div>
                    <div className="text-sm font-semibold text-cyan-300">{model?.temperature ?? '—'}°C</div>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">IN-SITU OBSERVED</div>
                    <div className="text-sm font-semibold text-emerald-300">{obs?.temperature ?? '—'}°C</div>
                  </div>
                </div>
              </div>

              {/* Salinity */}
              <div className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Salinity (Halocline)</span>
                  </div>
                  {obs && model && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      Δ {(model.salinity - obs.salinity).toFixed(1)} PSU
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">NUMERICAL MODEL</div>
                    <div className="text-sm font-semibold text-cyan-300">{model?.salinity ?? '—'} PSU</div>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">IN-SITU OBSERVED</div>
                    <div className="text-sm font-semibold text-emerald-300">{obs?.salinity ?? '—'} PSU</div>
                  </div>
                </div>
              </div>

              {/* Currents & Waves row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Current Speed</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-100">
                    {model?.currentSpeed ?? obs?.currentSpeed ?? '—'} m/s
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Flow: {model?.currentDirection ?? obs?.currentDirection ?? 0}°
                  </div>
                </div>

                <div className="p-2 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                    <Waves className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px]">Wave Height</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-100">
                    {model?.waveHeight ?? obs?.waveHeight ?? '—'} m
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Significant swell</div>
                </div>
              </div>
            </div>

            {/* In-situ Telemetry details if selected */}
            {obs && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>SENSOR PLATFORM TELEMETRY</span>
                  <span>ID: {obs.stationId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500">Institution:</span>{' '}
                    {obs.metadata?.institution || 'Global Ocean Array'}
                  </div>
                  <div>
                    <span className="text-slate-500">Telemetry:</span> {obs.lastTransmitted}
                  </div>
                  {obs.batteryLevel && (
                    <div>
                      <span className="text-slate-500">Battery:</span> {obs.batteryLevel}%
                    </div>
                  )}
                  {obs.metadata?.wmoId && (
                    <div>
                      <span className="text-slate-500">WMO ID:</span> {obs.metadata.wmoId}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 7-Day Trend Chart Tab */}
        {activeTab === 'timeseries' && locationData && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-slate-400">
              7-DAY TEMPERATURE MODEL VS IN-SITU (°C)
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={locationData.timeseries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="modelTemperature"
                    name="Model Temp"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="observedTemperature"
                    name="Observed Temp"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-2">
              7-DAY SALINITY (PSU) & WAVE HEIGHT (m)
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={locationData.timeseries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="modelSalinity"
                    name="Model Salinity (PSU)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="modelWaveHeight"
                    name="Wave Height (m)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Argo CTD Depth Profile Tab */}
        {activeTab === 'depthProfile' && obs?.depthProfile && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-400">
              ARGO CTD VERTICAL PROFILE (0–2000m DEPTH)
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={obs.depthProfile}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="depth"
                    type="number"
                    reversed
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    unit="m"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temp (°C)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="salinity"
                    name="Salinity (PSU)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Notice the rapid thermocline drop in the top 100m, transitioning to deep abyssal water (2–4°C).
            </p>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={onOpenModelComparison}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-colors border border-slate-700/60"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Full Comparison</span>
        </button>

        <button
          onClick={handleTriggerAI}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
        >
          <Bot className="w-3.5 h-3.5 fill-current" />
          <span>Ask AI Analyst</span>
        </button>
      </div>
    </div>
  );
};

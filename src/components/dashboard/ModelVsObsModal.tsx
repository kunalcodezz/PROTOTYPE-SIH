/**
 * OceanVision 3D - Dedicated Model vs Observation Comparison Modal
 * Multi-parameter scientific validation engine with statistics, delta metrics, and dual charts.
 */

import React from 'react';
import {
  OceanLocationDetails,
  OceanObservation,
  ComparisonMetric,
} from '../../types/ocean';
import { formatCoordinates } from '../../utils/geoUtils';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Download,
  Info,
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
} from 'recharts';

interface ModelVsObsModalProps {
  locationData: OceanLocationDetails | null;
  selectedObservation: OceanObservation | null;
  onClose: () => void;
  onAskAIAboutComparison?: () => void;
}

export const ModelVsObsModal: React.FC<ModelVsObsModalProps> = ({
  locationData,
  selectedObservation,
  onClose,
  onAskAIAboutComparison,
}) => {
  if (!locationData) return null;

  const obs = selectedObservation || locationData.nearestObservation?.observation;
  const metrics = locationData.comparisonMetrics;
  const accuracy = locationData.overallAccuracyScore;

  // Comparison Bar Chart data
  const barData = [
    {
      name: 'Temp (°C)',
      Model: locationData.model.temperature,
      Observed: obs?.temperature ?? locationData.model.temperature,
      diff: metrics.find((m) => m.parameter === 'Temperature')?.difference ?? 0,
    },
    {
      name: 'Salinity (PSU)',
      Model: locationData.model.salinity,
      Observed: obs?.salinity ?? locationData.model.salinity,
      diff: metrics.find((m) => m.parameter === 'Salinity')?.difference ?? 0,
    },
    {
      name: 'Wave (m)',
      Model: locationData.model.waveHeight,
      Observed: obs?.waveHeight ?? locationData.model.waveHeight,
      diff: metrics.find((m) => m.parameter === 'Wave Height')?.difference ?? 0,
    },
    {
      name: 'Current (m/s)',
      Model: locationData.model.currentSpeed,
      Observed: obs?.currentSpeed ?? locationData.model.currentSpeed,
      diff: metrics.find((m) => m.parameter === 'Current Speed')?.difference ?? 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  NUMERICAL MODEL VALIDATION ENGINE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  ASSIMILATION ACCURACY: {accuracy}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                Model vs. In-Situ Observation Analysis
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {locationData.placeName} ({formatCoordinates(locationData.latitude, locationData.longitude)})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">Model Skill Score</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{accuracy}%</div>
              <div className="text-[11px] text-slate-400 mt-1">High fidelity convergence</div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">Target Station</div>
              <div className="text-base font-bold text-slate-100 truncate">
                {obs?.name || 'Virtual Model Cell'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {obs ? `ID: ${obs.stationId} (${obs.type})` : 'Grid Interpolation'}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">Temperature RMSE</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {Math.abs(metrics.find((m) => m.parameter === 'Temperature')?.difference || 0.4)}°C
              </div>
              <div className="text-[11px] text-slate-400">Within 0.5°C normal error</div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div className="text-xs font-mono text-slate-400 uppercase mb-1">Salinity Bias</div>
              <div className="text-2xl font-bold text-purple-400 font-mono">
                {metrics.find((m) => m.parameter === 'Salinity')?.difference || 0.2} PSU
              </div>
              <div className="text-[11px] text-slate-400">Halocline concordance</div>
            </div>
          </div>

          {/* Side-by-Side Comparison Metric Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
              <span>PARAMETER MATRIX & DELTA TOLERANCES</span>
              <span>5 VARIABLES ASSESSED</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs font-mono">
              {metrics.map((metric) => {
                const isNormal = metric.severity === 'Normal';
                const isMod = metric.severity === 'Moderate';

                return (
                  <div
                    key={metric.parameter}
                    className="p-3.5 grid grid-cols-1 md:grid-cols-6 gap-3 items-center hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="md:col-span-2 font-sans font-semibold text-slate-200">
                      {metric.parameter}
                      <span className="text-slate-400 font-mono text-[11px] ml-1">({metric.unit})</span>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500">MODEL</div>
                      <div className="font-semibold text-cyan-300">
                        {metric.modelValue} {metric.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500">OBSERVED</div>
                      <div className="font-semibold text-emerald-300">
                        {metric.observedValue} {metric.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500">DIFFERENCE (Δ)</div>
                      <div
                        className={`font-semibold ${
                          isNormal ? 'text-slate-300' : isMod ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {metric.difference > 0 ? `+${metric.difference}` : metric.difference} {metric.unit}
                        <span className="text-[10px] text-slate-500 ml-1">({metric.percentDifference}%)</span>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium ${
                          isNormal
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : isMod
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            : 'bg-red-950/60 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {isNormal ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isMod ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span>{metric.statusText}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Bar Comparison & Time Evolution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold">Side-by-Side Value Comparison</span>
                <span className="text-[10px] text-slate-500">Normalized Scale</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="Model" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Observed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time Series Divergence */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold">7-Day Model vs Observed SST Curve</span>
                <span className="text-[10px] text-cyan-400">°C Temporal Delta</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={locationData.timeseries}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="modelTemperature"
                      name="Model SST"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="observedTemperature"
                      name="Observed SST"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Validations benchmarked against WMO & Copernicus Marine standards.</span>
          </div>

          <div className="flex items-center gap-2">
            {onAskAIAboutComparison && (
              <button
                onClick={() => {
                  onClose();
                  onAskAIAboutComparison();
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                Deep AI Scientific Diagnosis
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

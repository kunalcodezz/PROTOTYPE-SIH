/**
 * OceanVision 3D - Anomaly Detection Center
 */

import React from 'react';
import { OceanAnomaly } from '../../types/ocean';
import { formatCoordinates } from '../../utils/geoUtils';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Thermometer,
  Droplets,
  Waves,
  Globe2,
  Bot,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface AnomalyCenterViewProps {
  anomalies: OceanAnomaly[];
  onFlyToLocation: (lat: number, lon: number, name: string) => void;
  onAskAIAboutAnomaly: (query: string) => void;
}

export const AnomalyCenterView: React.FC<AnomalyCenterViewProps> = ({
  anomalies,
  onFlyToLocation,
  onAskAIAboutAnomaly,
}) => {
  const significantCount = anomalies.filter((a) => a.severity === 'Significant').length;
  const moderateCount = anomalies.filter((a) => a.severity === 'Moderate').length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 custom-scrollbar select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Ocean Anomaly Detection Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800">
              {anomalies.length} ACTIVE ANOMALIES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated model vs in-situ discrepancy detection flagging severe deviations in SST, salinity plumes, and wave swells
          </p>
        </div>

        <button
          onClick={() =>
            onAskAIAboutAnomaly(
              'Analyze all current active ocean anomalies globally, rank them by physical severity, and suggest numerical model assimilation improvements.'
            )
          }
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 w-fit"
        >
          <Bot className="w-4 h-4 fill-current" />
          <span>AI Anomaly Diagnosis Report</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/80 border border-red-900/50 rounded-2xl">
          <div className="text-xs font-mono text-red-400 uppercase flex items-center justify-between">
            <span>Significant Deviations</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 font-mono mt-1">{significantCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate boundary recalibration</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-amber-900/50 rounded-2xl">
          <div className="text-xs font-mono text-amber-400 uppercase flex items-center justify-between">
            <span>Moderate Deviations</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono mt-1">{moderateCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Seasonal or coastal upwelling offset</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="text-xs font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Global Assimilation Status</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400 font-mono mt-1">94.2%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Convergence across 88% of grid cells</div>
        </div>
      </div>

      {/* Detailed Anomaly Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
          Detected Regional Discrepancies
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {anomalies.map((anom) => {
            const isSignificant = anom.severity === 'Significant';

            return (
              <div
                key={anom.id}
                className={`p-5 bg-slate-900/90 border rounded-3xl space-y-3 transition-all hover:bg-slate-900 ${
                  isSignificant
                    ? 'border-red-500/40 shadow-lg shadow-red-500/5'
                    : 'border-amber-500/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                          isSignificant
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {anom.severity} Alert
                      </span>
                      <span className="text-xs font-mono text-slate-400">{anom.parameter}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-100 mt-1">{anom.locationName}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {formatCoordinates(anom.latitude, anom.longitude)}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-500 uppercase">Delta (Δ)</div>
                    <div
                      className={`text-xl font-bold ${
                        isSignificant ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {anom.difference > 0 ? `+${anom.difference}` : anom.difference} {anom.unit}
                    </div>
                  </div>
                </div>

                {/* Values Comparison */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500">NUMERICAL MODEL</div>
                    <div className="text-sm font-semibold text-cyan-300">
                      {anom.modelValue} {anom.unit}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500">IN-SITU OBSERVED</div>
                    <div className="text-sm font-semibold text-emerald-300">
                      {anom.observedValue} {anom.unit}
                    </div>
                  </div>
                </div>

                {/* Physical Cause Breakdown */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100 block mb-1">Oceanographic Mechanism:</strong>
                  {anom.physicalCause}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onFlyToLocation(anom.latitude, anom.longitude, anom.locationName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Fly to 3D Coordinate</span>
                  </button>

                  <button
                    onClick={() =>
                      onAskAIAboutAnomaly(
                        `Explain the ocean anomaly at ${anom.locationName}: Observed ${anom.parameter} of ${anom.observedValue} ${anom.unit} vs model ${anom.modelValue} ${anom.unit}. What causes this and how should the ocean model be tuned?`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Deep AI Breakdown</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

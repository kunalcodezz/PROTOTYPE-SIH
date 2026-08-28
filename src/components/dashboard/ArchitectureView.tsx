/**
 * OceanVision 3D - Data Architecture & API Extensibility Blueprint
 */

import React from 'react';
import {
  Code2,
  Database,
  Layers,
  Globe2,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 custom-scrollbar select-none">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Data Architecture & API Extensibility</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
            PRODUCTION READY
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Designed with a decoupled provider architecture for instant switching between high-fidelity simulation and live oceanographic data pipelines.
        </p>
      </div>

      {/* Layer Architecture Diagram */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
          System Data Flow & Abstraction Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 bg-slate-950 border border-cyan-900/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
              <Database className="w-4 h-4" />
              <span>1. DATA INGESTION</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">Ocean Data Feeds</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Numerical model NetCDF grids (Copernicus/HYCOM) + Live in-situ telemetry (Argo floats, NOAA NDBC buoys).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-950 border border-blue-900/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold">
              <Server className="w-4 h-4" />
              <span>2. PROVIDER LAYER</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">OceanDataProvider</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified TypeScript interface implementing standard geophysical queries, spatial indexing, and anomaly detection.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-950 border border-emerald-900/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
              <Globe2 className="w-4 h-4" />
              <span>3. 3D VISUAL ENGINE</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">CesiumJS + WebGL</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              GPU-accelerated rendering of thermodynamic grids, velocity vector fields, and interactive in-situ beacons.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-950 border border-purple-900/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold">
              <Cpu className="w-4 h-4" />
              <span>4. AI ANALYST</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">Gemini 3.7 Flash</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Context-grounded reasoning over model-observation deltas, upwelling physics, and assimilation errors.
            </p>
          </div>
        </div>
      </div>

      {/* Extensibility Code Sample & APIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Data Providers Integration Plan */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Real Ocean Data Integration Endpoints</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-cyan-400 font-semibold">NOAA ERDDAP & NDBC</span>
                <span className="text-[10px] text-emerald-400">REST / JSON / NetCDF</span>
              </div>
              <p className="text-slate-400">
                Direct integration with global moored buoys, coastal tide stations, and OISST v2.1 satellite-blended fields.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-cyan-400 font-semibold">Copernicus Marine Service (CMEMS)</span>
                <span className="text-[10px] text-emerald-400">Copernicus API / WMS</span>
              </div>
              <p className="text-slate-400">
                GLOBAL_ANALYSISFORECAST_PHY_001_024 1/12° numerical model output assimilation.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-cyan-400 font-semibold">Argo Float GDAC</span>
                <span className="text-[10px] text-emerald-400">Argo NetCDF Stream</span>
              </div>
              <p className="text-slate-400">
                Access to 3,800+ autonomous CTD profiling floats capturing 0–2,000m vertical thermoclines.
              </p>
            </div>
          </div>
        </div>

        {/* Abstraction Layer Code Snippet */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold">IOceanDataProvider Interface</span>
            <span className="text-cyan-400">src/services/oceanApi.ts</span>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-x-auto text-[11px] text-slate-300 leading-relaxed custom-scrollbar">
{`export interface IOceanDataProvider {
  getGriddedModelData(timeIndex: number): Promise<OceanModelPoint[]>;
  getObservations(timeIndex: number): Promise<OceanObservation[]>;
  getLocationDetails(lat: number, lon: number, timeIndex: number): Promise<OceanLocationDetails>;
  getAnomalies(timeIndex: number): Promise<OceanAnomaly[]>;
  getOceanStats(timeIndex: number): Promise<OceanStats>;
  analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
}

// Seamlessly switch providers in one line:
export const OceanDataService = new RealCopernicusProvider();`}
          </pre>
          <p className="text-[11px] text-slate-400 font-sans">
            Because all visualization components consume `IOceanDataProvider`, swapping in a live NOAA/Copernicus backend requires 0 frontend rewrites.
          </p>
        </div>
      </div>
    </div>
  );
};

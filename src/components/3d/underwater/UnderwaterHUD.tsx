/**
 * OceanVision 3D - Futuristic In-Situ Underwater Telemetry HUD
 * Displays real-time physical, chemical, and biological ocean parameters:
 * Temperature, Salinity, Depth, Pressure, Current Speed/Direction, Oxygen, pH, Chlorophyll, Waves, Wind, and Species.
 */

import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Waves,
  Gauge,
  Activity,
  Layers,
  Sparkles,
  ArrowLeft,
  Fish,
  Compass,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OceanRegion } from '../../../data/oceanRegions';

export interface InSituOceanData {
  temperature: number;      // °C (e.g. 27.4)
  salinity: number;         // PSU (e.g. 35.6)
  depth: number;            // m (e.g. 250)
  pressure: number;         // bar (e.g. 25)
  currentSpeed: number;     // m/s (e.g. 0.8)
  currentDirection: string; // e.g. "NE"
  dissolvedOxygen: number;  // mg/L (e.g. 6.2)
  ph: number;               // e.g. 8.1
  chlorophyll: number;      // mg/m³ (e.g. 0.45)
  waveHeight: number;       // m (e.g. 1.4)
  windSpeed: number;        // km/h (e.g. 15)
  speciesObservation?: string; // e.g. "Yellowfin Tuna (Thunnus albacares) Observed"
}

interface UnderwaterHUDProps {
  region: OceanRegion;
  currentDepth: number;
  inSituData: InSituOceanData;
  activeLayers: {
    temperature: boolean;
    currents: boolean;
    salinity: boolean;
    species: boolean;
    ctdRig: boolean;
  };
  onToggleLayer: (layer: 'temperature' | 'currents' | 'salinity' | 'species' | 'ctdRig') => void;
  onReturnToGlobe: () => void;
  onSelectSpeciesModal?: () => void;
}

export const UnderwaterHUD: React.FC<UnderwaterHUDProps> = ({
  region,
  currentDepth,
  inSituData,
  activeLayers,
  onToggleLayer,
  onReturnToGlobe,
  onSelectSpeciesModal,
}) => {
  const [isTelemetryMinimized, setIsTelemetryMinimized] = useState(false);

  // Pressure updates with current camera depth ($P \approx 1 + \text{depth}/10\text{ bar}$)
  const dynamicPressure = (1.0 + currentDepth / 10).toFixed(1);
  const depthAttenuation = Math.max(0.1, Math.exp(-currentDepth / 650));
  const dynamicTemp = Math.max(2.1, inSituData.temperature * depthAttenuation).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 sm:p-8 select-none">
      {/* 1. TOP BAR: Basin Title, Coordinates & Return to Globe */}
      <div className="flex items-center justify-between pointer-events-auto z-10">
        {/* Region & Coordinate Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
          <div>
            <h1 className="text-sm sm:text-base font-bold font-sans tracking-wider uppercase text-slate-100">
              {region.name} • 3D DEEP DIVE
            </h1>
            <p className="text-[10px] font-mono text-cyan-300">
              {region.parentName} ({Math.abs(region.center.lat).toFixed(1)}°N, {Math.abs(region.center.lon).toFixed(1)}°E)
            </p>
          </div>
        </div>

        {/* Return to Globe Button */}
        <button
          onClick={onReturnToGlobe}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-xs font-mono font-bold tracking-widest text-cyan-200 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
          <span>RETURN TO GLOBE</span>
        </button>
      </div>

      {/* 2. MIDDLE / BOTTOM: Floating In-Situ Telemetry Card (Left) & Controls */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 pointer-events-auto z-10">
        {/* Left: Scientific In-Situ Telemetry Panel */}
        <div
          id="hud-insitu-data-card"
          className={`bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-slate-100 transition-all duration-300 ${
            isTelemetryMinimized ? 'w-64 p-4' : 'w-80 sm:w-96 space-y-4'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                IN-SITU OCEAN DATA (250m)
              </h2>
            </div>
            <button
              onClick={() => setIsTelemetryMinimized(!isTelemetryMinimized)}
              className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-400 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {isTelemetryMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isTelemetryMinimized && (
            <>
              {/* Primary In-Situ Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono animate-fadeIn">
                {/* Temperature */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temp</span>
                  </div>
                  <span className="font-bold text-amber-300">{dynamicTemp} °C</span>
                </div>

                {/* Salinity */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Salinity</span>
                  </div>
                  <span className="font-bold text-cyan-300">{inSituData.salinity} PSU</span>
                </div>

                {/* Depth */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Depth</span>
                  </div>
                  <span className="font-bold text-blue-300">{currentDepth} m</span>
                </div>

                {/* Pressure */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pressure</span>
                  </div>
                  <span className="font-bold text-emerald-300">{dynamicPressure} bar</span>
                </div>

                {/* Current */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Current Velocity</span>
                  </div>
                  <span className="font-bold text-cyan-200">
                    {inSituData.currentSpeed} m/s ({inSituData.currentDirection})
                  </span>
                </div>

                {/* Dissolved Oxygen */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    <span>Oxygen</span>
                  </div>
                  <span className="font-bold text-teal-300">{inSituData.dissolvedOxygen} mg/L</span>
                </div>

                {/* pH */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>pH</span>
                  </div>
                  <span className="font-bold text-purple-300">{inSituData.ph}</span>
                </div>

                {/* Chlorophyll */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-lime-400" />
                    <span>Chlorophyll</span>
                  </div>
                  <span className="font-bold text-lime-300">{inSituData.chlorophyll} mg/m³</span>
                </div>

                {/* Surface Waves / Wind */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>Surface Waves</span>
                  </div>
                  <span className="font-bold text-sky-300">{inSituData.waveHeight}m ({inSituData.windSpeed} km/h)</span>
                </div>
              </div>

              {/* Species Observation Badge or Unavailable State */}
              {inSituData.speciesObservation ? (
                <button
                  onClick={onSelectSpeciesModal}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-xs font-mono text-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Fish className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="truncate">{inSituData.speciesObservation}</span>
                  </div>
                  <span className="text-[10px] underline uppercase font-bold text-emerald-400">INFO</span>
                </button>
              ) : (
                <div className="w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-500 text-center italic">
                  No biodiversity observations available for this location.
                </div>
              )}
            </>
          )}
        </div>

        {/* Center/Bottom: 3D Visualization Layer Toggles */}
        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-slate-800 shadow-2xl">
          {[
            { id: 'temperature' as const, label: '3D Temp', icon: Thermometer },
            { id: 'currents' as const, label: '3D Currents', icon: Wind },
            { id: 'salinity' as const, label: '3D Salinity', icon: Droplets },
            { id: 'species' as const, label: 'Marine Life', icon: Fish },
            { id: 'ctdRig' as const, label: 'Sensor Rig', icon: Gauge },
          ].map((layer) => {
            const Icon = layer.icon;
            const isEnabled = activeLayers[layer.id];
            return (
              <button
                key={layer.id}
                onClick={() => onToggleLayer(layer.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 ${
                  isEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * OceanVision 3D - Ocean Focus Mode Minimal Floating HUD
 * Displays minimal breadcrumbs, floating basin title, underwater mode, depth slider,
 * variable switcher, and back-to-globe control.
 */

import React from 'react';
import { OceanRegion } from '../../data/oceanRegions';
import { LayerType, OceanObservation } from '../../types/ocean';
import {
  Globe,
  Waves,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  ArrowLeft,
  Eye,
  Layers,
  ChevronRight,
  Activity,
  Gauge
} from 'lucide-react';

interface OceanFocusOverlayProps {
  selectedRegion: OceanRegion;
  isFocusMode: boolean;
  isUnderwater: boolean;
  depthMeters: number;
  activeVariable: LayerType;
  nearbyObservations: OceanObservation[];
  selectedObservation: OceanObservation | null;
  onBackToGlobe: () => void;
  onToggleUnderwater: () => void;
  onChangeDepth: (depth: number) => void;
  onChangeVariable: (variable: LayerType) => void;
  onSelectObservation: (obs: OceanObservation) => void;
}

export const OceanFocusOverlay: React.FC<OceanFocusOverlayProps> = ({
  selectedRegion,
  isFocusMode,
  isUnderwater,
  depthMeters,
  activeVariable,
  nearbyObservations,
  selectedObservation,
  onBackToGlobe,
  onToggleUnderwater,
  onChangeDepth,
  onChangeVariable,
  onSelectObservation,
}) => {
  if (!isFocusMode) return null;

  const depthLevels = [
    { value: 0, label: 'Surface (0m)' },
    { value: 100, label: 'Epipelagic (100m)' },
    { value: 200, label: 'Thermocline (200m)' },
    { value: 500, label: 'Mesopelagic (500m)' },
    { value: 1000, label: 'Bathypelagic (1000m)' },
    { value: 2000, label: 'Abyss (2000m+)' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 sm:p-8 select-none transition-all duration-700">
      {/* Subtle Cinematic Vignette / Depth Accent */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          isUnderwater
            ? 'bg-radial-gradient from-cyan-950/20 via-slate-950/40 to-slate-950/80'
            : 'bg-radial-gradient from-transparent via-slate-950/10 to-slate-950/50'
        }`}
      />

      {/* TOP BAR: Tiny Floating Breadcrumb & Back to Globe Button */}
      <div className="relative flex items-center justify-between pointer-events-auto z-10">
        {/* Tiny Floating Breadcrumb */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/60 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-[11px] font-mono tracking-widest uppercase text-slate-300">
          {selectedRegion.breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-cyan-400/60" />}
              <span
                className={
                  idx === selectedRegion.breadcrumb.length - 1
                    ? 'font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Minimal Floating Back to Globe Button */}
        <button
          onClick={onBackToGlobe}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/70 hover:border-cyan-400/80 shadow-2xl text-xs font-mono tracking-wider text-slate-200 hover:text-cyan-300 transition-all duration-300 hover:scale-105 active:scale-95"
          title="Zoom out back to global view"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1 text-cyan-400" />
          <span className="font-semibold uppercase">Back to Globe</span>
        </button>
      </div>

      {/* CENTER TOP: Minimal Floating Basin Title */}
      <div className="relative text-center pointer-events-none mt-2 z-10 animate-fadeIn">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider uppercase text-slate-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-sans">
          {selectedRegion.name}
        </h1>
        <p className="text-xs sm:text-sm font-mono tracking-widest text-cyan-300/90 uppercase mt-1 drop-shadow-md">
          {selectedRegion.parentName}
        </p>
      </div>

      {/* BOTTOM SECTION: Floating Basin Controls */}
      <div className="relative flex flex-col md:flex-row items-end md:items-center justify-between gap-4 pointer-events-auto z-10">
        {/* Left: Variable Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl">
          {[
            { id: 'temperature' as LayerType, label: 'SST Temp', icon: Thermometer },
            { id: 'currents' as LayerType, label: 'Currents', icon: Wind },
            { id: 'salinity' as LayerType, label: 'Salinity', icon: Droplets },
            { id: 'waveHeight' as LayerType, label: 'Waves', icon: Waves },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeVariable === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeVariable(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Depth Slider */}
        <div className="flex items-center gap-3 p-2 px-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl">
          {/* Depth Control */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">DEPTH LAYER:</span>
            <select
              value={depthMeters}
              onChange={(e) => onChangeDepth(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-cyan-300 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
            >
              {depthLevels.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Nearby In-situ Argo / Platform Badges */}
        {nearbyObservations.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 shadow-2xl text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400">ARGO / GLIDERS:</span>
            <div className="flex items-center gap-1.5">
              {nearbyObservations.slice(0, 3).map((obs) => {
                const isSelected = selectedObservation?.id === obs.id;
                return (
                  <button
                    key={obs.id}
                    onClick={() => onSelectObservation(obs)}
                    className={`px-2 py-0.5 rounded-md text-[10px] tracking-wide transition-all ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {obs.stationId}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

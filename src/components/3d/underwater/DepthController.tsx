/**
 * OceanVision 3D - Underwater Depth Controller
 * Vertical depth scrubber spanning from Surface to Abyssal Zone (0m to 2000m+).
 * Dynamically computes hydrostatic pressure and optical light absorption.
 */

import React from 'react';
import { Layers, Gauge, Sun } from 'lucide-react';

interface DepthControllerProps {
  currentDepth: number;
  onDepthChange: (depth: number) => void;
}

export const DEPTH_STAGES = [
  { depth: 0, label: 'Surface', zone: 'Photik Zone', pressure: 1.0, lightPct: 100 },
  { depth: 100, label: '100m', zone: 'Epipelagic', pressure: 11.0, lightPct: 12 },
  { depth: 250, label: '250m', zone: 'In-Situ Station', pressure: 25.0, lightPct: 3, isAnchor: true },
  { depth: 500, label: '500m', zone: 'Mesopelagic', pressure: 51.0, lightPct: 0.2 },
  { depth: 1000, label: '1000m', zone: 'Bathypelagic', pressure: 101.0, lightPct: 0 },
  { depth: 2000, label: '2000m', zone: 'Abyssal Zone', pressure: 201.0, lightPct: 0 },
];

export const DepthController: React.FC<DepthControllerProps> = ({
  currentDepth,
  onDepthChange,
}) => {
  const pressureBar = (1.0 + currentDepth / 10).toFixed(1);
  const lightPct = Math.max(0, Math.round(100 * Math.exp(-currentDepth / 65)));

  return (
    <div
      id="underwater-depth-controller"
      className="flex flex-col items-center bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-slate-100 select-none pointer-events-auto w-56 space-y-4"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Depth Column</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
          {currentDepth}m
        </span>
      </div>

      {/* Vertical Depth Buttons */}
      <div className="w-full flex flex-col gap-1.5">
        {DEPTH_STAGES.map((stage) => {
          const isSelected = Math.abs(currentDepth - stage.depth) < 50;
          return (
            <button
              key={stage.depth}
              onClick={() => onDepthChange(stage.depth)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 group ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/40 border border-cyan-400/60 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected
                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse'
                      : stage.isAnchor
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
                  }`}
                />
                <span>{stage.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-normal">
                {stage.zone}
              </span>
            </button>
          );
        })}
      </div>

      {/* Continuous Depth Slider */}
      <div className="w-full space-y-1 pt-1">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0m (Surface)</span>
          <span>2000m (Abyss)</span>
        </div>
        <input
          type="range"
          min={0}
          max={2000}
          step={25}
          value={currentDepth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Hydrostatic Telemetry Readouts */}
      <div className="w-full grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] font-mono">
        <div className="flex flex-col p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>PRESSURE</span>
          </div>
          <span className="text-slate-200 font-bold mt-0.5">{pressureBar} bar</span>
        </div>

        <div className="flex flex-col p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>SOLAR LIGHT</span>
          </div>
          <span className="text-slate-200 font-bold mt-0.5">{lightPct}%</span>
        </div>
      </div>
    </div>
  );
};

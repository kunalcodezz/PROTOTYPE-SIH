/**
 * OceanVision 3D - Telemetry Layers Floating Panel
 * Matches the reference design with interactive layer selectors and AI Analyst trigger.
 */

import React, { useState } from 'react';
import { LayerType } from '../../types/ocean';
import { Thermometer, Waves, Droplets, Sparkles, ChevronUp, ChevronDown, Layers } from 'lucide-react';

interface TelemetryLayersCardProps {
  activeLayer: LayerType;
  onSelectLayer: (layer: LayerType) => void;
  isAiOpen: boolean;
  onToggleAi: () => void;
}

export const TelemetryLayersCard: React.FC<TelemetryLayersCardProps> = ({
  activeLayer,
  onSelectLayer,
  isAiOpen,
  onToggleAi,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      id="hud-telemetry-layers"
      className={`bg-slate-950/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl select-none pointer-events-auto text-slate-100 transition-all duration-300 ${
        isMinimized ? 'w-64 p-4' : 'w-72 p-5 space-y-4'
      }`}
    >
      {/* Card Title & Minimize Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMinimized && <Layers className="w-4 h-4 text-cyan-400" />}
          <h2 className="text-base font-medium text-slate-100 tracking-wide">
            Telemetry Layers
          </h2>
        </div>

        {/* Minimize / Expand Button in Top Right */}
        <button
          id="btn-minimize-telemetry-layers"
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all shadow-sm"
          title={isMinimized ? 'Expand Layers' : 'Minimize Layers'}
          aria-label={isMinimized ? 'Expand Layers' : 'Minimize Layers'}
        >
          {isMinimized ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Layer Options List (Hidden when minimized) */}
      {!isMinimized && (
        <div className="space-y-2 animate-fadeIn">
          {/* 1. Global Heatmap */}
          <button
            id="btn-layer-heatmap"
            onClick={() => onSelectLayer('temperature')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              activeLayer === 'temperature'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/50 border border-slate-800/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Thermometer
                className={`w-4 h-4 ${
                  activeLayer === 'temperature' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span>Global Heatmap</span>
            </div>
            {activeLayer === 'temperature' && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
            )}
          </button>

          {/* 2. Current Flows */}
          <button
            id="btn-layer-currents"
            onClick={() => onSelectLayer('currents')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              activeLayer === 'currents'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/50 border border-slate-800/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Waves
                className={`w-4 h-4 ${
                  activeLayer === 'currents' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span>Current Flows</span>
            </div>
            {activeLayer === 'currents' && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
            )}
          </button>

          {/* 3. Salinity Levels */}
          <button
            id="btn-layer-salinity"
            onClick={() => onSelectLayer('salinity')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              activeLayer === 'salinity'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/50 border border-slate-800/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Droplets
                className={`w-4 h-4 ${
                  activeLayer === 'salinity' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span>Salinity Levels</span>
            </div>
            {activeLayer === 'salinity' && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
            )}
          </button>

          {/* 4. AI Analyst */}
          <button
            id="btn-layer-ai-analyst"
            onClick={onToggleAi}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              isAiOpen
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900/50 border border-slate-800/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles
                className={`w-4 h-4 ${
                  isAiOpen ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span>AI Analyst</span>
            </div>
            {isAiOpen ? (
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
            ) : (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-800/40">
                AI
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

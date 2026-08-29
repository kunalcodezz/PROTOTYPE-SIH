/**
 * OceanVision 3D - Scientific Legend & Color Scale Bar
 * Sleek, minimal floating HUD component matching reference design.
 */

import React from 'react';
import { LayerType } from '../../types/ocean';

interface LegendBarProps {
  activeLayerType: LayerType;
}

export const LegendBar: React.FC<LegendBarProps> = ({ activeLayerType }) => {
  let title = 'SEA SURFACE TEMPERATURE (°C)';
  let minLabel = '18°C';
  let mid1Label = '22°C';
  let mid2Label = '26°C';
  let mid3Label = '30°C';
  let maxLabel = '34°C+';
  let gradient = 'linear-gradient(to right, #0047FF 0%, #006BFF 12.5%, #00BFFF 25%, #00E5A8 37.5%, #7CFF00 50%, #FFD600 62.5%, #FF9D00 75%, #FF4D00 87.5%, #F00000 100%)';

  if (activeLayerType === 'waveHeight') {
    title = 'SIGNIFICANT WAVE HEIGHT (m)';
    minLabel = '0.5';
    mid1Label = '1.8';
    mid2Label = '3.0';
    mid3Label = '4.5';
    maxLabel = '7.0';
    gradient = 'linear-gradient(to right, #1496b4, #0a5fba, #0fa582, #eb911e, #dc3232, #9b1978)';
  } else if (activeLayerType === 'salinity') {
    title = 'SEA SURFACE SALINITY (PSU)';
    minLabel = '30';
    mid1Label = '32';
    mid2Label = '34';
    mid3Label = '36';
    maxLabel = '39';
    gradient = 'linear-gradient(to right, #8ecae6, #219ebc, #023047, #5a189a, #7b2cbf)';
  } else if (activeLayerType === 'currents') {
    title = 'CURRENT FLOW VELOCITY (m/s)';
    minLabel = '0.0';
    mid1Label = '0.5';
    mid2Label = '1.0';
    mid3Label = '1.8';
    maxLabel = '2.5+';
    gradient = 'linear-gradient(to right, #3a86ff, #06d6a0, #ffd166, #ef476f)';
  }

  return (
    <div
      id="hud-legend-bar"
      className="bg-slate-950/85 backdrop-blur-2xl border border-slate-800/90 rounded-2xl px-4 py-3 shadow-2xl select-none pointer-events-auto text-slate-100 min-w-[260px] max-w-[320px] transition-all duration-300"
    >
      {/* Title */}
      <div className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase mb-1.5">
        {title}
      </div>

      {/* Gradient Bar */}
      <div
        className="h-2.5 w-full rounded-full shadow-inner border border-slate-700/50"
        style={{ background: gradient }}
      />

      {/* Scale Labels */}
      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
        <span>{minLabel}</span>
        <span>{mid1Label}</span>
        <span>{mid2Label}</span>
        <span>{mid3Label}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

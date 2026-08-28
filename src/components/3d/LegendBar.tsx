/**
 * OceanVision 3D - Scientific Legend & Color Scale Bar
 */

import React from 'react';
import { LayerType } from '../../types/ocean';
import { getLayerConfig } from '../../utils/geoUtils';

interface LegendBarProps {
  activeLayerType: LayerType;
}

export const LegendBar: React.FC<LegendBarProps> = ({ activeLayerType }) => {
  const config = getLayerConfig(activeLayerType);

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 backdrop-blur-xl shadow-xl flex flex-col gap-2 text-xs text-slate-200">
      {/* Active Layer Metric */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-300 font-semibold uppercase">{config.name}</span>
        <span className="text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
          Unit: {config.unit}
        </span>
      </div>

      {/* Scientific Colormap Gradient */}
      <div className="space-y-1">
        <div
          className="h-2.5 w-full rounded-full border border-slate-700/50 shadow-inner"
          style={{
            background: `linear-gradient(to right, ${config.colors.join(', ')})`,
          }}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>{config.min}</span>
          <span>{config.max}</span>
        </div>
      </div>

      {/* In-Situ Marker Glyph Legend */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
          <span>Buoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
          <span>Argo Float</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
          <span>Vessel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block shadow-sm shadow-violet-400/50" />
          <span>Station</span>
        </div>
      </div>
    </div>
  );
};

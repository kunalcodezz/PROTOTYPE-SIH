/**
 * OceanVision 3D - Left Floating Vertical Temperature Scale Bar
 * Matches the HUD design with rotated label, vertical gradient, and degree ticks.
 */

import React from 'react';

interface VerticalTempBarProps {
  activeLayerType?: string;
  minTemp?: number;
  maxTemp?: number;
}

export const VerticalTempBar: React.FC<VerticalTempBarProps> = ({
  activeLayerType = 'temperature',
  minTemp = 4,
  maxTemp = 35,
}) => {
  return (
    <div
      id="hud-vertical-temp-scale"
      className="flex items-center gap-3 select-none pointer-events-auto"
    >
      {/* Outer Glass Card */}
      <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-2.5 py-4 shadow-2xl flex items-center gap-2.5">
        {/* Rotated Label */}
        <span
          className="text-[10px] font-mono tracking-widest text-slate-300 uppercase font-semibold -rotate-90 whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          TEMPERATURE
        </span>

        {/* Vertical Color Gradient Bar */}
        <div className="relative h-44 w-2.5 rounded-full overflow-hidden border border-slate-700/60 shadow-inner">
          <div
            className="w-full h-full"
            style={{
              background:
                'linear-gradient(to bottom, #f87171 0%, #fb923c 20%, #38bdf8 60%, #0369a1 85%, #082f49 100%)',
            }}
          />
        </div>
      </div>

      {/* Degree Ticks alongside */}
      <div className="flex flex-col justify-between h-44 text-xs font-mono text-slate-300/90 py-1">
        <span className="leading-none drop-shadow">35°</span>
        <span className="leading-none drop-shadow">20°</span>
        <span className="leading-none drop-shadow">5°</span>
      </div>
    </div>
  );
};

/**
 * OceanVision 3D - Center Floating Inspection Card
 * Matches the reference screenshot with crisp temperature, salinity metrics, and deep dive CTA.
 */

import React from 'react';
import { OceanLocationDetails, OceanObservation } from '../../types/ocean';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CenterInspectionCardProps {
  locationData: OceanLocationDetails | null;
  selectedObservation: OceanObservation | null;
  onOpenDeepDive: () => void;
}

export const CenterInspectionCard: React.FC<CenterInspectionCardProps> = ({
  locationData,
  selectedObservation,
  onOpenDeepDive,
}) => {
  // Region title
  const title = (
    selectedObservation?.name ||
    selectedObservation?.region ||
    locationData?.placeName ||
    locationData?.oceanRegion ||
    'EQUATORIAL PACIFIC'
  ).toUpperCase();

  // Model & observed values with fallbacks matching the mockup
  const tempVal =
    selectedObservation?.temperature ??
    locationData?.model?.temperature ??
    28.4;

  const salinityVal =
    selectedObservation?.salinity ??
    locationData?.model?.salinity ??
    34.9;

  return (
    <div
      id="hud-center-inspection-card"
      className="w-80 bg-slate-950/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-6 select-none pointer-events-auto text-slate-100 transition-all duration-300"
    >
      {/* Header Region Title */}
      <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-cyan-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
        <span className="truncate">{title}</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800/80">
        {/* Temp */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 tracking-wider font-medium uppercase">
            TEMP
          </span>
          <div className="text-3xl font-light text-slate-100 tracking-tight">
            {typeof tempVal === 'number' ? tempVal.toFixed(1) : tempVal}
            <span className="text-xl font-normal text-slate-300">°C</span>
          </div>
        </div>

        {/* Salinity */}
        <div className="pl-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 tracking-wider font-medium uppercase">
            SALINITY
          </span>
          <div className="text-3xl font-light text-slate-100 tracking-tight">
            {typeof salinityVal === 'number' ? salinityVal.toFixed(1) : salinityVal}
          </div>
          <div className="text-[11px] font-mono text-slate-400 -mt-1">psu</div>
        </div>
      </div>

      {/* Deep Dive Action Button */}
      <button
        id="btn-view-deep-dive"
        onClick={onOpenDeepDive}
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 rounded-2xl text-xs font-semibold tracking-widest uppercase transition-all duration-200 group shadow-md"
      >
        <span>VIEW DEEP DIVE</span>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

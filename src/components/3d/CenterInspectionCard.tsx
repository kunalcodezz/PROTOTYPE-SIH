/**
 * OceanVision 3D - Left Floating Inspection & Deep Dive Card
 * Matches the reference screenshot with crisp temperature, wave height, salinity metrics,
 * and support for minimizing/docking to the left side.
 */

import React, { useState } from 'react';
import { OceanLocationDetails, OceanObservation } from '../../types/ocean';
import { ArrowRight, Waves, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

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
  const [isMinimized, setIsMinimized] = useState(false);

  // Region title
  const title = (
    selectedObservation?.name ||
    selectedObservation?.region ||
    locationData?.placeName ||
    locationData?.oceanRegion ||
    'BAY OF BENGAL'
  ).toUpperCase();

  // Model & observed values with fallbacks matching the mockup
  const tempVal =
    selectedObservation?.temperature ??
    locationData?.model?.temperature ??
    29.9;

  const salinityVal =
    selectedObservation?.salinity ??
    locationData?.model?.salinity ??
    31.8;

  const waveVal =
    selectedObservation?.waveHeight ??
    locationData?.model?.waveHeight ??
    2.3;

  return (
    <div
      id="hud-center-inspection-card"
      className={`bg-slate-950/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl select-none pointer-events-auto text-slate-100 transition-all duration-300 ${
        isMinimized ? 'w-auto p-3.5' : 'w-80 p-6 space-y-5'
      }`}
    >
      {/* Header Region Title & Minimize Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
          <span className={isMinimized ? 'max-w-[130px] truncate' : 'truncate'}>{title}</span>
        </div>

        {/* Minimize / Expand Toggle Button */}
        <button
          id="btn-minimize-inspection-card"
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-7 h-7 rounded-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all shadow-sm flex-shrink-0"
          title={isMinimized ? 'Expand Inspection Card' : 'Minimize to Left'}
          aria-label={isMinimized ? 'Expand Inspection Card' : 'Minimize to Left'}
        >
          {isMinimized ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Minimized Compact Strip */}
      {isMinimized && (
        <div className="flex items-center gap-3 pt-2 text-xs font-mono text-slate-300 animate-fadeIn">
          <div className="flex items-center gap-1 text-cyan-300 font-bold">
            <span>{typeof tempVal === 'number' ? tempVal.toFixed(1) : tempVal}°C</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-slate-300">
            {typeof salinityVal === 'number' ? salinityVal.toFixed(1) : salinityVal} PSU
          </div>
          <button
            onClick={onOpenDeepDive}
            className="ml-1 p-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg text-cyan-300 hover:text-white transition-all shadow-sm"
            title="Open Deep Dive"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Details */}
      {!isMinimized && (
        <>
          {/* Primary Metrics Row: Temp & Salinity */}
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800/80 animate-fadeIn">
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
                <span className="text-xs font-mono text-slate-400 ml-1">PSU</span>
              </div>
            </div>
          </div>

          {/* Secondary Metric: Wave Height Swell Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs font-mono animate-fadeIn">
            <div className="flex items-center gap-2 text-cyan-300">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">SWELL HEIGHT:</span>
            </div>
            <span className="font-bold text-slate-100">
              {typeof waveVal === 'number' ? waveVal.toFixed(1) : waveVal}m
            </span>
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
        </>
      )}
    </div>
  );
};

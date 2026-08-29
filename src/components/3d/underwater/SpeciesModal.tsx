/**
 * OceanVision 3D - Underwater Marine Species Observation Modal
 * Displays 3D species profile, biological metrics, depth range, and observation metadata.
 */

import React from 'react';
import { Fish, X, Activity, MapPin, Clock, Box } from 'lucide-react';
import { SpeciesObservation } from '../../../data/mockBiodiversityData';

interface SpeciesModalProps {
  species: SpeciesObservation | null;
  onClose: () => void;
}

export const SpeciesModal: React.FC<SpeciesModalProps> = ({ species, onClose }) => {
  if (!species) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-inner">
              <Fish className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {species.status}
                </span>
                <span className="text-xs font-mono text-cyan-300">Depth: {species.depth}m</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-wide mt-1">
                {species.commonName}
              </h2>
              <p className="text-xs font-serif italic text-cyan-300">
                {species.scientificName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Biological Attributes Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Swimming Velocity</span>
            <div className="text-base font-bold text-cyan-300">{species.velocity} m/s</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Thermal Tolerance</span>
            <div className="text-base font-bold text-amber-300">{species.temperatureRange}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Observed School Size</span>
            <div className="text-base font-bold text-emerald-300">{species.count} specimens</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Trophic Level / Diet</span>
            <div className="text-base font-bold text-indigo-300">{species.diet}</div>
          </div>
        </div>

        {/* Coordinates & Location Telemetry Footer */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{species.locationName}</span>
            </div>
            <span className="text-cyan-400 font-bold">
              {Math.abs(species.latitude).toFixed(2)}°N, {Math.abs(species.longitude).toFixed(2)}°E
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Logged: {species.timestamp}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Box className="w-3.5 h-3.5" />
              <span>{species.modelFile}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/60 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-cyan-200 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          Resume 3D Ocean Exploration
        </button>
      </div>
    </div>
  );
};

/**
 * OceanVision 3D - Timeline Analysis Controller
 * Matches the reference design with dark glass capsule, date badge, play toggle, glowing scrubber, and T offset.
 */

import React, { useState, useEffect } from 'react';
import { TIMESTAMPS } from '../../data/mockOceanData';
import { Play, Pause } from 'lucide-react';

interface TimelineControllerProps {
  timeIndex: number;
  onChangeTimeIndex: (index: number) => void;
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  timeIndex,
  onChangeTimeIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onChangeTimeIndex((timeIndex + 1) % TIMESTAMPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, timeIndex, onChangeTimeIndex]);

  const current = TIMESTAMPS[timeIndex] || TIMESTAMPS[2];
  
  // Calculate relative T-offset (where index 2 is T+0)
  const offsetNumber = timeIndex - 2;
  const offsetLabel = offsetNumber === 0 ? 'T+0' : offsetNumber > 0 ? `T+${offsetNumber}` : `T${offsetNumber}`;

  return (
    <div
      id="hud-timeline-analysis"
      className="w-full max-w-xl bg-slate-950/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4 select-none pointer-events-auto text-slate-100"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold tracking-widest text-slate-300 uppercase">
          TIMELINE ANALYSIS
        </span>

        {/* Date Badge */}
        <div className="px-3.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300 font-medium tracking-wide shadow-sm">
          {current.label.toUpperCase()} 2026
        </div>
      </div>

      {/* Controls & Scrub Bar Row */}
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          id="btn-play-timeline"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 flex items-center justify-center text-slate-200 hover:text-cyan-300 transition-all shadow-md flex-shrink-0"
          title={isPlaying ? 'Pause' : 'Play Timeline'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Slider Scrub Track */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={TIMESTAMPS.length - 1}
            step={1}
            value={timeIndex}
            onChange={(e) => onChangeTimeIndex(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${(timeIndex / (TIMESTAMPS.length - 1)) * 100}%, #1e293b ${(timeIndex / (TIMESTAMPS.length - 1)) * 100}%, #1e293b 100%)`,
            }}
          />
        </div>

        {/* Time Offset Indicator */}
        <span className="text-xs font-mono text-slate-400 font-medium min-w-[28px] text-right">
          {offsetLabel}
        </span>
      </div>
    </div>
  );
};

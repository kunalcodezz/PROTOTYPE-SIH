/**
 * OceanVision 3D - Time Slider & Simulation Controller
 * Allows moving across historical numerical model runs and tracking drifting observational sensors.
 */

import React, { useEffect, useState } from 'react';
import { TIMESTAMPS } from '../../data/mockOceanData';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface TimeSliderProps {
  timeIndex: number;
  onChangeTimeIndex: (index: number) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  timeIndex,
  onChangeTimeIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x

  // Animation simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(2200 / playbackSpeed);
    const interval = setInterval(() => {
      onChangeTimeIndex((prev) => (prev + 1) % TIMESTAMPS.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, onChangeTimeIndex]);

  const current = TIMESTAMPS[timeIndex] || TIMESTAMPS[0];

  const handlePrev = () => {
    onChangeTimeIndex((timeIndex - 1 + TIMESTAMPS.length) % TIMESTAMPS.length);
  };

  const handleNext = () => {
    onChangeTimeIndex((timeIndex + 1) % TIMESTAMPS.length);
  };

  const cycleSpeed = () => {
    if (playbackSpeed === 1) setPlaybackSpeed(2);
    else if (playbackSpeed === 2) setPlaybackSpeed(4);
    else setPlaybackSpeed(1);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 px-4 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-4 text-slate-200">
      {/* Playback Controls & Timestamp Header */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        {/* Play / Pause buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl p-1">
          <button
            id="btn-time-prev"
            onClick={handlePrev}
            title="Previous Timestamp"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            id="btn-time-play"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Simulation' : 'Play 7-Day Time Evolution'}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors font-semibold shadow-lg shadow-cyan-500/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            id="btn-time-next"
            onClick={handleNext}
            title="Next Timestamp"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          title="Change playback speed"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono text-cyan-400 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{playbackSpeed}x</span>
        </button>

        {/* Current Time Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-slate-100">{current.formatted}</span>
        </div>
      </div>

      {/* Interactive Timeline Track */}
      <div className="flex-1 w-full flex flex-col gap-1.5">
        <div className="relative flex items-center">
          <input
            id="timeline-range-slider"
            type="range"
            min={0}
            max={TIMESTAMPS.length - 1}
            value={timeIndex}
            onChange={(e) => onChangeTimeIndex(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 z-10"
          />
        </div>

        {/* Timestamp Step Markers */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-0.5">
          {TIMESTAMPS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => onChangeTimeIndex(idx)}
              className={`transition-colors hover:text-cyan-300 ${
                idx === timeIndex ? 'text-cyan-400 font-bold underline' : ''
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

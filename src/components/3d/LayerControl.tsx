/**
 * OceanVision 3D - Layer Control Panel
 * Allows toggling oceanic physical parameters, in-situ networks, and visual rendering modes.
 */

import React, { useState } from 'react';
import { LayerSettings, LayerType } from '../../types/ocean';
import {
  Thermometer,
  Droplets,
  Wind,
  Waves,
  TrendingUp,
  Radio,
  Navigation,
  Anchor,
  Ship,
  AlertTriangle,
  Grid,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers as LayersIcon,
} from 'lucide-react';

interface LayerControlProps {
  settings: LayerSettings;
  activeLayerType: LayerType;
  onUpdateSettings: (newSettings: Partial<LayerSettings>) => void;
  onSelectActiveLayer: (layer: LayerType) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  settings,
  activeLayerType,
  onUpdateSettings,
  onSelectActiveLayer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const oceanParamLayers: { id: LayerType; label: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'temperature',
      label: 'Sea Surface Temperature',
      icon: Thermometer,
      color: 'text-orange-400',
      desc: '0°C to 34°C thermal gradient',
    },
    {
      id: 'salinity',
      label: 'Sea Surface Salinity',
      icon: Droplets,
      color: 'text-cyan-400',
      desc: '30 to 39 PSU halocline fields',
    },
    {
      id: 'currents',
      label: 'Ocean Currents',
      icon: Wind,
      color: 'text-emerald-400',
      desc: 'Hydrodynamic flow vectors & velocity',
    },
    {
      id: 'waveHeight',
      label: 'Significant Wave Height',
      icon: Waves,
      color: 'text-blue-400',
      desc: '0.5m to 8.0m swell heights',
    },
    {
      id: 'seaLevel',
      label: 'Sea Level Anomaly',
      icon: TrendingUp,
      color: 'text-purple-400',
      desc: 'Altimetry dynamic topography (SSH)',
    },
  ];

  const observationLayers = [
    {
      key: 'buoys' as keyof LayerSettings,
      label: 'Moored MetOcean Buoys',
      icon: Anchor,
      color: 'text-amber-400',
      badge: 'RAMA / NDBC',
    },
    {
      key: 'argo' as keyof LayerSettings,
      label: 'Argo Profiler Floats',
      icon: Navigation,
      color: 'text-cyan-400',
      badge: '0–2000m CTD',
    },
    {
      key: 'vessels' as keyof LayerSettings,
      label: 'Research Vessels',
      icon: Ship,
      color: 'text-emerald-400',
      badge: 'Underway Sonde',
    },
    {
      key: 'stations' as keyof LayerSettings,
      label: 'Coastal Observatories',
      icon: Radio,
      color: 'text-violet-400',
      badge: 'Tide Gauges',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl w-80 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <LayersIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">Ocean Data Layers</h3>
            <p className="text-[10px] text-slate-400 font-mono">MODEL & IN-SITU NETWORKS</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-3 text-xs">
          {/* Numerical Ocean Model Layers */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center justify-between">
              <span>Numerical Model Fields</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                ACTIVE: {activeLayerType.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5">
              {oceanParamLayers.map((layer) => {
                const Icon = layer.icon;
                const isSelected = activeLayerType === layer.id;
                const isChecked = Boolean(settings[layer.id as keyof LayerSettings]);

                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      onSelectActiveLayer(layer.id);
                      if (!isChecked) {
                        onUpdateSettings({ [layer.id]: true });
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-950/40 border-slate-800/40 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${layer.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-100">{layer.label}</div>
                        <div className="text-[10px] text-slate-400">{layer.desc}</div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateSettings({ [layer.id]: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* In-Situ Observation Networks */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              In-Situ Observational Points
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {observationLayers.map((item) => {
                const Icon = item.icon;
                const isChecked = Boolean(settings[item.key]);

                return (
                  <button
                    key={item.key}
                    onClick={() => onUpdateSettings({ [item.key]: !isChecked })}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isChecked
                        ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                        : 'bg-slate-950/30 border-slate-800/40 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`p-1 rounded bg-slate-900 ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-[11px] truncate">{item.label}</div>
                      <div className="text-[9px] font-mono text-slate-400">{item.badge}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomaly Highlight and Display Settings */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Display & Alert Overlays
            </div>

            <div className="space-y-1.5">
              {/* Anomalies alert toggle */}
              <label className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-colors">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-[11px]">Highlight Model Anomalies</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.anomalies}
                  onChange={(e) => onUpdateSettings({ anomalies: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </label>

              {/* Grid Lines */}
              <label className="flex items-center justify-between p-1.5 px-2 bg-slate-950/40 border border-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-2 text-slate-300">
                  <Grid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px]">Lat / Lon Graticule Grid</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gridLines}
                  onChange={(e) => onUpdateSettings({ gridLines: e.target.checked })}
                  className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                />
              </label>

              {/* Atmosphere Glow */}
              <label className="flex items-center justify-between p-1.5 px-2 bg-slate-950/40 border border-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">Atmospheric Glow & Lighting</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.atmosphericGlow}
                  onChange={(e) => onUpdateSettings({ atmosphericGlow: e.target.checked })}
                  className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="pt-1 border-t border-slate-800/70">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-cyan-400" /> Layer Opacity:
              </span>
              <span className="text-cyan-300 font-semibold">{Math.round(settings.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={settings.opacity}
              onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

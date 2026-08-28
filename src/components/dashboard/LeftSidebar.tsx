/**
 * OceanVision 3D - Left Navigation & Preset Sidebar
 */

import React, { useState } from 'react';
import { PRESET_LOCATIONS } from '../../data/mockOceanData';
import { OceanStats } from '../../types/ocean';
import {
  Globe,
  BarChart3,
  Radio,
  AlertTriangle,
  Code2,
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Thermometer,
} from 'lucide-react';

interface LeftSidebarProps {
  activeView: 'globe' | 'analytics' | 'observations' | 'anomalies' | 'architecture';
  onChangeView: (view: 'globe' | 'analytics' | 'observations' | 'anomalies' | 'architecture') => void;
  onSelectPresetLocation: (loc: { lat: number; lon: number; zoom?: number; name: string }) => void;
  oceanStats: OceanStats | null;
  anomaliesCount: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeView,
  onChangeView,
  onSelectPresetLocation,
  oceanStats,
  anomaliesCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: { id: any; label: string; icon: any; badge?: string }[] = [
    { id: 'globe', label: '3D Ocean Globe', icon: Globe },
    { id: 'analytics', label: 'Global Analytics', icon: BarChart3 },
    { id: 'observations', label: 'In-Situ Network', icon: Radio, badge: '14 Active' },
    {
      id: 'anomalies',
      label: 'Anomaly Center',
      icon: AlertTriangle,
      badge: `${anomaliesCount} Alerts`,
    },
    { id: 'architecture', label: 'Data Architecture', icon: Code2, badge: 'API Ext' },
  ];

  return (
    <aside
      className={`h-full bg-slate-900/95 border-r border-slate-800/90 backdrop-blur-2xl transition-all duration-300 flex flex-col z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
            Navigation Hub
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                        item.id === 'anomalies'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Preset Ocean Basins (Only when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar text-xs">
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              Preset Ocean Regions
            </div>
            <div className="space-y-1">
              {PRESET_LOCATIONS.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectPresetLocation(loc);
                    if (activeView !== 'globe') onChangeView('globe');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400/70 group-hover:text-cyan-400 shrink-0" />
                    <span className="truncate">{loc.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400">
                    Fly 3D
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Science Telemetry Mini Card */}
          {oceanStats && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 font-mono text-[11px]">
              <div className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                Global Metric Synthesis
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Mean SST:</span>
                <span className="text-cyan-400 font-bold">{oceanStats.meanTemperature}°C</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Mean Salinity:</span>
                <span className="text-purple-400 font-bold">{oceanStats.meanSalinity} PSU</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Model Assimilation:</span>
                <span className="text-emerald-400 font-bold">{oceanStats.assimilationSkillScore}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 text-center">
        {!isCollapsed ? (
          <div>
            <div>OceanVision 3D • v2.4</div>
            <div className="text-slate-600 mt-0.5">CesiumJS • Gemini 3.7 • NOAA/Copernicus</div>
          </div>
        ) : (
          <Globe className="w-4 h-4 mx-auto text-slate-600" />
        )}
      </div>
    </aside>
  );
};

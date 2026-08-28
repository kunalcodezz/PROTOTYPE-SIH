/**
 * OceanVision 3D - In-Situ Observation Network Directory
 */

import React, { useState } from 'react';
import { OceanObservation, ObservationType } from '../../types/ocean';
import { formatCoordinates } from '../../utils/geoUtils';
import {
  Radio,
  Search,
  Filter,
  Navigation,
  Anchor,
  Ship,
  Thermometer,
  Droplets,
  Waves,
  Globe2,
  ExternalLink,
  ChevronRight,
  BatteryCharging,
} from 'lucide-react';

interface ObservationsListViewProps {
  observations: OceanObservation[];
  onSelectObservation: (obs: OceanObservation) => void;
  onFlyToLocation: (lat: number, lon: number, name: string) => void;
}

export const ObservationsListView: React.FC<ObservationsListViewProps> = ({
  observations,
  onSelectObservation,
  onFlyToLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = observations.filter((obs) => {
    const matchesSearch =
      obs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obs.stationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obs.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || obs.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: ObservationType) => {
    switch (type) {
      case 'Buoy':
        return <Anchor className="w-4 h-4 text-amber-400" />;
      case 'Argo Float':
        return <Navigation className="w-4 h-4 text-cyan-400" />;
      case 'Research Vessel':
        return <Ship className="w-4 h-4 text-emerald-400" />;
      case 'Ocean Station':
        return <Radio className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 custom-scrollbar select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">In-Situ Observational Platform Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              {observations.length} SENSORS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry from moored MetOcean buoys, autonomous Argo floats, and research vessels
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {['all', 'Buoy', 'Argo Float', 'Research Vessel', 'Ocean Station'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedType === t
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Platforms' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by station ID, name, or sea region..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Grid of Observation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((obs) => (
          <div
            key={obs.id}
            className="p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl space-y-4 transition-all group flex flex-col justify-between shadow-lg"
          >
            {/* Platform Header */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {getTypeIcon(obs.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      {obs.type} • {obs.region}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 leading-snug group-hover:text-cyan-300 transition-colors">
                      {obs.name}
                    </h3>
                  </div>
                </div>

                <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-400">
                  {obs.stationId}
                </span>
              </div>

              {/* Coordinates & Transmission */}
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{formatCoordinates(obs.latitude, obs.longitude)}</span>
                <span className="text-emerald-400">Telemetry: {obs.lastTransmitted}</span>
              </div>

              {/* Sensor Parameters */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" /> SST
                  </div>
                  <div className="font-bold text-slate-100 mt-0.5">{obs.temperature}°C</div>
                </div>

                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> SSS
                  </div>
                  <div className="font-bold text-slate-100 mt-0.5">{obs.salinity} PSU</div>
                </div>

                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Waves className="w-3 h-3 text-blue-400" /> Wave
                  </div>
                  <div className="font-bold text-slate-100 mt-0.5">{obs.waveHeight ?? '—'}m</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectObservation(obs);
                  onFlyToLocation(obs.latitude, obs.longitude, obs.name);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Fly in 3D View</span>
              </button>

              <button
                onClick={() => onSelectObservation(obs)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                title="Inspect Sensor Data"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

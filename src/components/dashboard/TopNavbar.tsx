/**
 * OceanVision 3D - Top Navbar Component
 * Matches the reference screenshot with centered search bar, custom action glyphs, and cyan SEARCH button.
 */

import React, { useState } from 'react';
import { PRESET_LOCATIONS } from '../../data/mockOceanData';
import { Compass, Search, Layers, Eye, Sliders, X } from 'lucide-react';

interface TopNavbarProps {
  onSelectSearchTarget: (target: { lat: number; lon: number; zoom?: number; name: string }) => void;
  onToggleLayers?: () => void;
  onToggleAtmosphere?: () => void;
  onResetView?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onSelectSearchTarget,
  onToggleLayers,
  onToggleAtmosphere,
  onResetView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredLocations = PRESET_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (loc: typeof PRESET_LOCATIONS[0]) => {
    onSelectSearchTarget(loc);
    setSearchQuery(loc.name);
    setIsSearchOpen(false);
  };

  const handlePerformSearch = () => {
    if (filteredLocations.length > 0) {
      handleSelect(filteredLocations[0]);
    } else {
      setIsSearchOpen(true);
    }
  };

  return (
    <header className="relative w-full px-6 py-4 flex items-center justify-between pointer-events-none select-none z-30">
      {/* 1. Left Logo */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-8 h-8 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-950/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
          <Compass className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
          <span>OceanVision</span>
          <span className="text-cyan-400 font-bold">3D</span>
        </h1>
      </div>

      {/* 2. Center Search Pill */}
      <div className="relative pointer-events-auto w-full max-w-md mx-6">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search coordinates or regions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePerformSearch();
            }}
            className="w-full bg-slate-950/70 backdrop-blur-xl border border-slate-800 focus:border-cyan-500/80 rounded-full pl-11 pr-10 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-xl"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
            {filteredLocations.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelect(loc)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-cyan-300 hover:bg-slate-900 transition-colors flex items-center justify-between"
                  >
                    <span>{loc.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {loc.lat > 0 ? `${loc.lat}°N` : `${Math.abs(loc.lat)}°S`},{' '}
                      {loc.lon > 0 ? `${loc.lon}°E` : `${Math.abs(loc.lon)}°W`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No matching ocean basin found
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Action Tools & SEARCH Button */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Layer Icon */}
        <button
          id="btn-nav-layers"
          onClick={onToggleLayers}
          title="Toggle Layers"
          className="w-9 h-9 rounded-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-colors shadow-lg"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Eye Icon */}
        <button
          id="btn-nav-eye"
          onClick={onToggleAtmosphere}
          title="Toggle Atmosphere Glow"
          className="w-9 h-9 rounded-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-colors shadow-lg"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Settings / Reset Icon */}
        <button
          id="btn-nav-settings"
          onClick={onResetView}
          title="Reset View"
          className="w-9 h-9 rounded-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-colors shadow-lg"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* SEARCH Pill Button */}
        <button
          id="btn-nav-search-cta"
          onClick={handlePerformSearch}
          className="px-5 py-2 rounded-full bg-cyan-600/70 hover:bg-cyan-500/80 border border-cyan-400/40 text-slate-100 hover:text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg shadow-cyan-900/30 ml-1"
        >
          SEARCH
        </button>
      </div>
    </header>
  );
};

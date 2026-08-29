/**
 * OceanVision 3D - Main Application
 * Interactive 3D Earth Ocean Telemetry & Numerical Model Exploration System
 * Supports Ocean Region Selection, Cinematic Zoom, and Telemetry Deep Dive.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  OceanModelPoint,
  OceanObservation,
  OceanLocationDetails,
  OceanAnomaly,
  OceanStats,
  LayerSettings,
  LayerType,
} from './types/ocean';
import { OceanDataService } from './services/oceanApi';
import { TIMESTAMPS } from './data/mockOceanData';
import { OCEAN_REGIONS, OceanRegion, detectOceanRegion } from './data/oceanRegions';
import { CesiumGlobe } from './components/3d/CesiumGlobe';
import { OceanFocusOverlay } from './components/3d/OceanFocusOverlay';
import { TopNavbar } from './components/dashboard/TopNavbar';
import { TelemetryLayersCard } from './components/3d/TelemetryLayersCard';
import { CenterInspectionCard } from './components/3d/CenterInspectionCard';
import { LegendBar } from './components/3d/LegendBar';
import { ModelVsObsModal } from './components/dashboard/ModelVsObsModal';
import { OceanAnalystChat } from './components/ai/OceanAnalystChat';

export default function App() {
  // Simulation Time Index (0 to 6; default 2 corresponds to 27 Aug 2026)
  const [timeIndex, setTimeIndex] = useState<number>(2);

  // Ocean Datasets
  const [modelPoints, setModelPoints] = useState<OceanModelPoint[]>([]);
  const [observations, setObservations] = useState<OceanObservation[]>([]);
  const [anomalies, setAnomalies] = useState<OceanAnomaly[]>([]);
  const [oceanStats, setOceanStats] = useState<OceanStats | null>(null);

  // Active Parameter Layer (default 'temperature' matches "Global Heatmap")
  const [activeLayerType, setActiveLayerType] = useState<LayerType>('temperature');

  // Layer rendering settings
  const [layerSettings, setLayerSettings] = useState<LayerSettings>({
    temperature: true,
    salinity: true,
    currents: true,
    waveHeight: true,
    seaLevel: true,
    buoys: true,
    argo: true,
    vessels: true,
    stations: true,
    anomalies: true,
    opacity: 0.85,
    atmosphericGlow: true,
    gridLines: false,
    labels: true,
  });

  // Selected Ocean Region & Focus Mode
  const [selectedRegion, setSelectedRegion] = useState<OceanRegion | null>(null);
  const isFocusMode = Boolean(selectedRegion);
  const [depthMeters, setDepthMeters] = useState<number>(0);

  // Selected Coordinates & Location details (default to Bay of Bengal / Arabian Sea)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>({
    lat: 14.5,
    lon: 88.5, // Bay of Bengal
  });
  const [locationDetails, setLocationDetails] = useState<OceanLocationDetails | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<OceanObservation | null>(null);

  // Camera Fly-To Target
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lon: number; zoom?: number; name?: string } | null>(
    null
  );

  // Modals & Panels
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

  // Load ocean data for timestamp
  const loadDataForTimestamp = useCallback(async (tIndex: number) => {
    try {
      const [points, obs, anoms, stats] = await Promise.all([
        OceanDataService.getGriddedModelData(tIndex),
        OceanDataService.getObservations(tIndex),
        OceanDataService.getAnomalies(tIndex),
        OceanDataService.getOceanStats(tIndex),
      ]);

      setModelPoints(points);
      setObservations(obs);
      setAnomalies(anoms);
      setOceanStats(stats);
    } catch (err) {
      console.error('Failed to load ocean data:', err);
    }
  }, []);

  useEffect(() => {
    loadDataForTimestamp(timeIndex);
  }, [timeIndex, loadDataForTimestamp]);

  // Load location details when coordinate or time changes
  useEffect(() => {
    if (!selectedCoordinates) return;
    OceanDataService.getLocationDetails(
      selectedCoordinates.lat,
      selectedCoordinates.lon,
      timeIndex
    ).then((details) => {
      setLocationDetails(details);
    });
  }, [selectedCoordinates, timeIndex]);

  // Nearby observations in focused region
  const nearbyObservations = useMemo(() => {
    if (!selectedRegion) return [];
    return observations.filter(
      (o) =>
        o.latitude >= selectedRegion.bounds.minLat &&
        o.latitude <= selectedRegion.bounds.maxLat &&
        o.longitude >= selectedRegion.bounds.minLon &&
        o.longitude <= selectedRegion.bounds.maxLon
    );
  }, [observations, selectedRegion]);

  // Coordinate click handler
  const handleSelectLocation = useCallback((lat: number, lon: number) => {
    setSelectedCoordinates({ lat, lon });
    setObservations((currentObs) => {
      const nearest = currentObs.find(
        (o) => Math.abs(o.latitude - lat) < 1.5 && Math.abs(o.longitude - lon) < 1.5
      );
      setSelectedObservation(nearest || null);
      return currentObs;
    });
  }, []);

  // Observation click handler
  const handleSelectObservation = useCallback((obs: OceanObservation) => {
    setSelectedObservation(obs);
    setSelectedCoordinates({ lat: obs.latitude, lon: obs.longitude });
  }, []);

  // Target navigation from search
  const handleNavigateToTarget = useCallback((target: { lat: number; lon: number; zoom?: number; name?: string }) => {
    const region = detectOceanRegion(target.lat, target.lon);
    if (region) {
      setSelectedRegion(region);
    }
    setFlyToTarget({
      lat: target.lat,
      lon: target.lon,
      zoom: target.zoom || 3500000,
    });
    setSelectedCoordinates({ lat: target.lat, lon: target.lon });
  }, []);

  // Open Deep Dive Comparison Modal
  const handleOpenDeepDive = () => {
    setIsDeepDiveOpen(true);
  };

  // Back to Globe handler
  const handleBackToGlobe = () => {
    setSelectedRegion(null);
    setDepthMeters(0);
    setFlyToTarget({ lat: 10.0, lon: 75.0, zoom: 12500000 });
  };

  const currentTimestampObj = TIMESTAMPS[timeIndex] || TIMESTAMPS[2];

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Fullscreen Interactive 3D Cesium Globe */}
      <div className="absolute inset-0 z-0">
        <CesiumGlobe
          modelPoints={modelPoints}
          observations={observations}
          anomalies={anomalies}
          layerSettings={layerSettings}
          activeLayerType={activeLayerType}
          selectedLocation={selectedCoordinates}
          selectedRegion={selectedRegion}
          isFocusMode={isFocusMode}
          isUnderwater={false}
          depthMeters={depthMeters}
          onSelectLocation={handleSelectLocation}
          onSelectObservation={handleSelectObservation}
          onSelectRegion={setSelectedRegion}
          flyToTarget={flyToTarget}
        />
      </div>

      {/* 2. Ocean Focus Mode Minimal Floating HUD */}
      {selectedRegion && (
        <OceanFocusOverlay
          selectedRegion={selectedRegion}
          isFocusMode={isFocusMode}
          isUnderwater={false}
          depthMeters={depthMeters}
          activeVariable={activeLayerType}
          nearbyObservations={nearbyObservations}
          selectedObservation={selectedObservation}
          onBackToGlobe={handleBackToGlobe}
          onToggleUnderwater={() => {}}
          onChangeDepth={setDepthMeters}
          onChangeVariable={setActiveLayerType}
          onSelectObservation={handleSelectObservation}
        />
      )}

      {/* 3. Global Top Navbar Overlay (Visible only when NOT in Ocean Focus Mode) */}
      {!isFocusMode && (
        <div className="absolute top-0 left-0 right-0 z-20 transition-opacity duration-500">
          <TopNavbar
            onSelectSearchTarget={handleNavigateToTarget}
            onToggleLayers={() => {
              setActiveLayerType((prev) =>
                prev === 'temperature' ? 'currents' : prev === 'currents' ? 'salinity' : 'temperature'
              );
            }}
            onToggleAtmosphere={() => {
              setLayerSettings((prev) => ({
                ...prev,
                atmosphericGlow: !prev.atmosphericGlow,
              }));
            }}
            onResetView={handleBackToGlobe}
          />
        </div>
      )}

      {/* 4. Right Top Telemetry Layers Card (Visible only when NOT in Ocean Focus Mode) */}
      {!isFocusMode && (
        <div className="absolute top-20 right-6 z-20 transition-opacity duration-500">
          <TelemetryLayersCard
            activeLayer={activeLayerType}
            onSelectLayer={setActiveLayerType}
            isAiOpen={isAiOpen}
            onToggleAi={() => setIsAiOpen(!isAiOpen)}
          />
        </div>
      )}

      {/* 5. Left Floating Inspection Card (Visible when NOT in focus mode) */}
      {!isFocusMode && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-500">
          <div className="pointer-events-auto">
            <CenterInspectionCard
              locationData={locationDetails}
              selectedObservation={selectedObservation}
              onOpenDeepDive={handleOpenDeepDive}
            />
          </div>
        </div>
      )}

      {/* 6. Bottom Left Live Ocean Data Pill (Global View Only) */}
      {!isFocusMode && (
        <div className="absolute bottom-8 left-6 z-20 transition-opacity duration-500">
          <div
            id="hud-live-data-pill"
            className="flex items-center gap-2.5 px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 rounded-full shadow-2xl text-xs font-mono tracking-wider uppercase text-slate-200"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
            <span className="font-semibold text-slate-200">LIVE OCEAN DATA</span>
          </div>
        </div>
      )}

      {/* 7. Bottom Right Scientific Legend Bar (Global View Only) */}
      {!isFocusMode && (
        <div className="absolute bottom-8 right-6 z-20 transition-opacity duration-500">
          <LegendBar activeLayerType={activeLayerType} />
        </div>
      )}

      {/* 8. AI Ocean Analyst Drawer */}
      <OceanAnalystChat
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        selectedLocation={locationDetails}
        selectedObservation={selectedObservation}
        currentTimestamp={currentTimestampObj.formatted}
        activeLayers={[
          activeLayerType,
          ...(layerSettings.buoys ? ['Buoys'] : []),
          ...(layerSettings.argo ? ['Argo Floats'] : []),
        ]}
        anomalies={anomalies}
      />

      {/* 9. Model vs Observation Deep Dive Modal */}
      {isDeepDiveOpen && (
        <ModelVsObsModal
          locationData={locationDetails}
          selectedObservation={selectedObservation}
          onClose={() => setIsDeepDiveOpen(false)}
          onAskAIAboutComparison={() => {
            setIsDeepDiveOpen(false);
            setIsAiOpen(true);
          }}
        />
      )}
    </div>
  );
}

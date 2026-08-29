/**
 * OceanVision 3D - Main Application
 * Interactive 3D Earth Ocean Telemetry & Numerical Model Exploration System
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { CesiumGlobe } from './components/3d/CesiumGlobe';
import { TopNavbar } from './components/dashboard/TopNavbar';
import { TelemetryLayersCard } from './components/3d/TelemetryLayersCard';
import { CenterInspectionCard } from './components/3d/CenterInspectionCard';
import { TimelineController } from './components/3d/TimelineController';
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

  // Selected Coordinates & Location details (default to Equatorial Pacific / Arabian Sea)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>({
    lat: 0.0,
    lon: -140.0, // Equatorial Pacific
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

  // Coordinate click
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

  // Observation click
  const handleSelectObservation = useCallback((obs: OceanObservation) => {
    setSelectedObservation(obs);
    setSelectedCoordinates({ lat: obs.latitude, lon: obs.longitude });
  }, []);

  // Target navigation from search
  const handleNavigateToTarget = useCallback((target: { lat: number; lon: number; zoom?: number; name?: string }) => {
    setFlyToTarget({
      lat: target.lat,
      lon: target.lon,
      zoom: target.zoom || 4500000,
    });
    setSelectedCoordinates({ lat: target.lat, lon: target.lon });
  }, []);

  const currentTimestampObj = TIMESTAMPS[timeIndex] || TIMESTAMPS[2];

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Fullscreen Single 3D Globe */}
      <div className="absolute inset-0 z-0">
        <CesiumGlobe
          modelPoints={modelPoints}
          observations={observations}
          anomalies={anomalies}
          layerSettings={layerSettings}
          activeLayerType={activeLayerType}
          selectedLocation={selectedCoordinates}
          onSelectLocation={handleSelectLocation}
          onSelectObservation={handleSelectObservation}
          flyToTarget={flyToTarget}
        />
      </div>

      {/* 2. Top Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20">
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
          onResetView={() => {
            setFlyToTarget({ lat: 0.0, lon: -140.0, zoom: 11000000 });
          }}
        />
      </div>

      {/* 3. Right Top Telemetry Layers Card */}
      <div className="absolute top-20 right-6 z-20">
        <TelemetryLayersCard
          activeLayer={activeLayerType}
          onSelectLayer={setActiveLayerType}
          isAiOpen={isAiOpen}
          onToggleAi={() => setIsAiOpen(!isAiOpen)}
        />
      </div>

      {/* 4. Left Floating Inspection Card */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <CenterInspectionCard
            locationData={locationDetails}
            selectedObservation={selectedObservation}
            onOpenDeepDive={() => setIsDeepDiveOpen(true)}
          />
        </div>
      </div>

      {/* 6. Bottom Left Live Ocean Data Pill */}
      <div className="absolute bottom-8 left-6 z-20">
        <div
          id="hud-live-data-pill"
          className="flex items-center gap-2.5 px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 rounded-full shadow-2xl text-xs font-mono tracking-wider uppercase text-slate-200"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
          <span className="font-semibold text-slate-200">LIVE OCEAN DATA</span>
        </div>
      </div>

      {/* 7. Bottom Center Timeline Controller */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4">
        <TimelineController timeIndex={timeIndex} onChangeTimeIndex={setTimeIndex} />
      </div>

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

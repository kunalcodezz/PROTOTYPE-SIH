/**
 * OceanVision 3D - Interactive CesiumJS 3D Globe Component
 * High-performance geospatial scientific ocean rendering engine.
 * Delivers clean, realistic 3D Earth, continuous ocean scalar heatmap,
 * fluid current streamlines, and minimal glowing in-situ sensor points.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  OceanModelPoint,
  OceanObservation,
  OceanAnomaly,
  LayerSettings,
  LayerType,
} from '../../types/ocean';
import { CesiumFlowParticleSystem } from '../../utils/CesiumFlowParticleSystem';
import { OceanHeatmapRenderer } from '../../utils/OceanHeatmapRenderer';
import { OceanRegion, detectOceanRegion } from '../../data/oceanRegions';
import {
  flyToOceanRegion,
  flyToUnderwaterMode,
} from '../../utils/cinematicCamera';
import { Radio } from 'lucide-react';

interface CesiumGlobeProps {
  modelPoints: OceanModelPoint[];
  observations: OceanObservation[];
  anomalies: OceanAnomaly[];
  layerSettings: LayerSettings;
  activeLayerType: LayerType;
  selectedLocation: { lat: number; lon: number } | null;
  selectedRegion: OceanRegion | null;
  isFocusMode: boolean;
  isUnderwater: boolean;
  depthMeters: number;
  onSelectLocation: (lat: number, lon: number) => void;
  onSelectObservation: (obs: OceanObservation) => void;
  onSelectRegion: (region: OceanRegion | null) => void;
  flyToTarget?: { lat: number; lon: number; zoom?: number } | null;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = React.memo(({
  modelPoints,
  observations,
  anomalies,
  layerSettings,
  activeLayerType,
  selectedLocation,
  selectedRegion,
  isFocusMode,
  isUnderwater,
  depthMeters,
  onSelectLocation,
  onSelectObservation,
  onSelectRegion,
  flyToTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const hoveredEntityRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const isCameraMovingRef = useRef(false);

  // Performance: Track the last hovered entity name to avoid re-renders on every mouse pixel
  const lastHoveredNameRef = useRef<string | null>(null);

  // Dedicated entity collections
  const observationEntitiesRef = useRef<Cesium.Entity[]>([]);
  const anomalyEntitiesRef = useRef<Cesium.Entity[]>([]);
  const selectionEntityRef = useRef<Cesium.Entity | null>(null);

  // Performance systems
  const flowSystemRef = useRef<CesiumFlowParticleSystem | null>(null);
  const heatmapRef = useRef<OceanHeatmapRenderer | null>(null);
  const heatmapLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  // Keep callback refs stable inside viewer event listener
  const onSelectLocationRef = useRef(onSelectLocation);
  onSelectLocationRef.current = onSelectLocation;
  const onSelectObservationRef = useRef(onSelectObservation);
  onSelectObservationRef.current = onSelectObservation;
  const onSelectRegionRef = useRef(onSelectRegion);
  onSelectRegionRef.current = onSelectRegion;

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      Cesium.Ion.defaultAccessToken = '';

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        baseLayerPicker: false,
        baseLayer: false,
        scene3DOnly: true,
        shouldAnimate: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      viewerRef.current = viewer;

      // Dark aesthetic & realistic space backdrop
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a192f');
      viewer.scene.globe.enableLighting = true;

      // Screen space camera controller tuning for fluid, crisp Google Earth feel
      const controller = viewer.scene.screenSpaceCameraController;
      controller.inertiaSpin = 0.05;
      controller.inertiaTranslate = 0.05;
      controller.inertiaZoom = 0.05;
      controller.zoomFactor = 4.0;
      controller.maximumZoomDistance = 40000000;
      controller.minimumZoomDistance = 10000;
      controller.enableCollisionDetection = true;

      // Render fidelity & tile streaming optimizations
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);
      viewer.scene.globe.maximumScreenSpaceError = 2.0;
      viewer.scene.globe.tileCacheSize = 250;
      viewer.scene.globe.preloadAncestors = true;
      viewer.scene.globe.preloadSiblings = true;
      viewer.scene.globe.loadingDescendantLimit = 20;

      if (viewer.scene.globe) {
        viewer.scene.globe.showGroundAtmosphere = layerSettings.atmosphericGlow;
      }
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = layerSettings.atmosphericGlow;
        viewer.scene.skyAtmosphere.hueShift = -0.05;
        viewer.scene.skyAtmosphere.saturationShift = 0.25;
        viewer.scene.skyAtmosphere.brightnessShift = 0.15;
      }

      // Add high-resolution base imagery provider (ESRI World Imagery)
      try {
        const baseImageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: 'Tiles © Esri',
          maximumLevel: 18,
        });
        const baseImagery = viewer.imageryLayers.addImageryProvider(baseImageryProvider);
        baseImagery.alpha = 0.95;
        baseImagery.brightness = 0.92;
        baseImagery.contrast = 1.2;
        baseImagery.saturation = 1.15;
      } catch (imageryErr) {
        console.warn('Could not attach satellite base layer:', imageryErr);
      }

      // Continuous Ocean Heatmap Renderer & Native WebGL Flow Particle System
      heatmapRef.current = new OceanHeatmapRenderer();
      flowSystemRef.current = new CesiumFlowParticleSystem(viewer);

      // Initial Camera orbital view centered on the Indian Ocean & Arabian Sea
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(72.0, 16.0, 11500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-88),
          roll: 0.0,
        },
      });

      // Camera movement tracking to avoid picking during rotation/zoom
      const onCameraMoveStart = () => {
        isCameraMovingRef.current = true;
      };
      const onCameraMoveEnd = () => {
        isCameraMovingRef.current = false;
      };
      viewer.camera.moveStart.addEventListener(onCameraMoveStart);
      viewer.camera.moveEnd.addEventListener(onCameraMoveEnd);

      // Screen space event handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // Track drag interactions to prevent expensive GPU picks while rotating/panning
      handler.setInputAction(() => {
        isDraggingRef.current = true;
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      handler.setInputAction(() => {
        isDraggingRef.current = false;
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      handler.setInputAction(() => {
        isDraggingRef.current = true;
      }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

      handler.setInputAction(() => {
        isDraggingRef.current = false;
      }, Cesium.ScreenSpaceEventType.RIGHT_UP);

      handler.setInputAction(() => {
        isDraggingRef.current = true;
      }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

      handler.setInputAction(() => {
        isDraggingRef.current = false;
      }, Cesium.ScreenSpaceEventType.MIDDLE_UP);

      handler.setInputAction(() => {
        isDraggingRef.current = true;
      }, Cesium.ScreenSpaceEventType.PINCH_START);

      handler.setInputAction(() => {
        isDraggingRef.current = false;
      }, Cesium.ScreenSpaceEventType.PINCH_END);

      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pickedObject = viewer.scene.pick(movement.position);

        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id as Cesium.Entity;

          // Picked In-situ Observation Marker (Argo float, Buoy, Ship, Station)
          if (entity.properties && entity.properties.hasProperty('observationData')) {
            const obsData = entity.properties.getValue(Cesium.JulianDate.now()).observationData as OceanObservation;
            onSelectObservationRef.current(obsData);
            onSelectLocationRef.current(obsData.latitude, obsData.longitude);
            return;
          }

          if (entity.properties && entity.properties.hasProperty('anomalyData')) {
            const anomData = entity.properties.getValue(Cesium.JulianDate.now()).anomalyData as OceanAnomaly;
            onSelectLocationRef.current(anomData.latitude, anomData.longitude);
            return;
          }
        }

        // Clicked geographic coordinates on Globe
        const ray = viewer.camera.getPickRay(movement.position);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            onSelectLocationRef.current(lat, lon);

            const detected = detectOceanRegion(lat, lon);
            if (detected) {
              onSelectRegionRef.current(detected);
              flyToOceanRegion(viewer, detected);
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      let lastPickTime = 0;
      let pendingPickTimeout: any = null;

      const performPick = (endPos: Cesium.Cartesian2) => {
        if (!viewer || viewer.isDestroyed()) return;
        if (isDraggingRef.current || isCameraMovingRef.current) return;

        const picked = viewer.scene.pick(endPos);
        const containerEl = viewer.container as HTMLElement;
        const newName = Cesium.defined(picked) && picked.id && picked.id.name ? (picked.id.name as string) : null;

        if (newName !== lastHoveredNameRef.current) {
          lastHoveredNameRef.current = newName;
          hoveredEntityRef.current = newName;
          setHoveredEntity(newName);
          if (containerEl?.style) {
            containerEl.style.cursor = newName ? 'pointer' : 'default';
          }
        }
      };

      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        if (isDraggingRef.current || isCameraMovingRef.current) {
          if (hoveredEntityRef.current !== null) {
            hoveredEntityRef.current = null;
            lastHoveredNameRef.current = null;
            setHoveredEntity(null);
            const containerEl = viewer.container as HTMLElement;
            if (containerEl?.style) containerEl.style.cursor = 'default';
          }
          return;
        }

        const now = performance.now();
        if (now - lastPickTime < 60) {
          if (!pendingPickTimeout) {
            pendingPickTimeout = setTimeout(() => {
              pendingPickTimeout = null;
              if (!isDraggingRef.current && !isCameraMovingRef.current) {
                performPick(movement.endPosition);
              }
            }, 60);
          }
          return;
        }

        lastPickTime = now;
        performPick(movement.endPosition);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      setIsLoaded(true);

      return () => {
        viewer.camera.moveStart.removeEventListener(onCameraMoveStart);
        viewer.camera.moveEnd.removeEventListener(onCameraMoveEnd);
        if (pendingPickTimeout) clearTimeout(pendingPickTimeout);
        handler.destroy();
        if (flowSystemRef.current) {
          flowSystemRef.current.destroy();
          flowSystemRef.current = null;
        }
        if (heatmapRef.current) {
          heatmapRef.current.destroy();
          heatmapRef.current = null;
        }
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy();
        }
        viewerRef.current = null;
      };
    } catch (err: any) {
      console.error('Cesium Initialization Error:', err);
      setInitError(err?.message || 'Failed to initialize Cesium 3D Engine.');
    }
  }, []);

  // Update Atmosphere and Depth Volumetric Tint
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (viewer.scene.globe) {
      viewer.scene.globe.showGroundAtmosphere = layerSettings.atmosphericGlow;
    }
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = layerSettings.atmosphericGlow;
      if (isUnderwater) {
        viewer.scene.skyAtmosphere.hueShift = -0.15;
        viewer.scene.skyAtmosphere.saturationShift = 0.45;
        viewer.scene.skyAtmosphere.brightnessShift = 0.25;
      } else {
        viewer.scene.skyAtmosphere.hueShift = -0.05;
        viewer.scene.skyAtmosphere.saturationShift = 0.25;
        viewer.scene.skyAtmosphere.brightnessShift = 0.15;
      }
    }
  }, [layerSettings.atmosphericGlow, isUnderwater]);

  // Update Particle System Focus & Depth
  useEffect(() => {
    if (!flowSystemRef.current) return;
    if (selectedRegion && isFocusMode) {
      flowSystemRef.current.setFocusRegion(selectedRegion.bounds, depthMeters);
    } else {
      flowSystemRef.current.setFocusRegion(null, depthMeters);
    }
  }, [selectedRegion, isFocusMode, depthMeters]);

  // Handle Underwater Camera Flight
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded || !selectedRegion) return;

    if (isUnderwater) {
      flyToUnderwaterMode(viewer, selectedRegion, depthMeters);
    } else if (isFocusMode) {
      flyToOceanRegion(viewer, selectedRegion);
    }
  }, [isUnderwater]);

  // Update Continuous Masked Ocean Heatmap Layer & Native Flow Particle System
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;
    if (!heatmapRef.current || !flowSystemRef.current) return;

    const isTemperatureActive = activeLayerType === 'temperature' && layerSettings.temperature;
    const isSalinityActive = activeLayerType === 'salinity' && layerSettings.salinity;
    const isCurrentsActive = activeLayerType === 'currents' && layerSettings.currents;
    const isWaveActive = activeLayerType === 'waveHeight' && layerSettings.waveHeight;
    const isSeaLevelActive = activeLayerType === 'seaLevel' && layerSettings.seaLevel;

    const showScalarField = isTemperatureActive || isSalinityActive || isWaveActive || isSeaLevelActive || isCurrentsActive;
    const showFlow = isCurrentsActive || isTemperatureActive || isWaveActive;

    let isCancelled = false;

    // 1. Render continuous ocean field clipped strictly to the coastlines
    if (showScalarField && modelPoints.length > 0) {
      heatmapRef.current.render(modelPoints, activeLayerType, isUnderwater ? depthMeters : 0);

      if (heatmapLayerRef.current) {
        try { viewer.imageryLayers.remove(heatmapLayerRef.current, false); } catch (_) {}
        heatmapLayerRef.current = null;
      }

      const dataUrl = heatmapRef.current.getCanvas().toDataURL('image/png');
      Cesium.SingleTileImageryProvider.fromUrl(dataUrl, {
        rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
      }).then((provider) => {
        if (isCancelled || !viewerRef.current || viewerRef.current.isDestroyed()) return;
        const layer = viewerRef.current.imageryLayers.addImageryProvider(provider);
        
        let targetAlpha = 0.58;
        if (isTemperatureActive) {
          targetAlpha = isFocusMode ? 0.75 : 0.62;
        } else if (isWaveActive) {
          targetAlpha = isFocusMode ? 0.78 : 0.66;
        } else if (isSalinityActive) {
          targetAlpha = isFocusMode ? 0.78 : 0.65;
        } else if (isCurrentsActive) {
          targetAlpha = 0.40;
        }

        layer.alpha = targetAlpha;
        layer.brightness = isFocusMode ? 1.15 : 1.08;
        layer.contrast = 1.12;
        heatmapLayerRef.current = layer;
      }).catch((err) => {
        console.warn('Failed to load ocean heatmap imagery provider:', err);
      });
    } else {
      if (heatmapLayerRef.current) {
        try { viewer.imageryLayers.remove(heatmapLayerRef.current, false); } catch (_) {}
        heatmapLayerRef.current = null;
      }
    }

    // 2. Update Native WebGL Particle Flow System (strictly ocean-bound)
    if (showFlow && modelPoints.length > 0) {
      flowSystemRef.current.updateData(modelPoints);
      flowSystemRef.current.show();
    } else {
      flowSystemRef.current.hide();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    modelPoints,
    activeLayerType,
    layerSettings.temperature,
    layerSettings.salinity,
    layerSettings.currents,
    layerSettings.waveHeight,
    layerSettings.seaLevel,
    isFocusMode,
    isUnderwater,
    depthMeters,
    isLoaded,
  ]);

  // Render Minimal Elegant In-Situ Observation Points (Argo Floats, Buoys, Vessels, Stations)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    observationEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    observationEntitiesRef.current = [];

    const entities: Cesium.Entity[] = [];

    observations.forEach((obs) => {
      if (obs.type === 'Buoy' && !layerSettings.buoys) return;
      if (obs.type === 'Argo Float' && !layerSettings.argo) return;
      if (obs.type === 'Research Vessel' && !layerSettings.vessels) return;
      if (obs.type === 'Ocean Station' && !layerSettings.stations) return;

      let pointColor = '#3b82f6';
      let pixelSize = 4.5;

      if (obs.type === 'Buoy') {
        pointColor = '#f59e0b';
      } else if (obs.type === 'Argo Float') {
        pointColor = '#06b6d4';
        pixelSize = 4.0;
      } else if (obs.type === 'Research Vessel') {
        pointColor = '#10b981';
        pixelSize = 5.0;
      } else if (obs.type === 'Ocean Station') {
        pointColor = '#8b5cf6';
      }

      const entity = viewer.entities.add({
        name: `${obs.type}: ${obs.name} (${obs.stationId})`,
        position: Cesium.Cartesian3.fromDegrees(obs.longitude, obs.latitude, 2500),
        point: {
          pixelSize: pixelSize,
          color: Cesium.Color.fromCssColorString(pointColor).withAlpha(0.9),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.85),
          outlineWidth: 1.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000000),
        },
        properties: new Cesium.PropertyBag({
          observationData: obs,
        }),
      });

      entities.push(entity);
    });

    observationEntitiesRef.current = entities;
  // Performance: Only depend on observation-relevant settings, not ALL of layerSettings
  }, [observations, layerSettings.buoys, layerSettings.argo, layerSettings.vessels, layerSettings.stations, isFocusMode, selectedRegion, isLoaded]);

  // Render Anomalies Layer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    anomalyEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    anomalyEntitiesRef.current = [];

    if (!layerSettings.anomalies) return;

    const entities: Cesium.Entity[] = [];

    anomalies.forEach((anom) => {
      const isSig = anom.severity === 'Significant';
      const glowColor = isSig ? '#ef4444' : '#f59e0b';

      const entity = viewer.entities.add({
        name: `⚠️ Anomaly: ${anom.parameter} (${anom.locationName})`,
        position: Cesium.Cartesian3.fromDegrees(anom.longitude, anom.latitude, 8000),
        ellipse: {
          semiMinorAxis: isSig ? 350000 : 250000,
          semiMajorAxis: isSig ? 350000 : 250000,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString(glowColor).withAlpha(0.35)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(glowColor),
          outlineWidth: 2.5,
          height: 8000,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000000),
        },
        label: {
          text: `⚠️ ${anom.parameter} Anomaly: ${anom.difference > 0 ? '+' : ''}${anom.difference} ${anom.unit}`,
          font: 'bold 12px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString(glowColor),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -28),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000000),
        },
        properties: new Cesium.PropertyBag({
          anomalyData: anom,
        }),
      });

      entities.push(entity);
    });

    anomalyEntitiesRef.current = entities;
  }, [anomalies, layerSettings.anomalies, isLoaded]);

  // Render Selected Location Minimal Pulse Point
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    if (selectionEntityRef.current) {
      viewer.entities.remove(selectionEntityRef.current);
      selectionEntityRef.current = null;
    }

    if (!selectedLocation) return;

    const entity = viewer.entities.add({
      name: `Selected: ${selectedLocation.lat.toFixed(2)}°, ${selectedLocation.lon.toFixed(2)}°`,
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.lon, selectedLocation.lat, 3000),
      point: {
        pixelSize: 7,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
    });

    selectionEntityRef.current = entity;
  }, [selectedLocation, isLoaded]);

  // Handle generic camera flyTo (from external search)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded || !flyToTarget) return;

    const zoomAltitude = flyToTarget.zoom || 3500000;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToTarget.lon,
        flyToTarget.lat,
        zoomAltitude
      ),
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-82),
        roll: 0.0,
      },
    });
  }, [flyToTarget, isLoaded]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {initError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center">
          <div className="max-w-md bg-slate-900 border border-red-500/40 rounded-xl p-6 shadow-2xl">
            <Radio className="w-10 h-10 text-red-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">3D Engine Initialization Issue</h3>
            <p className="text-sm text-slate-400 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry Initialization
            </button>
          </div>
        </div>
      )}

      {hoveredEntity && !isFocusMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-2 bg-slate-950/90 border border-cyan-500/40 rounded-full shadow-lg backdrop-blur-md text-xs font-mono text-cyan-300 animate-fadeIn">
          {hoveredEntity}
        </div>
      )}
    </div>
  );
});

/**
 * OceanVision 3D - Interactive CesiumJS 3D Globe Component
 * High-performance geospatial scientific ocean rendering engine.
 * 
 * Features:
 * - Instant canvas-based smooth temperature heatmap overlay
 * - Native 60 FPS WebGL PointPrimitive particle flow system
 * - In-situ observation markers (buoys, Argo floats, vessels, stations)
 * - Anomaly detection zones
 * - Enhanced atmospheric glow for realistic space view
 */

import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  OceanModelPoint,
  OceanObservation,
  OceanAnomaly,
  LayerSettings,
  LayerType,
} from '../../types/ocean';
import {
  getSalinityColor,
  getWaveHeightColor,
  getSeaLevelColor,
} from '../../utils/geoUtils';
import { CesiumFlowParticleSystem } from '../../utils/CesiumFlowParticleSystem';
import { OceanHeatmapRenderer } from '../../utils/OceanHeatmapRenderer';
import { Radio } from 'lucide-react';

interface CesiumGlobeProps {
  modelPoints: OceanModelPoint[];
  observations: OceanObservation[];
  anomalies: OceanAnomaly[];
  layerSettings: LayerSettings;
  activeLayerType: LayerType;
  selectedLocation: { lat: number; lon: number } | null;
  onSelectLocation: (lat: number, lon: number) => void;
  onSelectObservation: (obs: OceanObservation) => void;
  flyToTarget?: { lat: number; lon: number; zoom?: number } | null;
}

// Cache observation pin textures to avoid creating hundreds of 2D canvases
const pinCache = new Map<string, HTMLCanvasElement>();
function getOrCreatePinCanvas(type: string, pinColor: string): HTMLCanvasElement {
  if (pinCache.has(type)) return pinCache.get(type)!;
  const pinCanvas = document.createElement('canvas');
  pinCanvas.width = 48;
  pinCanvas.height = 48;
  const ctx = pinCanvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, 2 * Math.PI);
    ctx.fillStyle = `${pinColor}33`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pinColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(24, 24, 11, 0, 2 * Math.PI);
    ctx.fillStyle = pinColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  pinCache.set(type, pinCanvas);
  return pinCanvas;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = React.memo(({
  modelPoints,
  observations,
  anomalies,
  layerSettings,
  activeLayerType,
  selectedLocation,
  onSelectLocation,
  onSelectObservation,
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

  // Dedicated entity collections
  const modelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const observationEntitiesRef = useRef<Cesium.Entity[]>([]);
  const anomalyEntitiesRef = useRef<Cesium.Entity[]>([]);
  const selectionEntityRef = useRef<Cesium.Entity | null>(null);
  const gridImageryLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  // Performance systems
  const flowSystemRef = useRef<CesiumFlowParticleSystem | null>(null);
  const heatmapRef = useRef<OceanHeatmapRenderer | null>(null);
  const heatmapLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  // Keep callback refs stable inside viewer event listener
  const onSelectLocationRef = useRef(onSelectLocation);
  onSelectLocationRef.current = onSelectLocation;
  const onSelectObservationRef = useRef(onSelectObservation);
  onSelectObservationRef.current = onSelectObservation;

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

      // Dark aesthetic & atmosphere
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
        viewer.scene.skyAtmosphere.saturationShift = 0.2;
        viewer.scene.skyAtmosphere.brightnessShift = 0.12;
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

      // Heatmap Renderer & Native WebGL Flow Particle System
      heatmapRef.current = new OceanHeatmapRenderer();
      flowSystemRef.current = new CesiumFlowParticleSystem(viewer);

      // Initial Camera fly to view the Indian Ocean
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(72.0, 16.0, 10500000),
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

        const ray = viewer.camera.getPickRay(movement.position);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            onSelectLocationRef.current(lat, lon);
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
        const newName = Cesium.defined(picked) && picked.id && picked.id.name ? picked.id.name : null;

        if (newName !== hoveredEntityRef.current) {
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

  // Update atmosphere and grid lines
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (viewer.scene.globe) {
      viewer.scene.globe.showGroundAtmosphere = layerSettings.atmosphericGlow;
    }
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = layerSettings.atmosphericGlow;
    }

    if (layerSettings.gridLines) {
      if (!gridImageryLayerRef.current) {
        gridImageryLayerRef.current = viewer.imageryLayers.addImageryProvider(
          new Cesium.GridImageryProvider({
            color: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.25),
            cells: 8,
          })
        );
      }
    } else {
      if (gridImageryLayerRef.current) {
        viewer.imageryLayers.remove(gridImageryLayerRef.current);
        gridImageryLayerRef.current = null;
      }
    }
  }, [layerSettings.atmosphericGlow, layerSettings.gridLines]);

  // Update Heatmap + WebGL Flow Particles for temperature & currents
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;
    if (!heatmapRef.current || !flowSystemRef.current) return;

    const isTemperatureActive = activeLayerType === 'temperature' && layerSettings.temperature;
    const isCurrentsActive = activeLayerType === 'currents' && layerSettings.currents;
    const showHeatmap = isTemperatureActive || isCurrentsActive;
    const showFlow = isCurrentsActive || isTemperatureActive;

    let isCancelled = false;

    // 1. Update Heatmap Layer (rendered once per data change)
    if (showHeatmap && modelPoints.length > 0) {
      heatmapRef.current.render(modelPoints);

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
        layer.alpha = isTemperatureActive ? 0.55 : 0.38;
        layer.brightness = 1.08;
        layer.contrast = 1.05;
        heatmapLayerRef.current = layer;
      }).catch((err) => {
        console.warn('Failed to load heatmap imagery provider:', err);
      });
    } else {
      if (heatmapLayerRef.current) {
        try { viewer.imageryLayers.remove(heatmapLayerRef.current, false); } catch (_) {}
        heatmapLayerRef.current = null;
      }
    }

    // 2. Update Native WebGL Particle Flow System
    if (showFlow && modelPoints.length > 0) {
      flowSystemRef.current.updateData(modelPoints);
      flowSystemRef.current.show();
    } else {
      flowSystemRef.current.hide();
    }

    return () => {
      isCancelled = true;
    };
  }, [modelPoints, activeLayerType, layerSettings.temperature, layerSettings.currents, isLoaded]);

  // Render Entity-based Ocean Model Layer Points (for salinity, waveHeight, seaLevel)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    modelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    modelEntitiesRef.current = [];

    if (activeLayerType === 'temperature' || activeLayerType === 'currents') return;

    const isLayerVisible =
      (activeLayerType === 'salinity' && layerSettings.salinity) ||
      (activeLayerType === 'waveHeight' && layerSettings.waveHeight) ||
      (activeLayerType === 'seaLevel' && layerSettings.seaLevel);

    if (!isLayerVisible) return;

    const entities: Cesium.Entity[] = [];

    modelPoints.forEach((pt) => {
      let colorHex = '#0077be';
      let radiusMeters = 180000;
      let labelText = '';

      if (activeLayerType === 'salinity') {
        colorHex = getSalinityColor(pt.salinity);
        labelText = `${pt.salinity} PSU`;
      } else if (activeLayerType === 'waveHeight') {
        colorHex = getWaveHeightColor(pt.waveHeight);
        labelText = `${pt.waveHeight}m`;
      } else if (activeLayerType === 'seaLevel') {
        colorHex = getSeaLevelColor(pt.seaLevel);
        labelText = `${pt.seaLevel > 0 ? '+' : ''}${pt.seaLevel}m`;
      }

      const cesiumColor = Cesium.Color.fromCssColorString(colorHex).withAlpha(
        layerSettings.opacity * 0.75
      );

      const entity = viewer.entities.add({
        name: `Model Grid Point: ${labelText}`,
        position: Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, 2000),
        ellipse: {
          semiMinorAxis: radiusMeters,
          semiMajorAxis: radiusMeters,
          material: new Cesium.ColorMaterialProperty(cesiumColor),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(colorHex).withAlpha(0.9),
          outlineWidth: 1.5,
          height: 1000,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000000),
        },
      });

      entities.push(entity);
    });

    modelEntitiesRef.current = entities;
  }, [modelPoints, activeLayerType, layerSettings, isLoaded]);

  // Render Observation Markers (Buoys, Argo Floats, Research Vessels, Stations)
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

      let pinColor = '#3b82f6';
      let scale = 1.0;

      if (obs.type === 'Buoy') {
        pinColor = '#f59e0b';
        scale = 1.1;
      } else if (obs.type === 'Argo Float') {
        pinColor = '#06b6d4';
        scale = 1.0;
      } else if (obs.type === 'Research Vessel') {
        pinColor = '#10b981';
        scale = 1.2;
      } else if (obs.type === 'Ocean Station') {
        pinColor = '#8b5cf6';
        scale = 1.15;
      }

      const pinCanvas = getOrCreatePinCanvas(obs.type, pinColor);

      const entity = viewer.entities.add({
        name: `${obs.type}: ${obs.name} (${obs.stationId})`,
        position: Cesium.Cartesian3.fromDegrees(obs.longitude, obs.latitude, 5000),
        billboard: {
          image: pinCanvas,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          scale: scale,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000000),
        },
        label: layerSettings.labels
          ? {
              text: `${obs.stationId}\n${obs.temperature}°C`,
              font: '11px "Space Mono", monospace',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -26),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000000),
            }
          : undefined,
        properties: new Cesium.PropertyBag({
          observationData: obs,
        }),
      });

      entities.push(entity);
    });

    observationEntitiesRef.current = entities;
  }, [observations, layerSettings, isLoaded]);

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

  // Render Selected Location Radar Ring
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
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.lon, selectedLocation.lat, 4000),
      ellipse: {
        semiMinorAxis: 180000,
        semiMajorAxis: 180000,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.2)
        ),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineWidth: 3,
        height: 4000,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#0284c7'),
        outlineWidth: 3,
      },
    });

    selectionEntityRef.current = entity;
  }, [selectedLocation, isLoaded]);

  // Handle camera flyTo
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
      duration: 1.8,
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

      {hoveredEntity && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-2 bg-slate-950/90 border border-cyan-500/40 rounded-full shadow-lg backdrop-blur-md text-xs font-mono text-cyan-300 animate-fadeIn">
          {hoveredEntity}
        </div>
      )}
    </div>
  );
});

/**
 * OceanVision 3D - Interactive CesiumJS 3D Globe Component
 * High-performance geospatial scientific ocean rendering engine.
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
import {
  getTemperatureColor,
  getSalinityColor,
  getCurrentSpeedColor,
  getWaveHeightColor,
  getSeaLevelColor,
} from '../../utils/geoUtils';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Globe as GlobeIcon,
  Crosshair,
  Radio,
  Eye,
  EyeOff,
} from 'lucide-react';

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

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
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
  const [cameraAltitudeKm, setCameraAltitudeKm] = useState<number>(12000);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Dedicated entity collections
  const modelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const observationEntitiesRef = useRef<Cesium.Entity[]>([]);
  const anomalyEntitiesRef = useRef<Cesium.Entity[]>([]);
  const selectionEntityRef = useRef<Cesium.Entity | null>(null);
  const gridImageryLayerRef = useRef<Cesium.ImageryLayer | null>(null);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Disable default Cesium Ion requests to avoid 401 unauthorized errors
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
        baseLayer: false, // Prevents default Cesium Ion imagery request
        scene3DOnly: true,
        shouldAnimate: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      viewerRef.current = viewer;

      // Scientific dark aesthetic configuration
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a192f');
      viewer.scene.globe.enableLighting = true;
      if (viewer.scene.globe) {
        viewer.scene.globe.showGroundAtmosphere = layerSettings.atmosphericGlow;
      }
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = layerSettings.atmosphericGlow;
      }

      // Add high-resolution base imagery provider (ESRI World Imagery / CartoDB Voyager)
      try {
        const baseImageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maximumLevel: 18,
        });
        const baseImagery = viewer.imageryLayers.addImageryProvider(baseImageryProvider);
        baseImagery.alpha = 0.92;
        baseImagery.brightness = 0.85;
        baseImagery.contrast = 1.15;
      } catch (imageryErr) {
        console.warn('Could not attach satellite base layer:', imageryErr);
      }

      // Initial Camera fly to view the Indian Ocean & Arabian Sea centerpiece
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(72.0, 16.0, 10500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-88),
          roll: 0.0,
        },
      });

      // Camera change listener for altitude metric
      viewer.camera.changed.addEventListener(() => {
        if (viewer.camera) {
          const height = viewer.camera.positionCartographic.height / 1000;
          setCameraAltitudeKm(Math.round(height));
        }
      });

      // Screen space event handler for clicks and hovers
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // Handle Left Click
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const pickedObject = viewer.scene.pick(movement.position);

        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id as Cesium.Entity;
          
          // If clicked an observation marker
          if (entity.properties && entity.properties.hasProperty('observationData')) {
            const obsData = entity.properties.getValue(Cesium.JulianDate.now()).observationData as OceanObservation;
            onSelectObservation(obsData);
            onSelectLocation(obsData.latitude, obsData.longitude);
            return;
          }

          // If clicked an anomaly marker
          if (entity.properties && entity.properties.hasProperty('anomalyData')) {
            const anomData = entity.properties.getValue(Cesium.JulianDate.now()).anomalyData as OceanAnomaly;
            onSelectLocation(anomData.latitude, anomData.longitude);
            return;
          }
        }

        // Raycast ray to globe surface
        const ray = viewer.camera.getPickRay(movement.position);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            const lon = Cesium.Math.toDegrees(cartographic.longitude);
            onSelectLocation(lat, lon);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Handle Mouse Hover
      handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        const picked = viewer.scene.pick(movement.endPosition);
        const containerEl = viewer.container as HTMLElement;
        if (Cesium.defined(picked) && picked.id && picked.id.name) {
          setHoveredEntity(picked.id.name);
          if (containerEl?.style) containerEl.style.cursor = 'pointer';
        } else {
          setHoveredEntity(null);
          if (containerEl?.style) containerEl.style.cursor = 'default';
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      setIsLoaded(true);

      return () => {
        handler.destroy();
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

  // Update atmosphere and grid lines when layerSettings change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (viewer.scene.globe) {
      viewer.scene.globe.showGroundAtmosphere = layerSettings.atmosphericGlow;
    }
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = layerSettings.atmosphericGlow;
    }

    // Grid lines (Graticule)
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

  // Render Gridded Ocean Model Layer Points
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    // Clear previous model entities
    modelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    modelEntitiesRef.current = [];

    // If ocean layers are active
    const isLayerVisible =
      (activeLayerType === 'temperature' && layerSettings.temperature) ||
      (activeLayerType === 'salinity' && layerSettings.salinity) ||
      (activeLayerType === 'currents' && layerSettings.currents) ||
      (activeLayerType === 'waveHeight' && layerSettings.waveHeight) ||
      (activeLayerType === 'seaLevel' && layerSettings.seaLevel);

    if (!isLayerVisible) return;

    const entities: Cesium.Entity[] = [];

    modelPoints.forEach((pt) => {
      let colorHex = '#0077be';
      let radiusMeters = 180000;
      let labelText = '';

      if (activeLayerType === 'temperature') {
        colorHex = getTemperatureColor(pt.temperature);
        labelText = `${pt.temperature}°C`;
      } else if (activeLayerType === 'salinity') {
        colorHex = getSalinityColor(pt.salinity);
        labelText = `${pt.salinity} PSU`;
      } else if (activeLayerType === 'currents') {
        colorHex = getCurrentSpeedColor(pt.currentSpeed);
        labelText = `${pt.currentSpeed} m/s`;
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

      // Model Ellipse / Thermal Disc Entity
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
        },
      });

      entities.push(entity);

      // If active layer is ocean currents, draw directional velocity vector line
      if (activeLayerType === 'currents' && layerSettings.currents) {
        const arrowLengthDeg = Math.min(1.8, Math.max(0.4, pt.currentSpeed * 1.0));
        const rad = Cesium.Math.toRadians(pt.currentDirection);
        const endLat = pt.latitude + arrowLengthDeg * Math.cos(rad);
        const endLon = pt.longitude + (arrowLengthDeg * Math.sin(rad)) / Math.max(0.2, Math.cos(Cesium.Math.toRadians(pt.latitude)));

        const arrowEntity = viewer.entities.add({
          name: `Current Vector: ${pt.currentSpeed} m/s @ ${pt.currentDirection}°`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              pt.longitude, pt.latitude, 3000,
              endLon, endLat, 3000,
            ]),
            width: 3.5,
            material: new Cesium.PolylineArrowMaterialProperty(
              Cesium.Color.fromCssColorString(colorHex).withAlpha(0.95)
            ),
          },
        });
        entities.push(arrowEntity);
      }
    });

    modelEntitiesRef.current = entities;
  }, [modelPoints, activeLayerType, layerSettings, isLoaded]);

  // Render Observation Markers (Buoys, Argo Floats, Research Vessels, Stations)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !isLoaded) return;

    // Clear previous observation entities
    observationEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    observationEntitiesRef.current = [];

    const entities: Cesium.Entity[] = [];

    observations.forEach((obs) => {
      // Check individual layer toggles
      if (obs.type === 'Buoy' && !layerSettings.buoys) return;
      if (obs.type === 'Argo Float' && !layerSettings.argo) return;
      if (obs.type === 'Research Vessel' && !layerSettings.vessels) return;
      if (obs.type === 'Ocean Station' && !layerSettings.stations) return;

      let pinColor = '#3b82f6';
      let iconSymbol = '📍';
      let scale = 1.0;

      if (obs.type === 'Buoy') {
        pinColor = '#f59e0b'; // Amber
        iconSymbol = '⚓';
        scale = 1.1;
      } else if (obs.type === 'Argo Float') {
        pinColor = '#06b6d4'; // Cyan
        iconSymbol = '🌀';
        scale = 1.0;
      } else if (obs.type === 'Research Vessel') {
        pinColor = '#10b981'; // Emerald
        iconSymbol = '🚢';
        scale = 1.2;
      } else if (obs.type === 'Ocean Station') {
        pinColor = '#8b5cf6'; // Violet
        iconSymbol = '📡';
        scale = 1.15;
      }

      // Create SVG pin canvas for clean crisp icons on globe
      const pinCanvas = document.createElement('canvas');
      pinCanvas.width = 48;
      pinCanvas.height = 48;
      const ctx = pinCanvas.getContext('2d');
      if (ctx) {
        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(24, 24, 20, 0, 2 * Math.PI);
        ctx.fillStyle = `${pinColor}33`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = pinColor;
        ctx.stroke();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(24, 24, 11, 0, 2 * Math.PI);
        ctx.fillStyle = pinColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const entity = viewer.entities.add({
        name: `${obs.type}: ${obs.name} (${obs.stationId})`,
        position: Cesium.Cartesian3.fromDegrees(obs.longitude, obs.latitude, 5000),
        billboard: {
          image: pinCanvas,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          scale: scale,
          heightReference: Cesium.HeightReference.NONE,
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
        },
        properties: new Cesium.PropertyBag({
          anomalyData: anom,
        }),
      });

      entities.push(entity);
    });

    anomalyEntitiesRef.current = entities;
  }, [anomalies, layerSettings.anomalies, isLoaded]);

  // Render Selected Location Radar Ring & Beacon
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

  // Handle programmatic camera flyTo (Preset locations / search)
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

  // Navigation handlers
  const handleZoomIn = () => {
    viewerRef.current?.camera.zoomIn(cameraAltitudeKm * 350);
  };

  const handleZoomOut = () => {
    viewerRef.current?.camera.zoomOut(cameraAltitudeKm * 350);
  };

  const handleResetNorth = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const carto = viewer.camera.positionCartographic;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-88),
        roll: 0.0,
      },
      duration: 1.2,
    });
  };

  const handleFocusGlobal = () => {
    viewerRef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(72.0, 16.0, 12000000),
      duration: 1.6,
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Cesium canvas mounting container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Error fallback if WebGL or Cesium fails */}
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

      {/* Floating Hover Entity Tooltip */}
      {hoveredEntity && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-2 bg-slate-950/90 border border-cyan-500/40 rounded-full shadow-lg backdrop-blur-md text-xs font-mono text-cyan-300 animate-fadeIn">
          {hoveredEntity}
        </div>
      )}
    </div>
  );
};

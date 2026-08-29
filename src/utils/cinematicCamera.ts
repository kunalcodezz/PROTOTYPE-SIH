/**
 * OceanVision 3D - Cinematic Camera Controller
 * Delivers curved orbital-to-basin trajectories with smooth cubic/quintic easing.
 */

import * as Cesium from 'cesium';
import { OceanRegion } from '../data/oceanRegions';

export interface CinematicCameraOptions {
  duration?: number;
  pitchDeg?: number;
  headingDeg?: number;
  rollDeg?: number;
  curveArc?: boolean;
  onComplete?: () => void;
}

/**
 * Calculate dynamic flight duration (1.5s to 3.0s) based on geodesic angular distance
 */
export function calculateCinematicDuration(
  startCartographic: Cesium.Cartographic,
  targetLat: number,
  targetLon: number,
  targetAltitude: number
): number {
  const targetRadLat = Cesium.Math.toRadians(targetLat);
  const targetRadLon = Cesium.Math.toRadians(targetLon);

  // Spherical angular distance (Haversine formula)
  const dLat = targetRadLat - startCartographic.latitude;
  const dLon = targetRadLon - startCartographic.longitude;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startCartographic.latitude) *
      Math.cos(targetRadLat) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const angularDistance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // radians [0 .. PI]

  // Height ratio difference
  const altDiff = Math.abs(startCartographic.height - targetAltitude);
  const altFactor = Math.min(altDiff / 10000000, 1.0);

  // Normalized factor [0..1]
  const distFactor = (angularDistance / Math.PI) * 0.7 + altFactor * 0.3;

  // Scale smoothly between 1.7s and 2.9s
  const duration = 1.7 + distFactor * 1.2;
  return Math.min(Math.max(duration, 1.5), 3.0);
}

/**
 * Perform a cinematic curved flight to an ocean region
 */
export function flyToOceanRegion(
  viewer: Cesium.Viewer,
  region: OceanRegion,
  options?: CinematicCameraOptions
): void {
  if (!viewer || viewer.isDestroyed()) return;

  const currentCartesian = viewer.camera.position;
  const currentCarto = Cesium.Cartographic.fromCartesian(currentCartesian);

  const targetAlt = region.camera.altitude;
  const targetHeading = Cesium.Math.toRadians(options?.headingDeg ?? region.camera.heading);
  const targetPitch = Cesium.Math.toRadians(options?.pitchDeg ?? region.camera.pitch);
  const targetRoll = Cesium.Math.toRadians(options?.rollDeg ?? region.camera.roll);

  const duration =
    options?.duration ??
    calculateCinematicDuration(currentCarto, region.center.lat, region.center.lon, targetAlt);

  // For curved cinematic arcs, calculate maximumHeight when transitioning across long distances
  const maxArcHeight = Math.max(currentCarto.height, targetAlt) * 1.15;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      region.center.lon,
      region.center.lat,
      targetAlt
    ),
    orientation: {
      heading: targetHeading,
      pitch: targetPitch,
      roll: targetRoll,
    },
    duration: duration,
    maximumHeight: maxArcHeight > 8000000 ? maxArcHeight : undefined,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    complete: () => {
      if (options?.onComplete) {
        options.onComplete();
      }
    },
  });
}

/**
 * Perform a cinematic zoom-out back to the global Earth view
 */
export function flyBackToGlobalEarth(
  viewer: Cesium.Viewer,
  onComplete?: () => void
): void {
  if (!viewer || viewer.isDestroyed()) return;

  const currentCarto = Cesium.Cartographic.fromCartesian(viewer.camera.position);
  const targetLon = Cesium.Math.toDegrees(currentCarto.longitude);
  const targetLat = Cesium.Math.toDegrees(currentCarto.latitude) * 0.5;

  const duration = 2.2;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(targetLon, targetLat, 12500000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-88),
      roll: 0.0,
    },
    duration: duration,
    easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
    complete: () => {
      if (onComplete) onComplete();
    },
  });
}

/**
 * Perform cinematic transition into Underwater / Sub-surface Mode
 */
export function flyToUnderwaterMode(
  viewer: Cesium.Viewer,
  region: OceanRegion,
  depthMeters: number,
  onComplete?: () => void
): void {
  if (!viewer || viewer.isDestroyed()) return;

  // In Cesium, altitude of ~50,000m to 120,000m gives a stunning close-up subsurface perspective
  const underwaterAlt = Math.max(region.camera.underwaterAlt || 90000, 40000);
  const tiltPitch = region.camera.underwaterPitch || -25;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      region.center.lon,
      region.center.lat,
      underwaterAlt
    ),
    orientation: {
      heading: Cesium.Math.toRadians(region.camera.heading + 15),
      pitch: Cesium.Math.toRadians(tiltPitch),
      roll: Cesium.Math.toRadians(2),
    },
    duration: 1.8,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    complete: onComplete,
  });
}

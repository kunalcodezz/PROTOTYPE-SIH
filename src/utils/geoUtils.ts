/**
 * OceanVision 3D - Geophysical & Color Scale Utilities
 */

import { LayerType } from '../types/ocean';

/**
 * Maps Temperature in °C (0°C to 32°C) to scientific colormap hex string (Viridis / Turbo / Ocean Thermal)
 */
export function getTemperatureColor(temp: number): string {
  // Normalize between 0 and 32
  const t = Math.min(32, Math.max(0, temp)) / 32;

  if (t < 0.2) return '#003366'; // Deep polar blue
  if (t < 0.35) return '#0077be'; // Cold ocean cyan
  if (t < 0.5) return '#00b4d8'; // Temperate cyan
  if (t < 0.65) return '#52b788'; // Mild green-cyan
  if (t < 0.78) return '#f4a261'; // Subtropical amber
  if (t < 0.9) return '#e76f51'; // Warm orange
  return '#d62828'; // Tropical deep red
}

/**
 * Maps Salinity in PSU (30 to 39 PSU) to halocline colormap
 */
export function getSalinityColor(salinity: number): string {
  // Normalize between 30 and 39
  const s = Math.min(39, Math.max(30, salinity));
  const norm = (s - 30) / 9;

  if (norm < 0.25) return '#8ecae6'; // Low salinity freshwater lens (Ganges/Rivers)
  if (norm < 0.5) return '#219ebc'; // Moderate salinity
  if (norm < 0.75) return '#023047'; // Typical oceanic
  return '#7b2cbf'; // High evaporation salinity (Arabian Sea / Med)
}

/**
 * Maps Current Speed in m/s (0 to 2.5 m/s) to velocity intensity
 */
export function getCurrentSpeedColor(speed: number): string {
  if (speed < 0.3) return '#3a86ff'; // Slow drift
  if (speed < 0.7) return '#06d6a0'; // Moderate current
  if (speed < 1.3) return '#ffd166'; // Strong boundary flow
  return '#ef476f'; // High speed jet (Gulf Stream / Kuroshio)
}

/**
 * Maps Wave Height in meters (0 to 8m)
 */
export function getWaveHeightColor(wave: number): string {
  if (wave < 1.5) return '#48cae4'; // Calm/slight
  if (wave < 2.5) return '#0077b6'; // Moderate
  if (wave < 4.0) return '#e09f3e'; // Rough
  return '#9e2a2b'; // High / Heavy polar swell
}

/**
 * Maps Sea Level Anomaly in meters (-0.25m to +0.25m)
 */
export function getSeaLevelColor(seaLevel: number): string {
  if (seaLevel < -0.08) return '#1d3557'; // Depressed SSH
  if (seaLevel < 0.0) return '#457b9d';
  if (seaLevel < 0.08) return '#a8dadc';
  return '#e63946'; // Elevated SSH (Warm cyclonic/anticyclonic core)
}

/**
 * Returns descriptive color and unit for an active layer
 */
export function getLayerConfig(layer: LayerType): { name: string; unit: string; min: string; max: string; colors: string[] } {
  switch (layer) {
    case 'temperature':
      return {
        name: 'Sea Surface Temperature',
        unit: '°C',
        min: '0°C',
        max: '32°C',
        colors: ['#003366', '#0077be', '#00b4d8', '#52b788', '#f4a261', '#e76f51', '#d62828'],
      };
    case 'salinity':
      return {
        name: 'Sea Surface Salinity',
        unit: 'PSU',
        min: '30 PSU',
        max: '39 PSU',
        colors: ['#8ecae6', '#219ebc', '#023047', '#5a189a', '#7b2cbf'],
      };
    case 'currents':
      return {
        name: 'Ocean Currents Velocity',
        unit: 'm/s',
        min: '0.0 m/s',
        max: '2.5 m/s',
        colors: ['#3a86ff', '#06d6a0', '#ffd166', '#ef476f'],
      };
    case 'waveHeight':
      return {
        name: 'Significant Wave Height',
        unit: 'm',
        min: '0.5 m',
        max: '7.5 m',
        colors: ['#48cae4', '#0077b6', '#e09f3e', '#9e2a2b'],
      };
    case 'seaLevel':
      return {
        name: 'Sea Level Anomaly (SSH)',
        unit: 'm',
        min: '-0.20 m',
        max: '+0.20 m',
        colors: ['#1d3557', '#457b9d', '#a8dadc', '#e63946'],
      };
    default:
      return {
        name: 'Observation Stations',
        unit: 'Points',
        min: 'Moored',
        max: 'Drifting',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      };
  }
}

/**
 * Formats latitude and longitude nicely
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

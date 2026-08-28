/**
 * OceanVision 3D - Mock Ocean Data Provider & Geophysical Models
 * Generates realistic numerical model grids, in-situ observation platforms, and anomaly metrics.
 */

import {
  OceanModelPoint,
  OceanObservation,
  OceanAnomaly,
  OceanStats,
  TimeSeriesPoint,
  DepthProfilePoint,
  OceanLocationDetails,
  ComparisonMetric,
  AnomalySeverity
} from '../types/ocean';

export const TIMESTAMPS: { id: string; label: string; iso: string; formatted: string }[] = [
  { id: 't0', label: '25 Aug', iso: '2026-08-25T00:00:00Z', formatted: '25 Aug 2026, 00:00 UTC' },
  { id: 't1', label: '26 Aug', iso: '2026-08-26T00:00:00Z', formatted: '26 Aug 2026, 00:00 UTC' },
  { id: 't2', label: '27 Aug', iso: '2026-08-27T00:00:00Z', formatted: '27 Aug 2026, 00:00 UTC' },
  { id: 't3', label: '28 Aug', iso: '2026-08-28T00:00:00Z', formatted: '28 Aug 2026, 00:00 UTC' },
  { id: 't4', label: '29 Aug', iso: '2026-08-29T00:00:00Z', formatted: '29 Aug 2026, 00:00 UTC' },
  { id: 't5', label: '30 Aug', iso: '2026-08-30T00:00:00Z', formatted: '30 Aug 2026, 00:00 UTC' },
  { id: 't6', label: '31 Aug', iso: '2026-08-31T00:00:00Z', formatted: '31 Aug 2026, 00:00 UTC' },
];

export const PRESET_LOCATIONS = [
  { name: 'Mumbai Coast (Arabian Sea)', lat: 18.92, lon: 72.83, zoom: 1500000 },
  { name: 'Arabian Sea Center', lat: 15.0, lon: 65.0, zoom: 3500000 },
  { name: 'Bay of Bengal Deep Basin', lat: 14.5, lon: 88.5, zoom: 3500000 },
  { name: 'Equatorial Indian Ocean', lat: 0.0, lon: 80.5, zoom: 4500000 },
  { name: 'Gulf of Mexico (NOAA NDBC)', lat: 25.5, lon: -90.0, zoom: 3000000 },
  { name: 'North Atlantic Gulf Stream', lat: 35.0, lon: -65.0, zoom: 3500000 },
  { name: 'Kuroshio Extension (Pacific)', lat: 32.5, lon: 140.0, zoom: 3500000 },
  { name: 'Southern Ocean Swell Zone', lat: -48.0, lon: 90.0, zoom: 5000000 },
  { name: 'Great Barrier Reef (Coral Sea)', lat: -18.0, lon: 150.0, zoom: 3000000 },
  { name: 'Mediterranean Sea', lat: 35.5, lon: 18.0, zoom: 2800000 },
];

// In-situ observation network base points (buoys, Argo floats, research ships, moored stations)
export const RAW_OBSERVATION_STATIONS: OceanObservation[] = [
  // Arabian Sea & Indian Ocean
  {
    id: 'obs-as-1',
    stationId: 'RAMA-IN-01',
    name: 'RAMA Moored Buoy AS-01',
    type: 'Buoy',
    latitude: 15.0,
    longitude: 68.0,
    timestamp: '2026-08-27T12:00:00Z',
    temperature: 28.6,
    salinity: 36.4,
    currentSpeed: 0.72,
    currentDirection: 215,
    waveHeight: 2.3,
    seaLevel: 0.04,
    batteryLevel: 94,
    lastTransmitted: '12 mins ago',
    region: 'Arabian Sea',
    metadata: {
      wmoId: '23001',
      institution: 'INCOIS / NOAA PMEL',
      sensorType: 'Sea-Bird CTD + Acoustic Doppler (ADCP)',
      deploymentDate: '2024-03-15',
    },
    depthProfile: [
      { depth: 0, temperature: 28.6, salinity: 36.4, oxygen: 210 },
      { depth: 20, temperature: 28.2, salinity: 36.4, oxygen: 205 },
      { depth: 50, temperature: 26.5, salinity: 36.2, oxygen: 180 },
      { depth: 100, temperature: 22.1, salinity: 35.8, oxygen: 90 },
      { depth: 200, temperature: 16.4, salinity: 35.4, oxygen: 40 },
      { depth: 500, temperature: 11.2, salinity: 35.1, oxygen: 30 },
      { depth: 1000, temperature: 7.8, salinity: 34.9, oxygen: 55 },
      { depth: 2000, temperature: 3.2, salinity: 34.7, oxygen: 120 },
    ],
  },
  {
    id: 'obs-as-2',
    stationId: 'ARGO-IND-2903',
    name: 'Argo Profiler Float 2903881',
    type: 'Argo Float',
    latitude: 18.52,
    longitude: 71.87,
    timestamp: '2026-08-27T14:00:00Z',
    temperature: 28.4,
    salinity: 34.9,
    currentSpeed: 0.45,
    currentDirection: 190,
    waveHeight: 1.9,
    seaLevel: -0.02,
    batteryLevel: 88,
    lastTransmitted: '45 mins ago',
    region: 'Arabian Sea (Mumbai Offshore)',
    metadata: {
      wmoId: '2903881',
      institution: 'Global Argo Program / Euro-Argo',
      sensorType: 'SBE-41CP CTD + Biogeochemical pH',
      driftSpeed: 12.4,
    },
    depthProfile: [
      { depth: 0, temperature: 28.4, salinity: 34.9, oxygen: 215 },
      { depth: 25, temperature: 28.1, salinity: 35.1, oxygen: 210 },
      { depth: 75, temperature: 24.8, salinity: 35.9, oxygen: 130 },
      { depth: 150, temperature: 18.2, salinity: 35.5, oxygen: 50 },
      { depth: 400, temperature: 12.0, salinity: 35.0, oxygen: 35 },
      { depth: 1000, temperature: 6.9, salinity: 34.8, oxygen: 65 },
      { depth: 2000, temperature: 2.8, salinity: 34.6, oxygen: 135 },
    ],
  },
  {
    id: 'obs-as-3',
    stationId: 'RV-SAGARKANYA',
    name: 'R/V Sagar Kanya Expedition',
    type: 'Research Vessel',
    latitude: 16.8,
    longitude: 70.2,
    timestamp: '2026-08-27T15:30:00Z',
    temperature: 28.9,
    salinity: 35.8,
    currentSpeed: 0.68,
    currentDirection: 205,
    waveHeight: 2.1,
    seaLevel: 0.01,
    batteryLevel: 100,
    lastTransmitted: '3 mins ago',
    region: 'Arabian Sea',
    metadata: {
      institution: 'Ministry of Earth Sciences (MoES India)',
      sensorType: 'Thermosalinograph + Shipboard ADCP + Wave Radar',
    },
  },
  {
    id: 'obs-as-4',
    stationId: 'MUMBAI-COASTAL',
    name: 'Mumbai Marine Observatory (Prongs Reef)',
    type: 'Ocean Station',
    latitude: 18.89,
    longitude: 72.81,
    timestamp: '2026-08-27T16:00:00Z',
    temperature: 29.3,
    salinity: 34.2,
    currentSpeed: 0.35,
    currentDirection: 140,
    waveHeight: 1.4,
    seaLevel: 0.12,
    batteryLevel: 99,
    lastTransmitted: 'Real-time (Fiber Link)',
    region: 'Arabian Sea Coast',
    metadata: {
      institution: 'National Institute of Oceanography (NIO)',
      sensorType: 'Coastal Acoustic Tide Gauge + Multi-parameter Sonde',
    },
  },
  // Bay of Bengal
  {
    id: 'obs-bob-1',
    stationId: 'RAMA-BOB-04',
    name: 'RAMA Deep Bay of Bengal Buoy',
    type: 'Buoy',
    latitude: 12.0,
    longitude: 88.5,
    timestamp: '2026-08-27T11:00:00Z',
    temperature: 29.8,
    salinity: 32.6,
    currentSpeed: 0.58,
    currentDirection: 85,
    waveHeight: 2.8,
    seaLevel: 0.08,
    batteryLevel: 91,
    lastTransmitted: '20 mins ago',
    region: 'Bay of Bengal',
    metadata: {
      wmoId: '23004',
      institution: 'INCOIS & JAMSTEC',
      sensorType: 'TRITON Surface Meteorological + Subsurface CTD Chain',
    },
    depthProfile: [
      { depth: 0, temperature: 29.8, salinity: 32.6, oxygen: 200 },
      { depth: 30, temperature: 29.4, salinity: 33.1, oxygen: 195 },
      { depth: 60, temperature: 26.0, salinity: 34.5, oxygen: 140 },
      { depth: 120, temperature: 19.5, salinity: 35.0, oxygen: 60 },
      { depth: 300, temperature: 13.5, salinity: 35.1, oxygen: 25 },
      { depth: 1000, temperature: 7.2, salinity: 34.9, oxygen: 70 },
      { depth: 2000, temperature: 2.9, salinity: 34.7, oxygen: 140 },
    ],
  },
  {
    id: 'obs-bob-2',
    stationId: 'ARGO-BOB-5904',
    name: 'Argo Profiler 5904112',
    type: 'Argo Float',
    latitude: 16.2,
    longitude: 85.4,
    timestamp: '2026-08-27T08:00:00Z',
    temperature: 29.5,
    salinity: 31.8,
    currentSpeed: 0.42,
    currentDirection: 110,
    waveHeight: 2.2,
    seaLevel: 0.06,
    batteryLevel: 82,
    lastTransmitted: '3 hours ago',
    region: 'Bay of Bengal',
    metadata: {
      wmoId: '5904112',
      institution: 'CSIRO / Argo Australia',
      sensorType: 'PROVOR CTS4 + Chlorophyll Fluorometer',
      driftSpeed: 16.1,
    },
  },
  {
    id: 'obs-io-1',
    stationId: 'RAMA-EQ-00',
    name: 'RAMA Equatorial Wyrtki Jet Buoy',
    type: 'Buoy',
    latitude: 0.0,
    longitude: 80.5,
    timestamp: '2026-08-27T13:00:00Z',
    temperature: 28.2,
    salinity: 35.1,
    currentSpeed: 1.15,
    currentDirection: 90,
    waveHeight: 2.4,
    seaLevel: 0.02,
    batteryLevel: 86,
    lastTransmitted: '15 mins ago',
    region: 'Equatorial Indian Ocean',
    metadata: {
      wmoId: '23008',
      institution: 'NOAA PMEL / INCOIS',
      sensorType: 'Equatorial Current Profiler Chain',
    },
  },
  // North Atlantic & Gulf of Mexico
  {
    id: 'obs-atl-1',
    stationId: 'NOAA-NDBC-42001',
    name: 'NOAA Mid-Gulf Buoy 42001',
    type: 'Buoy',
    latitude: 25.9,
    longitude: -89.7,
    timestamp: '2026-08-27T15:00:00Z',
    temperature: 30.5,
    salinity: 36.1,
    currentSpeed: 0.85,
    currentDirection: 310,
    waveHeight: 1.6,
    seaLevel: 0.15,
    batteryLevel: 95,
    lastTransmitted: '10 mins ago',
    region: 'Gulf of Mexico',
    metadata: {
      wmoId: '42001',
      institution: 'National Data Buoy Center (NDBC)',
      sensorType: '3-meter Discus Buoy with ARES Payload',
    },
    depthProfile: [
      { depth: 0, temperature: 30.5, salinity: 36.1, oxygen: 215 },
      { depth: 50, temperature: 28.4, salinity: 36.4, oxygen: 200 },
      { depth: 100, temperature: 22.0, salinity: 36.5, oxygen: 160 },
      { depth: 300, temperature: 15.0, salinity: 35.8, oxygen: 110 },
      { depth: 800, temperature: 8.5, salinity: 35.0, oxygen: 90 },
      { depth: 1500, temperature: 4.3, salinity: 34.9, oxygen: 150 },
    ],
  },
  {
    id: 'obs-atl-2',
    stationId: 'ARGO-ATL-4902',
    name: 'Gulf Stream Argo Floater 490234',
    type: 'Argo Float',
    latitude: 36.5,
    longitude: -64.2,
    timestamp: '2026-08-27T10:00:00Z',
    temperature: 26.8,
    salinity: 36.7,
    currentSpeed: 1.95,
    currentDirection: 65,
    waveHeight: 3.1,
    seaLevel: 0.22,
    batteryLevel: 79,
    lastTransmitted: '1 hour ago',
    region: 'North Atlantic (Gulf Stream)',
    metadata: {
      wmoId: '4902340',
      institution: 'Woods Hole Oceanographic Institution (WHOI)',
      driftSpeed: 38.5,
    },
  },
  {
    id: 'obs-atl-3',
    stationId: 'PIRATA-15N-38W',
    name: 'PIRATA Mooring 15N 38W',
    type: 'Ocean Station',
    latitude: 15.0,
    longitude: -38.0,
    timestamp: '2026-08-27T12:00:00Z',
    temperature: 27.4,
    salinity: 36.8,
    currentSpeed: 0.48,
    currentDirection: 270,
    waveHeight: 2.2,
    seaLevel: -0.04,
    batteryLevel: 92,
    lastTransmitted: '30 mins ago',
    region: 'Tropical Atlantic',
    metadata: {
      wmoId: '13008',
      institution: 'IRD / NOAA / INPE',
      sensorType: 'PIRATA ATLAS Mooring',
    },
  },
  // Pacific Ocean
  {
    id: 'obs-pac-1',
    stationId: 'TAO-TRITON-0N165E',
    name: 'TAO/TRITON Buoy 0°N 165°E',
    type: 'Buoy',
    latitude: 0.0,
    longitude: 165.0,
    timestamp: '2026-08-27T14:00:00Z',
    temperature: 29.9,
    salinity: 34.6,
    currentSpeed: 0.65,
    currentDirection: 275,
    waveHeight: 1.8,
    seaLevel: 0.18,
    batteryLevel: 90,
    lastTransmitted: '25 mins ago',
    region: 'Western Pacific Warm Pool',
    metadata: {
      wmoId: '52002',
      institution: 'JAMSTEC / NOAA PMEL',
      sensorType: 'ENSO Monitoring ATLAS Array',
    },
  },
  {
    id: 'obs-pac-2',
    stationId: 'ARGO-KUROSHIO-21',
    name: 'Argo Float Kuroshio Meander 21',
    type: 'Argo Float',
    latitude: 33.1,
    longitude: 139.5,
    timestamp: '2026-08-27T13:00:00Z',
    temperature: 27.2,
    salinity: 34.8,
    currentSpeed: 1.80,
    currentDirection: 45,
    waveHeight: 2.9,
    seaLevel: 0.14,
    batteryLevel: 85,
    lastTransmitted: '50 mins ago',
    region: 'Northwest Pacific (Kuroshio)',
    metadata: {
      wmoId: '2901552',
      institution: 'Japan Meteorological Agency (JMA)',
      driftSpeed: 42.0,
    },
  },
  {
    id: 'obs-pac-3',
    stationId: 'RV-MIRAI',
    name: 'R/V Mirai Oceanographic Survey',
    type: 'Research Vessel',
    latitude: 22.5,
    longitude: 152.0,
    timestamp: '2026-08-27T16:00:00Z',
    temperature: 28.1,
    salinity: 35.3,
    currentSpeed: 0.52,
    currentDirection: 180,
    waveHeight: 2.0,
    seaLevel: 0.02,
    batteryLevel: 100,
    lastTransmitted: '5 mins ago',
    region: 'Central North Pacific',
    metadata: {
      institution: 'JAMSTEC',
      sensorType: 'Underway Surface System & CTD Rosette',
    },
  },
  // Southern Ocean & Mediterranean
  {
    id: 'obs-so-1',
    stationId: 'SOCCOM-FLOAT-902',
    name: 'SOCCOM Bio-Argo 9021-Deep',
    type: 'Argo Float',
    latitude: -52.4,
    longitude: 85.2,
    timestamp: '2026-08-27T06:00:00Z',
    temperature: 4.2,
    salinity: 33.9,
    currentSpeed: 0.95,
    currentDirection: 80,
    waveHeight: 5.8,
    seaLevel: -0.18,
    batteryLevel: 75,
    lastTransmitted: '5 hours ago',
    region: 'Southern Ocean (ACC)',
    metadata: {
      wmoId: '5906233',
      institution: 'Princeton / SOCCOM NSF',
      sensorType: 'Deep SOLO (Down to 4000m) + Nitrate & pH',
      driftSpeed: 24.5,
    },
  },
  {
    id: 'obs-med-1',
    stationId: 'MED-BUOY-E1M3A',
    name: 'E1-M3A Deep Mediterranean Mooring',
    type: 'Ocean Station',
    latitude: 35.3,
    longitude: 25.0,
    timestamp: '2026-08-27T11:00:00Z',
    temperature: 26.2,
    salinity: 39.1,
    currentSpeed: 0.38,
    currentDirection: 120,
    waveHeight: 1.2,
    seaLevel: -0.06,
    batteryLevel: 96,
    lastTransmitted: '18 mins ago',
    region: 'Eastern Mediterranean Sea',
    metadata: {
      wmoId: '61001',
      institution: 'HCMR Greece / EuroSITES',
      sensorType: 'Deep Levantine CTD & Bio-optical sensors',
    },
  },
];

/**
 * Deterministic geophysical numerical ocean model simulator.
 * Calculates sea surface temperature, salinity, currents, wave heights, and sea level
 * at any (lat, lon, timeOffsetDays) on Earth with physically grounded gradients.
 */
export function getNumericalModelOutput(lat: number, lon: number, timeIndex: number = 2): OceanModelPoint {
  // Normalize lon to -180..180
  let normLon = ((lon + 180) % 360 + 360) % 360 - 180;
  const absLat = Math.abs(lat);
  const timeOffset = (timeIndex - 2) * 0.15; // slight temporal evolution

  // 1. Sea Surface Temperature Model (°C)
  // Latitude zonal mean base (Equator ~29°C, Poles ~ -1°C)
  let baseSst = 29.5 * Math.cos((lat * Math.PI) / 180) ** 1.3 - (absLat > 65 ? (absLat - 65) * 0.4 : 0);

  // Regional anomalies:
  // Arabian Sea (10-25N, 50-75E) -> Summer warming & upwelling
  if (lat >= 8 && lat <= 26 && normLon >= 50 && normLon <= 78) {
    baseSst = 28.8 + Math.sin((lat + normLon) * 0.2 + timeOffset) * 0.7;
    // Coastal upwelling off Oman/Somalia:
    if (normLon < 60 && lat < 20) baseSst -= 2.4;
  }
  // Bay of Bengal (5-23N, 80-98E) -> High SST warm pool
  else if (lat >= 5 && lat <= 24 && normLon >= 80 && normLon <= 98) {
    baseSst = 29.7 + Math.cos(lat * 0.15 + timeOffset) * 0.5;
  }
  // Gulf of Mexico & Caribbean
  else if (lat >= 15 && lat <= 32 && normLon >= -98 && normLon <= -75) {
    baseSst = 30.2 + Math.sin(normLon * 0.1) * 0.6;
  }
  // Gulf Stream warming
  else if (lat >= 30 && lat <= 45 && normLon >= -75 && normLon <= -50) {
    baseSst += 3.8;
  }
  // Kuroshio warming
  else if (lat >= 25 && lat <= 40 && normLon >= 125 && normLon <= 150) {
    baseSst += 3.2;
  }
  // California upwelling (cold)
  else if (lat >= 25 && lat <= 45 && normLon >= -130 && normLon <= -115) {
    baseSst -= 4.0;
  }
  // Southern Ocean cold
  if (lat < -45) {
    baseSst = Math.max(-1.5, 7.0 - (Math.abs(lat) - 45) * 0.35);
  }

  const modelTemp = Math.round((baseSst + Math.sin(lat * 0.3 + normLon * 0.2 + timeOffset) * 0.3) * 10) / 10;

  // 2. Salinity Model (PSU)
  // Global mean ~35 PSU. High evaporation in sub-tropics (~36.5-37), low in river basins/poles (30-33)
  let baseSalinity = 34.8 + 1.2 * Math.cos(((absLat - 25) * Math.PI) / 45);
  // Arabian Sea: High evaporation, ~36.5 PSU
  if (lat >= 8 && lat <= 26 && normLon >= 50 && normLon <= 78) {
    baseSalinity = 36.4 + Math.sin(lat * 0.2) * 0.3;
  }
  // Bay of Bengal: Huge freshwater river influx, low salinity ~31.5-33.0 PSU
  else if (lat >= 5 && lat <= 24 && normLon >= 80 && normLon <= 98) {
    baseSalinity = 32.2 - (lat > 18 ? 1.5 : 0.4);
  }
  // Mediterranean Sea: ~38.5-39.2 PSU
  else if (lat >= 30 && lat <= 45 && normLon >= -5 && normLon <= 36) {
    baseSalinity = 38.6 + Math.cos(normLon * 0.1) * 0.5;
  }
  // Southern Ocean / Arctic: lower salinity
  if (absLat > 55) {
    baseSalinity = 33.8 - (absLat - 55) * 0.05;
  }
  const modelSalinity = Math.round((baseSalinity + Math.sin(normLon * 0.1 + timeOffset * 0.5) * 0.15) * 10) / 10;

  // 3. Ocean Currents Model (Speed in m/s, Direction in deg 0-360)
  let currentSpeed = 0.35;
  let currentDirection = 180;

  // Strong boundary currents
  // Gulf Stream
  if (lat >= 25 && lat <= 45 && normLon >= -80 && normLon <= -50) {
    currentSpeed = 1.85 + Math.sin(lat * 0.5 + timeOffset) * 0.4;
    currentDirection = 45; // NE
  }
  // Kuroshio
  else if (lat >= 24 && lat <= 40 && normLon >= 125 && normLon <= 150) {
    currentSpeed = 1.70 + Math.cos(lat * 0.4 + timeOffset) * 0.3;
    currentDirection = 40; // NE
  }
  // Somali Current / Southwest Monsoon current in Arabian Sea
  else if (lat >= 5 && lat <= 22 && normLon >= 50 && normLon <= 75) {
    currentSpeed = 0.85 + Math.sin(lat * 0.2 + timeOffset) * 0.25;
    currentDirection = 210; // SW/SSW
  }
  // Equatorial Wyrtki Jet
  else if (Math.abs(lat) <= 3 && normLon >= 60 && normLon <= 95) {
    currentSpeed = 1.2 + Math.sin(normLon * 0.1) * 0.3;
    currentDirection = 90; // Eastward
  }
  // Antarctic Circumpolar Current (ACC)
  else if (lat <= -40 && lat >= -65) {
    currentSpeed = 0.95 + Math.sin(lat * 0.3 + timeOffset) * 0.3;
    currentDirection = 90; // Eastward
  } else {
    currentSpeed = 0.25 + Math.abs(Math.sin(lat * 0.4 + normLon * 0.2 + timeOffset)) * 0.4;
    currentDirection = Math.round(((Math.atan2(Math.sin(lat * 0.1), Math.cos(normLon * 0.1)) * 180) / Math.PI + 360 + timeIndex * 15) % 360);
  }
  currentSpeed = Math.round(currentSpeed * 100) / 100;

  // 4. Wave Height (meters)
  // Southern Ocean Roaring 40s/50s: 3.5m - 7m
  let baseWave = 1.4;
  if (lat < -40) {
    baseWave = 4.2 + Math.abs(Math.sin(normLon * 0.2 + timeOffset)) * 2.2;
  } else if (absLat > 40) {
    baseWave = 2.6 + Math.abs(Math.sin(normLon * 0.3 + timeOffset)) * 1.5;
  } else if (lat >= 10 && lat <= 25 && normLon >= 60 && normLon <= 95) {
    // Monsoon swell in Indian Ocean / Arabian Sea
    baseWave = 2.2 + Math.sin(lat * 0.2 + timeOffset) * 0.8;
  }
  const modelWaveHeight = Math.round((baseWave + (timeIndex % 3) * 0.2) * 10) / 10;

  // 5. Sea Level Anomaly (m)
  const modelSeaLevel = Math.round((Math.sin(lat * 0.15 + normLon * 0.1 + timeOffset) * 0.12 + (modelTemp > 28 ? 0.05 : -0.04)) * 100) / 100;

  return {
    id: `mod-${Math.round(lat * 10)}_${Math.round(lon * 10)}_${timeIndex}`,
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lon * 100) / 100,
    temperature: modelTemp,
    salinity: modelSalinity,
    currentSpeed,
    currentDirection,
    waveHeight: modelWaveHeight,
    seaLevel: modelSeaLevel,
    timestamp: TIMESTAMPS[timeIndex]?.iso || '2026-08-27T00:00:00Z',
  };
}

/**
 * Returns time-evolved observation stations for the given timestamp index.
 * Argo floats and vessels drift realistically across timestamps.
 */
export function getObservationsForTimestamp(timeIndex: number = 2): OceanObservation[] {
  return RAW_OBSERVATION_STATIONS.map((obs) => {
    // If it's an Argo float or ship, apply slight drift
    let lat = obs.latitude;
    let lon = obs.longitude;
    const deltaDays = timeIndex - 2;

    if (obs.type === 'Argo Float') {
      lat += deltaDays * 0.08;
      lon += deltaDays * 0.12;
    } else if (obs.type === 'Research Vessel') {
      lat += deltaDays * 0.35;
      lon += deltaDays * 0.45;
    }

    // Add time-dependent variation to observed sensor values
    const tempDelta = Math.sin(timeIndex * 0.8 + obs.latitude * 0.2) * 0.3;
    const salDelta = Math.cos(timeIndex * 0.5 + obs.longitude * 0.1) * 0.08;
    const waveDelta = Math.sin(timeIndex * 1.1) * 0.25;

    return {
      ...obs,
      latitude: Math.round(lat * 100) / 100,
      longitude: Math.round(lon * 100) / 100,
      timestamp: TIMESTAMPS[timeIndex]?.iso || obs.timestamp,
      temperature: Math.round((obs.temperature + tempDelta) * 10) / 10,
      salinity: Math.round((obs.salinity + salDelta) * 10) / 10,
      waveHeight: Math.max(0.5, Math.round((obs.waveHeight + waveDelta) * 10) / 10),
    };
  });
}

/**
 * Generates gridded model points for the 3D globe visualization layer.
 * Creates a global grid at 10-degree increments, with denser 4-degree resolution
 * in the Arabian Sea, Bay of Bengal, and key ocean gateways.
 */
export function generateGriddedModelPoints(timeIndex: number = 2): OceanModelPoint[] {
  const points: OceanModelPoint[] = [];

  // Global background grid (15-degree steps for fast rendering performance)
  for (let lat = -70; lat <= 70; lat += 12) {
    for (let lon = -180; lon < 180; lon += 15) {
      // Skip deep continental interiors to focus purely on oceans
      if (isLandApproximate(lat, lon)) continue;
      points.push(getNumericalModelOutput(lat, lon, timeIndex));
    }
  }

  // Denser focus grid for North Indian Ocean & Arabian Sea
  for (let lat = 5; lat <= 26; lat += 3.5) {
    for (let lon = 52; lon <= 96; lon += 3.5) {
      if (isLandApproximate(lat, lon)) continue;
      points.push(getNumericalModelOutput(lat, lon, timeIndex));
    }
  }

  return points;
}

/**
 * Fast approximate land mask to avoid rendering ocean layers inside landmasses.
 */
function isLandApproximate(lat: number, lon: number): boolean {
  // Africa
  if (lat >= -32 && lat <= 35 && lon >= 10 && lon <= 45) return true;
  if (lat >= 15 && lat <= 33 && lon >= 30 && lon <= 55) return true;
  // Eurasia / India
  if (lat >= 8 && lat <= 35 && lon >= 74 && lon <= 88) {
    if (lat >= 20 && lon >= 74 && lon <= 88) return true; // Central/North India
    if (lat >= 12 && lat <= 20 && lon >= 75 && lon <= 82) return true; // South India peninsula
  }
  if (lat >= 30 && lat <= 70 && lon >= 40 && lon <= 130) return true; // Russia/China
  if (lat >= 36 && lat <= 60 && lon >= -8 && lon <= 35) return true; // Europe
  // North America
  if (lat >= 25 && lat <= 65 && lon >= -125 && lon <= -75) return true;
  // South America
  if (lat >= -50 && lat <= 10 && lon >= -75 && lon <= -40) return true;
  // Australia
  if (lat >= -38 && lat <= -15 && lon >= 115 && lon <= 150) return true;
  // Antarctica
  if (lat < -72) return true;

  return false;
}

/**
 * Calculates Great Circle distance between two lat/lon coordinates in kilometers.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns comprehensive details for any selected coordinate on Earth.
 */
export function getLocationDetails(lat: number, lon: number, timeIndex: number = 2): OceanLocationDetails {
  const model = getNumericalModelOutput(lat, lon, timeIndex);
  const observations = getObservationsForTimestamp(timeIndex);

  // Find nearest observation
  let nearestObs: OceanObservation | undefined = undefined;
  let minDistance = Infinity;

  for (const obs of observations) {
    const dist = calculateDistanceKm(lat, lon, obs.latitude, obs.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestObs = obs;
    }
  }

  // Determine ocean region name
  let oceanRegion = 'Open Ocean';
  let placeName = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

  if (lat >= 5 && lat <= 26 && lon >= 50 && lon <= 78) {
    oceanRegion = 'Arabian Sea';
    if (lat >= 18 && lon >= 71) placeName = 'Eastern Arabian Sea (Mumbai Basin)';
    else placeName = 'Central Arabian Sea';
  } else if (lat >= 5 && lat <= 24 && lon >= 80 && lon <= 98) {
    oceanRegion = 'Bay of Bengal';
    placeName = 'Bay of Bengal Basin';
  } else if (lat >= -40 && lat <= 5 && lon >= 40 && lon <= 110) {
    oceanRegion = 'Equatorial Indian Ocean';
    placeName = 'Equatorial Indian Ocean Basin';
  } else if (lat >= 20 && lat <= 48 && lon >= -90 && lon <= -40) {
    oceanRegion = 'North Atlantic Ocean';
    placeName = 'North Atlantic (Gulf Stream Path)';
  } else if (lat >= 18 && lat <= 32 && lon >= -98 && lon <= -80) {
    oceanRegion = 'Gulf of Mexico';
    placeName = 'Gulf of Mexico Basin';
  } else if (lat >= -55 && lat <= -40) {
    oceanRegion = 'Southern Ocean';
    placeName = 'Southern Ocean Circumpolar Drift';
  } else if (lon >= 120 || lon <= -120) {
    oceanRegion = 'Pacific Ocean';
    placeName = lat >= 0 ? 'North Pacific Ocean' : 'South Pacific Ocean';
  }

  // Calculate comparison metrics if nearest observation is within reasonable distance (< 1500 km)
  const comparisonMetrics: ComparisonMetric[] = [];
  let overallScoreSum = 0;

  if (nearestObs && minDistance < 1500) {
    // Temperature comparison
    const tempDiff = Math.round((model.temperature - nearestObs.temperature) * 10) / 10;
    const tempPct = Math.round((Math.abs(tempDiff) / nearestObs.temperature) * 1000) / 10;
    const tempSev: AnomalySeverity = Math.abs(tempDiff) < 0.5 ? 'Normal' : Math.abs(tempDiff) <= 1.5 ? 'Moderate' : 'Significant';
    const tempStatus =
      tempSev === 'Normal' ? 'Within expected range (High fit)' : tempSev === 'Moderate' ? 'Moderate variance detected' : 'Significant model anomaly (>1.5°C)';

    comparisonMetrics.push({
      parameter: 'Temperature',
      unit: '°C',
      modelValue: model.temperature,
      observedValue: nearestObs.temperature,
      difference: tempDiff,
      percentDifference: tempPct,
      severity: tempSev,
      statusText: tempStatus,
      tolerance: 0.5,
    });

    // Salinity comparison
    const salDiff = Math.round((model.salinity - nearestObs.salinity) * 10) / 10;
    const salPct = Math.round((Math.abs(salDiff) / nearestObs.salinity) * 1000) / 10;
    const salSev: AnomalySeverity = Math.abs(salDiff) < 0.4 ? 'Normal' : Math.abs(salDiff) <= 1.0 ? 'Moderate' : 'Significant';
    const salStatus = salSev === 'Normal' ? 'Salinity within standard boundary' : salSev === 'Moderate' ? 'Freshwater lens / halocline offset' : 'Significant salinity deviation';

    comparisonMetrics.push({
      parameter: 'Salinity',
      unit: 'PSU',
      modelValue: model.salinity,
      observedValue: nearestObs.salinity,
      difference: salDiff,
      percentDifference: salPct,
      severity: salSev,
      statusText: salStatus,
      tolerance: 0.3,
    });

    // Current speed comparison
    const curDiff = Math.round((model.currentSpeed - nearestObs.currentSpeed) * 100) / 100;
    const curPct = Math.round((Math.abs(curDiff) / Math.max(0.1, nearestObs.currentSpeed)) * 1000) / 10;
    const curSev: AnomalySeverity = Math.abs(curDiff) < 0.25 ? 'Normal' : Math.abs(curDiff) <= 0.6 ? 'Moderate' : 'Significant';

    comparisonMetrics.push({
      parameter: 'Current Speed',
      unit: 'm/s',
      modelValue: model.currentSpeed,
      observedValue: nearestObs.currentSpeed,
      difference: curDiff,
      percentDifference: curPct,
      severity: curSev,
      statusText: curSev === 'Normal' ? 'Hydrodynamic velocity aligned' : 'Mesoscale eddy divergence',
      tolerance: 0.2,
    });

    // Wave height comparison
    const waveDiff = Math.round((model.waveHeight - nearestObs.waveHeight) * 10) / 10;
    const wavePct = Math.round((Math.abs(waveDiff) / nearestObs.waveHeight) * 1000) / 10;
    const waveSev: AnomalySeverity = Math.abs(waveDiff) < 0.5 ? 'Normal' : Math.abs(waveDiff) <= 1.2 ? 'Moderate' : 'Significant';

    comparisonMetrics.push({
      parameter: 'Wave Height',
      unit: 'm',
      modelValue: model.waveHeight,
      observedValue: nearestObs.waveHeight,
      difference: waveDiff,
      percentDifference: wavePct,
      severity: waveSev,
      statusText: waveSev === 'Normal' ? 'Wave spectrum well-resolved' : 'Swell dispersion offset',
      tolerance: 0.4,
    });

    // Sea level comparison
    const obsSl = nearestObs.seaLevel ?? 0.02;
    const slDiff = Math.round((model.seaLevel - obsSl) * 100) / 100;
    const slPct = Math.round(Math.abs(slDiff) * 100);
    const slSev: AnomalySeverity = Math.abs(slDiff) < 0.05 ? 'Normal' : 'Moderate';

    comparisonMetrics.push({
      parameter: 'Sea Level',
      unit: 'm',
      modelValue: model.seaLevel,
      observedValue: obsSl,
      difference: slDiff,
      percentDifference: slPct,
      severity: slSev,
      statusText: 'Altimetry anomaly concordance',
      tolerance: 0.05,
    });

    // Overall accuracy score (weighted: temp 35%, sal 25%, current 20%, waves 15%, SL 5%)
    const tempScore = Math.max(0, 100 - tempPct * 5);
    const salScore = Math.max(0, 100 - salPct * 4);
    const curScore = Math.max(0, 100 - curPct * 2);
    const waveScore = Math.max(0, 100 - wavePct * 3);
    overallScoreSum = Math.round(tempScore * 0.35 + salScore * 0.25 + curScore * 0.2 + waveScore * 0.2);
  } else {
    overallScoreSum = 92; // default high baseline for open water
  }

  // Generate 7-day time series points
  const timeseries: TimeSeriesPoint[] = TIMESTAMPS.map((t, idx) => {
    const modPoint = getNumericalModelOutput(lat, lon, idx);
    let obsTemp = undefined;
    let obsSal = undefined;
    let obsCur = undefined;
    let obsWave = undefined;

    if (nearestObs && minDistance < 1500) {
      const deltaT = (idx - 2) * 0.2;
      obsTemp = Math.round((nearestObs.temperature + Math.sin(idx * 0.9) * 0.4 + deltaT * 0.1) * 10) / 10;
      obsSal = Math.round((nearestObs.salinity + Math.cos(idx * 0.6) * 0.1) * 10) / 10;
      obsCur = Math.round((nearestObs.currentSpeed + Math.sin(idx * 1.2) * 0.15) * 100) / 100;
      obsWave = Math.max(0.6, Math.round((nearestObs.waveHeight + Math.cos(idx * 1.4) * 0.3) * 10) / 10);
    }

    return {
      timestamp: t.iso,
      label: t.label,
      modelTemperature: modPoint.temperature,
      observedTemperature: obsTemp,
      modelSalinity: modPoint.salinity,
      observedSalinity: obsSal,
      modelCurrentSpeed: modPoint.currentSpeed,
      observedCurrentSpeed: obsCur,
      modelWaveHeight: modPoint.waveHeight,
      observedWaveHeight: obsWave,
      modelSeaLevel: modPoint.seaLevel,
    };
  });

  return {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lon * 100) / 100,
    placeName,
    oceanRegion,
    model: {
      temperature: model.temperature,
      salinity: model.salinity,
      currentSpeed: model.currentSpeed,
      currentDirection: model.currentDirection,
      waveHeight: model.waveHeight,
      seaLevel: model.seaLevel,
    },
    nearestObservation: nearestObs
      ? {
          observation: nearestObs,
          distanceKm: minDistance,
        }
      : undefined,
    comparisonMetrics,
    overallAccuracyScore: Math.min(99, Math.max(65, overallScoreSum)),
    timeseries,
  };
}

/**
 * Computes global and regional anomalies based on model vs observation differences.
 */
export function getDetectedAnomalies(timeIndex: number = 2): OceanAnomaly[] {
  const anomalies: OceanAnomaly[] = [
    {
      id: 'anom-1',
      locationName: 'Arabian Sea - Mumbai Offshore',
      latitude: 18.52,
      longitude: 71.87,
      region: 'Arabian Sea',
      parameter: 'Temperature',
      unit: '°C',
      observedValue: 28.4,
      expectedModelValue: 29.0,
      difference: -0.6,
      severity: 'Moderate',
      timestamp: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026',
      detectedAt: '27 Aug 2026, 14:00 UTC',
      description: 'Localized coastal cold anomaly due to stronger-than-modeled Ekman upwelling along the western Indian continental shelf.',
      recommendation: 'Adjust upwelling wind-stress drag coefficient in regional numerical core.',
    },
    {
      id: 'anom-2',
      locationName: 'Northern Bay of Bengal (Ganges Outflow)',
      latitude: 19.8,
      longitude: 89.2,
      region: 'Bay of Bengal',
      parameter: 'Salinity',
      unit: 'PSU',
      observedValue: 29.4,
      expectedModelValue: 31.8,
      difference: -2.4,
      severity: 'Significant',
      timestamp: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026',
      detectedAt: '27 Aug 2026, 09:30 UTC',
      description: 'Severe low-salinity freshwater plume. River discharge exceeds monsoon climatological runoff in model forcing.',
      recommendation: 'Incorporate real-time gauge hydrographs for Ganges-Brahmaputra discharge fluxes.',
    },
    {
      id: 'anom-3',
      locationName: 'North Atlantic Gulf Stream Meander',
      latitude: 36.5,
      longitude: -64.2,
      region: 'North Atlantic',
      parameter: 'Currents',
      unit: 'm/s',
      observedValue: 1.95,
      expectedModelValue: 1.45,
      difference: +0.50,
      severity: 'Moderate',
      timestamp: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026',
      detectedAt: '27 Aug 2026, 10:00 UTC',
      description: 'Warm-core ring shed from main Gulf Stream path inducing sharp localized velocity shear.',
      recommendation: 'Run sub-mesoscale eddy assimilation routine (EnKF).',
    },
    {
      id: 'anom-4',
      locationName: 'Southern Ocean Swell Zone',
      latitude: -52.4,
      longitude: 85.2,
      region: 'Southern Ocean',
      parameter: 'Waves',
      unit: 'm',
      observedValue: 5.8,
      expectedModelValue: 4.1,
      difference: +1.7,
      severity: 'Significant',
      timestamp: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026',
      detectedAt: '27 Aug 2026, 06:00 UTC',
      description: 'Intense polar extra-tropical storm generating extreme significant wave heights exceeding model forecast by 1.7m.',
      recommendation: 'Update WaveWatch-III boundary wind fields with satellite scatterometer data.',
    },
    {
      id: 'anom-5',
      locationName: 'Gulf of Mexico Loop Current',
      latitude: 25.9,
      longitude: -89.7,
      region: 'Gulf of Mexico',
      parameter: 'Temperature',
      unit: '°C',
      observedValue: 30.5,
      expectedModelValue: 29.8,
      difference: +0.7,
      severity: 'Moderate',
      timestamp: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026',
      detectedAt: '27 Aug 2026, 15:00 UTC',
      description: 'Marine Heatwave (MHW Category 1) with upper ocean thermal content supporting cyclogenesis conditions.',
      recommendation: 'Flag for hurricane intensity index modeling.',
    },
  ];

  return anomalies;
}

/**
 * Returns overall global telemetry and statistical health.
 */
export function getOceanStatistics(timeIndex: number = 2): OceanStats {
  const observations = getObservationsForTimestamp(timeIndex);
  const anomalies = getDetectedAnomalies(timeIndex);

  const buoysCount = observations.filter((o) => o.type === 'Buoy').length;
  const argoCount = observations.filter((o) => o.type === 'Argo Float').length;
  const vesselCount = observations.filter((o) => o.type === 'Research Vessel').length;

  return {
    totalStations: observations.length,
    activeBuoys: buoysCount,
    activeArgoFloats: argoCount,
    activeVessels: vesselCount,
    globalMeanTemp: 21.4,
    globalMeanSalinity: 34.9,
    globalMeanWaveHeight: 2.3,
    totalAnomaliesDetected: anomalies.length,
    modelOverallSkillScore: 94.2,
    meanRmseTemperature: 0.42,
    meanRmseSalinity: 0.28,
    lastModelRun: TIMESTAMPS[timeIndex]?.formatted || '27 Aug 2026, 12:00 UTC',
    regions: [
      {
        name: 'Arabian Sea',
        meanTemp: 28.7,
        meanSalinity: 36.3,
        activePlatforms: 4,
        anomaliesCount: 1,
        modelAccuracy: 93.8,
      },
      {
        name: 'Bay of Bengal',
        meanTemp: 29.6,
        meanSalinity: 32.4,
        activePlatforms: 2,
        anomaliesCount: 1,
        modelAccuracy: 89.4,
      },
      {
        name: 'Equatorial Indian Ocean',
        meanTemp: 28.2,
        meanSalinity: 35.1,
        activePlatforms: 1,
        anomaliesCount: 0,
        modelAccuracy: 96.1,
      },
      {
        name: 'North Atlantic',
        meanTemp: 26.5,
        meanSalinity: 36.6,
        activePlatforms: 3,
        anomaliesCount: 1,
        modelAccuracy: 94.5,
      },
      {
        name: 'Pacific Ocean',
        meanTemp: 28.4,
        meanSalinity: 34.9,
        activePlatforms: 3,
        anomaliesCount: 0,
        modelAccuracy: 95.7,
      },
      {
        name: 'Southern Ocean',
        meanTemp: 4.2,
        meanSalinity: 33.9,
        activePlatforms: 1,
        anomaliesCount: 1,
        modelAccuracy: 88.2,
      },
    ],
  };
}

/**
 * OceanVision 3D - Types & Data Contracts
 * Supports gridded numerical ocean model outputs and in-situ observational networks.
 */

export type LayerType = 
  | 'temperature' 
  | 'salinity' 
  | 'currents' 
  | 'waveHeight' 
  | 'seaLevel' 
  | 'stations' 
  | 'argo' 
  | 'buoys'
  | 'vessels'
  | 'anomalies';

export type ObservationType = 'Buoy' | 'Argo Float' | 'Research Vessel' | 'Ocean Station';

export type AnomalySeverity = 'Normal' | 'Moderate' | 'Significant';

export interface OceanModelPoint {
  id: string;
  latitude: number;
  longitude: number;
  temperature: number; // in °C (e.g. 24.5)
  salinity: number; // in PSU (e.g. 35.2)
  currentSpeed: number; // in m/s (e.g. 0.85)
  currentDirection: number; // in degrees (0-360)
  waveHeight: number; // in meters (e.g. 1.8)
  seaLevel: number; // sea level anomaly in meters (e.g. +0.08)
  timestamp: string; // ISO string
  depth?: number; // 0 for surface
}

export interface OceanObservation {
  id: string;
  stationId: string;
  name: string;
  type: ObservationType;
  latitude: number;
  longitude: number;
  timestamp: string;
  temperature: number; // °C
  salinity: number; // PSU
  currentSpeed: number; // m/s
  currentDirection?: number;
  waveHeight: number; // m
  seaLevel?: number; // m
  batteryLevel?: number; // %
  lastTransmitted: string;
  depthProfile?: DepthProfilePoint[];
  region: string;
  metadata?: {
    wmoId?: string;
    deploymentDate?: string;
    institution?: string;
    sensorType?: string;
    driftSpeed?: number; // km/day for Argo floats
  };
}

export interface DepthProfilePoint {
  depth: number; // meters below surface (0 to 2000)
  temperature: number; // °C
  salinity: number; // PSU
  oxygen?: number; // μmol/kg
}

export interface ComparisonMetric {
  parameter: 'Temperature' | 'Salinity' | 'Current Speed' | 'Wave Height' | 'Sea Level';
  unit: string;
  modelValue: number;
  observedValue: number;
  difference: number; // model - observed or observed - expected
  percentDifference: number;
  severity: AnomalySeverity;
  statusText: string;
  tolerance: number;
}

export interface OceanLocationDetails {
  latitude: number;
  longitude: number;
  placeName?: string;
  oceanRegion: string;
  model: {
    temperature: number;
    salinity: number;
    currentSpeed: number;
    currentDirection: number;
    waveHeight: number;
    seaLevel: number;
  };
  nearestObservation?: {
    observation: OceanObservation;
    distanceKm: number;
  };
  comparisonMetrics: ComparisonMetric[];
  overallAccuracyScore: number; // 0 to 100%
  timeseries: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  label: string; // e.g. "Aug 27 00:00"
  modelTemperature: number;
  observedTemperature?: number;
  modelSalinity: number;
  observedSalinity?: number;
  modelCurrentSpeed: number;
  observedCurrentSpeed?: number;
  modelWaveHeight: number;
  observedWaveHeight?: number;
  modelSeaLevel: number;
}

export interface OceanAnomaly {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  region: string;
  parameter: 'Temperature' | 'Salinity' | 'Currents' | 'Waves' | 'Sea Level';
  unit: string;
  observedValue: number;
  expectedModelValue: number;
  difference: number;
  severity: AnomalySeverity;
  timestamp: string;
  detectedAt: string;
  description: string;
  recommendation?: string;
}

export interface OceanStats {
  totalStations: number;
  activeBuoys: number;
  activeArgoFloats: number;
  activeVessels: number;
  globalMeanTemp: number;
  globalMeanSalinity: number;
  globalMeanWaveHeight: number;
  totalAnomaliesDetected: number;
  modelOverallSkillScore: number; // %
  meanRmseTemperature: number;
  meanRmseSalinity: number;
  lastModelRun: string;
  regions: {
    name: string;
    meanTemp: number;
    meanSalinity: number;
    activePlatforms: number;
    anomaliesCount: number;
    modelAccuracy: number;
  }[];
}

export interface LayerSettings {
  temperature: boolean;
  salinity: boolean;
  currents: boolean;
  waveHeight: boolean;
  seaLevel: boolean;
  stations: boolean;
  argo: boolean;
  buoys: boolean;
  vessels: boolean;
  anomalies: boolean;
  gridLines: boolean;
  labels: boolean;
  atmosphericGlow: boolean;
  opacity: number; // 0.1 to 1.0 for layer heatmaps
}

export interface AIAnalysisRequest {
  query: string;
  context: {
    selectedLocation?: {
      latitude: number;
      longitude: number;
      region?: string;
      modelTemp?: number;
      observedTemp?: number;
      tempDiff?: number;
      salinityDiff?: number;
      nearestStationName?: string;
    };
    currentTimestamp: string;
    activeLayers: string[];
    anomaliesSummary?: string[];
  };
}

export interface AIAnalysisResponse {
  answer: string;
  anomaliesFound?: string[];
  keyTakeaways?: string[];
  scientificInsights?: string[];
  confidenceScore: number;
  source: 'gemini' | 'fallback_engine';
}

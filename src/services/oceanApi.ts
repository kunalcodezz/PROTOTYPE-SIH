/**
 * OceanVision 3D - Service Abstraction Layer & Data Provider
 * Supports switching between Mock and Real Oceanographic Data Providers (NOAA/Copernicus/Argo).
 */

import {
  OceanModelPoint,
  OceanObservation,
  OceanLocationDetails,
  OceanAnomaly,
  OceanStats,
  AIAnalysisRequest,
  AIAnalysisResponse,
} from '../types/ocean';
import {
  generateGriddedModelPoints,
  getObservationsForTimestamp,
  getLocationDetails,
  getDetectedAnomalies,
  getOceanStatistics,
} from '../data/mockOceanData';

export interface IOceanDataProvider {
  getGriddedModelData(timeIndex: number): Promise<OceanModelPoint[]>;
  getObservations(timeIndex: number): Promise<OceanObservation[]>;
  getLocationDetails(lat: number, lon: number, timeIndex: number): Promise<OceanLocationDetails>;
  getAnomalies(timeIndex: number): Promise<OceanAnomaly[]>;
  getOceanStats(timeIndex: number): Promise<OceanStats>;
  analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
}

/**
 * Mock Ocean Data Provider (Default High-Fidelity Simulation)
 */
export class MockOceanDataProvider implements IOceanDataProvider {
  async getGriddedModelData(timeIndex: number): Promise<OceanModelPoint[]> {
    return generateGriddedModelPoints(timeIndex);
  }

  async getObservations(timeIndex: number): Promise<OceanObservation[]> {
    return getObservationsForTimestamp(timeIndex);
  }

  async getLocationDetails(lat: number, lon: number, timeIndex: number): Promise<OceanLocationDetails> {
    return getLocationDetails(lat, lon, timeIndex);
  }

  async getAnomalies(timeIndex: number): Promise<OceanAnomaly[]> {
    return getDetectedAnomalies(timeIndex);
  }

  async getOceanStats(timeIndex: number): Promise<OceanStats> {
    return getOceanStatistics(timeIndex);
  }

  async analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    // Attempt backend API call first (which contacts Gemini)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Graceful fallback to deterministic local science engine
    }

    return this.generateDeterministicAIResponse(request);
  }

  private generateDeterministicAIResponse(request: AIAnalysisRequest): AIAnalysisResponse {
    const { query, context } = request;
    const q = query.toLowerCase();
    const loc = context.selectedLocation;

    if (q.includes('mumbai') || (loc && loc.region?.toLowerCase().includes('arabian'))) {
      return {
        answer: `### 🌊 Oceanographic Analysis: Arabian Sea & Mumbai Offshore\n\n**Current Condition:**\nThe coastal sector off Mumbai is observing a Sea Surface Temperature (SST) of **28.4°C**, compared to the numerical model prediction of **29.0°C** (an offset of **-0.6°C**).\n\n**Key Dynamics:**\n1. **Coastal Ekman Upwelling:** The southwest monsoon wind stress drives offshore Ekman transport, drawing up cooler subsurface thermocline waters (18–22°C at 75m depth).\n2. **Salinity Gradient:** Surface salinity is observed at **34.9 PSU**, slightly lower than open-sea Arabian basin salinity (36.4 PSU) due to coastal runoff.\n3. **Model Assessment:** The numerical model underestimates the strength of the coastal wind-stress curl by approximately 14%, leading to a slight warm bias. Overall assimilation accuracy remains high at **93.8%**.`,
        anomaliesFound: ['Moderate Temperature Anomaly (-0.6°C offset)'],
        keyTakeaways: [
          'Strong coastal upwelling active along the Konkan shelf',
          'Argo profiler 2903881 shows shallow mixed-layer depth (MLD ~32m)',
          'Wave heights stable at 1.9m from SW swell',
        ],
        scientificInsights: [
          'Thermocline gradient: ΔT = 6.3°C across 0–100m depth',
          'Acoustic Doppler current profiling indicates 0.45 m/s southward coastal jet',
        ],
        confidenceScore: 96,
        source: 'fallback_engine',
      };
    }

    if (q.includes('anomaly') || q.includes('unusual') || q.includes('error')) {
      return {
        answer: `### ⚠️ Global Ocean Anomaly & Model Discrepancy Report\n\n**Top Detected Anomalies (27 Aug 2026):**\n\n1. **Ganges-Brahmaputra Delta (Northern Bay of Bengal):**\n   - Observed Salinity: **29.4 PSU** vs Model: **31.8 PSU** (Δ = **-2.4 PSU**, *Significant*).\n   - *Cause:* Massive freshwater runoff plume from monsoon precipitation exceeding climatological runoff boundary conditions.\n\n2. **Southern Ocean (52°S, 85°E):**\n   - Observed Wave Height: **5.8m** vs Model: **4.1m** (Δ = **+1.7m**, *Significant*).\n   - *Cause:* Extra-tropical polar storm front generating high-energy swell dispersion.\n\n3. **Gulf of Mexico Loop Current:**\n   - Observed SST: **30.5°C** vs Model: **29.8°C** (Δ = **+0.7°C**, *Moderate MHW*).\n   - *Implication:* High Ocean Heat Content (OHC) favorable for tropical cyclone intensification.`,
        anomaliesFound: [
          'Northern Bay of Bengal Salinity Plummet (-2.4 PSU)',
          'Southern Ocean Extra-Tropical Wave Swell (+1.7m)',
          'Gulf of Mexico Marine Heatwave (+0.7°C)',
        ],
        keyTakeaways: [
          'Freshwater river discharge is the primary source of regional salinity bias',
          'Polar swell models require scatterometer wind recalibration',
          'Global model skill score currently tracking at 94.2%',
        ],
        scientificInsights: [
          'EnKF assimilation recommended for Bay of Bengal coastal boundaries',
          'Total active in-situ platforms reporting: 14 across 5 major basins',
        ],
        confidenceScore: 94,
        source: 'fallback_engine',
      };
    }

    // General response
    return {
      answer: `### 🌐 Global Oceanographic State Overview\n\n**Current Synthesis for ${context.currentTimestamp || '27 Aug 2026'}:**\n\n- **Global Mean Sea Surface Temperature:** **21.4°C** across all oceanic basins.\n- **Mean Global Salinity:** **34.9 PSU**, with peak haloclines in the Mediterranean (39.1 PSU) and Arabian Sea (36.4 PSU), contrasted by low-salinity freshwater lens in Bay of Bengal (32.4 PSU).\n- **Boundary Currents:** Gulf Stream velocity measured at **1.95 m/s** (NE), Kuroshio at **1.80 m/s**, and Equatorial Wyrtki Jet at **1.15 m/s**.\n- **Observational Network Status:** In-situ network operating with 100% telemetry coverage across active RAMA, PIRATA, TAO/TRITON moored buoys and autonomous Argo floats.`,
      anomaliesFound: ['2 Significant Anomalies, 3 Moderate Anomalies detected globally'],
      keyTakeaways: [
        'Numerical ocean model demonstrates 94.2% overall skill score',
        'Upper ocean stratification stable across tropical warm pool',
        'Click any 3D coordinate or observation marker to inspect localized vertical profiles',
      ],
      scientificInsights: [
        'Global RMSE for SST: 0.42°C | Salinity RMSE: 0.28 PSU',
        'Data integrated from numerical model grids, Argo floats, and moored buoys',
      ],
      confidenceScore: 92,
      source: 'fallback_engine',
    };
  }
}

// Active singleton provider
export const OceanDataService = new MockOceanDataProvider();

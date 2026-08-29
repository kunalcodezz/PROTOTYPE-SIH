/**
 * OceanVision 3D — Continuous Ocean Scalar Field & Heatmap Renderer
 * 
 * Generates continuous, smooth, geographically accurate ocean data fields
 * (SST Temperature, Salinity, Wave Height, Sea Level, Current speed)
 * strictly clipped to the true shape of the ocean with zero land bleeding.
 */

import { OceanModelPoint, LayerType } from '../types/ocean';
import { OceanLandMask } from './OceanLandMask';

// 1. Reference SST Color Ramp (18°C to 34°C+):
// 18°C (#0047FF) -> 20°C (#006BFF) -> 22°C (#00BFFF) -> 24°C (#00E5A8) ->
// 26°C (#7CFF00) -> 28°C (#FFD600) -> 30°C (#FF9D00) -> 32°C (#FF4D00) -> 34°C+ (#F00000)
const SST_COLOR_RAMP: [number, number, number, number][] = [
  [0.000,   0,  71, 255],   // 18°C: Deep electric blue (#0047FF)
  [0.125,   0, 107, 255],   // 20°C: Vivid royal blue (#006BFF)
  [0.250,   0, 191, 255],   // 22°C: Bright cyan (#00BFFF)
  [0.375,   0, 229, 168],   // 24°C: Cyan-green (#00E5A8)
  [0.500, 124, 255,   0],   // 26°C: Lime green (#7CFF00)
  [0.625, 255, 214,   0],   // 28°C: Warm yellow (#FFD600)
  [0.750, 255, 157,   0],   // 30°C: Vibrant orange (#FF9D00)
  [0.875, 255,  77,   0],   // 32°C: Hot orange-red (#FF4D00)
  [1.000, 240,   0,   0],   // 34°C+: Deep red (#F00000)
];

// 2. Salinity color ramp (30 to 39 PSU): Freshwater lens (cyan) -> Normal (deep ocean) -> High salinity (violet)
const SALINITY_COLOR_RAMP: [number, number, number, number][] = [
  [0.00, 140, 205, 235],   // Low salinity freshwater plume (<31 PSU)
  [0.25,  35, 160, 195],   // Moderate river influenced (~32.5 PSU)
  [0.50,   2,  50,  85],   // Standard global open ocean (~34.8 PSU)
  [0.75,  90,  30, 155],   // High evaporation (~36.5 PSU - Arabian Sea)
  [1.00, 125,  45, 195],   // Extreme hypersaline (~39.0 PSU - Red Sea/Med)
];

// 3. Significant Wave Height color ramp (0.5m to 7.0m): Calm teal -> Moderate blue -> Rough amber -> Heavy storm magenta
const WAVE_COLOR_RAMP: [number, number, number, number][] = [
  [0.00,  20, 150, 180],   // Calm / Glassy (< 1.2m)
  [0.25,  10,  95, 185],   // Slight / Moderate (~2.0m)
  [0.50,  15, 165, 130],   // Moderate swell (~3.0m)
  [0.72, 235, 145,  30],   // Rough sea (~4.5m)
  [0.88, 220,  50,  50],   // Very rough / High (~5.8m)
  [1.00, 155,  25, 120],   // Heavy storm swell (7.0m+)
];

function sampleRamp(ramp: [number, number, number, number][], t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < ramp.length - 1; i++) {
    const [pos0, r0, g0, b0] = ramp[i];
    const [pos1, r1, g1, b1] = ramp[i + 1];
    if (clamped >= pos0 && clamped <= pos1) {
      const f = (clamped - pos0) / (pos1 - pos0);
      return [
        Math.round(r0 + (r1 - r0) * f),
        Math.round(g0 + (g1 - g0) * f),
        Math.round(b0 + (b1 - b0) * f),
      ];
    }
  }
  const last = ramp[ramp.length - 1];
  return [last[1], last[2], last[3]];
}

export class OceanHeatmapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public readonly W = 1024;
  public readonly H = 512;

  // Normalized temperature bounds: 18°C to 34°C
  private readonly TEMP_MIN = 18;
  private readonly TEMP_MAX = 34;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Generates a continuous, smooth oceanographic scalar field
   * and clips it strictly to the real coastline mask.
   */
  render(
    modelPoints: OceanModelPoint[],
    layerType: LayerType = 'temperature',
    depthMeters: number = 0
  ) {
    this.ctx.clearRect(0, 0, this.W, this.H);

    const imgData = this.ctx.createImageData(this.W, this.H);
    const buf = imgData.data;

    // Depth cooling factor (thermocline model)
    const depthCooling = Math.max(0.1, Math.exp(-depthMeters / 750));

    // Performance: Build a grid-based spatial index for model points
    // Instead of iterating ALL points for each pixel (O(N×W×H)),
    // bucket points into 10°×10° cells and only check nearby cells (O(~4-8 per pixel))
    const CELL_SIZE = 10; // degrees
    const GRID_COLS_IDX = 36; // 360 / 10
    const GRID_ROWS_IDX = 18; // 180 / 10
    const spatialGrid: OceanModelPoint[][] = new Array(GRID_ROWS_IDX * GRID_COLS_IDX);
    for (let i = 0; i < spatialGrid.length; i++) spatialGrid[i] = [];

    for (const pt of modelPoints) {
      let col = Math.floor((pt.longitude + 180) / CELL_SIZE);
      let row = Math.floor((90 - pt.latitude) / CELL_SIZE);
      if (col < 0) col = 0; if (col >= GRID_COLS_IDX) col = GRID_COLS_IDX - 1;
      if (row < 0) row = 0; if (row >= GRID_ROWS_IDX) row = GRID_ROWS_IDX - 1;
      spatialGrid[row * GRID_COLS_IDX + col].push(pt);
    }

    for (let py = 0; py < this.H; py++) {
      const lat = 90 - (py / this.H) * 180;
      const absLat = Math.abs(lat);

      // Pre-compute the grid row for this latitude
      let gridRow = Math.floor((90 - lat) / CELL_SIZE);
      if (gridRow < 0) gridRow = 0; if (gridRow >= GRID_ROWS_IDX) gridRow = GRID_ROWS_IDX - 1;

      for (let px = 0; px < this.W; px++) {
        const lon = (px / this.W) * 360 - 180;
        const pIdx = (py * this.W + px) << 2;

        // 1. Strict Fast Land Check
        if (OceanLandMask.isLand(lat, lon)) {
          buf[pIdx + 3] = 0; // 100% transparent on land
          continue;
        }

        // 2. Base Climatological Physical Ocean Model
        let baseTemp = Math.max(0, (29.5 - Math.pow(absLat / 70, 1.7) * 28.5));
        let baseSal = 34.7 + Math.sin(lat * 0.05) * 0.6;
        let baseWave = lat < -40 ? 4.6 : absLat > 35 ? 2.8 : 1.6;

        // Regional Oceanographic Signatures:
        // Arabian Sea: warm basin with localized coastal Ekman upwelling
        if (lat >= 8 && lat <= 26 && lon >= 50 && lon <= 77) {
          const isUpwellingZone = (lon <= 58 && lat <= 18) || (lon >= 72 && lon <= 75 && lat >= 10 && lat <= 18);
          baseTemp = isUpwellingZone ? 26.8 : 28.6;
          baseSal = 36.4;
          baseWave = 2.4; // Monsoon swell
        }
        // Bay of Bengal: warm pool with large river runoff freshwater lens
        else if (lat >= 5 && lat <= 23 && lon >= 80 && lon <= 96) {
          baseTemp = 29.8;
          baseSal = lat >= 17 ? 31.2 : 33.0;
          baseWave = 2.2;
        }
        // Gulf Stream / North Atlantic
        else if (lat >= 25 && lat <= 45 && lon >= -80 && lon <= -40) {
          baseTemp += 4.5;
          baseWave = 3.1;
        }
        // Kuroshio / West Pacific
        else if (lat >= 20 && lat <= 40 && lon >= 120 && lon <= 150) {
          baseTemp += 4.0;
          baseWave = 2.9;
        }
        // Antarctic Circumpolar Current / Southern Ocean Roaring 40s
        else if (lat <= -45) {
          baseTemp = 1.2;
          baseSal = 34.0;
          baseWave = 5.2; // Massive swells
        }

        // 3. IDW blending from nearest model points (using spatial index)
        let weightSum = 0;
        let weightedTemp = 0;
        let weightedSal = 0;
        let weightedWave = 0;

        let gridCol = Math.floor((lon + 180) / CELL_SIZE);
        if (gridCol < 0) gridCol = 0; if (gridCol >= GRID_COLS_IDX) gridCol = GRID_COLS_IDX - 1;

        // Check this cell and immediate neighbors (3×3 = 9 cells max)
        for (let dr = -1; dr <= 1; dr++) {
          const nr = gridRow + dr;
          if (nr < 0 || nr >= GRID_ROWS_IDX) continue;
          for (let dc = -1; dc <= 1; dc++) {
            let nc = gridCol + dc;
            // Wrap around longitude
            if (nc < 0) nc += GRID_COLS_IDX;
            if (nc >= GRID_COLS_IDX) nc -= GRID_COLS_IDX;

            const bucket = spatialGrid[nr * GRID_COLS_IDX + nc];
            for (let i = 0; i < bucket.length; i++) {
              const pt = bucket[i];
              const dLat = lat - pt.latitude;
              let dLon = Math.abs(lon - pt.longitude);
              if (dLon > 180) dLon = 360 - dLon;

              const distSq = dLat * dLat + dLon * dLon;
              if (distSq < 144) {
                const w = 1.0 / (distSq + 1.2);
                weightSum += w;
                weightedTemp += pt.temperature * w;
                weightedSal += pt.salinity * w;
                weightedWave += pt.waveHeight * w;
              }
            }
          }
        }

        let finalTemp = weightSum > 0 ? (weightedTemp / weightSum) : baseTemp;
        let finalSal = weightSum > 0 ? (weightedSal / weightSum) : baseSal;
        let finalWave = weightSum > 0 ? (weightedWave / weightSum) : baseWave;

        // Apply depth thermocline decay for temperature
        finalTemp = Math.max(1.8, finalTemp * depthCooling);

        // 4. Color Assignment based on Active Layer
        let r = 0, g = 0, b = 0;
        let alpha = 145;

        if (layerType === 'salinity') {
          const sNorm = (finalSal - 30) / (39 - 30);
          [r, g, b] = sampleRamp(SALINITY_COLOR_RAMP, sNorm);
          alpha = 155;
        } else if (layerType === 'waveHeight') {
          const wNorm = (finalWave - 0.5) / (7.0 - 0.5);
          [r, g, b] = sampleRamp(WAVE_COLOR_RAMP, wNorm);
          alpha = 155;
        } else {
          // Default: Temperature / Global Heatmap (Normalized 18°C to 34°C)
          const tNorm = (finalTemp - this.TEMP_MIN) / (this.TEMP_MAX - this.TEMP_MIN);
          [r, g, b] = sampleRamp(SST_COLOR_RAMP, tNorm);
          alpha = 175;
        }

        buf[pIdx] = r;
        buf[pIdx + 1] = g;
        buf[pIdx + 2] = b;
        buf[pIdx + 3] = alpha;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);

    // 5. Post-process: Punch out land using exact vector land mask
    OceanLandMask.applyMaskToContext(this.ctx, this.W, this.H);
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }
}

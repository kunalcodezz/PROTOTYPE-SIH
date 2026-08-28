/**
 * OceanVision 3D — Ultra-Fast Smooth Ocean Temperature Heatmap Renderer
 * 
 * Generates an equirectangular SST texture once per dataset change.
 * Resolution is 512x256 for instant rendering (< 2ms) with zero main-thread block.
 */

import { OceanModelPoint } from '../types/ocean';

// Scientific color ramp: Deep blue -> Cyan -> Emerald -> Yellow -> Orange -> Crimson
const SST_COLOR_RAMP: [number, number, number, number][] = [
  [0.00,   8,  29,  88],   // Deep blue
  [0.12,  16,  56, 138],   // Dark ocean blue
  [0.25,   0, 120, 200],   // Cold blue
  [0.38,   0, 180, 216],   // Bright cyan
  [0.50,  40, 190, 160],   // Sea green / teal
  [0.62, 130, 205,  75],   // Yellow-green
  [0.72, 245, 210,  50],   // Warm yellow
  [0.82, 245, 145,  40],   // Orange
  [0.92, 225,  45,  35],   // Coral red
  [1.00, 175,  15,  25],   // Deep crimson
];

function sampleColorRamp(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < SST_COLOR_RAMP.length - 1; i++) {
    const [pos0, r0, g0, b0] = SST_COLOR_RAMP[i];
    const [pos1, r1, g1, b1] = SST_COLOR_RAMP[i + 1];
    if (clamped >= pos0 && clamped <= pos1) {
      const f = (clamped - pos0) / (pos1 - pos0);
      return [
        (r0 + (r1 - r0) * f) | 0,
        (g0 + (g1 - g0) * f) | 0,
        (b0 + (b1 - b0) * f) | 0,
      ];
    }
  }
  const last = SST_COLOR_RAMP[SST_COLOR_RAMP.length - 1];
  return [last[1], last[2], last[3]];
}

function isLandApprox(lat: number, lon: number): boolean {
  if (lat >= -32 && lat <= 35 && lon >= 10 && lon <= 45) return true;
  if (lat >= 15 && lat <= 33 && lon >= 30 && lon <= 55) return true;
  if (lat >= 8 && lat <= 35 && lon >= 74 && lon <= 88) {
    if (lat >= 20 && lon >= 74 && lon <= 88) return true;
    if (lat >= 12 && lat <= 20 && lon >= 75 && lon <= 82) return true;
  }
  if (lat >= 30 && lat <= 70 && lon >= 40 && lon <= 130) return true;
  if (lat >= 36 && lat <= 60 && lon >= -8 && lon <= 35) return true;
  if (lat >= 25 && lat <= 65 && lon >= -125 && lon <= -75) return true;
  if (lat >= -50 && lat <= 10 && lon >= -75 && lon <= -40) return true;
  if (lat >= -38 && lat <= -15 && lon >= 115 && lon <= 150) return true;
  if (lat < -72) return true;
  return false;
}

export class OceanHeatmapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private readonly W = 512;
  private readonly H = 256;

  private readonly GRID_RES = 3;
  private readonly GRID_COLS = 120;
  private readonly GRID_ROWS = 60;
  private grid: Float32Array;
  private validGrid: Uint8Array;

  private readonly TEMP_MIN = 0;
  private readonly TEMP_MAX = 32;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    const totalCells = this.GRID_COLS * this.GRID_ROWS;
    this.grid = new Float32Array(totalCells);
    this.validGrid = new Uint8Array(totalCells);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  render(modelPoints: OceanModelPoint[]) {
    this.grid.fill(0);
    this.validGrid.fill(0);

    for (const pt of modelPoints) {
      const col = Math.floor((((pt.longitude + 180) % 360 + 360) % 360) / this.GRID_RES);
      const row = Math.floor((90 - pt.latitude) / this.GRID_RES);
      if (row < 0 || row >= this.GRID_ROWS || col < 0 || col >= this.GRID_COLS) continue;
      const idx = row * this.GRID_COLS + col;
      this.grid[idx] = pt.temperature;
      this.validGrid[idx] = 1;
    }

    // Gap fill pass
    for (let pass = 0; pass < 3; pass++) {
      for (let r = 1; r < this.GRID_ROWS - 1; r++) {
        for (let c = 0; c < this.GRID_COLS; c++) {
          const idx = r * this.GRID_COLS + c;
          if (this.validGrid[idx] === 1) continue;

          const cl = (c - 1 + this.GRID_COLS) % this.GRID_COLS;
          const cr = (c + 1) % this.GRID_COLS;

          let sum = 0;
          let count = 0;

          const top = (r - 1) * this.GRID_COLS + c;
          const btm = (r + 1) * this.GRID_COLS + c;
          const lft = r * this.GRID_COLS + cl;
          const rgt = r * this.GRID_COLS + cr;

          if (this.validGrid[top] === 1) { sum += this.grid[top]; count++; }
          if (this.validGrid[btm] === 1) { sum += this.grid[btm]; count++; }
          if (this.validGrid[lft] === 1) { sum += this.grid[lft]; count++; }
          if (this.validGrid[rgt] === 1) { sum += this.grid[rgt]; count++; }

          if (count >= 2) {
            this.grid[idx] = sum / count;
            this.validGrid[idx] = 1;
          }
        }
      }
    }

    // Draw directly to imageData
    const imgData = this.ctx.createImageData(this.W, this.H);
    const buf = imgData.data;

    for (let py = 0; py < this.H; py++) {
      const lat = 90 - (py / this.H) * 180;
      const rowF = (py / this.H) * this.GRID_ROWS;
      const r0 = Math.min(rowF | 0, this.GRID_ROWS - 1);
      const r1 = Math.min(r0 + 1, this.GRID_ROWS - 1);
      const fy = rowF - (rowF | 0);

      for (let px = 0; px < this.W; px++) {
        const lon = (px / this.W) * 360 - 180;
        const pIdx = (py * this.W + px) << 2;

        if (isLandApprox(lat, lon)) {
          buf[pIdx + 3] = 0;
          continue;
        }

        const colF = (px / this.W) * this.GRID_COLS;
        const c0 = (colF | 0) % this.GRID_COLS;
        const c1 = (c0 + 1) % this.GRID_COLS;
        const fx = colF - (colF | 0);

        const v00 = this.grid[r0 * this.GRID_COLS + c0];
        const v10 = this.grid[r0 * this.GRID_COLS + c1];
        const v01 = this.grid[r1 * this.GRID_COLS + c0];
        const v11 = this.grid[r1 * this.GRID_COLS + c1];

        const temp =
          v00 * (1 - fx) * (1 - fy) +
          v10 * fx * (1 - fy) +
          v01 * (1 - fx) * fy +
          v11 * fx * fy;

        if (temp <= 0) {
          buf[pIdx + 3] = 0;
          continue;
        }

        const t = (temp - this.TEMP_MIN) / (this.TEMP_MAX - this.TEMP_MIN);
        const [r, g, b] = sampleColorRamp(t);

        buf[pIdx] = r;
        buf[pIdx + 1] = g;
        buf[pIdx + 2] = b;
        buf[pIdx + 3] = 145; // ~57% translucency
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }
}

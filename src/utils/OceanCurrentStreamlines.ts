/**
 * OceanVision 3D — Ocean Current Streamline Particle System
 * 
 * Renders animated flowing particles across the ocean surface that follow
 * a velocity field derived from OceanModelPoint[] data. The particles are
 * rendered as fading trails on an offscreen canvas that gets projected onto
 * the Cesium globe as a SingleTileImageryProvider layer.
 * 
 * Visual style: bright cyan/white streamlines on transparent background,
 * matching NASA/NOAA ocean current visualisation aesthetics.
 */

import { OceanModelPoint } from '../types/ocean';

interface Particle {
  x: number;     // canvas x (0..width)
  y: number;     // canvas y (0..height)
  age: number;   // current age in frames
  maxAge: number; // frames before respawn
  speed: number; // cached speed at spawn for coloring
}

interface VelocityCell {
  u: number;  // east-west component (positive = east)
  v: number;  // north-south component (positive = north)
  speed: number;
}

// Simple approximate land mask for filtering particle spawns
function isLandApprox(lat: number, lon: number): boolean {
  // Africa
  if (lat >= -32 && lat <= 35 && lon >= 10 && lon <= 45) return true;
  if (lat >= 15 && lat <= 33 && lon >= 30 && lon <= 55) return true;
  // India
  if (lat >= 8 && lat <= 35 && lon >= 74 && lon <= 88) {
    if (lat >= 20 && lon >= 74 && lon <= 88) return true;
    if (lat >= 12 && lat <= 20 && lon >= 75 && lon <= 82) return true;
  }
  // Russia/China
  if (lat >= 30 && lat <= 70 && lon >= 40 && lon <= 130) return true;
  // Europe
  if (lat >= 36 && lat <= 60 && lon >= -8 && lon <= 35) return true;
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

export class OceanCurrentStreamlines {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private velocityField: (VelocityCell | null)[][] = []; // [latIdx][lonIdx]
  private animFrameId: number | null = null;
  private isRunning = false;

  // Canvas dimensions — equirectangular projection
  private readonly W = 2048;
  private readonly H = 1024;

  // Velocity field grid resolution in degrees
  private readonly GRID_RES = 3; // degrees per cell
  private readonly GRID_COLS: number;
  private readonly GRID_ROWS: number;

  // Particle config
  private readonly PARTICLE_COUNT = 4500;
  private readonly MIN_AGE = 25;
  private readonly MAX_AGE = 80;
  private readonly TRAIL_FADE = 0.92; // trail persistence (0..1)
  private readonly SPEED_SCALE = 38;  // pixels per m/s per frame

  // Callback to notify Cesium the texture has updated
  private onFrameUpdate: (() => void) | null = null;

  constructor() {
    this.GRID_COLS = Math.ceil(360 / this.GRID_RES);
    this.GRID_ROWS = Math.ceil(180 / this.GRID_RES);

    // Main compositing canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false })!;

    // Trail accumulation canvas (fades over time)
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = this.W;
    this.trailCanvas.height = this.H;
    this.trailCtx = this.trailCanvas.getContext('2d', { willReadFrequently: false })!;
    this.trailCtx.fillStyle = 'rgba(0,0,0,0)';
    this.trailCtx.fillRect(0, 0, this.W, this.H);

    // Init empty velocity field
    for (let r = 0; r < this.GRID_ROWS; r++) {
      this.velocityField[r] = [];
      for (let c = 0; c < this.GRID_COLS; c++) {
        this.velocityField[r][c] = null;
      }
    }
  }

  /** Get the canvas element to use as an imagery source */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Set callback when frame updates (to trigger Cesium layer refresh) */
  setOnFrameUpdate(cb: () => void) {
    this.onFrameUpdate = cb;
  }

  /** Build velocity field from model points */
  updateVelocityField(modelPoints: OceanModelPoint[]) {
    // Reset field
    for (let r = 0; r < this.GRID_ROWS; r++) {
      for (let c = 0; c < this.GRID_COLS; c++) {
        this.velocityField[r][c] = null;
      }
    }

    for (const pt of modelPoints) {
      const col = Math.floor((pt.longitude + 180) / this.GRID_RES);
      const row = Math.floor((90 - pt.latitude) / this.GRID_RES);
      if (row < 0 || row >= this.GRID_ROWS || col < 0 || col >= this.GRID_COLS) continue;

      const rad = (pt.currentDirection * Math.PI) / 180;
      const u = pt.currentSpeed * Math.sin(rad);
      const v = pt.currentSpeed * Math.cos(rad);

      this.velocityField[row][col] = { u, v, speed: pt.currentSpeed };
    }

    // Fill gaps via basic nearest-neighbor interpolation for denser coverage
    this._fillGaps();
  }

  /** Simple gap-filling: spread known cells to empty neighbors (2 passes) */
  private _fillGaps() {
    for (let pass = 0; pass < 3; pass++) {
      const copy = this.velocityField.map((row) => [...row]);
      for (let r = 1; r < this.GRID_ROWS - 1; r++) {
        for (let c = 0; c < this.GRID_COLS; c++) {
          if (copy[r][c] !== null) continue;
          const neighbors: VelocityCell[] = [];
          const cl = (c - 1 + this.GRID_COLS) % this.GRID_COLS;
          const cr = (c + 1) % this.GRID_COLS;
          if (copy[r - 1][c]) neighbors.push(copy[r - 1][c]!);
          if (copy[r + 1][c]) neighbors.push(copy[r + 1][c]!);
          if (copy[r][cl]) neighbors.push(copy[r][cl]!);
          if (copy[r][cr]) neighbors.push(copy[r][cr]!);
          if (neighbors.length >= 2) {
            const avgU = neighbors.reduce((s, n) => s + n.u, 0) / neighbors.length;
            const avgV = neighbors.reduce((s, n) => s + n.v, 0) / neighbors.length;
            const avgSpd = neighbors.reduce((s, n) => s + n.speed, 0) / neighbors.length;
            this.velocityField[r][c] = { u: avgU, v: avgV, speed: avgSpd };
          }
        }
      }
    }
  }

  /** Look up interpolated velocity at a canvas pixel position */
  private _getVelocity(x: number, y: number): VelocityCell | null {
    // Canvas coords to lat/lon
    const lon = (x / this.W) * 360 - 180;
    const lat = 90 - (y / this.H) * 180;

    // Skip land
    if (isLandApprox(lat, lon)) return null;

    const col = (x / this.W) * this.GRID_COLS;
    const row = (y / this.H) * this.GRID_ROWS;

    const c0 = Math.floor(col) % this.GRID_COLS;
    const r0 = Math.min(Math.floor(row), this.GRID_ROWS - 1);
    const c1 = (c0 + 1) % this.GRID_COLS;
    const r1 = Math.min(r0 + 1, this.GRID_ROWS - 1);

    const fx = col - Math.floor(col);
    const fy = row - Math.floor(row);

    const v00 = this.velocityField[r0]?.[c0];
    const v10 = this.velocityField[r0]?.[c1];
    const v01 = this.velocityField[r1]?.[c0];
    const v11 = this.velocityField[r1]?.[c1];

    // Bilinear interpolation — need at least one corner defined
    let uSum = 0, vSum = 0, spdSum = 0, wSum = 0;
    const corners: [VelocityCell | null | undefined, number][] = [
      [v00, (1 - fx) * (1 - fy)],
      [v10, fx * (1 - fy)],
      [v01, (1 - fx) * fy],
      [v11, fx * fy],
    ];
    for (const [cell, w] of corners) {
      if (cell) {
        uSum += cell.u * w;
        vSum += cell.v * w;
        spdSum += cell.speed * w;
        wSum += w;
      }
    }
    if (wSum < 0.01) return null;
    return { u: uSum / wSum, v: vSum / wSum, speed: spdSum / wSum };
  }

  /** Spawn a particle at a random ocean location */
  private _spawnParticle(): Particle {
    let x: number, y: number, attempts = 0;
    do {
      x = Math.random() * this.W;
      y = Math.random() * this.H;
      attempts++;
    } while (this._getVelocity(x, y) === null && attempts < 30);

    return {
      x,
      y,
      age: Math.floor(Math.random() * this.MIN_AGE), // stagger ages
      maxAge: this.MIN_AGE + Math.floor(Math.random() * (this.MAX_AGE - this.MIN_AGE)),
      speed: 0,
    };
  }

  /** Initialize all particles */
  private _initParticles() {
    this.particles = [];
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particles.push(this._spawnParticle());
    }
  }

  /** Single animation frame */
  private _tick = () => {
    if (!this.isRunning) return;

    // Fade trail canvas
    this.trailCtx.globalCompositeOperation = 'destination-in';
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${this.TRAIL_FADE})`;
    this.trailCtx.fillRect(0, 0, this.W, this.H);
    this.trailCtx.globalCompositeOperation = 'source-over';

    // Move & draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.age >= p.maxAge || p.x < 0 || p.x >= this.W || p.y < 0 || p.y >= this.H) {
        this.particles[i] = this._spawnParticle();
        continue;
      }

      const vel = this._getVelocity(p.x, p.y);
      if (!vel || vel.speed < 0.05) {
        this.particles[i] = this._spawnParticle();
        continue;
      }

      p.speed = vel.speed;

      const oldX = p.x;
      const oldY = p.y;

      // Move particle: u -> x (east positive), v -> y (north positive, but canvas y is inverted)
      p.x += vel.u * this.SPEED_SCALE;
      p.y -= vel.v * this.SPEED_SCALE; // inverted y

      // Wrap x around
      if (p.x >= this.W) p.x -= this.W;
      if (p.x < 0) p.x += this.W;

      p.age++;

      // Alpha based on age (fade in and fade out)
      const ageRatio = p.age / p.maxAge;
      let alpha = 1.0;
      if (ageRatio < 0.1) alpha = ageRatio / 0.1;
      else if (ageRatio > 0.8) alpha = (1.0 - ageRatio) / 0.2;
      alpha = Math.max(0.05, Math.min(1.0, alpha));

      // Color based on speed: slow = deep blue, medium = cyan, fast = white
      const speedNorm = Math.min(1.0, vel.speed / 1.8);
      const r = Math.floor(80 + speedNorm * 175);
      const g = Math.floor(200 + speedNorm * 55);
      const b = 255;
      const lineWidth = 1.0 + speedNorm * 1.5;

      this.trailCtx.beginPath();
      this.trailCtx.moveTo(oldX, oldY);
      this.trailCtx.lineTo(p.x, p.y);
      this.trailCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.85})`;
      this.trailCtx.lineWidth = lineWidth;
      this.trailCtx.lineCap = 'round';
      this.trailCtx.stroke();

      // Draw particle head glow
      if (alpha > 0.3 && speedNorm > 0.15) {
        this.trailCtx.beginPath();
        this.trailCtx.arc(p.x, p.y, 1.2 + speedNorm, 0, Math.PI * 2);
        this.trailCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        this.trailCtx.fill();
      }
    }

    // Composite: clear main canvas, draw trail
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.drawImage(this.trailCanvas, 0, 0);

    if (this.onFrameUpdate) this.onFrameUpdate();

    this.animFrameId = requestAnimationFrame(this._tick);
  };

  /** Start the particle animation */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._initParticles();
    this._tick();
  }

  /** Stop the animation */
  stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /** Clear the canvas */
  clear() {
    this.stop();
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.trailCtx.clearRect(0, 0, this.W, this.H);
  }

  /** Destroy and release resources */
  destroy() {
    this.clear();
    this.particles = [];
    this.onFrameUpdate = null;
  }
}

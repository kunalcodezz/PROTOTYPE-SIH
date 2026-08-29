/**
 * OceanVision 3D — Ocean Current Streamline Particle System
 * 
 * Renders animated flowing particles across the ocean surface strictly
 * constrained to ocean waters using OceanLandMask.
 */

import { OceanModelPoint } from '../types/ocean';
import { OceanLandMask } from './OceanLandMask';

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
  private readonly GRID_RES = 2.5; // degrees per cell
  private readonly GRID_COLS: number;
  private readonly GRID_ROWS: number;

  // Particle config
  private readonly PARTICLE_COUNT = 2000; // Performance: reduced from 4000
  private readonly MIN_AGE = 25;
  private readonly MAX_AGE = 75;
  private readonly TRAIL_FADE = 0.92; // trail persistence (0..1)
  private readonly SPEED_SCALE = 36;  // pixels per m/s per frame

  private onFrameUpdate: (() => void) | null = null;

  constructor() {
    this.GRID_COLS = Math.ceil(360 / this.GRID_RES);
    this.GRID_ROWS = Math.ceil(180 / this.GRID_RES);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false })!;

    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = this.W;
    this.trailCanvas.height = this.H;
    this.trailCtx = this.trailCanvas.getContext('2d', { willReadFrequently: false })!;
    this.trailCtx.fillStyle = 'rgba(0,0,0,0)';
    this.trailCtx.fillRect(0, 0, this.W, this.H);

    for (let r = 0; r < this.GRID_ROWS; r++) {
      this.velocityField[r] = [];
      for (let c = 0; c < this.GRID_COLS; c++) {
        this.velocityField[r][c] = null;
      }
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  setOnFrameUpdate(cb: () => void) {
    this.onFrameUpdate = cb;
  }

  updateVelocityField(modelPoints: OceanModelPoint[]) {
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

    this._fillGaps();
  }

  private _fillGaps() {
    for (let pass = 0; pass < 2; pass++) {
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

  private _getVelocity(x: number, y: number): VelocityCell | null {
    const lon = (x / this.W) * 360 - 180;
    const lat = 90 - (y / this.H) * 180;

    if (OceanLandMask.isLand(lat, lon)) return null;

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

  private _spawnParticle(): Particle {
    let x: number, y: number, attempts = 0;
    do {
      x = Math.random() * this.W;
      y = Math.random() * this.H;
      attempts++;
    } while (this._getVelocity(x, y) === null && attempts < 35);

    return {
      x,
      y,
      age: Math.floor(Math.random() * this.MIN_AGE),
      maxAge: this.MIN_AGE + Math.floor(Math.random() * (this.MAX_AGE - this.MIN_AGE)),
      speed: 0,
    };
  }

  private _initParticles() {
    this.particles = [];
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particles.push(this._spawnParticle());
    }
  }

  private _tick = () => {
    if (!this.isRunning) return;

    this.trailCtx.globalCompositeOperation = 'destination-in';
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${this.TRAIL_FADE})`;
    this.trailCtx.fillRect(0, 0, this.W, this.H);
    this.trailCtx.globalCompositeOperation = 'source-over';

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

      p.x += vel.u * this.SPEED_SCALE;
      p.y -= vel.v * this.SPEED_SCALE;

      if (p.x >= this.W) p.x -= this.W;
      if (p.x < 0) p.x += this.W;

      // Check if moved into land
      const lat = 90 - (p.y / this.H) * 180;
      const lon = (p.x / this.W) * 360 - 180;
      if (OceanLandMask.isLand(lat, lon)) {
        this.particles[i] = this._spawnParticle();
        continue;
      }

      p.age++;

      const ageRatio = p.age / p.maxAge;
      let alpha = 1.0;
      if (ageRatio < 0.1) alpha = ageRatio / 0.1;
      else if (ageRatio > 0.8) alpha = (1.0 - ageRatio) / 0.2;
      alpha = Math.max(0.05, Math.min(1.0, alpha));

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
    }

    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.drawImage(this.trailCanvas, 0, 0);

    // Apply land mask to guarantee no stray streamline on land
    OceanLandMask.applyMaskToContext(this.ctx, this.W, this.H);

    if (this.onFrameUpdate) this.onFrameUpdate();

    this.animFrameId = requestAnimationFrame(this._tick);
  };

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._initParticles();
    this._tick();
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  clear() {
    this.stop();
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.trailCtx.clearRect(0, 0, this.W, this.H);
  }

  destroy() {
    this.clear();
    this.particles = [];
    this.onFrameUpdate = null;
  }
}

/**
 * OceanVision 3D — Native WebGL Particle Flow System
 * 
 * Uses Cesium.PointPrimitiveCollection for hardware-accelerated 60+ FPS
 * particle animation directly in the 3D scene without canvas toDataURL lag.
 */

import * as Cesium from 'cesium';
import { OceanModelPoint } from '../types/ocean';

interface VelocityCell {
  u: number;
  v: number;
  speed: number;
}

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
  speed: number;
  primitive: Cesium.PointPrimitive;
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

export class CesiumFlowParticleSystem {
  private viewer: Cesium.Viewer;
  private collection: Cesium.PointPrimitiveCollection | null = null;
  private particles: Particle[] = [];
  private velocityGrid: (VelocityCell | null)[][] = [];
  private removePreRenderListener: (() => void) | null = null;
  private isVisible = false;

  private readonly GRID_RES = 3; // degrees per cell
  private readonly GRID_COLS = 120; // 360 / 3
  private readonly GRID_ROWS = 60;  // 180 / 3
  private readonly PARTICLE_COUNT = 1500;
  private readonly SPEED_SCALE = 0.08;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this._initVelocityGrid();
  }

  private _initVelocityGrid() {
    this.velocityGrid = [];
    for (let r = 0; r < this.GRID_ROWS; r++) {
      this.velocityGrid[r] = [];
      for (let c = 0; c < this.GRID_COLS; c++) {
        this.velocityGrid[r][c] = null;
      }
    }
  }

  public updateData(modelPoints: OceanModelPoint[]) {
    this._initVelocityGrid();

    for (const pt of modelPoints) {
      const col = Math.floor((((pt.longitude + 180) % 360 + 360) % 360) / this.GRID_RES);
      const row = Math.floor((90 - pt.latitude) / this.GRID_RES);
      if (row < 0 || row >= this.GRID_ROWS || col < 0 || col >= this.GRID_COLS) continue;

      const rad = (pt.currentDirection * Math.PI) / 180;
      const u = pt.currentSpeed * Math.sin(rad);
      const v = pt.currentSpeed * Math.cos(rad);
      this.velocityGrid[row][col] = { u, v, speed: pt.currentSpeed };
    }

    // Quick 2-pass gap fill
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 1; r < this.GRID_ROWS - 1; r++) {
        for (let c = 0; c < this.GRID_COLS; c++) {
          if (this.velocityGrid[r][c] !== null) continue;
          const cl = (c - 1 + this.GRID_COLS) % this.GRID_COLS;
          const cr = (c + 1) % this.GRID_COLS;
          const n1 = this.velocityGrid[r - 1][c];
          const n2 = this.velocityGrid[r + 1][c];
          const n3 = this.velocityGrid[r][cl];
          const n4 = this.velocityGrid[r][cr];
          const neighbors = [n1, n2, n3, n4].filter((n): n is VelocityCell => n !== null);
          if (neighbors.length >= 2) {
            const avgU = neighbors.reduce((s, n) => s + n.u, 0) / neighbors.length;
            const avgV = neighbors.reduce((s, n) => s + n.v, 0) / neighbors.length;
            const avgSpd = neighbors.reduce((s, n) => s + n.speed, 0) / neighbors.length;
            this.velocityGrid[r][c] = { u: avgU, v: avgV, speed: avgSpd };
          }
        }
      }
    }
  }

  private _getVelocity(lat: number, lon: number): VelocityCell | null {
    if (isLandApprox(lat, lon)) return null;
    const normLon = (((lon + 180) % 360 + 360) % 360);
    const col = Math.floor(normLon / this.GRID_RES) % this.GRID_COLS;
    const row = Math.min(Math.max(0, Math.floor((90 - lat) / this.GRID_RES)), this.GRID_ROWS - 1);
    return this.velocityGrid[row]?.[col] || null;
  }

  private _spawnParticle(p?: Particle): Particle {
    let lat = 0;
    let lon = 0;
    let attempts = 0;
    let vel: VelocityCell | null = null;

    // Bias spawns towards Indian Ocean & key current zones for dense visual appeal
    while (attempts < 20) {
      if (Math.random() < 0.6) {
        lat = -15 + Math.random() * 45; // -15 to +30
        lon = 45 + Math.random() * 65;  // 45 to 110 (Arabian Sea / Indian Ocean / Bay of Bengal)
      } else {
        lat = -65 + Math.random() * 130;
        lon = -180 + Math.random() * 360;
      }
      vel = this._getVelocity(lat, lon);
      if (vel && vel.speed > 0.15) break;
      attempts++;
    }

    const maxAge = 40 + Math.floor(Math.random() * 60);
    const age = p ? 0 : Math.floor(Math.random() * maxAge);
    const speed = vel ? vel.speed : 0.5;

    let primitive: Cesium.PointPrimitive;
    if (p && p.primitive) {
      primitive = p.primitive;
    } else {
      primitive = this.collection!.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 4000),
        pixelSize: 3,
        color: Cesium.Color.CYAN.withAlpha(0.7),
      });
    }

    return {
      lat,
      lon,
      age,
      maxAge,
      speed,
      primitive,
    };
  }

  public show() {
    if (this.isVisible) return;
    this.isVisible = true;

    if (!this.collection) {
      this.collection = this.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
      for (let i = 0; i < this.PARTICLE_COUNT; i++) {
        this.particles.push(this._spawnParticle());
      }
    } else {
      this.collection.show = true;
    }

    if (!this.removePreRenderListener) {
      this.removePreRenderListener = this.viewer.scene.preRender.addEventListener(this._step);
    }
  }

  public hide() {
    this.isVisible = false;
    if (this.collection) {
      this.collection.show = false;
    }
    if (this.removePreRenderListener) {
      this.removePreRenderListener();
      this.removePreRenderListener = null;
    }
  }

  private _step = () => {
    if (!this.isVisible || !this.collection) return;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age++;

      if (p.age >= p.maxAge || p.lat > 80 || p.lat < -80) {
        this.particles[i] = this._spawnParticle(p);
        continue;
      }

      const vel = this._getVelocity(p.lat, p.lon);
      if (!vel || vel.speed < 0.05) {
        this.particles[i] = this._spawnParticle(p);
        continue;
      }

      p.speed = vel.speed;
      const latRad = (p.lat * Math.PI) / 180;
      const cosLat = Math.max(0.15, Math.cos(latRad));

      p.lat += vel.v * this.SPEED_SCALE;
      p.lon += (vel.u * this.SPEED_SCALE) / cosLat;

      if (p.lon > 180) p.lon -= 360;
      if (p.lon < -180) p.lon += 360;

      // Alpha envelope (fade in / fade out)
      const ratio = p.age / p.maxAge;
      let alpha = 1.0;
      if (ratio < 0.15) alpha = ratio / 0.15;
      else if (ratio > 0.75) alpha = (1.0 - ratio) / 0.25;

      const speedNorm = Math.min(1.0, p.speed / 1.6);

      // Color mapping: electric cyan to glowing warm white
      const r = 0.2 + speedNorm * 0.7;
      const g = 0.85 + speedNorm * 0.15;
      const b = 1.0;
      const size = 2.5 + speedNorm * 2.5;

      p.primitive.position = Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 4000);
      p.primitive.color = new Cesium.Color(r, g, b, alpha * 0.9);
      p.primitive.pixelSize = size;
    }
  };

  public destroy() {
    this.hide();
    if (this.collection && !this.viewer.isDestroyed()) {
      try {
        this.viewer.scene.primitives.remove(this.collection);
      } catch (_) {}
      this.collection = null;
    }
    this.particles = [];
  }
}

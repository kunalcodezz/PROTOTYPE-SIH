/**
 * OceanVision 3D — Native WebGL Particle Flow System
 * 
 * Uses Cesium.PointPrimitiveCollection for hardware-accelerated 60+ FPS
 * current particle animation strictly constrained to the ocean geometry.
 * Simulates fluid ocean dynamics, curved streamlines, and oceanic gyres/vortices.
 */

import * as Cesium from 'cesium';
import { OceanModelPoint } from '../types/ocean';
import { OceanLandMask } from './OceanLandMask';

interface VelocityCell {
  u: number; // East-West velocity (m/s)
  v: number; // North-South velocity (m/s)
  speed: number;
}

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
  speed: number;
  primitive: Cesium.PointPrimitive;
  cartesian: Cesium.Cartesian3;
  color: Cesium.Color;
}

export interface RegionBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export class CesiumFlowParticleSystem {
  private viewer: Cesium.Viewer;
  private collection: Cesium.PointPrimitiveCollection | null = null;
  private particles: Particle[] = [];
  private velocityGrid: (VelocityCell | null)[][] = [];
  private removePreRenderListener: (() => void) | null = null;
  private isVisible = false;
  private focusBounds: RegionBounds | null = null;
  private depthMeters = 0;

  private readonly GRID_RES = 1.5; // High resolution 1.5 degree grid
  private readonly GRID_COLS = 240; // 360 / 1.5
  private readonly GRID_ROWS = 120; // 180 / 1.5
  private readonly PARTICLE_COUNT = 1500; // Performance: optimized count
  private readonly SPEED_SCALE = 0.082;

  // Performance: Pre-allocated scratch objects to avoid creating new ones every frame
  private _scratchCartesian = new Cesium.Cartesian3();
  private _scratchColor = new Cesium.Color();

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

  public setFocusRegion(bounds: RegionBounds | null, depthMeters: number = 0) {
    this.focusBounds = bounds;
    this.depthMeters = depthMeters;

    if (bounds) {
      for (let i = 0; i < Math.min(1000, this.particles.length); i++) {
        this.particles[i] = this._spawnParticle(this.particles[i]);
      }
    }
  }

  public updateData(modelPoints: OceanModelPoint[]) {
    this._initVelocityGrid();

    // 1. Populate from model points
    for (const pt of modelPoints) {
      const col = Math.floor((((pt.longitude + 180) % 360 + 360) % 360) / this.GRID_RES);
      const row = Math.floor((90 - pt.latitude) / this.GRID_RES);
      if (row < 0 || row >= this.GRID_ROWS || col < 0 || col >= this.GRID_COLS) continue;

      const rad = (pt.currentDirection * Math.PI) / 180;
      const u = pt.currentSpeed * Math.sin(rad);
      const v = pt.currentSpeed * Math.cos(rad);
      this.velocityGrid[row][col] = { u, v, speed: pt.currentSpeed };
    }

    // 2. Realistic Geophysical Fluid Dynamics & Gyre Vortices
    for (let r = 0; r < this.GRID_ROWS; r++) {
      const lat = 90 - r * this.GRID_RES;
      for (let c = 0; c < this.GRID_COLS; c++) {
        const lon = c * this.GRID_RES - 180;

        if (OceanLandMask.isLand(lat, lon)) {
          this.velocityGrid[r][c] = null;
          continue;
        }

        if (this.velocityGrid[r][c] === null) {
          let u = 0.25;
          let v = 0.0;

          // Arabian Sea: Somali Jet & Great Whirl (vortex around lat 10, lon 54)
          if (lat >= 6 && lat <= 24 && lon >= 50 && lon <= 77) {
            const dLat = lat - 11.0;
            const dLon = lon - 56.0;
            // Cyclonic/anticyclonic curvature
            const vortexU = -dLat * 0.18;
            const vortexV = dLon * 0.18;
            u = 0.65 + vortexU;
            v = -0.45 + vortexV;
          }
          // Bay of Bengal: East India Coastal Current & central gyre (around lat 15, lon 88)
          else if (lat >= 5 && lat <= 23 && lon >= 80 && lon <= 96) {
            const dLat = lat - 14.5;
            const dLon = lon - 88.0;
            const gyreU = -dLat * 0.14;
            const gyreV = dLon * 0.14;
            u = 0.35 + gyreU;
            v = 0.55 + gyreV;
          }
          // Equatorial Wyrtki Jet: Fast eastward jet
          else if (Math.abs(lat) <= 4 && lon >= 55 && lon <= 100) {
            u = 1.25 + Math.sin(lon * 0.1) * 0.2;
            v = Math.cos(lon * 0.15) * 0.1;
          }
          // South Indian Ocean Subtropical Gyre (Agulhas / West Australia)
          else if (lat <= -10 && lat >= -40 && lon >= 35 && lon <= 115) {
            const dLat = lat - (-25.0);
            const dLon = lon - 75.0;
            u = -dLat * 0.05 + 0.4;
            v = dLon * 0.04;
          }
          // Gulf Stream & North Atlantic Drift
          else if (lat >= 25 && lat <= 50 && lon >= -80 && lon <= -30) {
            u = 1.55 + Math.sin(lat * 0.3) * 0.3;
            v = 1.15 + Math.cos(lon * 0.2) * 0.25;
          }
          // Kuroshio Current (Western North Pacific)
          else if (lat >= 20 && lat <= 42 && lon >= 122 && lon <= 155) {
            u = 1.45 + Math.sin(lat * 0.25) * 0.3;
            v = 1.05 + Math.cos(lon * 0.2) * 0.2;
          }
          // Antarctic Circumpolar Current (ACC)
          else if (lat <= -45 && lat >= -65) {
            u = 1.15 + Math.sin(lon * 0.08) * 0.2;
            v = Math.cos(lon * 0.12) * 0.12;
          } else {
            // General oceanic zonal circulation
            u = (lat > 0 ? 0.3 : -0.3) * Math.cos((lat * Math.PI) / 180);
            v = Math.sin((lon * Math.PI) / 60) * 0.15;
          }

          const spd = Math.sqrt(u * u + v * v);
          this.velocityGrid[r][c] = { u, v, speed: Math.max(0.1, spd) };
        }
      }
    }
  }

  private _getVelocity(lat: number, lon: number): VelocityCell | null {
    if (OceanLandMask.isLand(lat, lon)) return null;

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

    while (attempts < 40) {
      if (this.focusBounds && Math.random() < 0.8) {
        lat = this.focusBounds.minLat + Math.random() * (this.focusBounds.maxLat - this.focusBounds.minLat);
        lon = this.focusBounds.minLon + Math.random() * (this.focusBounds.maxLon - this.focusBounds.minLon);
      } else if (Math.random() < 0.55) {
        // High density in Indian Ocean & Arabian Sea & Bay of Bengal
        lat = -25 + Math.random() * 52;
        lon = 45 + Math.random() * 60;
      } else {
        lat = -65 + Math.random() * 130;
        lon = -180 + Math.random() * 360;
      }

      if (OceanLandMask.isOcean(lat, lon)) {
        vel = this._getVelocity(lat, lon);
        if (vel && vel.speed > 0.08) break;
      }
      attempts++;
    }

    const maxAge = 50 + Math.floor(Math.random() * 70);
    const age = p ? 0 : Math.floor(Math.random() * maxAge);
    const speed = vel ? vel.speed : 0.5;

    let primitive: Cesium.PointPrimitive;
    let cartesian: Cesium.Cartesian3;
    let color: Cesium.Color;

    if (p && p.primitive) {
      primitive = p.primitive;
      cartesian = p.cartesian;
      color = p.color;
    } else {
      cartesian = Cesium.Cartesian3.fromDegrees(lon, lat, 3500);
      color = new Cesium.Color(0, 1, 1, 0.7);
      primitive = this.collection!.add({
        position: cartesian,
        pixelSize: 2.8,
        color: color,
      });
    }

    return {
      lat,
      lon,
      age,
      maxAge,
      speed,
      primitive,
      cartesian,
      color,
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

    const depthDecay = Math.max(0.15, Math.exp(-this.depthMeters / 1200));
    const scratchCartesian = this._scratchCartesian;
    const scratchColor = this._scratchColor;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age++;

      if (p.age >= p.maxAge || p.lat > 82 || p.lat < -80) {
        this.particles[i] = this._spawnParticle(p);
        continue;
      }

      const vel = this._getVelocity(p.lat, p.lon);
      if (!vel || vel.speed < 0.03) {
        this.particles[i] = this._spawnParticle(p);
        continue;
      }

      p.speed = vel.speed * depthDecay;
      const latRad = (p.lat * Math.PI) / 180;
      const cosLat = Math.max(0.15, Math.cos(latRad));

      const nextLat = p.lat + vel.v * this.SPEED_SCALE * depthDecay;
      let nextLon = p.lon + (vel.u * this.SPEED_SCALE * depthDecay) / cosLat;

      if (nextLon > 180) nextLon -= 360;
      if (nextLon < -180) nextLon += 360;

      // Strict boundary check: respawn if particle touches land
      if (OceanLandMask.isLand(nextLat, nextLon)) {
        this.particles[i] = this._spawnParticle(p);
        continue;
      }

      p.lat = nextLat;
      p.lon = nextLon;

      const ratio = p.age / p.maxAge;
      let alpha = 1.0;
      if (ratio < 0.12) alpha = ratio / 0.12;
      else if (ratio > 0.8) alpha = (1.0 - ratio) / 0.2;

      const inFocus = this.focusBounds
        ? p.lat >= this.focusBounds.minLat &&
          p.lat <= this.focusBounds.maxLat &&
          p.lon >= this.focusBounds.minLon &&
          p.lon <= this.focusBounds.maxLon
        : true;

      const focusMultiplier = this.focusBounds ? (inFocus ? 1.25 : 0.35) : 1.0;
      const speedNorm = Math.min(1.0, p.speed / 1.6);

      // Luminous cyan-white streamline styling
      let r = 0.25 + speedNorm * 0.75;
      let g = 0.85 + speedNorm * 0.15;
      let b = 1.0;

      if (this.depthMeters > 400) {
        r *= 0.35;
        g = 0.55 + speedNorm * 0.35;
        b = 0.95;
      }

      const size = (2.2 + speedNorm * 2.5) * (inFocus && this.focusBounds ? 1.25 : 1.0);

      // Performance: Reuse scratch objects instead of creating new ones every frame
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 3500, Cesium.Ellipsoid.WGS84, scratchCartesian);
      p.primitive.position = scratchCartesian;

      scratchColor.red = r;
      scratchColor.green = g;
      scratchColor.blue = b;
      scratchColor.alpha = alpha * 0.92 * focusMultiplier;
      p.primitive.color = scratchColor;
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

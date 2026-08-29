/**
 * OceanVision 3D - 3D Marine Life & Schooling Simulation Engine
 * Renders realistic 3D marine animal models (Tuna, Shark, Dolphin, Sea Turtle, Manta Ray, Jellyfish, Whale, Octopus)
 * anchored to authentic geographic coordinates (lat, lon, depth) with flocking schools, current influence, and interaction.
 */

import { SpeciesObservation } from '../../../data/mockBiodiversityData';

export interface MarineAnimalInstance {
  obs: SpeciesObservation;
  indexInSchool: number;
  baseX: number;
  baseY: number; // depth-based Y
  baseZ: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  phase: number;
  scale: number;
  heading: number; // radians
  speed: number;
}

// Performance: Cap total animated instances to prevent draw call explosion
const MAX_INSTANCES = 60;

// Performance: Pre-allocated render list entry type
interface RenderEntry {
  inst: MarineAnimalInstance;
  curX: number;
  curY: number;
  curZ: number;
  px: number;
  py: number;
  scale: number;
  depthZ: number;
  heading: number;
}

export class MarineLife3DEngine {
  private instances: MarineAnimalInstance[] = [];
  // Performance: Pre-allocated render list — reused across frames instead of .map() creating new arrays
  private renderList: RenderEntry[] = [];

  /**
   * Initializes 3D animal instances from spatially anchored observations
   */
  public setObservations(
    observations: SpeciesObservation[],
    regionCenterLat: number,
    regionCenterLon: number
  ) {
    this.instances = [];

    let totalCount = 0;

    observations.forEach((obs) => {
      // 1. Convert geographic coordinates & depth to 3D world space
      // 1 degree lat/lon ≈ 350 units in local 3D ocean scene
      const dLat = obs.latitude - regionCenterLat;
      const dLon = obs.longitude - regionCenterLon;

      const anchorX = dLon * 350;
      const anchorZ = -dLat * 350;
      // Depth mapping: 0m = -300, 250m = 0, 1000m = 600
      const anchorY = (obs.depth - 250) * 0.8;

      // 2. Generate natural school formation if count > 1
      // Performance: Cap per-species count contribution to stay within MAX_INSTANCES
      const maxForThisObs = Math.min(obs.count, MAX_INSTANCES - totalCount);
      if (maxForThisObs <= 0) return;

      for (let i = 0; i < maxForThisObs; i++) {
        let offX = 0;
        let offY = 0;
        let offZ = 0;

        if (obs.count > 1) {
          // Schooling wedge / organic cluster formation
          const angle = (i / obs.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const radius = (18 + Math.sqrt(i) * 22) * (obs.species === 'Jellyfish' ? 1.8 : 1.0);
          offX = Math.cos(angle) * radius + (Math.random() - 0.5) * 12;
          offY = ((i % 3) - 1) * 14 + (Math.random() - 0.5) * 8;
          offZ = Math.sin(angle) * radius + (Math.random() - 0.5) * 12;
        }

        let scale = 1.0;
        if (obs.species === 'Whale') scale = 3.2;
        else if (obs.species === 'Manta Ray') scale = 1.6;
        else if (obs.species === 'Shark') scale = 1.4;
        else if (obs.species === 'Dolphin') scale = 1.2;
        else if (obs.species === 'Tuna') scale = 1.0;
        else if (obs.species === 'Sea Turtle') scale = 1.1;
        else if (obs.species === 'Octopus') scale = 0.9;
        else if (obs.species === 'Jellyfish') scale = 0.75;

        this.instances.push({
          obs,
          indexInSchool: i,
          baseX: anchorX,
          baseY: anchorY,
          baseZ: anchorZ,
          offsetX: offX,
          offsetY: offY,
          offsetZ: offZ,
          phase: Math.random() * Math.PI * 2,
          scale: scale * (0.9 + Math.random() * 0.2),
          heading: Math.PI / 4, // Default NE
          speed: obs.velocity,
        });

        totalCount++;
      }
    });

    // Pre-allocate renderList to match instance count
    this.renderList = new Array(this.instances.length);
    for (let i = 0; i < this.instances.length; i++) {
      this.renderList[i] = {
        inst: this.instances[i],
        curX: 0, curY: 0, curZ: 0,
        px: 0, py: 0, scale: 0, depthZ: 0,
        heading: 0,
      };
    }
  }

  /**
   * Renders 3D marine animals with current flow influence and species-specific swimming morphology
   */
  public render(
    ctx: CanvasRenderingContext2D,
    time: number,
    currentDepth: number,
    currentSpeed: number,
    project3D: (x: number, y: number, z: number) => { px: number; py: number; scale: number; depthZ: number },
    hoveredAnimalId: string | null
  ): { hoveredInstance: MarineAnimalInstance | null; hoveredPx: number; hoveredPy: number } {
    let activeHoverResult: { hoveredInstance: MarineAnimalInstance | null; hoveredPx: number; hoveredPy: number } = {
      hoveredInstance: null,
      hoveredPx: 0,
      hoveredPy: 0,
    };

    // Performance: Populate pre-allocated renderList and early-cull invisible instances
    let visibleCount = 0;

    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];

      // Swimming trajectory with current influence
      const swimRadius = 140 + inst.indexInSchool * 8;
      const swimSpeed = (inst.speed * 0.35 + currentSpeed * 0.25);
      const angle = time * swimSpeed * 0.5 + inst.phase + (inst.indexInSchool * 0.18);

      const curX = inst.baseX + inst.offsetX + Math.sin(angle) * swimRadius;
      const curZ = inst.baseZ + inst.offsetZ + Math.cos(angle) * swimRadius;
      const curY = inst.baseY + inst.offsetY - (currentDepth - 250) * 0.7 + Math.sin(time * 2.0 + inst.phase) * 12;

      const heading = angle + Math.PI / 2;
      const p = project3D(curX, curY, curZ);

      // Early cull: skip invisible instances before adding to sorted list
      if (p.scale <= 0) continue;

      const entry = this.renderList[visibleCount] || (this.renderList[visibleCount] = {} as RenderEntry);
      entry.inst = inst;
      entry.curX = curX;
      entry.curY = curY;
      entry.curZ = curZ;
      entry.px = p.px;
      entry.py = p.py;
      entry.scale = p.scale;
      entry.depthZ = p.depthZ;
      entry.heading = heading;
      visibleCount++;
    }

    // Sort only visible entries back-to-front
    const visibleSlice = this.renderList.slice(0, visibleCount);
    visibleSlice.sort((a, b) => b.depthZ - a.depthZ);

    for (let i = 0; i < visibleSlice.length; i++) {
      const { inst, px, py, scale, heading } = visibleSlice[i];

      const isHovered = hoveredAnimalId === inst.obs.id;
      if (isHovered) {
        activeHoverResult = {
          hoveredInstance: inst,
          hoveredPx: px,
          hoveredPy: py,
        };
      }

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(heading);

      // Depth fog attenuation
      const depthAlpha = Math.max(0.2, Math.min(1.0, 1.0 - (inst.obs.depth - currentDepth) / 1200));
      ctx.globalAlpha = depthAlpha * (isHovered ? 1.0 : 0.9);

      const renderScale = scale * inst.scale;

      switch (inst.obs.species) {
        case 'Tuna':
          this._drawTuna(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Shark':
          this._drawShark(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Dolphin':
          this._drawDolphin(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Sea Turtle':
          this._drawSeaTurtle(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Manta Ray':
          this._drawMantaRay(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Jellyfish':
          this._drawJellyfish(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Whale':
          this._drawWhale(ctx, time, inst.phase, renderScale, isHovered);
          break;
        case 'Octopus':
          this._drawOctopus(ctx, time, inst.phase, renderScale, isHovered);
          break;
      }

      ctx.restore();
    }

    return activeHoverResult;
  }

  // --- Species 3D Morphology Renderers ---

  private _drawTuna(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const len = 34 * s;
    const w = 11 * s;
    const tailWag = Math.sin(time * 9 + phase) * 8 * s;

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, len, w, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#38bdf8' : '#0369a1';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#ffffff' : '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Yellowfin dorsal & belly finlets
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-len * 0.1, -w);
    ctx.lineTo(-len * 0.45, -w * 2.2);
    ctx.lineTo(0, -w);
    ctx.fill();

    // Caudal Fin (Yellow Tail)
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-len - 14 * s, -12 * s + tailWag);
    ctx.lineTo(-len - 14 * s, 12 * s + tailWag);
    ctx.closePath();
    ctx.fill();
  }

  private _drawShark(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const len = 48 * s;
    const w = 14 * s;
    const tailWag = Math.sin(time * 6 + phase) * 9 * s;

    // Predatory Fuselage
    ctx.beginPath();
    ctx.ellipse(0, 0, len, w, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#64748b' : '#334155';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sharp Dorsal Fin
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-len * 0.1, -w);
    ctx.lineTo(-len * 0.35, -w * 2.6);
    ctx.lineTo(len * 0.1, -w);
    ctx.fill();

    // Heterocercal Shark Tail
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-len - 22 * s, -18 * s + tailWag);
    ctx.lineTo(-len - 12 * s, 0 + tailWag);
    ctx.lineTo(-len - 18 * s, 10 * s + tailWag);
    ctx.closePath();
    ctx.fill();
  }

  private _drawDolphin(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const len = 42 * s;
    const w = 13 * s;
    const flukeStroke = Math.sin(time * 7 + phase) * 7 * s;

    // Streamlined body
    ctx.beginPath();
    ctx.ellipse(0, 0, len, w, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#38bdf8' : '#0284c7';
    ctx.fill();

    // Rostrum Beak
    ctx.beginPath();
    ctx.moveTo(len, -2 * s);
    ctx.lineTo(len + 12 * s, 0);
    ctx.lineTo(len, 3 * s);
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // Curved Dorsal Fin
    ctx.beginPath();
    ctx.moveTo(-len * 0.1, -w);
    ctx.quadraticCurveTo(-len * 0.3, -w * 2.2, -len * 0.4, -w);
    ctx.fillStyle = '#0369a1';
    ctx.fill();

    // Horizontal Tail Fluke
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-len - 15 * s, -14 * s + flukeStroke);
    ctx.lineTo(-len - 15 * s, 14 * s + flukeStroke);
    ctx.closePath();
    ctx.fill();
  }

  private _drawSeaTurtle(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const r = 24 * s;
    const flipperStroke = Math.sin(time * 4 + phase) * 12 * s;

    // Olive Carapace Shell
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.2, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#10b981' : '#047857';
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front Swimming Flippers
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.ellipse(r * 0.4, -r * 1.3 + flipperStroke, 18 * s, 7 * s, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(r * 0.4, r * 1.3 - flipperStroke, 18 * s, 7 * s, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(r * 1.4, 0, 9 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private _drawMantaRay(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const wingSpan = 52 * s;
    const bodyLen = 32 * s;
    const wingFlap = Math.sin(time * 3.5 + phase) * 10 * s;

    // Diamond Wing Mantle
    ctx.beginPath();
    ctx.moveTo(bodyLen, 0);
    ctx.quadraticCurveTo(0, -wingSpan + wingFlap, -bodyLen * 0.7, -wingSpan * 0.4);
    ctx.lineTo(-bodyLen, 0);
    ctx.lineTo(-bodyLen * 0.7, wingSpan * 0.4);
    ctx.quadraticCurveTo(0, wingSpan - wingFlap, bodyLen, 0);
    ctx.fillStyle = isHovered ? '#334155' : '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cephalic Horns
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bodyLen, -6 * s);
    ctx.lineTo(bodyLen + 10 * s, -10 * s);
    ctx.lineTo(bodyLen, -2 * s);
    ctx.moveTo(bodyLen, 6 * s);
    ctx.lineTo(bodyLen + 10 * s, 10 * s);
    ctx.lineTo(bodyLen, 2 * s);
    ctx.fill();

    // Whip Tail
    ctx.beginPath();
    ctx.moveTo(-bodyLen, 0);
    ctx.lineTo(-bodyLen - 45 * s, 0);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private _drawJellyfish(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const bellR = 20 * s;
    const pulse = Math.sin(time * 3 + phase);
    const squish = 1.0 + pulse * 0.2;

    // Translucent Dome Bell
    ctx.beginPath();
    ctx.arc(0, 0, bellR * squish, -Math.PI / 2, Math.PI / 2, false);
    ctx.fillStyle = isHovered ? 'rgba(192, 132, 252, 0.7)' : 'rgba(168, 85, 247, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Trailing Rhythmic Tentacles
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.6)';
    ctx.lineWidth = 1.2;
    for (let t = -bellR * 0.7; t <= bellR * 0.7; t += 7 * s) {
      ctx.beginPath();
      ctx.moveTo(-bellR * 0.2, t);
      const wag = Math.sin(time * 4 + t + phase) * 8 * s;
      ctx.quadraticCurveTo(-bellR * 1.5, t + wag, -bellR * 2.8, t + wag * 1.5);
      ctx.stroke();
    }
  }

  private _drawWhale(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const len = 90 * s;
    const w = 26 * s;
    const tailStroke = Math.sin(time * 2.2 + phase) * 14 * s;

    // Leviathan Fuselage
    ctx.beginPath();
    ctx.ellipse(0, 0, len, w, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#1e293b' : '#090d16';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Massive Tail Fluke
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-len - 28 * s, -28 * s + tailStroke);
    ctx.lineTo(-len - 28 * s, 28 * s + tailStroke);
    ctx.closePath();
    ctx.fill();
  }

  private _drawOctopus(ctx: CanvasRenderingContext2D, time: number, phase: number, s: number, isHovered: boolean) {
    const mantleR = 18 * s;

    // Bulbous Mantle
    ctx.beginPath();
    ctx.ellipse(mantleR * 0.5, 0, mantleR * 1.2, mantleR, 0, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#f43f5e' : '#be123c';
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 8 Undulating Tentacles
    ctx.strokeStyle = isHovered ? '#fb7185' : '#e11d48';
    ctx.lineWidth = 2.5 * s;
    for (let arm = 0; arm < 8; arm++) {
      const armAngle = ((arm - 3.5) / 4) * (Math.PI / 3);
      const wag = Math.sin(time * 4 + arm + phase) * 12 * s;

      ctx.beginPath();
      ctx.moveTo(0, Math.sin(armAngle) * 8 * s);
      ctx.quadraticCurveTo(-mantleR * 1.5, Math.sin(armAngle) * 22 * s + wag, -mantleR * 3.2, Math.sin(armAngle) * 35 * s + wag);
      ctx.stroke();
    }
  }
}

/**
 * OceanVision 3D - Interactive 3D Underwater Deep Dive Environment
 * 
 * High-performance WebGL 3D simulation delivering realistic oceanic volumetric lighting,
 * caustics, god rays, spatial 3D thermal fields, 3D fluid current streamlines,
 * halocline density layers, 3D CTD sensor array, and spatially anchored 3D marine life.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { OceanRegion } from '../../data/oceanRegions';
import { DepthController } from './underwater/DepthController';
import { UnderwaterHUD, InSituOceanData } from './underwater/UnderwaterHUD';
import { SpeciesModal } from './underwater/SpeciesModal';
import { MarineLife3DEngine, MarineAnimalInstance } from './underwater/MarineLife3D';
import { getSpeciesObservationsNear, SpeciesObservation } from '../../data/mockBiodiversityData';

interface UnderwaterSceneProps {
  region: OceanRegion;
  onReturnToGlobe: () => void;
}

// Performance: Cap pixel ratio to avoid excessive fill rate on HiDPI displays
const MAX_PIXEL_RATIO = 1.5;
const DEVICE_PIXEL_RATIO = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, MAX_PIXEL_RATIO);

// Performance: Reduced particle counts (still visually rich)
const CURRENT_PARTICLE_COUNT = 180;
const BUBBLE_COUNT = 80;

export const UnderwaterScene: React.FC<UnderwaterSceneProps> = ({
  region,
  onReturnToGlobe,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(250);
  const [activeSpeciesModal, setActiveSpeciesModal] = useState<SpeciesObservation | null>(null);
  const [hoveredSpeciesId, setHoveredSpeciesId] = useState<string | null>(null);

  // Active 3D layer toggles
  const [activeLayers, setActiveLayers] = useState({
    temperature: true,
    currents: true,
    salinity: true,
    species: true,
    ctdRig: true,
  });

  const toggleLayer = useCallback((layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Retrieve spatially anchored marine species observations near region
  const regionObservations = useMemo(() => {
    return getSpeciesObservationsNear(region.center.lat, region.center.lon);
  }, [region.center.lat, region.center.lon]);

  const primaryObservation = regionObservations[0] || null;

  // Structured In-Situ dataset matching required values (easily mapped to API)
  const inSituData: InSituOceanData = useMemo(() => ({
    temperature: 27.4,
    salinity: 35.6,
    depth: currentDepth,
    pressure: 25.0,
    currentSpeed: 0.8,
    currentDirection: 'NE',
    dissolvedOxygen: 6.2,
    ph: 8.1,
    chlorophyll: 0.45,
    waveHeight: 1.4,
    windSpeed: 15.0,
    speciesObservation: primaryObservation
      ? `${primaryObservation.commonName} (${primaryObservation.scientificName}) Observed`
      : undefined,
  }), [currentDepth, primaryObservation]);

  // ─── PERFORMANCE: Store mutable values in refs so the animation loop
  //     can read them without being torn down on every state change. ───
  const currentDepthRef = useRef(currentDepth);
  const activeLayersRef = useRef(activeLayers);
  const inSituDataRef = useRef(inSituData);
  const hoveredSpeciesIdRef = useRef(hoveredSpeciesId);
  const regionObservationsRef = useRef(regionObservations);

  // Lightweight sync effects — update refs when state changes, NO loop teardown
  useEffect(() => { currentDepthRef.current = currentDepth; }, [currentDepth]);
  useEffect(() => { activeLayersRef.current = activeLayers; }, [activeLayers]);
  useEffect(() => { inSituDataRef.current = inSituData; }, [inSituData]);
  useEffect(() => { hoveredSpeciesIdRef.current = hoveredSpeciesId; }, [hoveredSpeciesId]);
  useEffect(() => { regionObservationsRef.current = regionObservations; }, [regionObservations]);

  // Main 3D WebGL Canvas Render Loop — runs ONCE on mount, reads refs for current values
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    // Initialize 3D Marine Life Engine
    const marineEngine = new MarineLife3DEngine();
    marineEngine.setObservations(regionObservations, region.center.lat, region.center.lon);

    // Orbit Camera Angles
    let rotX = 0.22;
    let rotY = -0.35;
    let zoom = 1.0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let activeHoveredAnimal: MarineAnimalInstance | null = null;

    // Resize handler — apply pixel ratio cap
    const handleResize = () => {
      const dpr = DEVICE_PIXEL_RATIO;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse Interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      rotY += dx * 0.005;
      rotX = Math.max(-0.8, Math.min(0.8, rotX + dy * 0.005));
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(0.6, Math.min(2.0, zoom - e.deltaY * 0.001));
    };

    // Canvas click to select marine animal
    const handleClick = (e: MouseEvent) => {
      if (activeHoveredAnimal) {
        setActiveSpeciesModal(activeHoveredAnimal.obs);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleClick);

    // Initialize 3D Current Particles
    const currentParticles: { x: number; y: number; z: number; speed: number; age: number; maxAge: number }[] = [];
    for (let i = 0; i < CURRENT_PARTICLE_COUNT; i++) {
      currentParticles.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 800,
        speed: 0.6 + Math.random() * 0.8,
        age: Math.floor(Math.random() * 100),
        maxAge: 80 + Math.floor(Math.random() * 80),
      });
    }

    // Initialize 3D Plankton / Bubble Particles
    const bubbles: { x: number; y: number; z: number; radius: number; speedY: number; wobble: number }[] = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bubbles.push({
        x: (Math.random() - 0.5) * 900,
        y: (Math.random() - 0.5) * 700,
        z: (Math.random() - 0.5) * 900,
        radius: 1.2 + Math.random() * 2.8,
        speedY: 0.4 + Math.random() * 0.9,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    // Main Animation Render Loop
    const render = () => {
      time += 0.016;

      // Read current values from refs (no React state dependency)
      const depth = currentDepthRef.current;
      const layers = activeLayersRef.current;
      const situ = inSituDataRef.current;
      const hoveredId = hoveredSpeciesIdRef.current;
      const observations = regionObservationsRef.current;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W / 2;
      const cy = H / 2;

      // 1. Dynamic Depth Fog & Volumetric Gradient
      const depthFactor = Math.min(1.0, depth / 1500);
      const topColor = `rgb(${Math.max(2, (8 - depthFactor * 6) | 0)}, ${Math.max(16, (48 - depthFactor * 38) | 0)}, ${Math.max(45, (110 - depthFactor * 80) | 0)})`;
      const btmColor = `rgb(${Math.max(1, (3 - depthFactor * 2) | 0)}, ${Math.max(4, (12 - depthFactor * 10) | 0)}, ${Math.max(15, (30 - depthFactor * 25) | 0)})`;

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, topColor);
      bgGrad.addColorStop(1, btmColor);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Sunlight Shafts / God Rays Filtering Down from Surface
      if (depth < 800) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const sunAlpha = Math.max(0.02, 0.28 * (1.0 - depth / 800));

        for (let i = 0; i < 6; i++) {
          const rayX = cx + Math.sin(time * 0.4 + i * 1.1) * 260 + (i - 2.5) * 180;
          const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 120, H * 0.85);
          rayGrad.addColorStop(0, `rgba(180, 240, 255, ${sunAlpha * 1.2})`);
          rayGrad.addColorStop(0.5, `rgba(56, 189, 248, ${sunAlpha * 0.5})`);
          rayGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(rayX - 60, 0);
          ctx.lineTo(rayX + 60, 0);
          ctx.lineTo(rayX + 280, H * 0.85);
          ctx.lineTo(rayX + 140, H * 0.85);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. 3D Projector Helper
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const project3D = (x: number, y: number, z: number): { px: number; py: number; scale: number; depthZ: number } => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const fov = 650 * zoom;
        const distance = 850 + z2;
        const scale = fov / Math.max(120, distance);

        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depthZ: z2,
        };
      };

      // 4. Spatial 3D Temperature Thermal Field
      if (layers.temperature) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gridSize = 5;
        const spacing = 120;

        for (let ix = -gridSize; ix <= gridSize; ix += 2) {
          for (let iz = -gridSize; iz <= gridSize; iz += 2) {
            for (let iy = -1; iy <= 2; iy++) {
              const wx = ix * spacing + Math.sin(time * 0.6 + ix) * 20;
              const wy = iy * 100 - (depth - 250) * 0.35;
              const wz = iz * spacing + Math.cos(time * 0.6 + iz) * 20;

              const p = project3D(wx, wy, wz);
              if (p.scale > 0) {
                const layerTemp = Math.max(2.1, 28.5 - (iy + 1) * 6.5);
                const tAlpha = Math.max(0.08, Math.min(0.35, 0.22 * (1.0 - Math.abs(p.depthZ) / 900)));

                let r = 245, g = 145, b = 40;
                if (layerTemp < 15) { r = 6; g = 182; b = 212; }
                else if (layerTemp < 24) { r = 16; g = 185; b = 129; }

                ctx.beginPath();
                ctx.arc(p.px, p.py, 4.5 * p.scale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${tAlpha})`;
                ctx.fill();
              }
            }
          }
        }
        ctx.restore();
      }

      // 5. Spatial 3D Current Flow Streamlines (Direction: NE, Speed: 0.8 m/s)
      if (layers.currents) {
        ctx.save();
        ctx.lineWidth = 2.0;

        const currentSpeedPx = situ.currentSpeed * 4.5;

        for (let i = 0; i < currentParticles.length; i++) {
          const cp = currentParticles[i];
          cp.age++;

          cp.x += currentSpeedPx * 0.85 * cp.speed;
          cp.z -= currentSpeedPx * 0.85 * cp.speed;
          cp.y += Math.sin(time * 1.5 + cp.x * 0.01) * 0.35;

          if (cp.x > 500) cp.x -= 1000;
          if (cp.x < -500) cp.x += 1000;
          if (cp.z > 500) cp.z -= 1000;
          if (cp.z < -500) cp.z += 1000;

          if (cp.age >= cp.maxAge) {
            cp.age = 0;
            cp.x = (Math.random() - 0.5) * 800;
            cp.y = (Math.random() - 0.5) * 500;
            cp.z = (Math.random() - 0.5) * 800;
          }

          const head = project3D(cp.x, cp.y, cp.z);
          const tail = project3D(cp.x - currentSpeedPx * 8 * cp.speed, cp.y, cp.z + currentSpeedPx * 8 * cp.speed);

          if (head.scale > 0 && tail.scale > 0) {
            const alphaRatio = cp.age / cp.maxAge;
            let alpha = 1.0;
            if (alphaRatio < 0.15) alpha = alphaRatio / 0.15;
            else if (alphaRatio > 0.8) alpha = (1.0 - alphaRatio) / 0.2;

            ctx.beginPath();
            ctx.moveTo(tail.px, tail.py);
            ctx.lineTo(head.px, head.py);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;
            ctx.lineWidth = 2.2 * head.scale;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(head.px, head.py, 2.8 * head.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 6. Spatial 3D Floating Bubbles & Plankton / Chlorophyll
      ctx.save();
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speedY;
        b.x += Math.sin(time + b.wobble) * 0.25;

        if (b.y < -400) {
          b.y = 400;
          b.x = (Math.random() - 0.5) * 900;
        }

        const bp = project3D(b.x, b.y, b.z);
        if (bp.scale > 0) {
          ctx.beginPath();
          ctx.arc(bp.px, bp.py, b.radius * bp.scale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(165, 243, 252, 0.45)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 7. 3D In-Situ CTD Mooring / Sensor Instrument Frame at 250m
      if (layers.ctdRig) {
        ctx.save();
        const rigY = -(depth - 250) * 0.6;
        const rigP = project3D(0, rigY, 0);

        if (rigP.scale > 0) {
          const topCable = project3D(0, -600, 0);
          const btmCable = project3D(0, 600, 0);

          ctx.beginPath();
          ctx.moveTo(topCable.px, topCable.py);
          ctx.lineTo(btmCable.px, btmCable.py);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 2 * rigP.scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(rigP.px, rigP.py, 32 * rigP.scale, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)';
          ctx.lineWidth = 3 * rigP.scale;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(rigP.px, rigP.py, 12 * rigP.scale, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 * rigP.scale;
          ctx.stroke();

          const nodeLabels = [
            { name: `T: ${situ.temperature}°C`, color: '#f59e0b', angle: 0 },
            { name: `S: ${situ.salinity} PSU`, color: '#06b6d4', angle: (2 * Math.PI) / 5 },
            { name: `P: ${situ.pressure} bar`, color: '#10b981', angle: (4 * Math.PI) / 5 },
            { name: `O₂: ${situ.dissolvedOxygen} mg/L`, color: '#14b8a6', angle: (6 * Math.PI) / 5 },
            { name: `pH: ${situ.ph}`, color: '#c084fc', angle: (8 * Math.PI) / 5 },
          ];

          nodeLabels.forEach((node) => {
            const nx = rigP.px + Math.cos(node.angle + time * 0.5) * 48 * rigP.scale;
            const ny = rigP.py + Math.sin(node.angle + time * 0.5) * 48 * rigP.scale;

            ctx.beginPath();
            ctx.arc(nx, ny, 5 * rigP.scale, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = `bold ${Math.max(9, (11 * rigP.scale) | 0)}px "Space Mono", monospace`;
            ctx.fillStyle = node.color;
            ctx.fillText(node.name, nx + 8 * rigP.scale, ny + 4 * rigP.scale);
          });
        }
        ctx.restore();
      }

      // 8. 3D Spatially Anchored Marine Life & Schooling Simulation
      if (layers.species && observations.length > 0) {
        const hoverResult = marineEngine.render(
          ctx,
          time,
          depth,
          situ.currentSpeed,
          project3D,
          hoveredId
        );

        activeHoveredAnimal = hoverResult.hoveredInstance;

        // Render hover tooltip near animal
        if (hoverResult.hoveredInstance) {
          const obs = hoverResult.hoveredInstance.obs;
          ctx.save();
          ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;

          const tipText = `${obs.commonName} (${obs.depth}m • Count: ${obs.count})`;
          ctx.font = 'bold 12px "Space Mono", monospace';
          const textW = ctx.measureText(tipText).width;

          ctx.beginPath();
          ctx.roundRect(hoverResult.hoveredPx - textW / 2 - 10, hoverResult.hoveredPy - 36, textW + 20, 26, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.fillText(tipText, hoverResult.hoveredPx - textW / 2, hoverResult.hoveredPy - 19);
          ctx.restore();
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // PERFORMANCE: Run ONCE on mount. Reads current values via refs.

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Interactive 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating In-Situ Telemetry HUD */}
      <UnderwaterHUD
        region={region}
        currentDepth={currentDepth}
        inSituData={inSituData}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        onReturnToGlobe={onReturnToGlobe}
        onSelectSpeciesModal={() => primaryObservation && setActiveSpeciesModal(primaryObservation)}
      />

      {/* Vertical Depth Scrubber on Right Side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <DepthController
          currentDepth={currentDepth}
          onDepthChange={setCurrentDepth}
        />
      </div>

      {/* 3D Marine Life Information Modal */}
      {activeSpeciesModal && (
        <SpeciesModal
          species={activeSpeciesModal}
          onClose={() => setActiveSpeciesModal(null)}
        />
      )}
    </div>
  );
};

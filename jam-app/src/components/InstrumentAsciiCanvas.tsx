'use client';
import React, { useEffect, useRef } from 'react';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface DotParticle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
  centerWeight: number;
  color: ColorRGB;
  targetColor: ColorRGB;
}

// Sample points and capture RGB colors directly from multi-colored vector drawing
function sampleColoredDotShape(
  drawShape: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  targetCount: number = 1350
): { x: number; y: number; alpha: number; radius: number; color: ColorRGB }[] {
  if (typeof document === 'undefined') return [];
  const offCanvas = document.createElement('canvas');
  const w = (offCanvas.width = 640);
  const h = (offCanvas.height = 640);
  const ctx = offCanvas.getContext('2d');
  if (!ctx) return [];

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  drawShape(ctx, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const validPoints: { x: number; y: number; alpha: number; radius: number; color: ColorRGB }[] = [];
  const step = 9.5; // Grid spacing between dots

  for (let y = 15; y < h - 15; y += step) {
    for (let x = 15; x < w - 15; x += step) {
      const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / (3 * 255);

      if (brightness > 0.12) {
        validPoints.push({
          x: x - w / 2,
          y: y - h / 2,
          alpha: Math.min(1.0, 0.6 + brightness * 0.4),
          radius: 1.8 + brightness * 0.8,
          color: { r, g, b },
        });
      }
    }
  }

  // Pad or trim cleanly
  while (validPoints.length < targetCount && validPoints.length > 0) {
    const clone = validPoints[Math.floor(Math.random() * validPoints.length)];
    validPoints.push({
      x: clone.x + (Math.random() - 0.5) * 4,
      y: clone.y + (Math.random() - 0.5) * 4,
      alpha: clone.alpha * 0.85,
      radius: clone.radius,
      color: { ...clone.color },
    });
  }

  return validPoints.slice(0, targetCount);
}

// 1. MULTI-COLORED GUITAR (Brown wood body, Ivory pickguard, Mahogany neck, Grey strings, Gold headstock)
function drawGuitar(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2 - 15, h / 2 + 10);
  ctx.rotate(-Math.PI / 4.2);

  // Lower Body Bout (Warm Brown Wood)
  ctx.fillStyle = '#D97724';
  ctx.beginPath();
  ctx.ellipse(-25, 90, 90, 115, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper Body Bout (Warm Brown Wood)
  ctx.beginPath();
  ctx.ellipse(-25, 15, 70, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left Horn (Amber Wood)
  ctx.beginPath();
  ctx.moveTo(-75, 40);
  ctx.quadraticCurveTo(-110, -30, -70, -60);
  ctx.quadraticCurveTo(-45, -35, -40, -5);
  ctx.fill();

  // Right Horn (Amber Wood)
  ctx.beginPath();
  ctx.moveTo(25, 40);
  ctx.quadraticCurveTo(65, -10, 40, -50);
  ctx.quadraticCurveTo(18, -25, 0, -5);
  ctx.fill();

  // Ivory Pickguard
  ctx.fillStyle = '#F5E6CA';
  ctx.beginPath();
  ctx.ellipse(-30, 45, 42, 50, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Soundhole / Pickup Inset (Dark Ebony)
  ctx.fillStyle = '#2C1810';
  ctx.beginPath();
  ctx.arc(-25, 55, 26, 0, Math.PI * 2);
  ctx.fill();

  // Bridge (Mahogany)
  ctx.fillStyle = '#5C3A21';
  ctx.fillRect(-45, 125, 40, 14);

  // Fretboard Neck (Deep Mahogany)
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(-12, -240, 24, 245);

  // Headstock (Golden Maple)
  ctx.fillStyle = '#E69542';
  ctx.beginPath();
  ctx.moveTo(-14, -240);
  ctx.lineTo(-34, -280);
  ctx.lineTo(-40, -315);
  ctx.lineTo(-16, -325);
  ctx.lineTo(12, -300);
  ctx.lineTo(14, -240);
  ctx.closePath();
  ctx.fill();

  // Tuning Pegs (Gold/Brass)
  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 6; i++) {
    const pegY = -250 - i * 11;
    ctx.fillRect(-50, pegY, 16, 4);
  }

  // 6 Metallic Grey Strings
  ctx.strokeStyle = '#DCDCDC';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i++) {
    const sx = -9 + i * 3.6;
    ctx.beginPath();
    ctx.moveTo(sx, -290);
    ctx.lineTo(sx, 130);
    ctx.stroke();
  }

  ctx.restore();
}

// 2. MULTI-COLORED DRUM KIT (Crimson Kick Drum, Chrome Snare, Purple Toms, Gold Cymbals, Slate Hardware)
function drawDrums(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2 + 15);

  // Cymbals Stands (Chrome Slate)
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#90A4AE';
  ctx.beginPath();
  ctx.moveTo(-165, -70);
  ctx.lineTo(-165, 150);
  ctx.moveTo(145, -125);
  ctx.lineTo(145, 150);
  ctx.stroke();

  // Bass / Kick Drum (Vibrant Crimson Red)
  ctx.fillStyle = '#FF3B30';
  ctx.beginPath();
  ctx.arc(0, 50, 100, 0, Math.PI * 2);
  ctx.fill();

  // Kick Drum Rim & Port (Dark Onyx)
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.arc(0, 50, 70, 0, Math.PI * 2);
  ctx.fill();

  // Snare Drum (Chrome / Silver-Cyan)
  ctx.fillStyle = '#ECEFF1';
  ctx.beginPath();
  ctx.ellipse(-120, -5, 54, 26, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(-150, -5, 56, 24);

  // Floor Tom (Deep Cobalt Blue)
  ctx.fillStyle = '#3949AB';
  ctx.beginPath();
  ctx.ellipse(120, 40, 60, 30, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(65, 40, 110, 60);

  // Rack Toms (Neon Purple / Violet)
  ctx.fillStyle = '#9C27B0';
  ctx.beginPath();
  ctx.ellipse(-50, -75, 40, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-85, -75, 72, 34);

  ctx.fillStyle = '#BA68C8';
  ctx.beginPath();
  ctx.ellipse(50, -75, 40, 22, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(15, -75, 72, 34);

  // Hi-Hat Cymbals (Shimmering Gold)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(-165, -70, 56, 15, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Crash Cymbal (Radiant Amber Gold)
  ctx.fillStyle = '#FFC107';
  ctx.beginPath();
  ctx.ellipse(145, -125, 62, 16, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 3. MULTI-COLORED GRAND PIANO (Electric Sapphire Body, Crisp White Keys, Onyx Black Keys, Cyan Trim)
function drawPiano(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2 + 10);

  // Grand Piano Wing Body (Electric Sapphire Blue)
  ctx.fillStyle = '#2979FF';
  ctx.beginPath();
  ctx.moveTo(-200, 45);
  ctx.lineTo(-200, -65);
  ctx.quadraticCurveTo(-200, -160, -100, -175);
  ctx.quadraticCurveTo(45, -190, 120, -100);
  ctx.quadraticCurveTo(200, -15, 200, 45);
  ctx.closePath();
  ctx.fill();

  // Open Lid (Neon Cyan Accent)
  ctx.fillStyle = '#00B0FF';
  ctx.beginPath();
  ctx.moveTo(-200, -65);
  ctx.lineTo(-70, -230);
  ctx.lineTo(155, -140);
  ctx.lineTo(200, 45);
  ctx.fill();

  // Keyboard Deck (Pure Crisp White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-195, 45, 390, 50);

  // Black Keys (Deep Onyx Charcoal)
  ctx.fillStyle = '#1A1A1A';
  for (let i = 0; i < 36; i++) {
    const isBlack = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26, 27, 29, 30, 32, 33, 34].includes(i);
    if (isBlack) {
      ctx.fillRect(-190 + i * 10.5, 45, 6.5, 28);
    }
  }

  // Piano Legs (Cyan / Silver)
  ctx.fillStyle = '#82B1FF';
  ctx.fillRect(-185, 95, 14, 70);
  ctx.fillRect(170, 95, 14, 70);
  ctx.fillRect(0, -125, 10, 245);

  ctx.restore();
}

// 4. MULTI-COLORED STUDIO MICROPHONE (Vintage Gold Capsule, Neon Green Shockmount, Coral Bands, Slate Body)
function drawMicrophone(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);

  // Capsule Dome Top (Radiant Vintage Gold)
  ctx.fillStyle = '#FFB300';
  ctx.beginPath();
  ctx.arc(0, -90, 60, Math.PI, 0);
  ctx.fill();

  // Capsule Middle Cylinder (Amber Gold Mesh)
  ctx.fillStyle = '#FFC107';
  ctx.fillRect(-60, -90, 120, 75);

  // Capsule Bottom Dome (Gold)
  ctx.fillStyle = '#FFA000';
  ctx.beginPath();
  ctx.arc(0, -15, 60, 0, Math.PI);
  ctx.fill();

  // Lower Body (Dark Gunmetal Slate)
  ctx.fillStyle = '#546E7A';
  ctx.beginPath();
  ctx.moveTo(-32, 45);
  ctx.lineTo(-20, 165);
  ctx.lineTo(20, 165);
  ctx.lineTo(32, 45);
  ctx.closePath();
  ctx.fill();

  // Shockmount Ring (Neon Emerald Green)
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#00E676';
  ctx.beginPath();
  ctx.ellipse(0, -32, 105, 44, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Elastic Suspension Bands (Bright Coral Orange)
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FF6E40';
  ctx.beginPath();
  ctx.moveTo(-95, -32);
  ctx.lineTo(-28, -85);
  ctx.moveTo(95, -32);
  ctx.lineTo(28, -85);
  ctx.moveTo(-95, -32);
  ctx.lineTo(-28, 16);
  ctx.moveTo(95, -32);
  ctx.lineTo(28, 16);
  ctx.stroke();

  // Stand Base & Rod (Chrome Steel)
  ctx.fillStyle = '#90A4AE';
  ctx.fillRect(-8, 165, 16, 50);
  ctx.fillRect(-65, 215, 130, 12);

  ctx.restore();
}

export interface InstrumentTheme {
  id: string;
  name: string;
  majorColor: string;
  cardBg: string;
  textColor: string;
  shadowColor: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export const INSTRUMENT_THEMES: InstrumentTheme[] = [
  {
    id: 'GUITAR',
    name: 'ACOUSTIC / ELECTRIC GUITAR',
    majorColor: '#E69542',
    cardBg: '#E69542',
    textColor: '#1A0C00', // Deep Dark Mahogany on Amber Gold
    shadowColor: '#E69542',
    draw: drawGuitar,
  },
  {
    id: 'DRUMS',
    name: 'ACOUSTIC DRUM SET',
    majorColor: '#FF3B30',
    cardBg: '#FF3B30',
    textColor: '#FFFFFF', // Crisp White on Crimson Red
    shadowColor: '#FF3B30',
    draw: drawDrums,
  },
  {
    id: 'KEYBOARD',
    name: 'GRAND PIANO & SYNTH',
    majorColor: '#2979FF',
    cardBg: '#2979FF',
    textColor: '#FFFFFF', // Crisp White on Royal Sapphire
    shadowColor: '#2979FF',
    draw: drawPiano,
  },
  {
    id: 'MIC',
    name: 'STUDIO CONDENSER MIC',
    majorColor: '#FFB800',
    cardBg: '#FFB800',
    textColor: '#1A1400', // Deep Dark Charcoal on Studio Gold
    shadowColor: '#FFB800',
    draw: drawMicrophone,
  },
];

interface InstrumentAsciiCanvasProps {
  onThemeChange?: (theme: InstrumentTheme) => void;
}

export default function InstrumentAsciiCanvas({ onThemeChange }: InstrumentAsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<DotParticle[]>([]);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Mouse tracking inside right pane
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isInside: false });

  // Initialize dots with Guitar
  useEffect(() => {
    const initialPoints = sampleColoredDotShape(drawGuitar, 1350);
    const dots: DotParticle[] = initialPoints.map((pt) => {
      const distFromCenter = Math.hypot(pt.x, pt.y);
      const centerWeight = Math.max(0.12, 1.0 - distFromCenter / 290);

      return {
        x: pt.x + (Math.random() - 0.5) * 350,
        y: pt.y + (Math.random() - 0.5) * 350,
        targetX: pt.x,
        targetY: pt.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: pt.radius,
        alpha: 0,
        targetAlpha: pt.alpha,
        centerWeight,
        color: { ...pt.color },
        targetColor: { ...pt.color },
      };
    });
    particlesRef.current = dots;
    onThemeChange?.(INSTRUMENT_THEMES[0]);
  }, []);

  // Morph to next instrument: burst into random dots, update target colors and shapes
  const morphToShape = (index: number) => {
    currentIndexRef.current = index;
    const theme = INSTRUMENT_THEMES[index];
    if (!theme) return;

    onThemeChange?.(theme);

    const newPoints = sampleColoredDotShape(theme.draw, 1350);

    particlesRef.current.forEach((p, i) => {
      const target = newPoints[i] || {
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        alpha: 0.8,
        radius: 2.0,
        color: { r: 255, g: 255, b: 255 },
      };

      p.targetX = target.x;
      p.targetY = target.y;
      p.targetAlpha = target.alpha;
      p.radius = target.radius;
      p.targetColor = target.color;

      const distFromCenter = Math.hypot(target.x, target.y);
      p.centerWeight = Math.max(0.12, 1.0 - distFromCenter / 290);

      // Random scattering burst
      const angle = Math.random() * Math.PI * 2;
      const speed = 16 + Math.random() * 26;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    });
  };

  // Start exact 3-second auto-cycle timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % INSTRUMENT_THEMES.length;
      morphToShape(nextIndex);
    }, 3000);
  };

  // Tap / click handler
  const handleTap = () => {
    const nextIndex = (currentIndexRef.current + 1) % INSTRUMENT_THEMES.length;
    morphToShape(nextIndex);
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mousePosRef.current.targetX = x;
    mousePosRef.current.targetY = y;
    mousePosRef.current.isInside = true;
  };

  const handleMouseEnter = () => {
    mousePosRef.current.isInside = true;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.isInside = false;
    mousePosRef.current.targetX = 0;
    mousePosRef.current.targetY = 0;
  };

  // High-DPI Crisp Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const setupCanvasResolution = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.scale(dpr, dpr);
    };

    setupCanvasResolution();
    window.addEventListener('resize', setupCanvasResolution);

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Smooth mouse easing
      const m = mousePosRef.current;
      m.x += (m.targetX - m.x) * 0.1;
      m.y += (m.targetY - m.y) * 0.1;

      const scale = Math.min(1.15, Math.max(0.85, height / 640));
      const isMouseActive = m.isInside;

      particlesRef.current.forEach((p) => {
        let mouseInfluenceX = 0;
        let mouseInfluenceY = 0;

        if (isMouseActive) {
          const dxToMouse = m.x - p.x;
          const dyToMouse = m.y - p.y;
          const distToMouse = Math.hypot(dxToMouse, dyToMouse);

          const maxPullDistance = 450;
          if (distToMouse < maxPullDistance) {
            const pullFactor = (1 - distToMouse / maxPullDistance) * p.centerWeight * 0.35;
            mouseInfluenceX = dxToMouse * pullFactor;
            mouseInfluenceY = dyToMouse * pullFactor;
          }
        }

        const effectiveTargetX = p.targetX + mouseInfluenceX;
        const effectiveTargetY = p.targetY + mouseInfluenceY;

        // Spring physics
        const dx = effectiveTargetX - p.x;
        const dy = effectiveTargetY - p.y;

        p.vx = p.vx * 0.84 + dx * 0.09;
        p.vy = p.vy * 0.84 + dy * 0.09;

        p.x += p.vx;
        p.y += p.vy;

        p.alpha += (p.targetAlpha - p.alpha) * 0.08;

        // Smoothly interpolate RGB colors
        p.color.r += (p.targetColor.r - p.color.r) * 0.08;
        p.color.g += (p.targetColor.g - p.color.g) * 0.08;
        p.color.b += (p.targetColor.b - p.color.b) * 0.08;

        const screenX = centerX + p.x * scale;
        const screenY = centerY + p.y * scale;

        const dotAlpha = Math.max(0.2, Math.min(1.0, p.alpha));
        ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', setupCanvasResolution);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div
      onClick={handleTap}
      onTouchStart={handleTap}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Click or tap to change instrument"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '560px',
        background: '#000000',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
    </div>
  );
}

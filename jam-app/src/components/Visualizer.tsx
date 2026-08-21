'use client';
import React, { useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const data = audioEngine.getAnalyserData();
      const barCount = 32;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        // Map FFT values (usually negative dB from -100 to 0) to height
        const db = data[i] || -100;
        const normalized = Math.max(0, (db + 100) / 100);
        const barHeight = Math.max(4, normalized * height * 0.95);

        // Smooth neon gradient
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#00E676');
        gradient.addColorStop(0.5, '#00B0FF');
        gradient.addColorStop(1, '#E040FB');

        ctx.fillStyle = gradient;
        ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#aaa' }}>🎵 Room Master Spectrum</span>
        <span style={{ fontSize: '11px', color: '#00E676' }}>● LIVE 60 FPS</span>
      </div>
      <canvas ref={canvasRef} width={340} height={110} style={canvasStyle} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: 'rgba(18, 18, 26, 0.85)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '380px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '110px',
  borderRadius: '8px',
  background: '#09090f',
};

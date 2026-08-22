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

      // CRT phosphor grid lines
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 10; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const data = audioEngine.getAnalyserData();
      const barCount = 28;
      const barWidth = width / barCount - 3;

      for (let i = 0; i < barCount; i++) {
        const db = data[i] || -100;
        const normalized = Math.max(0, (db + 95) / 95);
        const barHeight = Math.max(3, normalized * height * 0.9);

        // Vintage CRT green/amber phosphor gradient
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#00a352');
        gradient.addColorStop(0.6, '#00E676');
        gradient.addColorStop(1, '#ffd600');

        ctx.fillStyle = gradient;
        ctx.fillRect(i * (barWidth + 3) + 4, height - barHeight - 4, barWidth, barHeight);

        // Peak dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(i * (barWidth + 3) + 4, height - barHeight - 7, barWidth, 2);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="skeuo-rack-chassis" style={containerStyle}>
      <span className="skeuo-screw" style={{ position: 'absolute', top: 6, left: 6 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', top: 6, right: 6 }} />

      <div style={headerStyle}>
        <div className="skeuo-dymo-tape" style={{ fontSize: '9px', padding: '2px 6px' }}>
          <span>SPECTRUM ANALYZER</span>
        </div>
        <span className="skeuo-digital-led" style={{ fontSize: '9px', color: '#00E676' }}>
          ● 60 FPS CRT
        </span>
      </div>

      <div style={screenCasing}>
        <canvas ref={canvasRef} width={280} height={100} style={canvasStyle} />
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  position: 'relative',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  padding: '0 12px',
};

const screenCasing: React.CSSProperties = {
  background: '#040d07',
  border: '3px inset #0f2b18',
  borderRadius: '8px',
  padding: '4px',
  boxShadow: 'inset 0 0 16px rgba(0, 230, 118, 0.25), 0 2px 4px rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '95px',
  borderRadius: '4px',
};

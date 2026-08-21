'use client';
import React, { useState, useEffect } from 'react';

interface DrumPadProps {
  onPlay?: (sound: string, velocity?: number) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

const DRUM_PADS = [
  { id: 'KICK', label: 'Kick Drum', key: '1', shortcut: '1', color: '#FF5722' },
  { id: 'SNARE', label: 'Snare Drum', key: '2', shortcut: '2', color: '#FF7043' },
  { id: 'HIHAT', label: 'Closed Hat', key: '3', shortcut: '3', color: '#FFAB91' },
  { id: 'TOM 1', label: 'High Tom', key: 'Q', shortcut: 'Q', color: '#FF3D00' },
  { id: 'TOM 2', label: 'Floor Tom', key: 'W', shortcut: 'W', color: '#DD2C00' },
  { id: 'CRASH', label: 'Crash Cymbal', key: 'E', shortcut: 'E', color: '#FF6E40' },
  { id: 'CLAP', label: 'Hand Clap', key: 'A', shortcut: 'A', color: '#FF8A65' },
  { id: 'SHAKER', label: 'Shaker', key: 'S', shortcut: 'S', color: '#FFA726' },
  { id: 'COWBELL', label: 'Cowbell', key: 'D', shortcut: 'D', color: '#FFB74D' },
];

export default function DrumPad({ onPlay, activeNotes = [], disabled = false }: DrumPadProps) {
  const [pressedPad, setPressedPad] = useState<string | null>(null);

  const trigger = (id: string) => {
    if (disabled) return;
    setPressedPad(id);
    onPlay?.(id, 0.9);
    setTimeout(() => setPressedPad(null), 120);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const pad = DRUM_PADS.find((p) => p.shortcut.toUpperCase() === e.key.toUpperCase());
      if (pad) {
        trigger(pad.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>🥁 Drum Kit & Beat Machine</span>
        <span style={hintStyle}>Keys: 1-3, Q-E, A-D</span>
      </div>

      <div style={gridStyle}>
        {DRUM_PADS.map((pad) => {
          const isActive = pressedPad === pad.id || activeNotes.includes(pad.id);
          return (
            <button
              key={pad.id}
              onClick={() => trigger(pad.id)}
              style={{
                ...padStyle,
                background: isActive
                  ? `radial-gradient(circle, ${pad.color} 0%, #1a1a24 100%)`
                  : '#16161f',
                borderColor: isActive ? pad.color : '#2a2a3c',
                boxShadow: isActive ? `0 0 24px ${pad.color}88, inset 0 0 12px ${pad.color}` : 'none',
                transform: isActive ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              <span style={shortcutBadge}>{pad.shortcut}</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{pad.label}</span>
              <span style={{ fontSize: '11px', color: '#8b8b9e', marginTop: '4px' }}>{pad.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: 'rgba(18, 18, 26, 0.85)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 87, 34, 0.3)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 87, 34, 0.1)',
  width: '100%',
  maxWidth: '520px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#FF5722',
  letterSpacing: '0.5px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8b8b9e',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '4px 10px',
  borderRadius: '20px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const padStyle: React.CSSProperties = {
  position: 'relative',
  height: '100px',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.08s cubic-bezier(0.4, 0, 0.2, 1)',
  outline: 'none',
};

const shortcutBadge: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  fontSize: '10px',
  fontWeight: 'bold',
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#aaa',
  padding: '2px 6px',
  borderRadius: '4px',
};

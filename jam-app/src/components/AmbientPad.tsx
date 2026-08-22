'use client';
import React, { useState, useEffect } from 'react';

interface AmbientPadProps {
  onPlay?: (notes: string[]) => void;
  onStop?: (notes: string[]) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

const CHORD_PADS = [
  { name: 'Am9', notes: ['A3', 'C4', 'E4', 'G4', 'B4'], shortcut: '1', mood: 'Melancholic', color: '#00B0FF' },
  { name: 'Fmaj7', notes: ['F3', 'A3', 'C4', 'E4'], shortcut: '2', mood: 'Dreamy', color: '#40C4FF' },
  { name: 'Cmaj9', notes: ['C3', 'E3', 'G3', 'B3', 'D4'], shortcut: '3', mood: 'Warm', color: '#80D8FF' },
  { name: 'G6/9', notes: ['G3', 'B3', 'D4', 'E4', 'A4'], shortcut: '4', mood: 'Uplifting', color: '#00E5FF' },
  { name: 'Dm7', notes: ['D3', 'F3', 'A3', 'C4'], shortcut: '5', mood: 'Deep', color: '#18FFFF' },
  { name: 'Em11', notes: ['E3', 'G3', 'B3', 'D4', 'A4'], shortcut: '6', mood: 'Mystic', color: '#00B0FF' },
  { name: 'Bbmaj7', notes: ['A#3', 'D4', 'F4', 'A4'], shortcut: '7', mood: 'Lush', color: '#0091EA' },
  { name: 'Csus4', notes: ['C3', 'F3', 'G3', 'C4'], shortcut: '8', mood: 'Tension', color: '#0288D1' },
];

export default function AmbientPad({ onPlay, onStop, activeNotes = [], disabled = false }: AmbientPadProps) {
  const [activeChord, setActiveChord] = useState<string | null>(null);

  const handleTrigger = (chord: (typeof CHORD_PADS)[0]) => {
    if (disabled) return;
    if (activeChord === chord.name) {
      setActiveChord(null);
      onStop?.(chord.notes);
    } else {
      setActiveChord(chord.name);
      onPlay?.(chord.notes);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const found = CHORD_PADS.find((c) => c.shortcut === e.key);
      if (found) {
        handleTrigger(found);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChord, disabled]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <span style={titleStyle}>🌊 Ambient Pad & Harmony</span>
          <span style={subtitleStyle}>Lush sustained FM chord textures for atmosphere</span>
        </div>
        <span style={hintBadge}>Press 1-8 to toggle chords</span>
      </div>

      <div style={gridStyle}>
        {CHORD_PADS.map((c) => {
          const isActive = activeChord === c.name || activeNotes.includes(c.name);
          return (
            <button
              key={c.name}
              onClick={() => handleTrigger(c)}
              style={{
                ...padStyle,
                background: isActive
                  ? `radial-gradient(circle, ${c.color} 0%, #0d1b2a 100%)`
                  : '#121824',
                borderColor: isActive ? c.color : 'rgba(0, 176, 255, 0.25)',
                boxShadow: isActive ? `0 0 24px ${c.color}aa, inset 0 0 12px ${c.color}` : 'none',
                transform: isActive ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              <span style={shortcutBadge}>{c.shortcut}</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{c.name}</span>
              <span style={{ fontSize: '11px', color: isActive ? '#fff' : '#78909c', marginTop: '4px' }}>
                {c.mood}
              </span>
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
  border: '1px solid rgba(0, 176, 255, 0.3)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 176, 255, 0.1)',
  width: '100%',
  maxWidth: '560px',
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
  color: '#00B0FF',
  display: 'block',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8b8b9e',
  display: 'block',
  marginTop: '2px',
};

const hintBadge: React.CSSProperties = {
  fontSize: '11px',
  color: '#8b8b9e',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '4px 10px',
  borderRadius: '20px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
};

const padStyle: React.CSSProperties = {
  position: 'relative',
  height: '95px',
  borderRadius: '12px',
  borderWidth: '2px',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  outline: 'none',
};

const shortcutBadge: React.CSSProperties = {
  position: 'absolute',
  top: '6px',
  left: '6px',
  fontSize: '10px',
  fontWeight: 'bold',
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#aaa',
  padding: '1px 5px',
  borderRadius: '4px',
};

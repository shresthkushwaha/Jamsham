'use client';
import React, { useState, useEffect } from 'react';

interface FxPercussionProps {
  onPlay?: (effect: string) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

const FX_SOUNDS = [
  { id: 'LASER', name: '⚡ Sci-Fi Laser', shortcut: '1', desc: 'Fast frequency sweep', color: '#FFD600' },
  { id: 'ZAP', name: '✨ Crystal Zap', shortcut: '2', desc: 'Metallic sparkle', color: '#FFEA00' },
  { id: 'SUB DROP', name: '💥 808 Sub Drop', shortcut: '3', desc: 'Deep booming impact', color: '#FFAB00' },
  { id: 'SWEEP', name: '💨 Noise Riser', shortcut: '4', desc: 'Tension builder sweep', color: '#FFC400' },
  { id: 'CHIME', name: '🔔 Harmonic Chime', shortcut: '5', desc: 'Ethereal chime bells', color: '#FFE57F' },
  { id: 'GLITCH', name: '🤖 Glitch Tap', shortcut: '6', desc: 'Cybernetic click', color: '#FFD740' },
];

export default function FxPercussion({ onPlay, activeNotes = [], disabled = false }: FxPercussionProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);

  const trigger = (id: string) => {
    if (disabled) return;
    setPressedId(id);
    onPlay?.(id);
    setTimeout(() => setPressedId(null), 150);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const found = FX_SOUNDS.find((f) => f.shortcut === e.key);
      if (found) trigger(found.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <span style={titleStyle}>✨ FX, Glitch & Texture Drops</span>
          <span style={subtitleStyle}>Transitions, sci-fi sweeps and auxiliary percussion</span>
        </div>
        <span style={hintBadge}>Keys: 1-6</span>
      </div>

      <div style={gridStyle}>
        {FX_SOUNDS.map((fx) => {
          const isActive = pressedId === fx.id || activeNotes.includes(fx.id);
          return (
            <button
              key={fx.id}
              onClick={() => trigger(fx.id)}
              style={{
                ...cardStyle,
                background: isActive
                  ? `radial-gradient(circle, ${fx.color} 0%, #201a08 100%)`
                  : '#1a1810',
                borderColor: isActive ? fx.color : 'rgba(255, 214, 0, 0.25)',
                boxShadow: isActive ? `0 0 24px ${fx.color}aa, inset 0 0 10px ${fx.color}` : 'none',
                transform: isActive ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              <span style={shortcutBadge}>{fx.shortcut}</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: isActive ? '#000' : '#fff' }}>
                {fx.name}
              </span>
              <span style={{ fontSize: '11px', color: isActive ? '#333' : '#a0987c', marginTop: '4px' }}>
                {fx.desc}
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
  border: '1px solid rgba(255, 214, 0, 0.3)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 214, 0, 0.1)',
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
  color: '#FFD600',
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
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
};

const cardStyle: React.CSSProperties = {
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
  transition: 'all 0.1s ease',
  outline: 'none',
  padding: '10px',
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

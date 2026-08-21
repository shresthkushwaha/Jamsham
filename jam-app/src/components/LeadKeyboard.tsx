'use client';
import React, { useState, useEffect } from 'react';

interface LeadKeyboardProps {
  onPlay?: (note: string) => void;
  onStop?: (note: string) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

interface PianoKey {
  note: string;
  isBlack: boolean;
  shortcut: string;
}

const PIANO_KEYS: PianoKey[] = [
  { note: 'C4', isBlack: false, shortcut: 'A' },
  { note: 'C#4', isBlack: true, shortcut: 'W' },
  { note: 'D4', isBlack: false, shortcut: 'S' },
  { note: 'D#4', isBlack: true, shortcut: 'E' },
  { note: 'E4', isBlack: false, shortcut: 'D' },
  { note: 'F4', isBlack: false, shortcut: 'F' },
  { note: 'F#4', isBlack: true, shortcut: 'T' },
  { note: 'G4', isBlack: false, shortcut: 'G' },
  { note: 'G#4', isBlack: true, shortcut: 'Y' },
  { note: 'A4', isBlack: false, shortcut: 'H' },
  { note: 'A#4', isBlack: true, shortcut: 'U' },
  { note: 'B4', isBlack: false, shortcut: 'J' },
  { note: 'C5', isBlack: false, shortcut: 'K' },
];

export default function LeadKeyboard({ onPlay, onStop, activeNotes = [], disabled = false }: LeadKeyboardProps) {
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set());

  const handleStart = (note: string) => {
    if (disabled) return;
    setPressedNotes((prev) => new Set(prev).add(note));
    onPlay?.(note);
  };

  const handleEnd = (note: string) => {
    setPressedNotes((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    onStop?.(note);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
      const keyObj = PIANO_KEYS.find((k) => k.shortcut.toUpperCase() === e.key.toUpperCase());
      if (keyObj) {
        handleStart(keyObj.note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyObj = PIANO_KEYS.find((k) => k.shortcut.toUpperCase() === e.key.toUpperCase());
      if (keyObj) {
        handleEnd(keyObj.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <span style={titleStyle}>🎹 Polyphonic Lead Synth</span>
          <span style={subtitleStyle}>Shimmering chords and melodics with reverb & delay</span>
        </div>
        <span style={hintBadge}>Shortcuts: A-K (White), W,E,T,Y,U (Black)</span>
      </div>

      <div style={pianoWrapperStyle}>
        {PIANO_KEYS.map((k) => {
          const isActive = pressedNotes.has(k.note) || activeNotes.includes(k.note);

          if (k.isBlack) {
            return (
              <button
                key={k.note}
                onMouseDown={() => handleStart(k.note)}
                onMouseUp={() => handleEnd(k.note)}
                onMouseLeave={() => handleEnd(k.note)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleStart(k.note);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleEnd(k.note);
                }}
                style={{
                  ...blackKeyStyle,
                  background: isActive
                    ? 'linear-gradient(180deg, #00E676 0%, #00B248 100%)'
                    : '#121218',
                  boxShadow: isActive ? '0 0 16px #00E676' : 'none',
                }}
              >
                <span style={{ fontSize: '9px', color: isActive ? '#000' : '#00E676' }}>{k.shortcut}</span>
                <span style={{ fontSize: '10px', color: isActive ? '#000' : '#888', fontWeight: 'bold' }}>
                  {k.note}
                </span>
              </button>
            );
          }

          return (
            <button
              key={k.note}
              onMouseDown={() => handleStart(k.note)}
              onMouseUp={() => handleEnd(k.note)}
              onMouseLeave={() => handleEnd(k.note)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleStart(k.note);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleEnd(k.note);
              }}
              style={{
                ...whiteKeyStyle,
                background: isActive
                  ? 'linear-gradient(180deg, #b9f6ca 0%, #00E676 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #d8d8e5 100%)',
                boxShadow: isActive ? '0 0 20px #00E676, inset 0 0 8px #00E676' : 'none',
                transform: isActive ? 'translateY(3px)' : 'none',
              }}
            >
              <span style={whiteKeyShortcutStyle}>{k.shortcut}</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: isActive ? '#052e16' : '#222' }}>
                {k.note}
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
  border: '1px solid rgba(0, 230, 118, 0.3)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 230, 118, 0.1)',
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
  color: '#00E676',
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

const pianoWrapperStyle: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  justifyContent: 'center',
  height: '160px',
  paddingTop: '6px',
};

const whiteKeyStyle: React.CSSProperties = {
  flex: 1,
  height: '150px',
  borderRadius: '0 0 6px 6px',
  border: '1px solid #1a1a24',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 2px',
  cursor: 'pointer',
  transition: 'all 0.06s ease',
  outline: 'none',
  userSelect: 'none',
};

const whiteKeyShortcutStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666',
  background: 'rgba(0, 0, 0, 0.08)',
  padding: '2px 4px',
  borderRadius: '4px',
};

const blackKeyStyle: React.CSSProperties = {
  position: 'absolute',
  width: '32px',
  height: '95px',
  borderRadius: '0 0 5px 5px',
  border: '1px solid #333',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 2px',
  cursor: 'pointer',
  transition: 'all 0.06s ease',
  outline: 'none',
  userSelect: 'none',
  // Standard black key offsets
  marginLeft: '-16px',
  // Computed dynamically in pure CSS if needed or simple offsets
};

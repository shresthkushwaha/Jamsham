'use client';
import React, { useState, useEffect } from 'react';

interface BassSynthProps {
  onPlay?: (note: string) => void;
  onStop?: (note: string) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

const BASS_KEYS = [
  { note: 'C1', shortcut: 'A', label: 'C1' },
  { note: 'D1', shortcut: 'S', label: 'D1' },
  { note: 'E1', shortcut: 'D', label: 'E1' },
  { note: 'F1', shortcut: 'F', label: 'F1' },
  { note: 'G1', shortcut: 'G', label: 'G1' },
  { note: 'A1', shortcut: 'H', label: 'A1' },
  { note: 'B1', shortcut: 'J', label: 'B1' },
  { note: 'C2', shortcut: 'K', label: 'C2' },
  { note: 'D2', shortcut: 'L', label: 'D2' },
  { note: 'E2', shortcut: ';', label: 'E2' },
];

export default function BassSynth({ onPlay, onStop, activeNotes = [], disabled = false }: BassSynthProps) {
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [octaveShift, setOctaveShift] = useState<number>(0);

  const getShiftedNote = (baseNote: string) => {
    const noteName = baseNote.slice(0, -1);
    const octave = parseInt(baseNote.slice(-1)) + octaveShift;
    return `${noteName}${octave}`;
  };

  const handleStart = (baseNote: string) => {
    if (disabled) return;
    const note = getShiftedNote(baseNote);
    setCurrentNote(note);
    onPlay?.(note);
  };

  const handleEnd = (baseNote: string) => {
    const note = getShiftedNote(baseNote);
    if (currentNote === note) {
      setCurrentNote(null);
    }
    onStop?.(note);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
      const keyObj = BASS_KEYS.find((k) => k.shortcut.toUpperCase() === e.key.toUpperCase());
      if (keyObj) {
        handleStart(keyObj.note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyObj = BASS_KEYS.find((k) => k.shortcut.toUpperCase() === e.key.toUpperCase());
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
  }, [octaveShift, disabled, currentNote]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <span style={titleStyle}>🎸 Sub Bass Synth</span>
          <span style={subtitleStyle}>Deep analog sawtooth bass with resonant filter</span>
        </div>
        <div style={octaveControlStyle}>
          <span style={{ fontSize: '11px', color: '#a0a0b0', marginRight: '6px' }}>Octave:</span>
          <button
            onClick={() => setOctaveShift((o) => Math.max(-1, o - 1))}
            style={octaveBtnStyle}
            title="Down"
          >
            -
          </button>
          <span style={{ fontWeight: 'bold', color: '#E040FB', minWidth: '18px', textAlign: 'center' }}>
            {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}
          </span>
          <button
            onClick={() => setOctaveShift((o) => Math.min(1, o + 1))}
            style={octaveBtnStyle}
            title="Up"
          >
            +
          </button>
        </div>
      </div>

      <div style={keysContainerStyle}>
        {BASS_KEYS.map((k) => {
          const shifted = getShiftedNote(k.note);
          const isPressed = currentNote === shifted || activeNotes.includes(shifted);
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
                ...keyStyle,
                background: isPressed
                  ? 'linear-gradient(180deg, #E040FB 0%, #7B1FA2 100%)'
                  : 'linear-gradient(180deg, #23192d 0%, #17111e 100%)',
                borderColor: isPressed ? '#E040FB' : 'rgba(224, 64, 251, 0.25)',
                boxShadow: isPressed
                  ? '0 0 20px rgba(224, 64, 251, 0.8), inset 0 0 10px #E040FB'
                  : 'none',
                transform: isPressed ? 'translateY(4px)' : 'translateY(0)',
              }}
            >
              <span style={keyShortcutStyle}>{k.shortcut}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: isPressed ? '#fff' : '#E040FB' }}>
                {shifted}
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
  border: '1px solid rgba(224, 64, 251, 0.3)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(224, 64, 251, 0.1)',
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
  color: '#E040FB',
  display: 'block',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8b8b9e',
  display: 'block',
  marginTop: '2px',
};

const octaveControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '4px 10px',
  borderRadius: '20px',
};

const octaveBtnStyle: React.CSSProperties = {
  background: 'rgba(224, 64, 251, 0.2)',
  border: 'none',
  color: '#fff',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const keysContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  justifyContent: 'center',
  padding: '10px 0',
};

const keyStyle: React.CSSProperties = {
  flex: 1,
  height: '140px',
  borderRadius: '0 0 8px 8px',
  borderWidth: '2px',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 4px',
  cursor: 'pointer',
  transition: 'all 0.08s ease',
  outline: 'none',
  userSelect: 'none',
};

const keyShortcutStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8b8b9e',
  background: 'rgba(255, 255, 255, 0.08)',
  padding: '2px 5px',
  borderRadius: '4px',
};

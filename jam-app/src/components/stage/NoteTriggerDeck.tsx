'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export interface NotePadConfig {
  label: string;
  value: string | string[];
  key: string; // Primary hotkey (alphabet or number)
  altKey?: string; // Secondary key
}

interface NoteTriggerDeckProps {
  instrumentId: string;
  instrumentName?: string;
  instrumentColor?: string;
  onPlay: (noteOrSound: string | string[], velocity?: number) => void;
  onStop: (noteOrSound: string | string[]) => void;
  activeNotes: string[];
}

// Expanded, authentic note collections for the 7 instruments
const EXPANDED_PAD_PRESETS: Record<string, NotePadConfig[]> = {
  KEYBOARD: [
    { label: 'C4', value: 'C4', key: 'A', altKey: '1' },
    { label: 'D4', value: 'D4', key: 'S', altKey: '2' },
    { label: 'E4', value: 'E4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'G4', value: 'G4', key: 'G', altKey: '5' },
    { label: 'A4', value: 'A4', key: 'H', altKey: '6' },
    { label: 'B4', value: 'B4', key: 'J', altKey: '7' },
    { label: 'C5', value: 'C5', key: 'K', altKey: '8' },
    { label: 'D5', value: 'D5', key: 'L', altKey: '9' },
    { label: 'E5', value: 'E5', key: ';', altKey: '0' },
    { label: 'F5', value: 'F5', key: 'Q' },
    { label: 'G5', value: 'G5', key: 'W' },
    { label: 'A5', value: 'A5', key: 'E' },
    { label: 'B5', value: 'B5', key: 'R' },
    { label: 'C6', value: 'C6', key: 'T' },
  ],
  PIANO: [
    { label: 'C4', value: 'C4', key: 'A', altKey: '1' },
    { label: 'D4', value: 'D4', key: 'S', altKey: '2' },
    { label: 'E4', value: 'E4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'G4', value: 'G4', key: 'G', altKey: '5' },
    { label: 'A4', value: 'A4', key: 'H', altKey: '6' },
    { label: 'B4', value: 'B4', key: 'J', altKey: '7' },
    { label: 'C5', value: 'C5', key: 'K', altKey: '8' },
    { label: 'D5', value: 'D5', key: 'L', altKey: '9' },
    { label: 'E5', value: 'E5', key: ';', altKey: '0' },
    { label: 'F5', value: 'F5', key: 'Q' },
    { label: 'G5', value: 'G5', key: 'W' },
    { label: 'A5', value: 'A5', key: 'E' },
    { label: 'B5', value: 'B5', key: 'R' },
    { label: 'C6', value: 'C6', key: 'T' },
  ],
  DRUM: [
    { label: 'Kick', value: 'KICK', key: 'A', altKey: '1' },
    { label: 'Snare', value: 'SNARE', key: 'S', altKey: '2' },
    { label: 'HiHat', value: 'HIHAT', key: 'D', altKey: '3' },
    { label: 'Clap', value: 'CLAP', key: 'F', altKey: '4' },
    { label: 'Tom 1', value: 'TOM 1', key: 'G', altKey: '5' },
    { label: 'Tom 2', value: 'TOM 2', key: 'H', altKey: '6' },
    { label: 'Floor', value: 'TOM 3', key: 'J', altKey: '7' },
    { label: 'Crash', value: 'CRASH', key: 'K', altKey: '8' },
    { label: 'Cowbell', value: 'COWBELL', key: 'L', altKey: '9' },
    { label: 'OpenHat', value: 'OPEN HAT', key: ';', altKey: '0' },
    { label: 'Rimshot', value: 'SNARE', key: 'Q' },
    { label: 'Shaker', value: 'CLAP', key: 'W' },
  ],
  DRUMS: [
    { label: 'Kick', value: 'KICK', key: 'A', altKey: '1' },
    { label: 'Snare', value: 'SNARE', key: 'S', altKey: '2' },
    { label: 'HiHat', value: 'HIHAT', key: 'D', altKey: '3' },
    { label: 'Clap', value: 'CLAP', key: 'F', altKey: '4' },
    { label: 'Tom 1', value: 'TOM 1', key: 'G', altKey: '5' },
    { label: 'Tom 2', value: 'TOM 2', key: 'H', altKey: '6' },
    { label: 'Floor', value: 'TOM 3', key: 'J', altKey: '7' },
    { label: 'Crash', value: 'CRASH', key: 'K', altKey: '8' },
    { label: 'Cowbell', value: 'COWBELL', key: 'L', altKey: '9' },
    { label: 'OpenHat', value: 'OPEN HAT', key: ';', altKey: '0' },
  ],
  GUITAR: [
    { label: 'Em', value: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], key: 'A', altKey: '1' },
    { label: 'G', value: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'], key: 'S', altKey: '2' },
    { label: 'C', value: ['C3', 'E3', 'G3', 'C4', 'E4'], key: 'D', altKey: '3' },
    { label: 'D', value: ['D3', 'A3', 'D4', 'F#4'], key: 'F', altKey: '4' },
    { label: 'Am', value: ['A2', 'E3', 'A3', 'C4', 'E4'], key: 'G', altKey: '5' },
    { label: 'F', value: ['F2', 'C3', 'F3', 'A3', 'C4'], key: 'H', altKey: '6' },
    { label: 'Bm', value: ['B2', 'F#3', 'B3', 'D4', 'F#4'], key: 'J', altKey: '7' },
    { label: 'A', value: ['A2', 'E3', 'A3', 'C#4', 'E4'], key: 'K', altKey: '8' },
    { label: 'Dm', value: ['D3', 'A3', 'D4', 'F4'], key: 'L', altKey: '9' },
    { label: 'E7', value: ['E2', 'B2', 'D3', 'G#3', 'D4'], key: ';', altKey: '0' },
    { label: 'Cmaj7', value: ['C3', 'G3', 'B3', 'E4'], key: 'Q' },
    { label: 'Dsus4', value: ['D3', 'G3', 'A3', 'D4'], key: 'W' },
  ],
  SITAR: [
    { label: 'Sa (C3)', value: 'C3', key: 'A', altKey: '1' },
    { label: 're (Db3)', value: 'Db3', key: 'S', altKey: '2' },
    { label: 'Re (D3)', value: 'D3', key: 'D', altKey: '3' },
    { label: 'ga (Eb3)', value: 'Eb3', key: 'F', altKey: '4' },
    { label: 'Ga (E3)', value: 'E3', key: 'G', altKey: '5' },
    { label: 'Ma (F3)', value: 'F3', key: 'H', altKey: '6' },
    { label: 'tMa (F#3)', value: 'F#3', key: 'J', altKey: '7' },
    { label: 'Pa (G3)', value: 'G3', key: 'K', altKey: '8' },
    { label: 'dha (Ab3)', value: 'Ab3', key: 'L', altKey: '9' },
    { label: 'Dha (A3)', value: 'A3', key: ';', altKey: '0' },
    { label: 'ni (Bb3)', value: 'Bb3', key: 'Q' },
    { label: 'Ni (B3)', value: 'B3', key: 'W' },
    { label: "Sa' (C4)", value: 'C4', key: 'E' },
    { label: "Re' (D4)", value: 'D4', key: 'R' },
    { label: "Ga' (E4)", value: 'E4', key: 'T' },
  ],
  FLUTE: [
    { label: 'C4', value: 'C4', key: 'A', altKey: '1' },
    { label: 'D4', value: 'D4', key: 'S', altKey: '2' },
    { label: 'E4', value: 'E4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'F#4', value: 'F#4', key: 'G', altKey: '5' },
    { label: 'G4', value: 'G4', key: 'H', altKey: '6' },
    { label: 'A4', value: 'A4', key: 'J', altKey: '7' },
    { label: 'B4', value: 'B4', key: 'K', altKey: '8' },
    { label: 'C5', value: 'C5', key: 'L', altKey: '9' },
    { label: 'D5', value: 'D5', key: ';', altKey: '0' },
    { label: 'E5', value: 'E5', key: 'Q' },
    { label: 'F#5', value: 'F#5', key: 'W' },
    { label: 'G5', value: 'G5', key: 'E' },
    { label: 'A5', value: 'A5', key: 'R' },
    { label: 'C6', value: 'C6', key: 'T' },
  ],
  TRUMPET: [
    { label: 'C4', value: 'C4', key: 'A', altKey: '1' },
    { label: 'D4', value: 'D4', key: 'S', altKey: '2' },
    { label: 'E4', value: 'E4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'G4', value: 'G4', key: 'G', altKey: '5' },
    { label: 'A4', value: 'A4', key: 'H', altKey: '6' },
    { label: 'Bb4', value: 'Bb4', key: 'J', altKey: '7' },
    { label: 'B4', value: 'B4', key: 'K', altKey: '8' },
    { label: 'C5', value: 'C5', key: 'L', altKey: '9' },
    { label: 'D5', value: 'D5', key: ';', altKey: '0' },
    { label: 'Eb5', value: 'Eb5', key: 'Q' },
    { label: 'E5', value: 'E5', key: 'W' },
    { label: 'F5', value: 'F5', key: 'E' },
    { label: 'G5', value: 'G5', key: 'R' },
    { label: 'C6', value: 'C6', key: 'T' },
  ],
  SAXOPHONE: [
    { label: 'Bb3', value: 'Bb3', key: 'A', altKey: '1' },
    { label: 'C4', value: 'C4', key: 'S', altKey: '2' },
    { label: 'Eb4', value: 'Eb4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'F#4', value: 'F#4', key: 'G', altKey: '5' },
    { label: 'G4', value: 'G4', key: 'H', altKey: '6' },
    { label: 'Bb4', value: 'Bb4', key: 'J', altKey: '7' },
    { label: 'C5', value: 'C5', key: 'K', altKey: '8' },
    { label: 'Eb5', value: 'Eb5', key: 'L', altKey: '9' },
    { label: 'F5', value: 'F5', key: ';', altKey: '0' },
    { label: 'F#5', value: 'F#5', key: 'Q' },
    { label: 'G5', value: 'G5', key: 'W' },
    { label: 'Bb5', value: 'Bb5', key: 'E' },
    { label: 'C6', value: 'C6', key: 'R' },
  ],
  SAX: [
    { label: 'Bb3', value: 'Bb3', key: 'A', altKey: '1' },
    { label: 'C4', value: 'C4', key: 'S', altKey: '2' },
    { label: 'Eb4', value: 'Eb4', key: 'D', altKey: '3' },
    { label: 'F4', value: 'F4', key: 'F', altKey: '4' },
    { label: 'F#4', value: 'F#4', key: 'G', altKey: '5' },
    { label: 'G4', value: 'G4', key: 'H', altKey: '6' },
    { label: 'Bb4', value: 'Bb4', key: 'J', altKey: '7' },
    { label: 'C5', value: 'C5', key: 'K', altKey: '8' },
    { label: 'Eb5', value: 'Eb5', key: 'L', altKey: '9' },
    { label: 'F5', value: 'F5', key: ';', altKey: '0' },
    { label: 'G5', value: 'G5', key: 'W' },
    { label: 'C6', value: 'C6', key: 'R' },
  ],
  VIOLIN: [
    { label: 'G3', value: 'G3', key: 'A', altKey: '1' },
    { label: 'A3', value: 'A3', key: 'S', altKey: '2' },
    { label: 'B3', value: 'B3', key: 'D', altKey: '3' },
    { label: 'C4', value: 'C4', key: 'F', altKey: '4' },
    { label: 'D4', value: 'D4', key: 'G', altKey: '5' },
    { label: 'E4', value: 'E4', key: 'H', altKey: '6' },
    { label: 'F#4', value: 'F#4', key: 'J', altKey: '7' },
    { label: 'G4', value: 'G4', key: 'K', altKey: '8' },
    { label: 'A4', value: 'A4', key: 'L', altKey: '9' },
    { label: 'B4', value: 'B4', key: ';', altKey: '0' },
    { label: 'C5', value: 'C5', key: 'Q' },
    { label: 'D5', value: 'D5', key: 'W' },
    { label: 'E5', value: 'E5', key: 'E' },
    { label: 'G5', value: 'G5', key: 'R' },
    { label: 'C6', value: 'C6', key: 'T' },
  ],
  STRINGS: [
    { label: 'G3', value: 'G3', key: 'A', altKey: '1' },
    { label: 'A3', value: 'A3', key: 'S', altKey: '2' },
    { label: 'B3', value: 'B3', key: 'D', altKey: '3' },
    { label: 'C4', value: 'C4', key: 'F', altKey: '4' },
    { label: 'D4', value: 'D4', key: 'G', altKey: '5' },
    { label: 'E4', value: 'E4', key: 'H', altKey: '6' },
    { label: 'G4', value: 'G4', key: 'K', altKey: '8' },
    { label: 'C5', value: 'C5', key: 'Q' },
    { label: 'D5', value: 'D5', key: 'W' },
    { label: 'G5', value: 'G5', key: 'R' },
  ],
};

export default function NoteTriggerDeck({
  instrumentId,
  instrumentName,
  instrumentColor = '#9C27B0',
  onPlay,
  onStop,
  activeNotes,
}: NoteTriggerDeckProps) {
  const [pressedPads, setPressedPads] = useState<Record<number, boolean>>({});
  const isMouseDownRef = useRef(false);
  const currentHoveredPadRef = useRef<number | null>(null);

  const currentPads = useMemo(() => {
    const key = (instrumentId || 'PIANO').toUpperCase();
    return EXPANDED_PAD_PRESETS[key] || EXPANDED_PAD_PRESETS.PIANO;
  }, [instrumentId]);

  // Trigger attack helper
  const triggerPadAttack = useCallback(
    (index: number) => {
      const pad = currentPads[index];
      if (!pad) return;
      setPressedPads((prev) => ({ ...prev, [index]: true }));
      onPlay(pad.value, 0.9);
      currentHoveredPadRef.current = index;
    },
    [currentPads, onPlay]
  );

  // Trigger release helper
  const triggerPadRelease = useCallback(
    (index: number) => {
      const pad = currentPads[index];
      if (!pad) return;
      setPressedPads((prev) => ({ ...prev, [index]: false }));
      onStop(pad.value);
      if (currentHoveredPadRef.current === index) {
        currentHoveredPadRef.current = null;
      }
    },
    [currentPads, onStop]
  );

  // Global mouseup / pointer listener to handle drag release anywhere on screen
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (currentHoveredPadRef.current !== null) {
          triggerPadRelease(currentHoveredPadRef.current);
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [triggerPadRelease]);

  // Keyboard shortcut listener (supports alphabet keys + numbers + symbols)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const pressedKey = e.key.toUpperCase();
      const padIndex = currentPads.findIndex(
        (p) => p.key.toUpperCase() === pressedKey || (p.altKey && p.altKey.toUpperCase() === pressedKey)
      );

      if (padIndex !== -1) {
        triggerPadAttack(padIndex);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const pressedKey = e.key.toUpperCase();
      const padIndex = currentPads.findIndex(
        (p) => p.key.toUpperCase() === pressedKey || (p.altKey && p.altKey.toUpperCase() === pressedKey)
      );

      if (padIndex !== -1) {
        triggerPadRelease(padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentPads, triggerPadAttack, triggerPadRelease]);

  // Glissando / Drag interaction (Traveling over bubbles with pointer down)
  const handleMouseDownOnPad = (index: number) => {
    isMouseDownRef.current = true;
    triggerPadAttack(index);
  };

  const handleMouseEnterPad = (index: number) => {
    if (isMouseDownRef.current) {
      if (currentHoveredPadRef.current !== null && currentHoveredPadRef.current !== index) {
        triggerPadRelease(currentHoveredPadRef.current);
      }
      triggerPadAttack(index);
    }
  };

  const handleMouseLeavePad = (index: number) => {
    if (isMouseDownRef.current) {
      triggerPadRelease(index);
    }
  };

  // Touch Drag / Glissando Handler for Mobile & Tablets
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const padElem = elem?.closest('[data-pad-index]') as HTMLElement | null;

    if (padElem) {
      const index = Number(padElem.dataset.padIndex);
      if (!isNaN(index) && currentHoveredPadRef.current !== index) {
        if (currentHoveredPadRef.current !== null) {
          triggerPadRelease(currentHoveredPadRef.current);
        }
        triggerPadAttack(index);
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentHoveredPadRef.current !== null) {
      triggerPadRelease(currentHoveredPadRef.current);
    }
  };

  return (
    <div
      style={deckContainerStyle}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div style={padsRowStyle}>
        {currentPads.map((pad, index) => {
          const valueString = Array.isArray(pad.value) ? pad.value.join('+') : pad.value;
          const isPressed =
            pressedPads[index] ||
            activeNotes.includes(valueString) ||
            (typeof pad.value === 'string' && activeNotes.includes(pad.value));

          return (
            <button
              key={`${pad.label}-${index}`}
              data-pad-index={index}
              onMouseDown={() => handleMouseDownOnPad(index)}
              onMouseEnter={() => handleMouseEnterPad(index)}
              onMouseLeave={() => handleMouseLeavePad(index)}
              onTouchStart={(e) => {
                e.preventDefault();
                triggerPadAttack(index);
              }}
              style={{
                ...padCircleStyle,
                backgroundColor: isPressed ? '#ffffff' : '#d2d6db',
                color: isPressed ? instrumentColor : '#2b313a',
                transform: isPressed ? 'scale(0.91)' : 'scale(1)',
                boxShadow: isPressed
                  ? `0 0 20px ${instrumentColor}, 0 2px 6px rgba(0,0,0,0.35)`
                  : '0 4px 10px rgba(0,0,0,0.15)',
              }}
            >
              <span
                style={{
                  ...noteLabelStyle,
                  fontSize: pad.label.length > 5 ? '10px' : pad.label.length > 3 ? '11px' : '13px',
                }}
              >
                {pad.label}
              </span>
              <span style={keyHintStyle}>
                {pad.key}
                {pad.altKey ? ` · ${pad.altKey}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const deckContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px 24px 16px',
  zIndex: 20,
  userSelect: 'none',
  touchAction: 'none', // Essential for smooth drag gliding across bubbles without page scrolling
};

const padsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  maxWidth: '1100px',
};

const padCircleStyle: React.CSSProperties = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.06s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  outline: 'none',
  position: 'relative',
  flexShrink: 0,
};

const noteLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: '-0.2px',
  lineHeight: 1.1,
  textAlign: 'center',
};

const keyHintStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 600,
  opacity: 0.55,
  marginTop: '1px',
  letterSpacing: '-0.2px',
};

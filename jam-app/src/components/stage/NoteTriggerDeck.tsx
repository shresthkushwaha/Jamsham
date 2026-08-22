'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import BottomInstrumentPanel from '@/components/BottomInstrumentPanel';

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

// Expanded, authentic note collections with both Alphabet (A-L, Q-Y, Z-M) and Number keys
const EXPANDED_PAD_PRESETS: Record<string, NotePadConfig[]> = {
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
  LEAD: [
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
  BASS: [
    { label: 'C1', value: 'C1', key: 'Z', altKey: '1' },
    { label: 'D1', value: 'D1', key: 'X', altKey: '2' },
    { label: 'E1', value: 'E1', key: 'C', altKey: '3' },
    { label: 'F1', value: 'F1', key: 'V', altKey: '4' },
    { label: 'G1', value: 'G1', key: 'B', altKey: '5' },
    { label: 'A1', value: 'A1', key: 'N', altKey: '6' },
    { label: 'B1', value: 'B1', key: 'M', altKey: '7' },
    { label: 'C2', value: 'C2', key: 'A', altKey: '8' },
    { label: 'D2', value: 'D2', key: 'S', altKey: '9' },
    { label: 'E2', value: 'E2', key: 'D', altKey: '0' },
    { label: 'F2', value: 'F2', key: 'F' },
    { label: 'G2', value: 'G2', key: 'G' },
    { label: 'A2', value: 'A2', key: 'H' },
    { label: 'B2', value: 'B2', key: 'J' },
    { label: 'C3', value: 'C3', key: 'K' },
  ],
  DRUMS: [
    { label: 'Kick', value: 'KICK', key: 'A', altKey: '1' },
    { label: 'Snare', value: 'SNARE', key: 'S', altKey: '2' },
    { label: 'HiHat', value: 'HIHAT', key: 'D', altKey: '3' },
    { label: 'Open', value: 'OPEN HAT', key: 'F', altKey: '4' },
    { label: 'Clap', value: 'CLAP', key: 'G', altKey: '5' },
    { label: 'Tom 1', value: 'TOM 1', key: 'H', altKey: '6' },
    { label: 'Tom 2', value: 'TOM 2', key: 'J', altKey: '7' },
    { label: 'Floor', value: 'FLOOR TOM', key: 'K', altKey: '8' },
    { label: 'Crash', value: 'CRASH', key: 'L', altKey: '9' },
    { label: 'Ride', value: 'RIDE', key: ';', altKey: '0' },
    { label: 'Tamb', value: 'TAMBOURINE', key: 'Q' },
    { label: 'Side', value: 'SNARE', key: 'W' },
    { label: 'Shaker', value: 'CLAP', key: 'E' },
    { label: 'Cowbell', value: 'OPEN HAT', key: 'R' },
  ],
  BRASS: [
    { label: 'Bb2', value: 'Bb2', key: 'Z', altKey: '1' },
    { label: 'C3', value: 'C3', key: 'X', altKey: '2' },
    { label: 'Eb3', value: 'Eb3', key: 'C', altKey: '3' },
    { label: 'F3', value: 'F3', key: 'V', altKey: '4' },
    { label: 'G3', value: 'G3', key: 'B', altKey: '5' },
    { label: 'Bb3', value: 'Bb3', key: 'N', altKey: '6' },
    { label: 'C4', value: 'C4', key: 'A', altKey: '7' },
    { label: 'Eb4', value: 'Eb4', key: 'S', altKey: '8' },
    { label: 'F4', value: 'F4', key: 'D', altKey: '9' },
    { label: 'G4', value: 'G4', key: 'F', altKey: '0' },
    { label: 'Bb4', value: 'Bb4', key: 'G' },
    { label: 'C5', value: 'C5', key: 'H' },
    { label: 'D5', value: 'D5', key: 'J' },
    { label: 'Eb5', value: 'Eb5', key: 'K' },
    { label: 'F5', value: 'F5', key: 'L' },
  ],
  SAX: [
    { label: 'Bb2', value: 'Bb2', key: 'Z', altKey: '1' },
    { label: 'C3', value: 'C3', key: 'X', altKey: '2' },
    { label: 'Eb3', value: 'Eb3', key: 'C', altKey: '3' },
    { label: 'F3', value: 'F3', key: 'V', altKey: '4' },
    { label: 'G3', value: 'G3', key: 'B', altKey: '5' },
    { label: 'Bb3', value: 'Bb3', key: 'N', altKey: '6' },
    { label: 'C4', value: 'C4', key: 'A', altKey: '7' },
    { label: 'Eb4', value: 'Eb4', key: 'S', altKey: '8' },
    { label: 'F4', value: 'F4', key: 'D', altKey: '9' },
    { label: 'G4', value: 'G4', key: 'F', altKey: '0' },
    { label: 'Bb4', value: 'Bb4', key: 'G' },
    { label: 'C5', value: 'C5', key: 'H' },
    { label: 'D5', value: 'D5', key: 'J' },
    { label: 'Eb5', value: 'Eb5', key: 'K' },
    { label: 'F5', value: 'F5', key: 'L' },
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
    { label: 'Asus2', value: ['A2', 'E3', 'A3', 'B3', 'E4'], key: 'E' },
    { label: 'G/B', value: ['B2', 'D3', 'G3', 'D4'], key: 'R' },
  ],
  STRINGS: [
    { label: 'Am9', value: ['A3', 'C4', 'E4', 'B4'], key: 'A', altKey: '1' },
    { label: 'Fmaj7', value: ['F3', 'A3', 'C4', 'E4'], key: 'S', altKey: '2' },
    { label: 'Cmaj9', value: ['C3', 'E3', 'G3', 'B3', 'D4'], key: 'D', altKey: '3' },
    { label: 'Gsus4', value: ['G3', 'C4', 'D4', 'G4'], key: 'F', altKey: '4' },
    { label: 'Dm7', value: ['D3', 'F3', 'A3', 'C4'], key: 'G', altKey: '5' },
    { label: 'Em7', value: ['E3', 'G3', 'B3', 'D4'], key: 'H', altKey: '6' },
    { label: 'Bbmaj7', value: ['Bb3', 'D4', 'F4', 'A4'], key: 'J', altKey: '7' },
    { label: 'Asus2', value: ['A3', 'B3', 'E4', 'A4'], key: 'K', altKey: '8' },
    { label: 'C/E', value: ['E3', 'G3', 'C4', 'E4'], key: 'L', altKey: '9' },
    { label: 'G/B', value: ['B3', 'D4', 'G4', 'B4'], key: ';', altKey: '0' },
    { label: 'F#m7b5', value: ['F#3', 'A3', 'C4', 'E4'], key: 'Q' },
    { label: 'Abmaj7', value: ['Ab3', 'C4', 'Eb4', 'G4'], key: 'W' },
    { label: 'Ebmaj7', value: ['Eb3', 'G3', 'Bb3', 'D4'], key: 'E' },
    { label: 'Bbsus4', value: ['Bb3', 'Eb4', 'F4', 'Bb4'], key: 'R' },
  ],
  PAD: [
    { label: 'Am9', value: ['A3', 'C4', 'E4', 'B4'], key: 'A', altKey: '1' },
    { label: 'Fmaj7', value: ['F3', 'A3', 'C4', 'E4'], key: 'S', altKey: '2' },
    { label: 'Cmaj9', value: ['C3', 'E3', 'G3', 'B3', 'D4'], key: 'D', altKey: '3' },
    { label: 'Gsus4', value: ['G3', 'C4', 'D4', 'G4'], key: 'F', altKey: '4' },
    { label: 'Dm7', value: ['D3', 'F3', 'A3', 'C4'], key: 'G', altKey: '5' },
    { label: 'Em7', value: ['E3', 'G3', 'B3', 'D4'], key: 'H', altKey: '6' },
    { label: 'Bbmaj7', value: ['Bb3', 'D4', 'F4', 'A4'], key: 'J', altKey: '7' },
    { label: 'Asus2', value: ['A3', 'B3', 'E4', 'A4'], key: 'K', altKey: '8' },
    { label: 'C/E', value: ['E3', 'G3', 'C4', 'E4'], key: 'L', altKey: '9' },
    { label: 'G/B', value: ['B3', 'D4', 'G4', 'B4'], key: ';', altKey: '0' },
    { label: 'F#m7b5', value: ['F#3', 'A3', 'C4', 'E4'], key: 'Q' },
    { label: 'Abmaj7', value: ['Ab3', 'C4', 'Eb4', 'G4'], key: 'W' },
    { label: 'Ebmaj7', value: ['Eb3', 'G3', 'Bb3', 'D4'], key: 'E' },
    { label: 'Bbsus4', value: ['Bb3', 'Eb4', 'F4', 'Bb4'], key: 'R' },
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
    <div style={{ width: '100%', height: '170px', padding: '0 16px 12px 16px', boxSizing: 'border-box', zIndex: 20 }}>
      <BottomInstrumentPanel
        instrumentId={instrumentId}
        instrumentName={instrumentName || instrumentId}
        instrumentColor={instrumentColor}
        onPlay={onPlay}
        onStop={onStop}
        activeNotes={activeNotes}
        isMuted={false}
        isVideoOff={false}
        onToggleMute={() => {}}
        onToggleVideo={() => {}}
      />
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

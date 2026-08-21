'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

export default function InstrumentPanel() {
  const {
    selectedInstrument,
    setSelectedInstrument,
    triggerLocalNote,
    isAudioStarted,
    startAudio,
    tanpuraDroneActive,
    toggleTanpuraDrone,
    keyboardEnabled,
    setKeyboardEnabled,
    hoverEnabled,
    setHoverEnabled
  } = useAudioEngine();

  const [activePad, setActivePad] = useState<string | null>(null);
  const [octave, setOctave] = useState(0);
  const lastHoverTimeRef = useRef<number>(0);

  // Exact 1-to-1 Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardEnabled) return;
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      const code = e.code;

      if (selectedInstrument === 'drums') {
        const drumKeyMap: Record<string, string> = {
          '1': 'Kick', 'Digit1': 'Kick', 'Numpad1': 'Kick', 'A': 'Kick',
          '2': 'Snare', 'Digit2': 'Snare', 'Numpad2': 'Snare', 'S': 'Snare',
          '3': 'Hi-Hat', 'Digit3': 'Hi-Hat', 'Numpad3': 'Hi-Hat', 'D': 'Hi-Hat',
          '4': 'Open Hat', 'Digit4': 'Open Hat', 'Numpad4': 'Open Hat', 'F': 'Open Hat',
          '5': 'Tom 1', 'Digit5': 'Tom 1', 'Numpad5': 'Tom 1', 'G': 'Tom 1',
          '6': 'Tom 2', 'Digit6': 'Tom 2', 'Numpad6': 'Tom 2', 'H': 'Tom 2',
          '7': 'Crash', 'Digit7': 'Crash', 'Numpad7': 'Crash', 'J': 'Crash',
          '8': 'Clap', 'Digit8': 'Clap', 'Numpad8': 'Clap', 'K': 'Clap'
        };
        const target = drumKeyMap[key] || drumKeyMap[code];
        if (target) handleTrigger(target);
      } else if (selectedInstrument === 'guitar') {
        const guitarMap: Record<string, string> = {
          '1': 'Em Chord', 'Digit1': 'Em Chord', 'A': 'Em Chord',
          '2': 'G Chord', 'Digit2': 'G Chord', 'S': 'G Chord',
          '3': 'C Chord', 'Digit3': 'C Chord', 'D': 'C Chord',
          '4': 'D Chord', 'Digit4': 'D Chord', 'F': 'D Chord',
          '5': 'Am Chord', 'Digit5': 'Am Chord', 'G': 'Am Chord',
          '6': 'F Chord', 'Digit6': 'F Chord', 'H': 'F Chord',
          '7': 'E2', '8': 'A2', '9': 'D3', '0': 'G3'
        };
        const target = guitarMap[key] || guitarMap[code];
        if (target) handleTrigger(target);
      } else if (selectedInstrument === 'keyboard') {
        // Standard Mockup Note sequence [A1, F1, G1, B1, C2, A2, F2, G2, B2, D2]
        const keyMap: Record<string, string> = {
          '1': 'A1', 'Digit1': 'A1', 'A': 'A1',
          '2': 'F1', 'Digit2': 'F1', 'S': 'F1',
          '3': 'G1', 'Digit3': 'G1', 'D': 'G1',
          '4': 'B1', 'Digit4': 'B1', 'F': 'B1',
          '5': 'C2', 'Digit5': 'C2', 'G': 'C2',
          '6': 'A2', 'Digit6': 'A2', 'H': 'A2',
          '7': 'F2', 'Digit7': 'F2', 'J': 'F2',
          '8': 'G2', 'Digit8': 'G2', 'K': 'G2',
          '9': 'B2', 'Digit9': 'B2', 'L': 'B2',
          '0': 'D2', 'Digit0': 'D2'
        };
        const target = keyMap[key] || keyMap[code];
        if (target) handleTrigger(target);
      } else if (selectedInstrument === 'sitar') {
        const sitarMap: Record<string, string> = {
          '1': 'C4', 'Digit1': 'C4', 'A': 'C4',
          '2': 'D4', 'Digit2': 'D4', 'S': 'D4',
          '3': 'E4', 'Digit3': 'E4', 'D': 'E4',
          '4': 'F#4', 'Digit4': 'F#4', 'F': 'F#4',
          '5': 'G4', 'Digit5': 'G4', 'G': 'G4',
          '6': 'A4', 'Digit6': 'A4', 'H': 'A4',
          '7': 'B4', 'Digit7': 'B4', 'J': 'B4',
          '8': 'C5', 'Digit8': 'C5', 'K': 'C5'
        };
        const target = sitarMap[key] || sitarMap[code];
        if (target) handleTrigger(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInstrument, octave, keyboardEnabled]);

  const handleTrigger = (note: string) => {
    if (!isAudioStarted) startAudio();
    setActivePad(note);
    triggerLocalNote(selectedInstrument, note);
    setTimeout(() => setActivePad(null), 180);
  };

  const handleHover = (note: string) => {
    if (!hoverEnabled) return;
    const now = Date.now();
    if (now - lastHoverTimeRef.current < 60) return;
    lastHoverTimeRef.current = now;
    handleTrigger(note);
  };

  // Sound Buttons corresponding to user mockup circular sound keys
  const mockupSoundKeys = [
    { label: 'A1', note: 'A1', key: '1' },
    { label: 'F1', note: 'F1', key: '2' },
    { label: 'G1', note: 'G1', key: '3' },
    { label: 'B1', note: 'B1', key: '4' },
    { label: 'C2', note: 'C2', key: '5' },
    { label: 'A1', note: 'A2', key: '6' },
    { label: 'F1', note: 'F2', key: '7' },
    { label: 'G1', note: 'G2', key: '8' },
    { label: 'B1', note: 'B2', key: '9' },
    { label: 'D2', note: 'D2', key: '0' }
  ];

  const drumsData = [
    { label: 'KICK', note: 'Kick', key: '1' },
    { label: 'SNARE', note: 'Snare', key: '2' },
    { label: 'HIHAT', note: 'Hi-Hat', key: '3' },
    { label: 'OPHAT', note: 'Open Hat', key: '4' },
    { label: 'TOM 1', note: 'Tom 1', key: '5' },
    { label: 'TOM 2', note: 'Tom 2', key: '6' },
    { label: 'CRASH', note: 'Crash', key: '7' },
    { label: 'CLAP', note: 'Clap', key: '8' },
    { label: 'SHAKE', note: 'Hi-Hat', key: '9' },
    { label: 'COWBL', note: 'Crash', key: '0' }
  ];

  const guitarData = [
    { label: 'Em', note: 'Em Chord', key: '1' },
    { label: 'G', note: 'G Chord', key: '2' },
    { label: 'C', note: 'C Chord', key: '3' },
    { label: 'D', note: 'D Chord', key: '4' },
    { label: 'Am', note: 'Am Chord', key: '5' },
    { label: 'F', note: 'F Chord', key: '6' },
    { label: 'E2', note: 'E2', key: '7' },
    { label: 'A2', note: 'A2', key: '8' },
    { label: 'D3', note: 'D3', key: '9' },
    { label: 'G3', note: 'G3', key: '0' }
  ];

  const sitarData = [
    { label: 'Sa', note: 'C4', key: '1' },
    { label: 'Re', note: 'D4', key: '2' },
    { label: 'Ga', note: 'E4', key: '3' },
    { label: 'Ma', note: 'F#4', key: '4' },
    { label: 'Pa', note: 'G4', key: '5' },
    { label: 'Dha', note: 'A4', key: '6' },
    { label: 'Ni', note: 'B4', key: '7' },
    { label: 'Sȧ', note: 'C5', key: '8' },
    { label: 'Rė', note: 'D5', key: '9' },
    { label: 'Gȧ', note: 'E5', key: '0' }
  ];

  const currentKeySet =
    selectedInstrument === 'drums' ? drumsData :
    selectedInstrument === 'guitar' ? guitarData :
    selectedInstrument === 'sitar' ? sitarData :
    mockupSoundKeys;

  return (
    <div style={panelContainerStyle}>
      {/* Top Controls Row */}
      <div style={panelHeaderStyle}>
        {/* Instrument Tabs */}
        <div style={tabsContainerStyle}>
          {[
            { id: 'keyboard', label: '🎹 KEYBOARD' },
            { id: 'guitar', label: '🎸 GUITAR' },
            { id: 'drums', label: '🥁 DRUMS' },
            { id: 'sitar', label: '🪕 SITAR (INDIAN)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (!isAudioStarted) startAudio();
                setSelectedInstrument(tab.id as any);
              }}
              style={{
                ...tabBtnStyle,
                background: selectedInstrument === tab.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderColor: selectedInstrument === tab.id ? '#ffffff' : 'transparent',
                color: selectedInstrument === tab.id ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mode Toggles: Keyboard Enable & Hover Enable */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setKeyboardEnabled(prev => !prev)}
            style={{
              ...toggleBtnStyle,
              borderColor: keyboardEnabled ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)',
              background: keyboardEnabled ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
              color: keyboardEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)'
            }}
          >
            ⌨ KEYBOARD: <b>{keyboardEnabled ? 'ON' : 'OFF'}</b>
          </button>

          <button
            onClick={() => setHoverEnabled(prev => !prev)}
            style={{
              ...toggleBtnStyle,
              borderColor: hoverEnabled ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.15)',
              background: hoverEnabled ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 0, 0, 0.4)',
              color: hoverEnabled ? 'var(--accent-green)' : 'var(--text-muted)'
            }}
          >
            🖐 HOVER: <b>{hoverEnabled ? 'ON' : 'OFF'}</b>
          </button>

          {selectedInstrument === 'sitar' && (
            <button
              onClick={toggleTanpuraDrone}
              style={{
                ...toggleBtnStyle,
                borderColor: tanpuraDroneActive ? '#ff7b00' : 'rgba(255, 123, 0, 0.3)',
                background: tanpuraDroneActive ? 'rgba(255, 123, 0, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                color: tanpuraDroneActive ? '#fff' : '#ff7b00'
              }}
            >
              🕉 TANPURA: <b>{tanpuraDroneActive ? 'ON' : 'OFF'}</b>
            </button>
          )}
        </div>
      </div>

      {/* Sleek Circular Touch Sound Keys Matching Mockup */}
      <div style={keysRowStyle}>
        {currentKeySet.map((k, i) => {
          const isHit = activePad === k.note;
          return (
            <button
              key={i}
              onClick={() => handleTrigger(k.note)}
              onMouseEnter={() => handleHover(k.note)}
              style={{
                ...circularKeyBtnStyle,
                background: isHit
                  ? '#ffffff'
                  : 'rgba(215, 220, 228, 0.85)',
                color: isHit ? '#000000' : '#1e2330',
                transform: isHit ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                boxShadow: isHit ? '0 0 20px rgba(255, 255, 255, 0.9)' : '0 4px 10px rgba(0, 0, 0, 0.3)'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800 }}>{k.label}</span>
              <span style={keyHintBadgeStyle}>[{k.key}]</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const panelContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 18px',
  borderRadius: '20px',
  background: 'rgba(15, 18, 26, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  height: '100%',
  justifyContent: 'space-between'
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px'
};

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  background: 'rgba(0, 0, 0, 0.4)',
  padding: '3px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const tabBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '7px',
  border: '1px solid',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const toggleBtnStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  padding: '4px 9px',
  borderRadius: '8px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const keysRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'nowrap',
  padding: '6px 0',
  overflowX: 'auto'
};

const circularKeyBtnStyle: React.CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
  position: 'relative',
  flexShrink: 0
};

const keyHintBadgeStyle: React.CSSProperties = {
  fontSize: '8.5px',
  fontWeight: 700,
  color: 'rgba(30, 35, 48, 0.65)',
  fontFamily: 'var(--font-mono)',
  marginTop: '1px'
};

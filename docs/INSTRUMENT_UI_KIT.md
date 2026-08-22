# 🎸🎹🥁 JAMSHAM INSTRUMENT UI KIT & COLLECTION
> **Branch**: `DebInst`  
> **Purpose**: A self-contained reference bundle of all custom instrument UIs (SoundTrap Piano Keyboard, SoundTrap Guitar/Bass Matrix, Figma Acoustic Drums, Hover Play Mode, and Lobby Selection) for seamless manual porting into `main`.

---

## 📋 Overview of Included Instruments

| Instrument | UI Component | Key Features | Mapped IDs |
| :--- | :--- | :--- | :--- |
| **🎹 Grand Piano** | SoundTrap C3–C5 Keyboard | 17 White Keys, 12 Black Keys, Octave labels, Keycap badges (`Z-I` & `S-8`), Accent color bottom border | `PIANO`, `KEYBOARD`, `LEAD` |
| **🎸 Electric Bass / Guitar** | SoundTrap 8-Chord Fretboard Matrix | 8 Chord Columns (C Maj, G Maj, A Min, F Maj, E Min, D Min, E Maj, D Maj), 6 String Lanes, Fretboard Blocks, Keycap badges (`A-K`), Top Style/Strum bar | `BASS`, `GUITAR` |
| **🥁 Acoustic Drums** | Figma Pad Row | 8 Enlarged Circular Drum Pads (76px), Vector Drum SVG Icons, Set Stroke Colors (Shells `#FF2D55`, Toms `#FF6D00`, Cymbals `#00E676`, Aux `#00E5FF`), Video Ring Glow Halo | `DRUMS`, `DRUM` |
| **⚡ Hover Play Mode** | Side Toggle Control Button | Side Toggle Button (`⚡ HOVER ON` / `🖱️ HOVER OFF`), cursor hover trigger without clicking, drag-glissando across pads/keys | Applicable to All Instruments |

---

## 📁 File Structure & Key Files

```
jam-app/
├── src/
│   ├── components/
│   │   ├── BottomInstrumentPanel.tsx  # Core UI rendering engine (Piano, Guitar, Drums, Hover Toggle)
│   │   ├── Lobby.tsx                  # Pre-join Lobby instrument role selector (DRUMS, PIANO, BASS, AUTO)
│   │   └── stage/
│   │       └── NoteTriggerDeck.tsx    # Bottom deck container passing instrumentProps & color
│   ├── lib/
│   │   ├── audioEngine.ts             # Tone.js synthesis engine with fuzzy dispatch for DRUMS/PIANO/BASS
│   │   └── webrtcManager.ts           # WebRTC manager with preferredInstrument parameter support
│   └── app/
│       └── page.tsx                   # Main room page passing preferredInstrument to WebRTC & AudioEngine
server/
└── index.js                           # Node.js Socket.io backend assigning preferredInstrument from room payload
```

---

## 🧩 1. Core Instrument UI Component (`BottomInstrumentPanel.tsx`)

```tsx
'use client';
import React, { useState, useEffect } from 'react';

interface BottomInstrumentPanelProps {
  instrumentId: string;
  instrumentName: string;
  instrumentColor?: string;
  onPlay: (noteOrSound: string | string[], velocity?: number) => void;
  onStop?: (noteOrSound: string | string[]) => void;
  activeNotes?: string[];
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
}

export default function BottomInstrumentPanel({
  instrumentId,
  instrumentName,
  instrumentColor = '#FF6D00',
  onPlay,
  onStop,
  activeNotes = [],
}: BottomInstrumentPanelProps) {
  const [localPressed, setLocalPressed] = useState<string[]>([]);
  const [isHoverPlayMode, setIsHoverPlayMode] = useState<boolean>(false);
  const displayNotes = Array.from(new Set([...activeNotes, ...localPressed]));

  const ACCENT_COLOR = instrumentColor || '#FF6D00';
  const isMouseDownRef = React.useRef(false);
  const activeHoverIdRef = React.useRef<string | null>(null);

  // --- 1. PIANO KEYBOARD PRESETS (SoundTrap C3-C5) ---
  const keyboardWhiteKeys = [
    { note: 'C3', label: 'Z' }, { note: 'D3', label: 'X' }, { note: 'E3', label: 'C' },
    { note: 'F3', label: 'V' }, { note: 'G3', label: 'B' }, { note: 'A3', label: 'N' },
    { note: 'B3', label: 'M' },
    { note: 'C4', label: ',' }, { note: 'D4', label: '.' }, { note: 'E4', label: 'Q' },
    { note: 'F4', label: 'W' }, { note: 'G4', label: 'E' }, { note: 'A4', label: 'R' },
    { note: 'B4', label: 'T' },
    { note: 'C5', label: 'Y' }, { note: 'D5', label: 'U' }, { note: 'E5', label: 'I' },
  ];

  const keyboardBlackKeys = [
    { note: 'C#3', label: 'S', posIndex: 0 },
    { note: 'D#3', label: 'D', posIndex: 1 },
    { note: 'F#3', label: 'G', posIndex: 3 },
    { note: 'G#3', label: 'H', posIndex: 4 },
    { note: 'A#3', label: 'J', posIndex: 5 },
    { note: 'C#4', label: 'L', posIndex: 7 },
    { note: 'D#4', label: '1', posIndex: 8 },
    { note: 'F#4', label: '3', posIndex: 10 },
    { note: 'G#4', label: '4', posIndex: 11 },
    { note: 'A#4', label: '5', posIndex: 12 },
    { note: 'C#5', label: '7', posIndex: 14 },
    { note: 'D#5', label: '8', posIndex: 15 },
  ];

  const keyToNoteMap: Record<string, string> = {
    z: 'C3', s: 'C#3', x: 'D3', d: 'D#3', c: 'E3', v: 'F3', g: 'F#3', b: 'G3', h: 'G#3', n: 'A3', j: 'A#3', m: 'B3',
    ',': 'C4', l: 'C#4', '.': 'D4', '1': 'D#4', q: 'E4', w: 'F4', '3': 'F#4', e: 'G4', '4': 'G#4', r: 'A4', '5': 'A#4', t: 'B4',
    y: 'C5', '7': 'C#5', u: 'D5', '8': 'D#5', i: 'E5',
  };

  // --- 2. GUITAR & BASS CHORD SEQUENCER MATRIX PRESETS ---
  const guitarStrings = ['E', 'B', 'G', 'D', 'A', 'E'];

  const guitarChords = [
    { id: 'C_MAJOR', name: 'C Maj', key: 'A', notes: ['C3', 'G3', 'C4', 'E4', 'G4'], activeStringIndices: [1, 2, 3, 4], bg: '#3D3028' },
    { id: 'G_MAJOR', name: 'G Maj', key: 'S', notes: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'], activeStringIndices: [0, 1, 2, 3, 4, 5], bg: '#544237' },
    { id: 'A_MINOR', name: 'A Min', key: 'D', notes: ['A2', 'E3', 'A3', 'C4', 'E4'], activeStringIndices: [0, 1, 2, 3, 4], bg: '#6B5446' },
    { id: 'F_MAJOR', name: 'F Maj', key: 'F', notes: ['F2', 'C3', 'F3', 'A3', 'C4'], activeStringIndices: [1, 2, 3, 4, 5], bg: '#7E6352' },
    { id: 'E_MINOR', name: 'E Min', key: 'G', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], activeStringIndices: [0, 1, 2, 3, 4, 5], bg: '#48382F' },
    { id: 'D_MINOR', name: 'D Min', key: 'H', notes: ['D3', 'A3', 'D4', 'F4'], activeStringIndices: [0, 1, 2, 3], bg: '#5F4B3F' },
    { id: 'E_MAJOR', name: 'E Maj', key: 'J', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], activeStringIndices: [0, 1, 2, 3, 4, 5], bg: '#755B4D' },
    { id: 'D_MAJOR', name: 'D Maj', key: 'K', notes: ['D3', 'A3', 'D4', 'F#4'], activeStringIndices: [0, 1, 2, 3], bg: '#45352C' },
  ];

  const guitarKeyMap: Record<string, { id: string; notes: string[] }> = {
    a: { id: 'C_MAJOR', notes: ['C3', 'G3', 'C4', 'E4', 'G4'] },
    s: { id: 'G_MAJOR', notes: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'] },
    d: { id: 'A_MINOR', notes: ['A2', 'E3', 'A3', 'C4', 'E4'] },
    f: { id: 'F_MAJOR', notes: ['F2', 'C3', 'F3', 'A3', 'C4'] },
    g: { id: 'E_MINOR', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'] },
    h: { id: 'D_MINOR', notes: ['D3', 'A3', 'D4', 'F4'] },
    j: { id: 'E_MAJOR', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'] },
    k: { id: 'D_MAJOR', notes: ['D3', 'A3', 'D4', 'F#4'] },
  };

  // --- 3. ACOUSTIC DRUMS PRESETS (Figma Layout + Stroke Sets + Glow) ---
  const drumPads = [
    { id: 'KICK', name: 'Kick', key: 'A', strokeColor: '#FF2D55', setGroup: 'BASS_SNARE', icon: 'kick' },
    { id: 'SNARE', name: 'Snare', key: 'S', strokeColor: '#FF2D55', setGroup: 'BASS_SNARE', icon: 'snare' },
    { id: 'HIHAT', name: 'Hi-Hat', key: 'D', strokeColor: '#00E676', setGroup: 'CYMBALS', icon: 'hihat' },
    { id: 'TOM 1', name: 'Tom 1', key: 'F', strokeColor: '#FF6D00', setGroup: 'TOMS', icon: 'tom' },
    { id: 'TOM 2', name: 'Tom 2', key: 'G', strokeColor: '#FF6D00', setGroup: 'TOMS', icon: 'tom' },
    { id: 'CRASH', name: 'Crash', key: 'H', strokeColor: '#00E676', setGroup: 'CYMBALS', icon: 'crash' },
    { id: 'CLAP', name: 'Clap', key: 'J', strokeColor: '#00E5FF', setGroup: 'PERC', icon: 'clap' },
    { id: 'COWBELL', name: 'Cowbell', key: 'K', strokeColor: '#00E5FF', setGroup: 'PERC', icon: 'cowbell' },
  ];

  const drumKeyMap: Record<string, string> = {
    a: 'KICK', s: 'SNARE', d: 'HIHAT', f: 'TOM 1', g: 'TOM 2', h: 'CRASH', j: 'CLAP', k: 'COWBELL'
  };

  const triggerNoteOn = (noteOrChordId: string, chordNotes?: string[]) => {
    if (!localPressed.includes(noteOrChordId)) {
      setLocalPressed((prev) => [...prev, noteOrChordId]);
    }
    if ((instrumentId === 'GUITAR' || instrumentId === 'BASS') && chordNotes) {
      onPlay(chordNotes, 0.9);
    } else {
      onPlay(noteOrChordId, 0.9);
    }
  };

  const triggerNoteOff = (noteOrChordId: string) => {
    setLocalPressed((prev) => prev.filter((n) => n !== noteOrChordId));
    if (onStop) onStop(noteOrChordId);
  };

  // --- 4. HOVER PLAY & CLICK-AND-DRAG (GLISSANDO) HANDLERS ---
  const handleItemMouseDown = (id: string, notes?: string[]) => {
    isMouseDownRef.current = true;
    if (activeHoverIdRef.current && activeHoverIdRef.current !== id) {
      triggerNoteOff(activeHoverIdRef.current);
    }
    activeHoverIdRef.current = id;
    triggerNoteOn(id, notes);
  };

  const handleItemMouseEnter = (id: string, notes?: string[]) => {
    if (isHoverPlayMode || isMouseDownRef.current) {
      if (activeHoverIdRef.current && activeHoverIdRef.current !== id) {
        triggerNoteOff(activeHoverIdRef.current);
      }
      activeHoverIdRef.current = id;
      triggerNoteOn(id, notes);
    }
  };

  const handleItemMouseLeave = (id: string) => {
    if (isHoverPlayMode || (isMouseDownRef.current && activeHoverIdRef.current === id)) {
      triggerNoteOff(id);
      if (activeHoverIdRef.current === id) {
        activeHoverIdRef.current = null;
      }
    }
  };

  const handleItemMouseUp = (id: string) => {
    if (!isHoverPlayMode) {
      isMouseDownRef.current = false;
      triggerNoteOff(id);
      if (activeHoverIdRef.current === id) {
        activeHoverIdRef.current = null;
      }
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (activeHoverIdRef.current) {
          triggerNoteOff(activeHoverIdRef.current);
          activeHoverIdRef.current = null;
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
      const key = e.key.toLowerCase();

      const normalized = (instrumentId || '').toUpperCase();
      if (normalized.includes('DRUM')) {
        const drumSound = drumKeyMap[key];
        if (drumSound && !localPressed.includes(drumSound)) {
          triggerNoteOn(drumSound);
        }
      } else if (normalized.includes('GUITAR') || normalized.includes('BASS')) {
        const chordInfo = guitarKeyMap[key];
        if (chordInfo && !localPressed.includes(chordInfo.id)) {
          triggerNoteOn(chordInfo.id, chordInfo.notes);
        }
      } else {
        const targetNote = keyToNoteMap[key];
        if (targetNote && !localPressed.includes(targetNote)) {
          triggerNoteOn(targetNote);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      const normalized = (instrumentId || '').toUpperCase();
      if (normalized.includes('DRUM')) {
        const drumSound = drumKeyMap[key];
        if (drumSound) triggerNoteOff(drumSound);
      } else if (normalized.includes('GUITAR') || normalized.includes('BASS')) {
        const chordInfo = guitarKeyMap[key];
        if (chordInfo) triggerNoteOff(chordInfo.id);
      } else {
        const targetNote = keyToNoteMap[key];
        if (targetNote) triggerNoteOff(targetNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [localPressed, instrumentId]);

  const normalizedInst = (instrumentId || '').toUpperCase();
  const isDrum = normalizedInst.includes('DRUM');
  const isGuitarOrBass = normalizedInst.includes('GUITAR') || normalizedInst.includes('BASS');

  return (
    <div style={panelWrapperStyle}>
      <div style={{ width: '100%', height: '100%', display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* Main Instrument Playing Surface */}
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {isDrum ? (
            /* FIGMA ACOUSTIC DRUMS UI */
            <div style={figmaDrumWrapper}>
              <div style={figmaDrumRow}>
                {drumPads.map((pad) => {
                  const isActive = displayNotes.includes(pad.id);
                  return (
                    <button
                      key={pad.id}
                      onMouseDown={() => handleItemMouseDown(pad.id)}
                      onMouseEnter={() => handleItemMouseEnter(pad.id)}
                      onMouseLeave={() => handleItemMouseLeave(pad.id)}
                      onMouseUp={() => handleItemMouseUp(pad.id)}
                      style={{
                        ...figmaDrumBtnStyle,
                        border: isActive ? `5px solid ${ACCENT_COLOR}` : `3px solid ${pad.strokeColor}`,
                        boxShadow: isActive
                          ? `0 0 26px ${ACCENT_COLOR}, 0 0 45px ${ACCENT_COLOR}90`
                          : '0 4px 12px rgba(0,0,0,0.4)',
                        transform: isActive ? 'scale(0.93)' : 'scale(1)',
                      }}
                    >
                      <div style={figmaInnerCapStyle}>
                        {renderDrumIcon(pad.icon)}
                        <span style={figmaKeyBadgeStyle}>{pad.key}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isGuitarOrBass ? (
            /* SOUNDTRAP GUITAR & BASS CHORD SEQUENCER MATRIX UI */
            <div style={soundtrapGuitarWrapper}>
              <div style={soundtrapTopBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={stLabelStyle}>STYLE</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} style={stDotStyle(i === 3)} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={stLabelStyle}>STRUM</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} style={stPillStyle(i === 2)} />
                    ))}
                  </div>
                </div>

                <span style={stAllBtn}>ALL ●</span>
              </div>

              <div style={fretboardContainer}>
                <div style={stringLabelsColumn}>
                  {guitarStrings.map((str, idx) => (
                    <div key={idx} style={stringLabelBox}>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>

                <div style={chordColumnsGrid}>
                  {guitarChords.map((chord) => {
                    const isActive = displayNotes.includes(chord.id);
                    return (
                      <div
                        key={chord.id}
                        onMouseDown={() => handleItemMouseDown(chord.id, chord.notes)}
                        onMouseEnter={() => handleItemMouseEnter(chord.id, chord.notes)}
                        onMouseLeave={() => handleItemMouseLeave(chord.id)}
                        onMouseUp={() => handleItemMouseUp(chord.id)}
                        style={{
                          ...chordColumnStyle,
                          background: isActive ? '#8C6849' : chord.bg,
                          boxShadow: isActive ? 'inset 0 0 15px rgba(255,255,255,0.4), 0 0 10px #D8C3A5' : 'none',
                          transform: isActive ? 'scale(0.98)' : 'none',
                        }}
                      >
                        {guitarStrings.map((_, sIdx) => {
                          const hasNote = chord.activeStringIndices.includes(sIdx);
                          return (
                            <div key={sIdx} style={stringLaneStyle}>
                              <div style={stringLineStyle} />
                              {hasNote && (
                                <div
                                  style={{
                                    ...noteBlockStyle,
                                    background: isActive ? '#FFFFFF' : '#F5EBE0',
                                    boxShadow: isActive ? '0 0 8px #FFF' : '0 1px 3px rgba(0,0,0,0.5)',
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}

                        <div style={{ ...chordFooterBadge, background: isActive ? '#221A15' : 'rgba(0,0,0,0.5)' }}>
                          <span style={{ color: '#D8C3A5', fontWeight: 800 }}>{chord.key}</span>
                          <span style={{ color: '#fff', fontSize: '8px' }}>{chord.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* SOUNDTRAP GRAND PIANO KEYBOARD UI (C3-C5) */
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={keyboardContainerStyle}>
                <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                  {keyboardWhiteKeys.map((k) => {
                    const isActive = displayNotes.includes(k.note);
                    const isOctaveStart = k.note.startsWith('C');
                    return (
                      <button
                        key={k.note}
                        onMouseDown={() => handleItemMouseDown(k.note)}
                        onMouseEnter={() => handleItemMouseEnter(k.note)}
                        onMouseLeave={() => handleItemMouseLeave(k.note)}
                        onMouseUp={() => handleItemMouseUp(k.note)}
                        style={{
                          flex: 1,
                          position: 'relative',
                          background: isActive ? '#E2D9FF' : '#EAEAEA',
                          border: '1px solid #C2C2CB',
                          borderBottom: isActive ? `6px solid ${ACCENT_COLOR}` : '4px solid #B0B0BB',
                          borderRadius: '0 0 6px 6px',
                          margin: '0 1px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 2px',
                          outline: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {isOctaveStart ? (
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#666' }}>{k.note}</span>
                        ) : <span />}

                        <span style={whiteKeyBadgeStyle}>{k.label}</span>
                      </button>
                    );
                  })}
                </div>

                {keyboardBlackKeys.map((k) => {
                  const isActive = displayNotes.includes(k.note);
                  const totalWhiteKeys = keyboardWhiteKeys.length;
                  const leftPct = ((k.posIndex + 0.65) / totalWhiteKeys) * 100;
                  const widthPct = (0.7 / totalWhiteKeys) * 100;

                  return (
                    <button
                      key={k.note}
                      onMouseDown={() => handleItemMouseDown(k.note)}
                      onMouseEnter={() => handleItemMouseEnter(k.note)}
                      onMouseLeave={() => handleItemMouseLeave(k.note)}
                      onMouseUp={() => handleItemMouseUp(k.note)}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: 0,
                        width: `${widthPct}%`,
                        height: '60%',
                        background: isActive ? ACCENT_COLOR : '#22222E',
                        border: '1px solid #111',
                        borderBottom: isActive ? `4px solid ${ACCENT_COLOR}` : '3px solid #0D0D14',
                        borderRadius: '0 0 5px 5px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        paddingTop: '6px',
                        outline: 'none',
                        zIndex: 10,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                        userSelect: 'none',
                      }}
                    >
                      <span style={blackKeyBadgeStyle}>{k.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Hover Mode Toggle Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingRight: '4px' }}>
          <button
            type="button"
            onClick={() => setIsHoverPlayMode((prev) => !prev)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '10px 8px',
              borderRadius: '12px',
              fontSize: '9px',
              fontWeight: '800',
              letterSpacing: '0.6px',
              cursor: 'pointer',
              border: isHoverPlayMode ? `2px solid ${ACCENT_COLOR}` : '1px solid rgba(255,255,255,0.18)',
              background: isHoverPlayMode ? `${ACCENT_COLOR}25` : 'rgba(18, 19, 26, 0.85)',
              color: isHoverPlayMode ? '#FFFFFF' : '#888888',
              boxShadow: isHoverPlayMode ? `0 0 18px ${ACCENT_COLOR}77, 0 0 30px ${ACCENT_COLOR}40` : '0 4px 10px rgba(0,0,0,0.5)',
              transform: isHoverPlayMode ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)',
              userSelect: 'none',
              outline: 'none',
              minWidth: '64px',
            }}
            title="Toggle Hover Mode: When ON, simply moving cursor over keys/pads triggers notes instantly!"
          >
            <span style={{ fontSize: '15px' }}>{isHoverPlayMode ? '⚡' : '🖱️'}</span>
            <span style={{ textAlign: 'center', lineHeight: '1.1', color: isHoverPlayMode ? ACCENT_COLOR : '#AAA' }}>
              {isHoverPlayMode ? 'HOVER ON' : 'HOVER OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CSS STYLES & SVG HELPERS ---
const renderDrumIcon = (icon: string) => {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {icon === 'snare' || icon === 'tom' ? (
        <>
          <rect x="4" y="8" width="16" height="8" rx="2" />
          <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
        </>
      ) : icon === 'hihat' || icon === 'crash' ? (
        <>
          <ellipse cx="12" cy="9.5" rx="7.5" ry="2.5" />
          <line x1="12" y1="12" x2="12" y2="18" />
        </>
      ) : icon === 'kick' ? (
        <>
          <circle cx="12" cy="11" r="6" />
          <path d="M8 17l-2 3M16 17l2 3" />
        </>
      ) : (
        <circle cx="12" cy="12" r="5" />
      )}
    </svg>
  );
};

const panelWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'transparent',
  border: 'none',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const figmaDrumWrapper: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  userSelect: 'none',
};

const figmaDrumRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '18px',
  width: '100%',
  height: '100%',
};

const figmaDrumBtnStyle: React.CSSProperties = {
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  background: '#14151B',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  outline: 'none',
  padding: 0,
  transition: 'all 0.08s cubic-bezier(0.2, 0.8, 0.4, 1)',
};

const figmaInnerCapStyle: React.CSSProperties = {
  width: '84%',
  height: '84%',
  borderRadius: '50%',
  background: 'radial-gradient(circle at 35% 35%, #2B2E38, #181920)',
  border: '2px solid #0D0E12',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.6)',
};

const figmaKeyBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '800',
  color: '#BBB',
  marginTop: '2px',
};

const keyboardContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#181820',
  borderRadius: '8px',
  border: '1px solid #333344',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
};

const whiteKeyBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '4px',
};

const blackKeyBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#FFF',
};

const soundtrapGuitarWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  background: '#2B221B',
  borderRadius: '8px',
  border: '1px solid #4A3A2F',
  overflow: 'hidden',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
};

const soundtrapTopBar: React.CSSProperties = {
  height: '24px',
  background: '#1F1813',
  borderBottom: '1px solid #3A2E25',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  userSelect: 'none',
};

const stLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: '#8A7363',
  letterSpacing: '0.5px',
};

const stDotStyle = (active: boolean): React.CSSProperties => ({
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: active ? '#D8C3A5' : '#4A3B30',
});

const stPillStyle = (active: boolean): React.CSSProperties => ({
  width: '10px',
  height: '4px',
  borderRadius: '2px',
  background: active ? '#D8C3A5' : '#4A3B30',
});

const stAllBtn: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: '#D8C3A5',
  cursor: 'pointer',
};

const fretboardContainer: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  width: '100%',
  height: '100%',
};

const stringLabelsColumn: React.CSSProperties = {
  width: '28px',
  background: '#221A15',
  borderRight: '2px solid #1A130F',
  display: 'flex',
  flexDirection: 'column',
};

const stringLabelBox: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  fontWeight: 800,
  color: '#8A7363',
  borderBottom: '1px solid #2D221C',
};

const chordColumnsGrid: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  height: '100%',
  gap: '1px',
  background: '#1A130F',
};

const chordColumnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.08s ease',
  outline: 'none',
};

const stringLaneStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const stringLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '1px',
  background: 'rgba(255, 255, 255, 0.15)',
};

const noteBlockStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  width: '75%',
  height: '65%',
  borderRadius: '2px',
  transition: 'all 0.06s ease',
};

const chordFooterBadge: React.CSSProperties = {
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  borderTop: '1px solid rgba(0, 0, 0, 0.4)',
  userSelect: 'none',
};
```

---

## 🎧 2. Audio Engine Fuzzy Dispatcher (`audioEngine.ts`)

```typescript
  // Trigger Note / Drum Hit with case-insensitive fuzzy dispatch
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.8) {
    if (!this.isInitialized) return;

    try {
      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }

      const now = Tone.now();
      const id = (instrumentId || '').toUpperCase();

      if (id.includes('DRUM')) {
        this.playDrumSound(noteOrType as string, velocity, now);
      } else if (id.includes('GUITAR') || id.includes('BASS')) {
        if (this.guitarSynth) {
          if (Array.isArray(noteOrType)) {
            noteOrType.forEach((n, idx) => {
              this.guitarSynth?.triggerAttack(n, now + idx * 0.03);
            });
          } else if (typeof noteOrType === 'string') {
            this.guitarSynth.triggerAttack(noteOrType, now);
          }
        }
      } else if (id.includes('TRUMPET') || id.includes('SAX') || id.includes('BRASS')) {
        if (this.trumpetSynth) {
          this.trumpetSynth.triggerAttackRelease(noteOrType, duration, now, velocity);
        }
      } else {
        // Default to Grand Piano / Keyboard PolySynth
        if (this.keyboardSynth) {
          this.keyboardSynth.triggerAttackRelease(noteOrType, duration, now, velocity);
        }
      }
    } catch (e) {
      console.warn('[AudioEngine] Play error:', e);
    }
  }
```

---

## 🚪 3. Lobby Role Selector (`Lobby.tsx`)

```tsx
const INSTRUMENT_OPTIONS = [
  { id: 'DRUMS', name: 'Acoustic Drums', role: 'Rhythm & Beats', color: '#FF5722', icon: '🥁' },
  { id: 'PIANO', name: 'Grand Piano', role: 'Melody & Harmony', color: '#00E676', icon: '🎹' },
  { id: 'BASS', name: 'Electric Bass', role: 'Groove & Low End', color: '#E040FB', icon: '🎸' },
  { id: 'AUTO', name: 'Auto-Assign', role: 'Random Assignment', color: '#9E9E9E', icon: '🎲' },
];
```

---

## 🛠️ Instructions for Merging to `main` Branch (When You Choose):

1. **Copy `BottomInstrumentPanel.tsx`**: Replace `jam-app/src/components/BottomInstrumentPanel.tsx`.
2. **Update `audioEngine.ts`**: Replace `playNote` and `stopNote` with the fuzzy dispatch method shown above.
3. **Update `Lobby.tsx`**: Include `INSTRUMENT_OPTIONS` and pass `selectedInstrument` to `onJoin`.
4. **Update `server/index.js`**: Accept `preferredInstrumentId` in socket `join_room` handler.

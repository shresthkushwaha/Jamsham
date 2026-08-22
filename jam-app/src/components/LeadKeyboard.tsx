'use client';
import React, { useState, useEffect, useRef } from 'react';

// Helper types
type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface KnobProps {
  label: string;
  color: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
  formatValue: (val: number) => string;
}

// Draggable Knob Component mimicking OP-1 encoders
function OP1Knob({ label, color, value, onChange, formatValue }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaY = startY.current - e.clientY; // drag up to increase
    const sensitivity = 0.005;
    const newValue = Math.max(0, Math.min(1, startValue.current + deltaY * sensitivity));
    onChange(newValue);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Convert 0-1 value to rotation degrees (-135 to 135)
  const rotation = -135 + value * 270;

  return (
    <div className="op1-knob-container">
      <div 
        ref={knobRef}
        className="op1-knob"
        style={{ backgroundColor: color }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="op1-knob-pointer"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 15px' }}
        />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: color, filter: 'brightness(0.7)' }}>
        {formatValue(value)}
      </span>
    </div>
  );
}

interface LeadKeyboardProps {
  onPlay?: (note: string) => void;
  onStop?: (note: string) => void;
  activeNotes?: string[];
  disabled?: boolean;
}

export default function LeadKeyboard({ onPlay, onStop, activeNotes = [], disabled = false }: LeadKeyboardProps) {
  // OP-1 Parameters
  const [waveVal, setWaveVal] = useState(0.25);   // 0-1 -> sine, triangle, sawtooth, square
  const [attackVal, setAttackVal] = useState(0.05); // 0-1 -> 0.01s to 1.5s
  const [releaseVal, setReleaseVal] = useState(0.3); // 0-1 -> 0.1s to 3.0s
  const [cutoffVal, setCutoffVal] = useState(0.6);   // 0-1 -> 100Hz to 6000Hz

  const getWaveform = (val: number): WaveformType => {
    if (val < 0.25) return 'sine';
    if (val < 0.5) return 'triangle';
    if (val < 0.75) return 'sawtooth';
    return 'square';
  };

  const [localPressed, setLocalPressed] = useState<string[]>([]);
  const displayNotes = Array.from(new Set([...activeNotes, ...localPressed]));

  // Handle playing notes
  const triggerNoteOn = (note: string) => {
    if (disabled) return;
    if (!localPressed.includes(note)) {
      setLocalPressed(prev => [...prev, note]);
    }
    onPlay?.(note);
  };

  const triggerNoteOff = (note: string) => {
    if (disabled) return;
    setLocalPressed(prev => prev.filter(n => n !== note));
    onStop?.(note);
  };

  // Keyboard layout mappings
  const keyboardMap: { [key: string]: string } = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4', 't': 'F#4',
    'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4', 'k': 'C5', 'o': 'C#5',
    'l': 'D5', 'p': 'D#5', ';': 'E5'
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
      const note = keyboardMap[e.key.toLowerCase()];
      if (note && !localPressed.includes(note)) {
        triggerNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const note = keyboardMap[e.key.toLowerCase()];
      if (note) {
        triggerNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, localPressed]);

  // Notes defined for keys rendering
  const whiteKeys = [
    { note: 'C4', label: 'A' },
    { note: 'D4', label: 'S' },
    { note: 'E4', label: 'D' },
    { note: 'F4', label: 'F' },
    { note: 'G4', label: 'G' },
    { note: 'A4', label: 'H' },
    { note: 'B4', label: 'J' },
    { note: 'C5', label: 'K' },
    { note: 'D5', label: 'L' },
    { note: 'E5', label: ';' }
  ];

  const blackKeys = [
    { note: 'C#4', label: 'W', leftOffset: 34 },
    { note: 'D#4', label: 'E', leftOffset: 76 },
    { note: 'F#4', label: 'T', leftOffset: 160 },
    { note: 'G#4', label: 'Y', leftOffset: 202 },
    { note: 'A#4', label: 'U', leftOffset: 244 },
    { note: 'C#5', label: 'O', leftOffset: 328 },
    { note: 'D#5', label: 'P', leftOffset: 370 }
  ];

  return (
    <div 
      style={{
        background: '#ECEBE6',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.7)',
        border: '5px solid #D6D5CF',
        width: '490px',
        userSelect: 'none',
        position: 'relative',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mock Speaker Grill */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 4px)', gap: '4px' }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#B3B2AD' }} />
            ))}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#777672', letterSpacing: '1px' }}>
            SYNTH-1 / LEAD
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: !disabled ? '#4CAF50' : '#FF5722' }} />
          <span style={{ fontSize: '9px', color: '#777672', fontWeight: 'bold' }}>
            {!disabled ? 'ONLINE' : 'MUTED'}
          </span>
        </div>
      </div>

      {/* Screen and Knobs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '16px', marginBottom: '24px' }}>
        {/* OLED Screen */}
        <div 
          style={{
            background: '#0B0B0C',
            borderRadius: '8px',
            padding: '10px',
            border: '2px solid #3A3A3D',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
            height: '110px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Tape reels visualizer */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '5px' }}>
            <svg width="40" height="40" style={{ transform: displayNotes.length > 0 ? 'rotate(360deg)' : 'none', transition: displayNotes.length > 0 ? 'transform 3s linear infinite' : 'none' }}>
              <circle cx="20" cy="20" r="18" fill="none" stroke="#00D2FF" strokeWidth="2" strokeDasharray="4 2" className={displayNotes.length > 0 ? 'tape-spindle-left' : ''} />
              <circle cx="20" cy="20" r="6" fill="#00D2FF" />
            </svg>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#FF5722', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {displayNotes.length > 0 ? displayNotes[displayNotes.length - 1] : 'IDLE'}
              </span>
              <span style={{ color: '#666', fontSize: '8px' }}>
                OP-1 MODE
              </span>
            </div>

            <svg width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#A855F7" strokeWidth="2" strokeDasharray="4 2" className={displayNotes.length > 0 ? 'tape-spindle-right' : ''} />
              <circle cx="20" cy="20" r="6" fill="#A855F7" />
            </svg>
          </div>

          {/* Screen bottom visual parameter representations */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '4px' }}>
            {/* Waveform graphic */}
            <div style={{ width: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="#00D2FF" strokeWidth="1.5">
                {getWaveform(waveVal) === 'sine' && <path d="M 0,6 C 6,0 6,12 12,6 C 18,0 18,12 24,6" />}
                {getWaveform(waveVal) === 'square' && <path d="M 0,10 L 0,2 L 12,2 L 12,10 L 24,10" />}
                {getWaveform(waveVal) === 'triangle' && <path d="M 0,10 L 6,2 L 18,10 L 24,2" />}
                {getWaveform(waveVal) === 'sawtooth' && <path d="M 0,10 L 12,2 L 12,10 L 24,2" />}
              </svg>
            </div>

            {/* Attack Graphic */}
            <div style={{ width: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="#10B981" strokeWidth="1.5">
                <path d={`M 0,10 L ${Math.max(2, attackVal * 20)},2 L 24,10`} />
              </svg>
            </div>

            {/* Release Graphic */}
            <div style={{ width: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="#FFFFFF" strokeWidth="1.5">
                <path d={`M 0,2 L 8,10 L ${Math.max(12, 8 + releaseVal * 16)},10`} />
              </svg>
            </div>

            {/* Filter Graphic */}
            <div style={{ width: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="#FF5722" strokeWidth="1.5">
                <path d={`M 0,2 Q ${cutoffVal * 20},2 24,12`} />
              </svg>
            </div>
          </div>
        </div>

        {/* Rotary Knobs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', alignItems: 'center' }}>
          <OP1Knob 
            label="WAVE"
            color="#00D2FF"
            value={waveVal}
            onChange={setWaveVal}
            formatValue={(v) => getWaveform(v).toUpperCase()}
          />
          <OP1Knob 
            label="ATTACK"
            color="#10B981"
            value={attackVal}
            onChange={setAttackVal}
            formatValue={(v) => `${(0.01 + v * 1.49).toFixed(2)}s`}
          />
          <OP1Knob 
            label="RELEASE"
            color="#FFFFFF"
            value={releaseVal}
            onChange={setReleaseVal}
            formatValue={(v) => `${(0.1 + v * 2.9).toFixed(2)}s`}
          />
          <OP1Knob 
            label="CUTOFF"
            color="#FF5722"
            value={cutoffVal}
            onChange={setCutoffVal}
            formatValue={(v) => `${Math.round(100 + v * 5900)}Hz`}
          />
        </div>
      </div>

      {/* Keyboard Keys Section */}
      <div 
        style={{
          position: 'relative',
          background: '#DAD9D2',
          padding: '12px',
          borderRadius: '8px',
          height: '110px',
          border: '1px solid #C4C3BD',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)'
        }}
      >
        {/* Naturals / White Keys */}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {whiteKeys.map(k => {
            const isActive = displayNotes.includes(k.note);
            return (
              <button
                key={k.note}
                onMouseDown={() => triggerNoteOn(k.note)}
                onMouseUp={() => triggerNoteOff(k.note)}
                onMouseLeave={() => triggerNoteOff(k.note)}
                style={{
                  width: '34px',
                  height: '84px',
                  borderRadius: '17px',
                  background: isActive ? '#00D2FF' : '#F7F6F0',
                  border: '1px solid #CCCAC0',
                  boxShadow: isActive 
                    ? '0 0px 5px #00D2FF, inset 0 2px 4px rgba(0,0,0,0.2)' 
                    : '0 3px 3px rgba(0,0,0,0.15), inset 0 -3px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  outline: 'none',
                  transition: 'background 0.1s ease, transform 0.05s ease',
                  transform: isActive ? 'scale(0.96) translateY(2px)' : 'none'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: isActive ? 'white' : '#A4A39D' }}>
                  {k.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Accidentals / Black Keys */}
        {blackKeys.map(k => {
          const isActive = displayNotes.includes(k.note);
          return (
            <button
              key={k.note}
              onMouseDown={() => triggerNoteOn(k.note)}
              onMouseUp={() => triggerNoteOff(k.note)}
              onMouseLeave={() => triggerNoteOff(k.note)}
              style={{
                position: 'absolute',
                left: `${k.leftOffset + 12}px`,
                top: '12px',
                width: '26px',
                height: '46px',
                borderRadius: '13px',
                background: isActive ? '#A855F7' : '#333230',
                border: '1px solid #1A1A19',
                boxShadow: isActive 
                  ? '0 0px 5px #A855F7, inset 0 2px 3px rgba(0,0,0,0.3)' 
                  : '0 2px 2px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingBottom: '8px',
                outline: 'none',
                zIndex: 10,
                transition: 'background 0.1s ease, transform 0.05s ease',
                transform: isActive ? 'scale(0.95) translateY(1px)' : 'none'
              }}
            >
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: isActive ? 'white' : '#888' }}>
                {k.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#8F8E88', fontWeight: 'bold' }}>
        PLAY WITH COMPUTER KEYBOARD KEYS (A-S-D-F-G-H-J-K-L-; / W-E-T-Y-U-O-P)
      </div>
    </div>
  );
}

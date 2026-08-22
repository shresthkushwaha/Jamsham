'use client';
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sliders, Video, VideoOff } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

interface BottomInstrumentPanelProps {
  instrumentId: string;
  instrumentName: string;
  instrumentColor: string;
  onPlay: (noteOrSound: string | string[], velocity?: number) => void;
  onStop?: (noteOrSound: string | string[]) => void;
  activeNotes?: string[];
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export default function BottomInstrumentPanel({
  instrumentId,
  instrumentName,
  instrumentColor,
  onPlay,
  onStop,
  activeNotes = [],
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
}: BottomInstrumentPanelProps) {
  const [velocity, setVelocity] = useState(85);
  const [octave, setOctave] = useState(0);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [pressedTrigger, setPressedTrigger] = useState<string | null>(null);

  const toggleMasterFilter = () => {
    const newState = audioEngine.toggleFilter();
    setIsFilterOn(newState);
  };

  const getInstrumentPads = () => {
    switch (instrumentId?.toUpperCase()) {
      case 'DRUMS':
        return [
          { id: 'KICK', label: 'KICK', key: '1' },
          { id: 'SNARE', label: 'SNARE', key: '2' },
          { id: 'HIHAT', label: 'CL-HAT', key: '3' },
          { id: 'OPEN HAT', label: 'OP-HAT', key: '4' },
          { id: 'HIGH TOM', label: 'HI-TOM', key: 'Q' },
          { id: 'MID TOM', label: 'MID-TOM', key: 'W' },
          { id: 'FLOOR TOM', label: 'FL-TOM', key: 'E' },
          { id: 'CRASH', label: 'CRASH', key: 'A' },
          { id: 'RIDE', label: 'RIDE', key: 'S' },
          { id: 'TAMBOURINE', label: 'TAMB', key: 'D' },
        ];

      case 'GUITAR':
        return [
          { id: 'E Maj', label: 'E MAJ', key: '1', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'] },
          { id: 'A Maj', label: 'A MAJ', key: '2', notes: ['A2', 'E3', 'A3', 'C#4', 'E4'] },
          { id: 'D Maj', label: 'D MAJ', key: '3', notes: ['D3', 'A3', 'D4', 'F#4'] },
          { id: 'G Maj', label: 'G MAJ', key: '4', notes: ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'] },
          { id: 'C Maj', label: 'C MAJ', key: '5', notes: ['C3', 'E3', 'G3', 'C4', 'E4'] },
          { id: 'E Min', label: 'E MIN', key: 'Q', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'] },
          { id: 'A Min', label: 'A MIN', key: 'W', notes: ['A2', 'E3', 'A3', 'C4', 'E4'] },
          { id: 'D Min', label: 'D MIN', key: 'E', notes: ['D3', 'A3', 'D4', 'F4'] },
          { id: 'E4', label: 'E4-PLK', key: 'A', notes: 'E4' },
          { id: 'B3', label: 'B3-PLK', key: 'S', notes: 'B3' },
          { id: 'G3', label: 'G3-PLK', key: 'D', notes: 'G3' },
        ];

      case 'BASS':
        return ['E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'].map((note, idx) => {
          const shiftNote = `${note.slice(0, -1)}${parseInt(note.slice(-1)) + octave}`;
          const keys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
          return { id: shiftNote, label: shiftNote, key: keys[idx] || `${idx + 1}` };
        });

      case 'PIANO':
      case 'LEAD':
        return [
          { id: 'C4', label: 'C4', key: 'A' },
          { id: 'C#4', label: 'C#4', key: 'W', isBlack: true },
          { id: 'D4', label: 'D4', key: 'S' },
          { id: 'D#4', label: 'D#4', key: 'E', isBlack: true },
          { id: 'E4', label: 'E4', key: 'D' },
          { id: 'F4', label: 'F4', key: 'F' },
          { id: 'F#4', label: 'F#4', key: 'T', isBlack: true },
          { id: 'G4', label: 'G4', key: 'G' },
          { id: 'G#4', label: 'G#4', key: 'Y', isBlack: true },
          { id: 'A4', label: 'A4', key: 'H' },
          { id: 'A#4', label: 'A#4', key: 'U', isBlack: true },
          { id: 'B4', label: 'B4', key: 'J' },
          { id: 'C5', label: 'C5', key: 'K' },
        ];

      case 'BRASS':
        return [
          { id: 'Bb3', label: 'Bb3 SAX', key: '1' },
          { id: 'C4', label: 'C4 STAB', key: '2' },
          { id: 'D4', label: 'D4 STAB', key: '3' },
          { id: 'F4', label: 'F4 HORN', key: '4' },
          { id: 'G4', label: 'G4 HORN', key: '5' },
          { id: 'Bb4', label: 'Bb4 SAX', key: 'Q' },
          { id: 'C5', label: 'C5 TRP', key: 'W' },
          { id: 'D5', label: 'D5 TRP', key: 'E' },
        ];

      case 'STRINGS':
      case 'PAD':
      default:
        return [
          { id: 'Am Swell', label: 'Am SWELL', key: '1', notes: ['A3', 'C4', 'E4', 'A4'] },
          { id: 'F Maj Swell', label: 'F MAJ', key: '2', notes: ['F3', 'A3', 'C4', 'F4'] },
          { id: 'C Maj Swell', label: 'C MAJ', key: '3', notes: ['C3', 'E3', 'G3', 'C4'] },
          { id: 'G Maj Swell', label: 'G MAJ', key: '4', notes: ['G3', 'B3', 'D4', 'G4'] },
          { id: 'Dm Swell', label: 'Dm SWELL', key: '5', notes: ['D3', 'F3', 'A3', 'D4'] },
          { id: 'Em Swell', label: 'Em SWELL', key: '6', notes: ['E3', 'G3', 'B3', 'E4'] },
          { id: 'Violin Solo A5', label: 'VIOLIN A5', key: 'Q', notes: 'A5' },
          { id: 'Cello C2', label: 'CELLO C2', key: 'W', notes: 'C2' },
        ];
    }
  };

  const pads = getInstrumentPads();

  const handlePadHit = (item: any) => {
    setPressedTrigger(item.id);
    const velNormalized = velocity / 100;
    if (item.notes) {
      onPlay(item.notes, velNormalized);
    } else {
      onPlay(item.id, velNormalized);
    }
    setTimeout(() => setPressedTrigger(null), 120);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.repeat) return;
      const found = pads.find((p) => p.key?.toUpperCase() === e.key.toUpperCase());
      if (found) {
        handlePadHit(found);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads, velocity, octave]);

  return (
    <footer className="skeuo-rack-chassis" style={panelContainerStyle}>
      {/* Corner Rivet Screws */}
      <span className="skeuo-screw" style={{ position: 'absolute', top: 6, left: 6 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', top: 6, right: 6 }} />

      {/* Left: Your Instrument Control Panel */}
      <div style={instrumentSectionStyle}>
        <div style={panelHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#777', letterSpacing: '1px' }}>
              ANALOG CONSOLE:
            </span>
            <div className="skeuo-dymo-tape" style={{ borderColor: instrumentColor }}>
              <span style={{ color: instrumentColor }}>●</span>
              <span>{instrumentName.toUpperCase()}</span>
            </div>
          </div>

          {/* Skeuomorphic Param Knobs & Controls */}
          <div style={paramControlsRow}>
            {/* Velocity Knurled Knob */}
            <div style={knobWrapper}>
              <div
                className="skeuo-knob"
                title={`Velocity: ${velocity}%`}
                onClick={() => setVelocity((v) => (v >= 100 ? 40 : v + 20))}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="skeuo-knob-indicator"
                  style={{ transform: `rotate(${(velocity - 60) * 2.5}deg)` }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#888' }}>VEL</span>
                <span className="skeuo-digital-led" style={{ fontSize: '10px', color: '#00E676' }}>
                  {velocity}
                </span>
              </div>
            </div>

            {/* Octave Step Selector */}
            <div style={octaveSkeuoBox}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#888' }}>OCTAVE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setOctave((o) => Math.max(-1, o - 1))}
                  className="skeuo-industrial-btn"
                  style={octStepBtn}
                >
                  -
                </button>
                <span className="skeuo-digital-led" style={{ fontSize: '11px', color: '#FFD600', minWidth: '22px', textAlign: 'center' }}>
                  {octave >= 0 ? `+${octave}` : octave}
                </span>
                <button
                  onClick={() => setOctave((o) => Math.min(1, o + 1))}
                  className="skeuo-industrial-btn"
                  style={octStepBtn}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3D MPC Drum / Guitar / Piano Trigger Pads */}
        <div style={padsRowStyle}>
          {pads.map((item: any) => {
            const isHit = pressedTrigger === item.id || activeNotes.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handlePadHit(item)}
                className="skeuo-mpc-pad"
                style={{
                  ...padBtnStyle,
                  background: isHit
                    ? `radial-gradient(circle at 50% 30%, ${instrumentColor} 0%, #1c1c28 100%)`
                    : item.isBlack
                    ? 'linear-gradient(180deg, #181822 0%, #0c0c12 100%)'
                    : 'linear-gradient(180deg, #323242 0%, #20202c 100%)',
                  borderColor: isHit ? instrumentColor : item.isBlack ? '#242432' : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: isHit
                    ? `0 0 20px ${instrumentColor}, inset 0 2px 6px rgba(0,0,0,0.8)`
                    : '0 4px 8px rgba(0, 0, 0, 0.6)',
                }}
              >
                <span style={keyShortcutBadge}>{item.key}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isHit ? '#fff' : item.isBlack ? '#999' : '#eee',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: 3 Heavy Duty Skeuomorphic Switches: [🎙] [🎛] [⚙] */}
      <div style={actionsGroupStyle}>
        <button
          onClick={onToggleMute}
          className="skeuo-industrial-btn"
          style={{
            ...actionBtnStyle,
            borderColor: isMuted ? '#FF5252' : 'rgba(255, 255, 255, 0.18)',
            background: isMuted
              ? 'linear-gradient(180deg, #421c1c 0%, #240d0d 100%)'
              : 'linear-gradient(180deg, #2c3c2e 0%, #162418 100%)',
          }}
          title="Mic Mute Toggle"
        >
          {isMuted ? <MicOff size={18} color="#FF5252" /> : <Mic size={18} color="#00E676" />}
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#aaa' }}>[🎙] MIC</span>
            <span style={{ fontSize: '10px', fontWeight: 900, color: isMuted ? '#FF5252' : '#00E676' }}>
              {isMuted ? 'OFF' : 'LIVE'}
            </span>
          </div>
        </button>

        <button
          onClick={toggleMasterFilter}
          className="skeuo-industrial-btn"
          style={{
            ...actionBtnStyle,
            borderColor: isFilterOn ? '#FFD600' : 'rgba(255, 255, 255, 0.18)',
            background: isFilterOn
              ? 'linear-gradient(180deg, #443c1c 0%, #26200c 100%)'
              : 'linear-gradient(180deg, #323240 0%, #1a1a24 100%)',
          }}
          title="Master Filter On/Off"
        >
          <Sliders size={18} color={isFilterOn ? '#FFD600' : '#888'} />
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#aaa' }}>[🎛] FILT</span>
            <span style={{ fontSize: '10px', fontWeight: 900, color: isFilterOn ? '#FFD600' : '#777' }}>
              {isFilterOn ? 'ON' : 'BYPASS'}
            </span>
          </div>
        </button>

        <button
          onClick={onToggleVideo}
          className="skeuo-industrial-btn"
          style={{
            ...actionBtnStyle,
            borderColor: isVideoOff ? '#FF5252' : 'rgba(255, 255, 255, 0.18)',
            background: isVideoOff
              ? 'linear-gradient(180deg, #421c1c 0%, #240d0d 100%)'
              : 'linear-gradient(180deg, #1c2c42 0%, #0d1826 100%)',
          }}
          title="Camera Toggle"
        >
          {isVideoOff ? <VideoOff size={18} color="#FF5252" /> : <Video size={18} color="#00B0FF" />}
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#aaa' }}>[⚙] CAM</span>
            <span style={{ fontSize: '10px', fontWeight: 900, color: isVideoOff ? '#FF5252' : '#00B0FF' }}>
              {isVideoOff ? 'OFF' : 'LIVE'}
            </span>
          </div>
        </button>
      </div>
    </footer>
  );
}

const panelContainerStyle: React.CSSProperties = {
  padding: '12px 20px',
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  height: '118px',
  boxSizing: 'border-box',
  margin: '0 8px 8px 8px',
};

const instrumentSectionStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const panelHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const paramControlsRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const knobWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(0, 0, 0, 0.35)',
  padding: '3px 8px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const octaveSkeuoBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(0, 0, 0, 0.35)',
  padding: '3px 8px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const octStepBtn: React.CSSProperties = {
  width: '20px',
  height: '20px',
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const padsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  paddingBottom: '2px',
};

const padBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '70px',
  height: '52px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 6px',
};

const keyShortcutBadge: React.CSSProperties = {
  position: 'absolute',
  top: '3px',
  left: '4px',
  fontSize: '8px',
  color: '#888',
  fontWeight: '900',
  fontFamily: 'monospace',
};

const actionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  borderLeft: '2px groove rgba(255, 255, 255, 0.1)',
  paddingLeft: '16px',
};

const actionBtnStyle: React.CSSProperties = {
  width: '66px',
  height: '66px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
};

const actionBtnTextGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  lineHeight: '1.1',
};

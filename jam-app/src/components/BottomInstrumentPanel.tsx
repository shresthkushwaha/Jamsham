'use client';
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sliders, Settings, Video, VideoOff, Volume2, Sparkles } from 'lucide-react';
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
  const [velocity, setVelocity] = useState(80);
  const [octave, setOctave] = useState(0);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pressedTrigger, setPressedTrigger] = useState<string | null>(null);

  const toggleMasterFilter = () => {
    const newState = audioEngine.toggleFilter();
    setIsFilterOn(newState);
  };

  // Get keys/pads for current instrument
  const getInstrumentPads = () => {
    switch (instrumentId) {
      case 'DRUMS':
        return [
          { id: 'KICK', label: 'KICK', key: '1' },
          { id: 'SNARE', label: 'SNARE', key: '2' },
          { id: 'HIHAT', label: 'HI-HAT', key: '3' },
          { id: 'TOM 1', label: 'TOM 1', key: 'Q' },
          { id: 'TOM 2', label: 'TOM 2', key: 'W' },
          { id: 'CRASH', label: 'CRASH', key: 'E' },
          { id: 'CLAP', label: 'CLAP', key: 'A' },
          { id: 'SHAKER', label: 'SHAKER', key: 'S' },
          { id: 'COWBELL', label: 'COWBELL', key: 'D' },
        ];
      case 'BASS':
        return ['C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2'].map((note, idx) => {
          const shiftNote = `${note.slice(0, -1)}${parseInt(note.slice(-1)) + octave}`;
          const keys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
          return { id: shiftNote, label: shiftNote, key: keys[idx] || `${idx + 1}` };
        });
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
      case 'PAD':
        return [
          { id: 'Am9', label: 'Am9', key: '1', notes: ['A3', 'C4', 'E4', 'G4', 'B4'] },
          { id: 'Fmaj7', label: 'Fmaj7', key: '2', notes: ['F3', 'A3', 'C4', 'E4'] },
          { id: 'Cmaj9', label: 'Cmaj9', key: '3', notes: ['C3', 'E3', 'G3', 'B3', 'D4'] },
          { id: 'G6/9', label: 'G6/9', key: '4', notes: ['G3', 'B3', 'D4', 'E4', 'A4'] },
          { id: 'Dm7', label: 'Dm7', key: '5', notes: ['D3', 'F3', 'A3', 'C4'] },
          { id: 'Em11', label: 'Em11', key: '6', notes: ['E3', 'G3', 'B3', 'D4', 'A4'] },
        ];
      case 'FX':
      default:
        return [
          { id: 'LASER', label: '⚡ LASER', key: '1' },
          { id: 'ZAP', label: '✨ ZAP', key: '2' },
          { id: 'SUB DROP', label: '💥 SUB DROP', key: '3' },
          { id: 'SWEEP', label: '💨 SWEEP', key: '4' },
          { id: 'CHIME', label: '🔔 CHIME', key: '5' },
          { id: 'GLITCH', label: '🤖 GLITCH', key: '6' },
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
    <footer style={panelContainerStyle}>
      {/* Left: Your Instrument Control Panel */}
      <div style={instrumentSectionStyle}>
        <div style={panelHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>
              YOUR INSTRUMENT CONTROL PANEL:
            </span>
            <span style={{ ...instTag, color: instrumentColor, borderColor: instrumentColor }}>
              {instrumentName.toUpperCase()}
            </span>
          </div>

          {/* Quick Param Sliders matching ASCII: "Vel: [===|===] Oct: [- 0 +] Decay: [==|====]" */}
          <div style={paramControlsRow}>
            <div style={sliderGroup}>
              <span style={sliderLabel}>Vel:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={velocity}
                onChange={(e) => setVelocity(parseInt(e.target.value))}
                style={rangeInput}
              />
              <span style={sliderVal}>{velocity}%</span>
            </div>

            <div style={octaveGroup}>
              <span style={sliderLabel}>Oct:</span>
              <button onClick={() => setOctave((o) => Math.max(-1, o - 1))} style={octBtn}>-</button>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00E676', minWidth: '14px', textAlign: 'center' }}>
                {octave >= 0 ? `+${octave}` : octave}
              </span>
              <button onClick={() => setOctave((o) => Math.min(1, o + 1))} style={octBtn}>+</button>
            </div>
          </div>
        </div>

        {/* Dynamic Buttons / Trigger Strip */}
        <div style={padsRowStyle}>
          {pads.map((item: any) => {
            const isHit = pressedTrigger === item.id || activeNotes.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handlePadHit(item)}
                style={{
                  ...padBtnStyle,
                  background: isHit
                    ? `radial-gradient(circle, ${instrumentColor} 0%, #1c1c28 100%)`
                    : item.isBlack
                    ? '#0a0a12'
                    : '#151522',
                  borderColor: isHit ? instrumentColor : item.isBlack ? '#333' : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: isHit ? `0 0 16px ${instrumentColor}` : 'none',
                  transform: isHit ? 'scale(0.96)' : 'none',
                }}
              >
                <span style={keyShortcutBadge}>{item.key}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isHit ? '#fff' : '#eee' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: 3 Action Buttons matching ASCII: [🎙] MIC MUTE | [🎛] FILTER | [⚙] SETTINGS */}
      <div style={actionsGroupStyle}>
        {/* 1. MIC MUTE */}
        <button
          onClick={onToggleMute}
          style={{
            ...actionBtnStyle,
            borderColor: isMuted ? '#FF5252' : 'rgba(255, 255, 255, 0.12)',
            background: isMuted ? 'rgba(255, 82, 82, 0.2)' : '#12121c',
          }}
          title="Microphone Toggle"
        >
          {isMuted ? <MicOff size={18} color="#FF5252" /> : <Mic size={18} color="#00E676" />}
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '10px', color: '#888' }}>[🎙]</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: isMuted ? '#FF5252' : '#fff' }}>
              {isMuted ? 'MUTED' : 'MIC ON'}
            </span>
          </div>
        </button>

        {/* 2. FILTER / FX */}
        <button
          onClick={toggleMasterFilter}
          style={{
            ...actionBtnStyle,
            borderColor: isFilterOn ? '#FFD600' : 'rgba(255, 255, 255, 0.12)',
            background: isFilterOn ? 'rgba(255, 214, 0, 0.2)' : '#12121c',
          }}
          title="Master Filter FX Toggle"
        >
          <Sliders size={18} color={isFilterOn ? '#FFD600' : '#aaa'} />
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '10px', color: '#888' }}>[🎛]</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: isFilterOn ? '#FFD600' : '#fff' }}>
              {isFilterOn ? 'FILT ON' : 'FILTER'}
            </span>
          </div>
        </button>

        {/* 3. SETTINGS / CAM */}
        <button
          onClick={onToggleVideo}
          style={{
            ...actionBtnStyle,
            borderColor: isVideoOff ? '#FF5252' : 'rgba(255, 255, 255, 0.12)',
            background: isVideoOff ? 'rgba(255, 82, 82, 0.2)' : '#12121c',
          }}
          title="Camera Toggle"
        >
          {isVideoOff ? <VideoOff size={18} color="#FF5252" /> : <Video size={18} color="#00B0FF" />}
          <div style={actionBtnTextGroup}>
            <span style={{ fontSize: '10px', color: '#888' }}>[⚙]</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: isVideoOff ? '#FF5252' : '#fff' }}>
              {isVideoOff ? 'CAM OFF' : 'CAMERA'}
            </span>
          </div>
        </button>
      </div>
    </footer>
  );
}

const panelContainerStyle: React.CSSProperties = {
  background: '#0d0d14',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '12px 16px',
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  height: '110px',
  boxSizing: 'border-box',
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

const instTag: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '800',
  padding: '1px 6px',
  borderRadius: '4px',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const paramControlsRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const sliderGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const sliderLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#888',
};

const sliderVal: React.CSSProperties = {
  fontSize: '10px',
  color: '#aaa',
  minWidth: '28px',
};

const rangeInput: React.CSSProperties = {
  width: '70px',
  height: '4px',
  accentColor: '#00E676',
  cursor: 'pointer',
};

const octaveGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const octBtn: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  color: '#fff',
  width: '16px',
  height: '16px',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 'bold',
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
  minWidth: '65px',
  height: '48px',
  borderRadius: '8px',
  borderWidth: '1px',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.08s ease',
  outline: 'none',
};

const keyShortcutBadge: React.CSSProperties = {
  position: 'absolute',
  top: '3px',
  left: '4px',
  fontSize: '9px',
  color: '#666',
  fontWeight: 'bold',
};

const actionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
  paddingLeft: '16px',
};

const actionBtnStyle: React.CSSProperties = {
  width: '68px',
  height: '68px',
  borderRadius: '10px',
  borderWidth: '1px',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none',
};

const actionBtnTextGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  lineHeight: '1.1',
};

'use client';
import React from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const {
    bpm,
    setBpm,
    isMetronomePlaying,
    toggleMetronome,
    currentBeat,
    isRecording,
    recordingSeconds,
    toggleRecording
  } = useAudioEngine();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <header style={headerContainerStyle}>
      {/* 1. Left: Hamburger Icon / Studio Menu */}
      <div style={hamburgerBtnStyle} title="Jamsham Menu">
        <div style={barStyle} />
        <div style={barStyle} />
        <div style={barStyle} />
      </div>

      {/* 2. Center: Pink Pill Room Code Badge as in Mockup */}
      <div style={pinkCodeBadgeStyle} title="Click to copy room link">
        <span>Code- jhfrfh-1234</span>
      </div>

      {/* 3. Right: Metronome BPM & Recording Pill */}
      <div style={headerRightControlsStyle}>
        {/* Metronome */}
        <div style={metronomeBoxStyle} onClick={toggleMetronome} title="Toggle Metronome Audio Click">
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>BPM: {bpm}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map((beat) => (
              <div
                key={beat}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: currentBeat === beat ? '#00f0ff' : 'rgba(255, 255, 255, 0.2)',
                  transform: currentBeat === beat ? 'scale(1.4)' : 'scale(1)',
                  boxShadow: currentBeat === beat ? '0 0 8px #00f0ff' : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Recording */}
        <div onClick={toggleRecording} style={recordingPillStyle} title="Recording Status">
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isRecording ? '#ff3344' : '#666',
              boxShadow: isRecording ? '0 0 8px #ff3344' : 'none'
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
            REC: {formatTime(recordingSeconds)}
          </span>
        </div>

        {/* Settings */}
        <button onClick={onOpenSettings} style={settingsIconBtnStyle} title="Settings">
          ⚙
        </button>
      </div>
    </header>
  );
}

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  width: '100%',
  padding: '10px 24px 6px 24px',
  zIndex: 30
};

const hamburgerBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '4px',
  width: '28px',
  height: '28px',
  cursor: 'pointer'
};

const barStyle: React.CSSProperties = {
  width: '24px',
  height: '3.5px',
  borderRadius: '3px',
  background: '#ffffff'
};

const pinkCodeBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  border: '2px solid #e11d48',
  background: 'rgba(225, 29, 72, 0.12)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '12px',
  padding: '3px 14px',
  borderRadius: '6px',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  boxShadow: '0 0 14px rgba(225, 29, 72, 0.4)',
  cursor: 'pointer'
};

const headerRightControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const metronomeBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(15, 18, 26, 0.85)',
  padding: '5px 10px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  cursor: 'pointer'
};

const recordingPillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(15, 18, 26, 0.85)',
  padding: '5px 10px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  cursor: 'pointer'
};

const settingsIconBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(15, 18, 26, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer'
};

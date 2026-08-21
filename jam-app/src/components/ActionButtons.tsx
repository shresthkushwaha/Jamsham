'use client';
import React from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

interface ActionButtonsProps {
  onOpenSettings: () => void;
  vertical?: boolean;
}

export default function ActionButtons({ onOpenSettings, vertical = true }: ActionButtonsProps) {
  const { isMicMuted, toggleMic, isFilterOn, toggleFilter } = useAudioEngine();

  return (
    <aside style={vertical ? verticalContainerStyle : horizontalContainerStyle}>
      <div style={panelHeaderLabelStyle}>ACTIONS</div>

      {/* 1. MIC MUTE / UNMUTE BUTTON */}
      <button
        onClick={toggleMic}
        className="glass-panel"
        style={{
          ...btnBaseStyle,
          borderColor: isMicMuted ? 'rgba(255, 51, 68, 0.6)' : 'rgba(0, 255, 136, 0.4)',
          background: isMicMuted
            ? 'linear-gradient(180deg, rgba(255, 51, 68, 0.28) 0%, rgba(20, 24, 34, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(0, 255, 136, 0.2) 0%, rgba(20, 24, 34, 0.95) 100%)',
          boxShadow: isMicMuted ? '0 0 22px rgba(255, 51, 68, 0.4)' : '0 0 16px rgba(0, 255, 136, 0.25)'
        }}
        title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        <div style={{ ...statusLedStyle, background: isMicMuted ? 'var(--accent-red)' : 'var(--accent-green)' }} />
        <span style={{ fontSize: '24px' }}>{isMicMuted ? '🔇' : '🎙'}</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: isMicMuted ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {isMicMuted ? 'MIC MUTED' : 'MIC ACTIVE'}
          </div>
          <span style={subLabelStyle}>[M] TOGGLE</span>
        </div>
      </button>

      {/* 2. FILTER TOGGLE BUTTON */}
      <button
        onClick={toggleFilter}
        className="glass-panel"
        style={{
          ...btnBaseStyle,
          borderColor: isFilterOn ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.12)',
          background: isFilterOn
            ? 'linear-gradient(180deg, rgba(0, 240, 255, 0.3) 0%, rgba(20, 24, 34, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(35, 42, 60, 0.4) 0%, rgba(15, 18, 26, 0.95) 100%)',
          boxShadow: isFilterOn ? '0 0 24px var(--accent-cyan)' : 'none'
        }}
        title="Toggle Real-time Tone.js Lowpass Filter"
      >
        <div style={{ ...statusLedStyle, background: isFilterOn ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: '24px' }}>🎛</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: isFilterOn ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
            {isFilterOn ? 'FILTER ON' : 'PUT FILTER ON'}
          </div>
          <span style={subLabelStyle}>[F] 800Hz LPF</span>
        </div>
      </button>

      {/* 3. SETTINGS BUTTON */}
      <button
        onClick={onOpenSettings}
        className="glass-panel"
        style={{
          ...btnBaseStyle,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          background: 'linear-gradient(180deg, rgba(30, 36, 50, 0.5) 0%, rgba(15, 18, 26, 0.95) 100%)'
        }}
        title="Session Settings & Audio Devices"
      >
        <div style={{ ...statusLedStyle, background: 'rgba(255,255,255,0.3)' }} />
        <span style={{ fontSize: '24px' }}>⚙</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-primary)' }}>
            SETTINGS
          </div>
          <span style={subLabelStyle}>DEVICES / FX</span>
        </div>
      </button>
    </aside>
  );
}

const verticalContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  width: '125px',
  height: '100%',
  padding: '6px 0 6px 10px',
  justifyContent: 'center'
};

const horizontalContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '12px',
  height: '100%'
};

const panelHeaderLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  textAlign: 'center',
  marginBottom: '2px'
};

const btnBaseStyle: React.CSSProperties = {
  flex: 1,
  maxHeight: '92px',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  cursor: 'pointer',
  padding: '10px 6px',
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid',
  position: 'relative'
};

const statusLedStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '6px',
  height: '6px',
  borderRadius: '50%'
};

const subLabelStyle: React.CSSProperties = {
  fontSize: '8.5px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
  display: 'block',
  marginTop: '2px',
  fontWeight: 700
};

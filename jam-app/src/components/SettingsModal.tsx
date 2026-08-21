'use client';
import React, { useState } from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { bpm, setBpm, isAudioStarted, startAudio } = useAudioEngine();
  const [latencyMode, setLatencyMode] = useState<'quantized' | 'instant'>('quantized');
  const [quantizeSubdivision, setQuantizeSubdivision] = useState('16n');

  if (!isOpen) return null;

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div className="glass-panel" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚙</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Jam Session Settings</h2>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={modalBodyStyle}>
          {/* Audio Engine Status */}
          <div style={settingRowStyle}>
            <div>
              <div style={settingLabelStyle}>Tone.js Web Audio Engine</div>
              <div style={settingDescStyle}>Direct Web Audio API context status</div>
            </div>
            <button
              onClick={startAudio}
              style={{
                ...togglePillStyle,
                background: isAudioStarted ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                color: isAudioStarted ? 'var(--accent-green)' : 'var(--text-primary)',
                borderColor: isAudioStarted ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.2)'
              }}
            >
              {isAudioStarted ? '● ACTIVE (0ms)' : 'START AUDIO'}
            </button>
          </div>

          {/* Latency Sync Strategy */}
          <div style={settingRowStyle}>
            <div>
              <div style={settingLabelStyle}>Latency Sync Mode</div>
              <div style={settingDescStyle}>How other players hear your triggered notes</div>
            </div>
            <div style={segmentedControlStyle}>
              <button
                onClick={() => setLatencyMode('quantized')}
                style={{
                  ...segmentedOptionStyle,
                  background: latencyMode === 'quantized' ? 'var(--accent-cyan)' : 'transparent',
                  color: latencyMode === 'quantized' ? '#000' : 'var(--text-secondary)'
                }}
              >
                Quantized Grid
              </button>
              <button
                onClick={() => setLatencyMode('instant')}
                style={{
                  ...segmentedOptionStyle,
                  background: latencyMode === 'instant' ? 'var(--accent-cyan)' : 'transparent',
                  color: latencyMode === 'instant' ? '#000' : 'var(--text-secondary)'
                }}
              >
                Instant Raw
              </button>
            </div>
          </div>

          {/* Quantize Subdivision */}
          {latencyMode === 'quantized' && (
            <div style={settingRowStyle}>
              <div>
                <div style={settingLabelStyle}>Quantize Grid Subdivision</div>
                <div style={settingDescStyle}>Snaps broadcasted events to musical beats</div>
              </div>
              <select
                value={quantizeSubdivision}
                onChange={(e) => setQuantizeSubdivision(e.target.value)}
                style={selectInputStyle}
              >
                <option value="4n">1/4 Note (Quarter)</option>
                <option value="8n">1/8 Note (Eighth)</option>
                <option value="16n">1/16 Note (Sixteenth - Recommended)</option>
              </select>
            </div>
          )}

          {/* Audio Input / Output */}
          <div style={settingRowStyle}>
            <div>
              <div style={settingLabelStyle}>Microphone Input</div>
              <div style={settingDescStyle}>WebRTC Voice Chat device</div>
            </div>
            <select style={selectInputStyle}>
              <option>Default - Built-in Microphone</option>
              <option>Communications - Headset Mic</option>
            </select>
          </div>

          <div style={settingRowStyle}>
            <div>
              <div style={settingLabelStyle}>Room Link</div>
              <div style={settingDescStyle}>Share with bandmates to jam together</div>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              style={copyLinkBtnStyle}
            >
              📋 Copy Invite Link
            </button>
          </div>
        </div>

        <div style={modalFooterStyle}>
          <button onClick={onClose} style={doneBtnStyle}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100
};

const modalContentStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: '520px',
  borderRadius: '20px',
  background: 'rgba(16, 20, 30, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
  overflow: 'hidden'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '18px',
  cursor: 'pointer'
};

const modalBodyStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px'
};

const settingLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text-primary)'
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)'
};

const togglePillStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  border: '1px solid'
};

const segmentedControlStyle: React.CSSProperties = {
  display: 'flex',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '8px',
  padding: '3px',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const segmentedOptionStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const selectInputStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  outline: 'none'
};

const copyLinkBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  background: 'rgba(0, 240, 255, 0.15)',
  border: '1px solid rgba(0, 240, 255, 0.3)',
  color: 'var(--accent-cyan)',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer'
};

const modalFooterStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  justifyContent: 'flex-end'
};

const doneBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '8px',
  background: 'var(--accent-cyan)',
  color: '#000',
  fontWeight: 800,
  fontSize: '13px',
  border: 'none',
  cursor: 'pointer'
};

'use client';
import React, { useState } from 'react';
import { Radio, Music, Sparkles, ArrowRight, Dices } from 'lucide-react';

interface LobbyProps {
  onJoin: (roomId: string, userName: string) => void;
  isLoading?: boolean;
}

const INSTRUMENT_SHOWCASE = [
  { name: 'Drum Kit', role: 'Rhythm & Beats', color: '#FF5722', icon: '🥁' },
  { name: 'Sub Bass', role: 'Groove & Low End', color: '#E040FB', icon: '🎸' },
  { name: 'Lead Synth', role: 'Melody & Solo', color: '#00E676', icon: '🎹' },
  { name: 'Ambient Pad', role: 'Harmonies & Chords', color: '#00B0FF', icon: '🌊' },
  { name: 'FX & Glitch', role: 'Textures & Drops', color: '#FFD600', icon: '✨' },
];

const RANDOM_ROOM_NAMES = ['jazz-cafe', 'neon-cyberpunk', 'funk-basement', 'lofi-rooftop', 'rock-garage'];

export default function Lobby({ onJoin, isLoading = false }: LobbyProps) {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('jazz-cafe-123');

  const generateRandomRoom = () => {
    const randomPrefix = RANDOM_ROOM_NAMES[Math.floor(Math.random() * RANDOM_ROOM_NAMES.length)];
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setRoomId(`${randomPrefix}-${randomSuffix}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    onJoin(roomId.trim(), userName.trim() || 'Musician');
  };

  return (
    <div style={lobbyWrapper}>
      <div style={lobbyCard}>
        {/* Glow Effect */}
        <div style={glowBlob} />

        {/* Title & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 2 }}>
          <div style={badgeStyle}>
            <Radio size={14} color="#00E676" style={{ animation: 'pulse 1.5s infinite' }} />
            <span>REAL-TIME COLLABORATIVE STAGE</span>
          </div>

          <h1 style={titleGradient}>JAMSHAM</h1>
          <p style={subtitleStyle}>
            Jam live with musicians worldwide. You will be automatically assigned an instrument to play together with
            ultra-low latency video and audio chat.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <label style={labelStyle}>YOUR STAGE NAME</label>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="e.g. Jimi, Miles, or Daft Punk"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={inputStyle}
              maxLength={24}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>ROOM ID</label>
              <button suppressHydrationWarning type="button" onClick={generateRandomRoom} style={randomBtnStyle}>
                <Dices size={12} style={{ marginRight: '4px' }} /> Randomize
              </button>
            </div>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="e.g. jazz-cafe-123"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* Instrument Pool Preview */}
          <div style={instrumentPoolContainer}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>
              RANDOM INSTRUMENT ASSIGNMENT POOL:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {INSTRUMENT_SHOWCASE.map((inst) => (
                <div
                  key={inst.name}
                  style={{
                    ...instPill,
                    borderColor: `${inst.color}44`,
                    background: `${inst.color}11`,
                    color: inst.color,
                  }}
                >
                  <span style={{ marginRight: '4px' }}>{inst.icon}</span>
                  <span>{inst.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button suppressHydrationWarning type="submit" disabled={isLoading} style={joinBtnStyle}>
            {isLoading ? (
              <span>Connecting to Stage...</span>
            ) : (
              <>
                <span>Enter Jam Stage</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const lobbyWrapper: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#09090f',
  padding: '20px',
};

const lobbyCard: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '480px',
  background: 'rgba(18, 18, 26, 0.85)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '36px 32px',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
  overflow: 'hidden',
};

const glowBlob: React.CSSProperties = {
  position: 'absolute',
  top: '-50px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '260px',
  height: '140px',
  background: 'radial-gradient(ellipse, rgba(0, 230, 118, 0.35) 0%, rgba(0, 176, 255, 0.15) 50%, transparent 70%)',
  pointerEvents: 'none',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  color: '#00E676',
  background: 'rgba(0, 230, 118, 0.1)',
  border: '1px solid rgba(0, 230, 118, 0.25)',
  padding: '4px 12px',
  borderRadius: '20px',
  marginBottom: '12px',
};

const titleGradient: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: '900',
  letterSpacing: '2px',
  background: 'linear-gradient(135deg, #ffffff 0%, #00E676 50%, #00B0FF 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#8b8b9e',
  lineHeight: '1.5',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#aaa',
  letterSpacing: '0.5px',
  marginBottom: '6px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  padding: '12px 16px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const randomBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#00B0FF',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '2px',
};

const instrumentPoolContainer: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '12px',
  padding: '12px',
};

const instPill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '20px',
  border: '1px solid',
};

const joinBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(90deg, #00E676 0%, #00B0FF 100%)',
  border: 'none',
  borderRadius: '12px',
  padding: '14px',
  color: '#000',
  fontSize: '15px',
  fontWeight: '800',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 8px 24px rgba(0, 230, 118, 0.3)',
  marginTop: '8px',
  transition: 'transform 0.1s ease',
};

'use client';
import React, { useState, useEffect } from 'react';
import { Radio, PlusCircle, LogIn, ArrowRight, Dices, ShieldCheck } from 'lucide-react';

interface LobbyProps {
  onJoin: (roomId: string, userName: string) => void;
  isLoading?: boolean;
  defaultRoomId?: string;
}

const INSTRUMENT_SHOWCASE = [
  { name: 'Acoustic Drums', role: 'Rhythm & Beats', color: '#FF5722', icon: '🥁' },
  { name: 'Acoustic / Electric Guitar', role: 'Chords & Riffs', color: '#FF9800', icon: '🎸' },
  { name: 'Electric Bass', role: 'Groove & Low End', color: '#E040FB', icon: '🎸' },
  { name: 'Grand Piano', role: 'Melody & Harmony', color: '#00E676', icon: '🎹' },
  { name: 'Saxophone & Horns', role: 'Soulful Leads', color: '#FFD600', icon: '🎷' },
  { name: 'String Section', role: 'Violin & Cello Swells', color: '#00B0FF', icon: '🎻' },
];

function generateUniqueSessionKey(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${segment1}-${segment2}`;
}

export default function Lobby({ onJoin, isLoading = false, defaultRoomId }: LobbyProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [userName, setUserName] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(generateUniqueSessionKey());
  const [joinRoomId, setJoinRoomId] = useState('');

  // Check URL query parameters for invite link (e.g. ?room=xyz)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        setJoinRoomId(urlRoom);
        setMode('join');
      } else if (defaultRoomId) {
        setCreatedRoomId(defaultRoomId);
      }
    }
  }, [defaultRoomId]);

  const handleRegenerateKey = () => {
    setCreatedRoomId(generateUniqueSessionKey());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoomId = mode === 'create' ? createdRoomId.trim() : joinRoomId.trim();
    if (!finalRoomId) return;
    onJoin(finalRoomId, userName.trim() || (mode === 'create' ? 'Host' : 'Musician'));
  };

  return (
    <div style={lobbyWrapper}>
      <div style={lobbyCard}>
        {/* Ambient Glow */}
        <div style={glowBlob} />

        {/* Title & Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          <div style={badgeStyle}>
            <Radio size={14} color="#00E676" style={{ animation: 'pulse 1.5s infinite' }} />
            <span>REAL-TIME COLLABORATIVE STAGE</span>
          </div>

          <h1 style={titleGradient}>JAMSHAM</h1>
          <p style={subtitleStyle}>
            Jam live with real-time video, audio, and sync. Each room is private and isolated by its session code.
          </p>
        </div>

        {/* Mode Selector Tabs: Create Session (New Key) vs Join Session */}
        <div style={tabSelectorContainer}>
          <button
            type="button"
            onClick={() => setMode('create')}
            style={{
              ...tabButton,
              backgroundColor: mode === 'create' ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
              borderColor: mode === 'create' ? '#00E676' : 'transparent',
              color: mode === 'create' ? '#00E676' : '#888',
            }}
          >
            <PlusCircle size={15} />
            <span>Create Room (Host)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('join')}
            style={{
              ...tabButton,
              backgroundColor: mode === 'join' ? 'rgba(0, 176, 255, 0.15)' : 'transparent',
              borderColor: mode === 'join' ? '#00B0FF' : 'transparent',
              color: mode === 'join' ? '#00B0FF' : '#888',
            }}
          >
            <LogIn size={15} />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <label style={labelStyle}>YOUR STAGE NAME</label>
            <input
              type="text"
              placeholder={mode === 'create' ? 'e.g. Jimi (Host)' : 'e.g. Miles, Prince, Daft'}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={inputStyle}
              maxLength={24}
            />
          </div>

          {mode === 'create' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>NEW GENERATED SESSION CODE</label>
                <button type="button" onClick={handleRegenerateKey} style={randomBtnStyle} title="Generate another unique code">
                  <Dices size={13} style={{ marginRight: '4px' }} /> New Code
                </button>
              </div>

              <div style={keyDisplayContainer}>
                <span style={keyDisplayCode}>Code- {createdRoomId}</span>
                <span style={adminTagStyle}>
                  <ShieldCheck size={12} /> You will be Admin
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>ENTER FRIEND'S SESSION CODE</label>
              <input
                type="text"
                placeholder="e.g. jhfrfh-1234 or a8b2-c7d9"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          )}

          {/* Instrument Pool Preview */}
          <div style={instrumentPoolContainer}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>
              BAND ROLES (AUTO-ASSIGNED ON JOIN):
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

          <button
            type="submit"
            disabled={isLoading || (mode === 'join' && !joinRoomId.trim())}
            style={{
              ...joinBtnStyle,
              background: mode === 'create' ? 'linear-gradient(90deg, #00E676 0%, #00B0FF 100%)' : 'linear-gradient(90deg, #00B0FF 0%, #7C4DFF 100%)',
            }}
          >
            {isLoading ? (
              <span>Connecting to Stage...</span>
            ) : (
              <>
                <span>{mode === 'create' ? 'Start Session (As Host)' : 'Join Jam Session'}</span>
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
  background: 'rgba(18, 18, 26, 0.9)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  padding: '36px 32px',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
  overflow: 'hidden',
};

const glowBlob: React.CSSProperties = {
  position: 'absolute',
  top: '-50px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '280px',
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

const tabSelectorContainer: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '20px',
  background: 'rgba(0,0,0,0.3)',
  padding: '4px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.06)',
};

const tabButton: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid transparent',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
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

const keyDisplayContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(0, 230, 118, 0.06)',
  border: '1px solid rgba(0, 230, 118, 0.25)',
  borderRadius: '12px',
  padding: '12px 16px',
};

const keyDisplayCode: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#ffffff',
  letterSpacing: '0.5px',
};

const adminTagStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#00E676',
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
  boxShadow: '0 8px 24px rgba(0, 230, 118, 0.25)',
  marginTop: '8px',
  transition: 'transform 0.1s ease',
};

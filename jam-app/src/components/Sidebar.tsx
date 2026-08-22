'use client';
import React from 'react';
import { Mic, MicOff, Sliders, Video, VideoOff, Music } from 'lucide-react';

interface SidebarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isFilterOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleFilter: () => void;
}

export default function Sidebar({
  isMuted,
  isVideoOff,
  isFilterOn,
  onToggleMute,
  onToggleVideo,
  onToggleFilter,
}: SidebarProps) {
  return (
    <aside style={sidebarContainer}>
      {/* Logo */}
      <div style={logoIconContainer}>
        <Music size={24} color="#00E676" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Controls */}
      <nav style={navContainer}>
        {/* MIC */}
        <button
          onClick={onToggleMute}
          style={{
            ...actionBtnStyle,
            borderColor: isMuted ? '#FF5252' : 'rgba(255, 255, 255, 0.12)',
            background: isMuted ? 'rgba(255, 82, 82, 0.2)' : 'transparent',
          }}
          title="Microphone Toggle"
        >
          {isMuted ? <MicOff size={20} color="#FF5252" /> : <Mic size={20} color="#00E676" />}
        </button>

        {/* FILTER */}
        <button
          onClick={onToggleFilter}
          style={{
            ...actionBtnStyle,
            borderColor: isFilterOn ? '#FFD600' : 'rgba(255, 255, 255, 0.12)',
            background: isFilterOn ? 'rgba(255, 214, 0, 0.2)' : 'transparent',
          }}
          title="Master Filter Toggle"
        >
          <Sliders size={20} color={isFilterOn ? '#FFD600' : '#aaa'} />
        </button>

        {/* VIDEO */}
        <button
          onClick={onToggleVideo}
          style={{
            ...actionBtnStyle,
            borderColor: isVideoOff ? '#FF5252' : 'rgba(255, 255, 255, 0.12)',
            background: isVideoOff ? 'rgba(255, 82, 82, 0.2)' : 'transparent',
          }}
          title="Camera Toggle"
        >
          {isVideoOff ? <VideoOff size={20} color="#FF5252" /> : <Video size={20} color="#00B0FF" />}
        </button>
      </nav>

      <div style={{ flex: 1 }} />
    </aside>
  );
}

const sidebarContainer: React.CSSProperties = {
  width: '64px',
  background: '#0d0d14',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 0',
  gap: '24px',
  flexShrink: 0,
};

const logoIconContainer: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(0, 230, 118, 0.1)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const navContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const actionBtnStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  border: '1px solid',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none',
};

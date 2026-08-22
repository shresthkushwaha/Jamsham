'use client';
import React, { useEffect, useRef } from 'react';
import { User } from '@/lib/webrtcManager';
import { useParticipantEnergy } from '@/lib/useParticipantEnergy';

interface PlayerOrbProps {
  user: User;
  isLocal: boolean;
  stream?: MediaStream | null;
  volume?: number;
  activeNotes?: string[];
  roleColor?: string;
  defaultSize?: number;
}

const INSTRUMENT_ICONS: Record<string, string> = {
  LEAD: '🎹',
  PIANO: '🎹',
  KEYBOARD: '🎹',
  GUITAR: '🎸',
  BASS: '🎸',
  STRINGS: '🎻',
  BRASS: '🎺',
  HORN: '🎺',
  TRUMPET: '🎺',
  SAX: '🎷',
  SAXOPHONE: '🎷',
  DRUMS: '🥁',
  PAD: '🌊',
  FX: '✨',
};

const INSTRUMENT_COLORS: Record<string, string> = {
  PIANO: '#9C27B0',
  LEAD: '#9C27B0',
  KEYBOARD: '#9C27B0',
  HORN: '#D32F2F',
  BRASS: '#D32F2F',
  TRUMPET: '#D32F2F',
  GUITAR: '#388E3C',
  STRINGS: '#388E3C',
  SAX: '#FBC02D',
  SAXOPHONE: '#FBC02D',
  BASS: '#7B1FA2',
  DRUMS: '#00ACC1',
};

export default function PlayerOrb({
  user,
  isLocal,
  stream,
  volume = 0,
  activeNotes = [],
  roleColor,
  defaultSize,
}: PlayerOrbProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const instKey = (user.instrument?.id || user.instrument?.name || 'PIANO').toUpperCase();
  const baseColor = roleColor || INSTRUMENT_COLORS[instKey] || user.instrument?.color || '#9C27B0';
  const iconEmoji = INSTRUMENT_ICONS[instKey] || '🎵';

  // Dynamic Sizing driven by physics engine or note density
  const { energy, isHittingNote } = useParticipantEnergy(activeNotes, {
    minSize: defaultSize ? defaultSize * 0.8 : 150,
    maxSize: defaultSize ? defaultSize * 1.3 : 340,
    decayRate: 0.012,
  });

  const displaySize = defaultSize ? Math.round(defaultSize) : 220;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !user.isVideoOff;
  const isSpeaking = volume > 8;
  const volNorm = Math.min(1, volume / 75);

  // Outer glow intensity based on voice volume + note energy
  const glowSpread = 12 + volNorm * 40 + energy * 35;
  const glowBorderWidth = Math.max(3.5, 3.5 + volNorm * 4.5);
  const glowOpacity = Math.min(0.98, 0.45 + volNorm * 0.45 + energy * 0.45);

  return (
    <div
      style={{
        position: 'relative',
        width: `${displaySize}px`,
        height: `${displaySize}px`,
        transition: 'width 0.12s ease-out, height 0.12s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Concentric Speaking Soundwave Aura */}
      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: `2px solid ${baseColor}`,
            opacity: volNorm * 0.7,
            transform: `scale(${1 + volNorm * 0.14})`,
            transition: 'transform 0.08s ease, opacity 0.08s ease',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Outer Glow Halo Ring */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: `${glowBorderWidth}px solid ${baseColor}`,
          boxShadow: `0 0 ${glowSpread}px ${baseColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`,
          transform: isHittingNote
            ? 'scale(1.05)'
            : isSpeaking
            ? `scale(${1 + volNorm * 0.05})`
            : 'scale(1)',
          transition: 'transform 0.06s ease, box-shadow 0.08s ease',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Main Circular Video Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#050508',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          zIndex: 1,
        }}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isLocal ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: `radial-gradient(circle at center, ${baseColor}22 0%, #08080f 80%)`,
            }}
          >
            <div
              style={{
                width: `${Math.max(48, displaySize * 0.38)}px`,
                height: `${Math.max(48, displaySize * 0.38)}px`,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${baseColor} 0%, #111 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: `${Math.max(16, displaySize * 0.14)}px`, fontWeight: 'bold', color: '#fff' }}>
                {user.userName ? user.userName.slice(0, 2).toUpperCase() : 'ME'}
              </span>
            </div>
            <span
              style={{
                fontSize: `${Math.max(10, displaySize * 0.045)}px`,
                color: 'rgba(255,255,255,0.7)',
                marginTop: '6px',
                fontWeight: 500,
              }}
            >
              {user.userName} {isLocal ? '(You)' : ''}
            </span>
          </div>
        )}

        {/* Note Hit Ripple Overlay */}
        {isHittingNote && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${baseColor}44 0%, transparent 70%)`,
              animation: 'pulse 0.3s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Floating Instrument Badge (Bottom Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: `${Math.max(34, displaySize * 0.23)}px`,
          height: `${Math.max(34, displaySize * 0.23)}px`,
          borderRadius: '50%',
          backgroundColor: '#000000',
          border: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
          transform: isHittingNote ? 'scale(1.25)' : 'scale(1)',
          transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 4,
        }}
        title={`${user.instrument?.name || 'Instrument'} (${user.userName})`}
      >
        <span style={{ fontSize: `${Math.max(16, displaySize * 0.11)}px`, lineHeight: 1 }}>
          {iconEmoji}
        </span>
      </div>

      {/* Floating Admin / Host Crown Badge (Top Center) */}
      {user.isAdmin && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            borderRadius: '12px',
            backgroundColor: '#FFD700',
            color: '#000',
            fontWeight: 800,
            fontSize: `${Math.max(10, displaySize * 0.045)}px`,
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 10px rgba(255, 215, 0, 0.6)',
            zIndex: 6,
            letterSpacing: '0.5px',
          }}
          title="Session Admin / Host"
        >
          <span>👑</span>
          <span>HOST</span>
        </div>
      )}
    </div>
  );
}

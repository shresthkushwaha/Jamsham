'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  GUITAR: '🎸',
  KEYBOARD: '🎹',
  DRUM: '🥁',
  DRUMS: '🥁',
  SITAR: '🪕',
  FLUTE: '🪈',
  TRUMPET: '🎺',
  SAXOPHONE: '🎷',
  SAX: '🎷',
  PIANO: '🎹',
};

const INSTRUMENT_COLORS: Record<string, string> = {
  GUITAR: '#FF9800',
  KEYBOARD: '#00E676',
  DRUM: '#FF5722',
  DRUMS: '#FF5722',
  SITAR: '#E040FB',
  FLUTE: '#00B0FF',
  TRUMPET: '#FFD600',
  SAXOPHONE: '#AB47BC',
  SAX: '#AB47BC',
  PIANO: '#00E676',
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);

  const instKey = (user.instrument?.id || user.instrument?.name || 'PIANO').toUpperCase();
  const baseColor = roleColor || INSTRUMENT_COLORS[instKey] || user.instrument?.color || '#9C27B0';
  const iconEmoji = INSTRUMENT_ICONS[instKey] || '🎵';

  // Sizing driven by note energy and mic volume
  const { energy, isHittingNote } = useParticipantEnergy(activeNotes, {
    minSize: defaultSize ? defaultSize * 0.8 : 150,
    maxSize: defaultSize ? defaultSize * 1.3 : 340,
    decayRate: 0.012,
  });

  const displaySize = defaultSize ? Math.round(defaultSize) : 220;

  // Video and audio stream attachment
  useEffect(() => {
    if (stream) {
      if (videoRef.current) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        videoRef.current.play().catch(() => {});
      }

      if (audioRef.current && !isLocal) {
        if (audioRef.current.srcObject !== stream) {
          audioRef.current.srcObject = stream;
        }
        audioRef.current.play().catch(() => {});
      }

      const checkVideo = () => {
        const videoTracks = stream.getVideoTracks();
        const active = videoTracks.length > 0 && videoTracks.some((t) => t.enabled && t.readyState === 'live') && !user.isVideoOff;
        setHasLiveVideo(active);
      };

      checkVideo();
      stream.addEventListener('addtrack', checkVideo);
      stream.addEventListener('removetrack', checkVideo);

      const interval = setInterval(checkVideo, 1000);
      return () => {
        clearInterval(interval);
        stream.removeEventListener('addtrack', checkVideo);
        stream.removeEventListener('removetrack', checkVideo);
      };
    } else {
      setHasLiveVideo(false);
    }
  }, [stream, isLocal, user.isVideoOff]);

  const isSpeaking = volume > 8;
  const volNorm = Math.min(1, volume / 75);

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
      {/* Dedicated Audio Element for Peer Voice */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Speaking Soundwave Aura */}
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
        {/* Always rendered Video Element so frames decode continuously */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isLocal ? 'scaleX(-1)' : 'none',
            zIndex: 1,
          }}
        />

        {/* Fallback Avatar Placeholder shown when camera is off/pending */}
        {!hasLiveVideo && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at center, ${baseColor}33 0%, #08080f 80%)`,
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: `${Math.max(48, displaySize * 0.38)}px`,
                height: `${Math.max(48, displaySize * 0.38)}px`,
                borderRadius: '50%',
                backgroundColor: `${baseColor}44`,
                border: `2px solid ${baseColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${Math.max(18, displaySize * 0.16)}px`,
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '4px',
              }}
            >
              {user.userName ? user.userName.slice(0, 2).toUpperCase() : 'JM'}
            </div>
            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 500 }}>
              {stream ? 'Connecting...' : 'Camera Off'}
            </span>
          </div>
        )}
      </div>

      {/* Floating Instrument Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: `${Math.max(34, displaySize * 0.22)}px`,
          height: `${Math.max(34, displaySize * 0.22)}px`,
          borderRadius: '50%',
          backgroundColor: '#000000',
          border: `2px solid #ffffff`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.max(16, displaySize * 0.12)}px`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          zIndex: 3,
        }}
        title={`${user.instrument?.name || 'Instrument'} (${user.instrument?.role || 'Band Member'})`}
      >
        {iconEmoji}
      </div>

      {/* Floating Name & Host Crown */}
      <div
        style={{
          position: 'absolute',
          bottom: `${Math.round(displaySize * 0.08)}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '3px 10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '0.2px',
          whiteSpace: 'nowrap',
          zIndex: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <span>{user.userName}</span>
        {user.isAdmin && (
          <span style={{ color: '#FFD700', fontSize: '10px' }} title="Session Host">
            👑
          </span>
        )}
      </div>
    </div>
  );
}

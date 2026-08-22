'use client';
import React, { useEffect, useRef } from 'react';
import { User } from '@/lib/webrtcManager';
import { Mic, MicOff, Video, VideoOff, Music } from 'lucide-react';

interface VideoGridProps {
  users: User[];
  localUser: User | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  volumeLevels: Record<string, number>;
  activeNotesByUser: Record<string, string[]>;
}

function VideoTile({
  user,
  isLocal,
  stream,
  volume = 0,
  activeNotes = [],
}: {
  user: User;
  isLocal: boolean;
  stream?: MediaStream | null;
  volume: number;
  activeNotes: string[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !user.isVideoOff;
  const isSpeaking = volume > 15;

  return (
    <div
      style={{
        ...tileContainerStyle,
        borderColor: isSpeaking
          ? '#00E676'
          : user.instrument?.color
          ? `${user.instrument.color}66`
          : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isSpeaking
          ? '0 0 20px rgba(0, 230, 118, 0.4)'
          : activeNotes.length > 0
          ? `0 0 25px ${user.instrument?.color || '#FF5722'}88`
          : '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Video Element or Avatar */}
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local preview to prevent feedback loop
          style={videoElementStyle}
        />
      ) : (
        <div style={avatarFallbackStyle}>
          <div
            style={{
              ...avatarCircleStyle,
              background: `linear-gradient(135deg, ${user.instrument?.color || '#333'} 0%, #0d0d14 100%)`,
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
              {user.userName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Camera Off</span>
        </div>
      )}

      {/* Top Bar: Participant name & Local Badge */}
      <div style={topBarStyle}>
        <div style={nameBadgeStyle}>
          <span style={{ fontWeight: 600 }}>{user.userName}</span>
          {isLocal && <span style={youTagStyle}>YOU (Host)</span>}
        </div>

        <div style={mediaIconsGroupStyle}>
          {user.isMuted ? (
            <span style={iconBadgeMuted} title="Microphone muted">
              <MicOff size={13} color="#FF5252" />
            </span>
          ) : (
            <span style={iconBadgeActive} title="Microphone live">
              <Mic size={13} color="#00E676" />
            </span>
          )}
          {user.isVideoOff ? (
            <span style={iconBadgeMuted} title="Camera off">
              <VideoOff size={13} color="#FF5252" />
            </span>
          ) : (
            <span style={iconBadgeActive} title="Camera on">
              <Video size={13} color="#00E676" />
            </span>
          )}
        </div>
      </div>

      {/* Bottom Floating Bar: Assigned Instrument Role & VU Meter */}
      <div style={bottomBarStyle}>
        <div style={roleTagContainer}>
          <div
            style={{
              ...roleBadgeStyle,
              background: `${user.instrument?.color || '#00B0FF'}22`,
              borderColor: user.instrument?.color || '#00B0FF',
              color: user.instrument?.color || '#00B0FF',
            }}
          >
            <Music size={12} style={{ marginRight: '5px' }} />
            <span>{user.instrument?.name || 'Musician'}</span>
          </div>

          {/* Active Note Hit Indicator */}
          {activeNotes.length > 0 && (
            <div style={activeNotePill}>
              <span style={{ animation: 'pulse 0.5s infinite' }}>🎵 {activeNotes.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Real-time VU Meter Bar */}
        <div style={vuMeterContainer}>
          <div
            style={{
              ...vuMeterFill,
              width: `${Math.min(100, volume * 1.4)}%`,
              backgroundColor: volume > 60 ? '#FF5252' : volume > 30 ? '#FFD600' : '#00E676',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function VideoGrid({
  users,
  localUser,
  localStream,
  remoteStreams,
  volumeLevels,
  activeNotesByUser,
}: VideoGridProps) {
  return (
    <div style={gridContainerStyle}>
      {users.map((u) => {
        const isLocal = u.socketId === localUser?.socketId;
        const stream = isLocal ? localStream : remoteStreams.get(u.socketId);
        const volume = volumeLevels[u.socketId] || 0;
        const activeNotes = activeNotesByUser[u.socketId] || [];

        return (
          <VideoTile
            key={u.socketId}
            user={u}
            isLocal={isLocal}
            stream={stream}
            volume={volume}
            activeNotes={activeNotes}
          />
        );
      })}
    </div>
  );
}

const gridContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '16px',
  width: '100%',
};

const tileContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: '210px',
  borderRadius: '16px',
  background: '#0d0d14',
  border: '2px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.15s ease',
};

const videoElementStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transform: 'scaleX(-1)', // Mirror webcam
};

const avatarFallbackStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarCircleStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(255, 255, 255, 0.2)',
};

const topBarStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 10,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
};

const nameBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: '#fff',
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
};

const youTagStyle: React.CSSProperties = {
  fontSize: '10px',
  background: '#00E676',
  color: '#000',
  fontWeight: 'bold',
  padding: '1px 6px',
  borderRadius: '10px',
};

const mediaIconsGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
};

const iconBadgeActive: React.CSSProperties = {
  background: 'rgba(0, 230, 118, 0.2)',
  padding: '4px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
};

const iconBadgeMuted: React.CSSProperties = {
  background: 'rgba(255, 82, 82, 0.2)',
  padding: '4px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
};

const bottomBarStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 10,
  padding: '10px 12px',
  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const roleTagContainer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  fontWeight: 'bold',
  padding: '3px 8px',
  borderRadius: '6px',
  border: '1px solid',
  backdropFilter: 'blur(8px)',
};

const activeNotePill: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#fff',
  background: 'rgba(255, 255, 255, 0.25)',
  padding: '2px 8px',
  borderRadius: '12px',
  backdropFilter: 'blur(8px)',
};

const vuMeterContainer: React.CSSProperties = {
  width: '100%',
  height: '4px',
  background: 'rgba(255, 255, 255, 0.15)',
  borderRadius: '2px',
  overflow: 'hidden',
};

const vuMeterFill: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.08s ease',
};

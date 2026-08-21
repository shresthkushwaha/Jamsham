'use client';
import React, { useEffect, useRef } from 'react';
import { User } from '@/lib/webrtcManager';
import { Mic, MicOff, Video, VideoOff, UserPlus, Music } from 'lucide-react';

interface VideoGrid2x2Props {
  users: User[];
  localUser: User | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  volumeLevels: Record<string, number>;
  activeNotesByUser: Record<string, string[]>;
  onInvite?: () => void;
}

function VideoSlot({
  slotNumber,
  user,
  isLocal,
  stream,
  volume = 0,
  activeNotes = [],
}: {
  slotNumber: number;
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

  const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !user.isVideoOff;
  const isSpeaking = volume > 15;

  return (
    <div
      style={{
        ...slotContainerStyle,
        borderColor: isSpeaking
          ? '#00E676'
          : activeNotes.length > 0
          ? user.instrument?.color || '#FF5722'
          : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isSpeaking
          ? '0 0 20px rgba(0, 230, 118, 0.35)'
          : activeNotes.length > 0
          ? `0 0 25px ${user.instrument?.color || '#FF5722'}66`
          : 'none',
      }}
    >
      {/* Header Bar matching ASCII */}
      <div style={slotHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={slotLabelStyle}>
            VIDEO {slotNumber}: {isLocal ? `${user.userName} (YOU/Host)` : user.userName}
          </span>
        </div>

        <div style={headerRightGroup}>
          <span
            style={{
              ...instBadgeStyle,
              borderColor: user.instrument?.color || '#00E676',
              color: user.instrument?.color || '#00E676',
              background: `${user.instrument?.color || '#00E676'}18`,
            }}
          >
            [{user.instrument?.name?.toUpperCase() || 'MUSICIAN'}]
          </span>

          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            {user.isMuted ? <MicOff size={12} color="#FF5252" /> : <Mic size={12} color="#00E676" />}
            {user.isVideoOff ? <VideoOff size={12} color="#FF5252" /> : <Video size={12} color="#00E676" />}
          </div>
        </div>
      </div>

      {/* Video Stream Area */}
      <div style={videoWrapperStyle}>
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={videoElementStyle}
          />
        ) : (
          <div style={avatarFallbackStyle}>
            <div
              style={{
                ...avatarCircle,
                background: `linear-gradient(135deg, ${user.instrument?.color || '#333'} 0%, #101018 100%)`,
              }}
            >
              <Music size={24} color="#fff" />
            </div>
            <span style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>Camera Disabled</span>
          </div>
        )}

        {/* Live Active Note Pop */}
        {activeNotes.length > 0 && (
          <div style={activeNoteTag}>
            <span>🎵 {activeNotes.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Real-time VU Meter Bar matching ASCII: "VU: ||||||||||||||||" */}
      <div style={vuMeterRowStyle}>
        <span style={vuLabelStyle}>VU:</span>
        <div style={vuMeterTrack}>
          <div
            style={{
              ...vuMeterBar,
              width: `${Math.min(100, volume * 1.5)}%`,
              background: volume > 60 ? '#FF5252' : volume > 30 ? '#FFD600' : '#00E676',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ slotNumber, onInvite }: { slotNumber: number; onInvite?: () => void }) {
  return (
    <div style={emptySlotContainer}>
      <div style={emptySlotHeader}>
        <span style={slotLabelStyle}>VIDEO {slotNumber}: [OPEN SLOT]</span>
        <span style={{ fontSize: '10px', color: '#666' }}>[OFFLINE]</span>
      </div>

      <div style={emptySlotBody}>
        <UserPlus size={28} color="#444" />
        <span style={{ fontSize: '12px', color: '#777', marginTop: '8px' }}>Waiting for bandmate...</span>
        <button onClick={onInvite} style={inviteBtnStyle}>
          Invite Musician
        </button>
      </div>

      <div style={vuMeterRowStyle}>
        <span style={vuLabelStyle}>VU:</span>
        <div style={vuMeterTrack} />
      </div>
    </div>
  );
}

export default function VideoGrid2x2({
  users,
  localUser,
  localStream,
  remoteStreams,
  volumeLevels,
  activeNotesByUser,
  onInvite,
}: VideoGrid2x2Props) {
  // Construct 4 slots (local user is always slot 1, peers occupy 2, 3, 4)
  const slots: (User | null)[] = [localUser, null, null, null];

  const remoteUsers = users.filter((u) => u.socketId !== localUser?.socketId);
  for (let i = 0; i < Math.min(3, remoteUsers.length); i++) {
    slots[i + 1] = remoteUsers[i];
  }

  return (
    <div style={grid2x2Container}>
      {slots.map((user, index) => {
        const slotNumber = index + 1;
        if (!user) {
          return <EmptySlot key={`empty-${slotNumber}`} slotNumber={slotNumber} onInvite={onInvite} />;
        }

        const isLocal = user.socketId === localUser?.socketId;
        const stream = isLocal ? localStream : remoteStreams.get(user.socketId);
        const volume = volumeLevels[user.socketId] || 0;
        const activeNotes = activeNotesByUser[user.socketId] || [];

        return (
          <VideoSlot
            key={user.socketId}
            slotNumber={slotNumber}
            user={user}
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

const grid2x2Container: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  gap: '12px',
  width: '100%',
  height: '100%',
  minHeight: '380px',
};

const slotContainerStyle: React.CSSProperties = {
  background: '#12121c',
  borderRadius: '12px',
  borderWidth: '1px',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'all 0.12s ease',
};

const slotHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.4)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const slotLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#eee',
  letterSpacing: '0.3px',
};

const headerRightGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const instBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '800',
  padding: '2px 6px',
  borderRadius: '4px',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const videoWrapperStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: '130px',
  background: '#09090f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const videoElementStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transform: 'scaleX(-1)',
};

const avatarFallbackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarCircle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 255, 255, 0.15)',
};

const activeNoteTag: React.CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  background: 'rgba(0, 0, 0, 0.75)',
  border: '1px solid #00E676',
  color: '#00E676',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '2px 8px',
  borderRadius: '10px',
  backdropFilter: 'blur(4px)',
};

const vuMeterRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  gap: '8px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
};

const vuLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#888',
};

const vuMeterTrack: React.CSSProperties = {
  flex: 1,
  height: '5px',
  background: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const vuMeterBar: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.08s ease',
};

const emptySlotContainer: React.CSSProperties = {
  background: 'rgba(18, 18, 28, 0.4)',
  borderRadius: '12px',
  border: '1px dashed rgba(255, 255, 255, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const emptySlotHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 10px',
  background: 'rgba(0, 0, 0, 0.2)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
};

const emptySlotBody: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '130px',
};

const inviteBtnStyle: React.CSSProperties = {
  marginTop: '8px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  color: '#00E676',
  fontSize: '11px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
};

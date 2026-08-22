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
      className="skeuo-rack-chassis"
      style={{
        ...slotContainerStyle,
        borderColor: isSpeaking
          ? '#00E676'
          : activeNotes.length > 0
          ? user.instrument?.color || '#FF5722'
          : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isSpeaking
          ? '0 0 24px rgba(0, 230, 118, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
          : activeNotes.length > 0
          ? `0 0 28px ${user.instrument?.color || '#FF5722'}77`
          : '0 6px 16px rgba(0,0,0,0.6)',
      }}
    >
      {/* Corner Rivet Screws */}
      <span className="skeuo-screw" style={{ position: 'absolute', top: 5, left: 5 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', top: 5, right: 5 }} />

      {/* Header Bar matching ASCII: VIDEO 1: YOU (Host) [DRUMS] */}
      <div style={slotHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={slotLabelStyle}>
            CH {slotNumber}: {isLocal ? `${user.userName} (YOU)` : user.userName}
          </span>
        </div>

        <div style={headerRightGroup}>
          <div className="skeuo-dymo-tape" style={{ borderColor: user.instrument?.color || '#00E676' }}>
            <span style={{ color: user.instrument?.color || '#00E676' }}>●</span>
            <span>{user.instrument?.name?.toUpperCase() || 'MUSICIAN'}</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            {user.isMuted ? <MicOff size={12} color="#FF5252" /> : <Mic size={12} color="#00E676" />}
            {user.isVideoOff ? <VideoOff size={12} color="#FF5252" /> : <Video size={12} color="#00E676" />}
          </div>
        </div>
      </div>

      {/* Video Monitor Area (Broadcast Monitor Glass) */}
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
                background: `radial-gradient(circle at 35% 35%, ${user.instrument?.color || '#444'} 0%, #151520 100%)`,
              }}
            >
              <Music size={26} color="#fff" />
            </div>
            <span style={{ fontSize: '10px', color: '#888', marginTop: '6px', letterSpacing: '0.5px' }}>
              VIDEO FEED STANDBY
            </span>
          </div>
        )}

        {/* Live Active Note Pop */}
        {activeNotes.length > 0 && (
          <div className="skeuo-dymo-tape" style={activeNoteTag}>
            <span style={{ color: '#00E676' }}>▶ {activeNotes.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Skeuomorphic Analog Amber Backlit VU Meter: "VU: ||||||||||||||||" */}
      <div className="skeuo-vu-casing" style={vuMeterRowStyle}>
        <span style={vuLabelStyle}>VU -dB</span>
        <div style={vuMeterTrack}>
          {/* Amber needle scale ticks */}
          <div style={vuTicksContainer}>
            {[-20, -10, -7, -3, 0, '+3'].map((db, idx) => (
              <span key={idx} style={{ fontSize: '7px', color: idx >= 4 ? '#FF5252' : '#d49b29' }}>
                {db}
              </span>
            ))}
          </div>
          {/* Active bouncing VU bar */}
          <div
            style={{
              ...vuMeterBar,
              width: `${Math.min(100, volume * 1.5)}%`,
              background:
                volume > 70
                  ? 'linear-gradient(90deg, #d49b29 0%, #ff5252 100%)'
                  : 'linear-gradient(90deg, #b8861d 0%, #e0ac38 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ slotNumber, onInvite }: { slotNumber: number; onInvite?: () => void }) {
  return (
    <div className="skeuo-rack-chassis" style={emptySlotContainer}>
      <span className="skeuo-screw" style={{ position: 'absolute', top: 5, left: 5 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', top: 5, right: 5 }} />

      <div style={emptySlotHeader}>
        <span style={slotLabelStyle}>CH {slotNumber}: [STANDBY]</span>
        <div className="skeuo-dymo-tape" style={{ color: '#888' }}>
          <span>OFFLINE</span>
        </div>
      </div>

      <div style={emptySlotBody}>
        <UserPlus size={24} color="#555" />
        <span style={{ fontSize: '11px', color: '#777', marginTop: '6px', fontWeight: 600 }}>
          Slot ready for bandmate
        </span>
        <button onClick={onInvite} className="skeuo-industrial-btn" style={inviteBtnStyle}>
          + Copy Invite
        </button>
      </div>

      <div className="skeuo-vu-casing" style={vuMeterRowStyle}>
        <span style={vuLabelStyle}>VU -dB</span>
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
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  padding: '6px',
};

const slotHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 8px 4px 18px',
  marginBottom: '4px',
};

const slotLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '800',
  color: '#ddd',
  letterSpacing: '0.5px',
  fontFamily: 'monospace',
};

const headerRightGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const videoWrapperStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: '120px',
  background: '#07070b',
  borderRadius: '6px',
  border: '2px inset #050508',
  boxShadow: 'inset 0 0 16px rgba(0,0,0,0.9)',
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
  width: '46px',
  height: '46px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
};

const activeNoteTag: React.CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
};

const vuMeterRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  gap: '8px',
  marginTop: '6px',
};

const vuLabelStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: '900',
  color: '#c28b26',
  fontFamily: 'monospace',
};

const vuMeterTrack: React.CSSProperties = {
  flex: 1,
  height: '12px',
  background: '#120e09',
  borderRadius: '2px',
  overflow: 'hidden',
  position: 'relative',
  border: '1px solid #33240e',
};

const vuTicksContainer: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 4px',
  alignItems: 'center',
  zIndex: 2,
};

const vuMeterBar: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.08s ease',
  boxShadow: '0 0 6px #e0ac38',
};

const emptySlotContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  padding: '6px',
  opacity: 0.8,
};

const emptySlotHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 8px 4px 18px',
  marginBottom: '4px',
};

const emptySlotBody: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '120px',
  background: '#07070a',
  borderRadius: '6px',
  border: '1px dashed #222230',
};

const inviteBtnStyle: React.CSSProperties = {
  marginTop: '8px',
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '4px 10px',
  color: '#00E676',
};

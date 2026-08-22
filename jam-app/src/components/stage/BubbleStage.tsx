'use client';
import React, { useRef, useState, useEffect } from 'react';
import { User } from '@/lib/webrtcManager';
import PlayerOrb from './PlayerOrb';
import { useBubblePhysics } from '@/lib/useBubblePhysics';

interface BubbleStageProps {
  users: User[];
  localUser: User | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  volumeLevels: Record<string, number>;
  activeNotesByUser: Record<string, string[]>;
  onAdminMute?: (targetId: string, muted: boolean) => void;
  onAdminKick?: (targetId: string) => void;
}

// Fallback visual colors for roles
const ROLE_COLORS: Record<string, string> = {
  PIANO: '#00E676',
  KEYBOARD: '#00E676',
  GUITAR: '#FF9800',
  DRUM: '#FF5722',
  DRUMS: '#FF5722',
  SITAR: '#E040FB',
  FLUTE: '#00B0FF',
  TRUMPET: '#FFD600',
  SAXOPHONE: '#AB47BC',
  SAX: '#AB47BC',
};

export default function BubbleStage({
  users,
  localUser,
  localStream,
  remoteStreams,
  volumeLevels,
  activeNotesByUser,
  onAdminMute,
  onAdminKick,
}: BubbleStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 520 });

  // Effective users pool (ensures local user is always represented)
  const effectiveUsers: User[] = React.useMemo(() => {
    if (users.length > 0) return users;
    if (localUser) return [localUser];
    return [
      {
        socketId: 'local-host',
        userName: 'Host',
        instrument: { id: 'KEYBOARD', name: 'Keyboard', color: '#00E676', role: 'Melody & Harmony' },
      },
    ];
  }, [users, localUser]);

  // Track container dimensions for dynamic responsive physics
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setDimensions({
        width: el.clientWidth || 900,
        height: el.clientHeight || 520,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2D Organic Role Attraction & Elastic Collision Physics (Mic & Note Reactive)
  const positions = useBubblePhysics(effectiveUsers, activeNotesByUser, volumeLevels, {
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
    gap: 28,
  });

  return (
    <div ref={containerRef} data-bubble-stage="true" style={stageContainerStyle}>
      {/* Dynamic Physics Canvas for All Participant Bubbles */}
      <div style={physicsViewportStyle}>
        {effectiveUsers.map((user) => {
          const isLocal = user.socketId === localUser?.socketId || user.socketId === 'local-host';
          const stream = isLocal ? localStream : remoteStreams.get(user.socketId);
          const volume = volumeLevels[user.socketId] || 0;
          const activeNotes = activeNotesByUser[user.socketId] || [];
          const roleId = (user.instrument?.id || 'KEYBOARD').toUpperCase();
          const roleColor = user.instrument?.color || ROLE_COLORS[roleId] || '#00E676';

          const pos = positions[user.socketId] || {
            x: dimensions.width * 0.5,
            y: dimensions.height * 0.5,
            radius: 90,
          };

          const diameter = Math.round(pos.radius * 2);

          return (
            <div
              key={user.socketId}
              data-socket-id={user.socketId}
              style={{
                position: 'absolute',
                left: `${Math.round(pos.x - pos.radius)}px`,
                top: `${Math.round(pos.y - pos.radius)}px`,
                width: `${diameter}px`,
                height: `${diameter}px`,
                pointerEvents: 'auto',
                zIndex: isLocal ? 10 : 5,
                transition: 'none', // Position controlled by 60 FPS physics loop
              }}
            >
              <PlayerOrb
                user={user}
                isLocal={isLocal}
                isLocalAdmin={!!localUser?.isAdmin}
                stream={stream}
                volume={volume}
                activeNotes={activeNotes}
                roleColor={roleColor}
                defaultSize={diameter}
                onAdminMute={onAdminMute}
                onAdminKick={onAdminKick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const stageContainerStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  height: '100%',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const physicsViewportStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
};

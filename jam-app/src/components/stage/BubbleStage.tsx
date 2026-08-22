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
}

// Fallback visual colors for roles
const ROLE_COLORS: Record<string, string> = {
  PIANO: '#9C27B0',
  LEAD: '#9C27B0',
  HORN: '#C62828',
  BRASS: '#C62828',
  GUITAR: '#2E7D32',
  SAX: '#FBC02D',
  DRUMS: '#00ACC1',
  BASS: '#7B1FA2',
  STRINGS: '#1976D2',
  PAD: '#00897B',
};

export default function BubbleStage({
  users,
  localUser,
  localStream,
  remoteStreams,
  volumeLevels,
  activeNotesByUser,
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
        instrument: { id: 'PIANO', name: 'Grand Piano', color: '#9C27B0', role: 'Melody & Harmony' },
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
          const roleId = (user.instrument?.id || 'PIANO').toUpperCase();
          const roleColor = user.instrument?.color || ROLE_COLORS[roleId] || '#9C27B0';

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
                stream={stream}
                volume={volume}
                activeNotes={activeNotes}
                roleColor={roleColor}
                defaultSize={diameter}
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

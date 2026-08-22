'use client';
import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { WebRTCManager, User, NoteEvent } from '@/lib/webrtcManager';
import Lobby from '@/components/Lobby';
import MinimalHeader from '@/components/stage/MinimalHeader';
import BubbleStage from '@/components/stage/BubbleStage';
import NoteTriggerDeck from '@/components/stage/NoteTriggerDeck';
import { videoSessionRecorder } from '@/lib/videoSessionRecorder';

export default function JamRoomPage() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState('jhfrfh-1234');
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bpm, setBpm] = useState(120);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [volumeLevels, setVolumeLevels] = useState<Record<string, number>>({});
  const [activeNotesByUser, setActiveNotesByUser] = useState<Record<string, string[]>>({});

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Join Room
  const handleJoin = async (targetRoomId: string, userName: string, preferredInstrumentId?: string) => {
    setIsLoading(true);
    try {
      // 1. Initialize Tone.js audio engine with Soundfonts
      await audioEngine.init();

      // 2. Connect WebRTC Manager
      const manager = new WebRTCManager();
      webrtcRef.current = manager;

      manager.onUserJoined = (newUser, allUsers) => {
        setUsers(allUsers);
      };

      manager.onUserLeft = (leftSocketId, remainingUsers) => {
        setUsers(remainingUsers);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(leftSocketId);
          return next;
        });
      };

      manager.onRemoteStream = (socketId, stream) => {
        setRemoteStreams((prev) => new Map(prev).set(socketId, stream));
      };

      // Remote Note triggers
      manager.onNotePlay = (event: NoteEvent) => {
        audioEngine.playNote(event.instrument, event.note, event.duration, event.velocity);

        if (event.fromSocketId) {
          const noteLabel = Array.isArray(event.note) ? event.note.join('+') : event.note;
          setActiveNotesByUser((prev) => ({
            ...prev,
            [event.fromSocketId!]: [...(prev[event.fromSocketId!] || []), noteLabel],
          }));

          setTimeout(() => {
            setActiveNotesByUser((prev) => ({
              ...prev,
              [event.fromSocketId!]: (prev[event.fromSocketId!] || []).filter((n) => n !== noteLabel),
            }));
          }, 350);
        }
      };

      manager.onNoteStop = (event: NoteEvent) => {
        const noteStr = Array.isArray(event.note) ? event.note[0] : event.note;
        audioEngine.stopNote(event.instrument, noteStr);
      };

      manager.onMediaUpdated = (socketId, peerMuted, peerVideoOff) => {
        setUsers((prev) =>
          prev.map((u) => (u.socketId === socketId ? { ...u, isMuted: peerMuted, isVideoOff: peerVideoOff } : u))
        );
      };

      manager.onBpmUpdated = (newBpm) => {
        setBpm(newBpm);
      };

      manager.onVolumeLevels = (levels) => {
        setVolumeLevels(levels);
      };

      const result = await manager.connectAndJoin(targetRoomId, userName, preferredInstrumentId);
      setLocalUser(result.user);
      setUsers(result.users);
      setBpm(result.bpm);
      setRoomId(targetRoomId);
      setLocalStream(manager.getLocalStream());
      setIsInRoom(true);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Failed to connect to jam server. Please make sure the server is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = () => {
    webrtcRef.current?.disconnect();
    webrtcRef.current = null;
    setIsInRoom(false);
    setLocalUser(null);
    setUsers([]);
    setRemoteStreams(new Map());
    setActiveNotesByUser({});
  };

  // Local Note Playback (Triggered from bottom note deck or hotkeys)
  const currentInstrumentId = localUser?.instrument?.id || 'PIANO';

  const handleLocalPlay = (noteOrSound: string | string[], velocity: number = 0.85) => {
    audioEngine.playNote(currentInstrumentId, noteOrSound, '8n', velocity);

    // Broadcast note over network
    webrtcRef.current?.emitNotePlay({
      instrument: currentInstrumentId,
      note: noteOrSound,
      velocity,
    });

    if (localUser) {
      const label = Array.isArray(noteOrSound) ? noteOrSound.join('+') : noteOrSound;
      setActiveNotesByUser((prev) => ({
        ...prev,
        [localUser.socketId]: [...(prev[localUser.socketId] || []), label],
      }));
      setTimeout(() => {
        setActiveNotesByUser((prev) => ({
          ...prev,
          [localUser.socketId]: (prev[localUser.socketId] || []).filter((n) => n !== label),
        }));
      }, 350);
    }
  };

  const handleLocalStop = (noteOrSound: string | string[]) => {
    const singleNote = Array.isArray(noteOrSound) ? noteOrSound[0] : noteOrSound;
    audioEngine.stopNote(currentInstrumentId, singleNote);
    webrtcRef.current?.emitNoteStop({
      instrument: currentInstrumentId,
      note: noteOrSound,
    });
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    webrtcRef.current?.toggleMute(next);
  };

  const handleToggleVideo = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    webrtcRef.current?.toggleVideo(next);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    webrtcRef.current?.setBpm(newBpm);
  };

  const handleToggleRecording = async () => {
    if (!isRecording) {
      // Gather audio streams from Tone.js and microphones
      const audioStreams: MediaStream[] = [];
      const toneStream = audioEngine.getAudioDestinationStream();
      if (toneStream) audioStreams.push(toneStream);
      if (localStream) audioStreams.push(localStream);
      remoteStreams.forEach((stream) => {
        if (stream) audioStreams.push(stream);
      });

      const ok = videoSessionRecorder.start(() => {
        const stageEl = document.querySelector('[data-bubble-stage]') as HTMLElement | null;
        const stageWidth = stageEl?.clientWidth || 900;
        const stageHeight = stageEl?.clientHeight || 520;
        const effectiveUsers = users.length > 0 ? users : localUser ? [localUser] : [];
        const videoElements = document.querySelectorAll('video');

        const participants = effectiveUsers.map((u, i) => {
          const isLocal = u.socketId === localUser?.socketId || u.socketId === 'local-host';
          const videoEl = Array.from(videoElements).find((v) => {
            return isLocal ? v.muted : !v.muted;
          }) || (videoElements[i] as HTMLVideoElement | undefined);

          const orbEl = document.querySelector(`[data-socket-id="${u.socketId}"]`) as HTMLElement | null;
          const rect = orbEl ? orbEl.getBoundingClientRect() : null;
          const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;

          let pos = { x: stageWidth * 0.5, y: stageHeight * 0.5, radius: 85 };
          if (rect && stageRect) {
            pos = {
              x: rect.left - stageRect.left + rect.width / 2,
              y: rect.top - stageRect.top + rect.height / 2,
              radius: rect.width / 2,
            };
          }

          return {
            user: u,
            isLocal,
            videoElement: videoEl,
            pos,
            volume: volumeLevels[u.socketId] || 0,
            activeNotes: activeNotesByUser[u.socketId] || [],
          };
        });

        return {
          roomId,
          stageDimensions: { width: stageWidth, height: stageHeight },
          participants,
        };
      }, audioStreams);

      if (ok) setIsRecording(true);
    } else {
      const blob = await videoSessionRecorder.stop();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jamsham-live-video-${Date.now()}.webm`;
        a.click();
      }
    }
  };

  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isLoading} />;
  }

  return (
    <div style={pureMainFrameStyle}>
      {/* 1. Pure Minimalist Header */}
      <MinimalHeader
        roomId={roomId}
        userCount={users.length > 0 ? users.length : 1}
        isAdmin={localUser?.isAdmin || false}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        bpm={bpm}
        isRecording={isRecording}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onBpmChange={handleBpmChange}
        onToggleRecord={handleToggleRecording}
        onLeave={handleLeave}
      />

      {/* 2. Audio-Reactive Dynamic Bubble Stage */}
      <BubbleStage
        users={users}
        localUser={localUser}
        localStream={localStream}
        remoteStreams={remoteStreams}
        volumeLevels={volumeLevels}
        activeNotesByUser={activeNotesByUser}
      />

      {/* 3. Dynamic Instrument-Specific Bottom Note Deck */}
      <NoteTriggerDeck
        instrumentId={currentInstrumentId}
        instrumentName={localUser?.instrument?.name}
        instrumentColor={localUser?.instrument?.color || '#9C27B0'}
        onPlay={handleLocalPlay}
        onStop={handleLocalStop}
        activeNotes={activeNotesByUser[localUser?.socketId || ''] || []}
      />
    </div>
  );
}

const pureMainFrameStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#0a0a0f',
  color: '#ffffff',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: 'hidden',
  userSelect: 'none',
};

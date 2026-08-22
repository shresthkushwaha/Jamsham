'use client';
import React, { useState, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { LiveKitManager, User, NoteEvent } from '@/lib/livekitManager';
import Lobby from '@/components/Lobby';
import MinimalHeader from '@/components/stage/MinimalHeader';
import BubbleStage from '@/components/stage/BubbleStage';
import NoteTriggerDeck from '@/components/stage/NoteTriggerDeck';
import { videoSessionRecorder } from '@/lib/videoSessionRecorder';

export default function JamRoomPage() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState('');
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
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const livekitRef = useRef<LiveKitManager | null>(null);

  const handleUnlockAudio = async () => {
    await audioEngine.resume();
    setAudioUnlocked(true);
  };

  const handleJoin = async (targetRoomId: string, userName: string) => {
    setIsLoading(true);
    try {
      await audioEngine.init();
      const manager = new LiveKitManager();
      livekitRef.current = manager;

      manager.onUserJoined = (_newUser, allUsers) => setUsers(allUsers);
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
      manager.onNotePlay = (event: NoteEvent) => {
        if (!event.fromSocketId) return;
        audioEngine.playNote(event.instrument, event.note as string, event.duration || '8n', event.velocity || 80);
        setActiveNotesByUser((prev) => ({
          ...prev,
          [event.fromSocketId!]: [...(prev[event.fromSocketId!] || []), ...(Array.isArray(event.note) ? event.note : [event.note])],
        }));
        setTimeout(() => {
          setActiveNotesByUser((prev) => {
            const current = prev[event.fromSocketId!] || [];
            const notes = Array.isArray(event.note) ? event.note : [event.note];
            return {
              ...prev,
              [event.fromSocketId!]: current.filter((n) => !notes.includes(n)),
            };
          });
        }, 600);
      };
      manager.onNoteStop = (event: NoteEvent) => {
        if (!event.fromSocketId) return;
        const notes = Array.isArray(event.note) ? event.note : [event.note];
        setActiveNotesByUser((prev) => ({
          ...prev,
          [event.fromSocketId!]: (prev[event.fromSocketId!] || []).filter((n) => !notes.includes(n)),
        }));
      };
      manager.onBpmUpdated = (newBpm) => setBpm(newBpm);
      manager.onVolumeLevels = (levels) => setVolumeLevels(levels);

      const { user, users: roomUsers, bpm: roomBpm } = await manager.connectAndJoin(targetRoomId, userName);

      setLocalUser(user);
      setUsers(roomUsers);
      setBpm(roomBpm);
      setRoomId(targetRoomId);
      setLocalStream(manager.getLocalStream());
      setIsInRoom(true);
    } catch (err) {
      console.error('[JamRoom] Failed to join via LiveKit:', err);
      alert('Failed to connect to room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await livekitRef.current?.toggleMute(next);
  };

  const handleToggleVideo = async () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    await livekitRef.current?.toggleVideo(next);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    livekitRef.current?.setBpm(newBpm);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      const audioSources: MediaStream[] = [];
      if (localStream) audioSources.push(localStream);

      // Add remote peer audio streams
      remoteStreams.forEach((stream) => {
        if (stream && stream.getAudioTracks().length > 0) {
          audioSources.push(stream);
        }
      });

      // Add Tone.js Synthesizer Master Audio
      const synthStream = audioEngine.getRecorderStream();
      if (synthStream) audioSources.push(synthStream);

      const started = videoSessionRecorder.start(() => {
        const allUsers = localUser ? (users.length > 0 ? users : [localUser]) : [];
        const stageEl = document.querySelector('[data-bubble-stage]') as HTMLElement;
        const stageRect = stageEl?.getBoundingClientRect() || { width: 1280, height: 720, left: 0, top: 0 };

        return {
          roomId,
          stageDimensions: { width: stageRect.width || 1280, height: stageRect.height || 720 },
          participants: allUsers.map((u) => {
            const isLocal = u.socketId === localUser?.socketId;
            const bubbleEl = document.querySelector(`[data-socket-id="${u.socketId}"]`) as HTMLElement;
            const videoEl = document.querySelector(`[data-socket-id="${u.socketId}"] video`) as HTMLVideoElement;

            let pos = { x: 640, y: 360, radius: 110 };
            if (bubbleEl && stageEl) {
              const bRect = bubbleEl.getBoundingClientRect();
              pos = {
                x: bRect.left - stageRect.left + bRect.width / 2,
                y: bRect.top - stageRect.top + bRect.height / 2,
                radius: bRect.width / 2,
              };
            }

            return {
              user: u,
              isLocal,
              videoElement: videoEl || null,
              pos,
              volume: volumeLevels[u.socketId] || 0,
              activeNotes: activeNotesByUser[u.socketId] || [],
            };
          }),
        };
      }, audioSources);

      if (started) setIsRecording(true);
    } else {
      const blob = await videoSessionRecorder.stop();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jamsham-live-session-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleLeave = () => {
    if (isRecording) videoSessionRecorder.stop();
    livekitRef.current?.disconnect();
    livekitRef.current = null;
    setIsInRoom(false);
    setUsers([]);
    setRemoteStreams(new Map());
    setActiveNotesByUser({});
    setLocalUser(null);
    setLocalStream(null);
    setIsRecording(false);
  };

  const handleNotePlay = (note: string | string[]) => {
    if (!localUser) return;
    const notesArr = Array.isArray(note) ? note : [note];
    audioEngine.playNote(localUser.instrument?.id || 'PIANO', note as string, '8n', 90);
    setActiveNotesByUser((prev) => ({
      ...prev,
      [localUser.socketId]: [...new Set([...(prev[localUser.socketId] || []), ...notesArr])],
    }));
    livekitRef.current?.emitNotePlay({ instrument: localUser.instrument?.id || 'PIANO', note, duration: '8n', velocity: 90 });
  };

  const handleNoteStop = (note: string | string[]) => {
    if (!localUser) return;
    const notesArr = Array.isArray(note) ? note : [note];
    setActiveNotesByUser((prev) => ({
      ...prev,
      [localUser.socketId]: (prev[localUser.socketId] || []).filter((n) => !notesArr.includes(n)),
    }));
    livekitRef.current?.emitNoteStop({ instrument: localUser.instrument?.id || 'PIANO', note });
  };

  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isLoading} />;
  }

  return (
    <div style={pureMainFrameStyle} onClick={!audioUnlocked ? handleUnlockAudio : undefined}>
      {/* Audio Unlock Overlay */}
      {!audioUnlocked && (
        <div
          onClick={handleUnlockAudio}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔊</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Tap to Enable Audio
          </div>
          <div style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', maxWidth: '280px' }}>
            Browsers require a tap before playing audio.<br />Tap anywhere to enter the stage with full sound.
          </div>
        </div>
      )}

      {/* 1. Minimalist Header */}
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
        onToggleRecord={handleToggleRecord}
        onLeave={handleLeave}
      />

      {/* 2. Physics Bubble Stage */}
      <BubbleStage
        users={users.length > 0 ? users : localUser ? [localUser] : []}
        localUser={localUser}
        localStream={localStream}
        remoteStreams={remoteStreams}
        activeNotesByUser={activeNotesByUser}
        volumeLevels={volumeLevels}
      />

      {/* 3. Note Trigger Deck at the bottom */}
      <NoteTriggerDeck
        instrumentId={localUser?.instrument?.id || 'PIANO'}
        instrumentName={localUser?.instrument?.name}
        instrumentColor={localUser?.instrument?.color}
        onPlay={handleNotePlay}
        onStop={handleNoteStop}
        activeNotes={activeNotesByUser[localUser?.socketId || ''] || []}
      />
    </div>
  );
}

const pureMainFrameStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100vw',
  height: '100vh',
  background: '#09090f',
  overflow: 'hidden',
};

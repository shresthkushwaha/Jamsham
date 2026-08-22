'use client';
import React, { useState, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { WebRTCManager, User, NoteEvent } from '@/lib/webrtcManager';
import Lobby from '@/components/Lobby';
import VideoGrid2x2 from '@/components/VideoGrid2x2';
import BottomInstrumentPanel from '@/components/BottomInstrumentPanel';
import { Copy, Activity, Play, Square, Users, Mic, MicOff, Video, VideoOff, Sliders, LogOut } from 'lucide-react';

export default function JamRoomPage() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState('jazz-cafe-123');
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bpm, setBpm] = useState(120);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [volumeLevels, setVolumeLevels] = useState<Record<string, number>>({});
  const [activeNotesByUser, setActiveNotesByUser] = useState<Record<string, string[]>>({});

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Join Room
  const handleJoin = async (
    targetRoomId: string,
    userName: string,
    preferredInstrument?: string,
    assignmentMode?: 'random' | 'custom'
  ) => {
    setIsLoading(true);
    try {
      await audioEngine.init();
      const manager = new WebRTCManager();
      webrtcRef.current = manager;

      manager.onUserJoined = (newUser, allUsers) => setUsers(allUsers);
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

      manager.onBpmUpdated = (newBpm) => setBpm(newBpm);
      manager.onVolumeLevels = (levels) => setVolumeLevels(levels);

      const result = await manager.connectAndJoin(
        targetRoomId,
        userName,
        undefined,
        preferredInstrument,
        assignmentMode
      );
      setLocalUser(result.user);
      setUsers(result.users);
      setBpm(result.bpm);
      setRoomId(targetRoomId);
      setLocalStream(manager.getLocalStream());
      setIsInRoom(true);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Failed to connect to jam server. Please ensure server is running.');
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

  const currentInstrumentId = localUser?.instrument?.id || 'KEYBOARD';

  const handleLocalPlay = (noteOrSound: string | string[], velocity: number = 0.8) => {
    audioEngine.playNote(currentInstrumentId, noteOrSound, '8n', velocity);
    webrtcRef.current?.emitNotePlay({ instrument: currentInstrumentId, note: noteOrSound, velocity });

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
    webrtcRef.current?.emitNoteStop({ instrument: currentInstrumentId, note: noteOrSound });
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

  const handleToggleFilter = () => {
    const next = audioEngine.toggleFilter();
    setIsFilterOn(next);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
    webrtcRef.current?.setBpm(newBpm);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const blob = await audioEngine.stopRecording();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `jam-session-${roomId}-${new Date().getTime()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } else {
      const started = audioEngine.startRecording();
      if (started) setIsRecording(true);
    }
  };

  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isLoading} />;
  }

  return (
    <div style={appFrameStyle}>
      {/* LEFT COLUMN: Video Grid (2x2) + Aligned Instrument Surface */}
      <main style={leftColumnStyle}>
        <div style={videoStageWrapper}>
          <VideoGrid2x2
            users={users}
            localUser={localUser}
            localStream={localStream}
            remoteStreams={remoteStreams}
            volumeLevels={volumeLevels}
            activeNotesByUser={activeNotesByUser}
            onInvite={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Room invite link copied to clipboard!');
            }}
          />
        </div>

        <div style={instrumentPanelWrapper}>
          <BottomInstrumentPanel
            instrumentId={currentInstrumentId}
            instrumentName={localUser?.instrument?.name || 'Keyboard / Synth'}
            instrumentColor={localUser?.instrument?.color || '#7C4DFF'}
            onPlay={handleLocalPlay}
            onStop={handleLocalStop}
            activeNotes={activeNotesByUser[localUser?.socketId || ''] || []}
          />
        </div>
      </main>

      {/* RIGHT COLUMN: Room Details, Participants, Shifted Control Buttons */}
      <aside style={rightSidebarStyle}>
        {/* Room Details Card */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>
            <Activity size={16} color="#7C4DFF" />
            Room Details
          </h2>

          <div style={{ marginBottom: '12px' }}>
            <span style={labelStyle}>ROOM LINK</span>
            <div style={linkBoxStyle}>
              <span style={linkTextStyle}>{roomId}</span>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={iconBtnStyle}>
                <Copy size={14} color="#aaa" />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={labelStyle}>BPM / TEMPO: {bpm}</span>
            <input type="range" min="60" max="200" value={bpm} onChange={handleBpmChange} style={rangeStyle} />
          </div>

          <button onClick={toggleRecording} style={recordBtnStyle(isRecording)}>
            {isRecording ? <Square size={14} /> : <Play size={14} />}
            {isRecording ? 'STOP RECORDING' : 'RECORD SESSION'}
          </button>
        </div>

        {/* Participants Card */}
        <div style={{ ...cardStyle, flex: 1, overflowY: 'auto' }}>
          <h2 style={cardHeaderStyle}>
            <Users size={16} color="#00B0FF" />
            Participants ({users.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u) => (
              <div key={u.socketId} style={participantRowStyle}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  {u.userName} {u.socketId === localUser?.socketId ? '(YOU)' : ''}
                </span>
                <span style={instBadgeStyle(u.instrument?.color || '#7C4DFF')}>
                  {u.instrument?.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Panel (Shifted from sidebar to bottom right) */}
        <div style={controlsCardStyle}>
          <button
            onClick={handleToggleMute}
            style={circleControlBtnStyle(isMuted, '#FF5252')}
            title="Toggle Microphone"
          >
            {isMuted ? <MicOff size={18} color="#FF5252" /> : <Mic size={18} color="#00E676" />}
          </button>

          <button
            onClick={handleToggleVideo}
            style={circleControlBtnStyle(isVideoOff, '#FF5252')}
            title="Toggle Camera"
          >
            {isVideoOff ? <VideoOff size={18} color="#FF5252" /> : <Video size={18} color="#00B0FF" />}
          </button>

          <button
            onClick={handleToggleFilter}
            style={circleControlBtnStyle(isFilterOn, '#FFD600')}
            title="Toggle Master FX"
          >
            <Sliders size={18} color={isFilterOn ? '#FFD600' : '#aaa'} />
          </button>

          <button
            onClick={handleLeave}
            style={exitBtnStyle}
            title="Leave Room"
          >
            <LogOut size={16} color="#FF5252" />
          </button>
        </div>
      </aside>
    </div>
  );
}

const appFrameStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  background: '#09090f',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: 'hidden',
  padding: '16px',
  gap: '16px',
  boxSizing: 'border-box',
};

const leftColumnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  height: '100%',
  overflow: 'hidden',
};

const videoStageWrapper: React.CSSProperties = {
  flex: 1,
  minHeight: '0',
  display: 'flex',
};

const instrumentPanelWrapper: React.CSSProperties = {
  height: '210px',
  width: '100%',
};

const rightSidebarStyle: React.CSSProperties = {
  width: '280px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  height: '100%',
};

const cardStyle: React.CSSProperties = {
  background: '#12121c',
  padding: '16px',
  borderRadius: '14px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#fff',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#777',
  display: 'block',
  marginBottom: '4px',
};

const linkBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#181824',
  borderRadius: '8px',
  padding: '6px 10px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const linkTextStyle: React.CSSProperties = {
  flex: 1,
  fontSize: '12px',
  fontWeight: '600',
  color: '#7C4DFF',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const rangeStyle: React.CSSProperties = {
  width: '100%',
  accentColor: '#7C4DFF',
};

const recordBtnStyle = (isRecording: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  background: isRecording ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 255, 255, 0.08)',
  color: isRecording ? '#FF5252' : '#fff',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '11px',
});

const participantRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  background: '#181824',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
};

const instBadgeStyle = (color: string): React.CSSProperties => ({
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '2px 8px',
  borderRadius: '10px',
  border: '1px solid',
  color: color,
  borderColor: color,
  background: `${color}18`,
});

const controlsCardStyle: React.CSSProperties = {
  background: '#12121c',
  borderRadius: '14px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
};

const circleControlBtnStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  border: 'none',
  background: active ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const exitBtnStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255, 82, 82, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

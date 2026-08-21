'use client';
import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { WebRTCManager, User, ChatMessage, NoteEvent } from '@/lib/webrtcManager';
import Lobby from '@/components/Lobby';
import Sidebar from '@/components/Sidebar';
import RoomHeader from '@/components/RoomHeader';
import VideoGrid2x2 from '@/components/VideoGrid2x2';
import BottomInstrumentPanel from '@/components/BottomInstrumentPanel';
import Visualizer from '@/components/Visualizer';
import ChatDrawer from '@/components/ChatDrawer';
import DrumPad from '@/components/DrumPad';
import BassSynth from '@/components/BassSynth';
import LeadKeyboard from '@/components/LeadKeyboard';
import AmbientPad from '@/components/AmbientPad';
import FxPercussion from '@/components/FxPercussion';

export default function JamRoomPage() {
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState('jazz-cafe-123');
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bpm, setBpm] = useState(120);

  // Sidebar navigation tabs: 'stage' (2x2 grid) | 'rack' (all instruments) | 'chat' | 'help'
  const [activeSidebarTab, setActiveSidebarTab] = useState<'stage' | 'rack' | 'chat' | 'help'>('stage');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [volumeLevels, setVolumeLevels] = useState<Record<string, number>>({});
  const [activeNotesByUser, setActiveNotesByUser] = useState<Record<string, string[]>>({});

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Join Room
  const handleJoin = async (targetRoomId: string, userName: string) => {
    setIsLoading(true);
    try {
      // 1. Start audio engine
      await audioEngine.init();

      // 2. Start WebRTC & Sockets
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

      manager.onChatMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
      };

      manager.onVolumeLevels = (levels) => {
        setVolumeLevels(levels);
      };

      const result = await manager.connectAndJoin(targetRoomId, userName);
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

  // Local note playing
  const currentInstrumentId = localUser?.instrument?.id || 'DRUMS';

  const handleLocalPlay = (noteOrSound: string | string[], velocity: number = 0.8) => {
    audioEngine.playNote(currentInstrumentId, noteOrSound, '8n', velocity);

    // Broadcast over network
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

  const handleSendMessage = (text: string) => {
    if (localUser) {
      webrtcRef.current?.sendChatMessage(text, localUser.userName);
    }
  };

  const handleSidebarTabSelect = (tab: 'stage' | 'rack' | 'chat' | 'help') => {
    if (tab === 'chat') {
      setIsChatOpen((o) => !o);
    } else {
      setActiveSidebarTab(tab);
    }
  };

  if (!isInRoom) {
    return <Lobby onJoin={handleJoin} isLoading={isLoading} />;
  }

  return (
    <div style={appFrameStyle}>
      {/* 1. Left Slim Sidebar [*] [#] [@] [?] */}
      <Sidebar
        activeTab={activeSidebarTab}
        onSelectTab={handleSidebarTabSelect}
        unreadChatCount={messages.length}
      />

      {/* 2. Main Workspace Layout */}
      <div style={workspaceContainer}>
        {/* Top Header: [ ROOM: ... ] BPM: [ 120 ] REC: [ ... ] [X] */}
        <RoomHeader
          roomId={roomId}
          userCount={users.length}
          bpm={bpm}
          onBpmChange={handleBpmChange}
          onLeave={handleLeave}
        />

        {/* Center Stage Area: 2x2 Video Grid (Variation 3) */}
        <main style={mainStageArea}>
          {activeSidebarTab === 'stage' && (
            <div style={stageLayout}>
              {/* 2x2 Video Grid */}
              <div style={{ flex: 1 }}>
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

              {/* Right Side DAW Visualizer Rack */}
              <div style={dawSideRack}>
                <Visualizer />
                <div style={bandInfoCard}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ACTIVE BAND ROLES</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {users.map((u) => (
                      <div key={u.socketId} style={bandRoleRow}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                          {u.userName} {u.socketId === localUser?.socketId ? '(YOU)' : ''}
                        </span>
                        <span
                          style={{
                            ...roleTagSmall,
                            color: u.instrument?.color,
                            borderColor: u.instrument?.color,
                            background: `${u.instrument?.color}15`,
                          }}
                        >
                          {u.instrument?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSidebarTab === 'rack' && (
            <div style={rackViewContainer}>
              <h2 style={{ fontSize: '18px', color: '#00E676', marginBottom: '16px' }}>
                🎛 Full Studio Instrument Rack
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <DrumPad onPlay={(s) => handleLocalPlay(s)} />
                <BassSynth onPlay={(n) => handleLocalPlay(n)} onStop={(n) => handleLocalStop(n)} />
                <LeadKeyboard onPlay={(n) => handleLocalPlay(n)} onStop={(n) => handleLocalStop(n)} />
                <AmbientPad onPlay={(n) => handleLocalPlay(n)} onStop={(n) => handleLocalStop(n)} />
                <FxPercussion onPlay={(f) => handleLocalPlay(f)} />
              </div>
            </div>
          )}

          {activeSidebarTab === 'help' && (
            <div style={helpContainer}>
              <h2 style={{ fontSize: '18px', color: '#00E676', marginBottom: '16px' }}>
                📖 Stage Keyboard Shortcuts & Guide
              </h2>
              <div style={helpGrid}>
                <div style={helpCard}>
                  <h3 style={{ color: '#FF5722', fontSize: '14px', marginBottom: '8px' }}>🥁 Drum Kit</h3>
                  <p style={helpText}>Keys <strong>1-3</strong>, <strong>Q-E</strong>, <strong>A-D</strong> trigger Kick, Snare, Hat, Toms, Crash, Clap, Shaker, Cowbell.</p>
                </div>
                <div style={helpCard}>
                  <h3 style={{ color: '#E040FB', fontSize: '14px', marginBottom: '8px' }}>🎸 Sub Bass</h3>
                  <p style={helpText}>Keys <strong>A, S, D, F, G, H, J, K, L, ;</strong> trigger C1 to E2 with octave shift controls.</p>
                </div>
                <div style={helpCard}>
                  <h3 style={{ color: '#00E676', fontSize: '14px', marginBottom: '8px' }}>🎹 Lead Synth</h3>
                  <p style={helpText}>White keys <strong>A-K</strong> and black keys <strong>W, E, T, Y, U</strong> for smooth polyphonic leads.</p>
                </div>
                <div style={helpCard}>
                  <h3 style={{ color: '#00B0FF', fontSize: '14px', marginBottom: '8px' }}>🌊 Ambient Pad</h3>
                  <p style={helpText}>Keys <strong>1-8</strong> toggle lush FM chord layers (Am9, Fmaj7, Cmaj9, etc.).</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Instrument Control Panel & 3 Action Buttons (Variation 3) */}
        <BottomInstrumentPanel
          instrumentId={currentInstrumentId}
          instrumentName={localUser?.instrument?.name || 'Drum Kit'}
          instrumentColor={localUser?.instrument?.color || '#FF5722'}
          onPlay={handleLocalPlay}
          onStop={handleLocalStop}
          activeNotes={activeNotesByUser[localUser?.socketId || ''] || []}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
        />
      </div>

      {/* Slide-out Chat Drawer */}
      <ChatDrawer
        messages={messages}
        users={users}
        onSendMessage={handleSendMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((o) => !o)}
      />
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
};

const workspaceContainer: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
};

const mainStageArea: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const stageLayout: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  height: '100%',
};

const dawSideRack: React.CSSProperties = {
  width: '280px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  flexShrink: 0,
};

const bandInfoCard: React.CSSProperties = {
  background: '#12121c',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '12px',
};

const bandRoleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const roleTagSmall: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  padding: '2px 6px',
  borderRadius: '4px',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const rackViewContainer: React.CSSProperties = {
  padding: '16px',
  overflowY: 'auto',
};

const helpContainer: React.CSSProperties = {
  padding: '16px',
};

const helpGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  maxWidth: '700px',
};

const helpCard: React.CSSProperties = {
  background: '#12121c',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '16px',
};

const helpText: React.CSSProperties = {
  fontSize: '12px',
  color: '#aaa',
  lineHeight: '1.6',
};

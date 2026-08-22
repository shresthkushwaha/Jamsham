'use client';
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Disc, LogOut, X, Copy, Check } from 'lucide-react';

interface MinimalHeaderProps {
  roomId: string;
  userCount: number;
  isAdmin?: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  bpm: number;
  isRecording?: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleRecord?: () => void;
  onCloseRoom?: () => void;
  onLeave: () => void;
}

export default function MinimalHeader({
  roomId,
  userCount,
  isAdmin = false,
  isMuted,
  isVideoOff,
  bpm,
  isRecording = false,
  onToggleMute,
  onToggleVideo,
  onBpmChange,
  onToggleRecord,
  onCloseRoom,
  onLeave,
}: MinimalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  // Live recording timer counter
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      setRecSeconds(0);
      interval = setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header style={headerContainerStyle}>
        {/* Left: Minimalist Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          style={menuButtonStyle}
          title="Open session settings"
          aria-label="Menu"
        >
          {/* Custom layered circle / hamburger lines matching the screenshot */}
          <div style={customMenuIconStyle}>
            <span style={menuLineStyle} />
            <span style={menuLineStyle} />
            <span style={menuLineStyle} />
            <span style={menuLineStyle} />
          </div>
        </button>

        {/* Center Cluster: Room Code Badge + 1-Click Record Button */}
        <div style={centerGroupStyle}>
          <div onClick={handleCopyCode} style={roomCodeBadgeStyle} title="Click to copy room code">
            {isAdmin && (
              <span style={{ fontSize: '11px', color: '#FFD700', fontWeight: 'bold' }}>👑 Host</span>
            )}
            <span>Code- {roomId}</span>
            {copied ? <Check size={13} color="#00E676" /> : <Copy size={12} style={{ opacity: 0.5 }} />}
          </div>

          {/* Accessible Record Button beside the Room Code */}
          {onToggleRecord && (
            <button
              onClick={onToggleRecord}
              style={{
                ...headerRecordBtnStyle,
                backgroundColor: isRecording ? '#D32F2F' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isRecording ? '#FF5252' : 'rgba(255, 255, 255, 0.15)',
                color: isRecording ? '#ffffff' : '#f0f0f0',
                boxShadow: isRecording ? '0 0 16px rgba(255, 82, 82, 0.6)' : 'none',
              }}
              title={isRecording ? 'Click to stop and download recording' : 'Click to start recording video & audio'}
            >
              <Disc size={13} color={isRecording ? '#ffffff' : '#FF5252'} />
              <span>{isRecording ? `${formatTimer(recSeconds)} REC` : 'Record'}</span>
            </button>
          )}
        </div>

        {/* Right: Participant Count */}
        <div style={viberCountStyle}>
          <span>{userCount} {userCount === 1 ? 'viber' : 'vibers'}</span>
        </div>
      </header>

      {/* Slide-in Quick Controls Modal / Drawer */}
      {isMenuOpen && (
        <div style={modalBackdropStyle} onClick={() => setIsMenuOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Session Settings</h3>
              <button onClick={() => setIsMenuOpen(false)} style={closeButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <div style={modalBodyStyle}>
              {/* Media Controls */}
              <div style={controlRowStyle}>
                <button
                  onClick={onToggleMute}
                  style={{
                    ...actionBtnStyle,
                    backgroundColor: isMuted ? '#EF5350' : '#263238',
                  }}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isMuted ? 'Microphone Muted' : 'Microphone Live'}</span>
                </button>

                <button
                  onClick={onToggleVideo}
                  style={{
                    ...actionBtnStyle,
                    backgroundColor: isVideoOff ? '#EF5350' : '#263238',
                  }}
                >
                  {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                  <span>{isVideoOff ? 'Camera Off' : 'Camera Live'}</span>
                </button>
              </div>

              {/* BPM Metronome Slider */}
              <div style={bpmBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#bbb' }}>Tempo (BPM)</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00E676' }}>{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={bpm}
                  onChange={(e) => onBpmChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00E676' }}
                />
              </div>

              {/* Admin: End Session For Everyone */}
              {isAdmin && onCloseRoom && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to end this jam session and close the room for all participants?')) {
                      onCloseRoom();
                    }
                  }}
                  style={{
                    ...leaveBtnStyle,
                    backgroundColor: '#D32F2F',
                    borderColor: '#FF5252',
                    color: '#ffffff',
                  }}
                >
                  <LogOut size={16} />
                  <span>End Session (Close Room for All)</span>
                </button>
              )}

              {/* Leave Room Button */}
              <button onClick={onLeave} style={leaveBtnStyle}>
                <LogOut size={16} />
                <span>Leave Jam Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const headerContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 28px',
  zIndex: 20,
};

const menuButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
};

const customMenuIconStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '3px',
};

const menuLineStyle: React.CSSProperties = {
  width: '20px',
  height: '2.5px',
  backgroundColor: '#ffffff',
  borderRadius: '2px',
};

const centerGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const roomCodeBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.2px',
  cursor: 'pointer',
  padding: '6px 14px',
  borderRadius: '20px',
  transition: 'all 0.15s ease',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
};

const headerRecordBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  padding: '5px 12px',
  borderRadius: '20px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none',
};

const viberCountStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.2px',
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(6px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalContentStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: '400px',
  backgroundColor: '#12131a',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  padding: '20px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: '4px',
};

const modalBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 14px',
  borderRadius: '10px',
  border: 'none',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

const bpmBoxStyle: React.CSSProperties = {
  background: '#1a1b24',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const leaveBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(239, 83, 80, 0.4)',
  backgroundColor: 'rgba(239, 83, 80, 0.1)',
  color: '#EF5350',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '8px',
};

'use client';
import React, { useState, useEffect } from 'react';
import { Copy, Check, X, Circle, Disc } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

interface RoomHeaderProps {
  roomId: string;
  userCount: number;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  onLeave: () => void;
}

export default function RoomHeader({ roomId, userCount, bpm, onBpmChange, onLeave }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Metronome pulsing LED indicator
  useEffect(() => {
    const intervalMs = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      setMetronomeBeat((b) => (b + 1) % 4);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [bpm]);

  // Recording Timer (Phase 5)
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (!isRecording) {
      const started = audioEngine.startRecording();
      if (started) {
        setIsRecording(true);
      }
    } else {
      const audioBlob = await audioEngine.stopRecording();
      setIsRecording(false);
      if (audioBlob) {
        // Trigger download of session recording
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `jamsham-session-${roomId}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header style={headerContainerStyle}>
      {/* Center Group: Room ID, BPM, Recording */}
      <div style={centerGroupStyle}>
        {/* Room Badge */}
        <div style={roomBadgeStyle}>
          <span style={{ color: '#888', fontSize: '11px' }}>ROOM:</span>
          <span style={{ fontWeight: '800', color: '#fff', fontSize: '13px', letterSpacing: '0.5px' }}>
            {roomId.toUpperCase()}
          </span>
          <button onClick={copyRoomLink} style={copyBtnStyle} title="Copy Invite Link">
            {copied ? <Check size={12} color="#00E676" /> : <Copy size={12} color="#888" />}
          </button>
        </div>

        {/* BPM Metronome */}
        <div style={bpmBadgeStyle}>
          <span style={{ color: '#888', fontSize: '11px' }}>BPM:</span>
          <button onClick={() => onBpmChange(Math.max(60, bpm - 5))} style={stepBtn}>-</button>
          <span style={{ fontWeight: 'bold', color: '#00E676', minWidth: '32px', textAlign: 'center', fontSize: '13px' }}>
            {bpm}
          </span>
          <button onClick={() => onBpmChange(Math.min(200, bpm + 5))} style={stepBtn}>+</button>
          <div style={ledGroupStyle}>
            {[0, 1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  ...ledDot,
                  background: metronomeBeat === s ? (s === 0 ? '#FF5252' : '#00E676') : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: metronomeBeat === s ? '0 0 8px #00E676' : 'none',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#888' }}>(Synced)</span>
        </div>

        {/* Recording Action & Timer (Phase 5) */}
        <button
          onClick={handleToggleRecord}
          style={{
            ...recBtnStyle,
            borderColor: isRecording ? '#FF5252' : 'rgba(255, 255, 255, 0.15)',
            background: isRecording ? 'rgba(255, 82, 82, 0.2)' : 'rgba(0, 0, 0, 0.4)',
          }}
          title={isRecording ? 'Click to Stop & Download Session' : 'Click to Record Session Audio'}
        >
          <Disc size={14} color={isRecording ? '#FF5252' : '#aaa'} style={isRecording ? { animation: 'spin 2s linear infinite' } : {}} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isRecording ? '#FF5252' : '#eee' }}>
            REC: [ {isRecording ? formatTime(recordSeconds) : '00:00'} ] {isRecording ? '(REC 🔴)' : '(OFF)'}
          </span>
        </button>
      </div>

      {/* Right: Exit Button [X] */}
      <button onClick={onLeave} style={exitBtnStyle} title="Exit Room [X]">
        <X size={16} color="#aaa" />
      </button>
    </header>
  );
}

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px',
  background: '#0d0d14',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  height: '52px',
  boxSizing: 'border-box',
};

const centerGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  justifyContent: 'center',
};

const roomBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '5px 12px',
  borderRadius: '8px',
};

const copyBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  display: 'flex',
  alignItems: 'center',
};

const bpmBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '5px 12px',
  borderRadius: '8px',
};

const stepBtn: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  color: '#fff',
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 'bold',
};

const ledGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginLeft: '4px',
};

const ledDot: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  transition: 'all 0.08s ease',
};

const recBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '5px 14px',
  borderRadius: '8px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const exitBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

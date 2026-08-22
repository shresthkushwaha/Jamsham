'use client';
import React, { useState, useEffect } from 'react';
import { Copy, Check, X, Disc } from 'lucide-react';
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

  // Recording Timer
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
    <header className="skeuo-rack-chassis" style={headerContainerStyle}>
      {/* Rack Corner Screws */}
      <span className="skeuo-screw" style={{ position: 'absolute', top: 8, left: 10 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', top: 8, right: 10 }} />

      {/* Center Group: Room ID, BPM, Recording */}
      <div style={centerGroupStyle}>
        {/* Room Dymo Badge */}
        <div className="skeuo-dymo-tape" style={{ padding: '4px 10px' }}>
          <span style={{ color: '#888' }}>ROOM:</span>
          <span style={{ color: '#00E676' }}>{roomId.toUpperCase()}</span>
          <button onClick={copyRoomLink} style={copyBtnStyle} title="Copy Invite Link">
            {copied ? <Check size={12} color="#00E676" /> : <Copy size={12} color="#aaa" />}
          </button>
        </div>

        {/* 7-Segment LED BPM Metronome */}
        <div style={bpmModuleStyle}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#888', letterSpacing: '0.5px' }}>
            MASTER CLOCK
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onBpmChange(Math.max(60, bpm - 5))}
              className="skeuo-industrial-btn"
              style={stepBtn}
            >
              -
            </button>
            <div className="skeuo-digital-led" style={{ color: '#00E676', fontSize: '13px' }}>
              {bpm} <span style={{ fontSize: '9px', color: '#777' }}>BPM</span>
            </div>
            <button
              onClick={() => onBpmChange(Math.min(200, bpm + 5))}
              className="skeuo-industrial-btn"
              style={stepBtn}
            >
              +
            </button>
            <div style={ledGroupStyle}>
              {[0, 1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    ...ledDot,
                    background: metronomeBeat === s ? (s === 0 ? '#FF5252' : '#00E676') : '#1b1b24',
                    boxShadow: metronomeBeat === s ? '0 0 10px #00E676' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Reel-to-Reel Tape Recording Unit */}
        <button
          onClick={handleToggleRecord}
          className="skeuo-industrial-btn"
          style={{
            ...recBtnStyle,
            borderColor: isRecording ? '#FF5252' : 'rgba(255, 255, 255, 0.15)',
            background: isRecording
              ? 'linear-gradient(180deg, #3d1414 0%, #200a0a 100%)'
              : 'linear-gradient(180deg, #242430 0%, #15151e 100%)',
          }}
          title={isRecording ? 'Stop & Download Session' : 'Record Session'}
        >
          <Disc
            size={16}
            color={isRecording ? '#FF5252' : '#888'}
            style={isRecording ? { animation: 'spin 2s linear infinite' } : {}}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '8px', fontWeight: 900, color: isRecording ? '#FF5252' : '#888' }}>
              TAPE DECK {isRecording ? '● REC' : 'READY'}
            </span>
            <span className="skeuo-digital-led" style={{ fontSize: '11px', color: isRecording ? '#FF5252' : '#aaa' }}>
              {isRecording ? formatTime(recordSeconds) : '00:00'}
            </span>
          </div>
        </button>
      </div>

      {/* Right: Exit Button [X] */}
      <button onClick={onLeave} className="skeuo-industrial-btn" style={exitBtnStyle} title="Exit Stage [X]">
        <X size={15} color="#aaa" />
      </button>
    </header>
  );
}

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 24px',
  height: '56px',
  boxSizing: 'border-box',
  margin: '8px 8px 0 8px',
};

const centerGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '18px',
  flex: 1,
  justifyContent: 'center',
};

const copyBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '1px',
  display: 'flex',
  alignItems: 'center',
  marginLeft: '4px',
};

const bpmModuleStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const stepBtn: React.CSSProperties = {
  width: '20px',
  height: '20px',
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ledGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginLeft: '4px',
  background: '#07070a',
  padding: '3px 6px',
  borderRadius: '4px',
  border: '1px solid #1a1a24',
};

const ledDot: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  transition: 'all 0.08s ease',
};

const recBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 12px',
};

const exitBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

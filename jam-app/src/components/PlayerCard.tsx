'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

interface PlayerCardProps {
  id: string;
  name: string;
  role: string;
  instrumentIcon: string;
  isLocalUser?: boolean;
  color: string;
  defaultActiveNote: string;
  avatarSeed: string;
}

export default function PlayerCard({
  id,
  name,
  role,
  instrumentIcon,
  isLocalUser = false,
  color,
  defaultActiveNote
}: PlayerCardProps) {
  const { activeNotes, currentBeat, isMicMuted } = useAudioEngine();
  const [isPlayingNote, setIsPlayingNote] = useState(false);
  const [activeNoteText, setActiveNoteText] = useState(defaultActiveNote);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const instrumentKey = id === 'p1' ? 'drums' : id === 'p2' ? 'guitar' : id === 'p3' ? 'keyboard' : 'sitar';
  const notes = activeNotes[instrumentKey];

  useEffect(() => {
    if (notes && notes.length > 0) {
      setActiveNoteText(notes.join(' • '));
      setIsPlayingNote(true);
      const timer = setTimeout(() => setIsPlayingNote(false), 380);
      return () => clearTimeout(timer);
    }
  }, [notes]);

  // Auto-request webcam on mount for host
  useEffect(() => {
    if (isLocalUser) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isLocalUser]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.log('Video play caught:', e));
          };
        }
        setCameraActive(true);
      } else {
        setCameraError('Webcam not supported');
      }
    } catch (err: any) {
      console.warn('Webcam access caught/fallback:', err);
      setCameraError(err.name === 'NotAllowedError' ? 'Cam blocked' : 'No cam');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cameraActive) stopCamera();
    else startCamera();
  };

  // High-Definition Studio Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      phase += 0.035;

      // Studio dynamic vignette
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 1.3);
      grad.addColorStop(0, isPlayingNote ? `${color}33` : 'rgba(28, 34, 48, 0.7)');
      grad.addColorStop(1, '#090b10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Studio beams
      ctx.strokeStyle = `${color}14`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const angle = phase + (i * Math.PI) / 4;
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(width / 2 + Math.cos(angle) * width, height / 2 + Math.sin(angle) * height);
        ctx.stroke();
      }

      // Audio spectrum bars
      const bars = 22;
      const barWidth = 7;
      const spacing = 5;
      const totalWidth = bars * (barWidth + spacing);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < bars; i++) {
        const offset = Math.sin(phase * 2.5 + i * 0.35);
        const amp = isPlayingNote ? 0.95 : currentBeat % 2 === 0 ? 0.5 : 0.22;
        const barHeight = Math.max(10, (Math.abs(offset) * 55 + 12) * amp);

        const barGrad = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2 + barHeight);
        barGrad.addColorStop(0, '#ffffff');
        barGrad.addColorStop(0.4, color);
        barGrad.addColorStop(1, `${color}33`);

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(startX + i * (barWidth + spacing), height / 2 - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [color, isPlayingNote, currentBeat]);

  const isBeatActive = currentBeat % 2 === 0;

  return (
    <div
      className="glass-panel"
      style={{
        ...cardContainerStyle,
        borderColor: isPlayingNote ? color : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isPlayingNote ? `0 0 24px ${color}35` : '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Real Full-Frame Video Stream (Takes maximum screen area) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: '12px',
          display: cameraActive ? 'block' : 'none',
          zIndex: 1
        }}
      />

      {/* Fallback Studio Visualizer Canvas (Full Frame) */}
      {!cameraActive && (
        <div style={canvasWrapperStyle}>
          <canvas
            ref={canvasRef}
            width={480}
            height={260}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
          />
          {/* Centered Avatar Halo */}
          <div style={avatarCenterStyle}>
            <div
              style={{
                ...avatarBadgeStyle,
                borderColor: color,
                transform: isPlayingNote ? 'scale(1.15)' : 'scale(1)',
                boxShadow: isPlayingNote ? `0 0 25px ${color}` : `0 0 12px ${color}55`
              }}
            >
              <span style={{ fontSize: '30px' }}>{instrumentIcon}</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', marginTop: '6px', textShadow: '0 2px 8px #000' }}>
              {isLocalUser ? 'Host Stream' : `${name}'s Stream`}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOP BAR OVERLAY */}
      <div style={topFloatingOverlayStyle}>
        <div style={floatingUserBadgeStyle}>
          <div style={{ ...playerDotStyle, background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontWeight: 800, fontSize: '12px', color: '#fff', letterSpacing: '0.02em' }}>{name}</span>
          {isLocalUser && <span style={youBadgeMiniStyle}>HOST</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ ...roleBadgeMiniStyle, color, borderColor: `${color}66`, background: 'rgba(10,12,18,0.75)' }}>
            {instrumentIcon} {role}
          </span>
          {isLocalUser && (
            <button onClick={toggleCamera} style={cameraQuickToggleBtnStyle}>
              {cameraActive ? '🟢 Cam' : '📷 On'}
            </button>
          )}
          {isLocalUser && isMicMuted && (
            <span style={mutedBadgeMiniStyle}>🔇 MUTED</span>
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM BAR OVERLAY */}
      <div style={bottomFloatingOverlayStyle}>
        {/* Active Note Chip */}
        <div style={noteChipStyle}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>NOTE:</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: isPlayingNote ? color : '#e0e6ed'
            }}
          >
            {activeNoteText}
          </span>
        </div>

        {/* 12-Segment VU Meter */}
        <div style={vuContainerStyle}>
          <div style={vuBarsFlexStyle}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => {
              const activeCount = isPlayingNote ? 11 : isBeatActive ? 6 : 2;
              const isLit = bar <= activeCount;
              const barColor = bar > 10 ? 'var(--accent-red)' : bar > 7 ? 'var(--accent-amber)' : 'var(--accent-green)';
              return (
                <div
                  key={bar}
                  style={{
                    ...vuSingleBarStyle,
                    background: isLit ? barColor : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isLit ? `0 0 5px ${barColor}` : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '14px',
  background: '#090b10',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  height: '100%',
  width: '100%',
  minHeight: '160px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.18s ease'
};

const canvasWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1
};

const avatarCenterStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2
};

const avatarBadgeStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'rgba(10, 12, 18, 0.88)',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.18s ease'
};

const topFloatingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  right: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10,
  pointerEvents: 'none'
};

const floatingUserBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(10, 12, 18, 0.82)',
  backdropFilter: 'blur(8px)',
  padding: '4px 10px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  pointerEvents: 'auto'
};

const playerDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%'
};

const youBadgeMiniStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  padding: '1px 5px',
  borderRadius: '4px',
  background: 'rgba(0, 240, 255, 0.25)',
  color: 'var(--accent-cyan)',
  border: '1px solid rgba(0, 240, 255, 0.4)'
};

const roleBadgeMiniStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  padding: '3px 8px',
  borderRadius: '20px',
  border: '1px solid',
  backdropFilter: 'blur(8px)',
  pointerEvents: 'auto'
};

const cameraQuickToggleBtnStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  padding: '3px 8px',
  borderRadius: '20px',
  background: 'rgba(10, 12, 18, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#fff',
  cursor: 'pointer',
  pointerEvents: 'auto',
  backdropFilter: 'blur(8px)'
};

const mutedBadgeMiniStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  color: 'var(--accent-red)',
  background: 'rgba(255, 51, 68, 0.25)',
  padding: '3px 6px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 51, 68, 0.4)',
  pointerEvents: 'auto'
};

const bottomFloatingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  right: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10,
  pointerEvents: 'none'
};

const noteChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(10, 12, 18, 0.85)',
  backdropFilter: 'blur(8px)',
  padding: '3px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  pointerEvents: 'auto'
};

const vuContainerStyle: React.CSSProperties = {
  background: 'rgba(10, 12, 18, 0.85)',
  backdropFilter: 'blur(8px)',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  pointerEvents: 'auto'
};

const vuBarsFlexStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  alignItems: 'flex-end'
};

const vuSingleBarStyle: React.CSSProperties = {
  width: '3.5px',
  height: '14px',
  borderRadius: '1.5px',
  transition: 'all 0.08s ease'
};

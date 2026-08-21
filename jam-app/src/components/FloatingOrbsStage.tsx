'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAudioEngine } from '@/context/AudioEngine';

interface PlayerData {
  id: string;
  name: string;
  role: string;
  instrumentIcon: string;
  isLocalUser: boolean;
  borderColor: string;
  defaultNote: string;
  className: string;
  initialPos: { x: number; y: number };
}

export default function FloatingOrbsStage() {
  const { activeNotes, selectedInstrument, isMicMuted } = useAudioEngine();

  // Real-time smoothed volume levels (0 to 100)
  const [volumes, setVolumes] = useState<Record<string, number>>({
    p1: 0,
    p2: 0,
    p3: 0,
    p4: 0
  });

  // Relative pixel diameters for each bubble
  const [bubbleSizes, setBubbleSizes] = useState<Record<string, number>>({
    p1: 220,
    p2: 170,
    p3: 150,
    p4: 180
  });

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Positioned so the left circle sits high up with ample clearance
  const players: PlayerData[] = [
    {
      id: 'p1',
      name: 'ALEX (You)',
      role: selectedInstrument === 'keyboard' ? 'KEYBOARD' : selectedInstrument.toUpperCase(),
      instrumentIcon:
        selectedInstrument === 'keyboard' ? '🎹' :
        selectedInstrument === 'guitar' ? '🎸' :
        selectedInstrument === 'drums' ? '🥁' : '🪕',
      isLocalUser: true,
      borderColor: '#a855f7', // Purple
      defaultNote: 'C4 • E4 • G4',
      className: 'orb-float-1',
      initialPos: { x: 28, y: 36 } // Positioned higher up
    },
    {
      id: 'p2',
      name: 'SARAH',
      role: 'TRUMPET',
      instrumentIcon: '🎺',
      isLocalUser: false,
      borderColor: '#ef4444', // Red
      defaultNote: 'G4 Staccato',
      className: 'orb-float-2',
      initialPos: { x: 62, y: 22 }
    },
    {
      id: 'p3',
      name: 'MIKE',
      role: 'VIOLIN',
      instrumentIcon: '🎻',
      isLocalUser: false,
      borderColor: '#22c55e', // Green
      defaultNote: 'A4 Legato',
      className: 'orb-float-3',
      initialPos: { x: 80, y: 24 }
    },
    {
      id: 'p4',
      name: 'AARAV',
      role: 'SAXOPHONE',
      instrumentIcon: '🎷',
      isLocalUser: false,
      borderColor: '#eab308', // Yellow/Gold
      defaultNote: 'Sa (C4) • Pa (G4)',
      className: 'orb-float-4',
      initialPos: { x: 72, y: 58 }
    }
  ];

  // Initialize Microphone & Local Webcam
  useEffect(() => {
    initLocalMedia();
    return () => {
      stopAllMedia();
    };
  }, []);

  const initLocalMedia = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setPermissionError('MediaDevices not available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
      });

      micStreamRef.current = stream;

      // Video Feed
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([videoTrack]);
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current?.play().catch(e => console.log('Camera video play caught:', e));
        };
        setCameraActive(true);
      }

      // Real-time Mic Input Analysis
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.25;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (err: any) {
      console.warn('Microphone/Camera access notice:', err);
      setPermissionError(err.name === 'NotAllowedError' ? 'Mic/Camera permission blocked' : 'Device error');
    }
  };

  const stopAllMedia = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Generate synthetic camera streams for remote band members (100% video elements)
  useEffect(() => {
    ['p2', 'p3', 'p4'].forEach((pid) => {
      const vid = remoteVideoRefs.current[pid];
      if (!vid) return;

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pInfo = players.find(p => p.id === pid);
      const color = pInfo ? pInfo.borderColor : '#ff0077';
      let frameCount = Math.random() * 100;

      const drawLoop = () => {
        frameCount += 0.035;
        ctx.fillStyle = '#06080d';
        ctx.fillRect(0, 0, 480, 480);

        // Studio lighting wash
        const grad = ctx.createRadialGradient(240, 240, 40, 240, 240, 240);
        grad.addColorStop(0, `${color}40`);
        grad.addColorStop(0.8, '#0b0f17');
        grad.addColorStop(1, '#030508');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 480);

        // Live Musician Silhouette & Camera Feed
        ctx.save();
        ctx.translate(240, 250);
        const headBob = Math.sin(frameCount * 2) * 4;
        const headSway = Math.cos(frameCount * 1.2) * 3;

        // Torso
        ctx.fillStyle = '#161b26';
        ctx.beginPath();
        ctx.ellipse(headSway, 140 + headBob, 120, 90, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#222a3b';
        ctx.beginPath();
        ctx.ellipse(headSway, headBob, 60, 75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Studio Backlight Rim
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(headSway, headBob - 10, 68, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();

        ctx.restore();

        // LIVE CAM watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(170, 420, 140, 32, 16);
        ctx.fill();
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(195, 436, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('LIVE CAM', 212, 441);

        requestAnimationFrame(drawLoop);
      };

      drawLoop();

      try {
        const stream = canvas.captureStream(30);
        vid.srcObject = stream;
        vid.play().catch(e => console.log('Remote stream error caught:', e));
      } catch (e) {
        console.log('Capture stream notice:', e);
      }
    });
  }, []);

  // Continuous Relative Volume Calculation & Sizing Loop (60 FPS)
  useEffect(() => {
    const dataArray = new Uint8Array(256);
    let smoothedVolP1 = 0;

    const computeRelativeSizes = () => {
      // 1. Measure real-time microphone volume of local user (Alex)
      let instantP1 = 0;
      if (analyserRef.current && !isMicMuted) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        instantP1 = Math.min(100, (sum / dataArray.length) * 1.6);
      }

      smoothedVolP1 = smoothedVolP1 * 0.8 + instantP1 * 0.2;

      const currentVols = {
        p1: smoothedVolP1,
        p2: volumes.p2,
        p3: volumes.p3,
        p4: volumes.p4
      };

      // 2. Relative Sizing: Higher volume -> larger bubble, others shrink
      const baseConstant = 25;
      const weightedP1 = currentVols.p1 + baseConstant;
      const weightedP2 = currentVols.p2 + baseConstant;
      const weightedP3 = currentVols.p3 + baseConstant;
      const weightedP4 = currentVols.p4 + baseConstant;
      const totalWeight = weightedP1 + weightedP2 + weightedP3 + weightedP4;

      const baseDiameter = 180;
      const targetSizes = {
        p1: Math.min(350, Math.max(100, Math.round(baseDiameter * (weightedP1 / (totalWeight * 0.25))))),
        p2: Math.min(350, Math.max(100, Math.round(baseDiameter * (weightedP2 / (totalWeight * 0.25))))),
        p3: Math.min(350, Math.max(100, Math.round(baseDiameter * (weightedP3 / (totalWeight * 0.25))))),
        p4: Math.min(350, Math.max(100, Math.round(baseDiameter * (weightedP4 / (totalWeight * 0.25)))))
      };

      setBubbleSizes(prev => ({
        p1: Math.round((prev.p1 || 180) * 0.82 + targetSizes.p1 * 0.18),
        p2: Math.round((prev.p2 || 180) * 0.82 + targetSizes.p2 * 0.18),
        p3: Math.round((prev.p3 || 180) * 0.82 + targetSizes.p3 * 0.18),
        p4: Math.round((prev.p4 || 180) * 0.82 + targetSizes.p4 * 0.18)
      }));

      animationFrameRef.current = requestAnimationFrame(computeRelativeSizes);
    };

    computeRelativeSizes();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMicMuted, volumes.p2, volumes.p3, volumes.p4]);

  return (
    <div style={stageContainerStyle}>
      {/* Floating Canvas Area with the 4 Dynamic Camera Bubbles */}
      <div style={floatingCanvasAreaStyle}>
        {players.map((p) => {
          const currentSize = bubbleSizes[p.id] || 180;
          const isDominant = currentSize > 225;

          return (
            <div
              key={p.id}
              className={p.className}
              style={{
                position: 'absolute',
                left: `${p.initialPos.x}%`,
                top: `${p.initialPos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isDominant ? 30 : 10,
                transition: 'z-index 0.2s ease'
              }}
            >
              {/* Outer Wrapper for Sizing */}
              <div
                style={{
                  width: `${currentSize}px`,
                  height: `${currentSize}px`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'width 0.1s ease-out, height 0.1s ease-out'
                }}
              >
                {/* The Circular Video Camera Frame */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `4.5px solid ${p.borderColor}`,
                    boxShadow: isDominant
                      ? `0 0 45px ${p.borderColor}aa, 0 12px 35px rgba(0, 0, 0, 0.8)`
                      : `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px ${p.borderColor}33`,
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#06080d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {p.isLocalUser ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={videoElementStyle}
                    />
                  ) : (
                    <video
                      ref={el => { remoteVideoRefs.current[p.id] = el; }}
                      autoPlay
                      playsInline
                      muted
                      style={videoElementStyle}
                    />
                  )}
                </div>

                {/* Circular Instrument Badge Pinned at Bottom-Right Edge */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-4px',
                    bottom: '-4px',
                    width: `${Math.max(36, Math.round(currentSize * 0.23))}px`,
                    height: `${Math.max(36, Math.round(currentSize * 0.23))}px`,
                    borderRadius: '50%',
                    background: '#0a0c12',
                    border: '2.5px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                    zIndex: 40,
                    transition: 'all 0.15s ease'
                  }}
                  title={p.role}
                >
                  <span style={{ fontSize: `${Math.max(17, Math.round(currentSize * 0.12))}px` }}>
                    {p.instrumentIcon}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const stageContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '0 10px',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0
};

const floatingCanvasAreaStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '340px',
  overflow: 'hidden'
};

const videoElementStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
  display: 'block'
};

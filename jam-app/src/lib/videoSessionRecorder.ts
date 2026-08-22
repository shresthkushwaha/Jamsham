'use client';
import { User } from './webrtcManager';

interface RecordParticipantData {
  user: User;
  isLocal: boolean;
  videoElement?: HTMLVideoElement | null;
  pos: { x: number; y: number; radius: number };
  volume: number;
  activeNotes: string[];
}

const INSTRUMENT_EMOJIS: Record<string, string> = {
  PIANO: '🎹',
  LEAD: '🎹',
  HORN: '🎺',
  BRASS: '🎺',
  GUITAR: '🎸',
  SAX: '🎷',
  DRUMS: '🥁',
  BASS: '🎸',
  STRINGS: '🎻',
  PAD: '🌊',
};

export class VideoSessionRecorder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private animId: number | null = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;

  private width = 1280;
  private height = 720;

  public start(
    getParticipantsData: () => {
      roomId: string;
      stageDimensions: { width: number; height: number };
      participants: RecordParticipantData[];
    },
    audioSources: MediaStream[] = []
  ): boolean {
    if (this.isRecording) return false;

    try {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return false;

      // 1. Setup Audio Mixing Bus
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.audioDestination = this.audioContext.createMediaStreamDestination();

        // Mix all audio sources (Tone.js synthesizer + WebRTC microphones)
        audioSources.forEach((stream) => {
          if (stream && stream.getAudioTracks().length > 0) {
            try {
              const srcNode = this.audioContext!.createMediaStreamSource(stream);
              srcNode.connect(this.audioDestination!);
            } catch (err) {
              console.warn('[VideoRecorder] Failed to mix audio source:', err);
            }
          }
        });
      }

      // 2. Capture Video Stream from Canvas (30 FPS)
      const canvasStream = this.canvas.captureStream(30);

      // 3. Merge Video Track with Mixed Audio Track
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      if (this.audioDestination?.stream) {
        this.audioDestination.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      // 4. Create MediaRecorder with supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType: selectedMime });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;

      // 5. Continuous 30 FPS Canvas Rendering Loop
      const renderLoop = () => {
        if (!this.isRecording || !this.ctx || !this.canvas) return;

        const { roomId, stageDimensions, participants } = getParticipantsData();
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Background
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, w, h);

        // Header watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '600 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`JAMSHAM SESSION • Room: ${roomId}`, 36, 42);

        // Live recording indicator
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(w - 110, 36, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('REC', w - 96, 41);

        // Scale factors from DOM stage to 1280x720 canvas
        const scaleX = w / (stageDimensions.width || w);
        const scaleY = h / (stageDimensions.height || h);

        // Render each participant bubble
        participants.forEach(({ user, isLocal, videoElement, pos, volume, activeNotes }) => {
          const cx = pos.x * scaleX;
          const cy = pos.y * scaleY;
          const r = pos.radius * Math.min(scaleX, scaleY);
          const color = user.instrument?.color || '#9C27B0';
          const isNoteActive = activeNotes.length > 0;
          const instKey = (user.instrument?.id || 'PIANO').toUpperCase();
          const emoji = INSTRUMENT_EMOJIS[instKey] || '🎵';

          // Outer Glow Ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = isNoteActive ? 8 : 5;
          ctx.shadowColor = color;
          ctx.shadowBlur = isNoteActive ? 35 : 16 + volume * 0.25;
          ctx.stroke();
          ctx.restore();

          // Clip Circle for Video / Avatar
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();

          // Draw Video frame with EXACT object-fit: cover Aspect Ratio (NO SQUASHING)
          let drawnVideo = false;
          if (videoElement && videoElement.readyState >= 2 && !user.isVideoOff) {
            try {
              const vw = videoElement.videoWidth || 640;
              const vh = videoElement.videoHeight || 480;
              const cropSize = Math.min(vw, vh);
              const sx = (vw - cropSize) / 2;
              const sy = (vh - cropSize) / 2;

              if (isLocal) {
                // Mirror local webcam cleanly
                ctx.translate(cx * 2, 0);
                ctx.scale(-1, 1);
              }

              ctx.drawImage(
                videoElement,
                sx,
                sy,
                cropSize,
                cropSize, // Source center crop
                cx - r,
                cy - r,
                r * 2,
                r * 2 // Destination 1:1 circle bounds
              );
              drawnVideo = true;
            } catch {
              drawnVideo = false;
            }
          }

          if (!drawnVideo) {
            // Avatar fallback
            ctx.fillStyle = '#11111a';
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.round(r * 0.28)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(user.userName.slice(0, 2).toUpperCase(), cx, cy);
          }
          ctx.restore();

          // Floating Instrument Badge (Bottom Right)
          const badgeR = Math.max(16, r * 0.24);
          const badgeX = cx + r * 0.68;
          const badgeY = cy + r * 0.68;

          ctx.save();
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.font = `${Math.round(badgeR * 1.1)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, badgeX, badgeY + 1);
          ctx.restore();

          // User Name & Role Tag Pill
          const tagW = Math.max(90, r * 0.9);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.roundRect(cx - tagW / 2, cy + r - 26, tagW, 22, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${user.userName} ${user.isAdmin ? '👑' : ''}`, cx, cy + r - 15);
        });

        this.animId = requestAnimationFrame(renderLoop);
      };

      this.animId = requestAnimationFrame(renderLoop);
      return true;
    } catch (e) {
      console.error('[VideoSessionRecorder] Failed to start:', e);
      return false;
    }
  }

  public async stop(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.isRecording) return null;

    if (this.animId) cancelAnimationFrame(this.animId);
    this.isRecording = false;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const videoBlob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'video/webm' });
        this.recordedChunks = [];
        if (this.audioContext) {
          this.audioContext.close();
          this.audioContext = null;
        }
        resolve(videoBlob);
      };
      this.mediaRecorder!.stop();
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const videoSessionRecorder = new VideoSessionRecorder();

'use client';
import { io, Socket } from 'socket.io-client';

export interface User {
  socketId: string;
  userName: string;
  instrument: {
    id: string;
    name: string;
    color: string;
    role: string;
    isShared?: boolean;
  };
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface NoteEvent {
  instrument: string;
  note: string | string[];
  duration?: string;
  velocity?: number;
  fromSocketId?: string;
  timestamp?: number;
}

export interface ChatMessage {
  id: string;
  socketId: string;
  userName: string;
  text: string;
  timestamp: number;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private audioContext: AudioContext | null = null;
  private volumeInterval: any = null;

  public localUser: User | null = null;
  public roomId: string = '';

  // Event callbacks
  public onUserJoined?: (user: User, allUsers: User[]) => void;
  public onUserLeft?: (socketId: string, remainingUsers: User[]) => void;
  public onRemoteStream?: (socketId: string, stream: MediaStream) => void;
  public onNotePlay?: (event: NoteEvent) => void;
  public onNoteStop?: (event: NoteEvent) => void;
  public onMediaUpdated?: (socketId: string, isMuted: boolean, isVideoOff: boolean) => void;
  public onBpmUpdated?: (bpm: number) => void;
  public onChatMessage?: (msg: ChatMessage) => void;
  public onVolumeLevels?: (levels: Record<string, number>) => void;

  public async connectAndJoin(
    roomId: string,
    userName: string,
    serverUrl?: string
  ): Promise<{ user: User; users: User[]; bpm: number }> {
    this.roomId = roomId;

    // Determine backend URL
    const backendUrl =
      serverUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : 'http://localhost:3001');

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });

    // Request local media stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // keep singing natural
          autoGainControl: true,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access declined or unavailable, running in audio-only / simulated mode', err);
      // Create empty fallback stream so peer connections can still negotiate
      this.localStream = new MediaStream();
    }

    this.setupSocketListeners();
    this.startVolumeMonitoring();

    return new Promise((resolve, reject) => {
      this.socket?.emit('join_room', { roomId, userName }, (res: any) => {
        if (res?.success) {
          this.localUser = res.user;
          resolve({
            user: res.user,
            users: res.room.users,
            bpm: res.room.bpm,
          });
        } else {
          reject(new Error('Failed to join room'));
        }
      });
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Existing user sees a new user join -> create WebRTC Offer
    this.socket.on('user_joined', async ({ user, allUsers }: { user: User; allUsers: User[] }) => {
      console.log('[WebRTC] New peer joined:', user.userName);
      this.onUserJoined?.(user, allUsers);
      await this.createOfferForPeer(user.socketId);
    });

    // A user left
    this.socket.on('user_left', ({ socketId, remainingUsers }: { socketId: string; remainingUsers: User[] }) => {
      this.closePeer(socketId);
      this.onUserLeft?.(socketId, remainingUsers);
    });

    // WebRTC Signaling
    this.socket.on('webrtc_signal', async ({ fromSocketId, signalType, data }) => {
      if (signalType === 'offer') {
        await this.handleOffer(fromSocketId, data);
      } else if (signalType === 'answer') {
        await this.handleAnswer(fromSocketId, data);
      } else if (signalType === 'ice-candidate') {
        await this.handleIceCandidate(fromSocketId, data);
      }
    });

    // Remote Note triggers
    this.socket.on('note_play', (event: NoteEvent) => {
      this.onNotePlay?.(event);
    });

    this.socket.on('note_stop', (event: NoteEvent) => {
      this.onNoteStop?.(event);
    });

    // Media state toggles (mic/video)
    this.socket.on('user_media_updated', ({ socketId, isMuted, isVideoOff }) => {
      this.onMediaUpdated?.(socketId, isMuted, isVideoOff);
    });

    // BPM updates
    this.socket.on('bpm_updated', ({ bpm }: { bpm: number }) => {
      this.onBpmUpdated?.(bpm);
    });

    // Chat messages
    this.socket.on('chat_message', (msg: ChatMessage) => {
      this.onChatMessage?.(msg);
    });
  }

  private createPeerConnection(peerSocketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc_signal', {
          targetSocketId: peerSocketId,
          signalType: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    // Remote stream received
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(peerSocketId, stream);
      this.onRemoteStream?.(peerSocketId, stream);
    };

    this.peerConnections.set(peerSocketId, pc);
    return pc;
  }

  private async createOfferForPeer(peerSocketId: string) {
    const pc = this.createPeerConnection(peerSocketId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket?.emit('webrtc_signal', {
        targetSocketId: peerSocketId,
        signalType: 'offer',
        data: offer,
      });
    } catch (e) {
      console.error('[WebRTC] Create offer error:', e);
    }
  }

  private async handleOffer(peerSocketId: string, offer: RTCSessionDescriptionInit) {
    let pc = this.peerConnections.get(peerSocketId);
    if (!pc) {
      pc = this.createPeerConnection(peerSocketId);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.socket?.emit('webrtc_signal', {
        targetSocketId: peerSocketId,
        signalType: 'answer',
        data: answer,
      });
    } catch (e) {
      console.error('[WebRTC] Handle offer error:', e);
    }
  }

  private async handleAnswer(peerSocketId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(peerSocketId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.error('[WebRTC] Handle answer error:', e);
      }
    }
  }

  private async handleIceCandidate(peerSocketId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(peerSocketId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[WebRTC] Add ICE candidate error:', e);
      }
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(socketId: string): MediaStream | undefined {
    return this.remoteStreams.get(socketId);
  }

  // Instrument Note Events
  public emitNotePlay(event: NoteEvent) {
    this.socket?.emit('note_play', event);
  }

  public emitNoteStop(event: NoteEvent) {
    this.socket?.emit('note_stop', event);
  }

  // Media Controls
  public toggleMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    this.socket?.emit('update_media_state', { isMuted: muted });
  }

  public toggleVideo(videoOff: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoOff;
      });
    }
    this.socket?.emit('update_media_state', { isVideoOff: videoOff });
  }

  public setBpm(bpm: number) {
    this.socket?.emit('update_bpm', { bpm });
  }

  public sendChatMessage(text: string, userName: string) {
    this.socket?.emit('send_chat', { text, userName });
  }

  // Audio level monitoring for VU meters
  private startVolumeMonitoring() {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();

      let localAnalyser: AnalyserNode | null = null;
      if (this.localStream && this.localStream.getAudioTracks().length > 0) {
        try {
          const source = this.audioContext.createMediaStreamSource(this.localStream);
          localAnalyser = this.audioContext.createAnalyser();
          localAnalyser.fftSize = 32;
          source.connect(localAnalyser);
        } catch {
          // Ignore
        }
      }

      this.volumeInterval = setInterval(() => {
        const levels: Record<string, number> = {};

        if (localAnalyser && this.localUser) {
          const data = new Uint8Array(localAnalyser.frequencyBinCount);
          localAnalyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;
          levels[this.localUser.socketId] = Math.min(100, Math.round((avg / 128) * 100));
        }

        this.onVolumeLevels?.(levels);
      }, 100);
    } catch {
      // Ignore
    }
  }

  private closePeer(socketId: string) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
    this.remoteStreams.delete(socketId);
  }

  public disconnect() {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.socket?.disconnect();
  }
}

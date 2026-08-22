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
  isAdmin?: boolean;
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

const INSTRUMENT_POOL = [
  { id: 'DRUMS', name: 'Acoustic Drums', role: 'Rhythm & Beats', color: '#FF5722' },
  { id: 'BASS', name: 'Electric Bass', role: 'Groove & Low End', color: '#E040FB' },
  { id: 'PIANO', name: 'Grand Piano', role: 'Melody & Harmony', color: '#00E676' },
  { id: 'GUITAR', name: 'Electric / Acoustic Guitar', role: 'Chords & Riffs', color: '#FF9800' },
  { id: 'SAX', name: 'Saxophone & Horns', role: 'Soulful Leads', color: '#FFD600' },
  { id: 'STRINGS', name: 'String Section', role: 'Violin & Cello Swells', color: '#00B0FF' },
  { id: 'PAD', name: 'Ambient Synth Pad', role: 'Atmospheric Chords', color: '#26A69A' },
  { id: 'LEAD', name: 'Synth Lead & Keys', role: 'Electronic Melodies', color: '#AB47BC' },
];

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // STUN servers (for direct P2P)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // FREE TURN relay servers (openrelay.metered.ca) — required for mobile & cross-network
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
};

export class WebRTCManager {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private candidateQueue: Map<string, RTCIceCandidateInit[]> = new Map();
  private audioContext: AudioContext | null = null;
  private analysers: Map<string, AnalyserNode> = new Map();
  private volumeInterval: any = null;
  private heartbeatInterval: any = null;
  public isSoloMode: boolean = false;

  public localUser: User | null = null;
  public roomId: string = '';
  public currentUserName: string = '';

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
    this.currentUserName = userName;

    // Request local camera and microphone stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access declined or simulated mode', err);
      this.localStream = new MediaStream();
    }

    // Determine WebSocket backend URL
    const envUrl = process.env.NEXT_PUBLIC_JAM_SERVER_URL;
    let backendUrl = serverUrl || envUrl;

    if (!backendUrl && typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        backendUrl = 'http://localhost:3001';
      } else {
        backendUrl = 'https://jamsham.onrender.com';
      }
    }

    if (!backendUrl) {
      console.info('[WebRTC] No external backend URL configured. Entering standalone Jam Stage.');
      return this.enterStandaloneMode(roomId, userName);
    }

    return new Promise((resolve) => {
      let hasResolved = false;

      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          console.warn('[WebRTC] Backend connection timed out. Launching standalone Jam Stage.');
          resolve(this.enterStandaloneMode(roomId, userName));
        }
      }, 6000);

      try {
        this.socket = io(backendUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        this.setupSocketListeners();

        // Keep-alive heartbeat
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          if (this.socket?.connected) {
            this.socket.emit('ping_heartbeat');
          }
        }, 15000);

        this.socket.on('connect_error', (err) => {
          console.warn('[WebRTC] Socket connect error:', err.message);
        });

        this.socket.on('connect', () => {
          this.socket?.emit('join_room', { roomId, userName }, (res: any) => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(timeoutId);

              if (res?.success) {
                this.localUser = res.user;

                if (this.localStream && this.localUser) {
                  this.attachAudioAnalyser(this.localUser.socketId, this.localStream);
                }
                this.startVolumeMonitoring();

                // Multi-User Mesh: Connect with every existing peer in the room
                const existingPeers: User[] = res.room.users || [];
                existingPeers.forEach((peer) => {
                  if (peer.socketId !== res.user.socketId) {
                    // Create peer connection immediately
                    this.createPeerConnection(peer.socketId);
                  }
                });

                resolve({
                  user: res.user,
                  users: res.room.users,
                  bpm: res.room.bpm,
                });
              } else {
                resolve(this.enterStandaloneMode(roomId, userName));
              }
            }
          });
        });
      } catch (err) {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);
          resolve(this.enterStandaloneMode(roomId, userName));
        }
      }
    });
  }

  // Standalone mode fallback
  private enterStandaloneMode(roomId: string, userName: string): { user: User; users: User[]; bpm: number } {
    this.isSoloMode = true;
    const randomInst = INSTRUMENT_POOL[Math.floor(Math.random() * INSTRUMENT_POOL.length)];
    const mockUser: User = {
      socketId: `solo-${Math.random().toString(36).substring(2, 9)}`,
      userName: userName || 'Host',
      instrument: randomInst,
      isAdmin: true,
      isMuted: false,
      isVideoOff: false,
    };

    this.localUser = mockUser;

    if (this.localStream) {
      this.attachAudioAnalyser(mockUser.socketId, this.localStream);
    }
    this.startVolumeMonitoring();

    return {
      user: mockUser,
      users: [mockUser],
      bpm: 120,
    };
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('reconnect', () => {
      console.log('[WebRTC] Reconnected to server, re-joining room:', this.roomId);
      this.socket?.emit('join_room', { roomId: this.roomId, userName: this.currentUserName });
    });

    this.socket.on('user_joined', async ({ user, allUsers }: { user: User; allUsers: User[] }) => {
      this.onUserJoined?.(user, allUsers);
      // Existing peers initiate offer to the new joiner
      if (user.socketId !== this.localUser?.socketId) {
        await this.createOfferForPeer(user.socketId);
      }
    });

    this.socket.on('user_left', ({ socketId, remainingUsers }: { socketId: string; remainingUsers: User[] }) => {
      this.closePeer(socketId);
      this.onUserLeft?.(socketId, remainingUsers);
    });

    this.socket.on('webrtc_signal', async ({ fromSocketId, signalType, data }) => {
      if (signalType === 'offer') {
        await this.handleOffer(fromSocketId, data);
      } else if (signalType === 'answer') {
        await this.handleAnswer(fromSocketId, data);
      } else if (signalType === 'ice-candidate') {
        await this.handleIceCandidate(fromSocketId, data);
      }
    });

    this.socket.on('note_play', (event: NoteEvent) => {
      this.onNotePlay?.(event);
    });

    this.socket.on('note_stop', (event: NoteEvent) => {
      this.onNoteStop?.(event);
    });

    this.socket.on('user_media_updated', ({ socketId, isMuted, isVideoOff }) => {
      this.onMediaUpdated?.(socketId, isMuted, isVideoOff);
    });

    this.socket.on('bpm_updated', ({ bpm }: { bpm: number }) => {
      this.onBpmUpdated?.(bpm);
    });

    this.socket.on('chat_message', (msg: ChatMessage) => {
      this.onChatMessage?.(msg);
    });
  }

  private createPeerConnection(peerSocketId: string): RTCPeerConnection {
    const existing = this.peerConnections.get(peerSocketId);
    if (existing && existing.connectionState !== 'closed') {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc_signal', {
          targetSocketId: peerSocketId,
          signalType: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const currentStream = this.remoteStreams.get(peerSocketId);
      const allTracks = currentStream ? [...currentStream.getTracks()] : [];

      if (event.track && !allTracks.some((t) => t.id === event.track.id)) {
        allTracks.push(event.track);
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!allTracks.some((ex) => ex.id === t.id)) allTracks.push(t);
        });
      }

      const stream = new MediaStream(allTracks);
      this.remoteStreams.set(peerSocketId, stream);
      this.attachAudioAnalyser(peerSocketId, stream);
      this.onRemoteStream?.(peerSocketId, stream);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE failed for peer', peerSocketId, 'restarting ICE...');
        pc.restartIce();
      }
    };

    this.peerConnections.set(peerSocketId, pc);
    return pc;
  }

  private async createOfferForPeer(peerSocketId: string, iceRestart = false) {
    const pc = this.createPeerConnection(peerSocketId);
    try {
      const offer = await pc.createOffer({ iceRestart });
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
    const pc = this.createPeerConnection(peerSocketId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const queued = this.candidateQueue.get(peerSocketId) || [];
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Flush candidate error:', e);
        }
      }
      this.candidateQueue.delete(peerSocketId);

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

        const queued = this.candidateQueue.get(peerSocketId) || [];
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('[WebRTC] Flush candidate error:', e);
          }
        }
        this.candidateQueue.delete(peerSocketId);
      } catch (e) {
        console.error('[WebRTC] Handle answer error:', e);
      }
    }
  }

  private async handleIceCandidate(peerSocketId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(peerSocketId);
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[WebRTC] Add ICE candidate error:', e);
      }
    } else {
      const queued = this.candidateQueue.get(peerSocketId) || [];
      queued.push(candidate);
      this.candidateQueue.set(peerSocketId, queued);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(socketId: string): MediaStream | undefined {
    return this.remoteStreams.get(socketId);
  }

  public emitNotePlay(event: NoteEvent) {
    this.socket?.emit('note_play', event);
  }

  public emitNoteStop(event: NoteEvent) {
    this.socket?.emit('note_stop', event);
  }

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

  private attachAudioAnalyser(socketId: string, stream: MediaStream) {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioContext = new AudioCtx();
      }

      if (stream.getAudioTracks().length > 0) {
        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        this.analysers.set(socketId, analyser);
      }
    } catch (err) {
      console.warn('[WebRTC] Failed to attach audio analyser for', socketId, err);
    }
  }

  private startVolumeMonitoring() {
    if (typeof window === 'undefined') return;

    if (this.volumeInterval) clearInterval(this.volumeInterval);

    this.volumeInterval = setInterval(() => {
      const levels: Record<string, number> = {};

      this.analysers.forEach((analyser, socketId) => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const normalized = Math.min(100, Math.round((avg / 80) * 100));
        levels[socketId] = normalized;
      });

      this.onVolumeLevels?.(levels);
    }, 40);
  }

  private closePeer(socketId: string) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
    this.candidateQueue.delete(socketId);
    this.analysers.delete(socketId);
    this.remoteStreams.delete(socketId);
  }

  public disconnect() {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.candidateQueue.clear();
    this.analysers.clear();
    this.remoteStreams.clear();
    this.localStream?.getTracks().forEach((track) => track.stop());
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.socket?.disconnect();
  }
}

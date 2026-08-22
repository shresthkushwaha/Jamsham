'use client';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  RemoteTrackPublication,
  createLocalTracks,
  LocalVideoTrack,
  LocalAudioTrack,
  DataPacket_Kind,
} from 'livekit-client';

export interface User {
  socketId: string; // Used as unique participant identity
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

export class LiveKitManager {
  private room: Room | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private audioContext: AudioContext | null = null;
  private analysers: Map<string, AnalyserNode> = new Map();
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
  public onVolumeLevels?: (levels: Record<string, number>) => void;
  public onRoomClosed?: () => void;
  public onKicked?: (reason?: string) => void;
  public onMutedByAdmin?: (isMuted: boolean) => void;

  public async connectAndJoin(
    roomId: string,
    userName: string
  ): Promise<{ user: User; users: User[]; bpm: number }> {
    this.roomId = roomId;

    // 1. Fetch Token from Next.js API
    const res = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userName }),
    });

    if (!res.ok) {
      throw new Error(`Failed to get LiveKit token: ${res.statusText}`);
    }

    const data = await res.json();
    const { token, serverUrl, identity, instrument } = data;

    // 2. Initialize LiveKit Room with high quality audio/video settings
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: false, // Keep musical harmonics
        autoGainControl: true,
      },
      videoCaptureDefaults: {
        resolution: { width: 640, height: 480, frameRate: 24 },
        facingMode: 'user',
      },
    });

    this.localUser = {
      socketId: identity,
      userName,
      instrument,
      isAdmin: true,
      isMuted: false,
      isVideoOff: false,
    };

    // 3. Setup Listeners
    this.setupRoomListeners();

    // 4. Connect to LiveKit Cloud SFU
    await this.room.connect(serverUrl, token);
    console.log('[LiveKit] Connected to room:', roomId, 'as identity:', identity);

    // 5. Create & Publish local audio/video tracks
    try {
      const tracks = await createLocalTracks({
        audio: true,
        video: true,
      });

      const mediaStream = new MediaStream();
      for (const track of tracks) {
        await this.room.localParticipant.publishTrack(track);
        mediaStream.addTrack(track.mediaStreamTrack);
      }

      this.localStream = mediaStream;
      this.attachAudioAnalyser(identity, mediaStream);
    } catch (e) {
      console.warn('[LiveKit] Camera/Mic publish warning:', e);
      this.localStream = new MediaStream();
    }

    this.startVolumeMonitoring();

    const allUsers = this.buildUserList();

    return {
      user: this.localUser,
      users: allUsers,
      bpm: 120,
    };
  }

  private setupRoomListeners() {
    if (!this.room) return;

    // Track Subscribed (Remote participant video/audio track ready)
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('[LiveKit] TrackSubscribed:', track.kind, 'from', participant.identity);
      const identity = participant.identity;

      let stream = this.remoteStreams.get(identity);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(identity, stream);
      }

      if (track.mediaStreamTrack && !stream.getTracks().some((t) => t.id === track.mediaStreamTrack.id)) {
        stream.addTrack(track.mediaStreamTrack);
      }

      // Fresh stream instance to trigger React state re-renders
      const freshStream = new MediaStream(stream.getTracks());
      this.remoteStreams.set(identity, freshStream);

      this.attachAudioAnalyser(identity, freshStream);
      this.onRemoteStream?.(identity, freshStream);
    });

    // Track Unsubscribed
    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      const identity = participant.identity;
      const stream = this.remoteStreams.get(identity);
      if (stream && track.mediaStreamTrack) {
        stream.removeTrack(track.mediaStreamTrack);
        const fresh = new MediaStream(stream.getTracks());
        this.remoteStreams.set(identity, fresh);
        this.onRemoteStream?.(identity, fresh);
      }
    });

    // Participant Connected
    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('[LiveKit] ParticipantConnected:', participant.identity);
      const user = this.parseParticipantUser(participant);
      const allUsers = this.buildUserList();
      this.onUserJoined?.(user, allUsers);
    });

    // Participant Disconnected
    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('[LiveKit] ParticipantDisconnected:', participant.identity);
      const identity = participant.identity;
      this.remoteStreams.delete(identity);
      this.analysers.delete(identity);
      const allUsers = this.buildUserList();
      this.onUserLeft?.(identity, allUsers);
    });

    // Data Received (Ultra-low latency Note Events, Chat, and Admin Controls)
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === 'note_play') {
          this.onNotePlay?.({
            ...data.event,
            fromSocketId: participant?.identity || data.event?.fromSocketId,
          });
        } else if (data.type === 'note_stop') {
          this.onNoteStop?.({
            ...data.event,
            fromSocketId: participant?.identity || data.event?.fromSocketId,
          });
        } else if (data.type === 'bpm_updated') {
          this.onBpmUpdated?.(data.bpm);
        } else if (data.type === 'close_room') {
          this.onRoomClosed?.();
        } else if (data.type === 'admin_kick_user') {
          if (data.targetIdentity === this.localUser?.socketId) {
            this.onKicked?.('The session host has removed you from the room.');
          }
        } else if (data.type === 'admin_mute_user') {
          if (data.targetIdentity === this.localUser?.socketId) {
            this.toggleMute(data.isMuted);
            this.onMutedByAdmin?.(data.isMuted);
          }
        }
      } catch (err) {
        console.warn('[LiveKit Data Parse Error]:', err);
      }
    });
  }

  private parseParticipantUser(participant: RemoteParticipant | LocalParticipant): User {
    let metadata: any = {};
    try {
      if (participant.metadata) {
        metadata = JSON.parse(participant.metadata);
      }
    } catch {}

    return {
      socketId: participant.identity,
      userName: participant.name || metadata.userName || participant.identity.split('-')[0],
      instrument: metadata.instrument || { id: 'KEYBOARD', name: 'Keyboard', color: '#00E676', role: 'Melody & Harmony' },
      isAdmin: !!metadata.isAdmin,
      isMuted: !participant.isMicrophoneEnabled,
      isVideoOff: !participant.isCameraEnabled,
    };
  }

  private buildUserList(): User[] {
    const list: User[] = [];
    if (this.localUser) list.push(this.localUser);

    if (this.room) {
      this.room.remoteParticipants.forEach((p) => {
        list.push(this.parseParticipantUser(p));
      });
    }
    return list;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(socketId: string): MediaStream | undefined {
    return this.remoteStreams.get(socketId);
  }

  public emitNotePlay(event: NoteEvent) {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'note_play', event }));
    this.room.localParticipant.publishData(payload, { reliable: false });
  }

  public emitNoteStop(event: NoteEvent) {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'note_stop', event }));
    this.room.localParticipant.publishData(payload, { reliable: false });
  }

  public setBpm(bpm: number) {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'bpm_updated', bpm }));
    this.room.localParticipant.publishData(payload, { reliable: true });
  }

  // Admin: Close room for all participants
  public emitCloseRoom() {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'close_room' }));
    this.room.localParticipant.publishData(payload, { reliable: true });
  }

  // Admin: Mute specific remote participant
  public emitMuteUser(targetIdentity: string, isMuted: boolean = true) {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'admin_mute_user', targetIdentity, isMuted }));
    this.room.localParticipant.publishData(payload, { reliable: true });
  }

  // Admin: Kick specific remote participant from room
  public emitKickUser(targetIdentity: string) {
    if (!this.room) return;
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'admin_kick_user', targetIdentity }));
    this.room.localParticipant.publishData(payload, { reliable: true });
  }

  public async toggleMute(muted: boolean) {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setMicrophoneEnabled(!muted);
    }
    if (this.localUser) this.localUser.isMuted = muted;
  }

  public async toggleVideo(videoOff: boolean) {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setCameraEnabled(!videoOff);
    }
    if (this.localUser) this.localUser.isVideoOff = videoOff;
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
      console.warn('[LiveKit] Failed to attach audio analyser for', socketId, err);
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

  public disconnect() {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    this.analysers.clear();
    this.remoteStreams.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.room?.disconnect();
    this.room = null;
  }
}

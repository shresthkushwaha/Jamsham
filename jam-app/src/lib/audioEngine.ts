'use client';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private masterGain: Tone.Gain | null = null;
  private masterLimiter: Tone.Limiter | null = null;
  private analyser: Tone.Analyser | null = null;
  private effectsReverb: Tone.Reverb | null = null;
  private effectsDelay: Tone.FeedbackDelay | null = null;
  private masterFilter: Tone.Filter | null = null;
  private isFilterOn = false;

  // Recording
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingSession = false;

  // Drum synths
  private drumKick: Tone.MembraneSynth | null = null;
  private drumSnareBody: Tone.MembraneSynth | null = null;
  private drumSnareNoise: Tone.NoiseSynth | null = null;
  private drumHiHat: Tone.MetalSynth | null = null;
  private drumCymbal: Tone.MetalSynth | null = null;
  private drumClap: Tone.NoiseSynth | null = null;

  // Melodic & Chord synths
  private keyboardSynth: Tone.PolySynth | null = null;
  private guitarSynth: Tone.PolySynth | null = null;
  private bassSynth: Tone.PolySynth | null = null;
  private trumpetSynth: Tone.PolySynth | null = null;
  private stringsSynth: Tone.PolySynth | null = null;

  public async init() {
    if (this.isInitialized) {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
        } catch {
          // Ignored
        }
      }
      return;
    }

    try {
      await Tone.start();
    } catch {
      // Browser autoplay policy might need first user click
    }

    try {
      // 1. Master Output Chain: Limiter -> MasterGain -> Analyser -> Destination
      this.masterLimiter = new Tone.Limiter(-1).toDestination();
      this.masterGain = new Tone.Gain(1.0).connect(this.masterLimiter);
      this.analyser = new Tone.Analyser('fft', 64);
      this.masterGain.connect(this.analyser);

      // Recording Destination Node
      try {
        const rawCtx = Tone.getContext().rawContext as AudioContext;
        if (rawCtx && rawCtx.createMediaStreamDestination) {
          this.recorderDestination = rawCtx.createMediaStreamDestination();
          this.masterGain.connect(this.recorderDestination as any);
        }
      } catch (e) {
        console.warn('[AudioEngine] Recorder destination not supported:', e);
      }

      // Filter FX Node
      this.masterFilter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -12,
      });

      // Spatial & Room Effects
      this.effectsReverb = new Tone.Reverb({ decay: 2.0, preDelay: 0.01, wet: 0.2 });
      this.effectsDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.15, wet: 0.12 });

      this.effectsReverb.connect(this.masterGain);
      this.effectsDelay.connect(this.masterGain);

      // 2. DRUM VOICES
      this.drumKick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 7,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.35 },
      }).connect(this.masterGain);

      this.drumSnareBody = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 2,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.15 },
      }).connect(this.masterGain);

      this.drumSnareNoise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
      }).connect(this.masterGain);

      this.drumHiHat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.06, release: 0.04 },
        harmonicity: 5.1,
        modulationIndex: 28,
        resonance: 4500,
        octaves: 1.2,
      }).connect(this.masterGain);

      this.drumCymbal = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.8, release: 0.4 },
        harmonicity: 4.8,
        modulationIndex: 36,
        resonance: 3800,
        octaves: 1.8,
      }).connect(this.masterGain);

      this.drumClap = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.005, decay: 0.14, sustain: 0 },
      }).connect(this.masterGain);

      // 3. KEYBOARD / PIANO VOICE
      this.keyboardSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.6 },
      });
      this.keyboardSynth.connect(this.effectsReverb);
      this.keyboardSynth.connect(this.masterGain);

      // 4. GUITAR VOICE
      this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth8' },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 0.5 },
      });
      this.guitarSynth.connect(this.effectsReverb);
      this.guitarSynth.connect(this.masterGain);

      // 5. BASS VOICE
      this.bassSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 15 },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
      });
      this.bassSynth.connect(this.masterGain);

      // 6. BRASS / TRUMPET VOICE
      this.trumpetSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1.0,
        modulationIndex: 8,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
      });
      this.trumpetSynth.connect(this.effectsReverb);
      this.trumpetSynth.connect(this.masterGain);

      // 7. STRINGS & PADS
      this.stringsSynth = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 2.5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 },
      });
      this.stringsSynth.connect(this.effectsReverb);
      this.stringsSynth.connect(this.effectsDelay);
      this.stringsSynth.connect(this.masterGain);

      this.isInitialized = true;
      console.log('[AudioEngine] All audio voices initialized and ready.');
    } catch (e) {
      console.error('[AudioEngine] Initialization error:', e);
    }
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(64);
    return this.analyser.getValue() as Float32Array;
  }

  // Ensure Audio Context is active on user action
  private ensureContextRunning() {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized) {
      this.init();
    }
    if (Tone.context.state !== 'running') {
      Tone.context.resume().catch(() => {});
      Tone.start().catch(() => {});
    }
  }

  // Trigger Note / Drum Hit
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.85) {
    this.ensureContextRunning();

    try {
      const now = Tone.now();
      const inst = (instrumentId || 'KEYBOARD').toUpperCase();

      if (inst.includes('DRUM')) {
        this.playDrumSound(noteOrType as string, velocity, now);
      } else if (inst.includes('GUITAR') || inst.includes('STRUM')) {
        this.playGuitar(noteOrType, duration, velocity, now);
      } else if (inst.includes('BASS')) {
        this.playBass(noteOrType, duration, velocity, now);
      } else if (inst.includes('TRUMPET') || inst.includes('BRASS') || inst.includes('SAX') || inst.includes('HORN')) {
        this.playBrass(noteOrType, duration, velocity, now);
      } else if (inst.includes('STRING') || inst.includes('PAD')) {
        this.playStrings(noteOrType, duration, velocity, now);
      } else {
        // Grand Piano / Keyboard / Lead Synth / Default
        this.playKeyboard(noteOrType, duration, velocity, now);
      }
    } catch (e) {
      console.warn('[AudioEngine] Play error:', e);
    }
  }

  private playDrumSound(type: string, velocity: number, time: number) {
    const soundKey = (type || 'KICK').toUpperCase();
    switch (soundKey) {
      case 'KICK':
        this.drumKick?.triggerAttackRelease('C1', '8n', time, velocity);
        break;
      case 'SNARE':
        this.drumSnareNoise?.triggerAttackRelease('16n', time, velocity * 0.9);
        this.drumSnareBody?.triggerAttackRelease('G1', '16n', time, velocity * 0.6);
        break;
      case 'HIHAT':
      case 'HI-HAT':
      case 'CLOSED HAT':
        this.drumHiHat?.triggerAttackRelease('32n', time, velocity * 0.7);
        break;
      case 'OPEN HAT':
      case 'OPEN':
        this.drumHiHat?.triggerAttackRelease('8n', time, velocity * 0.85);
        break;
      case 'CRASH':
        this.drumCymbal?.triggerAttackRelease('2n', time, velocity * 0.95);
        break;
      case 'RIDE':
        this.drumHiHat?.triggerAttackRelease('8n', time, velocity * 0.6);
        break;
      case 'TOM 1':
      case 'TOM1':
        this.drumKick?.triggerAttackRelease('G2', '8n', time, velocity * 0.85);
        break;
      case 'TOM 2':
      case 'TOM2':
        this.drumKick?.triggerAttackRelease('D2', '8n', time, velocity * 0.85);
        break;
      case 'FLOOR TOM':
      case 'FLOOR':
        this.drumKick?.triggerAttackRelease('A1', '8n', time, velocity * 0.9);
        break;
      case 'CLAP':
        this.drumClap?.triggerAttackRelease('32n', time, velocity);
        break;
      case 'COWBELL':
        this.drumHiHat?.triggerAttackRelease('16n', time, velocity * 0.8);
        break;
      case 'TAMBOURINE':
      case 'TAMB':
      case 'SHAKER':
        this.drumClap?.triggerAttackRelease('64n', time, velocity * 0.5);
        break;
      default:
        this.drumKick?.triggerAttackRelease('C2', '8n', time, velocity);
    }
  }

  private playGuitar(noteOrType: string | string[], duration: string, velocity: number, time: number) {
    if (!this.guitarSynth) return;
    if (Array.isArray(noteOrType)) {
      // Strum arpeggiation
      noteOrType.forEach((note, idx) => {
        this.guitarSynth?.triggerAttackRelease(note, duration, time + idx * 0.025, velocity * 0.9);
      });
    } else if (typeof noteOrType === 'string') {
      this.guitarSynth.triggerAttackRelease(noteOrType, duration, time, velocity);
    }
  }

  private playKeyboard(noteOrType: string | string[], duration: string, velocity: number, time: number) {
    if (!this.keyboardSynth) return;
    this.keyboardSynth.triggerAttackRelease(noteOrType, duration, time, velocity);
  }

  private playBass(noteOrType: string | string[], duration: string, velocity: number, time: number) {
    if (!this.bassSynth) return;
    this.bassSynth.triggerAttackRelease(noteOrType, duration, time, velocity);
  }

  private playBrass(noteOrType: string | string[], duration: string, velocity: number, time: number) {
    if (!this.trumpetSynth) return;
    this.trumpetSynth.triggerAttackRelease(noteOrType, duration, time, velocity);
  }

  private playStrings(noteOrType: string | string[], duration: string, velocity: number, time: number) {
    if (!this.stringsSynth) return;
    this.stringsSynth.triggerAttackRelease(noteOrType, duration, time, velocity);
  }

  // Release note for sustained keys
  public stopNote(instrumentId: string, note?: string | string[]) {
    if (!this.isInitialized) return;
    try {
      const inst = (instrumentId || 'KEYBOARD').toUpperCase();
      const notesToStop = Array.isArray(note) ? note : note ? [note] : [];

      if (notesToStop.length === 0) return;

      if (inst.includes('GUITAR')) {
        notesToStop.forEach((n) => this.guitarSynth?.triggerRelease(n));
      } else if (inst.includes('BASS')) {
        notesToStop.forEach((n) => this.bassSynth?.triggerRelease(n));
      } else if (inst.includes('TRUMPET') || inst.includes('BRASS') || inst.includes('SAX')) {
        notesToStop.forEach((n) => this.trumpetSynth?.triggerRelease(n));
      } else if (inst.includes('STRING') || inst.includes('PAD')) {
        notesToStop.forEach((n) => this.stringsSynth?.triggerRelease(n));
      } else {
        notesToStop.forEach((n) => this.keyboardSynth?.triggerRelease(n));
      }
    } catch {
      // Ignored
    }
  }

  // Filter FX Toggle
  public toggleFilter(): boolean {
    this.isFilterOn = !this.isFilterOn;
    if (this.masterGain && this.masterFilter) {
      if (this.isFilterOn) {
        this.masterGain.disconnect();
        this.masterGain.connect(this.masterFilter);
        this.masterFilter.toDestination();
      } else {
        this.masterFilter.disconnect();
        this.masterGain.toDestination();
      }
    }
    return this.isFilterOn;
  }

  // Recording Session
  public startRecording(): boolean {
    if (!this.recorderDestination?.stream) {
      console.warn('[AudioEngine] No media stream available for recording');
      return false;
    }

    try {
      this.recordedChunks = [];
      const options = { mimeType: 'audio/webm;codecs=opus' };
      this.mediaRecorder = new MediaRecorder(this.recorderDestination.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200); // 200ms slice
      this.isRecordingSession = true;
      console.log('[AudioEngine] Session recording started');
      return true;
    } catch (e) {
      console.error('[AudioEngine] Failed to start recorder:', e);
      return false;
    }
  }

  public async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.isRecordingSession) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.isRecordingSession = false;
        this.recordedChunks = [];
        console.log('[AudioEngine] Session recording completed, size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder!.stop();
    });
  }

  public isRecording(): boolean {
    return this.isRecordingSession;
  }
}

export const audioEngine = new AudioEngine();

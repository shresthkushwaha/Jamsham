'use client';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private masterGain: Tone.Gain | null = null;
  private analyser: Tone.Analyser | null = null;
  private effectsReverb: Tone.Reverb | null = null;
  private effectsDelay: Tone.FeedbackDelay | null = null;
  private masterFilter: Tone.Filter | null = null;
  private isFilterOn = false;

  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingSession = false;

  // ── Synths: DRUMS ────────────────────────────────────────────────────────────
  private drumMembrane: Tone.MembraneSynth | null = null;
  private drumNoise: Tone.NoiseSynth | null = null;
  private drumMetal: Tone.MetalSynth | null = null;

  // ── Synths: GUITAR / BASS / STRINGS ─────────────────────────────────────────
  private guitarSynth: Tone.PluckSynth | null = null;
  private bassSynth: Tone.PolySynth | null = null;
  private stringsSynth: Tone.PolySynth | null = null;

  // ── Synths: PIANO / LEAD / PAD ───────────────────────────────────────────────
  private pianoSynth: Tone.PolySynth | null = null;
  private leadSynth: Tone.PolySynth | null = null;
  private padSynth: Tone.PolySynth | null = null;

  // ── Synths: SAX / HORNS ──────────────────────────────────────────────────────
  private saxSynth: Tone.PolySynth | null = null;

  public async init() {
    if (this.isInitialized) return;

    await Tone.start();

    this.analyser = new Tone.Analyser('fft', 64);
    this.masterGain = new Tone.Gain(0.85).toDestination();
    this.masterGain.connect(this.analyser);

    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext;
      if (rawCtx?.createMediaStreamDestination) {
        this.recorderDestination = rawCtx.createMediaStreamDestination();
        this.masterGain.connect(this.recorderDestination as any);
      }
    } catch (e) {
      console.warn('[AudioEngine] Recorder destination not supported:', e);
    }

    this.masterFilter = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -12 });
    this.effectsReverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.01, wet: 0.25 });
    this.effectsDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.2, wet: 0.15 });

    this.effectsReverb.connect(this.masterGain);
    this.effectsDelay.connect(this.masterGain);

    // 1. DRUMS
    this.drumMembrane = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
    }).connect(this.masterGain);
    this.drumNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0 },
    }).connect(this.masterGain);
    this.drumMetal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    }).connect(this.masterGain);

    // 2. GUITAR
    this.guitarSynth = new Tone.PluckSynth({ attackNoise: 1.5, dampening: 4000, resonance: 0.9 });
    this.guitarSynth.connect(this.effectsReverb);
    this.guitarSynth.connect(this.masterGain);

    // 3. BASS
    this.bassSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square4' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.5 },
    });
    this.bassSynth.connect(this.masterGain);

    // 4. PIANO
    this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.6 },
    });
    this.pianoSynth.connect(this.effectsReverb);
    this.pianoSynth.connect(this.effectsDelay);
    this.pianoSynth.connect(this.masterGain);

    // 5. SAX (breathy FM lead)
    this.saxSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2, modulationIndex: 8,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 0.4 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 0.3 },
    });
    this.saxSynth.connect(this.effectsReverb);
    this.saxSynth.connect(this.masterGain);

    // 6. STRINGS (warm pads)
    this.stringsSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth4' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.9, release: 1.5 },
    });
    this.stringsSynth.connect(this.effectsReverb);
    this.stringsSynth.connect(this.masterGain);

    // 7. PAD (ambient lush synth)
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine4' },
      envelope: { attack: 0.6, decay: 0.3, sustain: 0.9, release: 2.5 },
    });
    this.padSynth.connect(this.effectsReverb);
    this.padSynth.connect(this.masterGain);

    // 8. LEAD (bright synth)
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 },
    });
    this.leadSynth.connect(this.effectsDelay);
    this.leadSynth.connect(this.masterGain);

    this.isInitialized = true;
    console.log('[AudioEngine] All 8 instrument synths initialized.');
  }

  // Resume AudioContext — call this on any user gesture to unblock autoplay
  public async resume() {
    await Tone.start();
    const ctx = Tone.getContext().rawContext as AudioContext;
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(64);
    return this.analyser.getValue() as Float32Array;
  }

  // ── Play Note — supports all 8 instruments + aliases ─────────────────────────
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.8) {
    if (!this.isInitialized) return;

    try {
      const now = Tone.now();
      const vel = Math.max(0, Math.min(1, typeof velocity === 'number' ? velocity / 127 : velocity));
      const id = (instrumentId || '').toUpperCase();

      switch (id) {
        // ── DRUMS ──────────────────────────────────────────────────────────
        case 'DRUMS':
        case 'DRUM':
          this.playDrumSound(noteOrType as string, vel, now);
          break;

        // ── GUITAR ────────────────────────────────────────────────────────
        case 'GUITAR':
          if (this.guitarSynth) {
            const notes = Array.isArray(noteOrType) ? noteOrType : [noteOrType];
            notes.forEach((n, i) => this.guitarSynth?.triggerAttack(n, now + i * 0.03));
          }
          break;

        // ── BASS ──────────────────────────────────────────────────────────
        case 'BASS':
          if (this.bassSynth) {
            this.bassSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── PIANO ─────────────────────────────────────────────────────────
        case 'PIANO':
        case 'KEYBOARD':
        case 'KEYS':
          if (this.pianoSynth) {
            this.pianoSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── SAX / HORNS ───────────────────────────────────────────────────
        case 'SAX':
        case 'SAXOPHONE':
        case 'BRASS':
        case 'HORN':
        case 'TRUMPET':
          if (this.saxSynth) {
            this.saxSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── STRINGS ───────────────────────────────────────────────────────
        case 'STRINGS':
        case 'VIOLIN':
        case 'CELLO':
          if (this.stringsSynth) {
            this.stringsSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── PAD ───────────────────────────────────────────────────────────
        case 'PAD':
        case 'AMBIENT':
          if (this.padSynth) {
            this.padSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── LEAD / SYNTH ──────────────────────────────────────────────────
        case 'LEAD':
        case 'SYNTH':
          if (this.leadSynth) {
            this.leadSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        default:
          // Generic fallback: play on piano synth
          if (this.pianoSynth && typeof noteOrType === 'string' && noteOrType.match(/^[A-G]/)) {
            this.pianoSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
      }
    } catch (e) {
      console.warn('[AudioEngine] Play error:', e);
    }
  }

  private playDrumSound(type: string, velocity: number, time: number) {
    switch ((type || '').toUpperCase()) {
      case 'KICK':
        this.drumMembrane?.triggerAttackRelease('C1', '8n', time, velocity);
        break;
      case 'SNARE':
        this.drumNoise?.triggerAttackRelease('16n', time, velocity * 0.8);
        this.drumMembrane?.triggerAttackRelease('G1', '16n', time, velocity * 0.5);
        break;
      case 'HIHAT':
      case 'HI-HAT':
        this.drumMetal?.triggerAttackRelease('32n', time, velocity * 0.6);
        break;
      case 'TOM 1': case 'TOM1':
        this.drumMembrane?.triggerAttackRelease('F2', '8n', time, velocity * 0.8);
        break;
      case 'TOM 2': case 'TOM2':
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity * 0.8);
        break;
      case 'CRASH':
        this.drumMetal?.triggerAttackRelease('4n', time, velocity * 0.9);
        break;
      case 'CLAP':
        this.drumNoise?.triggerAttackRelease('32n', time, velocity);
        break;
      case 'SHAKER':
        this.drumNoise?.triggerAttackRelease('64n', time, velocity * 0.4);
        break;
      case 'COWBELL': case 'COWBL':
        this.drumMetal?.triggerAttackRelease('16n', time, velocity * 0.7);
        break;
      default:
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity);
    }
  }

  // Stop sustained note
  public stopNote(instrumentId: string, note?: string) {
    if (!this.isInitialized) return;
    try {
      const id = (instrumentId || '').toUpperCase();
      if (!note) return;
      if ((id === 'PIANO' || id === 'KEYBOARD' || id === 'KEYS') && this.pianoSynth)
        this.pianoSynth.triggerRelease(note);
      else if ((id === 'SAX' || id === 'BRASS' || id === 'SAXOPHONE' || id === 'TRUMPET') && this.saxSynth)
        this.saxSynth.triggerRelease(note);
      else if (id === 'BASS' && this.bassSynth)
        this.bassSynth.triggerRelease(note);
      else if (id === 'STRINGS' && this.stringsSynth)
        this.stringsSynth.triggerRelease(note);
      else if (id === 'PAD' && this.padSynth)
        this.padSynth.triggerRelease(note);
      else if (id === 'LEAD' && this.leadSynth)
        this.leadSynth.triggerRelease(note);
    } catch { /* ignored */ }
  }

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
        if (event.data.size > 0) this.recordedChunks.push(event.data);
      };
      this.mediaRecorder.start(200);
      this.isRecordingSession = true;
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

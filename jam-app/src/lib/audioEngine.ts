'use client';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private masterGain: Tone.Gain | null = null;
  private masterCompressor: Tone.Compressor | null = null;
  private masterLimiter: Tone.Limiter | null = null;
  private analyser: Tone.Analyser | null = null;

  // Spatial Effects
  private effectsReverb: Tone.Reverb | null = null;
  private effectsDelay: Tone.FeedbackDelay | null = null;
  private effectsChorus: Tone.Chorus | null = null;
  private sitarJavari: Tone.Distortion | null = null;
  private masterFilter: Tone.Filter | null = null;
  private isFilterOn = false;

  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingSession = false;

  // ── Studio Instruments: Samplers & Synthesizers ─────────────────────────────
  // 1. GUITAR
  private guitarSampler: Tone.Sampler | null = null;
  private guitarPluckFallback: Tone.PluckSynth | null = null;

  // 2. KEYBOARD
  private pianoSampler: Tone.Sampler | null = null;
  private pianoFallback: Tone.PolySynth | null = null;

  // 3. DRUM
  private drumSampler: Tone.Sampler | null = null;
  private drumMembrane: Tone.MembraneSynth | null = null;
  private drumNoise: Tone.NoiseSynth | null = null;
  private drumMetal: Tone.MetalSynth | null = null;

  // 4. SITAR (Indian Classical Plucked String with Jawari Harmonics)
  private sitarSynth: Tone.PolySynth | null = null;

  // 5. FLUTE (Bansuri Woodwind with Breathy Air Vibrato)
  private fluteSynth: Tone.PolySynth | null = null;

  // 6. TRUMPET (Bright Brass Horn Stabs)
  private trumpetSynth: Tone.PolySynth | null = null;

  // 7. SAXOPHONE (Soulful Reed Lead)
  private saxSynth: Tone.PolySynth | null = null;

  public async init() {
    if (this.isInitialized) return;

    await Tone.start();

    // 1. Studio Mastering Chain
    this.masterLimiter = new Tone.Limiter(-0.5).toDestination();
    this.masterCompressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.005,
      release: 0.25,
    }).connect(this.masterLimiter);

    this.masterGain = new Tone.Gain(0.9).connect(this.masterCompressor);
    this.analyser = new Tone.Analyser('fft', 64);
    this.masterGain.connect(this.analyser);

    // Recording Destination Node
    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext;
      if (rawCtx?.createMediaStreamDestination) {
        this.recorderDestination = rawCtx.createMediaStreamDestination();
        this.masterGain.connect(this.recorderDestination as any);
      }
    } catch (e) {
      console.warn('[AudioEngine] Recorder destination not supported:', e);
    }

    // 2. Studio Effects
    this.effectsReverb = new Tone.Reverb({ decay: 2.8, preDelay: 0.02, wet: 0.32 });
    this.effectsDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.18 });
    this.effectsChorus = new Tone.Chorus(3.5, 2.5, 0.4).start();

    this.effectsReverb.connect(this.masterGain);
    this.effectsDelay.connect(this.masterGain);
    this.effectsChorus.connect(this.effectsReverb);

    this.sitarJavari = new Tone.Distortion(0.25).connect(this.effectsReverb);
    this.masterFilter = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -12 });

    // ── 1. GUITAR (Real Acoustic/Electric Guitar Sampler + Pluck Fallback) ──────
    try {
      this.guitarSampler = new Tone.Sampler({
        urls: {
          E2: 'E2.mp3',
          A2: 'A2.mp3',
          D3: 'D3.mp3',
          G3: 'G3.mp3',
          B3: 'B3.mp3',
          E4: 'E4.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/casio/',
      });
      this.guitarSampler.connect(this.effectsChorus);
      this.guitarSampler.connect(this.masterGain);
    } catch (e) {
      console.warn('[AudioEngine] Guitar Sampler load warning:', e);
    }

    this.guitarPluckFallback = new Tone.PluckSynth({
      attackNoise: 1.8,
      dampening: 3500,
      resonance: 0.94,
    });
    this.guitarPluckFallback.connect(this.effectsReverb);
    this.guitarPluckFallback.connect(this.masterGain);

    // ── 2. KEYBOARD (Steinway Grand Piano Multi-Sample Sampler + FM Fallback) ──
    try {
      this.pianoSampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3', C1: 'C1.mp3', D1: 'D1.mp3', F1: 'F1.mp3',
          A1: 'A1.mp3', C2: 'C2.mp3', D2: 'D2.mp3', F2: 'F2.mp3',
          A2: 'A2.mp3', C3: 'C3.mp3', D3: 'D3.mp3', F3: 'F3.mp3',
          A3: 'A3.mp3', C4: 'C4.mp3', D4: 'D4.mp3', F4: 'F4.mp3',
          A4: 'A4.mp3', C5: 'C5.mp3', D5: 'D5.mp3', F5: 'F5.mp3',
          A5: 'A5.mp3', C6: 'C6.mp3', D6: 'D6.mp3', F6: 'F6.mp3',
          A6: 'A6.mp3', C7: 'C7.mp3', D7: 'D7.mp3', F7: 'F7.mp3',
          A7: 'A7.mp3', C8: 'C8.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
      });
      this.pianoSampler.connect(this.effectsReverb);
      this.pianoSampler.connect(this.masterGain);
    } catch (e) {
      console.warn('[AudioEngine] Piano Sampler load warning:', e);
    }

    this.pianoFallback = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 1.5,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 1.2, sustain: 0.15, release: 1.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 },
    });
    this.pianoFallback.connect(this.effectsReverb);
    this.pianoFallback.connect(this.masterGain);

    // ── 3. DRUM (Acoustic Studio Drum Kit Sampler + Punchy 909 Fallback) ───────
    try {
      this.drumSampler = new Tone.Sampler({
        urls: {
          C1: 'kick.mp3',
          D1: 'snare.mp3',
          E1: 'hihat.mp3',
          F1: 'tom1.mp3',
          G1: 'tom2.mp3',
          A1: 'tom3.mp3',
          B1: 'clap.mp3',
          C2: 'cowbell.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/',
      });
      this.drumSampler.connect(this.masterGain);
    } catch (e) {
      console.warn('[AudioEngine] Drum Sampler load warning:', e);
    }

    this.drumMembrane = new Tone.MembraneSynth({
      pitchDecay: 0.08, octaves: 8, oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.35 },
    }).connect(this.masterGain);

    this.drumNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(this.masterGain);

    this.drumMetal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.12, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 5000, octaves: 1.5,
    }).connect(this.masterGain);

    // ── 4. SITAR (Classical Indian Sitar with Jawari Buzz & Pluck Harmonics) ───
    this.sitarSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 18,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.003, decay: 1.6, sustain: 0.25, release: 2.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.002, decay: 0.45, sustain: 0.05, release: 0.8 },
    });
    this.sitarSynth.connect(this.sitarJavari);
    this.sitarSynth.connect(this.effectsChorus);
    this.sitarSynth.connect(this.masterGain);

    // ── 5. FLUTE (Bansuri Woodwind Flute with Breathy Air Vibrato) ─────────────
    this.fluteSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.95, release: 0.5 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.08, decay: 0.3, sustain: 0.9, release: 0.6 },
    });
    this.fluteSynth.connect(this.effectsReverb);
    this.fluteSynth.connect(this.effectsDelay);
    this.fluteSynth.connect(this.masterGain);

    // ── 6. TRUMPET (Bright Brass Horn Fanfare) ─────────────────────────────────
    this.trumpetSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.01,
      modulationIndex: 12,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.06, decay: 0.2, sustain: 0.9, release: 0.35 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.9, release: 0.3 },
    });
    this.trumpetSynth.connect(this.effectsReverb);
    this.trumpetSynth.connect(this.masterGain);

    // ── 7. SAXOPHONE (Soulful Warm Reed Lead) ──────────────────────────────────
    this.saxSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 14,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.08, decay: 0.25, sustain: 0.88, release: 0.4 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.8, release: 0.35 },
    });
    this.saxSynth.connect(this.effectsReverb);
    this.saxSynth.connect(this.masterGain);

    this.isInitialized = true;
    console.log('[AudioEngine] 7 Studio Instruments (Guitar, Keyboard, Drum, Sitar, Flute, Trumpet, Saxophone) initialized.');
  }

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

  // ── Trigger High-Quality Studio Note for 7 Instruments ───────────────────────
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.8) {
    if (!this.isInitialized) return;

    try {
      const now = Tone.now();
      const vel = Math.max(0.1, Math.min(1, typeof velocity === 'number' ? velocity / 100 : 0.8));
      const id = (instrumentId || '').toUpperCase();

      switch (id) {
        // ── 1. GUITAR ──────────────────────────────────────────────────────
        case 'GUITAR':
          if (this.guitarSampler && this.guitarSampler.loaded) {
            const notes = Array.isArray(noteOrType) ? noteOrType : [noteOrType];
            notes.forEach((n, i) => this.guitarSampler?.triggerAttackRelease(n, duration, now + i * 0.025, vel));
          } else if (this.guitarPluckFallback) {
            const notes = Array.isArray(noteOrType) ? noteOrType : [noteOrType];
            notes.forEach((n, i) => this.guitarPluckFallback?.triggerAttack(n, now + i * 0.03));
          }
          break;

        // ── 2. KEYBOARD (Piano) ────────────────────────────────────────────
        case 'KEYBOARD':
        case 'PIANO':
        case 'KEYS':
          if (this.pianoSampler && this.pianoSampler.loaded) {
            this.pianoSampler.triggerAttackRelease(noteOrType, duration, now, vel);
          } else if (this.pianoFallback) {
            this.pianoFallback.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── 3. DRUM ────────────────────────────────────────────────────────
        case 'DRUM':
        case 'DRUMS':
          this.playStudioDrums(noteOrType as string, vel, now);
          break;

        // ── 4. SITAR ───────────────────────────────────────────────────────
        case 'SITAR':
          if (this.sitarSynth) {
            this.sitarSynth.triggerAttackRelease(noteOrType, '4n', now, vel);
          }
          break;

        // ── 5. FLUTE ───────────────────────────────────────────────────────
        case 'FLUTE':
        case 'BANSURI':
          if (this.fluteSynth) {
            this.fluteSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── 6. TRUMPET ─────────────────────────────────────────────────────
        case 'TRUMPET':
        case 'BRASS':
        case 'HORN':
          if (this.trumpetSynth) {
            this.trumpetSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        // ── 7. SAXOPHONE ───────────────────────────────────────────────────
        case 'SAXOPHONE':
        case 'SAX':
          if (this.saxSynth) {
            this.saxSynth.triggerAttackRelease(noteOrType, duration, now, vel);
          }
          break;

        default:
          if (this.pianoSampler && this.pianoSampler.loaded) {
            this.pianoSampler.triggerAttackRelease(noteOrType, duration, now, vel);
          } else if (this.pianoFallback) {
            this.pianoFallback.triggerAttackRelease(noteOrType, duration, now, vel);
          }
      }
    } catch (e) {
      console.warn('[AudioEngine] Play error:', e);
    }
  }

  private playStudioDrums(type: string, velocity: number, time: number) {
    const t = (type || '').toUpperCase();

    const drumPitchMap: Record<string, string> = {
      KICK: 'C1',
      SNARE: 'D1',
      HIHAT: 'E1',
      'HI-HAT': 'E1',
      'TOM 1': 'F1',
      TOM1: 'F1',
      'TOM 2': 'G1',
      TOM2: 'G1',
      'TOM 3': 'A1',
      CRASH: 'A1',
      CLAP: 'B1',
      COWBELL: 'C2',
    };

    const pitch = drumPitchMap[t] || 'C1';

    if (this.drumSampler && this.drumSampler.loaded) {
      this.drumSampler.triggerAttackRelease(pitch, '8n', time, velocity);
      return;
    }

    switch (t) {
      case 'KICK':
        this.drumMembrane?.triggerAttackRelease('C1', '8n', time, velocity);
        break;
      case 'SNARE':
        this.drumNoise?.triggerAttackRelease('16n', time, velocity * 0.9);
        this.drumMembrane?.triggerAttackRelease('A1', '16n', time, velocity * 0.6);
        break;
      case 'HIHAT':
      case 'HI-HAT':
        this.drumMetal?.triggerAttackRelease('32n', time, velocity * 0.7);
        break;
      case 'TOM 1': case 'TOM1':
        this.drumMembrane?.triggerAttackRelease('F2', '8n', time, velocity * 0.85);
        break;
      case 'TOM 2': case 'TOM2':
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity * 0.85);
        break;
      case 'CRASH':
        this.drumMetal?.triggerAttackRelease('4n', time, velocity);
        break;
      case 'CLAP':
        this.drumNoise?.triggerAttackRelease('32n', time, velocity);
        break;
      case 'COWBELL': case 'COWBL':
        this.drumMetal?.triggerAttackRelease('16n', time, velocity * 0.8);
        break;
      default:
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity);
    }
  }

  public stopNote(instrumentId: string, note?: string) {
    if (!this.isInitialized || !note) return;
    try {
      const id = (instrumentId || '').toUpperCase();
      if ((id === 'TRUMPET' || id === 'BRASS') && this.trumpetSynth) {
        this.trumpetSynth.triggerRelease(note);
      } else if ((id === 'SAXOPHONE' || id === 'SAX') && this.saxSynth) {
        this.saxSynth.triggerRelease(note);
      } else if (id === 'FLUTE' && this.fluteSynth) {
        this.fluteSynth.triggerRelease(note);
      } else if (id === 'SITAR' && this.sitarSynth) {
        this.sitarSynth.triggerRelease(note);
      } else if ((id === 'KEYBOARD' || id === 'PIANO') && this.pianoFallback) {
        this.pianoFallback.triggerRelease(note);
      }
    } catch {}
  }

  public getRecorderStream(): MediaStream | null {
    return this.recorderDestination?.stream || null;
  }

  public startRecording(): boolean {
    if (!this.recorderDestination?.stream) return false;
    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.recorderDestination.stream, { mimeType: 'audio/webm;codecs=opus' });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(200);
      this.isRecordingSession = true;
      return true;
    } catch {
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

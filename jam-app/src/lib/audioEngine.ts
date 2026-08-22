'use client';
import * as Tone from 'tone';

const SOUNDFONT_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';

// Key sample map for FluidR3 soundfonts (compact set for quick loading & interpolation)
const STANDARD_SAMPLE_MAP = {
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
  C6: 'C6.mp3',
};

class AudioEngine {
  private isInitialized = false;
  private masterGain: Tone.Gain | null = null;
  private analyser: Tone.Analyser | null = null;
  private effectsReverb: Tone.Reverb | null = null;
  private effectsChorus: Tone.Chorus | null = null;
  private effectsDelay: Tone.FeedbackDelay | null = null;
  private masterFilter: Tone.Filter | null = null;
  private isFilterOn = false;

  // Recording
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingSession = false;

  // Real Soundfont Samplers
  private pianoSampler: Tone.Sampler | null = null;
  private guitarSampler: Tone.Sampler | null = null;
  private bassSampler: Tone.Sampler | null = null;
  private brassSampler: Tone.Sampler | null = null;
  private stringsSampler: Tone.Sampler | null = null;

  // Acoustic Drums
  private drumMembrane: Tone.MembraneSynth | null = null;
  private drumNoise: Tone.NoiseSynth | null = null;
  private drumMetal: Tone.MetalSynth | null = null;

  // Fallback synths if offline
  private fallbackPoly: Tone.PolySynth | null = null;
  private fallbackMono: Tone.MonoSynth | null = null;

  public async init() {
    if (this.isInitialized) return;

    await Tone.start();

    // Master bus & Analyser (FFT visualizer)
    this.analyser = new Tone.Analyser('fft', 64);
    this.masterGain = new Tone.Gain(0.95).toDestination();
    this.masterGain.connect(this.analyser);

    // Recording Destination Node
    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext;
      if (rawCtx && rawCtx.createMediaStreamDestination) {
        this.recorderDestination = rawCtx.createMediaStreamDestination();
        this.masterGain.connect(this.recorderDestination as any);
      }
    } catch (e) {
      console.warn('[AudioEngine] Recorder destination error:', e);
    }

    // Filter FX Node
    this.masterFilter = new Tone.Filter({
      frequency: 900,
      type: 'lowpass',
      rolloff: -12,
    });

    // Studio Reverb, Chorus & Delay Bus
    this.effectsReverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.25 });
    this.effectsChorus = new Tone.Chorus(3.5, 2.5, 0.3).start();
    this.effectsDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.2, wet: 0.15 });

    this.effectsReverb.connect(this.masterGain);
    this.effectsChorus.connect(this.masterGain);
    this.effectsDelay.connect(this.masterGain);

    // 1. ACOUSTIC DRUMS
    this.drumMembrane = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.35 },
    }).connect(this.masterGain);

    this.drumNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.003, decay: 0.18, sustain: 0 },
    }).connect(this.masterGain);

    this.drumMetal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.12, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.masterGain);
    this.drumMetal.frequency.value = 240;

    // 2. REAL SOUNDFONT SAMPLERS (Acoustic Grand Piano, Steel Guitar, Bass, Saxophone, Strings)
    try {
      this.pianoSampler = new Tone.Sampler({
        urls: STANDARD_SAMPLE_MAP,
        baseUrl: `${SOUNDFONT_BASE}/acoustic_grand_piano-mp3/`,
        onload: () => console.log('[AudioEngine] Grand Piano soundfonts ready 🎹'),
      });
      this.pianoSampler.connect(this.effectsReverb);
      this.pianoSampler.connect(this.masterGain);

      this.guitarSampler = new Tone.Sampler({
        urls: STANDARD_SAMPLE_MAP,
        baseUrl: `${SOUNDFONT_BASE}/acoustic_guitar_steel-mp3/`,
        onload: () => console.log('[AudioEngine] Acoustic Guitar soundfonts ready 🎸'),
      });
      this.guitarSampler.connect(this.effectsChorus);
      this.guitarSampler.connect(this.masterGain);

      this.bassSampler = new Tone.Sampler({
        urls: STANDARD_SAMPLE_MAP,
        baseUrl: `${SOUNDFONT_BASE}/electric_bass_finger-mp3/`,
        onload: () => console.log('[AudioEngine] Electric Bass soundfonts ready 🎸'),
      });
      this.bassSampler.connect(this.masterGain);

      this.brassSampler = new Tone.Sampler({
        urls: STANDARD_SAMPLE_MAP,
        baseUrl: `${SOUNDFONT_BASE}/tenor_sax-mp3/`,
        onload: () => console.log('[AudioEngine] Tenor Saxophone soundfonts ready 🎷'),
      });
      this.brassSampler.connect(this.effectsReverb);
      this.brassSampler.connect(this.masterGain);

      this.stringsSampler = new Tone.Sampler({
        urls: STANDARD_SAMPLE_MAP,
        baseUrl: `${SOUNDFONT_BASE}/string_ensemble_1-mp3/`,
        onload: () => console.log('[AudioEngine] String Section soundfonts ready 🎻'),
      });
      this.stringsSampler.connect(this.effectsReverb);
      this.stringsSampler.connect(this.masterGain);
    } catch (err) {
      console.warn('[AudioEngine] Error loading soundfont samplers, using synth fallback:', err);
    }

    // 3. SYNTHESIS FALLBACK ENGINE (For instant offline playback)
    this.fallbackPoly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0.3, release: 1.2 },
    }).connect(this.masterGain);

    this.fallbackMono = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.5 },
    }).connect(this.masterGain);

    this.isInitialized = true;
    console.log('[AudioEngine] Audio Engine initialized with real Soundfont Samplers');
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(64);
    return this.analyser.getValue() as Float32Array;
  }

  // Play Note with Soundfont Sampler
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.85) {
    if (!this.isInitialized) return;

    try {
      const now = Tone.now();
      switch (instrumentId.toUpperCase()) {
        case 'DRUMS':
          this.playDrumHit(noteOrType as string, velocity, now);
          break;

        case 'GUITAR':
          if (Array.isArray(noteOrType)) {
            // Strum chords with realistic 15ms finger strum
            noteOrType.forEach((note, index) => {
              const strumTime = now + index * 0.015;
              if (this.guitarSampler?.loaded) {
                this.guitarSampler.triggerAttackRelease(note, '2n', strumTime, velocity);
              } else {
                this.fallbackPoly?.triggerAttackRelease(note, '2n', strumTime, velocity * 0.6);
              }
            });
          } else {
            if (this.guitarSampler?.loaded) {
              this.guitarSampler.triggerAttackRelease(noteOrType, duration || '4n', now, velocity);
            } else {
              this.fallbackPoly?.triggerAttackRelease(noteOrType, '4n', now, velocity * 0.6);
            }
          }
          break;

        case 'BASS':
          if (typeof noteOrType === 'string') {
            if (this.bassSampler?.loaded) {
              this.bassSampler.triggerAttackRelease(noteOrType, duration || '4n', now, velocity);
            } else {
              this.fallbackMono?.triggerAttackRelease(noteOrType, duration, now, velocity);
            }
          }
          break;

        case 'PIANO':
        case 'LEAD':
          if (this.pianoSampler?.loaded) {
            this.pianoSampler.triggerAttackRelease(noteOrType, duration || '2n', now, velocity);
          } else {
            this.fallbackPoly?.triggerAttackRelease(noteOrType, duration || '4n', now, velocity);
          }
          break;

        case 'BRASS':
          if (this.brassSampler?.loaded) {
            this.brassSampler.triggerAttackRelease(noteOrType, duration || '8n', now, velocity);
          } else {
            this.fallbackPoly?.triggerAttackRelease(noteOrType, duration || '8n', now, velocity * 0.8);
          }
          break;

        case 'STRINGS':
        case 'PAD':
          if (this.stringsSampler?.loaded) {
            this.stringsSampler.triggerAttackRelease(noteOrType, duration || '2n', now, velocity * 0.8);
          } else {
            this.fallbackPoly?.triggerAttackRelease(noteOrType, duration || '2n', now, velocity * 0.7);
          }
          break;

        default:
          if (this.pianoSampler?.loaded) {
            this.pianoSampler.triggerAttackRelease(noteOrType, duration, now, velocity);
          } else {
            this.fallbackPoly?.triggerAttackRelease(noteOrType, duration, now, velocity);
          }
          break;
      }
    } catch (e) {
      console.warn('[AudioEngine] Play note error:', e);
    }
  }

  private playDrumHit(type: string, velocity: number, time: number) {
    switch (type.toUpperCase()) {
      case 'KICK':
        this.drumMembrane?.triggerAttackRelease('C1', '8n', time, velocity);
        break;
      case 'SNARE':
        this.drumNoise?.triggerAttackRelease('16n', time, velocity * 0.85);
        this.drumMembrane?.triggerAttackRelease('G1', '16n', time, velocity * 0.4);
        break;
      case 'HIHAT':
      case 'HI-HAT':
        this.drumMetal?.triggerAttackRelease('32n', time, velocity * 0.55);
        break;
      case 'OPEN HAT':
        this.drumMetal?.triggerAttackRelease('8n', time, velocity * 0.7);
        break;
      case 'HIGH TOM':
      case 'TOM 1':
        this.drumMembrane?.triggerAttackRelease('G2', '8n', time, velocity * 0.75);
        break;
      case 'MID TOM':
      case 'TOM 2':
        this.drumMembrane?.triggerAttackRelease('D2', '8n', time, velocity * 0.8);
        break;
      case 'FLOOR TOM':
        this.drumMembrane?.triggerAttackRelease('A1', '8n', time, velocity * 0.85);
        break;
      case 'CRASH':
        this.drumMetal?.triggerAttackRelease('2n', time, velocity * 0.9);
        break;
      case 'RIDE':
        this.drumMetal?.triggerAttackRelease('4n', time, velocity * 0.6);
        break;
      case 'TAMBOURINE':
      case 'CLAP':
        this.drumNoise?.triggerAttackRelease('32n', time, velocity * 0.7);
        break;
      default:
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity);
    }
  }

  public stopNote(instrumentId: string, note?: string) {
    if (!this.isInitialized) return;
    try {
      if (instrumentId === 'BASS' && this.bassSampler) {
        this.bassSampler.triggerRelease(note as any);
      } else if (instrumentId === 'PIANO' && this.pianoSampler && note) {
        this.pianoSampler.triggerRelease(note);
      } else if (instrumentId === 'BRASS' && this.brassSampler && note) {
        this.brassSampler.triggerRelease(note);
      } else if (instrumentId === 'STRINGS' && this.stringsSampler && note) {
        this.stringsSampler.triggerRelease(note);
      }
    } catch {
      // Ignored
    }
  }

  // Filter Toggle
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

  // Session Recording
  public startRecording(): boolean {
    if (!this.recorderDestination?.stream) return false;
    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.recorderDestination.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(200);
      this.isRecordingSession = true;
      return true;
    } catch (e) {
      console.error('Recorder error:', e);
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

  public getAudioDestinationStream(): MediaStream | null {
    return this.recorderDestination?.stream || null;
  }

  public isRecording(): boolean {
    return this.isRecordingSession;
  }
}

export const audioEngine = new AudioEngine();

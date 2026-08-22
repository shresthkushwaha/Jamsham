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

  // Recording
  private recorderDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingSession = false;

  // Synths for each instrument type
  private drumMembrane: Tone.MembraneSynth | null = null;
  private drumNoise: Tone.NoiseSynth | null = null;
  private drumMetal: Tone.MetalSynth | null = null;

  private guitarSynth: Tone.PluckSynth | null = null;
  private keyboardSynth: Tone.PolySynth | null = null;
  private trumpetSynth: Tone.PolySynth | null = null;

  public async init() {
    if (this.isInitialized) return;

    await Tone.start();

    // Master bus setup with analyser for visualizer
    this.analyser = new Tone.Analyser('fft', 64);
    this.masterGain = new Tone.Gain(0.9).toDestination();
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

    // Global Reverb & Delay
    this.effectsReverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.01, wet: 0.25 });
    this.effectsDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.2, wet: 0.15 });

    this.effectsReverb.connect(this.masterGain);
    this.effectsDelay.connect(this.masterGain);

    // 1. DRUMS
    this.drumMembrane = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
    }).connect(this.masterGain);

    this.drumNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0 },
    }).connect(this.masterGain);

    this.drumMetal = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.masterGain);

    // 2. GUITAR
    this.guitarSynth = new Tone.PluckSynth({
      attackNoise: 1.5,
      dampening: 4000,
      resonance: 0.9,
    });
    this.guitarSynth.connect(this.effectsReverb);
    this.guitarSynth.connect(this.masterGain);

    // 3. KEYBOARD
    this.keyboardSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.6 },
    });
    this.keyboardSynth.connect(this.effectsReverb);
    this.keyboardSynth.connect(this.effectsDelay);
    this.keyboardSynth.connect(this.masterGain);

    // 4. TRUMPET
    this.trumpetSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.01,
      modulationIndex: 10,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 0.3 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.9, release: 0.3 },
    });
    this.trumpetSynth.connect(this.effectsReverb);
    this.trumpetSynth.connect(this.masterGain);

    this.isInitialized = true;
    console.log('[AudioEngine] Initialized all instrument engines successfully');
  }

  public getInitialized(): boolean {
    return this.isInitialized;
  }

  public getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(64);
    return this.analyser.getValue() as Float32Array;
  }

  // Trigger Note / Drum Hit
  public playNote(instrumentId: string, noteOrType: string | string[], duration: string = '8n', velocity: number = 0.8) {
    if (!this.isInitialized) return;

    try {
      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }

      const now = Tone.now();
      const id = (instrumentId || '').toUpperCase();

      if (id.includes('DRUM')) {
        this.playDrumSound(noteOrType as string, velocity, now);
      } else if (id.includes('GUITAR') || id.includes('BASS')) {
        if (this.guitarSynth) {
          if (Array.isArray(noteOrType)) {
            noteOrType.forEach((n, idx) => {
              this.guitarSynth?.triggerAttack(n, now + idx * 0.03);
            });
          } else if (typeof noteOrType === 'string') {
            this.guitarSynth.triggerAttack(noteOrType, now);
          }
        }
      } else if (id.includes('TRUMPET') || id.includes('SAX') || id.includes('BRASS')) {
        if (this.trumpetSynth) {
          this.trumpetSynth.triggerAttackRelease(noteOrType, duration, now, velocity);
        }
      } else {
        // Default to KEYBOARD / PIANO Synth
        if (this.keyboardSynth) {
          this.keyboardSynth.triggerAttackRelease(noteOrType, duration, now, velocity);
        }
      }
    } catch (e) {
      console.warn('[AudioEngine] Play error:', e);
    }
  }

  private playDrumSound(type: string, velocity: number, time: number) {
    switch (type.toUpperCase()) {
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
      case 'TOM 1':
      case 'TOM1':
        this.drumMembrane?.triggerAttackRelease('F2', '8n', time, velocity * 0.8);
        break;
      case 'TOM 2':
      case 'TOM2':
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
      case 'COWBELL':
      case 'COWBL':
        this.drumMetal?.triggerAttackRelease('16n', time, velocity * 0.7);
        break;
      default:
        this.drumMembrane?.triggerAttackRelease('C2', '8n', time, velocity);
    }
  }

  // Release note for sustained keys
  public stopNote(instrumentId: string, note?: string) {
    if (!this.isInitialized) return;
    try {
      const id = (instrumentId || '').toUpperCase();
      if ((id.includes('KEYBOARD') || id.includes('PIANO') || id.includes('LEAD')) && this.keyboardSynth && note) {
        this.keyboardSynth.triggerRelease(note);
      } else if ((id.includes('TRUMPET') || id.includes('SAX') || id.includes('BRASS')) && this.trumpetSynth && note) {
        this.trumpetSynth.triggerRelease(note);
      }
      // Guitar is plucked, doesn't need explicit stop unless we want to damp it.
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

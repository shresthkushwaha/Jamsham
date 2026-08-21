'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'drums' | 'guitar' | 'keyboard' | 'sitar';

interface AudioEngineContextType {
  isAudioStarted: boolean;
  startAudio: () => Promise<void>;
  bpm: number;
  setBpm: (bpm: number) => void;
  isMetronomePlaying: boolean;
  toggleMetronome: () => void;
  currentBeat: number;
  isFilterOn: boolean;
  toggleFilter: () => void;
  isMicMuted: boolean;
  toggleMic: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  toggleRecording: () => void;
  selectedInstrument: InstrumentType;
  setSelectedInstrument: (inst: InstrumentType) => void;
  activeNotes: Record<string, string[]>;
  triggerLocalNote: (instrument: InstrumentType, note: string, duration?: string) => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  tanpuraDroneActive: boolean;
  toggleTanpuraDrone: () => void;
  keyboardEnabled: boolean;
  setKeyboardEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  hoverEnabled: boolean;
  setHoverEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [bpm, setBpmState] = useState(120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(225);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('drums');
  const [tanpuraDroneActive, setTanpuraDroneActive] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  
  const [activeNotes, setActiveNotes] = useState<Record<string, string[]>>({
    drums: ['Kick', 'Hi-Hat'],
    guitar: ['E Minor'],
    keyboard: ['C4 • E4 • G4'],
    sitar: ['Sa (C4)']
  });
  const [masterVolume, setMasterVolumeState] = useState(0);

  const filterRef = useRef<Tone.Filter | null>(null);
  const drumKickRef = useRef<Tone.MembraneSynth | null>(null);
  const drumSnareRef = useRef<Tone.NoiseSynth | null>(null);
  const drumSnareToneRef = useRef<Tone.MembraneSynth | null>(null);
  const drumMetalRef = useRef<Tone.MetalSynth | null>(null);
  
  const guitarSynthRef = useRef<Tone.PolySynth | null>(null);
  const keyboardSynthRef = useRef<Tone.PolySynth | null>(null);
  const sitarSynthRef = useRef<Tone.PolySynth | null>(null);
  const tanpuraDroneRef = useRef<Tone.PolySynth | null>(null);
  const metronomeClickRef = useRef<Tone.MembraneSynth | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and resume AudioContext reliably
  const startAudio = async () => {
    try {
      await Tone.start();
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      Tone.getDestination().volume.value = 0;

      if (!filterRef.current) {
        // Master Filter Node
        const filter = new Tone.Filter({
          frequency: 20000,
          type: 'lowpass',
          rolloff: -12,
          Q: 1
        }).toDestination();
        filterRef.current = filter;

        // 1. DRUMS SYNTHS
        drumKickRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 8,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.2 }
        }).connect(filter);

        drumSnareRef.current = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.22, sustain: 0 }
        }).connect(filter);

        drumSnareToneRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.01,
          octaves: 2,
          envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
        }).connect(filter);

        drumMetalRef.current = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.14, release: 0.2 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        }).connect(filter);

        // 2. GUITAR SYNTH (Lush PolySynth Pluck)
        guitarSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.005, decay: 0.7, sustain: 0.1, release: 1.2 }
        }).connect(filter);

        // 3. KEYBOARD SYNTH (Warm Studio Grand / Rhodes Piano)
        keyboardSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 1.0 }
        }).connect(filter);

        // 4. SITAR (Indian Traditional Instrument with rich metallic buzz)
        sitarSynthRef.current = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 3.01,
          modulationIndex: 12,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.8, sustain: 0.15, release: 1.6 },
          modulation: { type: 'triangle' },
          modulationEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 1.0 }
        }).connect(filter);

        // 5. TANPURA ACOUSTIC DRONE
        tanpuraDroneRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 1.2, decay: 2.0, sustain: 0.85, release: 2.5 }
        }).connect(filter);

        // 6. METRONOME CLICK
        metronomeClickRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.005,
          octaves: 2,
          envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 }
        }).toDestination();
      }

      setIsAudioStarted(true);
    } catch (e) {
      console.warn('AudioContext start notice:', e);
    }
  };

  // Attach global audio unlock listeners on initial user gesture
  useEffect(() => {
    const unlock = () => {
      startAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Metronome clock
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAudioStarted) {
      Tone.getTransport().bpm.value = bpm;
      const msPerBeat = (60 / bpm) * 1000;
      interval = setInterval(() => {
        setCurrentBeat((prev) => {
          const next = prev >= 4 ? 1 : prev + 1;
          if (isMetronomePlaying && metronomeClickRef.current) {
            metronomeClickRef.current.triggerAttackRelease(next === 1 ? 'C5' : 'G4', '32n');
          }
          return next;
        });
      }, msPerBeat);
    }
    return () => clearInterval(interval);
  }, [bpm, isAudioStarted, isMetronomePlaying]);

  // Recording counter
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const setBpm = (newBpm: number) => {
    setBpmState(newBpm);
    if (isAudioStarted) Tone.getTransport().bpm.value = newBpm;
  };

  const toggleMetronome = () => {
    if (!isAudioStarted) startAudio();
    setIsMetronomePlaying(!isMetronomePlaying);
  };

  const toggleFilter = () => {
    if (!isAudioStarted) startAudio();
    setIsFilterOn((prev) => {
      const next = !prev;
      if (filterRef.current) {
        if (next) {
          filterRef.current.frequency.rampTo(800, 0.1);
          filterRef.current.Q.value = 6;
        } else {
          filterRef.current.frequency.rampTo(20000, 0.1);
          filterRef.current.Q.value = 1;
        }
      }
      return next;
    });
  };

  const toggleMic = () => setIsMicMuted((prev) => !prev);
  const toggleRecording = () => setIsRecording((prev) => !prev);

  const toggleTanpuraDrone = () => {
    if (!isAudioStarted) startAudio();
    setTanpuraDroneActive((prev) => {
      const next = !prev;
      if (tanpuraDroneRef.current) {
        if (next) {
          tanpuraDroneRef.current.triggerAttack(['C3', 'G3', 'C4'], undefined, 0.25);
        } else {
          tanpuraDroneRef.current.releaseAll();
        }
      }
      return next;
    });
  };

  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
    if (isAudioStarted) Tone.getDestination().volume.rampTo(vol, 0.05);
  };

  // Play Sound Function with guaranteed local audio output
  const triggerLocalNote = async (instrument: InstrumentType, note: string, duration = '8n') => {
    if (!isAudioStarted || Tone.context.state !== 'running') {
      await startAudio();
    }

    setActiveNotes((prev) => ({
      ...prev,
      [instrument]: [note]
    }));

    try {
      if (instrument === 'drums') {
        if (note === 'Kick') drumKickRef.current?.triggerAttackRelease('C1', '8n');
        else if (note === 'Snare') {
          drumSnareRef.current?.triggerAttackRelease('16n');
          drumSnareToneRef.current?.triggerAttackRelease('G2', '16n');
        } else if (note === 'Hi-Hat') drumMetalRef.current?.triggerAttackRelease('32n', undefined, 0.5);
        else if (note === 'Open Hat') drumMetalRef.current?.triggerAttackRelease('8n', undefined, 0.7);
        else if (note === 'Tom 1') drumKickRef.current?.triggerAttackRelease('A1', '8n');
        else if (note === 'Tom 2') drumKickRef.current?.triggerAttackRelease('F1', '8n');
        else if (note === 'Crash') drumMetalRef.current?.triggerAttackRelease('4n', undefined, 0.9);
        else if (note === 'Clap') {
          drumSnareRef.current?.triggerAttackRelease('32n');
        } else {
          drumKickRef.current?.triggerAttackRelease('C2', duration);
        }
      } else if (instrument === 'guitar') {
        if (note.includes('Chord') || note.includes('Minor') || note.includes('Major')) {
          const chordMap: Record<string, string[]> = {
            'Em Chord': ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
            'G Chord': ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'],
            'C Chord': ['C3', 'E3', 'G3', 'C4', 'E4'],
            'D Chord': ['D3', 'A3', 'D4', 'F#4'],
            'Am Chord': ['A2', 'E3', 'A3', 'C4', 'E4'],
            'F Chord': ['F2', 'C3', 'F3', 'A3', 'C4', 'F4']
          };
          const notesToPlay = chordMap[note] || ['E3', 'G3', 'B3'];
          notesToPlay.forEach((n, idx) => {
            setTimeout(() => {
              guitarSynthRef.current?.triggerAttackRelease(n, '4n');
            }, idx * 25);
          });
        } else {
          guitarSynthRef.current?.triggerAttackRelease(note, duration);
        }
      } else if (instrument === 'keyboard') {
        keyboardSynthRef.current?.triggerAttackRelease(note, duration);
      } else if (instrument === 'sitar') {
        sitarSynthRef.current?.triggerAttackRelease(note, '4n');
      }
    } catch (e) {
      console.warn('Note trigger execution notice:', e);
    }
  };

  return (
    <AudioEngineContext.Provider
      value={{
        isAudioStarted,
        startAudio,
        bpm,
        setBpm,
        isMetronomePlaying,
        toggleMetronome,
        currentBeat,
        isFilterOn,
        toggleFilter,
        isMicMuted,
        toggleMic,
        isRecording,
        recordingSeconds,
        toggleRecording,
        selectedInstrument,
        setSelectedInstrument,
        activeNotes,
        triggerLocalNote,
        masterVolume,
        setMasterVolume,
        tanpuraDroneActive,
        toggleTanpuraDrone,
        keyboardEnabled,
        setKeyboardEnabled,
        hoverEnabled,
        setHoverEnabled
      }}
    >
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine() {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) throw new Error('useAudioEngine must be used within AudioEngineProvider');
  return ctx;
}

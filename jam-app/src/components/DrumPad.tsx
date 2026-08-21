'use client';
import { useState, useEffect } from 'react';
import * as Tone from 'tone';

export default function DrumPad() {
  const [isReady, setIsReady] = useState(false);
  const [synth, setSynth] = useState<Tone.MembraneSynth | null>(null);

  useEffect(() => {
    // Tone.js requires a user gesture to start audio
    const setupAudio = async () => {
      await Tone.start();
      const newSynth = new Tone.MembraneSynth().toDestination();
      setSynth(newSynth);
      setIsReady(true);
    };

    // We attach this to a button to initialize audio context
    window.addEventListener('click', setupAudio, { once: true });
    return () => {
      window.removeEventListener('click', setupAudio);
      synth?.dispose();
    };
  }, []);

  const playDrum = (note: string) => {
    if (synth && isReady) {
      synth.triggerAttackRelease(note, '8n');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '300px' }}>
      <h2 style={{ marginBottom: '10px' }}>Drum Pad</h2>
      {!isReady && <p style={{ color: 'red' }}>Click anywhere to enable audio</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button onClick={() => playDrum('C2')} style={btnStyle}>Kick</button>
        <button onClick={() => playDrum('D2')} style={btnStyle}>Snare</button>
        <button onClick={() => playDrum('E2')} style={btnStyle}>Hi-Hat</button>
        <button onClick={() => playDrum('F2')} style={btnStyle}>Tom 1</button>
        <button onClick={() => playDrum('G2')} style={btnStyle}>Tom 2</button>
        <button onClick={() => playDrum('A2')} style={btnStyle}>Crash</button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '15px',
  background: '#333',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

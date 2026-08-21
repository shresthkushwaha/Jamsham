'use client';
import { useState, useEffect } from 'react';
import * as Tone from 'tone';

export default function BassSynth() {
  const [isReady, setIsReady] = useState(false);
  const [synth, setSynth] = useState<Tone.MonoSynth | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      await Tone.start();
      // MonoSynth with a lower oscillator type for that bass sound
      const newSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.5 }
      }).toDestination();
      setSynth(newSynth);
      setIsReady(true);
    };

    window.addEventListener('click', setupAudio, { once: true });
    return () => {
      window.removeEventListener('click', setupAudio);
      synth?.dispose();
    };
  }, []);

  const playNote = (note: string) => {
    if (synth && isReady) {
      synth.triggerAttackRelease(note, '8n');
    }
  };

  const keys = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'];

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '10px' }}>Bass Synth</h2>
      {!isReady && <p style={{ color: 'red' }}>Click anywhere to enable audio</p>}
      <div style={{ display: 'flex', gap: '5px' }}>
        {keys.map(note => (
          <button 
            key={note} 
            onClick={() => playNote(note)}
            style={keyStyle}
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  );
}

const keyStyle = {
  padding: '40px 10px 10px 10px',
  background: '#8B0000', // Dark red for bass
  color: 'white',
  border: '1px solid black',
  borderRadius: '0 0 4px 4px',
  cursor: 'pointer',
  minWidth: '40px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center'
};

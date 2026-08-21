'use client';
import { useState, useEffect } from 'react';
import * as Tone from 'tone';

export default function LeadKeyboard() {
  const [isReady, setIsReady] = useState(false);
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      await Tone.start();
      // PolySynth allows playing multiple notes at once (chords)
      const newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
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

  const keys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '10px' }}>Lead Keyboard</h2>
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
  background: 'white',
  color: 'black',
  border: '1px solid black',
  borderRadius: '0 0 4px 4px',
  cursor: 'pointer',
  minWidth: '40px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center'
};

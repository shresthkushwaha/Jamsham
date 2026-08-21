import DrumPad from '@/components/DrumPad';
import LeadKeyboard from '@/components/LeadKeyboard';
import BassSynth from '@/components/BassSynth';

export default function Home() {
  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>Phase 1: Audio Sandbox (Local)</h1>
      <p style={{ marginBottom: '40px' }}>
        Click anywhere to enable the Audio Context, then test the instruments below. 
        Currently, these play locally using Tone.js (no network sync yet).
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
        <div>
          <DrumPad />
        </div>
        <div>
          <LeadKeyboard />
        </div>
        <div>
          <BassSynth />
        </div>
      </div>
    </main>
  );
}

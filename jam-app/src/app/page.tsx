'use client';
import React, { useState } from 'react';
import { AudioEngineProvider, useAudioEngine } from '@/context/AudioEngine';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PlayerCard from '@/components/PlayerCard';
import InstrumentPanel from '@/components/InstrumentPanel';
import ActionButtons from '@/components/ActionButtons';
import SettingsModal from '@/components/SettingsModal';

function MainStudio() {
  const { isAudioStarted, startAudio, selectedInstrument } = useAudioEngine();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getRoleLabel = () => {
    switch (selectedInstrument) {
      case 'drums': return 'DRUMS (808)';
      case 'guitar': return 'ELECTRIC GUITAR';
      case 'keyboard': return 'SYNTH KEYBOARD';
      case 'sitar': return 'INDIAN SITAR';
      default: return 'INSTRUMENT';
    }
  };

  const getRoleIcon = () => {
    switch (selectedInstrument) {
      case 'drums': return '🥁';
      case 'guitar': return '🎸';
      case 'keyboard': return '🎹';
      case 'sitar': return '🪕';
      default: return '🎵';
    }
  };

  return (
    <div style={studioRootStyle} onClick={() => !isAudioStarted && startAudio()}>
      {/* 1. Full-Height Left Sidebar (Mixer, Instruments, Band Roster, Help) */}
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 2. Main Studio Content Area */}
      <div style={studioMainContentStyle}>
        {/* Top Header */}
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* 2x2 Collaborative Band Stage Grid (Maximized Camera Screen Frames) */}
        <main style={stageGridContainerStyle}>
          <div style={stage2x2GridStyle}>
            {/* Player 1: Host (You) - Auto-requests webcam with fallback */}
            <PlayerCard
              id="p1"
              name="ALEX (You)"
              role={getRoleLabel()}
              instrumentIcon={getRoleIcon()}
              isLocalUser={true}
              color="#00f0ff"
              defaultActiveNote="Kick • Snare"
              avatarSeed="host"
            />

            {/* Player 2: Sarah (Guitar) */}
            <PlayerCard
              id="p2"
              name="SARAH"
              role="ELECTRIC GUITAR"
              instrumentIcon="🎸"
              color="#ff0077"
              defaultActiveNote="E Minor Chord"
              avatarSeed="sarah"
            />

            {/* Player 3: Mike (Keyboard) */}
            <PlayerCard
              id="p3"
              name="MIKE"
              role="SYNTH KEYBOARD"
              instrumentIcon="🎹"
              color="#ffaa00"
              defaultActiveNote="C4 • E4 • G4"
              avatarSeed="mike"
            />

            {/* Player 4: Aarav (Indian Sitar & Tanpura Drone) */}
            <PlayerCard
              id="p4"
              name="AARAV"
              role="INDIAN SITAR"
              instrumentIcon="🪕"
              color="#ff7b00"
              defaultActiveNote="Sa (C4) • Re (D4)"
              avatarSeed="aarav"
            />
          </div>
        </main>

        {/* Bottom Row: Realistic Studio Hardware Instrument Panel + 3 Action Buttons */}
        <footer style={bottomControlsRowStyle}>
          {/* Left: Wide Realistic Studio Hardware Instrument Panel */}
          <InstrumentPanel />

          {/* Right: 3 Action Buttons (Mic Mute, Put Filter On, Settings) */}
          <ActionButtons onOpenSettings={() => setIsSettingsOpen(true)} vertical={false} />
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <AudioEngineProvider>
      <MainStudio />
    </AudioEngineProvider>
  );
}

const studioRootStyle: React.CSSProperties = {
  display: 'flex',
  width: '100vw',
  height: '100vh',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  position: 'relative',
  overflow: 'hidden'
};

const studioMainContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative',
  overflow: 'hidden'
};

const stageGridContainerStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 18px 8px 18px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0
};

const stage2x2GridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  gap: '10px',
  width: '100%',
  height: '100%',
  minHeight: 0
};

const bottomControlsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '12px',
  padding: '0 18px 12px 18px',
  height: '215px',
  minHeight: '200px',
  maxHeight: '225px',
  zIndex: 10
};

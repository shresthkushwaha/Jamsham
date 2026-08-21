'use client';
import React, { useState } from 'react';
import { AudioEngineProvider, useAudioEngine } from '@/context/AudioEngine';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FloatingOrbsStage from '@/components/FloatingOrbsStage';
import InstrumentPanel from '@/components/InstrumentPanel';
import ActionButtons from '@/components/ActionButtons';
import SettingsModal from '@/components/SettingsModal';

function MainStudio() {
  const { isAudioStarted, startAudio } = useAudioEngine();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div style={studioRootStyle} onClick={() => !isAudioStarted && startAudio()}>
      {/* 1. Full-Height Left Sidebar (Mixer, Instruments, Band Roster, Help) */}
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 2. Main Studio Workstation */}
      <div style={studioMainContentStyle}>
        {/* Top Header (Room Badge, Metronome BPM, Recording counter) */}
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Center Stage & Right-Side Buttons Layout */}
        <div style={centerStageAndControlsWrapperStyle}>
          {/* Main Floating Circular Camera Orbs Stage (Organic Floating & Relative Volume Sizing) */}
          <FloatingOrbsStage />

          {/* Right-Side Action Buttons (Mic Mute, Put Filter On, Settings) */}
          <ActionButtons onOpenSettings={() => setIsSettingsOpen(true)} vertical={true} />
        </div>

        {/* Bottom Wide Studio Instrument Hardware Panel */}
        <footer style={bottomPanelContainerStyle}>
          <InstrumentPanel />
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

const centerStageAndControlsWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  padding: '0 16px',
  gap: '10px',
  minHeight: 0,
  position: 'relative',
  overflow: 'hidden'
};

const bottomPanelContainerStyle: React.CSSProperties = {
  padding: '0 16px 12px 16px',
  height: '135px',
  minHeight: '120px',
  maxHeight: '145px',
  display: 'flex',
  zIndex: 20
};

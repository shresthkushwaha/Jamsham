'use client';
import React, { useState } from 'react';
import { useAudioEngine, InstrumentType } from '@/context/AudioEngine';

interface SidebarProps {
  onOpenSettings: () => void;
}

export default function Sidebar({ onOpenSettings }: SidebarProps) {
  const {
    selectedInstrument,
    setSelectedInstrument,
    masterVolume,
    setMasterVolume,
    isAudioStarted,
    startAudio
  } = useAudioEngine();

  const [activeTab, setActiveTab] = useState<'none' | 'mixer' | 'instruments' | 'band' | 'help'>('none');

  const instruments: { id: InstrumentType; label: string; icon: string; desc: string; color: string }[] = [
    { id: 'drums', label: 'Drums', icon: '🥁', desc: '808 Punch & MPC Pads', color: '#00f0ff' },
    { id: 'guitar', label: 'Guitar', icon: '🎸', desc: 'Strummable Chords & Strings', color: '#ff0077' },
    { id: 'keyboard', label: 'Keyboard', icon: '🎹', desc: 'Polyphonic Ivory Grand', color: '#ffaa00' },
    { id: 'sitar', label: 'Sitar (Indian)', icon: '🪕', desc: 'Classical Ragas & Tanpura Drone', color: '#ff7b00' },
  ];

  const bandMembers = [
    { name: 'Alex (You)', role: selectedInstrument.toUpperCase(), status: 'Host', ping: '12ms', color: '#00f0ff' },
    { name: 'Sarah', role: 'GUITAR', status: 'Strumming', ping: '24ms', color: '#ff0077' },
    { name: 'Mike', role: 'KEYBOARD', status: 'Soloing', ping: '18ms', color: '#ffaa00' },
    { name: 'Aarav', role: 'SITAR', status: 'Drone Raga', ping: '29ms', color: '#ff7b00' },
  ];

  return (
    <aside style={sidebarContainerStyle}>
      {/* Primary Icon Strip */}
      <div className="glass-panel" style={iconStripStyle}>
        <div style={logoBadgeStyle} title="Jamsham Studio">
          ⚡
        </div>

        <div style={iconGroupStyle}>
          {/* MIXER */}
          <button
            onClick={() => setActiveTab(activeTab === 'mixer' ? 'none' : 'mixer')}
            style={{
              ...sidebarIconBtnStyle,
              background: activeTab === 'mixer' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: activeTab === 'mixer' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
            }}
            title="Mixer & Master Volume"
          >
            🎛
            <span style={iconLabelStyle}>MIX</span>
          </button>

          {/* INSTRUMENTS */}
          <button
            onClick={() => setActiveTab(activeTab === 'instruments' ? 'none' : 'instruments')}
            style={{
              ...sidebarIconBtnStyle,
              background: activeTab === 'instruments' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: activeTab === 'instruments' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
            }}
            title="Switch Your Instrument"
          >
            🎵
            <span style={iconLabelStyle}>INST</span>
          </button>

          {/* BAND MEMBERS */}
          <button
            onClick={() => setActiveTab(activeTab === 'band' ? 'none' : 'band')}
            style={{
              ...sidebarIconBtnStyle,
              background: activeTab === 'band' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: activeTab === 'band' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
            }}
            title="Band Members"
          >
            👥
            <span style={iconLabelStyle}>BAND</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* HELP & HOTKEYS */}
          <button
            onClick={() => setActiveTab(activeTab === 'help' ? 'none' : 'help')}
            style={{
              ...sidebarIconBtnStyle,
              background: activeTab === 'help' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: activeTab === 'help' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
            }}
            title="Keyboard Shortcuts & Help"
          >
            ❓
            <span style={iconLabelStyle}>HELP</span>
          </button>
        </div>
      </div>

      {/* Flyout Drawer for Active Tab */}
      {activeTab !== 'none' && (
        <div className="glass-panel" style={flyoutDrawerStyle}>
          {activeTab === 'mixer' && (
            <div>
              <h3 style={drawerTitleStyle}>🎛 Master Mixer</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span>Master Volume</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{masterVolume} dB</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="6"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={mixerChannelStyle}>
                  <span>🥁 Drums (MPC)</span>
                  <input type="range" min="0" max="100" defaultValue="85" style={{ accentColor: '#00f0ff' }} />
                </label>
                <label style={mixerChannelStyle}>
                  <span>🎸 Guitar (Clean)</span>
                  <input type="range" min="0" max="100" defaultValue="90" style={{ accentColor: '#ff0077' }} />
                </label>
                <label style={mixerChannelStyle}>
                  <span>🎹 Keyboard (Grand)</span>
                  <input type="range" min="0" max="100" defaultValue="80" style={{ accentColor: '#ffaa00' }} />
                </label>
                <label style={mixerChannelStyle}>
                  <span>🪕 Sitar & Drone</span>
                  <input type="range" min="0" max="100" defaultValue="85" style={{ accentColor: '#ff7b00' }} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'instruments' && (
            <div>
              <h3 style={drawerTitleStyle}>🎵 Select Instrument</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Choose your live instrument role:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {instruments.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      if (!isAudioStarted) startAudio();
                      setSelectedInstrument(inst.id);
                      setActiveTab('none');
                    }}
                    style={{
                      ...instrumentSelectBtnStyle,
                      border: selectedInstrument === inst.id ? `1px solid ${inst.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: selectedInstrument === inst.id ? `${inst.color}22` : 'rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <span style={{ fontSize: '22px' }}>{inst.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{inst.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inst.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'band' && (
            <div>
              <h3 style={drawerTitleStyle}>👥 Band Members (4/4)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bandMembers.map((member, i) => (
                  <div key={i} style={memberCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: member.color }} />
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{member.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={memberRoleBadgeStyle}>{member.role}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{member.ping}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div>
              <h3 style={drawerTitleStyle}>❓ Hotkeys & Controls</h3>
              <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
                <li>🖐 <b>Hover Mode</b>: Glide cursor across keys or strings</li>
                <li>⌨ <b>Keyboard Mode</b>: Press the exact key shown in badges `[1-8]`, `[Q-Y]`, `[A-K]`</li>
                <li>⌨ <b>M</b>: Toggle Microphone Mute</li>
                <li>⌨ <b>F</b>: Toggle 800Hz Lowpass Audio Filter</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

const sidebarContainerStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  position: 'relative',
  zIndex: 30
};

const iconStripStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 8px',
  width: '64px',
  height: '100%',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(10, 12, 18, 0.98)',
  gap: '16px'
};

const logoBadgeStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #00f0ff, #ff0077)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
  marginBottom: '8px'
};

const iconGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%'
};

const sidebarIconBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 4px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '20px',
  transition: 'all 0.2s ease',
  width: '100%'
};

const iconLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '0.05em',
  marginTop: '4px'
};

const flyoutDrawerStyle: React.CSSProperties = {
  position: 'absolute',
  left: '68px',
  top: '12px',
  bottom: '12px',
  width: '270px',
  borderRadius: '16px',
  padding: '18px',
  background: 'rgba(15, 18, 26, 0.98)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
  zIndex: 40
};

const drawerTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  marginBottom: '14px',
  color: 'var(--text-primary)'
};

const mixerChannelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '12px',
  color: 'var(--text-secondary)'
};

const instrumentSelectBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px',
  borderRadius: '10px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease'
};

const memberCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  borderRadius: '8px',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.05)'
};

const memberRoleBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'var(--text-primary)'
};

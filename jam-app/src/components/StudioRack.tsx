'use client';
import React, { useState } from 'react';
import { Volume2, Sparkles, Sliders, Music } from 'lucide-react';

interface StudioRackProps {
  onPlayInstrument: (instrumentId: string, noteOrSound: string | string[]) => void;
  onStopInstrument?: (instrumentId: string, noteOrSound: string | string[]) => void;
}

export default function StudioRack({ onPlayInstrument, onStopInstrument }: StudioRackProps) {
  const [activeRackTab, setActiveRackTab] = useState<'ALL' | 'DRUMS' | 'GUITAR' | 'BASS' | 'PIANO' | 'BRASS' | 'STRINGS'>('ALL');
  const [octaveShift, setOctaveShift] = useState<Record<string, number>>({
    GUITAR: 0,
    BASS: 0,
    PIANO: 0,
    BRASS: 0,
    STRINGS: 0,
  });
  const [activePadId, setActivePadId] = useState<string | null>(null);

  const handleOctaveChange = (instrumentId: string, delta: number) => {
    setOctaveShift((prev) => ({
      ...prev,
      [instrumentId]: Math.max(-2, Math.min(2, (prev[instrumentId] || 0) + delta)),
    }));
  };

  const getShiftedNote = (instrumentId: string, note: string) => {
    const shift = octaveShift[instrumentId] || 0;
    if (shift === 0 || !note) return note;
    const match = note.match(/^([A-G]#?)([0-9])$/);
    if (!match) return note;
    const noteName = match[1];
    const oct = parseInt(match[2]) + shift;
    return `${noteName}${Math.max(0, Math.min(8, oct))}`;
  };

  const RACK_MODULES = [
    {
      id: 'DRUMS',
      title: '🥁 ACOUSTIC DRUM KIT',
      subtitle: 'Multi-layer wood snare, dynamic kick, and acoustic cymbals',
      color: '#FF5722',
      pads: [
        { id: 'KICK', label: 'KICK', key: '1' },
        { id: 'SNARE', label: 'SNARE', key: '2' },
        { id: 'HIHAT', label: 'CL-HAT', key: '3' },
        { id: 'OPEN HAT', label: 'OP-HAT', key: '4' },
        { id: 'HIGH TOM', label: 'HI-TOM', key: 'Q' },
        { id: 'MID TOM', label: 'MID-TOM', key: 'W' },
        { id: 'FLOOR TOM', label: 'FL-TOM', key: 'E' },
        { id: 'CRASH', label: 'CRASH', key: 'A' },
        { id: 'RIDE', label: 'RIDE', key: 'S' },
        { id: 'TAMBOURINE', label: 'TAMB', key: 'D' },
      ],
    },
    {
      id: 'GUITAR',
      title: '🎸 ACOUSTIC & ELECTRIC GUITAR',
      subtitle: 'Real FluidR3 steel string soundfont with finger strumming',
      color: '#FF9800',
      hasOctave: true,
      pads: [
        { id: 'E Maj', label: 'E MAJ', notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'] },
        { id: 'A Maj', label: 'A MAJ', notes: ['A2', 'E3', 'A3', 'C#4', 'E4'] },
        { id: 'D Maj', label: 'D MAJ', notes: ['D3', 'A3', 'D4', 'F#4'] },
        { id: 'G Maj', label: 'G MAJ', notes: ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'] },
        { id: 'C Maj', label: 'C MAJ', notes: ['C3', 'E3', 'G3', 'C4', 'E4'] },
        { id: 'E Min', label: 'E MIN', notes: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'] },
        { id: 'A Min', label: 'A MIN', notes: ['A2', 'E3', 'A3', 'C4', 'E4'] },
        { id: 'D Min', label: 'D MIN', notes: ['D3', 'A3', 'D4', 'F4'] },
        { id: 'E4', label: 'E4 PLK', notes: 'E4' },
        { id: 'B3', label: 'B3 PLK', notes: 'B3' },
        { id: 'G3', label: 'G3 PLK', notes: 'G3' },
      ],
    },
    {
      id: 'BASS',
      title: '🎸 ELECTRIC BASS GUITAR',
      subtitle: 'Real finger-style electric bass soundfont with deep low end',
      color: '#E040FB',
      hasOctave: true,
      pads: ['E1', 'F1', 'G1', 'A1', 'B1', 'C2', 'D2', 'E2', 'F2', 'G2'].map((n) => ({
        id: n,
        label: n,
        notes: n,
      })),
    },
    {
      id: 'PIANO',
      title: '🎹 STEINWAY GRAND PIANO',
      subtitle: 'Authentic acoustic grand piano soundfont with natural hammer strike',
      color: '#00E676',
      hasOctave: true,
      pads: [
        { id: 'C4', label: 'C4' },
        { id: 'C#4', label: 'C#4', isBlack: true },
        { id: 'D4', label: 'D4' },
        { id: 'D#4', label: 'D#4', isBlack: true },
        { id: 'E4', label: 'E4' },
        { id: 'F4', label: 'F4' },
        { id: 'F#4', label: 'F#4', isBlack: true },
        { id: 'G4', label: 'G4' },
        { id: 'G#4', label: 'G#4', isBlack: true },
        { id: 'A4', label: 'A4' },
        { id: 'A#4', label: 'A#4', isBlack: true },
        { id: 'B4', label: 'B4' },
        { id: 'C5', label: 'C5' },
      ],
    },
    {
      id: 'BRASS',
      title: '🎷 TENOR SAXOPHONE & HORNS',
      subtitle: 'Expressive acoustic tenor sax soundfont with brass swells',
      color: '#FFD600',
      hasOctave: true,
      pads: [
        { id: 'Bb3', label: 'Bb3 SAX' },
        { id: 'C4', label: 'C4 STAB' },
        { id: 'D4', label: 'D4 STAB' },
        { id: 'F4', label: 'F4 BRASS' },
        { id: 'G4', label: 'G4 BRASS' },
        { id: 'Bb4', label: 'Bb4 SAX' },
        { id: 'C5', label: 'C5 TRP' },
        { id: 'D5', label: 'D5 TRP' },
      ],
    },
    {
      id: 'STRINGS',
      title: '🎻 STRING SECTION & SYMPHONY',
      subtitle: 'Symphonic violin and cello soundfont with lush stereo reverb',
      color: '#00B0FF',
      hasOctave: true,
      pads: [
        { id: 'Am Swell', label: 'Am SWELL', notes: ['A3', 'C4', 'E4', 'A4'] },
        { id: 'F Maj Swell', label: 'F MAJ', notes: ['F3', 'A3', 'C4', 'F4'] },
        { id: 'C Maj Swell', label: 'C MAJ', notes: ['C3', 'E3', 'G3', 'C4'] },
        { id: 'G Maj Swell', label: 'G MAJ', notes: ['G3', 'B3', 'D4', 'G4'] },
        { id: 'Dm Swell', label: 'Dm SWELL', notes: ['D3', 'F3', 'A3', 'D4'] },
        { id: 'Em Swell', label: 'Em SWELL', notes: ['E3', 'G3', 'B3', 'E4'] },
        { id: 'Violin Solo A5', label: 'VIOLIN A5', notes: 'A5' },
        { id: 'Cello C2', label: 'CELLO C2', notes: 'C2' },
      ],
    },
  ];

  const handlePadTrigger = (instrumentId: string, pad: any) => {
    setActivePadId(`${instrumentId}-${pad.id}`);

    let notesToPlay = pad.notes || pad.id;
    if (Array.isArray(notesToPlay)) {
      notesToPlay = notesToPlay.map((n: string) => getShiftedNote(instrumentId, n));
    } else if (typeof notesToPlay === 'string' && notesToPlay.match(/^[A-G]#?[0-9]$/)) {
      notesToPlay = getShiftedNote(instrumentId, notesToPlay);
    }

    onPlayInstrument(instrumentId, notesToPlay);
    setTimeout(() => setActivePadId(null), 120);
  };

  const visibleModules =
    activeRackTab === 'ALL' ? RACK_MODULES : RACK_MODULES.filter((m) => m.id === activeRackTab);

  return (
    <div style={rackContainer}>
      {/* Top Banner */}
      <div className="skeuo-rack-chassis" style={topBanner}>
        <span className="skeuo-screw" style={{ position: 'absolute', top: 8, left: 8 }} />
        <span className="skeuo-screw" style={{ position: 'absolute', top: 8, right: 8 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px' }}>
          <Sparkles size={16} color="#00E676" />
          <div className="skeuo-dymo-tape">
            <span>MASTER SOUNDFONT RACK</span>
          </div>
          <span className="skeuo-digital-led" style={{ color: '#00E676', fontSize: '9px' }}>
            SF2 ACOUSTIC ENGINE ACTIVE
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#888', paddingRight: '16px' }}>
          All units synced with 0ms local response & live P2P network relay
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={filterBar}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', marginRight: '6px' }}>
          UNIT SELECT:
        </span>
        {['ALL', 'DRUMS', 'GUITAR', 'BASS', 'PIANO', 'BRASS', 'STRINGS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveRackTab(tab as any)}
            className="skeuo-industrial-btn"
            style={{
              ...filterBtn,
              borderColor: activeRackTab === tab ? '#00E676' : 'rgba(255, 255, 255, 0.12)',
              color: activeRackTab === tab ? '#00E676' : '#888',
              fontWeight: activeRackTab === tab ? 900 : 'normal',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Skeuomorphic Rack Modules Grid */}
      <div style={rackGrid}>
        {visibleModules.map((module) => (
          <div
            key={module.id}
            className="skeuo-rack-chassis"
            style={{
              ...rackUnit,
              borderColor: `${module.color}44`,
            }}
          >
            {/* Corner Screws */}
            <span className="skeuo-screw" style={{ position: 'absolute', top: 6, left: 6 }} />
            <span className="skeuo-screw" style={{ position: 'absolute', top: 6, right: 6 }} />

            {/* Unit Header */}
            <div style={unitHeader}>
              <div style={{ paddingLeft: '14px' }}>
                <div className="skeuo-dymo-tape" style={{ borderColor: module.color, color: module.color }}>
                  <span>{module.title}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#777', display: 'block', marginTop: '4px' }}>
                  {module.subtitle}
                </span>
              </div>

              {/* Octave Controls */}
              {module.hasOctave && (
                <div style={octaveControl}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#888' }}>OCT</span>
                  <button
                    onClick={() => handleOctaveChange(module.id, -1)}
                    className="skeuo-industrial-btn"
                    style={octBtn}
                  >
                    -
                  </button>
                  <span className="skeuo-digital-led" style={{ fontSize: '11px', color: module.color, minWidth: '20px', textAlign: 'center' }}>
                    {(octaveShift[module.id] || 0) >= 0 ? `+${octaveShift[module.id] || 0}` : octaveShift[module.id]}
                  </span>
                  <button
                    onClick={() => handleOctaveChange(module.id, 1)}
                    className="skeuo-industrial-btn"
                    style={octBtn}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Tactile MPC Pads in Rack */}
            <div style={padsContainer}>
              {module.pads.map((pad: any) => {
                const isPressed = activePadId === `${module.id}-${pad.id}`;
                return (
                  <button
                    key={pad.id}
                    onClick={() => handlePadTrigger(module.id, pad)}
                    className="skeuo-mpc-pad"
                    style={{
                      ...padButton,
                      background: isPressed
                        ? `radial-gradient(circle at 50% 30%, ${module.color} 0%, #20202e 100%)`
                        : pad.isBlack
                        ? 'linear-gradient(180deg, #181822 0%, #0c0c12 100%)'
                        : 'linear-gradient(180deg, #323242 0%, #20202c 100%)',
                      borderColor: isPressed ? module.color : pad.isBlack ? '#242432' : 'rgba(255, 255, 255, 0.12)',
                      boxShadow: isPressed ? `0 0 16px ${module.color}` : '0 3px 6px rgba(0,0,0,0.5)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isPressed ? '#fff' : '#ddd' }}>
                      {pad.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const rackContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  width: '100%',
  paddingBottom: '24px',
};

const topBanner: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  position: 'relative',
};

const filterBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
};

const filterBtn: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '10px',
};

const rackGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: '16px',
};

const rackUnit: React.CSSProperties = {
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  position: 'relative',
};

const unitHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  paddingBottom: '8px',
};

const octaveControl: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'rgba(0, 0, 0, 0.35)',
  padding: '3px 8px',
  borderRadius: '6px',
};

const octBtn: React.CSSProperties = {
  width: '18px',
  height: '18px',
  fontSize: '11px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const padsContainer: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const padButton: React.CSSProperties = {
  padding: '8px 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '70px',
  height: '42px',
};

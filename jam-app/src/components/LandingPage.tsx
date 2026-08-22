'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';
import InstrumentAsciiCanvas, { InstrumentTheme, INSTRUMENT_THEMES } from './InstrumentAsciiCanvas';

export interface LandingPageProps {
  onJoin?: (
    roomId: string,
    userName: string,
    preferredInstrument?: string,
    assignmentMode?: 'random' | 'custom'
  ) => void;
  isLoading?: boolean;
}

interface InstrumentOption {
  id: string;
  name: string;
  icon: string;
}

const AVAILABLE_INSTRUMENTS: InstrumentOption[] = [
  { id: 'GUITAR', name: 'GUITAR', icon: '🎸' },
  { id: 'KEYBOARD', name: 'KEYBOARD', icon: '🎹' },
  { id: 'DRUM', name: 'DRUM KIT', icon: '🥁' },
  { id: 'SITAR', name: 'SITAR', icon: '🪕' },
  { id: 'FLUTE', name: 'FLUTE', icon: '🪈' },
  { id: 'TRUMPET', name: 'TRUMPET', icon: '🎺' },
  { id: 'SAXOPHONE', name: 'SAXOPHONE', icon: '🎷' },
  { id: 'VIOLIN', name: 'VIOLIN', icon: '🎻' },
];

function generateRandomCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `JAM-${num}`;
}

export default function LandingPage({ onJoin, isLoading = false }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  
  // Dynamic Instrument Theme State
  const [currentTheme, setCurrentTheme] = useState<InstrumentTheme>(INSTRUMENT_THEMES[0]);

  // Create Room State
  const [createdRoomCode, setCreatedRoomCode] = useState(generateRandomCode());
  const [assignmentMode, setAssignmentMode] = useState<'random' | 'custom'>('random');
  const [creatorSelectedInst, setCreatorSelectedInst] = useState<string>('DRUM');
  const [copied, setCopied] = useState(false);

  // Join Room State
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinSelectedInst, setJoinSelectedInst] = useState<string>('');
  const [joinAvailableInsts, setJoinAvailableInsts] = useState<InstrumentOption[]>(AVAILABLE_INSTRUMENTS);
  const [isJoinRoomCustom, setIsJoinRoomCustom] = useState(false);

  // Dynamic 40px cursor-reactive DOT ASCII shadow for the entire box
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [shadowOffset, setShadowOffset] = useState({ x: 28.3, y: 28.3 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;

      // 40px shadow facing OPPOSITE of cursor across the entire screen
      const oppX = -(dx / dist) * 40;
      const oppY = -(dy / dist) * 40;
      setShadowOffset({ x: oppX, y: oppY });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  // When joinRoomCode changes, check room details from server
  useEffect(() => {
    if (!joinRoomCode.trim()) {
      setIsJoinRoomCustom(false);
      return;
    }

    const cleanCode = joinRoomCode.trim().toLowerCase();
    const serverUrl = process.env.NEXT_PUBLIC_JAM_SERVER_URL || 'http://localhost:3001';

    const checkRoom = async () => {
      try {
        const res = await fetch(`${serverUrl}/room-info/${cleanCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.assignmentMode === 'custom') {
            setIsJoinRoomCustom(true);
            if (data.availableInstruments && data.availableInstruments.length > 0) {
              setJoinAvailableInsts(data.availableInstruments);
              if (!joinSelectedInst || !data.availableInstruments.some((i: any) => i.id === joinSelectedInst)) {
                setJoinSelectedInst(data.availableInstruments[0].id);
              }
            } else {
              setJoinAvailableInsts(AVAILABLE_INSTRUMENTS);
            }
          } else {
            setIsJoinRoomCustom(false);
          }
        }
      } catch (err) {
        // Fallback
      }
    };

    const debounce = setTimeout(checkRoom, 400);
    return () => clearTimeout(debounce);
  }, [joinRoomCode, joinSelectedInst]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdRoomCode.trim()) return;
    if (onJoin) {
      onJoin(
        createdRoomCode.trim(),
        displayName.trim() || 'Band Leader',
        assignmentMode === 'custom' ? creatorSelectedInst : undefined,
        assignmentMode
      );
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) return;
    if (onJoin) {
      onJoin(
        joinRoomCode.trim(),
        displayName.trim() || 'Musician',
        isJoinRoomCustom ? joinSelectedInst : undefined,
        undefined
      );
    }
  };

  const textCol = currentTheme.textColor;
  const cardBg = currentTheme.cardBg;
  const shadowCol = currentTheme.shadowColor;

  return (
    <div style={viewportWrapper}>
      <div className="landing-centered-cluster" style={centeredCluster}>
        {/* LEFT PANE: DYNAMIC COLORED BOX WITH MATCHING 40PX DOT ASCII SHADOW */}
        <div className="landing-white-box" style={whiteBoxWrapper}>
          {/* Dynamic 40px ASCII Dot Matrix Shadow Layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: `translate(${shadowOffset.x.toFixed(1)}px, ${shadowOffset.y.toFixed(1)}px)`,
              borderRadius: '4px',
              backgroundImage: `radial-gradient(circle, ${shadowCol} 1.4px, transparent 1.4px)`,
              backgroundSize: '5px 5px',
              border: `1.5px dashed ${shadowCol}88`,
              pointerEvents: 'none',
              zIndex: 0,
              transition: 'transform 0.05s linear, border-color 0.3s ease',
            }}
          />

          {/* DYNAMIC COLORED CARD (High-contrast theme-aware content) */}
          <div
            ref={boxRef}
            style={{
              ...themeCardStyle,
              backgroundColor: cardBg,
              color: textCol,
              borderColor: textCol,
            }}
          >
            {/* Title */}
            <h1 style={{ ...themeTitleStyle, color: textCol }}>JAMSHAM</h1>

            {/* 1. Create Room / Join Room Tabs */}
            <div style={tabsWrapperStyle}>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                style={{
                  ...tabButtonStyle,
                  borderColor: textCol,
                  background: activeTab === 'create' ? textCol : 'rgba(255, 255, 255, 0.25)',
                  color: activeTab === 'create' ? cardBg : textCol,
                }}
              >
                CREATE ROOM
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                style={{
                  ...tabButtonStyle,
                  borderColor: textCol,
                  background: activeTab === 'join' ? textCol : 'rgba(255, 255, 255, 0.25)',
                  color: activeTab === 'join' ? cardBg : textCol,
                }}
              >
                JOIN ROOM
              </button>
            </div>

            {/* 2. CREATE ROOM FORM */}
            {activeTab === 'create' ? (
              <form onSubmit={handleCreateSubmit} style={formStyle}>
                {/* Display Name */}
                <div style={fieldGroupStyle}>
                  <label style={{ ...themeLabelStyle, color: textCol }}>DISPLAY NAME</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="e.g. Jimi, Miles, Prince"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      ...themeInputStyle,
                      borderColor: textCol,
                      color: '#000000',
                    }}
                    maxLength={24}
                  />
                </div>

                {/* Room Code with Copy Icon */}
                <div style={fieldGroupStyle}>
                  <label style={{ ...themeLabelStyle, color: textCol }}>ROOM CODE</label>
                  <div style={codeWithCopyWrapper}>
                    <input
                      suppressHydrationWarning
                      type="text"
                      value={createdRoomCode}
                      onChange={(e) => setCreatedRoomCode(e.target.value)}
                      style={{
                        ...themeInputStyle,
                        paddingRight: '48px',
                        borderColor: textCol,
                        color: '#000000',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Copy room code"
                      style={{
                        ...themeCopyButtonStyle,
                        borderColor: textCol,
                      }}
                    >
                      {copied ? <Check size={18} color="#00ff66" /> : <Copy size={18} color={textCol} />}
                    </button>
                  </div>
                </div>

                {/* Assignment Mode Option */}
                <div style={fieldGroupStyle}>
                  <label style={{ ...themeLabelStyle, color: textCol }}>INSTRUMENT ASSIGNMENT</label>
                  <div style={modeToggleRow}>
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('random')}
                      style={{
                        ...modeButtonStyle,
                        borderColor: textCol,
                        background: assignmentMode === 'random' ? textCol : 'rgba(255, 255, 255, 0.25)',
                        color: assignmentMode === 'random' ? cardBg : textCol,
                      }}
                    >
                      RANDOM
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentMode('custom')}
                      style={{
                        ...modeButtonStyle,
                        borderColor: textCol,
                        background: assignmentMode === 'custom' ? textCol : 'rgba(255, 255, 255, 0.25)',
                        color: assignmentMode === 'custom' ? cardBg : textCol,
                      }}
                    >
                      CUSTOM
                    </button>
                  </div>
                </div>

                {/* Custom Instrument Picker (Only shown if custom mode is enabled) */}
                {assignmentMode === 'custom' && (
                  <div style={fieldGroupStyle}>
                    <label style={{ ...themeLabelStyle, color: textCol }}>SELECT YOUR INSTRUMENT</label>
                    <div style={instrumentGridStyle}>
                      {AVAILABLE_INSTRUMENTS.map((inst) => {
                        const isSelected = creatorSelectedInst === inst.id;
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => setCreatorSelectedInst(inst.id)}
                            style={{
                              ...instSelectButtonStyle,
                              borderColor: textCol,
                              background: isSelected ? textCol : 'rgba(255, 255, 255, 0.25)',
                              color: isSelected ? cardBg : textCol,
                            }}
                          >
                            <span style={{ marginRight: '6px' }}>{inst.icon}</span>
                            <span>{inst.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading || !createdRoomCode.trim()}
                  style={{
                    ...themeSubmitButtonStyle,
                    background: textCol,
                    color: cardBg,
                    borderColor: textCol,
                  }}
                >
                  {isLoading ? (
                    <span>CREATING...</span>
                  ) : (
                    <>
                      <span>CREATE JAMSHAM</span>
                      <ArrowRight size={19} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* 3. JOIN ROOM FORM */
              <form onSubmit={handleJoinSubmit} style={formStyle}>
                {/* Display Name */}
                <div style={fieldGroupStyle}>
                  <label style={{ ...themeLabelStyle, color: textCol }}>DISPLAY NAME</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="e.g. Jimi, Miles, Prince"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      ...themeInputStyle,
                      borderColor: textCol,
                      color: '#000000',
                    }}
                    maxLength={24}
                  />
                </div>

                {/* Room Code */}
                <div style={fieldGroupStyle}>
                  <label style={{ ...themeLabelStyle, color: textCol }}>ROOM CODE</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="Enter Room Code (e.g. JAM-101)"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value)}
                    style={{
                      ...themeInputStyle,
                      borderColor: textCol,
                      color: '#000000',
                    }}
                    required
                  />
                </div>

                {/* Custom Instrument Picker (Shown if room is in custom assignment mode) */}
                {isJoinRoomCustom && (
                  <div style={fieldGroupStyle}>
                    <label style={{ ...themeLabelStyle, color: textCol }}>AVAILABLE INSTRUMENTS</label>
                    <div style={instrumentGridStyle}>
                      {joinAvailableInsts.map((inst) => {
                        const isSelected = joinSelectedInst === inst.id;
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => setJoinSelectedInst(inst.id)}
                            style={{
                              ...instSelectButtonStyle,
                              borderColor: textCol,
                              background: isSelected ? textCol : 'rgba(255, 255, 255, 0.25)',
                              color: isSelected ? cardBg : textCol,
                            }}
                          >
                            <span style={{ marginRight: '6px' }}>{inst.icon || '🎵'}</span>
                            <span>{inst.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isLoading || !joinRoomCode.trim()}
                  style={{
                    ...themeSubmitButtonStyle,
                    background: textCol,
                    color: cardBg,
                    borderColor: textCol,
                  }}
                >
                  {isLoading ? (
                    <span>JOINING...</span>
                  ) : (
                    <>
                      <span>JOIN JAMSHAM</span>
                      <ArrowRight size={19} strokeWidth={3} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT PANE: 2D MULTI-COLORED DOT MATRIX CANVAS (Hidden on Mobile) */}
        <div className="ascii-art-pane" style={artPaneStyle}>
          <InstrumentAsciiCanvas onThemeChange={setCurrentTheme} />
        </div>
      </div>
    </div>
  );
}

const JUA_FONT = '"Jua", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const viewportWrapper: React.CSSProperties = {
  width: '100vw',
  minHeight: '100vh',
  background: '#000000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 40px',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const centeredCluster: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '56px',
  width: '100%',
  maxWidth: '1060px',
  margin: '0 auto',
  transform: 'translateX(75px)',
  boxSizing: 'border-box',
};

const whiteBoxWrapper: React.CSSProperties = {
  position: 'relative',
  flex: '0 0 400px',
  width: '400px',
  zIndex: 10,
};

const themeCardStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  border: '2px solid',
  borderRadius: '4px',
  padding: '36px 32px',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  transition: 'background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease',
};

const themeTitleStyle: React.CSSProperties = {
  fontFamily: JUA_FONT,
  fontSize: '54px',
  fontWeight: '400',
  letterSpacing: '3px',
  margin: '0 0 22px 0',
  lineHeight: 0.95,
  textTransform: 'uppercase',
  transition: 'color 0.35s ease',
};

const tabsWrapperStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '22px',
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: JUA_FONT,
  fontSize: '15px',
  fontWeight: '400',
  letterSpacing: '1px',
  padding: '10px 14px',
  border: '2px solid',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const themeLabelStyle: React.CSSProperties = {
  fontFamily: JUA_FONT,
  fontSize: '14px',
  fontWeight: '400',
  letterSpacing: '1px',
  marginBottom: '7px',
  textTransform: 'uppercase',
  transition: 'color 0.35s ease',
};

const themeInputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  color: '#000000',
  border: '2px solid',
  borderRadius: '4px',
  padding: '12px 14px',
  fontSize: '16px',
  fontFamily: JUA_FONT,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.35s ease',
};

const codeWithCopyWrapper: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
};

const themeCopyButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '8px',
  background: 'rgba(255, 255, 255, 0.9)',
  border: '1.5px solid',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 7px',
  outline: 'none',
  transition: 'border-color 0.35s ease',
};

const modeToggleRow: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const modeButtonStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: JUA_FONT,
  fontSize: '14px',
  fontWeight: '400',
  letterSpacing: '1px',
  padding: '9px',
  border: '2px solid',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const instrumentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const instSelectButtonStyle: React.CSSProperties = {
  fontFamily: JUA_FONT,
  fontSize: '13px',
  fontWeight: '400',
  letterSpacing: '0.5px',
  padding: '10px 6px',
  border: '2px solid',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  outline: 'none',
  textTransform: 'uppercase',
};

const themeSubmitButtonStyle: React.CSSProperties = {
  width: '100%',
  border: '2px solid',
  borderRadius: '4px',
  padding: '15px 20px',
  fontSize: '17px',
  fontFamily: JUA_FONT,
  fontWeight: '400',
  letterSpacing: '1px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '6px',
  textTransform: 'uppercase',
  transition: 'all 0.25s ease',
};

const artPaneStyle: React.CSSProperties = {
  flex: '0 0 540px',
  width: '540px',
  height: '560px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

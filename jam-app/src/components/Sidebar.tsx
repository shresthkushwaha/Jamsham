'use client';
import React from 'react';
import { LayoutGrid, Sliders, MessageSquare, HelpCircle, Radio } from 'lucide-react';

interface SidebarProps {
  activeTab: 'stage' | 'rack' | 'chat' | 'help';
  onSelectTab: (tab: 'stage' | 'rack' | 'chat' | 'help') => void;
  unreadChatCount?: number;
}

export default function Sidebar({ activeTab, onSelectTab, unreadChatCount = 0 }: SidebarProps) {
  const navItems = [
    { id: 'stage', icon: <LayoutGrid size={18} />, label: 'Stage Grid [*]' },
    { id: 'rack', icon: <Sliders size={18} />, label: 'Instrument Rack [#]' },
    { id: 'chat', icon: <MessageSquare size={18} />, label: 'Band Chat [@]', badge: unreadChatCount },
    { id: 'help', icon: <HelpCircle size={18} />, label: 'Guide & Keys [?]' },
  ];

  return (
    <aside className="skeuo-rack-chassis" style={sidebarContainer}>
      <span className="skeuo-screw" style={{ position: 'absolute', top: 8, left: 22 }} />
      <span className="skeuo-screw" style={{ position: 'absolute', bottom: 8, left: 22 }} />

      <div style={logoIconContainer}>
        <Radio size={20} color="#00E676" style={{ animation: 'pulse 1.5s infinite' }} />
      </div>

      <nav style={navContainer}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as any)}
              className="skeuo-industrial-btn"
              style={{
                ...navBtnStyle,
                background: isActive
                  ? 'linear-gradient(180deg, #2a3c2e 0%, #152418 100%)'
                  : 'linear-gradient(180deg, #2a2a36 0%, #181822 100%)',
                borderColor: isActive ? '#00E676' : 'rgba(255, 255, 255, 0.12)',
                color: isActive ? '#00E676' : '#8b8b9e',
                boxShadow: isActive ? '0 0 12px rgba(0, 230, 118, 0.3)' : 'none',
              }}
              title={item.label}
            >
              {item.icon}
              {!!item.badge && item.badge > 0 && <span style={badgeStyle}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

const sidebarContainer: React.CSSProperties = {
  width: '56px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 0',
  gap: '24px',
  flexShrink: 0,
  margin: '8px 0 8px 8px',
  borderRadius: '10px',
  position: 'relative',
};

const logoIconContainer: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: '#0a0a0f',
  border: '2px solid #222230',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
};

const navContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const navBtnStyle: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-3px',
  right: '-3px',
  background: '#FF5252',
  color: '#fff',
  fontSize: '9px',
  fontWeight: 'bold',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #fff',
};

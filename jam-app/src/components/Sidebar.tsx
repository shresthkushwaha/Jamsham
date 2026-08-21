'use client';
import React from 'react';
import { LayoutGrid, Sliders, MessageSquare, HelpCircle, Music } from 'lucide-react';

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
    <aside style={sidebarContainer}>
      <div style={logoIconContainer}>
        <Music size={20} color="#00E676" />
      </div>

      <nav style={navContainer}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as any)}
              style={{
                ...navBtnStyle,
                background: isActive ? 'rgba(0, 230, 118, 0.15)' : 'transparent',
                borderColor: isActive ? '#00E676' : 'transparent',
                color: isActive ? '#00E676' : '#8b8b9e',
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
  background: '#0d0d14',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 0',
  gap: '24px',
  flexShrink: 0,
};

const logoIconContainer: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'rgba(0, 230, 118, 0.1)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  borderRadius: '10px',
  border: '1px solid transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  outline: 'none',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-2px',
  right: '-2px',
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
};

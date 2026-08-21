'use client';
import React, { useState } from 'react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: string;
  role: string;
  text: string;
  time: string;
  color: string;
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'Sarah', role: 'BASS', text: "Let's drop the beat on 4!", time: '16:04', color: '#ff0077' },
    { sender: 'Alex', role: 'PAD', text: "Got it, I'll bring in the melody right after.", time: '16:05', color: '#9d4edd' },
    { sender: 'Mike', role: 'LEAD', text: 'Filter sounds super clean on this groove 🔥', time: '16:07', color: '#ffaa00' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'You (Host)',
        role: 'DRUMS',
        text: inputText,
        time: timeStr,
        color: '#00f0ff'
      }
    ]);
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="glass-panel" style={drawerContainerStyle}>
      {/* Header */}
      <div style={drawerHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💬</span>
          <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Session Chat</h3>
          <span style={activePillStyle}>4 ONLINE</span>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>✕</button>
      </div>

      {/* Messages List */}
      <div style={messageListStyle}>
        {messages.map((msg, i) => (
          <div key={i} style={messageItemStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontWeight: 700, fontSize: '12px', color: msg.color }}>
                {msg.sender} <span style={roleBadgeMiniStyle}>{msg.role}</span>
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{msg.time}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={inputFormStyle}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message or cue..."
          style={inputFieldStyle}
        />
        <button type="submit" style={sendBtnStyle}>
          SEND
        </button>
      </form>
    </div>
  );
}

const drawerContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '60px',
  right: '20px',
  bottom: '140px',
  width: '320px',
  borderRadius: '16px',
  background: 'rgba(15, 18, 26, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 60,
  overflow: 'hidden'
};

const drawerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
};

const activePillStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(0, 255, 136, 0.15)',
  color: 'var(--accent-green)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '14px'
};

const messageListStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const messageItemStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.04)'
};

const roleBadgeMiniStyle: React.CSSProperties = {
  fontSize: '9px',
  padding: '1px 4px',
  borderRadius: '3px',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'var(--text-secondary)',
  marginLeft: '4px'
};

const inputFormStyle: React.CSSProperties = {
  padding: '10px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  gap: '8px'
};

const inputFieldStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  outline: 'none'
};

const sendBtnStyle: React.CSSProperties = {
  background: 'var(--accent-cyan)',
  color: '#000',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '8px',
  fontWeight: 800,
  fontSize: '11px',
  cursor: 'pointer'
};

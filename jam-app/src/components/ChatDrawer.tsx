'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '@/lib/webrtcManager';
import { Send, MessageSquare, X } from 'lucide-react';

interface ChatDrawerProps {
  messages: ChatMessage[];
  users: User[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatDrawer({ messages, users, onSendMessage, isOpen, onToggle }: ChatDrawerProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getUserColor = (socketId: string) => {
    const user = users.find((u) => u.socketId === socketId);
    return user?.instrument?.color || '#00E676';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={onToggle}
        style={{
          ...floatingChatBtn,
          background: isOpen ? '#00E676' : 'rgba(18, 18, 26, 0.9)',
          color: isOpen ? '#000' : '#fff',
        }}
        title="Toggle Stage Chat"
      >
        <MessageSquare size={18} />
        {messages.length > 0 && !isOpen && <span style={unreadBadge}>{messages.length}</span>}
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div style={drawerContainer}>
          <div style={drawerHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="#00E676" />
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>Stage Chat</span>
            </div>
            <button onClick={onToggle} style={closeBtn}>
              <X size={16} color="#aaa" />
            </button>
          </div>

          <div style={messageList}>
            {messages.length === 0 ? (
              <div style={emptyChat}>
                <span>No messages yet. Say hello to your bandmates! 👋</span>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={messageRow}>
                  <div style={messageSenderRow}>
                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: getUserColor(m.socketId) }}>
                      {m.userName}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={messageBubble}>{m.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={inputContainer}>
            <input
              type="text"
              placeholder="Type message (e.g. drop the beat!)..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={sendBtnStyle}>
              <Send size={15} color="#000" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const floatingChatBtn: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 1000,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
};

const unreadBadge: React.CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: '#FF5252',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 'bold',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const drawerContainer: React.CSSProperties = {
  position: 'fixed',
  bottom: '84px',
  right: '24px',
  width: '320px',
  height: '420px',
  background: 'rgba(18, 18, 26, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  overflow: 'hidden',
};

const drawerHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.2)',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const messageList: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const emptyChat: React.CSSProperties = {
  textAlign: 'center',
  color: '#777',
  fontSize: '12px',
  marginTop: '40px',
};

const messageRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const messageSenderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const messageBubble: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  padding: '8px 12px',
  borderRadius: '8px',
  color: '#eee',
  fontSize: '13px',
};

const inputContainer: React.CSSProperties = {
  display: 'flex',
  padding: '10px 12px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  gap: '8px',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#fff',
  fontSize: '12px',
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  background: '#00E676',
  border: 'none',
  borderRadius: '8px',
  padding: '0 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

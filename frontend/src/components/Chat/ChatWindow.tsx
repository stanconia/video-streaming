import React, { useState, useRef, useEffect } from 'react';
import { SignalingClient } from '../../services/signaling/SignalingClient';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';

interface ChatWindowProps {
  roomId: string;
  userId: string;
  userRole: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  roomId,
  userId,
  userRole,
  signalingClient,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, isConnected, error, clearError } = useChat({
    roomId,
    userId,
    userRole,
    signalingClient,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    await sendMessage(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Chat</span>
        <span style={isConnected ? styles.statusConnected : styles.statusDisconnected}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {error && (
        <div style={styles.error} onClick={clearError}>
          {error} (click to dismiss)
        </div>
      )}

      <div ref={messageListRef} style={styles.messageList}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          disabled={!isConnected}
          style={styles.input}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputValue.trim()}
          style={{
            ...styles.sendButton,
            opacity: !isConnected || !inputValue.trim() ? 0.6 : 1,
            cursor: !isConnected || !inputValue.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  statusConnected: {
    fontSize: '12px',
    color: '#28a745',
  },
  statusDisconnected: {
    fontSize: '12px',
    color: '#dc3545',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: '50px',
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    borderTop: '1px solid #dee2e6',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  error: {
    padding: '8px 16px',
    backgroundColor: '#fee',
    color: '#dc3545',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

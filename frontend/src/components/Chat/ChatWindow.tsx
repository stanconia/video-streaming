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
  const [aiMode, setAiMode] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages, sendMessage, sendAiMessage, requestSummary,
    sessionSummary, isAiThinking, isSummaryGenerating,
    isConnected, error, clearError,
  } = useChat({ roomId, userId, userRole, signalingClient });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect @ai prefix as user types
  useEffect(() => {
    if (inputValue.toLowerCase().startsWith('@ai ')) {
      setAiMode(true);
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    if (aiMode) {
      const question = inputValue.toLowerCase().startsWith('@ai ')
        ? inputValue.slice(4).trim()
        : inputValue.trim();
      if (question) await sendAiMessage(question);
    } else {
      await sendMessage(inputValue);
    }
    setInputValue('');
    setAiMode(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleAiMode = () => {
    if (!aiMode) {
      setAiMode(true);
      if (!inputValue.toLowerCase().startsWith('@ai ')) {
        setInputValue('@ai ' + inputValue);
      }
    } else {
      setAiMode(false);
      if (inputValue.toLowerCase().startsWith('@ai ')) {
        setInputValue(inputValue.slice(4));
      }
    }
    inputRef.current?.focus();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Chat</span>
        <div style={styles.headerRight}>
          {isAiThinking && <span style={styles.aiThinking}>AI thinking...</span>}
          <span style={isConnected ? styles.statusConnected : styles.statusDisconnected}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div style={styles.error} onClick={clearError}>
          {error} (click to dismiss)
        </div>
      )}

      <div ref={messageListRef} style={styles.messageList}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4v1a1 1 0 001 1h1a4 4 0 010 8h-1a1 1 0 00-1 1v1a4 4 0 01-8 0v-1a1 1 0 00-1-1H6a4 4 0 010-8h1a1 1 0 001-1V6a4 4 0 014-4z"/>
              </svg>
            </div>
            <p>Start chatting or type <strong>@ai</strong> to ask the AI assistant</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Session Summary */}
      {sessionSummary && (
        <div style={styles.summaryBanner}>
          <div style={styles.summaryTitle}>AI Session Summary</div>
          <div style={styles.summaryContent}>{sessionSummary}</div>
        </div>
      )}

      {/* Summary button (broadcaster only) */}
      {userRole === 'broadcaster' && messages.length > 0 && (
        <button
          onClick={requestSummary}
          disabled={isSummaryGenerating}
          style={styles.summaryButton}
        >
          {isSummaryGenerating ? 'Generating...' : 'Generate AI Summary'}
        </button>
      )}

      <form onSubmit={handleSubmit} style={styles.inputArea}>
        <button
          type="button"
          onClick={toggleAiMode}
          style={aiMode ? styles.aiButtonActive : styles.aiButton}
          title="Ask AI Assistant"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 014 4v1a1 1 0 001 1h1a4 4 0 010 8h-1a1 1 0 00-1 1v1a4 4 0 01-8 0v-1a1 1 0 00-1-1H6a4 4 0 010-8h1a1 1 0 001-1V6a4 4 0 014-4z"/>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !isConnected ? 'Connecting...'
              : aiMode ? 'Ask the AI assistant...'
              : 'Type a message... (@ai to ask AI)'
          }
          disabled={!isConnected}
          style={{
            ...styles.input,
            ...(aiMode ? styles.inputAiMode : {}),
          }}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputValue.trim() || isAiThinking}
          style={{
            ...styles.sendButton,
            ...(aiMode ? styles.sendButtonAi : {}),
            opacity: !isConnected || !inputValue.trim() || isAiThinking ? 0.6 : 1,
            cursor: !isConnected || !inputValue.trim() || isAiThinking ? 'not-allowed' : 'pointer',
          }}
        >
          {aiMode ? 'Ask' : 'Send'}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '400px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  headerTitle: { fontWeight: 'bold', fontSize: '14px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  aiThinking: {
    fontSize: '11px',
    color: '#8b5cf6',
    fontWeight: 600,
    animation: 'pulse 1.5s infinite',
  },
  statusConnected: { fontSize: '11px', color: '#28a745' },
  statusDisconnected: { fontSize: '11px', color: '#dc3545' },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: '40px',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f3f0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputArea: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #dee2e6',
    gap: '6px',
    alignItems: 'center',
  },
  aiButton: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '1px solid #dee2e6',
    backgroundColor: '#fff',
    color: '#6c757d',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiButtonActive: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '1px solid #8b5cf6',
    backgroundColor: '#f3f0ff',
    color: '#8b5cf6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '20px',
    fontSize: '13px',
    outline: 'none',
  },
  inputAiMode: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf8ff',
  },
  sendButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
    flexShrink: 0,
  },
  sendButtonAi: {
    backgroundColor: '#8b5cf6',
  },
  error: {
    padding: '6px 14px',
    backgroundColor: '#fee',
    color: '#dc3545',
    fontSize: '12px',
    cursor: 'pointer',
  },
  summaryButton: {
    margin: '0 10px 6px',
    padding: '8px 14px',
    backgroundColor: '#f3f0ff',
    color: '#8b5cf6',
    border: '1px solid #e0d4fd',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  summaryBanner: {
    margin: '0 10px 6px',
    padding: '10px 14px',
    backgroundColor: '#f3f0ff',
    border: '1px solid #e0d4fd',
    borderRadius: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  summaryTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: '6px',
  },
  summaryContent: {
    fontSize: '13px',
    color: '#1e1b4b',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
  },
};

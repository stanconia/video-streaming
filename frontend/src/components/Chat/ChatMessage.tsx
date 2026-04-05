import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/live/chat.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isBroadcaster = message.senderRole === 'broadcaster';
  const isAi = message.isAiMessage;

  if (isAi) {
    return (
      <div style={aiContainerStyle}>
        <div style={aiHeaderStyle}>
          <span style={aiIconStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 014 4v1a1 1 0 001 1h1a4 4 0 010 8h-1a1 1 0 00-1 1v1a4 4 0 01-8 0v-1a1 1 0 00-1-1H6a4 4 0 010-8h1a1 1 0 001-1V6a4 4 0 014-4z"/>
            </svg>
          </span>
          <span style={aiNameStyle}>AI Assistant</span>
          {message.isStreaming && <span style={aiStreamingDot} />}
        </div>
        <div style={aiBubbleStyle}>
          {message.content || (message.isStreaming ? '' : 'Thinking...')}
          {message.isStreaming && <span style={cursorStyle}>|</span>}
        </div>
        <div style={aiTimestampStyle}>{formatTime(message.timestamp)}</div>
      </div>
    );
  }

  return (
    <div style={getMessageContainerStyle(message.isOwnMessage)}>
      {!message.isOwnMessage && (
        <div style={getSenderNameStyle(isBroadcaster)}>
          {message.senderName}
          {isBroadcaster && ' (Guide)'}
        </div>
      )}
      <div style={{
        ...getMessageBubbleStyle(message.isOwnMessage),
        ...(message.isAiQuery ? aiQueryBubbleStyle : {}),
      }}>
        {message.content}
      </div>
      <div style={getTimestampStyle(message.isOwnMessage)}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

// --- AI message styles ---
const aiContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  maxWidth: '90%',
  alignSelf: 'flex-start',
};

const aiHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '4px',
  paddingLeft: '4px',
};

const aiIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#8b5cf6',
};

const aiNameStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#8b5cf6',
};

const aiStreamingDot: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#8b5cf6',
  animation: 'pulse 1s infinite',
};

const aiBubbleStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '16px',
  backgroundColor: '#f3f0ff',
  color: '#1e1b4b',
  border: '1px solid #e0d4fd',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  lineHeight: '1.5',
  fontSize: '14px',
};

const cursorStyle: React.CSSProperties = {
  animation: 'pulse 0.8s infinite',
  color: '#8b5cf6',
  fontWeight: 'bold',
};

const aiTimestampStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#adb5bd',
  marginTop: '4px',
  paddingLeft: '4px',
};

const aiQueryBubbleStyle: React.CSSProperties = {
  borderLeft: '3px solid #8b5cf6',
};

// --- Regular message styles ---
const getMessageContainerStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
  maxWidth: '75%',
  alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
});

const getSenderNameStyle = (isBroadcaster: boolean): React.CSSProperties => ({
  fontSize: '12px',
  fontWeight: 'bold',
  color: isBroadcaster ? '#dc3545' : '#6c757d',
  marginBottom: '4px',
  paddingLeft: '4px',
});

const getMessageBubbleStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: '16px',
  backgroundColor: isOwnMessage ? '#0d9488' : '#f1f1f1',
  color: isOwnMessage ? 'white' : '#212529',
  wordBreak: 'break-word',
});

const getTimestampStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  fontSize: '10px',
  color: '#adb5bd',
  marginTop: '4px',
  paddingRight: isOwnMessage ? '4px' : '0',
  paddingLeft: isOwnMessage ? '0' : '4px',
});

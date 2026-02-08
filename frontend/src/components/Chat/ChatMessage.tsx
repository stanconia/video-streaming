import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isBroadcaster = message.senderRole === 'broadcaster';

  return (
    <div style={getMessageContainerStyle(message.isOwnMessage)}>
      {!message.isOwnMessage && (
        <div style={getSenderNameStyle(isBroadcaster)}>
          {message.senderName}
          {isBroadcaster && ' (Broadcaster)'}
        </div>
      )}
      <div style={getMessageBubbleStyle(message.isOwnMessage)}>
        {message.content}
      </div>
      <div style={getTimestampStyle(message.isOwnMessage)}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

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
  backgroundColor: isOwnMessage ? '#007bff' : '#f1f1f1',
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

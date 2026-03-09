import React from 'react';
import { Message } from '../../types/social/messaging.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={getContainerStyle(isOwn)}>
      {!isOwn && (
        <div style={styles.senderName}>{message.senderDisplayName}</div>
      )}
      <div style={getBubbleStyle(isOwn)}>
        {message.content}
      </div>
      <div style={getTimestampStyle(isOwn)}>
        {formatTime(message.createdAt)}
      </div>
    </div>
  );
};

const getContainerStyle = (isOwn: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: isOwn ? 'flex-end' : 'flex-start',
  maxWidth: '75%',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
});

const getBubbleStyle = (isOwn: boolean): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: '16px',
  backgroundColor: isOwn ? '#007bff' : '#e9ecef',
  color: isOwn ? '#ffffff' : '#212529',
  wordBreak: 'break-word',
  fontSize: '14px',
  lineHeight: '1.4',
});

const getTimestampStyle = (isOwn: boolean): React.CSSProperties => ({
  fontSize: '10px',
  color: '#adb5bd',
  marginTop: '4px',
  paddingRight: isOwn ? '4px' : '0',
  paddingLeft: isOwn ? '0' : '4px',
});

const styles: { [key: string]: React.CSSProperties } = {
  senderName: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: '4px',
    paddingLeft: '4px',
  },
};

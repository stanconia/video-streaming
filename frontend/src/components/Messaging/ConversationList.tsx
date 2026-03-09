import React from 'react';
import { Conversation } from '../../types/social/messaging.types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
}) => {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const truncate = (text: string | null, maxLength: number) => {
    if (!text) return 'No messages yet';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (conversations.length === 0) {
    return (
      <div style={styles.emptyState}>
        No conversations yet.
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            style={{
              ...styles.row,
              ...(isSelected ? styles.selectedRow : {}),
            }}
          >
            <div style={styles.avatar}>
              {conv.otherDisplayName.charAt(0).toUpperCase()}
            </div>
            <div style={styles.content}>
              <div style={styles.topLine}>
                <span style={styles.displayName}>{conv.otherDisplayName}</span>
                <span style={styles.time}>{formatTime(conv.lastMessageAt)}</span>
              </div>
              <div style={styles.bottomLine}>
                <span style={styles.preview}>{truncate(conv.lastMessage, 40)}</span>
                {conv.unreadCount > 0 && (
                  <span style={styles.badge}>{conv.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '14px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.15s',
  },
  selectedRow: {
    backgroundColor: '#e7f1ff',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  displayName: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#212529',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  time: {
    fontSize: '11px',
    color: '#999',
    flexShrink: 0,
    marginLeft: '8px',
  },
  bottomLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: '13px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginLeft: '8px',
  },
};

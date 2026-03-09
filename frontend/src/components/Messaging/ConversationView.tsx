import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../types/social/messaging.types';
import { conversationApi } from '../../services/api/social/ConversationApi';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';

interface ConversationViewProps {
  conversationId: string;
  otherUserId: string;
  otherDisplayName: string;
  onBack: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  otherUserId,
  otherDisplayName,
  onBack,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getMessages(conversationId, 0, 50);
      setMessages(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (page + 1 >= totalPages) return;
    try {
      const nextPage = page + 1;
      const data = await conversationApi.getMessages(conversationId, nextPage, 50);
      setMessages((prev) => [...data.content, ...prev]);
      setPage(data.number);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load more messages', err);
    }
  };

  const markAsRead = async () => {
    try {
      await conversationApi.markAsRead(conversationId);
    } catch {
      // Silently fail
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const sent = await conversationApi.sendMessage({
        recipientUserId: otherUserId,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          Back
        </button>
        <span style={styles.headerName}>{otherDisplayName}</span>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading messages...</div>
      ) : (
        <div ref={messageListRef} style={styles.messageList}>
          {page + 1 < totalPages && (
            <button onClick={loadMoreMessages} style={styles.loadMoreButton}>
              Load older messages
            </button>
          )}
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.userId}
              />
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSend} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={styles.input}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            ...styles.sendButton,
            opacity: !newMessage.trim() ? 0.6 : 1,
            cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
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
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  headerName: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#212529',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
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
  loadMoreButton: {
    alignSelf: 'center',
    padding: '6px 16px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '8px',
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
};

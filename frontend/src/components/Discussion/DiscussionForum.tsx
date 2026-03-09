import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DiscussionThread } from '../../types/course/discussion.types';
import { discussionApi } from '../../services/api/course/DiscussionApi';

export const DiscussionForum: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New thread form
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const loadThreads = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await discussionApi.getThreads(courseId);
      // Sort by lastActivityAt descending
      const sorted = [...data].sort(
        (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      );
      setThreads(sorted);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    if (!newTitle.trim()) {
      setError('Thread title is required');
      return;
    }
    if (!newContent.trim()) {
      setError('Thread content is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await discussionApi.createThread(courseId, { title: newTitle.trim(), content: newContent.trim() });
      setNewTitle('');
      setNewContent('');
      setShowNewThread(false);
      loadThreads();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/courses/${courseId}/discussions/${threadId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!courseId) return <div style={styles.error}>Missing course ID</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Discussion Forum</h1>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          style={styles.newThreadButton}
        >
          {showNewThread ? 'Cancel' : '+ New Thread'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* New thread form */}
      {showNewThread && (
        <form onSubmit={handleCreateThread} style={styles.formCard}>
          <h3 style={styles.formTitle}>Start a New Discussion</h3>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Discussion topic..."
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Content *</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share your thoughts, ask a question..."
              rows={5}
              required
              style={styles.textarea}
            />
          </div>
          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Posting...' : 'Post Thread'}
          </button>
        </form>
      )}

      {/* Thread list */}
      {loading ? (
        <div style={styles.loading}>Loading discussions...</div>
      ) : threads.length === 0 ? (
        <div style={styles.empty}>
          No discussions yet. Start the conversation by creating a new thread!
        </div>
      ) : (
        <div style={styles.threadList}>
          {threads.map((thread) => (
            <div
              key={thread.id}
              style={styles.threadCard}
              onClick={() => handleThreadClick(thread.id)}
            >
              <div style={styles.threadContent}>
                <h3 style={styles.threadTitle}>{thread.title}</h3>
                <p style={styles.threadPreview}>
                  {thread.content.length > 150
                    ? thread.content.slice(0, 150) + '...'
                    : thread.content}
                </p>
                <div style={styles.threadMeta}>
                  <span style={styles.authorName}>{thread.authorDisplayName}</span>
                  <span style={styles.separator}>|</span>
                  <span style={styles.dateText}>{formatDate(thread.createdAt)}</span>
                </div>
              </div>
              <div style={styles.threadStats}>
                <div style={styles.replyCount}>
                  <span style={styles.replyNumber}>{thread.replyCount}</span>
                  <span style={styles.replyLabel}>
                    {thread.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
                <div style={styles.lastActivity}>
                  Last activity: {formatDate(thread.lastActivityAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  pageTitle: { margin: 0 },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '15px' },
  newThreadButton: { padding: '10px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  formCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' },
  formTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  submitButton: { padding: '10px 28px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  threadList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  threadCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'box-shadow 0.15s', border: '1px solid transparent' },
  threadContent: { flex: 1, minWidth: 0, marginRight: '20px' },
  threadTitle: { margin: '0 0 6px 0', fontSize: '16px', color: '#007bff' },
  threadPreview: { margin: '0 0 8px 0', fontSize: '14px', color: '#555', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis' },
  threadMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#888' },
  authorName: { fontWeight: 'bold', color: '#555' },
  separator: { color: '#ccc' },
  dateText: {},
  threadStats: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '80px' },
  replyCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '6px' },
  replyNumber: { fontSize: '22px', fontWeight: 'bold', color: '#333' },
  replyLabel: { fontSize: '11px', color: '#888', textTransform: 'uppercase' as const },
  lastActivity: { fontSize: '11px', color: '#aaa', textAlign: 'center' },
};

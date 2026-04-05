import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DiscussionThread, DiscussionReply } from '../../types/course/discussion.types';
import { discussionApi } from '../../services/api/course/DiscussionApi';

export const ThreadView: React.FC = () => {
  const { courseId, threadId } = useParams<{ courseId: string; threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [thread, setThread] = useState<DiscussionThread | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState('');

  const loadThread = useCallback(async () => {
    if (!courseId || !threadId) return;
    try {
      setLoading(true);
      const [threadData, repliesData] = await Promise.all([
        discussionApi.getThread(courseId, threadId),
        discussionApi.getReplies(courseId, threadId),
      ]);
      setThread(threadData);
      setReplies(repliesData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [courseId, threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !threadId) return;
    if (!replyContent.trim()) {
      setError('Reply content is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const newReply = await discussionApi.addReply(courseId, threadId, { content: replyContent.trim() });
      setReplies((prev) => [...prev, newReply]);
      setReplyContent('');
      // Update thread reply count locally
      if (thread) {
        setThread({ ...thread, replyCount: thread.replyCount + 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!courseId) return;
    try {
      setError(null);
      await discussionApi.deleteReply(courseId, replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      if (thread) {
        setThread({ ...thread, replyCount: Math.max(0, thread.replyCount - 1) });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete reply');
    }
  };

  const handleDeleteThread = async () => {
    if (!courseId || !threadId) return;
    try {
      setError(null);
      await discussionApi.deleteThread(courseId, threadId);
      navigate(`/courses/${courseId}/discussions`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete thread');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const isOwnThread = thread && user && thread.authorUserId === user.userId;

  if (!courseId || !threadId) return <div style={styles.error}>Missing course or thread ID</div>;

  if (loading) return <div style={styles.loading}>Loading discussion...</div>;

  if (!thread) return <div style={styles.error}>Thread not found</div>;

  return (
    <div style={styles.container}>
      {/* Back navigation */}
      <button
        onClick={() => navigate(`/courses/${courseId}/discussions`)}
        style={styles.backButton}
      >
        Back to Discussions
      </button>

      {error && <div style={styles.error}>{error}</div>}

      {/* Thread header */}
      <div style={styles.threadCard}>
        <div style={styles.threadHeader}>
          <h1 style={styles.threadTitle}>{thread.title}</h1>
          {isOwnThread && (
            <button onClick={handleDeleteThread} style={styles.deleteButton}>
              Delete Thread
            </button>
          )}
        </div>
        <div style={styles.threadMeta}>
          <span style={styles.authorBadge}>{thread.authorDisplayName}</span>
          <span style={styles.dateText}>{formatDate(thread.createdAt)}</span>
        </div>
        <div style={styles.threadBody}>
          <p style={styles.threadContent}>{thread.content}</p>
        </div>
      </div>

      {/* Replies section */}
      <div style={styles.repliesSection}>
        <h2 style={styles.repliesTitle}>
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div style={styles.noReplies}>
            No replies yet. Be the first to respond!
          </div>
        ) : (
          <div style={styles.replyList}>
            {replies.map((reply) => {
              const isOwnReply = user && reply.authorUserId === user.userId;
              return (
                <div key={reply.id} style={styles.replyCard}>
                  <div style={styles.replyHeader}>
                    <div style={styles.replyAuthorRow}>
                      <span style={styles.replyAuthor}>{reply.authorDisplayName}</span>
                      <span style={styles.replyDate}>{formatDate(reply.createdAt)}</span>
                    </div>
                    {isOwnReply && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        style={styles.deleteSmall}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p style={styles.replyContent}>{reply.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply form */}
      <div style={styles.replyFormSection}>
        <h3 style={styles.replyFormTitle}>Post a Reply</h3>
        <form onSubmit={handleAddReply}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            required
            style={styles.textarea}
          />
          <button
            type="submit"
            disabled={submitting || !replyContent.trim()}
            style={
              submitting || !replyContent.trim()
                ? styles.submitButtonDisabled
                : styles.submitButton
            }
          >
            {submitting ? 'Posting...' : 'Post Reply'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  backButton: { padding: '8px 16px', backgroundColor: 'transparent', color: '#0d9488', border: '1px solid #0d9488', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  threadCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' },
  threadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  threadTitle: { margin: 0, fontSize: '24px', flex: 1 },
  threadMeta: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  authorBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#e8f0fe', color: '#1a73e8' },
  dateText: { fontSize: '13px', color: '#888' },
  threadBody: { borderTop: '1px solid #eee', paddingTop: '16px' },
  threadContent: { margin: 0, fontSize: '15px', lineHeight: '1.7', color: '#333', whiteSpace: 'pre-wrap' as const },
  deleteButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 },
  repliesSection: { marginBottom: '24px' },
  repliesTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  noReplies: { textAlign: 'center', padding: '24px', color: '#888', fontSize: '14px', backgroundColor: '#f8f9fa', borderRadius: '6px' },
  replyList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  replyCard: { backgroundColor: 'white', borderRadius: '8px', padding: '16px 20px', border: '1px solid #e9ecef' },
  replyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  replyAuthorRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  replyAuthor: { fontWeight: 'bold', fontSize: '14px', color: '#333' },
  replyDate: { fontSize: '12px', color: '#aaa' },
  replyContent: { margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' as const },
  deleteSmall: { padding: '4px 10px', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  replyFormSection: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  replyFormTitle: { margin: '0 0 12px 0', fontSize: '16px' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const, marginBottom: '12px' },
  submitButton: { padding: '10px 28px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  submitButtonDisabled: { padding: '10px 28px', backgroundColor: '#dee2e6', color: '#adb5bd', border: 'none', borderRadius: '4px', cursor: 'default', fontSize: '15px', fontWeight: 'bold' },
};

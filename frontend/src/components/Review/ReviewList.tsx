import React, { useState } from 'react';
import { Review } from '../../types/social/teacher.types';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { useAuth } from '../../context/AuthContext';

interface ReviewListProps {
  reviews: Review[];
  teacherUserId?: string;
  onReviewUpdated?: () => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews, teacherUserId, onReviewUpdated }) => {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ffc107' : '#ddd', fontSize: '16px' }}>
          *
        </span>
      );
    }
    return stars;
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await teacherApi.replyToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      onReviewUpdated?.();
    } catch {
      // Silently fail
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await teacherApi.markHelpful(reviewId);
      onReviewUpdated?.();
    } catch {
      // Silently fail
    }
  };

  const isTeacherOwner = user?.userId === teacherUserId && user?.role === 'TEACHER';

  if (reviews.length === 0) {
    return <p style={styles.empty}>No reviews yet.</p>;
  }

  return (
    <div style={styles.list}>
      {reviews.map((review) => (
        <div key={review.id} style={styles.reviewCard}>
          <div style={styles.reviewHeader}>
            <span style={styles.studentName}>{review.studentDisplayName}</span>
            <span style={styles.date}>{formatDate(review.createdAt)}</span>
          </div>
          <div style={styles.stars}>{renderStars(review.rating)}</div>
          {review.comment && <p style={styles.comment}>{review.comment}</p>}

          {review.teacherReply && (
            <div style={styles.replyBox}>
              <span style={styles.replyLabel}>Mind Pro reply:</span>
              <p style={styles.replyText}>{review.teacherReply}</p>
            </div>
          )}

          <div style={styles.actions}>
            <button onClick={() => handleHelpful(review.id)} style={styles.helpfulButton}>
              Helpful ({review.helpfulCount})
            </button>
            {isTeacherOwner && !review.teacherReply && (
              <button onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)} style={styles.replyButton}>
                Reply
              </button>
            )}
          </div>

          {replyingTo === review.id && (
            <div style={styles.replyForm}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                style={styles.replyTextarea}
                rows={3}
              />
              <div style={styles.replyActions}>
                <button onClick={() => handleReply(review.id)} style={styles.submitReply}>Submit Reply</button>
                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={styles.cancelReply}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { color: '#666', textAlign: 'center', padding: '20px' },
  reviewCard: { padding: '16px', border: '1px solid #eee', borderRadius: '8px' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  studentName: { fontWeight: 'bold', fontSize: '14px' },
  date: { color: '#999', fontSize: '12px' },
  stars: { marginBottom: '8px' },
  comment: { color: '#333', fontSize: '14px', lineHeight: '1.5', margin: '0 0 8px 0' },
  replyBox: { backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginTop: '8px', borderLeft: '3px solid #007bff' },
  replyLabel: { fontWeight: 'bold', fontSize: '12px', color: '#007bff' },
  replyText: { margin: '4px 0 0 0', fontSize: '14px', color: '#333' },
  actions: { display: 'flex', gap: '8px', marginTop: '8px' },
  helpfulButton: { background: 'none', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: '#666' },
  replyButton: { background: 'none', border: '1px solid #007bff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: '#007bff' },
  replyForm: { marginTop: '12px' },
  replyTextarea: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  replyActions: { display: 'flex', gap: '8px', marginTop: '8px' },
  submitReply: { padding: '6px 14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  cancelReply: { padding: '6px 14px', backgroundColor: '#e9ecef', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};

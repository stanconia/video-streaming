import React, { useState } from 'react';
import { teacherApi } from '../../services/api/social/TeacherApi';

interface ReviewFormProps {
  teacherId: string;
  classId?: string;
  onReviewCreated: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ teacherId, classId, onReviewCreated }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewClassId, setReviewClassId] = useState(classId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!reviewClassId) {
      setError('Class ID is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await teacherApi.createReview(teacherId, { classId: reviewClassId, rating, comment });
      setSuccess(true);
      setRating(0);
      setComment('');
      onReviewCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <div style={styles.success}>Review submitted successfully!</div>;
  }

  return (
    <div style={styles.formContainer}>
      <h3>Leave a Review</h3>
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                ...styles.star,
                color: star <= (hoverRating || rating) ? '#ffc107' : '#ddd',
              }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              *
            </span>
          ))}
        </div>

        {!classId && (
          <input
            type="text"
            placeholder="Class ID"
            value={reviewClassId}
            onChange={(e) => setReviewClassId(e.target.value)}
            style={styles.input}
          />
        )}

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={styles.textarea}
          rows={3}
        />

        <button type="submit" disabled={submitting} style={styles.submitButton}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  formContainer: { padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' },
  error: { color: '#721c24', padding: '8px 12px', marginBottom: '12px', backgroundColor: '#f8d7da', borderRadius: '4px', fontSize: '14px' },
  success: { color: '#155724', padding: '12px', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '20px' },
  starsRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  star: { fontSize: '28px', cursor: 'pointer', userSelect: 'none' as const },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' as const },
  submitButton: { padding: '8px 24px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
};

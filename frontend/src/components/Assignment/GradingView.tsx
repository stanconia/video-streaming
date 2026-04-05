import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Assignment, AssignmentSubmission } from '../../types/course/assignment.types';
import { assignmentApi } from '../../services/api/course/AssignmentApi';

export const GradingView: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

  // Grade form state per submission
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!courseId || !assignmentId) return;
    try {
      setLoading(true);
      const [submissionsData] = await Promise.all([
        assignmentApi.getSubmissions(courseId, assignmentId),
      ]);
      setSubmissions(submissionsData);

      // Try to load assignment details
      try {
        const assignmentsData = await assignmentApi.getAssignments(courseId, '');
        const found = assignmentsData.find((a) => a.id === assignmentId);
        if (found) setAssignment(found);
      } catch {
        // assignment meta is best-effort
      }

      // Initialize input values from existing grades
      const scores: Record<string, string> = {};
      const feedbacks: Record<string, string> = {};
      submissionsData.forEach((sub) => {
        scores[sub.id] = sub.score !== null ? String(sub.score) : '';
        feedbacks[sub.id] = sub.feedback || '';
      });
      setScoreInputs(scores);
      setFeedbackInputs(feedbacks);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [courseId, assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrade = async (submissionId: string) => {
    if (!courseId || !assignmentId) return;
    const scoreStr = scoreInputs[submissionId];
    if (!scoreStr || isNaN(Number(scoreStr))) {
      setError('Please enter a valid score');
      return;
    }
    const score = parseFloat(scoreStr);
    if (assignment && score > assignment.maxScore) {
      setError(`Score cannot exceed max score of ${assignment.maxScore}`);
      return;
    }
    try {
      setGradingSubmitting(true);
      setGradingId(submissionId);
      setError(null);
      const feedback = feedbackInputs[submissionId] || '';
      const updated = await assignmentApi.gradeSubmission(courseId, submissionId, {
        score,
        feedback: feedback.trim() || undefined,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? updated : s))
      );
      setGradingId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grade submission');
    } finally {
      setGradingSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  if (!courseId || !assignmentId) return <div style={styles.error}>Missing course or assignment ID</div>;

  if (loading) return <div style={styles.loading}>Loading submissions...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>
        Grade: {assignment?.title || 'Assignment'}
      </h1>
      {assignment && (
        <div style={styles.assignmentMeta}>
          <span>Max Score: {assignment.maxScore}</span>
          <span>Total Submissions: {submissions.length}</span>
          <span>Graded: {submissions.filter((s) => s.gradedAt).length}</span>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {submissions.length === 0 ? (
        <div style={styles.empty}>No submissions yet.</div>
      ) : (
        <div style={styles.submissionList}>
          {submissions.map((sub) => (
            <div key={sub.id} style={styles.submissionCard}>
              <div style={styles.submissionHeader}>
                <div>
                  <span style={styles.studentName}>{sub.studentDisplayName}</span>
                  <span style={styles.submittedDate}>
                    Submitted: {formatDate(sub.submittedAt)}
                  </span>
                </div>
                {sub.gradedAt && (
                  <span style={styles.gradedBadge}>Graded</span>
                )}
              </div>

              {/* Submission content */}
              <div style={styles.contentBox}>
                <p style={styles.contentText}>{sub.content}</p>
              </div>

              {/* File attachment */}
              {sub.fileUrl && (
                <div style={styles.fileRow}>
                  <span style={styles.fileLabel}>File:</span>
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.fileLink}
                  >
                    {sub.fileName || 'Download'}
                  </a>
                </div>
              )}

              {/* Grading form */}
              <div style={styles.gradeForm}>
                <div style={styles.gradeRow}>
                  <div style={styles.scoreField}>
                    <label style={styles.gradeLabel}>Score</label>
                    <input
                      type="number"
                      min="0"
                      max={assignment?.maxScore}
                      value={scoreInputs[sub.id] || ''}
                      onChange={(e) =>
                        setScoreInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))
                      }
                      placeholder={`0 - ${assignment?.maxScore || 100}`}
                      style={styles.scoreInput}
                    />
                  </div>
                  <div style={styles.feedbackField}>
                    <label style={styles.gradeLabel}>Feedback</label>
                    <textarea
                      value={feedbackInputs[sub.id] || ''}
                      onChange={(e) =>
                        setFeedbackInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))
                      }
                      placeholder="Optional feedback for the student..."
                      rows={2}
                      style={styles.feedbackTextarea}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleGrade(sub.id)}
                  disabled={gradingSubmitting && gradingId === sub.id}
                  style={
                    gradingSubmitting && gradingId === sub.id
                      ? styles.gradeButtonDisabled
                      : styles.gradeButton
                  }
                >
                  {gradingSubmitting && gradingId === sub.id
                    ? 'Grading...'
                    : sub.gradedAt
                    ? 'Update Grade'
                    : 'Grade'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  pageTitle: { marginBottom: '8px' },
  assignmentMeta: { display: 'flex', gap: '24px', marginBottom: '20px', fontSize: '14px', color: '#555' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '14px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  submissionList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  submissionCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  submissionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  studentName: { fontWeight: 'bold', fontSize: '16px', color: '#333', marginRight: '16px' },
  submittedDate: { fontSize: '13px', color: '#888' },
  gradedBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#d4edda', color: '#155724' },
  contentBox: { backgroundColor: '#f8f9fa', borderRadius: '6px', padding: '16px', marginBottom: '12px' },
  contentText: { margin: 0, fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const },
  fileRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  fileLabel: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
  fileLink: { color: '#0d9488', fontSize: '14px' },
  gradeForm: { borderTop: '1px solid #eee', paddingTop: '16px' },
  gradeRow: { display: 'flex', gap: '16px', marginBottom: '12px' },
  scoreField: { width: '120px', flexShrink: 0 },
  feedbackField: { flex: 1 },
  gradeLabel: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '13px' },
  scoreInput: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  feedbackTextarea: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  gradeButton: { padding: '10px 28px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  gradeButtonDisabled: { padding: '10px 28px', backgroundColor: '#dee2e6', color: '#adb5bd', border: 'none', borderRadius: '4px', cursor: 'default', fontSize: '14px', fontWeight: 'bold' },
};

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Assignment, AssignmentSubmission } from '../../types/course/assignment.types';
import { assignmentApi } from '../../services/api/course/AssignmentApi';

export const AssignmentView: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Submission form state
  const [content, setContent] = useState('');
  const [fileKey, setFileKey] = useState('');

  const isStudent = user?.role === 'STUDENT';

  const loadData = useCallback(async () => {
    if (!courseId || !assignmentId) return;
    try {
      setLoading(true);
      const assignmentData = await assignmentApi.getAssignments(courseId, '');
      const found = assignmentData.find((a) => a.id === assignmentId);
      if (found) setAssignment(found);

      if (isStudent) {
        try {
          const sub = await assignmentApi.getMySubmission(courseId, assignmentId);
          setSubmission(sub);
        } catch {
          setSubmission(null);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [courseId, assignmentId, isStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !assignmentId) return;
    if (!content.trim()) {
      setError('Submission content is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const sub = await assignmentApi.submitAssignment(courseId, assignmentId, {
        content: content.trim(),
        fileUrl: fileKey.trim() || undefined,
        fileName: fileKey.trim() ? fileKey.trim().split('/').pop() : undefined,
      });
      setSubmission(sub);
      setContent('');
      setFileKey('');
      setSuccess('Assignment submitted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleString();
  };

  const isOverdue = assignment?.dueDate ? new Date(assignment.dueDate) < new Date() : false;

  if (!courseId || !assignmentId) return <div style={styles.error}>Missing course or assignment ID</div>;

  if (loading) return <div style={styles.loading}>Loading assignment...</div>;

  return (
    <div style={styles.container}>
      {/* Assignment details */}
      {assignment ? (
        <div style={styles.detailCard}>
          <h1 style={styles.pageTitle}>{assignment.title}</h1>
          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Due Date</span>
              <span style={{
                ...styles.metaValue,
                color: isOverdue ? '#dc3545' : '#333',
              }}>
                {formatDate(assignment.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Max Score</span>
              <span style={styles.metaValue}>{assignment.maxScore}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Submissions</span>
              <span style={styles.metaValue}>{assignment.submissionCount}</span>
            </div>
          </div>
          {assignment.description && (
            <div style={styles.descriptionBox}>
              <h3 style={styles.descriptionTitle}>Description</h3>
              <p style={styles.descriptionText}>{assignment.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.error}>Assignment not found</div>
      )}

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Student: show existing submission or submission form */}
      {isStudent && (
        <div style={styles.section}>
          {submission ? (
            <div>
              <h2 style={styles.sectionTitle}>Your Submission</h2>
              <div style={styles.submissionCard}>
                <div style={styles.submissionContent}>
                  <p style={styles.submissionText}>{submission.content}</p>
                </div>
                {submission.fileUrl && (
                  <div style={styles.fileRow}>
                    <span style={styles.fileLabel}>Attached File:</span>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      {submission.fileName || 'Download'}
                    </a>
                  </div>
                )}
                <div style={styles.submissionMeta}>
                  <span>Submitted: {formatDate(submission.submittedAt)}</span>
                </div>

                {/* Grade/feedback section */}
                {submission.gradedAt ? (
                  <div style={styles.gradeBox}>
                    <h3 style={styles.gradeTitle}>Grade & Feedback</h3>
                    <div style={styles.gradeRow}>
                      <span style={styles.gradeLabel}>Score:</span>
                      <span style={styles.gradeValue}>
                        {submission.score} / {assignment?.maxScore || '?'}
                      </span>
                    </div>
                    {submission.feedback && (
                      <div style={styles.feedbackBox}>
                        <span style={styles.feedbackLabel}>Feedback:</span>
                        <p style={styles.feedbackText}>{submission.feedback}</p>
                      </div>
                    )}
                    <div style={styles.gradedDate}>
                      Graded on: {formatDate(submission.gradedAt)}
                    </div>
                  </div>
                ) : (
                  <div style={styles.pendingGrade}>
                    Awaiting grading...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 style={styles.sectionTitle}>Submit Your Work</h2>
              <form onSubmit={handleSubmit} style={styles.formCard}>
                <div style={styles.field}>
                  <label style={styles.label}>Content *</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your submission content..."
                    rows={8}
                    required
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>File Attachment (optional)</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFileKey(file.name);
                    }}
                    style={styles.fileInput}
                  />
                  {fileKey && (
                    <span style={styles.fileNameDisplay}>{fileKey}</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={submitting ? styles.submitButtonDisabled : styles.submitButton}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  pageTitle: { marginBottom: '16px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  success: { color: '#155724', padding: '12px', marginBottom: '16px', backgroundColor: '#d4edda', borderRadius: '4px' },
  detailCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' },
  metaRow: { display: 'flex', gap: '32px', marginBottom: '20px', flexWrap: 'wrap' as const },
  metaItem: { display: 'flex', flexDirection: 'column' },
  metaLabel: { fontSize: '12px', color: '#888', textTransform: 'uppercase' as const, fontWeight: 'bold', marginBottom: '4px' },
  metaValue: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
  descriptionBox: { borderTop: '1px solid #eee', paddingTop: '16px' },
  descriptionTitle: { margin: '0 0 8px 0', fontSize: '15px', color: '#555' },
  descriptionText: { margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' as const },
  section: { marginBottom: '24px' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  submissionCard: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #dee2e6' },
  submissionContent: { marginBottom: '12px' },
  submissionText: { margin: 0, fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const },
  fileRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  fileLabel: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
  fileLink: { color: '#0d9488', fontSize: '14px' },
  submissionMeta: { fontSize: '13px', color: '#888', marginBottom: '16px' },
  gradeBox: { backgroundColor: '#f0f9ff', borderRadius: '6px', padding: '16px', border: '1px solid #bee5eb' },
  gradeTitle: { margin: '0 0 10px 0', fontSize: '15px', color: '#0c5460' },
  gradeRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  gradeLabel: { fontWeight: 'bold', color: '#555' },
  gradeValue: { fontWeight: 'bold', fontSize: '18px', color: '#28a745' },
  feedbackBox: { marginTop: '10px' },
  feedbackLabel: { fontWeight: 'bold', fontSize: '14px', color: '#555' },
  feedbackText: { margin: '4px 0 0', fontSize: '14px', lineHeight: '1.5', color: '#333' },
  gradedDate: { marginTop: '10px', fontSize: '12px', color: '#888' },
  pendingGrade: { padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', color: '#856404', fontSize: '14px', textAlign: 'center' },
  formCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #dee2e6' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  fileInput: { fontSize: '14px' },
  fileNameDisplay: { display: 'block', marginTop: '6px', fontSize: '13px', color: '#555' },
  submitButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  submitButtonDisabled: { padding: '12px 32px', backgroundColor: '#dee2e6', color: '#adb5bd', border: 'none', borderRadius: '4px', cursor: 'default', fontSize: '16px', fontWeight: 'bold' },
};

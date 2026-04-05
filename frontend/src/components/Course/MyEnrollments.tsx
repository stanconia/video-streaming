import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseEnrollment } from '../../types/course/enrollment.types';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { useAuth } from '../../context/AuthContext';

export const MyEnrollments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getMyEnrollments();
      setEnrollments(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (enrollment: CourseEnrollment, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setCancelling(enrollment.id);
      await enrollmentApi.cancel(enrollment.courseId, enrollment.id);
      setEnrollments(prev => prev.filter(en => en.id !== enrollment.id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel enrollment');
    } finally {
      setCancelling(null);
    }
  };

  const getDisplayStatus = (enrollment: CourseEnrollment): { label: string; bg: string; text: string } => {
    if (enrollment.status === 'ACTIVE') {
      const enrolledDate = new Date(enrollment.enrolledAt);
      const now = new Date();
      const daysSinceEnrollment = (now.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrollment > 30 && enrollment.progressPercentage < 100) {
        return { label: 'PAST DUE', bg: '#fff3cd', text: '#856404' };
      }
      return { label: 'ACTIVE', bg: '#d4edda', text: '#155724' };
    }
    const colors: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: '#cce5ff', text: '#004085' },
      CANCELLED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colors[enrollment.status] || { bg: '#e2e3e5', text: '#383d41' };
    return { label: enrollment.status, ...color };
  };

  const getStatusBadge = (enrollment: CourseEnrollment) => {
    const { label, bg, text } = getDisplayStatus(enrollment);
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: bg,
          color: text,
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>My Enrollments</h1>
      <p style={styles.subtitle}>Track your enrolled courses and learning progress</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading enrollments...</div>
      ) : enrollments.length === 0 ? (
        <div style={styles.empty}>
          <p>You haven't enrolled in any courses yet.</p>
          <button onClick={() => navigate('/courses')} style={styles.browseButton}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              style={styles.card}
              onClick={() => navigate(`/courses/${enrollment.courseId}/learn`)}
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{enrollment.courseTitle}</h3>
                {getStatusBadge(enrollment)}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.progressSection}>
                  <div style={styles.progressLabel}>
                    <span>Progress</span>
                    <span style={styles.progressPercent}>
                      {Math.round(enrollment.progressPercentage)}%
                    </span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${enrollment.progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>
                <div style={styles.details}>
                  <div style={styles.detail}>
                    <span style={styles.label}>Enrolled:</span>
                    <span>{new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                  </div>
                  {enrollment.paidAmount > 0 && (
                    <div style={styles.detail}>
                      <span style={styles.label}>Paid:</span>
                      <span>${(enrollment.paidAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {enrollment.completedAt && (
                    <div style={styles.detail}>
                      <span style={styles.label}>Completed:</span>
                      <span>
                        {new Date(enrollment.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {enrollment.status === 'ACTIVE' && (
                  <button
                    onClick={(e) => handleCancel(enrollment, e)}
                    disabled={cancelling === enrollment.id}
                    style={styles.cancelButton}
                  >
                    {cancelling === enrollment.id ? 'Cancelling...' : 'Unenroll'}
                  </button>
                )}
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
  pageTitle: { marginBottom: '4px' },
  subtitle: { color: '#666', marginBottom: '24px' },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  browseButton: {
    padding: '10px 24px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  courseTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold' },
  cardBody: { padding: '16px' },
  progressSection: { marginBottom: '14px' },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#555',
    marginBottom: '6px',
  },
  progressPercent: { fontWeight: 'bold', color: '#0d9488' },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  details: { display: 'flex', flexDirection: 'column', gap: '6px' },
  detail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  label: { color: '#666', fontWeight: 'bold' },
  cancelButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    width: '100%',
  },
};

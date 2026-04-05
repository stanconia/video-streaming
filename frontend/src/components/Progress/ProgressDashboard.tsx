import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseProgressResponse, progressApi } from '../../services/api/progress/ProgressApi';
import { useAuth } from '../../context/AuthContext';

export const ProgressDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressList, setProgressList] = useState<CourseProgressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await progressApi.getAllProgress();
      setProgressList(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return '#28a745';
    if (percentage >= 60) return '#17a2b8';
    if (percentage >= 30) return '#ffc107';
    return '#6c757d';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalCompleted = progressList.filter(p => p.progressPercentage >= 100).length;
  const totalInProgress = progressList.filter(p => p.progressPercentage > 0 && p.progressPercentage < 100).length;
  const totalNotStarted = progressList.filter(p => p.progressPercentage === 0).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>My Learning Progress</h1>
        <p style={styles.subtitle}>Track your progress across all enrolled courses</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Summary stats */}
      <div style={styles.statsRow} className="stats-grid">
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{progressList.length}</span>
          <span style={styles.statLabel}>Total Courses</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statNumber, color: '#28a745' }}>{totalCompleted}</span>
          <span style={styles.statLabel}>Completed</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statNumber, color: '#17a2b8' }}>{totalInProgress}</span>
          <span style={styles.statLabel}>In Progress</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statNumber, color: '#6c757d' }}>{totalNotStarted}</span>
          <span style={styles.statLabel}>Not Started</span>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading your progress...</div>
      ) : progressList.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>You haven't enrolled in any courses yet.</p>
          <button onClick={() => navigate('/courses')} style={styles.browseButton}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {progressList.map((progress) => (
            <div
              key={progress.enrollmentId}
              style={styles.card}
              onClick={() => navigate(`/progress/${progress.enrollmentId}`)}
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.courseTitle}>{progress.courseTitle}</h3>
                {progress.progressPercentage >= 100 && (
                  <span style={styles.completedBadge}>COMPLETED</span>
                )}
              </div>

              <div style={styles.cardBody}>
                {/* Progress bar */}
                <div style={styles.progressSection}>
                  <div style={styles.progressLabelRow}>
                    <span style={styles.progressLabel}>Progress</span>
                    <span style={{
                      ...styles.progressPercent,
                      color: getProgressColor(progress.progressPercentage),
                    }}>
                      {Math.round(progress.progressPercentage)}%
                    </span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${progress.progressPercentage}%`,
                        backgroundColor: getProgressColor(progress.progressPercentage),
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div style={styles.details}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Lessons</span>
                    <span style={styles.detailValue}>
                      {progress.completedLessons} / {progress.totalLessons}
                    </span>
                  </div>
                  {progress.averageQuizScore !== null && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Avg Quiz Score</span>
                      <span style={styles.detailValue}>
                        {Math.round(progress.averageQuizScore)}%
                      </span>
                    </div>
                  )}
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Last Activity</span>
                    <span style={styles.detailValue}>
                      {formatDate(progress.lastAccessedAt)}
                    </span>
                  </div>
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
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  pageTitle: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    margin: 0,
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0d9488',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  emptyText: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '16px',
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
  courseTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: '#d4edda',
    color: '#155724',
    flexShrink: 0,
    marginLeft: '8px',
  },
  cardBody: {
    padding: '16px',
  },
  progressSection: {
    marginBottom: '14px',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '6px',
  },
  progressLabel: {
    color: '#555',
  },
  progressPercent: {
    fontWeight: 'bold',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  detailLabel: {
    color: '#666',
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#333',
  },
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CourseProgressResponse,
  LessonProgressItem,
  progressApi,
} from '../../services/api/progress/ProgressApi';
import { useAuth } from '../../context/AuthContext';

export const CourseProgressDetail: React.FC = () => {
  const navigate = useNavigate();
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { user } = useAuth();

  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingLesson, setMarkingLesson] = useState<string | null>(null);

  useEffect(() => {
    if (enrollmentId) loadProgress();
  }, [enrollmentId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await progressApi.getCourseProgress(enrollmentId!);
      setProgress(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enrollmentId) return;

    try {
      setMarkingLesson(lessonId);
      await progressApi.markLessonComplete(enrollmentId, lessonId);
      // Reload progress to get updated percentages
      await loadProgress();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark lesson complete');
    } finally {
      setMarkingLesson(null);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Circular progress indicator
  const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (pct: number): string => {
      if (pct >= 100) return '#28a745';
      if (pct >= 60) return '#17a2b8';
      if (pct >= 30) return '#ffc107';
      return '#6c757d';
    };

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e9ecef"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={styles.circularText}>
          <span style={styles.circularPercent}>{Math.round(percentage)}%</span>
          <span style={styles.circularLabel}>Complete</span>
        </div>
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>Loading progress...</div>;

  if (error && !progress) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>{error}</div>
        <button onClick={() => navigate('/progress')} style={styles.backButton}>
          Back to Progress
        </button>
      </div>
    );
  }

  if (!progress) return <div style={styles.loading}>Progress data not available</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/progress')} style={styles.backButton}>
        Back to Progress Dashboard
      </button>

      {error && <div style={styles.errorMsg}>{error}</div>}

      {/* Header with circular progress */}
      <div style={styles.headerCard}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>{progress.courseTitle}</h1>
            <p style={styles.subtitle}>Course Progress</p>

            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{progress.completedLessons}</span>
                <span style={styles.statLabel}>Completed</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{progress.totalLessons}</span>
                <span style={styles.statLabel}>Total Lessons</span>
              </div>
              {progress.averageQuizScore !== null && (
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{Math.round(progress.averageQuizScore)}%</span>
                  <span style={styles.statLabel}>Avg Quiz Score</span>
                </div>
              )}
              <div style={styles.statItem}>
                <span style={{ ...styles.statValue, fontSize: '14px' }}>
                  {formatDate(progress.lastAccessedAt)}
                </span>
                <span style={styles.statLabel}>Last Active</span>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <CircularProgress percentage={progress.progressPercentage} />
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <div style={styles.lessonsCard}>
        <h2 style={styles.lessonsTitle}>Lessons</h2>

        {progress.lessons.map((lesson: LessonProgressItem, index: number) => (
          <div
            key={lesson.lessonId}
            style={{
              ...styles.lessonRow,
              borderTop: index === 0 ? 'none' : '1px solid #eee',
            }}
          >
            <div style={styles.lessonLeft}>
              <span
                style={{
                  ...styles.checkIcon,
                  color: lesson.completed ? '#28a745' : '#ccc',
                  backgroundColor: lesson.completed ? '#d4edda' : '#f8f9fa',
                }}
              >
                {lesson.completed ? '\u2713' : (index + 1).toString()}
              </span>
              <div style={styles.lessonInfo}>
                <span
                  style={{
                    ...styles.lessonTitle,
                    color: lesson.completed ? '#888' : '#333',
                  }}
                >
                  {lesson.lessonTitle}
                </span>
                {lesson.completedAt && (
                  <span style={styles.completedDate}>
                    Completed {formatDate(lesson.completedAt)}
                  </span>
                )}
              </div>
            </div>

            <div style={styles.lessonRight}>
              {lesson.completed ? (
                <span style={styles.completedTag}>Done</span>
              ) : (
                <button
                  onClick={(e) => handleMarkComplete(lesson.lessonId, e)}
                  disabled={markingLesson === lesson.lessonId}
                  style={styles.markCompleteButton}
                >
                  {markingLesson === lesson.lessonId ? 'Saving...' : 'Mark Complete'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions footer */}
      <div style={styles.footer}>
        <button
          onClick={() => navigate(`/courses/${progress.courseId}/learn`)}
          style={styles.continueButton}
        >
          Continue Learning
        </button>
        <button
          onClick={() => navigate(`/courses/${progress.courseId}`)}
          style={styles.courseButton}
        >
          View Course
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  errorBanner: {
    color: '#721c24',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  errorMsg: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    margin: '0 0 20px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px',
  },
  circularText: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularPercent: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  circularLabel: {
    fontSize: '11px',
    color: '#666',
  },
  lessonsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  lessonsTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#333',
  },
  lessonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  lessonLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  checkIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  lessonInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  lessonTitle: {
    fontSize: '14px',
    fontWeight: '500',
  },
  completedDate: {
    fontSize: '11px',
    color: '#aaa',
  },
  lessonRight: {
    flexShrink: 0,
    marginLeft: '12px',
  },
  completedTag: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  markCompleteButton: {
    padding: '6px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  continueButton: {
    padding: '12px 32px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  courseButton: {
    padding: '12px 32px',
    backgroundColor: 'white',
    color: '#007bff',
    border: '2px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

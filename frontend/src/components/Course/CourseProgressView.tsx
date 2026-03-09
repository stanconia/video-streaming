import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseProgress, ModuleProgress, LessonProgress } from '../../types/course/enrollment.types';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { useAuth } from '../../context/AuthContext';

export const CourseProgressView: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) loadProgress();
  }, [courseId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await enrollmentApi.getCourseProgress(courseId!);
      setProgress(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (percentage: number, height: number = 10) => (
    <div style={{ ...styles.progressBarBg, height: `${height}px` }}>
      <div
        style={{
          ...styles.progressBarFill,
          width: `${percentage}%`,
          height: '100%',
        }}
      />
    </div>
  );

  if (loading) return <div style={styles.loading}>Loading progress...</div>;
  if (!progress) return <div style={styles.errorBanner}>Progress data not available</div>;

  return (
    <div style={styles.container}>
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        style={styles.backButton}
      >
        Back to Course
      </button>

      <div style={styles.headerCard}>
        <h1 style={styles.pageTitle}>{progress.courseTitle}</h1>
        <p style={styles.subtitle}>Your Learning Progress</p>

        {error && <div style={styles.errorMsg}>{error}</div>}

        <div style={styles.overallSection}>
          <div style={styles.overallStats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {Math.round(progress.progressPercentage)}%
              </span>
              <span style={styles.statLabel}>Complete</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{progress.completedLessons}</span>
              <span style={styles.statLabel}>Lessons Done</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{progress.totalLessons}</span>
              <span style={styles.statLabel}>Total Lessons</span>
            </div>
          </div>
          {renderProgressBar(progress.progressPercentage, 14)}
        </div>
      </div>

      <div style={styles.modulesSection}>
        <h2 style={styles.modulesSectionTitle}>Module Progress</h2>
        {progress.modules.map((mod: ModuleProgress) => (
          <div key={mod.moduleId} style={styles.moduleCard}>
            <div style={styles.moduleHeader}>
              <div style={styles.moduleHeaderLeft}>
                <h3 style={styles.moduleTitle}>{mod.moduleTitle}</h3>
                <span style={styles.moduleStat}>
                  {mod.completedLessons}/{mod.totalLessons} lessons
                </span>
              </div>
              <span style={styles.modulePercent}>
                {Math.round(mod.progressPercentage)}%
              </span>
            </div>
            {renderProgressBar(mod.progressPercentage, 8)}

            <div style={styles.lessonChecklist}>
              {mod.lessons.map((lesson: LessonProgress) => (
                <div key={lesson.lessonId} style={styles.checklistItem}>
                  <span
                    style={{
                      ...styles.checkIcon,
                      color: lesson.completed ? '#28a745' : '#ccc',
                    }}
                  >
                    {lesson.completed ? '[x]' : '[ ]'}
                  </span>
                  <span
                    style={{
                      ...styles.checkTitle,
                      textDecoration: lesson.completed ? 'line-through' : 'none',
                      color: lesson.completed ? '#888' : '#333',
                    }}
                  >
                    {lesson.title}
                  </span>
                  {lesson.completedAt && (
                    <span style={styles.completedDate}>
                      {new Date(lesson.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <button
          onClick={() => navigate(`/courses/${courseId}/learn`)}
          style={styles.continueButton}
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  errorBanner: {
    color: '#721c24',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    textAlign: 'center',
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
  pageTitle: { margin: '0 0 4px 0', fontSize: '22px' },
  subtitle: { color: '#666', margin: '0 0 20px 0' },
  errorMsg: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  overallSection: {},
  overallStats: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#007bff' },
  statLabel: { fontSize: '12px', color: '#666', marginTop: '4px' },
  progressBarBg: {
    width: '100%',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#28a745',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
  },
  modulesSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  modulesSectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  moduleCard: {
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  moduleHeaderLeft: { flex: 1 },
  moduleTitle: { margin: '0 0 2px 0', fontSize: '15px' },
  moduleStat: { fontSize: '12px', color: '#888' },
  modulePercent: { fontSize: '16px', fontWeight: 'bold', color: '#007bff', flexShrink: 0 },
  lessonChecklist: { marginTop: '14px' },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 0',
    borderTop: '1px solid #f5f5f5',
    fontSize: '14px',
  },
  checkIcon: { fontFamily: 'monospace', fontSize: '13px', flexShrink: 0 },
  checkTitle: { flex: 1 },
  completedDate: { fontSize: '11px', color: '#aaa', flexShrink: 0 },
  footer: { textAlign: 'center' },
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
};

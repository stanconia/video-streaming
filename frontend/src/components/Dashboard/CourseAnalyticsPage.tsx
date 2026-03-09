import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseAnalytics, StudentPerformance } from '../../types/admin/dashboard.types';
import { dashboardApi } from '../../services/api/admin/DashboardApi';
import { StatCard } from './StatCard';

export const CourseAnalyticsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, studentsData] = await Promise.all([
        dashboardApi.getCourseAnalytics(courseId!),
        dashboardApi.getCourseStudents(courseId!),
      ]);
      setAnalytics(analyticsData);
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading analytics...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!analytics) return null;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/my-courses')} style={styles.backButton}>Back to My Courses</button>
      <h1 style={styles.pageTitle}>Course Analytics</h1>
      <h2 style={styles.courseTitle}>{analytics.courseTitle}</h2>

      <div style={styles.statsGrid}>
        <StatCard label="Total Enrolled" value={analytics.totalEnrollments} color="#007bff" />
        <StatCard label="Active" value={analytics.activeEnrollments} color="#28a745" />
        <StatCard label="Completed" value={analytics.completedEnrollments} color="#6f42c1" />
        <StatCard label="Completion Rate" value={`${analytics.completionRate.toFixed(1)}%`} color="#fd7e14" />
        <StatCard label="Avg Progress" value={`${analytics.averageProgress.toFixed(1)}%`} color="#17a2b8" />
        <StatCard
          label="Avg Quiz Score"
          value={analytics.averageQuizScore != null ? `${analytics.averageQuizScore.toFixed(1)}%` : 'N/A'}
          color="#ffc107"
        />
        <StatCard label="Revenue" value={`$${analytics.totalRevenue.toFixed(2)}`} color="#28a745" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Enrolled Students ({students.length})</h2>
        {students.length === 0 ? (
          <p style={styles.empty}>No students enrolled yet.</p>
        ) : (
          <div style={styles.list}>
            {students.map((student) => (
              <div key={student.studentUserId} style={styles.studentCard}>
                <div
                  style={styles.studentHeader}
                  onClick={() => setExpandedStudent(
                    expandedStudent === student.studentUserId ? null : student.studentUserId
                  )}
                >
                  <div style={styles.studentInfo}>
                    <span style={styles.studentName}>{student.studentDisplayName}</span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: student.enrollmentStatus === 'COMPLETED' ? '#d4edda' : '#cce5ff',
                      color: student.enrollmentStatus === 'COMPLETED' ? '#155724' : '#004085',
                    }}>{student.enrollmentStatus}</span>
                  </div>
                  <div style={styles.studentMetrics}>
                    <span style={styles.metric}>Progress: {Math.round(student.progressPercentage)}%</span>
                    <span style={styles.metric}>
                      Quiz Avg: {student.averageQuizScore != null ? `${student.averageQuizScore.toFixed(1)}%` : 'N/A'}
                    </span>
                    <span style={styles.metric}>
                      Assignment Avg: {student.averageAssignmentScore != null ? `${student.averageAssignmentScore.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${student.progressPercentage}%` }} />
                  </div>
                </div>

                {expandedStudent === student.studentUserId && (
                  <div style={styles.expandedDetails}>
                    {student.quizAttempts.length > 0 && (
                      <div style={styles.detailSection}>
                        <h4 style={styles.detailTitle}>Quiz Attempts</h4>
                        {student.quizAttempts.map((qa, i) => (
                          <div key={i} style={styles.detailRow}>
                            <span>{qa.quizTitle}</span>
                            <span style={{
                              color: qa.passed ? '#155724' : '#721c24',
                              fontWeight: 'bold',
                            }}>
                              {qa.percentage.toFixed(1)}% {qa.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {student.assignmentGrades.length > 0 && (
                      <div style={styles.detailSection}>
                        <h4 style={styles.detailTitle}>Assignment Grades</h4>
                        {student.assignmentGrades.map((ag, i) => (
                          <div key={i} style={styles.detailRow}>
                            <span>{ag.assignmentTitle}</span>
                            <span style={{ fontWeight: 'bold' }}>
                              {ag.score != null ? `${ag.score}/${ag.maxScore}` : 'Not graded'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {student.quizAttempts.length === 0 && student.assignmentGrades.length === 0 && (
                      <p style={styles.empty}>No quiz or assignment data yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  backButton: {
    padding: '6px 16px', backgroundColor: '#6c757d', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px',
  },
  pageTitle: { margin: '0 0 4px 0' },
  courseTitle: { margin: '0 0 24px 0', color: '#666', fontWeight: 'normal', fontSize: '18px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  empty: { color: '#666', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  studentCard: { border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  studentHeader: { padding: '12px 16px', cursor: 'pointer' },
  studentInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  studentName: { fontWeight: 'bold', fontSize: '15px' },
  badge: { fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' },
  studentMetrics: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666', marginBottom: '8px', flexWrap: 'wrap' as const },
  metric: {},
  progressBarBg: { height: '6px', backgroundColor: '#e9ecef', borderRadius: '3px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#007bff', borderRadius: '3px', transition: 'width 0.3s ease' },
  expandedDetails: { padding: '0 16px 16px', borderTop: '1px solid #eee' },
  detailSection: { marginTop: '12px' },
  detailTitle: { margin: '0 0 8px 0', fontSize: '14px', color: '#333' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #f5f5f5' },
};

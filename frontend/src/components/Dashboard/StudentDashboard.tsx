import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentDashboardData } from '../../types/admin/dashboard.types';
import { dashboardApi } from '../../services/api/admin/DashboardApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { LiveSession } from '../../types/live/liveSession.types';
import { StatCard } from './StatCard';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sessions = await liveSessionApi.getMyUpcoming();
        setUpcomingSessions(sessions);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await dashboardApi.getStudentDashboard();
      setData(result);
      try {
        const sessions = await liveSessionApi.getMyUpcoming();
        setUpcomingSessions(sessions);
      } catch { /* ignore */ }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!data) return null;

  return (
    <div style={styles.container} className="page-container">
      <h1 style={styles.pageTitle}>Mind Learner Dashboard</h1>

      <div style={styles.statsGrid} className="stats-grid">
        <StatCard label="Total Enrollments" value={data.totalEnrollments} color="#007bff" />
        <StatCard label="Active Courses" value={data.activeEnrollments} color="#28a745" />
        <StatCard label="Completed" value={data.completedCourses} color="#6f42c1" />
        <StatCard label="Total Spent" value={`$${data.totalSpent.toFixed(2)}`} color="#dc3545" />
      </div>

      <div style={styles.quickLinks}>
        <button onClick={() => navigate('/courses')} style={styles.quickLinkButton}>Browse Courses</button>
        <button onClick={() => navigate('/my-enrollments')} style={styles.quickLinkButton}>My Enrollments</button>
      </div>

      {upcomingSessions.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Upcoming Live Sessions</h2>
          <div style={styles.list}>
            {upcomingSessions.map((s) => (
              <div key={s.id} style={{
                ...styles.listItem,
                borderLeft: s.status === 'LIVE' ? '4px solid #28a745' : '4px solid #17a2b8',
              }}>
                <div style={styles.listItemHeader}>
                  <span style={styles.listItemTitle}>{s.title}</span>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: s.status === 'LIVE' ? '#d4edda' : '#d1ecf1',
                    color: s.status === 'LIVE' ? '#155724' : '#0c5460',
                  }}>{s.status === 'LIVE' ? 'LIVE NOW' : 'SCHEDULED'}</span>
                </div>
                <div style={styles.listItemDetails}>
                  <span>{s.courseTitle}</span>
                  <span>{new Date(s.scheduledAt).toLocaleDateString()} at{' '}
                    {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{s.durationMinutes} min</span>
                </div>
                {s.status === 'LIVE' && s.roomId && (
                  <button
                    onClick={() => navigate(`/room/${s.roomId}/view`)}
                    style={styles.joinSessionButton}
                  >
                    Join Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Enrollments</h2>
        {data.recentEnrollments.length === 0 ? (
          <p style={styles.empty}>No enrollments yet. Browse courses to get started.</p>
        ) : (
          <div style={styles.list}>
            {data.recentEnrollments.map((e) => (
              <div key={e.id} style={styles.listItem} onClick={() => navigate(`/courses/${e.courseId}/learn`)}>
                <div style={styles.listItemHeader}>
                  <span style={styles.listItemTitle}>{e.courseTitle}</span>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: e.status === 'COMPLETED' ? '#d4edda' : '#cce5ff',
                    color: e.status === 'COMPLETED' ? '#155724' : '#004085',
                  }}>{e.status}</span>
                </div>
                <div style={styles.progressRow}>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${e.progressPercentage}%` }} />
                  </div>
                  <span style={styles.progressText}>{Math.round(e.progressPercentage)}%</span>
                </div>
                <div style={styles.listItemDetails}>
                  <span>Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</span>
                  {e.completedAt && <span>Completed: {new Date(e.completedAt).toLocaleDateString()}</span>}
                </div>
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
  pageTitle: { marginBottom: '24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  quickLinks: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' as const },
  quickLinkButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  empty: { color: '#666', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { padding: '12px 16px', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer' },
  listItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  listItemTitle: { fontWeight: 'bold', color: '#007bff' },
  badge: { fontSize: '12px', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' },
  listItemDetails: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  progressBarBg: { flex: 1, height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#007bff', borderRadius: '4px', transition: 'width 0.3s ease' },
  progressText: { fontSize: '13px', fontWeight: 'bold', color: '#007bff', minWidth: '35px' },
  joinSessionButton: {
    marginTop: '8px',
    padding: '8px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

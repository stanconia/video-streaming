import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherDashboardData } from '../../types/admin/dashboard.types';
import { dashboardApi } from '../../services/api/admin/DashboardApi';
import { StatCard } from './StatCard';
import { EarningsChart } from './EarningsChart';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await dashboardApi.getTeacherDashboard();
      setData(result);
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
      <h1 style={styles.pageTitle}>Mind Pro Dashboard</h1>

      <div style={styles.statsGrid} className="stats-grid">
        <StatCard label="Total Earnings" value={`$${data.totalEarnings.toFixed(2)}`} color="#28a745" />
        <StatCard label="Total Mind Learners" value={data.totalStudents} color="#007bff" />
        <StatCard label="Total Courses" value={data.totalClasses} color="#6f42c1" />
        <StatCard label="Avg Rating" value={data.averageRating.toFixed(1)} color="#ffc107" />
        <StatCard label="Total Reviews" value={data.totalReviews} color="#17a2b8" />
      </div>

      <EarningsChart data={data.monthlyEarnings} />

      <div style={styles.quickLinks} className="quick-links">
        <button onClick={() => navigate('/courses/create')} style={styles.quickLinkButton}>Create Course</button>
        <button onClick={() => navigate('/my-courses')} style={styles.quickLinkButton}>My Courses</button>
        <button onClick={() => navigate('/earnings')} style={styles.quickLinkButton}>View Earnings</button>
        <button onClick={() => navigate('/stripe-connect')} style={{...styles.quickLinkButton, backgroundColor: '#6f42c1'}}>Account Setup</button>
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
  quickLinks: { display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' as const },
  quickLinkButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
};

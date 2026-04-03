import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlatformStats } from '../../types/admin/admin.types';
import { adminApi } from '../../services/api/admin/AdminApi';
import { StatCard } from '../Dashboard/StatCard';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading admin dashboard...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!stats) return null;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Admin Dashboard</h1>

      <div style={styles.statsGrid}>
        <StatCard label="Total Users" value={stats.totalUsers} color="#007bff" />
        <StatCard label="Mind Pros" value={stats.totalTeachers} color="#28a745" />
        <StatCard label="Mind Learners" value={stats.totalStudents} color="#6f42c1" />
        <StatCard label="Total Courses" value={stats.totalCourses} color="#fd7e14" />
        <StatCard label="Total Enrollments" value={stats.totalEnrollments} color="#17a2b8" />
        <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="#28a745" />
        <StatCard label="Pending Applications" value={stats.pendingApplications} color="#dc3545" />
      </div>

      <div style={styles.navCards}>
        <div style={styles.navCard} onClick={() => navigate('/admin/users')}>
          <h3 style={styles.navCardTitle}>User Management</h3>
          <p style={styles.navCardDesc}>View and manage platform users</p>
        </div>
        <div style={styles.navCard} onClick={() => navigate('/admin/applications')}>
          <h3 style={styles.navCardTitle}>Mind Pro Applications</h3>
          <p style={styles.navCardDesc}>Review pending Mind Pro applications ({stats.pendingApplications})</p>
        </div>
        <div style={styles.navCard} onClick={() => navigate('/admin/stats')}>
          <h3 style={styles.navCardTitle}>Platform Stats</h3>
          <p style={styles.navCardDesc}>Detailed platform analytics</p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  pageTitle: { marginBottom: '24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' },
  navCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  navCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' },
  navCardTitle: { margin: '0 0 8px 0', color: '#007bff' },
  navCardDesc: { margin: 0, color: '#666', fontSize: '14px' },
};

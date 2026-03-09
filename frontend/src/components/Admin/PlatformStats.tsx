import React, { useState, useEffect } from 'react';
import { PlatformStats as PlatformStatsType } from '../../types/admin/admin.types';
import { adminApi } from '../../services/api/admin/AdminApi';
import { StatCard } from '../Dashboard/StatCard';

export const PlatformStats: React.FC = () => {
  const [stats, setStats] = useState<PlatformStatsType | null>(null);
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

  if (loading) return <div style={styles.loading}>Loading stats...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!stats) return null;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Platform Statistics</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Users</h2>
        <div style={styles.statsGrid}>
          <StatCard label="Total Users" value={stats.totalUsers} color="#007bff" />
          <StatCard label="Teachers" value={stats.totalTeachers} color="#28a745" />
          <StatCard label="Students" value={stats.totalStudents} color="#6f42c1" />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Platform Activity</h2>
        <div style={styles.statsGrid}>
          <StatCard label="Total Courses" value={stats.totalCourses} color="#fd7e14" />
          <StatCard label="Total Enrollments" value={stats.totalEnrollments} color="#17a2b8" />
          <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="#28a745" />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Moderation</h2>
        <div style={styles.statsGrid}>
          <StatCard label="Pending Applications" value={stats.pendingApplications} color="#dc3545" />
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
  section: { marginBottom: '24px' },
  sectionTitle: { marginBottom: '16px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClassSeries } from '../../types/social/series.types';
import { seriesApi } from '../../services/api/social/SeriesApi';
import { useAuth } from '../../context/AuthContext';

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const SeriesDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [series, setSeries] = useState<ClassSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (id) loadSeries();
  }, [id]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const data = await seriesApi.getSeriesById(id!);
      setSeries(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError(null);
      await seriesApi.enrollInSeries(id!);
      loadSeries();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to enroll in series');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading series...</div>;
  if (!series) return <div style={styles.error}>Series not found</div>;

  const isStudent = user?.role === 'STUDENT';

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/series')} style={styles.backButton}>Back to Series</button>

      <div style={styles.card}>
        <h1 style={styles.title}>{series.title}</h1>
        <span style={styles.statusBadge}>{series.active ? 'Active' : 'Inactive'}</span>

        {series.description && (
          <p style={styles.description}>{series.description}</p>
        )}

        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Teacher:</span>
            <span
              style={styles.teacherLink}
              onClick={() => navigate(`/teachers/${series.teacherUserId}`)}
            >
              {series.teacherDisplayName}
            </span>
          </div>
          {series.subject && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Subject:</span>
              <span>{series.subject}</span>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.label}>Recurrence:</span>
            <span>{series.recurrencePattern}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Day:</span>
            <span>{DAY_NAMES[series.dayOfWeek] || 'N/A'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Time:</span>
            <span>{series.timeOfDay}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Duration:</span>
            <span>{series.durationMinutes} minutes</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Total Sessions:</span>
            <span>{series.totalSessions}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Enrolled:</span>
            <span>{series.enrolledCount} / {series.maxStudents}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Price:</span>
            <span style={styles.price}>
              {series.price > 0 ? `$${(series.price / 100).toFixed(2)}` : 'Free'}
            </span>
          </div>
          {(series.ageMin != null || series.ageMax != null) && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Age Range:</span>
              <span>
                {series.ageMin != null ? series.ageMin : 'Any'}
                {' - '}
                {series.ageMax != null ? series.ageMax : 'Any'}
              </span>
            </div>
          )}
        </div>

        {series.tags && (
          <div style={styles.tags}>
            {series.tags.split(',').map((t, i) => (
              <span key={i} style={styles.tag}>{t.trim()}</span>
            ))}
          </div>
        )}

        {error && <div style={styles.errorMsg}>{error}</div>}

        <div style={styles.actions}>
          {isStudent && series.active && (
            <button onClick={handleEnroll} disabled={enrolling} style={styles.enrollButton}>
              {enrolling ? 'Enrolling...' : `Enroll - ${series.price > 0 ? `$${(series.price / 100).toFixed(2)}` : 'Free'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center' },
  backButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 8px 0' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' },
  description: { color: '#555', lineHeight: '1.6', marginBottom: '20px' },
  details: { borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' },
  label: { fontWeight: 'bold', color: '#666' },
  teacherLink: { color: '#0d9488', cursor: 'pointer', textDecoration: 'underline' },
  price: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '16px' },
  tag: { padding: '4px 10px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', color: '#495057' },
  errorMsg: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  enrollButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
};

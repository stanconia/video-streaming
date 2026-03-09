import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassSeries } from '../../types/social/series.types';
import { seriesApi } from '../../services/api/social/SeriesApi';

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const SeriesList: React.FC = () => {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<ClassSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const data = await seriesApi.getSeries();
      setSeriesList(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Browse Series</h1>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading series...</div>
      ) : seriesList.length === 0 ? (
        <div style={styles.empty}>No series found.</div>
      ) : (
        <div style={styles.grid}>
          {seriesList.map((series) => (
            <div key={series.id} style={styles.card} onClick={() => navigate(`/series/${series.id}`)}>
              <div style={styles.cardHeader}>
                <h3 style={styles.seriesTitle}>{series.title}</h3>
                <span style={styles.recurrenceBadge}>{series.recurrencePattern}</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.detail}>
                  <span style={styles.label}>Teacher:</span>
                  <span>{series.teacherDisplayName}</span>
                </div>
                {series.subject && (
                  <div style={styles.detail}>
                    <span style={styles.label}>Subject:</span>
                    <span>{series.subject}</span>
                  </div>
                )}
                <div style={styles.detail}>
                  <span style={styles.label}>Schedule:</span>
                  <span>{DAY_NAMES[series.dayOfWeek] || 'N/A'} at {series.timeOfDay}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Sessions:</span>
                  <span>{series.totalSessions}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Enrolled:</span>
                  <span>{series.enrolledCount}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Price:</span>
                  <span style={styles.price}>
                    {series.price > 0 ? `$${(series.price / 100).toFixed(2)}` : 'Free'}
                  </span>
                </div>
                {series.tags && (
                  <div style={styles.tags}>
                    {series.tags.split(',').map((t, i) => (
                      <span key={i} style={styles.tag}>{t.trim()}</span>
                    ))}
                  </div>
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
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #eee' },
  seriesTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold' },
  recurrenceBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#cce5ff', color: '#004085' },
  cardBody: { padding: '16px' },
  detail: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' },
  label: { color: '#666', fontWeight: 'bold' },
  price: { fontWeight: 'bold', color: '#28a745' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginTop: '8px' },
  tag: { padding: '2px 8px', backgroundColor: '#e9ecef', borderRadius: '10px', fontSize: '11px', color: '#495057' },
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassSeries } from '../../types/social/series.types';
import { seriesApi } from '../../services/api/social/SeriesApi';

export const MySeriesView: React.FC = () => {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<ClassSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMySeries();
  }, []);

  const loadMySeries = async () => {
    try {
      setLoading(true);
      const data = await seriesApi.getMySeries();
      setSeriesList(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your series');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (active: boolean): React.CSSProperties => {
    const color = active
      ? { bg: '#d4edda', text: '#155724' }
      : { bg: '#f8d7da', text: '#721c24' };
    return {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: color.bg,
      color: color.text,
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>My Series</h1>
        <button onClick={() => navigate('/series/create')} style={styles.createButton}>
          Create Series
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : seriesList.length === 0 ? (
        <div style={styles.empty}>You haven't created any series yet.</div>
      ) : (
        <div style={styles.list}>
          {seriesList.map((series) => (
            <div key={series.id} style={styles.listItem} onClick={() => navigate(`/series/${series.id}`)}>
              <div style={styles.listItemHeader}>
                <h3 style={styles.itemTitle}>{series.title}</h3>
                <span style={getStatusStyle(series.active)}>
                  {series.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={styles.itemDetails}>
                <span>{series.totalSessions} sessions</span>
                <span>{series.enrolledCount} enrolled</span>
                <span>{series.recurrencePattern}</span>
                <span>
                  {series.price > 0 ? `$${(series.price / 100).toFixed(2)}` : 'Free'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  createButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', padding: '16px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  listItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  itemTitle: { margin: 0, fontSize: '16px', color: '#007bff' },
  itemDetails: { display: 'flex', gap: '20px', fontSize: '14px', color: '#666' },
};

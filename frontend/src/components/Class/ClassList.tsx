import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduledClass } from '../../types/class/class.types';
import { SearchFilters, SearchResult } from '../../types/admin/search.types';
import { classApi } from '../../services/api/class/ClassApi';
import { SearchFilterPanel } from './SearchFilterPanel';
import { Pagination } from '../common/Pagination';

export const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ page: 0, size: 12, sortBy: 'date', sortDir: 'asc' });

  useEffect(() => {
    loadClasses(currentFilters);
  }, []);

  const loadClasses = async (filters: SearchFilters) => {
    try {
      setLoading(true);
      const result: SearchResult<ScheduledClass> = await classApi.searchClasses(filters);
      setClasses(result.content);
      setTotalPages(result.totalPages);
      setPage(result.number);
      setCurrentFilters(filters);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    loadClasses(filters);
  };

  const handlePageChange = (newPage: number) => {
    loadClasses({ ...currentFilters, page: newPage });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      OPEN: { bg: '#d4edda', text: '#155724' },
      FULL: { bg: '#fff3cd', text: '#856404' },
      IN_PROGRESS: { bg: '#cce5ff', text: '#004085' },
      COMPLETED: { bg: '#e2e3e5', text: '#383d41' },
      CANCELLED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: color.bg, color: color.text }}>
        {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Browse Classes</h1>

      <SearchFilterPanel onSearch={handleSearch} />

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading classes...</div>
      ) : classes.length === 0 ? (
        <div style={styles.empty}>No classes found.</div>
      ) : (
        <>
          <div style={styles.grid}>
            {classes.map((cls) => (
              <div key={cls.id} style={styles.card} onClick={() => navigate(`/classes/${cls.id}`)}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.classTitle}>{cls.title}</h3>
                  {getStatusBadge(cls.status)}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.detail}>
                    <span style={styles.label}>Teacher:</span>
                    <span>{cls.teacherDisplayName}</span>
                  </div>
                  {cls.subject && (
                    <div style={styles.detail}>
                      <span style={styles.label}>Subject:</span>
                      <span>{cls.subject}</span>
                    </div>
                  )}
                  <div style={styles.detail}>
                    <span style={styles.label}>When:</span>
                    <span>{formatDate(cls.scheduledAt)}</span>
                  </div>
                  <div style={styles.detail}>
                    <span style={styles.label}>Duration:</span>
                    <span>{cls.durationMinutes} min</span>
                  </div>
                  <div style={styles.detail}>
                    <span style={styles.label}>Spots:</span>
                    <span>{cls.enrolledStudents}/{cls.maxStudents}</span>
                  </div>
                  <div style={styles.detail}>
                    <span style={styles.label}>Price:</span>
                    <span style={styles.price}>
                      {cls.price > 0 ? `$${(cls.price / 100).toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                  {cls.teacherAverageRating != null && cls.teacherAverageRating > 0 && (
                    <div style={styles.detail}>
                      <span style={styles.label}>Rating:</span>
                      <span>{cls.teacherAverageRating.toFixed(1)}</span>
                    </div>
                  )}
                  {cls.tags && (
                    <div style={styles.tags}>
                      {cls.tags.split(',').map((t, i) => (
                        <span key={i} style={styles.tag}>{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
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
  classTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold' },
  cardBody: { padding: '16px' },
  detail: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' },
  label: { color: '#666', fontWeight: 'bold' },
  price: { fontWeight: 'bold', color: '#28a745' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginTop: '8px' },
  tag: { padding: '2px 8px', backgroundColor: '#e9ecef', borderRadius: '10px', fontSize: '11px', color: '#495057' },
};

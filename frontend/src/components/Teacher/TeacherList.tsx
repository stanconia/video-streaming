import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfile } from '../../types/social/teacher.types';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { useAuth } from '../../context/AuthContext';

export const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async (subject?: string) => {
    try {
      setLoading(true);
      const data = await teacherApi.searchTeachers(subject || undefined);
      setTeachers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadTeachers(subjectFilter);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= Math.round(rating) ? '#ffc107' : '#ddd', fontSize: '16px' }}>
          *
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1>Browse Teachers</h1>
            <p>Find the perfect teacher for you</p>
          </div>
          <div style={styles.headerActions}>
            {user && <span style={styles.userName}>{user.displayName}</span>}
            <button onClick={() => navigate('/')} style={styles.backButton}>Home</button>
            <button onClick={logout} style={styles.logoutButton}>Logout</button>
          </div>
        </div>
      </header>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Filter by subject..."
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          style={styles.searchInput}
        />
        <button onClick={handleSearch} style={styles.searchButton}>Search</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading teachers...</div>
      ) : teachers.length === 0 ? (
        <div style={styles.empty}>No teachers found.</div>
      ) : (
        <div style={styles.grid}>
          {teachers.map((teacher) => (
            <div key={teacher.id} style={styles.card} onClick={() => navigate(`/teachers/${teacher.userId}`)}>
              <div style={styles.cardBody}>
                <h3 style={styles.teacherName}>{teacher.displayName}</h3>
                {teacher.headline && <p style={styles.headline}>{teacher.headline}</p>}
                {teacher.subjects && (
                  <div style={styles.subjects}>
                    {teacher.subjects.split(',').map((s, i) => (
                      <span key={i} style={styles.subjectTag}>{s.trim()}</span>
                    ))}
                  </div>
                )}
                <div style={styles.stats}>
                  <div style={styles.rating}>
                    {renderStars(teacher.averageRating)}
                    <span style={styles.ratingText}>
                      {teacher.averageRating.toFixed(1)} ({teacher.reviewCount})
                    </span>
                  </div>
                  {teacher.hourlyRate > 0 && (
                    <span style={styles.rate}>${teacher.hourlyRate}/hr</span>
                  )}
                </div>
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
  header: { marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px', color: '#555' },
  backButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '10px 16px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  searchButton: { padding: '10px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  cardBody: { padding: '20px' },
  teacherName: { margin: '0 0 8px 0', fontSize: '18px' },
  headline: { color: '#666', fontSize: '14px', margin: '0 0 12px 0' },
  subjects: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '12px' },
  subjectTag: { padding: '4px 10px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', color: '#495057' },
  stats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rating: { display: 'flex', alignItems: 'center', gap: '4px' },
  ratingText: { fontSize: '14px', color: '#666', marginLeft: '4px' },
  rate: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
};

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
        <span key={i} style={{ color: i <= Math.round(rating) ? '#ffc107' : '#ddd', fontSize: '14px' }}>
          &#9733;
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
            <h1 style={styles.headerTitle}>Browse Teachers</h1>
            <p style={styles.headerSub}>Find the perfect teacher for you</p>
          </div>
          <div style={styles.headerActions}>
            {user && <span style={styles.userName}>{user.displayName}</span>}
            <button onClick={() => navigate('/')} style={styles.navButton}>Home</button>
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
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
          {teachers.map((teacher) => {
            const initials = teacher.displayName?.charAt(0)?.toUpperCase() || '?';
            return (
              <div key={teacher.id} style={styles.card} onClick={() => navigate(`/teachers/${teacher.userId}`)}>
                <div style={styles.cardBody}>
                  <div style={styles.cardTop}>
                    {teacher.profileImageUrl ? (
                      <img src={teacher.profileImageUrl} alt={teacher.displayName} style={styles.cardAvatar} />
                    ) : (
                      <div style={styles.cardAvatarPlaceholder}>{initials}</div>
                    )}
                    <div style={styles.cardInfo}>
                      <h3 style={styles.teacherName}>{teacher.displayName}</h3>
                      {teacher.headline && <p style={styles.headline}>{teacher.headline}</p>}
                    </div>
                  </div>

                  {teacher.subjects && (
                    <div style={styles.subjects}>
                      {teacher.subjects.split(',').slice(0, 3).map((s, i) => (
                        <span key={i} style={styles.subjectTag}>{s.trim()}</span>
                      ))}
                      {teacher.subjects.split(',').length > 3 && (
                        <span style={styles.moreTag}>+{teacher.subjects.split(',').length - 3}</span>
                      )}
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <div style={styles.rating}>
                      {renderStars(teacher.averageRating)}
                      <span style={styles.ratingText}>
                        {teacher.averageRating.toFixed(1)} ({teacher.reviewCount})
                      </span>
                    </div>
                    <div style={styles.footerRight}>
                      {teacher.experienceYears > 0 && (
                        <span style={styles.experience}>{teacher.experienceYears} yrs exp</span>
                      )}
                      {teacher.hourlyRate > 0 && (
                        <span style={styles.rate}>${teacher.hourlyRate}/hr</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: {
    marginBottom: '24px', padding: '24px', backgroundColor: 'white',
    borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { margin: '0 0 4px 0', fontSize: '24px' },
  headerSub: { margin: 0, color: '#666', fontSize: '14px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px', color: '#555' },
  navButton: {
    padding: '8px 16px', backgroundColor: '#007bff', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px', backgroundColor: '#dc3545', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: {
    flex: 1, padding: '12px 16px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px',
  },
  searchButton: {
    padding: '12px 24px', backgroundColor: '#007bff', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
  },
  error: {
    color: '#721c24', padding: '12px', marginBottom: '20px',
    backgroundColor: '#f8d7da', borderRadius: '4px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: {
    textAlign: 'center', padding: '60px 20px', color: '#666',
    backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
  card: {
    backgroundColor: 'white', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #f0f0f0',
  },
  cardBody: { padding: '20px' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' },
  cardAvatar: {
    width: '60px', height: '60px', borderRadius: '50%',
    objectFit: 'cover' as const, border: '2px solid #e9ecef', flexShrink: 0,
  },
  cardAvatarPlaceholder: {
    width: '60px', height: '60px', borderRadius: '50%',
    backgroundColor: '#007bff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '22px', fontWeight: 'bold',
    color: 'white', flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  teacherName: { margin: '0 0 4px 0', fontSize: '17px', color: '#1a1a1a' },
  headline: {
    color: '#666', fontSize: '13px', margin: 0, lineHeight: '1.3',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  subjects: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '14px' },
  subjectTag: {
    padding: '4px 10px', backgroundColor: '#e8f4fd', color: '#0277bd',
    borderRadius: '12px', fontSize: '11px', fontWeight: '500',
  },
  moreTag: {
    padding: '4px 10px', backgroundColor: '#f0f0f0', color: '#888',
    borderRadius: '12px', fontSize: '11px',
  },
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid #f5f5f5', paddingTop: '12px',
  },
  rating: { display: 'flex', alignItems: 'center', gap: '4px' },
  ratingText: { fontSize: '13px', color: '#666', marginLeft: '4px' },
  footerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  experience: { fontSize: '12px', color: '#888' },
  rate: { fontWeight: 'bold', color: '#28a745', fontSize: '15px' },
};

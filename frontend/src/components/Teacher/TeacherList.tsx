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
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--warning)' : 'var(--border-color)', fontSize: '14px' }}>
          &#9733;
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="page-container" style={styles.container}>
      <div className="hero-banner" style={styles.heroBanner}>
        <h1 style={styles.heroTitle}>Find Your Teacher</h1>
        <p style={styles.heroSubtitle}>Browse expert educators and find the perfect match for your learning goals</p>
      </div>

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
        <div className="course-grid" style={styles.grid}>
          {teachers.map((teacher) => {
            const initials = teacher.displayName?.charAt(0)?.toUpperCase() || '?';
            return (
              <div key={teacher.id} className="course-card" style={styles.card} onClick={() => navigate(`/teachers/${teacher.userId}`)}>
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
  container: { maxWidth: '1200px', margin: '0 auto' },
  heroBanner: { textAlign: 'center' },
  heroTitle: { margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold', color: '#fff' },
  heroSubtitle: { margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.85)' },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: {
    flex: 1, padding: '12px 16px', border: '1px solid var(--border-color)',
    borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  searchButton: {
    padding: '12px 24px', backgroundColor: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
  },
  error: {
    color: 'var(--danger)', padding: '12px', marginBottom: '20px',
    backgroundColor: 'var(--danger-light)', borderRadius: '8px',
  },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '16px' },
  empty: {
    textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: 'var(--shadow)',
  },
  grid: {},
  card: {
    backgroundColor: 'var(--bg-card)', borderRadius: '12px',
    boxShadow: 'var(--shadow)', cursor: 'pointer',
    border: '1px solid var(--border-color)',
  },
  cardBody: { padding: '20px' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' },
  cardAvatar: {
    width: '60px', height: '60px', borderRadius: '50%',
    objectFit: 'cover' as const, border: '2px solid var(--border-color)', flexShrink: 0,
  },
  cardAvatarPlaceholder: {
    width: '60px', height: '60px', borderRadius: '50%',
    backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '22px', fontWeight: 'bold',
    color: '#fff', flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  teacherName: { margin: '0 0 4px 0', fontSize: '17px', color: 'var(--text-primary)' },
  headline: {
    color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.3',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  subjects: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '14px' },
  subjectTag: {
    padding: '4px 10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)',
    borderRadius: '16px', fontSize: '11px', fontWeight: '500',
  },
  moreTag: {
    padding: '4px 10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
    borderRadius: '16px', fontSize: '11px',
  },
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid var(--border-color)', paddingTop: '12px',
  },
  rating: { display: 'flex', alignItems: 'center', gap: '4px' },
  ratingText: { fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' },
  footerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  experience: { fontSize: '12px', color: 'var(--text-muted)' },
  rate: { fontWeight: 'bold', color: 'var(--success)', fontSize: '15px' },
};

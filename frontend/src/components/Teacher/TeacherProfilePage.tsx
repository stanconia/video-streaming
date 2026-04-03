import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TeacherProfile } from '../../types/social/teacher.types';
import { Review } from '../../types/social/teacher.types';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { useAuth } from '../../context/AuthContext';
import { ReviewForm } from '../Review/ReviewForm';
import { ReviewList } from '../Review/ReviewList';
import { favoriteApi } from '../../services/api/social/FavoriteApi';

export const TeacherProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileData, reviewsData] = await Promise.all([
        teacherApi.getTeacherProfile(userId!),
        teacherApi.getReviews(userId!),
      ]);
      setProfile(profileData);
      setReviews(reviewsData);
      try {
        const fav = await favoriteApi.isFavoriteTeacher(userId!);
        setIsFavorited(fav);
      } catch {}
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCreated = () => {
    loadProfile();
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!profile) return <div style={styles.error}>Profile not found</div>;

  const initials = profile.displayName?.charAt(0)?.toUpperCase() || '?';
  const isOwnProfile = user?.userId === userId;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--warning)' : 'var(--border-color)', fontSize: '18px' }}>
          &#9733;
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="page-container" style={styles.container}>
      <button onClick={() => navigate('/teachers')} style={styles.backButton}>
        &#8592; Back to Teachers
      </button>

      <div style={styles.profileCard}>
        {/* Cover Banner */}
        <div className="cover-banner" style={styles.coverBanner} />

        {/* Header: Avatar + Name */}
        <div className="profile-header" style={styles.headerSection}>
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.displayName} style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>{initials}</div>
          )}
          <div style={styles.headerInfo}>
            <div style={styles.nameRow}>
              <h1 style={styles.name}>{profile.displayName}</h1>
              {profile.verified && <span style={styles.verifiedBadge}>&#10003; Verified</span>}
              {user && user.userId !== userId && (
                <button
                  onClick={async () => {
                    try {
                      const result = await favoriteApi.toggleFavoriteTeacher(userId!);
                      setIsFavorited(result.favorited);
                    } catch {}
                  }}
                  style={{ ...styles.favButton, color: isFavorited ? '#dc3545' : '#ccc' }}
                >
                  {isFavorited ? '\u2665' : '\u2661'}
                </button>
              )}
            </div>
            {profile.headline && <p style={styles.headline}>{profile.headline}</p>}
            <p style={styles.memberSince}>
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid" style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>&#9733;</div>
            <div style={styles.statValue}>{profile.averageRating.toFixed(1)}</div>
            <div style={styles.statLabel}>{profile.reviewCount} Reviews</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>&#128188;</div>
            <div style={styles.statValue}>{profile.experienceYears}</div>
            <div style={styles.statLabel}>Years Experience</div>
          </div>
          {profile.hourlyRate > 0 && (
            <div style={styles.statCard}>
              <div style={styles.statIcon}>&#36;</div>
              <div style={styles.statValue}>${profile.hourlyRate}</div>
              <div style={styles.statLabel}>Per Hour</div>
            </div>
          )}
        </div>

        {/* About / Bio */}
        {profile.bio && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>About</h3>
            <p style={styles.bio}>{profile.bio}</p>
          </div>
        )}

        {/* Subjects */}
        {profile.subjects && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Subjects</h3>
            <div style={styles.subjects}>
              {profile.subjects.split(',').map((s, i) => (
                <span key={i} style={styles.subjectTag}>{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Edit button for own profile */}
        {isOwnProfile && (
          <button style={styles.editButton} onClick={() => navigate('/profile/edit')}>
            Edit Profile
          </button>
        )}
      </div>

      {/* Reviews Section */}
      <div style={styles.reviewsSection}>
        <h2 style={styles.reviewsTitle}>Reviews ({profile.reviewCount})</h2>
        <div style={styles.ratingOverview}>
          {renderStars(profile.averageRating)}
          <span style={styles.ratingText}>{profile.averageRating.toFixed(1)} out of 5</span>
        </div>
        {user && user.role === 'STUDENT' && (
          <ReviewForm teacherId={userId!} onReviewCreated={handleReviewCreated} />
        )}
        <ReviewList reviews={reviews} teacherUserId={userId} onReviewUpdated={loadProfile} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '8px' },
  backButton: {
    padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--accent)',
    border: '1px solid var(--accent)', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', marginBottom: '20px',
  },
  profileCard: {
    backgroundColor: 'var(--bg-card)', borderRadius: '12px',
    boxShadow: 'var(--shadow)', marginBottom: '24px', overflow: 'hidden',
  },
  coverBanner: {
    height: '120px',
    background: 'linear-gradient(135deg, var(--accent), #6a11cb)',
    borderRadius: '12px 12px 0 0',
  },
  headerSection: {
    display: 'flex', alignItems: 'flex-start', gap: '24px',
    marginBottom: '24px', padding: '0 32px',
    marginTop: '-48px',
  },
  avatar: {
    width: '120px', height: '120px', borderRadius: '50%',
    objectFit: 'cover' as const, border: '4px solid var(--bg-card)', flexShrink: 0,
    boxShadow: 'var(--shadow)',
  },
  avatarPlaceholder: {
    width: '120px', height: '120px', borderRadius: '50%',
    backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '48px', fontWeight: 'bold',
    color: 'var(--bg-card)', flexShrink: 0,
    border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow)',
  },
  headerInfo: { flex: 1, paddingTop: '52px' },
  nameRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
  name: { margin: 0, fontSize: '28px', color: 'var(--text-primary)' },
  verifiedBadge: {
    padding: '4px 12px', backgroundColor: '#d4edda', color: '#155724',
    borderRadius: '16px', fontSize: '12px', fontWeight: 'bold',
  },
  headline: { color: 'var(--text-secondary)', fontSize: '16px', margin: '8px 0 0 0', lineHeight: '1.4' },
  memberSince: { color: 'var(--text-muted)', fontSize: '13px', margin: '8px 0 0 0' },
  statsRow: {
    display: 'flex', gap: '16px', marginBottom: '24px',
    borderTop: '1px solid var(--bg-secondary)', borderBottom: '1px solid var(--bg-secondary)',
    padding: '20px 32px',
  },
  statCard: {
    flex: 1, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
  },
  statIcon: { fontSize: '20px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' },
  statLabel: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' as const },
  section: { marginBottom: '20px', padding: '0 32px' },
  sectionTitle: { margin: '0 0 10px 0', fontSize: '16px', color: 'var(--text-primary)', fontWeight: '600' },
  bio: { color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0 },
  subjects: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  subjectTag: {
    padding: '6px 14px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)',
    borderRadius: '16px', fontSize: '13px', fontWeight: '500',
  },
  editButton: {
    margin: '16px 32px 32px 32px', padding: '10px 24px', backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold',
  },
  reviewsSection: {
    backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '32px',
    boxShadow: 'var(--shadow)',
  },
  reviewsTitle: { margin: '0 0 8px 0', fontSize: '20px' },
  ratingOverview: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  ratingText: { fontSize: '14px', color: 'var(--text-secondary)' },
  favButton: {
    background: 'none', border: '1px solid var(--border-color)', fontSize: '20px',
    cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
};

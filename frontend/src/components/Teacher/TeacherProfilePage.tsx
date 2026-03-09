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

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/teachers')} style={styles.backButton}>Back to Teachers</button>

      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <h1 style={styles.name}>{profile.displayName}</h1>
          {profile.verified && <span style={styles.verifiedBadge}>Verified</span>}
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
        {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

        <div style={styles.details}>
          {profile.subjects && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Subjects:</span>
              <div style={styles.subjects}>
                {profile.subjects.split(',').map((s, i) => (
                  <span key={i} style={styles.subjectTag}>{s.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {profile.hourlyRate > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Rate:</span>
              <span style={styles.rate}>${profile.hourlyRate}/hr</span>
            </div>
          )}
          {profile.experienceYears > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Experience:</span>
              <span>{profile.experienceYears} years</span>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.label}>Rating:</span>
            <span>{profile.averageRating.toFixed(1)} ({profile.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div style={styles.reviewsSection}>
        <h2>Reviews</h2>
        {user && user.role === 'STUDENT' && (
          <ReviewForm teacherId={userId!} onReviewCreated={handleReviewCreated} />
        )}
        <ReviewList reviews={reviews} teacherUserId={userId} onReviewUpdated={loadProfile} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  backButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  profileCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  name: { margin: 0, fontSize: '24px' },
  verifiedBadge: { padding: '4px 10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  headline: { color: '#666', fontSize: '16px', margin: '0 0 12px 0' },
  bio: { color: '#333', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' },
  details: { borderTop: '1px solid #eee', paddingTop: '16px' },
  detailRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  label: { fontWeight: 'bold', color: '#666', minWidth: '100px' },
  subjects: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px' },
  subjectTag: { padding: '4px 10px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '12px', color: '#495057' },
  rate: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
  reviewsSection: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  favButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px 8px' },
};

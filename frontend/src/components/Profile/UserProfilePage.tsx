import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileApi } from '../../services/api/auth/ProfileApi';
import { UserProfile } from '../../types/auth/profile.types';
import { useAuth } from '../../context/AuthContext';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getPublicProfile(userId!);
      // If teacher, redirect to their teacher profile page
      if (data.role === 'TEACHER') {
        navigate(`/teachers/${userId}`, { replace: true });
        return;
      }
      setProfile(data);
    } catch (err: any) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!profile) return null;

  const isOwnProfile = user?.userId === userId;
  const initials = profile.displayName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="page-container" style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>Back</button>

      <div style={styles.card}>
        {/* Cover Banner */}
        <div className="cover-banner" style={styles.coverBanner} />

        {/* Avatar */}
        <div className="profile-header" style={styles.avatarSection}>
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.displayName} style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>{initials}</div>
          )}
          <div style={styles.nameSection}>
            <h1 style={styles.displayName}>{profile.displayName}</h1>
            <span style={styles.roleBadge}>{profile.role}</span>
            <p style={styles.memberSince}>
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>About</h3>
            <p style={styles.bio}>{profile.bio}</p>
          </div>
        )}

        {/* Location */}
        {profile.location && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Location</h3>
            <p style={styles.text}>{profile.location}</p>
          </div>
        )}

        {profile.subjectInterests && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Subject Interests</h3>
            <div style={styles.interestsTags}>
              {profile.subjectInterests.split(',').map((interest, i) => (
                <span key={i} style={styles.interestTag}>{interest.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Student stats */}
        {profile.role === 'STUDENT' && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{profile.enrolledCoursesCount || 0}</div>
              <div style={styles.statLabel}>Enrolled Courses</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{profile.completedCoursesCount || 0}</div>
              <div style={styles.statLabel}>Completed</div>
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
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-secondary)',
  },
  error: {
    color: 'var(--danger)',
    padding: '12px',
    backgroundColor: 'var(--danger-light, rgba(220, 53, 69, 0.1))',
    borderRadius: '12px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '0',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  },
  coverBanner: {
    height: '120px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark, #0f766e))',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '-40px',
    padding: '0 32px 24px 32px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '4px solid var(--bg-card)',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '44px',
    fontWeight: 'bold',
    color: 'var(--bg-card)',
    border: '4px solid var(--bg-card)',
    flexShrink: 0,
  },
  nameSection: {
    flex: 1,
    paddingTop: '44px',
  },
  displayName: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    color: 'var(--text-primary)',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
  },
  memberSince: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    margin: '8px 0 0 0',
  },
  section: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
    marginBottom: '16px',
    marginLeft: '32px',
    marginRight: '32px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: '12px',
  },
  bio: {
    color: 'var(--text-primary)',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
  text: {
    color: 'var(--text-primary)',
    fontSize: '14px',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    marginBottom: '16px',
    marginLeft: '32px',
    marginRight: '32px',
  },
  statCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '16px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--accent)',
  },
  statLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  interestsTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  interestTag: {
    padding: '4px 12px',
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent)',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  editButton: {
    margin: '20px 32px 32px 32px',
    padding: '10px 24px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

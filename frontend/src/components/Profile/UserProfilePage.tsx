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
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>Back</button>

      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatarSection}>
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
    color: '#666',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '3px solid #e9ecef',
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '44px',
    fontWeight: 'bold',
    color: 'white',
  },
  nameSection: {
    flex: 1,
  },
  displayName: {
    margin: '0 0 6px 0',
    fontSize: '24px',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
  },
  memberSince: {
    color: '#999',
    fontSize: '13px',
    margin: '8px 0 0 0',
  },
  section: {
    borderTop: '1px solid #eee',
    paddingTop: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: '#333',
  },
  bio: {
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
  text: {
    color: '#333',
    fontSize: '14px',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginBottom: '16px',
  },
  statCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  interestsTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  interestTag: {
    padding: '4px 12px',
    backgroundColor: '#e8f4fd',
    color: '#0277bd',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
  editButton: {
    marginTop: '20px',
    padding: '10px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

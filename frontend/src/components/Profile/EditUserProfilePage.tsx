import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../services/api/auth/ProfileApi';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { ImageUpload } from '../common/ImageUpload';
import { useAuth } from '../../context/AuthContext';

export const EditUserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [subjectInterests, setSubjectInterests] = useState('');

  // Teacher-specific fields
  const [headline, setHeadline] = useState('');
  const [subjects, setSubjects] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [experienceYears, setExperienceYears] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getMyProfile();
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setLocation(data.location || '');
      setProfileImageUrl(data.profileImageUrl || '');
      setSubjectInterests(data.subjectInterests || '');

      // Load teacher-specific fields
      if (user?.role === 'TEACHER') {
        try {
          const teacherProfile = await teacherApi.getMyProfile();
          setHeadline(teacherProfile.headline || '');
          setSubjects(teacherProfile.subjects || '');
          setHourlyRate(teacherProfile.hourlyRate || 0);
          setExperienceYears(teacherProfile.experienceYears || 0);
        } catch {
          // Teacher profile may not exist yet
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      console.error('Profile load error:', err.response?.status, msg);
      if (msg.includes('not found')) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      setError('Failed to load profile: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileApi.updateMyProfile({ displayName, bio, phone, location, profileImageUrl, subjectInterests: subjectInterests || undefined });

      // Save teacher-specific fields
      if (user?.role === 'TEACHER') {
        await teacherApi.updateProfile({ headline, bio, subjects, hourlyRate, experienceYears });
      }

      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to update profile';
      console.error('Profile save error:', err.response?.status, msg);
      if (msg.includes('not found')) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>Back</button>

      <div style={styles.card}>
        <h1 style={styles.title}>Edit Profile</h1>
        <p style={styles.subtitle}>Update your personal information</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              style={styles.textarea}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={styles.input}
              placeholder="Optional"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={styles.input}
              placeholder="City, Country"
            />
          </div>

          <div style={styles.field}>
            <ImageUpload
              label="Profile Image"
              currentImageUrl={profileImageUrl || null}
              onUpload={async (file) => {
                const updated = await profileApi.uploadProfileImage(file);
                setProfileImageUrl(updated.profileImageUrl || '');
              }}
              onRemove={async () => {
                await profileApi.updateMyProfile({ profileImageUrl: '' });
                setProfileImageUrl('');
              }}
              maxSizeMB={5}
            />
          </div>

          {user?.role === 'STUDENT' && (
            <div style={styles.field}>
              <label style={styles.label}>Subject Interests</label>
              <input
                type="text"
                value={subjectInterests}
                onChange={e => setSubjectInterests(e.target.value)}
                style={styles.input}
                placeholder="e.g. Math, Science, History"
              />
            </div>
          )}

          {user?.role === 'TEACHER' && (
            <>
              <div style={styles.sectionDivider}>
                <h3 style={styles.sectionTitle}>Teaching Profile</h3>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Experienced Math Tutor"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={e => setSubjects(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Math, Physics, Chemistry"
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={e => setExperienceYears(parseInt(e.target.value) || 0)}
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          <div style={styles.actions}>
            <button type="submit" disabled={saving} style={styles.saveButton}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  success: {
    color: '#155724',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#d4edda',
    borderRadius: '4px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
  },
  imagePreview: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginTop: '8px',
    border: '1px solid #ddd',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  saveButton: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  sectionDivider: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
};

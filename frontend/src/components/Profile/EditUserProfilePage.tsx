import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../services/api/auth/ProfileApi';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { ImageUpload } from '../common/ImageUpload';
import { useAuth } from '../../context/AuthContext';
import { LocationSelector } from '../shared/LocationSelector';
import { MultiSubjectSelector } from '../shared/MultiSubjectSelector';
import { COUNTRIES } from '../../data/constants';

export const EditUserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [subjectInterestsArr, setSubjectInterestsArr] = useState<string[]>([]);

  // Teacher-specific fields
  const [headline, setHeadline] = useState('');
  const [subjectsArr, setSubjectsArr] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [experienceYears, setExperienceYears] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getMyProfile();
      setEmail(data.email || '');
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      // Parse "City, Country" into separate fields
      const loc = data.location || '';
      if (loc.includes(', ')) {
        const lastComma = loc.lastIndexOf(', ');
        const parsedCity = loc.substring(0, lastComma);
        const parsedCountry = loc.substring(lastComma + 2);
        if (COUNTRIES.includes(parsedCountry)) {
          setCountry(parsedCountry);
          setCity(parsedCity);
        } else {
          // Country not in list, put everything in city
          setCountry('');
          setCity(loc);
        }
      } else {
        setCountry('');
        setCity('');
      }
      setProfileImageUrl(data.profileImageUrl || '');
      // Parse comma-separated subject interests into array
      const interests = data.subjectInterests || '';
      setSubjectInterestsArr(interests ? interests.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

      // Load teacher-specific fields
      if (user?.role === 'TEACHER') {
        try {
          const teacherProfile = await teacherApi.getMyProfile();
          setHeadline(teacherProfile.headline || '');
          const subjectsStr = teacherProfile.subjects || '';
          setSubjectsArr(subjectsStr ? subjectsStr.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
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
      const location = city && country ? `${city}, ${country}` : country || '';
      const subjectInterests = subjectInterestsArr.length > 0 ? subjectInterestsArr.join(', ') : undefined;
      await profileApi.updateMyProfile({ email, displayName, bio, phone, location, profileImageUrl, subjectInterests });

      // Save teacher-specific fields
      if (user?.role === 'TEACHER') {
        const subjects = subjectsArr.length > 0 ? subjectsArr.join(', ') : '';
        await teacherApi.updateProfile({ headline, bio, subjects, hourlyRate, experienceYears });
      }

      // Sync display name and email back to auth context / navbar
      updateUser({ displayName, email });

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
    <div className="page-container" style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>Back</button>

      <div style={styles.card}>
        <h1 style={styles.title}>Edit Profile</h1>
        <p style={styles.subtitle}>Update your personal information</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
            />
          </div>

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
            <LocationSelector
              country={country}
              city={city}
              onCountryChange={setCountry}
              onCityChange={setCity}
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
              <MultiSubjectSelector
                selected={subjectInterestsArr}
                onChange={setSubjectInterestsArr}
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
                <label style={styles.label}>Subjects</label>
                <MultiSubjectSelector
                  selected={subjectsArr}
                  onChange={setSubjectsArr}
                />
              </div>

              <div className="form-row" style={styles.row}>
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
    color: 'var(--text-secondary)',
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
    padding: '32px',
    boxShadow: 'var(--shadow)',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  error: {
    color: 'var(--danger)',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: 'var(--danger-light, rgba(220, 53, 69, 0.1))',
    borderRadius: '8px',
  },
  success: {
    color: 'var(--success)',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: 'var(--success-light, rgba(40, 167, 69, 0.1))',
    borderRadius: '8px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: 'var(--text-primary)',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  imagePreview: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginTop: '8px',
    border: '1px solid var(--border-color)',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  saveButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--success)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  sectionDivider: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherProfileRequest } from '../../types/social/teacher.types';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { useAuth } from '../../context/AuthContext';
import { MultiSubjectSelector } from '../shared/MultiSubjectSelector';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<TeacherProfileRequest>({
    bio: '',
    headline: '',
    subjects: '',
    hourlyRate: 0,
    experienceYears: 0,
  });
  const [subjectsArr, setSubjectsArr] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await teacherApi.getMyProfile();
      const subjectsStr = profile.subjects || '';
      const parsed = subjectsStr ? subjectsStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      setSubjectsArr(parsed);
      setForm({
        bio: profile.bio || '',
        headline: profile.headline || '',
        subjects: profile.subjects || '',
        hourlyRate: profile.hourlyRate || 0,
        experienceYears: profile.experienceYears || 0,
        profileImageUrl: profile.profileImageUrl || undefined,
      });
    } catch {
      // Profile doesn't exist yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const subjects = subjectsArr.length > 0 ? subjectsArr.join(', ') : '';
      await teacherApi.updateProfile({ ...form, subjects });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backButton}>Back to Home</button>

      <div style={styles.formCard}>
        <h1>Edit Guide Profile</h1>
        <p style={styles.subtitle}>Set up your teaching profile so students can find you</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>Profile saved successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Headline</label>
            <input
              type="text"
              placeholder="e.g., Experienced Math Tutor"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Bio</label>
            <textarea
              placeholder="Tell students about yourself..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              style={styles.textarea}
              rows={5}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subjects</label>
            <MultiSubjectSelector
              selected={subjectsArr}
              onChange={setSubjectsArr}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Years of Experience</label>
              <input
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} style={styles.submitButton}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  backButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  formCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  subtitle: { color: '#666', marginBottom: '24px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  success: { color: '#155724', padding: '12px', marginBottom: '16px', backgroundColor: '#d4edda', borderRadius: '4px' },
  field: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  row: { display: 'flex', gap: '16px' },
  submitButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '8px' },
};

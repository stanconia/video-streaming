import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateSeriesRequest } from '../../types/social/series.types';
import { seriesApi } from '../../services/api/social/SeriesApi';

export const CreateSeries: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateSeriesRequest>({
    title: '',
    description: '',
    subject: '',
    recurrencePattern: 'WEEKLY',
    dayOfWeek: 1,
    timeOfDay: '09:00',
    durationMinutes: 60,
    maxStudents: 10,
    price: 0,
    currency: 'USD',
    totalSessions: 8,
    startDate: '',
  });
  const [priceInDollars, setPriceInDollars] = useState('0');
  const [tags, setTags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.startDate) {
      setError('Start date is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const priceInCents = Math.round(parseFloat(priceInDollars) * 100);
      const request: CreateSeriesRequest = {
        ...form,
        price: priceInCents,
        tags: tags.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      };
      const created = await seriesApi.createSeries(request);
      navigate(`/series/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create series');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/series')} style={styles.backButton}>Back to Series</button>

      <div style={styles.formCard}>
        <h1>Create a Series</h1>
        <p style={styles.subtitle}>Schedule a recurring class series for students to enroll in</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Weekly Algebra Workshop"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="Describe what students will learn in this series..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.textarea}
              rows={4}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <input
              type="text"
              placeholder="e.g., Mathematics"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Recurrence Pattern *</label>
              <select
                value={form.recurrencePattern}
                onChange={(e) => setForm({ ...form, recurrencePattern: e.target.value })}
                style={styles.input}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Biweekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Day of Week *</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                style={styles.input}
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={7}>Sunday</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Time of Day *</label>
              <input
                type="time"
                required
                value={form.timeOfDay}
                onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Duration (min)</label>
              <input
                type="number"
                min="15"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Max Students</label>
              <input
                type="number"
                min="1"
                value={form.maxStudents}
                onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 1 })}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceInDollars}
                onChange={(e) => setPriceInDollars(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                style={styles.input}
                maxLength={3}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Total Sessions *</label>
              <input
                type="number"
                min="1"
                required
                value={form.totalSessions}
                onChange={(e) => setForm({ ...form, totalSessions: parseInt(e.target.value) || 1 })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Start Date *</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Min Age</label>
              <input
                type="number"
                min="0"
                value={form.ageMin ?? ''}
                onChange={(e) => setForm({ ...form, ageMin: e.target.value ? parseInt(e.target.value) : undefined })}
                style={styles.input}
                placeholder="Any"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Age</label>
              <input
                type="number"
                min="0"
                value={form.ageMax ?? ''}
                onChange={(e) => setForm({ ...form, ageMax: e.target.value ? parseInt(e.target.value) : undefined })}
                style={styles.input}
                placeholder="Any"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tags</label>
            <input
              type="text"
              placeholder="e.g., math, algebra, beginner (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Thumbnail URL</label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Creating...' : 'Create Series'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  backButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  formCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  subtitle: { color: '#666', marginBottom: '24px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  field: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  row: { display: 'flex', gap: '16px' },
  submitButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '8px' },
};

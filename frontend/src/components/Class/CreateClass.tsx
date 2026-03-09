import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateClassRequest } from '../../types/class/class.types';
import { classApi } from '../../services/api/class/ClassApi';
import { TagInput } from '../common/TagInput';

export const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [form, setForm] = useState<CreateClassRequest>({
    title: '',
    description: '',
    subject: '',
    scheduledAt: '',
    durationMinutes: 60,
    maxStudents: 10,
    price: 0,
    currency: 'USD',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const created = await classApi.createClass({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString().slice(0, 19),
        tags: tags.length > 0 ? tags.join(',') : undefined,
      });
      navigate(`/classes/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backButton}>Back to Home</button>

      <div style={styles.formCard}>
        <h1>Create a Class</h1>
        <p style={styles.subtitle}>Schedule a new live class for students to book</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Introduction to Algebra"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="Describe what students will learn..."
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
              <label style={styles.label}>Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
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
              <label style={styles.label}>Price (cents)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
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
            <TagInput tags={tags} onChange={setTags} placeholder="Add tags (press Enter)" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Thumbnail URL</label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={form.thumbnailUrl ?? ''}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value || undefined })}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Creating...' : 'Create Class'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  backButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
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

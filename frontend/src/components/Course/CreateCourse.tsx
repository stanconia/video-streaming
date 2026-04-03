import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateCourseRequest } from '../../types/course/course.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { useAuth } from '../../context/AuthContext';
import { SubjectSelector } from '../shared/SubjectSelector';

export const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [priceInDollars, setPriceInDollars] = useState<string>('0');
  const [form, setForm] = useState<Omit<CreateCourseRequest, 'price' | 'tags' | 'thumbnailUrl'>>({
    title: '',
    description: '',
    subject: '',
    currency: 'USD',
    difficultyLevel: 'BEGINNER',
    estimatedHours: 1,
    minAge: undefined,
    maxAge: undefined,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const priceInCents = Math.round(parseFloat(priceInDollars || '0') * 100);
      const request: CreateCourseRequest = {
        ...form,
        price: priceInCents,
        minAge: form.minAge || undefined,
        maxAge: form.maxAge || undefined,
        tags: tags.length > 0 ? tags.join(',') : undefined,
      };
      const created = await courseApi.createCourse(request);
      if (thumbnailFile) {
        await courseApi.uploadCourseThumbnail(created.id, thumbnailFile);
      }
      navigate(`/courses/${created.id}/builder`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="page-container">
      <button onClick={() => navigate('/my-courses')} style={styles.backButton}>
        &#8592; Back to My Courses
      </button>

      <div style={styles.formCard}>
        <h1 style={styles.heading}>Create a Course</h1>
        <p style={styles.subtitle}>Set up your new course, then add modules and lessons in the builder</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Complete React Development Guide"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea
              required
              placeholder="Describe what students will learn in this course..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.textarea}
              rows={5}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject *</label>
            <SubjectSelector
              value={form.subject}
              onChange={(value) => setForm({ ...form, subject: value })}
              placeholder="Select a subject..."
            />
          </div>

          <div style={styles.row} className="form-row">
            <div style={styles.field}>
              <label style={styles.label}>Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={priceInDollars}
                onChange={(e) => setPriceInDollars(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row} className="form-row">
            <div style={styles.field}>
              <label style={styles.label}>Difficulty Level *</label>
              <select
                value={form.difficultyLevel}
                onChange={(e) => setForm({ ...form, difficultyLevel: e.target.value })}
                style={styles.select}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Estimated Hours *</label>
              <input
                type="number"
                min="1"
                value={form.estimatedHours}
                onChange={(e) =>
                  setForm({ ...form, estimatedHours: parseInt(e.target.value) || 1 })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row} className="form-row">
            <div style={styles.field}>
              <label style={styles.label}>Minimum Age</label>
              <input
                type="number"
                min="5"
                max="100"
                placeholder="e.g., 8"
                value={form.minAge ?? ''}
                onChange={(e) =>
                  setForm({ ...form, minAge: e.target.value ? parseInt(e.target.value) : undefined })
                }
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Maximum Age</label>
              <input
                type="number"
                min="5"
                max="100"
                placeholder="e.g., 15"
                value={form.maxAge ?? ''}
                onChange={(e) =>
                  setForm({ ...form, maxAge: e.target.value ? parseInt(e.target.value) : undefined })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tags</label>
            <div style={styles.tagContainer}>
              {tags.map((tag, i) => (
                <span key={i} style={styles.tag}>
                  {tag}
                  <span style={styles.tagRemove} onClick={() => removeTag(i)}>
                    x
                  </span>
                </span>
              ))}
              <input
                type="text"
                placeholder="Type and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                style={styles.tagInput}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Course Thumbnail</label>
            {thumbnailPreview && (
              <div style={styles.thumbnailPreviewWrap}>
                <img src={thumbnailPreview} alt="Thumbnail preview" style={styles.thumbnailPreview} />
                <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} style={styles.removeThumbnail}>
                  Remove
                </button>
              </div>
            )}
            {!thumbnailPreview && (
              <label style={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  style={{ display: 'none' }}
                />
                <span style={styles.uploadIcon}>&#128247;</span>
                <span style={styles.uploadText}>Click to upload a thumbnail image</span>
                <span style={styles.uploadHint}>PNG, JPG or GIF, max 5MB</span>
              </label>
            )}
          </div>

          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto' },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
    fontWeight: 500,
  },
  formCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: 'var(--shadow)',
  },
  heading: {
    color: 'var(--text-primary)',
    marginTop: 0,
    marginBottom: '8px',
  },
  subtitle: { color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '15px' },
  error: {
    color: 'var(--danger)',
    padding: '12px 16px',
    marginBottom: '20px',
    backgroundColor: 'var(--danger-light)',
    borderRadius: '8px',
    fontSize: '14px',
  },
  field: { marginBottom: '20px', flex: 1 },
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '8px',
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
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  row: { display: 'flex', gap: '16px' },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    padding: '10px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    minHeight: '46px',
    alignItems: 'center',
    backgroundColor: 'var(--bg-secondary)',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  tagRemove: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    marginLeft: '2px',
  },
  tagInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    flex: 1,
    minWidth: '120px',
    padding: '2px 4px',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 20px',
    border: '2px dashed var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    backgroundColor: 'var(--bg-secondary)',
    gap: '6px',
  },
  uploadIcon: {
    fontSize: '28px',
    marginBottom: '4px',
  },
  uploadText: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  uploadHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  thumbnailPreviewWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumbnailPreview: {
    width: '120px',
    height: '80px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  removeThumbnail: {
    padding: '6px 14px',
    backgroundColor: 'var(--danger)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  submitButton: {
    width: '100%',
    padding: '14px 32px',
    backgroundColor: 'var(--success)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '12px',
  },
};

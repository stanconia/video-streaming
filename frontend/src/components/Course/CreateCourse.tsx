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
        Back to My Courses
      </button>

      <div style={styles.formCard}>
        <h1>Create a Course</h1>
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
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                style={styles.fileInput}
              />
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
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  subtitle: { color: '#666', marginBottom: '24px' },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  field: { marginBottom: '16px', flex: 1 },
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'white',
  },
  row: { display: 'flex', gap: '16px' },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minHeight: '42px',
    alignItems: 'center',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#495057',
  },
  tagRemove: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#868e96',
    marginLeft: '2px',
  },
  tagInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    flex: 1,
    minWidth: '120px',
    padding: '2px 4px',
  },
  fileInput: {
    fontSize: '14px',
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
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  removeThumbnail: {
    padding: '4px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '8px',
  },
};

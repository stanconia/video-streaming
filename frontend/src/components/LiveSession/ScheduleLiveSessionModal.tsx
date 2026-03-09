import React, { useState } from 'react';
import { LiveSession, CreateLiveSessionRequest } from '../../types/live/liveSession.types';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';

interface Props {
  courseId: string;
  moduleId?: string;
  moduleName?: string;
  onClose: () => void;
  onCreated: (session: LiveSession) => void;
}

export const ScheduleLiveSessionModal: React.FC<Props> = ({
  courseId,
  moduleId,
  moduleName,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState(moduleName ? `Live: ${moduleName}` : '');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!scheduledAt) {
      setError('Scheduled date and time is required');
      return;
    }
    if (durationMinutes < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const request: CreateLiveSessionRequest = {
        courseId,
        title: title.trim(),
        scheduledAt: scheduledAt,
        durationMinutes,
      };
      if (moduleId) {
        request.moduleId = moduleId;
      }
      if (description.trim()) {
        request.description = description.trim();
      }

      const session = await liveSessionApi.createSession(request);
      onCreated(session);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to schedule session';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>Schedule Live Session</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="sessionTitle" style={styles.label}>
              Title
            </label>
            <input
              id="sessionTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session title"
              style={styles.input}
              disabled={submitting}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="sessionDescription" style={styles.label}>
              Description (optional)
            </label>
            <textarea
              id="sessionDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what will be covered"
              style={styles.textarea}
              rows={3}
              disabled={submitting}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="sessionScheduledAt" style={styles.label}>
              Date & Time
            </label>
            <input
              id="sessionScheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={styles.input}
              disabled={submitting}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="sessionDuration" style={styles.label}>
              Duration (minutes)
            </label>
            <input
              id="sessionDuration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
              min={1}
              style={styles.input}
              disabled={submitting}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  heading: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  error: {
    color: '#721c24',
    padding: '10px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

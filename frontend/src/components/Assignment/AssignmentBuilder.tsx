import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Assignment, CreateAssignmentRequest } from '../../types/course/assignment.types';
import { assignmentApi } from '../../services/api/course/AssignmentApi';

interface AssignmentBuilderProps {
  courseId: string;
  moduleId: string;
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({ courseId, moduleId }) => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [orderIndex, setOrderIndex] = useState('0');

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await assignmentApi.getAssignments(courseId, moduleId);
      setAssignments(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setMaxScore('100');
    setOrderIndex('0');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setDueDate(assignment.dueDate ? assignment.dueDate.slice(0, 16) : '');
    setMaxScore(String(assignment.maxScore));
    setOrderIndex(String(assignment.orderIndex));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const request: CreateAssignmentRequest = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || undefined,
        maxScore: parseInt(maxScore) || 100,
        orderIndex: parseInt(orderIndex) || 0,
      };

      if (editingId) {
        await assignmentApi.updateAssignment(courseId, editingId, request);
      } else {
        await assignmentApi.createAssignment(courseId, moduleId, request);
      }

      resetForm();
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      setError(null);
      await assignmentApi.deleteAssignment(courseId, assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete assignment');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) return <div style={styles.loading}>Loading assignments...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Assignments</h2>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
              setOrderIndex(String(assignments.length));
            }
          }}
          style={styles.addButton}
        >
          {showForm && !editingId ? 'Cancel' : '+ Add Assignment'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingId ? 'Edit Assignment' : 'New Assignment'}
          </h3>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Assignment instructions and details..."
              rows={5}
              style={styles.textarea}
            />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Score</label>
              <input
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Order</label>
              <input
                type="number"
                min="0"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="submit" disabled={submitting} style={styles.saveButton}>
              {submitting ? 'Saving...' : editingId ? 'Update Assignment' : 'Create Assignment'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* Assignment list */}
      {assignments.length === 0 && !showForm ? (
        <div style={styles.empty}>No assignments for this module yet.</div>
      ) : (
        <div style={styles.list}>
          {assignments
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((assignment) => (
            <div key={assignment.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{assignment.title}</h3>
                  <div style={styles.cardMeta}>
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                    <span>Max Score: {assignment.maxScore}</span>
                    <span>Submissions: {assignment.submissionCount}</span>
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => handleEdit(assignment)} style={styles.editButton}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(assignment.id)} style={styles.deleteButton}>
                    Delete
                  </button>
                </div>
              </div>
              {assignment.description && (
                <p style={styles.cardDescription}>{assignment.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { margin: 0, fontSize: '18px' },
  loading: { textAlign: 'center', padding: '20px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' },
  addButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  formCard: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '20px', border: '1px solid #dee2e6' },
  formTitle: { margin: '0 0 16px 0', fontSize: '16px' },
  field: { marginBottom: '14px', flex: 1 },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  row: { display: 'flex', gap: '16px' },
  formActions: { display: 'flex', gap: '10px', marginTop: '8px' },
  saveButton: { padding: '10px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  cancelButton: { padding: '10px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #dee2e6' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { margin: '0 0 6px 0', fontSize: '16px' },
  cardMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666', flexWrap: 'wrap' as const },
  cardDescription: { margin: '12px 0 0', fontSize: '14px', color: '#555', lineHeight: '1.5', whiteSpace: 'pre-wrap' as const },
  cardActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  editButton: { padding: '6px 14px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  deleteButton: { padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};

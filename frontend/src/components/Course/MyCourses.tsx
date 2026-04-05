import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types/course/course.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { useAuth } from '../../context/AuthContext';

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseApi.getTeacherCourses();
      setCourses(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId: string) => {
    try {
      setPublishing(courseId);
      setError(null);
      await courseApi.publishCourse(courseId);
      await loadCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish course');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will remove all modules, lessons, enrollments, and sessions. This cannot be undone.`)) return;
    try {
      setError(null);
      await courseApi.deleteCourse(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete course');
    }
  };

  const getStatusBadge = (published: boolean) => {
    if (published) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: '#d4edda',
            color: '#155724',
          }}
        >
          PUBLISHED
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: '#fff3cd',
          color: '#856404',
        }}
      >
        DRAFT
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>My Courses</h1>
        <button
          onClick={() => navigate('/courses/create')}
          style={styles.createButton}
        >
          + Create Course
        </button>
      </div>
      <p style={styles.subtitle}>Manage and build your courses</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={styles.empty}>
          <p>You haven't created any courses yet.</p>
          <button
            onClick={() => navigate('/courses/create')}
            style={styles.createButton}
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {courses.map((course) => (
            <div key={course.id} style={styles.listItem}>
              <div style={styles.listItemHeader}>
                <h3 style={styles.itemTitle}>{course.title}</h3>
                {getStatusBadge(course.published)}
              </div>
              <div style={styles.itemDetails}>
                <span>{course.subject}</span>
                <span>{course.moduleCount} modules</span>
                <span>{course.lessonCount} lessons</span>
                <span>{course.enrolledCount} enrolled</span>
                <span>
                  {course.price > 0
                    ? `$${(course.price / 100).toFixed(2)}`
                    : 'Free'}
                </span>
              </div>
              <div style={styles.itemActions}>
                <button
                  onClick={() => navigate(`/courses/${course.id}/builder`)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                {!course.published && (
                  <button
                    onClick={() => handlePublish(course.id)}
                    disabled={publishing === course.id}
                    style={styles.publishButton}
                  >
                    {publishing === course.id ? 'Publishing...' : 'Publish'}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/courses/${course.id}/analytics`)}
                  style={styles.analyticsButton}
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  style={styles.viewButton}
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  pageTitle: { margin: 0 },
  subtitle: { color: '#666', marginBottom: '24px' },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: {
    backgroundColor: 'white',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  listItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold' },
  itemDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  itemActions: { display: 'flex', gap: '8px' },
  editButton: {
    padding: '6px 16px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  publishButton: {
    padding: '6px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  analyticsButton: {
    padding: '6px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  viewButton: {
    padding: '6px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  deleteButton: {
    padding: '6px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

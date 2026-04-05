import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Course,
  CourseModule,
  Lesson,
  CreateModuleRequest,
  CreateLessonRequest,
  CreateCourseRequest,
} from '../../types/course/course.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { useAuth } from '../../context/AuthContext';
import { LiveSession } from '../../types/live/liveSession.types';
import { ScheduleLiveSessionModal } from '../LiveSession/ScheduleLiveSessionModal';
import { LiveSessionList } from '../LiveSession/LiveSessionList';
import { ImageUpload } from '../common/ImageUpload';

interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

export const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Course edit form
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    subject: '',
    estimatedHours: 1,
    difficultyLevel: 'BEGINNER',
  });

  // New module form
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModuleThumbnail, setNewModuleThumbnail] = useState<File | null>(null);
  const [newModuleThumbnailPreview, setNewModuleThumbnailPreview] = useState<string | null>(null);

  // Editing module
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDesc, setEditModuleDesc] = useState('');

  // New lesson form (per module)
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<CreateLessonRequest>({
    title: '',
    content: '',
    type: 'TEXT',
    orderIndex: 0,
    estimatedMinutes: 5,
  });

  // Editing lesson
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonForm, setEditLessonForm] = useState<Partial<CreateLessonRequest>>({});

  // Live session scheduling
  const [schedulingModuleId, setSchedulingModuleId] = useState<string | null>(null);
  const [schedulingModuleName, setSchedulingModuleName] = useState<string>('');
  const [liveSessionKey, setLiveSessionKey] = useState(0);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, modulesData] = await Promise.all([
        courseApi.getCourse(courseId!),
        courseApi.getModules(courseId!),
      ]);
      setCourse(courseData);
      setCourseForm({
        title: courseData.title,
        description: courseData.description,
        subject: courseData.subject,
        estimatedHours: courseData.estimatedHours,
        difficultyLevel: courseData.difficultyLevel,
      });

      const sorted = modulesData.sort((a, b) => a.orderIndex - b.orderIndex);
      const withLessons: ModuleWithLessons[] = [];
      for (const mod of sorted) {
        try {
          const lessons = await courseApi.getLessonsForModule(courseId!, mod.id);
          withLessons.push({
            ...mod,
            lessons: lessons.sort((a, b) => a.orderIndex - b.orderIndex),
          });
        } catch {
          withLessons.push({ ...mod, lessons: [] });
        }
      }
      setModules(withLessons);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourseInfo = async () => {
    try {
      setSaving(true);
      setError(null);
      await courseApi.updateCourse(courseId!, courseForm);
      const updated = await courseApi.getCourse(courseId!);
      setCourse(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    try {
      setPublishing(true);
      setError(null);
      const updated = await courseApi.publishCourse(courseId!);
      setCourse(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!window.confirm(`Delete "${course.title}"? This will remove all modules, lessons, enrollments, and sessions. This cannot be undone.`)) return;
    try {
      await courseApi.deleteCourse(courseId!);
      navigate('/my-courses');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete course');
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      setError(null);
      const request: CreateModuleRequest = {
        title: newModuleTitle.trim(),
        description: newModuleDesc.trim(),
        orderIndex: modules.length,
      };
      let created = await courseApi.addModule(courseId!, request);
      if (newModuleThumbnail) {
        created = await courseApi.uploadModuleThumbnail(courseId!, created.id, newModuleThumbnail);
      }
      setModules([...modules, { ...created, lessons: [] }]);
      setNewModuleTitle('');
      setNewModuleDesc('');
      setNewModuleThumbnail(null);
      setNewModuleThumbnailPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add module');
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    try {
      setError(null);
      await courseApi.updateModule(courseId!, moduleId, {
        title: editModuleTitle,
        description: editModuleDesc,
      });
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? { ...m, title: editModuleTitle, description: editModuleDesc }
            : m
        )
      );
      setEditingModuleId(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      setError(null);
      await courseApi.deleteModule(courseId!, moduleId);
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === modules.length - 1)
    )
      return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...modules];
    const temp = updated[idx];
    updated[idx] = updated[swapIdx];
    updated[swapIdx] = temp;

    try {
      setError(null);
      await courseApi.updateModule(courseId!, updated[idx].id, {
        orderIndex: idx,
      });
      await courseApi.updateModule(courseId!, updated[swapIdx].id, {
        orderIndex: swapIdx,
      });
      setModules(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reorder module');
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLesson.title.trim()) return;
    const mod = modules.find((m) => m.id === moduleId);
    try {
      setError(null);
      const request: CreateLessonRequest = {
        ...newLesson,
        orderIndex: mod ? mod.lessons.length : 0,
      };
      const created = await courseApi.addLesson(courseId!, moduleId, request);
      setModules(
        modules.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, created] } : m
        )
      );
      setNewLesson({
        title: '',
        content: '',
        type: 'TEXT',
        orderIndex: 0,
        estimatedMinutes: 5,
      });
      setAddingLessonToModule(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add lesson');
    }
  };

  const handleUpdateLesson = async (moduleId: string, lessonId: string) => {
    try {
      setError(null);
      const updated = await courseApi.updateLesson(courseId!, lessonId, editLessonForm);
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === lessonId ? { ...l, ...updated } : l
                ),
              }
            : m
        )
      );
      setEditingLessonId(null);
      setEditLessonForm({});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      setError(null);
      await courseApi.deleteLesson(courseId!, lessonId);
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
            : m
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete lesson');
    }
  };

  const handleMoveLesson = async (
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const idx = mod.lessons.findIndex((l) => l.id === lessonId);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === mod.lessons.length - 1)
    )
      return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updatedLessons = [...mod.lessons];
    const temp = updatedLessons[idx];
    updatedLessons[idx] = updatedLessons[swapIdx];
    updatedLessons[swapIdx] = temp;

    try {
      setError(null);
      await courseApi.updateLesson(courseId!, updatedLessons[idx].id, {
        orderIndex: idx,
      });
      await courseApi.updateLesson(courseId!, updatedLessons[swapIdx].id, {
        orderIndex: swapIdx,
      });
      setModules(
        modules.map((m) =>
          m.id === moduleId ? { ...m, lessons: updatedLessons } : m
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reorder lesson');
    }
  };

  const startEditModule = (mod: CourseModule) => {
    setEditingModuleId(mod.id);
    setEditModuleTitle(mod.title);
    setEditModuleDesc(mod.description);
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonForm({
      title: lesson.title,
      content: lesson.content,
      type: lesson.type,
      videoUrl: lesson.videoUrl || undefined,
      estimatedMinutes: lesson.estimatedMinutes,
    });
  };

  const renderLessonContentField = (
    type: string,
    value: Partial<CreateLessonRequest>,
    onChange: (updates: Partial<CreateLessonRequest>) => void
  ) => {
    switch (type) {
      case 'TEXT':
        return (
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Content</label>
            <textarea
              value={value.content || ''}
              onChange={(e) => onChange({ ...value, content: e.target.value })}
              style={styles.textarea}
              rows={4}
              placeholder="Lesson text content..."
            />
          </div>
        );
      case 'VIDEO':
        return (
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Video URL</label>
            <input
              type="text"
              value={value.videoUrl || ''}
              onChange={(e) => onChange({ ...value, videoUrl: e.target.value })}
              style={styles.input}
              placeholder="https://example.com/video.mp4"
            />
          </div>
        );
      case 'FILE':
        return (
          <div style={styles.field}>
            <label style={styles.fieldLabel}>File Key</label>
            <input
              type="text"
              value={value.fileKey || ''}
              onChange={(e) => onChange({ ...value, fileKey: e.target.value })}
              style={styles.input}
              placeholder="uploads/file.pdf"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div style={styles.loading}>Loading course builder...</div>;
  if (!course) return <div style={styles.errorBanner}>Course not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button
          onClick={() => navigate('/courses/my-courses')}
          style={styles.backButton}
        >
          Back to My Courses
        </button>
        <div style={styles.topBarRight}>
          <span style={{
            ...styles.publishBadge,
            backgroundColor: course.published ? '#d4edda' : '#fff3cd',
            color: course.published ? '#155724' : '#856404',
          }}>
            {course.published ? 'Published' : 'Draft'}
          </span>
          <button
            onClick={handlePublishToggle}
            disabled={publishing}
            style={course.published ? styles.unpublishButton : styles.publishButton}
          >
            {publishing ? 'Updating...' : course.published ? 'Unpublish' : 'Publish Course'}
          </button>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            style={styles.previewButton}
          >
            Preview Course
          </button>
          <button
            onClick={handleDeleteCourse}
            style={styles.deleteCourseButton}
          >
            Delete Course
          </button>
        </div>
      </div>

      <h1 style={styles.pageTitle}>Course Builder</h1>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Section 1: Course Info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Course Information</h2>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>Title</label>
          <input
            type="text"
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>Description</label>
          <textarea
            value={courseForm.description}
            onChange={(e) =>
              setCourseForm({ ...courseForm, description: e.target.value })
            }
            style={styles.textarea}
            rows={4}
          />
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Subject</label>
            <input
              type="text"
              value={courseForm.subject}
              onChange={(e) =>
                setCourseForm({ ...courseForm, subject: e.target.value })
              }
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Difficulty</label>
            <select
              value={courseForm.difficultyLevel}
              onChange={(e) =>
                setCourseForm({ ...courseForm, difficultyLevel: e.target.value })
              }
              style={styles.select}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Est. Hours</label>
            <input
              type="number"
              min="1"
              value={courseForm.estimatedHours}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  estimatedHours: parseInt(e.target.value) || 1,
                })
              }
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.field}>
          <ImageUpload
            currentImageUrl={course.thumbnailUrl}
            onUpload={async (file) => {
              const updated = await courseApi.uploadCourseThumbnail(courseId!, file);
              setCourse(updated);
            }}
            onRemove={async () => {
              const updated = await courseApi.deleteCourseThumbnail(courseId!);
              setCourse(updated);
            }}
            label="Course Thumbnail"
          />
        </div>
        <button
          onClick={handleSaveCourseInfo}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? 'Saving...' : 'Save Course Info'}
        </button>
      </div>

      {/* Section 2: Modules */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Modules</h2>

        {modules.map((mod, modIdx) => (
          <div key={mod.id} style={styles.moduleCard}>
            {editingModuleId === mod.id ? (
              <div style={styles.editForm}>
                <input
                  type="text"
                  value={editModuleTitle}
                  onChange={(e) => setEditModuleTitle(e.target.value)}
                  style={styles.input}
                  placeholder="Module title"
                />
                <input
                  type="text"
                  value={editModuleDesc}
                  onChange={(e) => setEditModuleDesc(e.target.value)}
                  style={styles.input}
                  placeholder="Module description"
                />
                <ImageUpload
                  currentImageUrl={mod.thumbnailUrl}
                  onUpload={async (file) => {
                    const updated = await courseApi.uploadModuleThumbnail(courseId!, mod.id, file);
                    setModules(modules.map((m) =>
                      m.id === mod.id ? { ...m, thumbnailUrl: updated.thumbnailUrl } : m
                    ));
                  }}
                  onRemove={async () => {
                    const updated = await courseApi.deleteModuleThumbnail(courseId!, mod.id);
                    setModules(modules.map((m) =>
                      m.id === mod.id ? { ...m, thumbnailUrl: updated.thumbnailUrl } : m
                    ));
                  }}
                  label="Module Thumbnail"
                />
                <div style={styles.editActions}>
                  <button
                    onClick={() => handleUpdateModule(mod.id)}
                    style={styles.smallSaveButton}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingModuleId(null)}
                    style={styles.smallCancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.moduleHeader}>
                <div style={styles.moduleHeaderLeft}>
                  <span style={styles.orderBadge}>{modIdx + 1}</span>
                  {mod.thumbnailUrl && (
                    <img src={mod.thumbnailUrl} alt={mod.title} style={{
                      width: '60px', height: '40px', borderRadius: '4px',
                      objectFit: 'cover' as const, flexShrink: 0,
                    }} />
                  )}
                  <div>
                    <strong>{mod.title}</strong>
                    {mod.description && (
                      <div style={styles.moduleDescText}>{mod.description}</div>
                    )}
                  </div>
                </div>
                <div style={styles.moduleActions}>
                  <button
                    onClick={() => handleMoveModule(mod.id, 'up')}
                    disabled={modIdx === 0}
                    style={styles.arrowButton}
                  >
                    Up
                  </button>
                  <button
                    onClick={() => handleMoveModule(mod.id, 'down')}
                    disabled={modIdx === modules.length - 1}
                    style={styles.arrowButton}
                  >
                    Dn
                  </button>
                  <button
                    onClick={() => startEditModule(mod)}
                    style={styles.smallEditButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    style={styles.smallDeleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Lessons within module */}
            <div style={styles.lessonsContainer}>
              {mod.lessons.length === 0 && (
                <p style={styles.noLessons}>No lessons yet</p>
              )}
              {mod.lessons.map((lesson, lessonIdx) => (
                <div key={lesson.id} style={styles.lessonItem}>
                  {editingLessonId === lesson.id ? (
                    <div style={styles.editForm}>
                      <input
                        type="text"
                        value={editLessonForm.title || ''}
                        onChange={(e) =>
                          setEditLessonForm({ ...editLessonForm, title: e.target.value })
                        }
                        style={styles.input}
                        placeholder="Lesson title"
                      />
                      <div style={styles.row}>
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Type</label>
                          <select
                            value={editLessonForm.type || 'TEXT'}
                            onChange={(e) =>
                              setEditLessonForm({ ...editLessonForm, type: e.target.value })
                            }
                            style={styles.select}
                          >
                            <option value="TEXT">Text</option>
                            <option value="VIDEO">Video</option>
                            <option value="FILE">File</option>
                          </select>
                        </div>
                        <div style={styles.field}>
                          <label style={styles.fieldLabel}>Minutes</label>
                          <input
                            type="number"
                            min="1"
                            value={editLessonForm.estimatedMinutes || 5}
                            onChange={(e) =>
                              setEditLessonForm({
                                ...editLessonForm,
                                estimatedMinutes: parseInt(e.target.value) || 5,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                      </div>
                      {renderLessonContentField(
                        editLessonForm.type || 'TEXT',
                        editLessonForm,
                        setEditLessonForm
                      )}
                      <div style={styles.editActions}>
                        <button
                          onClick={() => handleUpdateLesson(mod.id, lesson.id)}
                          style={styles.smallSaveButton}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingLessonId(null);
                            setEditLessonForm({});
                          }}
                          style={styles.smallCancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.lessonRow}>
                      <div style={styles.lessonInfo}>
                        <span style={styles.lessonOrderBadge}>{lessonIdx + 1}</span>
                        <span style={styles.lessonTypeBadge}>{lesson.type}</span>
                        <span>{lesson.title}</span>
                        <span style={styles.lessonMinutes}>
                          {lesson.estimatedMinutes} min
                        </span>
                      </div>
                      <div style={styles.lessonActions}>
                        <button
                          onClick={() => handleMoveLesson(mod.id, lesson.id, 'up')}
                          disabled={lessonIdx === 0}
                          style={styles.arrowButton}
                        >
                          Up
                        </button>
                        <button
                          onClick={() => handleMoveLesson(mod.id, lesson.id, 'down')}
                          disabled={lessonIdx === mod.lessons.length - 1}
                          style={styles.arrowButton}
                        >
                          Dn
                        </button>
                        <button
                          onClick={() => startEditLesson(lesson)}
                          style={styles.smallEditButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                          style={styles.smallDeleteButton}
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addingLessonToModule === mod.id ? (
                <div style={styles.addLessonForm}>
                  <h4 style={styles.addLessonTitle}>Add Lesson</h4>
                  <input
                    type="text"
                    value={newLesson.title}
                    onChange={(e) =>
                      setNewLesson({ ...newLesson, title: e.target.value })
                    }
                    style={styles.input}
                    placeholder="Lesson title"
                  />
                  <div style={styles.row}>
                    <div style={styles.field}>
                      <label style={styles.fieldLabel}>Type</label>
                      <select
                        value={newLesson.type}
                        onChange={(e) =>
                          setNewLesson({ ...newLesson, type: e.target.value })
                        }
                        style={styles.select}
                      >
                        <option value="TEXT">Text</option>
                        <option value="VIDEO">Video</option>
                        <option value="FILE">File</option>
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.fieldLabel}>Minutes</label>
                      <input
                        type="number"
                        min="1"
                        value={newLesson.estimatedMinutes}
                        onChange={(e) =>
                          setNewLesson({
                            ...newLesson,
                            estimatedMinutes: parseInt(e.target.value) || 5,
                          })
                        }
                        style={styles.input}
                      />
                    </div>
                  </div>
                  {renderLessonContentField(newLesson.type, newLesson, (updates) =>
                    setNewLesson({ ...newLesson, ...updates } as CreateLessonRequest)
                  )}
                  <div style={styles.editActions}>
                    <button
                      onClick={() => handleAddLesson(mod.id)}
                      style={styles.smallSaveButton}
                    >
                      Add Lesson
                    </button>
                    <button
                      onClick={() => setAddingLessonToModule(null)}
                      style={styles.smallCancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingLessonToModule(mod.id);
                    setNewLesson({
                      title: '',
                      content: '',
                      type: 'TEXT',
                      orderIndex: 0,
                      estimatedMinutes: 5,
                    });
                  }}
                  style={styles.addLessonButton}
                >
                  + Add Lesson
                </button>
              )}
              <button
                onClick={() => {
                  setSchedulingModuleId(mod.id);
                  setSchedulingModuleName(mod.title);
                }}
                style={styles.scheduleLiveButton}
              >
                Schedule Live Session
              </button>
              <LiveSessionList key={`live-${mod.id}-${liveSessionKey}`} courseId={courseId!} moduleId={mod.id} isTeacher={true} />
            </div>
          </div>
        ))}

        {schedulingModuleId && (
          <ScheduleLiveSessionModal
            courseId={courseId!}
            moduleId={schedulingModuleId}
            moduleName={schedulingModuleName}
            onClose={() => setSchedulingModuleId(null)}
            onCreated={() => {
              setSchedulingModuleId(null);
              setLiveSessionKey((k) => k + 1);
            }}
          />
        )}

        <div style={styles.addModuleForm}>
          <h3 style={styles.addModuleTitle}>Add Module</h3>
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            style={styles.input}
            placeholder="Module title"
          />
          <input
            type="text"
            value={newModuleDesc}
            onChange={(e) => setNewModuleDesc(e.target.value)}
            style={styles.input}
            placeholder="Module description (optional)"
          />
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Module Thumbnail</label>
            {newModuleThumbnailPreview ? (
              <div style={styles.thumbnailPreviewWrap}>
                <img src={newModuleThumbnailPreview} alt="Preview" style={styles.thumbnailPreviewImg} />
                <button
                  type="button"
                  onClick={() => { setNewModuleThumbnail(null); setNewModuleThumbnailPreview(null); }}
                  style={styles.removeThumbnailBtn}
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
                    setNewModuleThumbnail(file);
                    setNewModuleThumbnailPreview(URL.createObjectURL(file));
                  }
                }}
                style={{ fontSize: '13px' }}
              />
            )}
          </div>
          <button onClick={handleAddModule} style={styles.addModuleButton}>
            + Add Module
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '8px' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  publishBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  publishButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  unpublishButton: {
    padding: '8px 16px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  previewButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteCourseButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageTitle: { marginBottom: '20px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  errorBanner: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  field: { marginBottom: '12px', flex: 1 },
  fieldLabel: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#333',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginBottom: '4px',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'white',
  },
  row: { display: 'flex', gap: '12px' },
  saveButton: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '8px',
  },
  moduleCard: {
    border: '1px solid #ddd',
    borderRadius: '6px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#f8f9fa',
    gap: '12px',
  },
  moduleHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  orderBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#0d9488',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  moduleDescText: { fontSize: '12px', color: '#666', marginTop: '2px' },
  moduleActions: { display: 'flex', gap: '4px', flexShrink: 0 },
  arrowButton: {
    padding: '4px 8px',
    backgroundColor: '#e9ecef',
    border: '1px solid #ddd',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  smallEditButton: {
    padding: '4px 10px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  smallDeleteButton: {
    padding: '4px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  smallSaveButton: {
    padding: '6px 14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  smallCancelButton: {
    padding: '6px 14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  editForm: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  editActions: { display: 'flex', gap: '8px', marginTop: '4px' },
  lessonsContainer: { padding: '0 16px 16px 16px' },
  noLessons: { color: '#888', fontSize: '13px', textAlign: 'center', padding: '12px' },
  lessonItem: {
    borderTop: '1px solid #eee',
    padding: '10px 0',
  },
  lessonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  lessonInfo: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, fontSize: '14px' },
  lessonOrderBadge: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  lessonTypeBadge: {
    padding: '2px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#495057',
    flexShrink: 0,
  },
  lessonMinutes: { fontSize: '12px', color: '#888', marginLeft: 'auto' },
  lessonActions: { display: 'flex', gap: '4px', flexShrink: 0 },
  addLessonForm: {
    marginTop: '12px',
    padding: '14px',
    border: '1px dashed #ccc',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
  },
  addLessonTitle: { margin: '0 0 10px 0', fontSize: '14px' },
  addLessonButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px dashed #0d9488',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#0d9488',
    width: '100%',
  },
  scheduleLiveButton: {
    marginTop: '8px',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px dashed #28a745',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#28a745',
    width: '100%',
  },
  addModuleForm: {
    marginTop: '16px',
    padding: '16px',
    border: '1px dashed #ccc',
    borderRadius: '6px',
    backgroundColor: '#fafafa',
  },
  addModuleTitle: { margin: '0 0 12px 0', fontSize: '15px' },
  thumbnailPreviewWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  thumbnailPreviewImg: {
    width: '100px',
    height: '60px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  removeThumbnailBtn: {
    padding: '4px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  addModuleButton: {
    padding: '10px 20px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '8px',
  },
};

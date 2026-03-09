import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Course, CourseModule, Lesson } from '../../types/course/course.types';
import { CourseEnrollment } from '../../types/course/enrollment.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { LiveSession } from '../../types/live/liveSession.types';
import { useAuth } from '../../context/AuthContext';

export const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleSessions, setModuleSessions] = useState<Record<string, LiveSession | null>>({});
  const [goingLive, setGoingLive] = useState<string | null>(null);
  const [schedulingModule, setSchedulingModule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadModuleSessions = async (courseId: string, moduleIds: string[]) => {
    try {
      const sessions = await liveSessionApi.getSessionsForCourse(courseId);
      const activeByModule: Record<string, LiveSession | null> = {};
      moduleIds.forEach(id => { activeByModule[id] = null; });
      for (const s of sessions) {
        if ((s.status === 'LIVE' || s.status === 'SCHEDULED') && s.moduleId) {
          const existing = activeByModule[s.moduleId];
          if (!existing || s.status === 'LIVE') {
            activeByModule[s.moduleId] = s;
          }
        }
      }
      setModuleSessions(activeByModule);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!courseId || !user || modules.length === 0) return;
    const moduleIds = modules.map(m => m.id);
    loadModuleSessions(courseId, moduleIds);
    const interval = setInterval(() => loadModuleSessions(courseId, moduleIds), 15000);
    return () => clearInterval(interval);
  }, [courseId, user, modules]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, modulesData] = await Promise.all([
        courseApi.getCourse(courseId!),
        courseApi.getModules(courseId!),
      ]);
      setCourse(courseData);
      setModules(modulesData.sort((a, b) => a.orderIndex - b.orderIndex));

      if (user) {
        try {
          const enrollments = await enrollmentApi.getMyEnrollments();
          const match = enrollments.find((e) => e.courseId === courseId);
          setEnrollment(match || null);
        } catch {
          setEnrollment(null);
        }
        loadModuleSessions(courseId!, modulesData.map(m => m.id));
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
      if (!moduleLessons[moduleId]) {
        try {
          const lessons = await courseApi.getLessonsForModule(courseId!, moduleId);
          setModuleLessons((prev) => ({
            ...prev,
            [moduleId]: lessons.sort((a, b) => a.orderIndex - b.orderIndex),
          }));
        } catch {
          // silently fail
        }
      }
    }
    setExpandedModules(next);
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError(null);
      const enrolled = await enrollmentApi.enroll(courseId!);
      setEnrollment(enrolled);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const isWithinWindow = (scheduledAt: string) => {
    const scheduled = new Date(scheduledAt).getTime();
    const nowMs = now.getTime();
    const oneHour = 60 * 60 * 1000;
    return nowMs >= scheduled - oneHour && nowMs <= scheduled + oneHour;
  };

  const formatScheduledTime = (scheduledAt: string) => {
    const d = new Date(scheduledAt);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleScheduleSession = async (mod: CourseModule) => {
    if (!scheduleDate || !scheduleTime) {
      setError('Please select both date and time');
      return;
    }
    try {
      setGoingLive(mod.id);
      setError(null);
      const scheduledAt = `${scheduleDate}T${scheduleTime}`;
      const session = await liveSessionApi.createSession({
        courseId: courseId!,
        moduleId: mod.id,
        title: `Live: ${mod.title}`,
        scheduledAt,
        durationMinutes: 60,
      });
      setModuleSessions(prev => ({ ...prev, [mod.id]: session }));
      setSchedulingModule(null);
      setScheduleDate('');
      setScheduleTime('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule session');
    } finally {
      setGoingLive(null);
    }
  };

  const handleStartSession = async (mod: CourseModule, sessionId: string) => {
    try {
      setGoingLive(mod.id);
      setError(null);
      const started = await liveSessionApi.startSession(sessionId);
      setModuleSessions(prev => ({ ...prev, [mod.id]: started }));
      navigate(`/room/${started.roomId}/broadcast`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start live session');
    } finally {
      setGoingLive(null);
    }
  };

  const handleCancelSession = async (moduleId: string, sessionId: string) => {
    try {
      await liveSessionApi.cancelSession(sessionId);
      setModuleSessions(prev => ({ ...prev, [moduleId]: null }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel session');
    }
  };

  const handleEndModuleSession = async (moduleId: string, sessionId: string) => {
    try {
      await liveSessionApi.endSession(sessionId);
      setModuleSessions(prev => ({ ...prev, [moduleId]: null }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to end session');
    }
  };

  const getDifficultyBadge = (level: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      BEGINNER: { bg: '#d4edda', text: '#155724' },
      INTERMEDIATE: { bg: '#fff3cd', text: '#856404' },
      ADVANCED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colorMap[level] || { bg: '#e2e3e5', text: '#383d41' };
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {level}
      </span>
    );
  };

  if (loading) return <div style={styles.loading}>Loading course...</div>;
  if (!course) return <div style={styles.error}>Course not found</div>;

  const isTeacher = user && course.teacherUserId === user.userId;
  const isEnrolled = enrollment != null;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/courses')} style={styles.backButton}>
        Back to Courses
      </button>

      <div style={styles.card}>
        {course.thumbnailUrl && (
          <img src={course.thumbnailUrl} alt={course.title} style={styles.thumbnail} />
        )}

        <div style={styles.cardContent}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{course.title}</h1>
            {getDifficultyBadge(course.difficultyLevel)}
          </div>

          <p style={styles.description}>{course.description}</p>

          {/* Teacher mini-card */}
          <div
            style={styles.teacherCard}
            onClick={() => navigate(`/teachers/${course.teacherUserId}`)}
          >
            <div style={styles.teacherAvatar}>
              {course.teacherProfileImageUrl ? (
                <img src={course.teacherProfileImageUrl} alt={course.teacherDisplayName} style={styles.teacherAvatarImg} />
              ) : (
                <span style={styles.teacherAvatarLetter}>
                  {course.teacherDisplayName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div style={styles.teacherInfo}>
              <div style={styles.teacherNameLink}>{course.teacherDisplayName}</div>
              {course.teacherHeadline && (
                <div style={styles.teacherHeadline}>{course.teacherHeadline}</div>
              )}
              {course.teacherAverageRating != null && course.teacherAverageRating > 0 && (
                <div style={styles.teacherRating}>
                  Rating: {course.teacherAverageRating.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          <div style={styles.meta}>
            <div style={styles.metaRow}>
              <span style={styles.label}>Subject:</span>
              <span>{course.subject}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Estimated Hours:</span>
              <span>{course.estimatedHours}h</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Modules:</span>
              <span>{course.moduleCount}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Lessons:</span>
              <span>{course.lessonCount}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Enrolled Students:</span>
              <span>{course.enrolledCount}</span>
            </div>
            {course.averageRating != null && course.averageRating > 0 && (
              <div style={styles.metaRow}>
                <span style={styles.label}>Rating:</span>
                <span>{course.averageRating.toFixed(1)}</span>
              </div>
            )}
            <div style={styles.metaRow}>
              <span style={styles.label}>Price:</span>
              <span style={styles.price}>
                {course.price > 0 ? `$${(course.price / 100).toFixed(2)}` : 'Free'}
              </span>
            </div>
          </div>

          {course.tags && (
            <div style={styles.tags}>
              {course.tags.split(',').map((t, i) => (
                <span key={i} style={styles.tag}>
                  {t.trim()}
                </span>
              ))}
            </div>
          )}

          {error && <div style={styles.errorMsg}>{error}</div>}

          <div style={styles.actions}>
            {isTeacher && (
              <button
                onClick={() => navigate(`/courses/${courseId}/builder`)}
                style={styles.editButton}
              >
                Edit / Manage Course
              </button>
            )}
            {!isTeacher && isEnrolled && (
              <button
                onClick={() => navigate(`/courses/${courseId}/learn`)}
                style={styles.continueButton}
              >
                Continue Learning
              </button>
            )}
            {!isTeacher && !isEnrolled && user && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={styles.enrollButton}
              >
                {enrolling
                  ? 'Enrolling...'
                  : `Enroll - ${course.price > 0 ? `$${(course.price / 100).toFixed(2)}` : 'Free'}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.modulesSection}>
        <h2 style={styles.modulesTitle}>Course Modules</h2>
        {modules.length === 0 ? (
          <p style={styles.empty}>No modules yet.</p>
        ) : (
          <div style={styles.moduleList}>
            {modules.map((mod, idx) => (
              <div key={mod.id} style={styles.moduleItem}>
                <div
                  style={styles.moduleHeader}
                  onClick={() => toggleModule(mod.id)}
                >
                  {mod.thumbnailUrl ? (
                    <img src={mod.thumbnailUrl} alt={mod.title} style={styles.moduleThumbnail} />
                  ) : (
                    <div style={styles.moduleThumbnailPlaceholder}>
                      <span style={styles.moduleThumbnailNumber}>{idx + 1}</span>
                    </div>
                  )}
                  <div style={styles.moduleContentArea}>
                    <div style={styles.moduleInfo}>
                      <strong>{mod.title}</strong>
                      <span style={styles.moduleMeta}>
                        {mod.lessonCount} lesson{mod.lessonCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {mod.description && (
                      <p style={styles.moduleDescInline}>{mod.description}</p>
                    )}
                  </div>
                  <span style={styles.moduleToggle}>
                    {expandedModules.has(mod.id) ? '[-]' : '[+]'}
                  </span>
                </div>
                {expandedModules.has(mod.id) && moduleLessons[mod.id] && (
                  <ul style={styles.lessonList}>
                    {moduleLessons[mod.id].map((lesson) => (
                      <li key={lesson.id} style={styles.lessonItem}>
                        <span style={styles.lessonType}>{lesson.type}</span>
                        <span>{lesson.title}</span>
                        {lesson.estimatedMinutes > 0 && (
                          <span style={styles.lessonDuration}>
                            {lesson.estimatedMinutes} min
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Per-module live session controls */}
                {(() => {
                  const session = moduleSessions[mod.id];
                  if (session?.status === 'LIVE') {
                    return (
                      <div style={styles.moduleLiveBar}>
                        <span style={styles.liveBadge}>LIVE</span>
                        {isTeacher && session.roomId && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/room/${session.roomId}/broadcast`); }}
                              style={styles.goLiveButton}
                            >
                              Go to Broadcast
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEndModuleSession(mod.id, session.id); }}
                              style={styles.endSessionButton}
                            >
                              End
                            </button>
                          </>
                        )}
                        {!isTeacher && isEnrolled && session.roomId && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/room/${session.roomId}/view`); }}
                            style={styles.goLiveButton}
                          >
                            Join Live
                          </button>
                        )}
                      </div>
                    );
                  }
                  if (isTeacher && session?.status === 'SCHEDULED') {
                    const inWindow = isWithinWindow(session.scheduledAt);
                    return (
                      <div style={styles.moduleLiveBar}>
                        <span style={styles.scheduledBadge}>
                          Scheduled: {formatScheduledTime(session.scheduledAt)}
                        </span>
                        {inWindow ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartSession(mod, session.id); }}
                            disabled={goingLive === mod.id}
                            style={styles.goLiveButton}
                          >
                            {goingLive === mod.id ? 'Starting...' : 'Start Live'}
                          </button>
                        ) : (
                          <span style={styles.publishHint}>
                            Available 1hr before scheduled time
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelSession(mod.id, session.id); }}
                          style={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  }
                  if (!isTeacher && session?.status === 'SCHEDULED') {
                    return (
                      <div style={styles.moduleLiveBar}>
                        <span style={styles.scheduledBadge}>
                          Scheduled: {formatScheduledTime(session.scheduledAt)}
                        </span>
                      </div>
                    );
                  }
                  if (isTeacher && !session) {
                    return (
                      <div style={styles.moduleLiveBar}>
                        {schedulingModule === mod.id ? (
                          <div style={styles.scheduleFormContainer} onClick={(e) => e.stopPropagation()}>
                            <label style={styles.scheduleLabel}>Schedule live session</label>
                            <div style={styles.scheduleFormRow}>
                              <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                style={styles.dateInput}
                              />
                              <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                style={styles.timeInput}
                              />
                              <button
                                onClick={() => handleScheduleSession(mod)}
                                disabled={goingLive === mod.id || !scheduleDate || !scheduleTime}
                                style={{
                                  ...styles.goLiveButton,
                                  ...(!scheduleDate || !scheduleTime ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}),
                                }}
                              >
                                {goingLive === mod.id ? 'Scheduling...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => { setSchedulingModule(null); setScheduleDate(''); setScheduleTime(''); }}
                                style={styles.cancelButton}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchedulingModule(mod.id);
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setScheduleDate(tomorrow.toISOString().split('T')[0]);
                              const hh = String(tomorrow.getHours()).padStart(2, '0');
                              const mm = String(tomorrow.getMinutes()).padStart(2, '0');
                              setScheduleTime(`${hh}:${mm}`);
                            }}
                            style={styles.scheduleButton}
                          >
                            Schedule Live Session
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    textAlign: 'center',
  },
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
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  thumbnail: { width: '100%', maxHeight: '300px', objectFit: 'cover' as const, display: 'block' },
  cardContent: { padding: '24px' },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  title: { margin: 0, fontSize: '24px' },
  description: { color: '#555', lineHeight: '1.6', marginBottom: '20px' },
  meta: { borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
  },
  label: { fontWeight: 'bold', color: '#666' },
  price: { fontWeight: 'bold', color: '#28a745', fontSize: '16px' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '16px' },
  tag: {
    padding: '4px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#495057',
  },
  errorMsg: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  editButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 'bold',
  },
  continueButton: {
    padding: '12px 24px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 'bold',
  },
  enrollButton: {
    padding: '12px 32px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  modulesSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  modulesTitle: { margin: '0 0 16px 0' },
  empty: { color: '#666', textAlign: 'center', padding: '20px' },
  moduleList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  moduleItem: {
    border: '1px solid #eee',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    backgroundColor: '#f8f9fa',
  },
  moduleToggle: { fontFamily: 'monospace', fontSize: '14px', color: '#007bff', flexShrink: 0 },
  moduleInfo: { display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' },
  moduleMeta: { fontSize: '13px', color: '#666' },
  moduleThumbnail: {
    width: '120px',
    height: '80px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    flexShrink: 0,
  },
  moduleThumbnailPlaceholder: {
    width: '120px',
    height: '80px',
    borderRadius: '6px',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleThumbnailNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#adb5bd',
  },
  moduleContentArea: {
    flex: 1,
    minWidth: 0,
  },
  moduleDescInline: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#666',
  },
  lessonList: {
    listStyle: 'none',
    margin: 0,
    padding: '0 16px 12px 152px',
  },
  lessonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderTop: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  lessonType: {
    padding: '2px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#495057',
    flexShrink: 0,
  },
  lessonDuration: { marginLeft: 'auto', fontSize: '12px', color: '#888' },
  moduleLiveBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px 12px 152px',
    flexWrap: 'wrap' as const,
  },
  liveBadge: {
    padding: '2px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    animation: 'none',
  },
  goLiveButton: {
    padding: '6px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  publishHint: {
    fontSize: '12px',
    color: '#856404',
    fontStyle: 'italic',
  },
  scheduledBadge: {
    padding: '3px 10px',
    backgroundColor: '#e8f4fd',
    color: '#0c5460',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  scheduleButton: {
    padding: '6px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  scheduleFormContainer: {
    width: '100%',
  },
  scheduleLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  scheduleFormRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px',
  },
  timeInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '110px',
  },
  cancelButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  teacherCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'box-shadow 0.2s',
  },
  teacherAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  teacherAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  teacherAvatarLetter: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'white',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherNameLink: {
    fontWeight: 'bold',
    color: '#007bff',
    fontSize: '15px',
  },
  teacherHeadline: {
    fontSize: '13px',
    color: '#666',
    marginTop: '2px',
  },
  teacherRating: {
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  endSessionButton: {
    padding: '8px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Course, CourseModule, Lesson } from '../../types/course/course.types';
import { CourseEnrollment } from '../../types/course/enrollment.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { LiveSession } from '../../types/live/liveSession.types';
import { useAuth } from '../../context/AuthContext';
import { CheckoutForm } from '../Payment/CheckoutForm';

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
  const [unenrolling, setUnenrolling] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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
          const match = enrollments.find((e) => e.courseId === courseId && e.status !== 'CANCELLED');
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

  const handleUnenroll = async () => {
    if (!enrollment) return;
    try {
      setUnenrolling(true);
      setError(null);
      await enrollmentApi.cancel(courseId!, enrollment.id);
      setEnrollment(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to unenroll');
    } finally {
      setUnenrolling(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setEnrolling(true);
      setError(null);
      const enrolled = await enrollmentApi.enroll(courseId!, paymentIntentId);
      setEnrollment(enrolled);
      setShowCheckout(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete enrollment after payment');
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
      BEGINNER: { bg: 'var(--success)', text: 'var(--bg-card)' },
      INTERMEDIATE: { bg: 'var(--warning)', text: 'var(--text-primary)' },
      ADVANCED: { bg: 'var(--danger)', text: 'var(--bg-card)' },
    };
    const color = colorMap[level] || { bg: 'var(--border-color)', text: 'var(--text-secondary)' };
    return (
      <span
        style={{
          padding: '4px 14px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: color.bg,
          color: color.text,
          letterSpacing: '0.5px',
          textTransform: 'uppercase' as const,
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
    <div style={styles.container} className="page-container">
      <button onClick={() => navigate('/courses')} style={styles.backButton}>
        Back to Courses
      </button>

      <div style={styles.card}>
        {/* Hero section */}
        <div style={styles.heroSection}>
          {course.thumbnailUrl ? (
            <>
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                style={styles.heroImage}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div style={styles.heroOverlay} />
            </>
          ) : (
            <div style={styles.heroGradient} />
          )}
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>{course.title}</h1>
            <div style={styles.heroBadgeRow}>
              {getDifficultyBadge(course.difficultyLevel)}
            </div>
          </div>
        </div>

        <div style={styles.cardContent}>
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

          {/* Stat card grid */}
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Subject</span>
              <span style={styles.statValue}>{course.subject}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Price</span>
              <span style={styles.statValuePrice}>
                {course.price > 0 ? `$${(course.price / 100).toFixed(2)}` : 'Free'}
              </span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Est. Hours</span>
              <span style={styles.statValue}>{course.estimatedHours}h</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Modules</span>
              <span style={styles.statValue}>{course.moduleCount}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Lessons</span>
              <span style={styles.statValue}>{course.lessonCount}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Enrolled</span>
              <span style={styles.statValue}>{course.enrolledCount}</span>
            </div>
            {course.averageRating != null && course.averageRating > 0 && (
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Rating</span>
                <span style={styles.statValue}>{course.averageRating.toFixed(1)}</span>
              </div>
            )}
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

          <div style={styles.actions} className="actions-row">
            {isTeacher && (
              <button
                onClick={() => navigate(`/courses/${courseId}/builder`)}
                style={styles.editButton}
              >
                Edit / Manage Course
              </button>
            )}
            {!isTeacher && isEnrolled && (
              <>
                <button
                  onClick={() => navigate(`/courses/${courseId}/learn`)}
                  style={styles.continueButton}
                >
                  Continue Learning
                </button>
                <button
                  onClick={handleUnenroll}
                  disabled={unenrolling}
                  style={styles.unenrollButton}
                >
                  {unenrolling ? 'Unenrolling...' : 'Unenroll'}
                </button>
              </>
            )}
            {!isTeacher && !isEnrolled && user && !showCheckout && (
              <button
                onClick={() => {
                  if (course.price > 0) {
                    setShowCheckout(true);
                  } else {
                    handleEnroll();
                  }
                }}
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

      {showCheckout && course && (
        <CheckoutForm
          courseId={courseId!}
          amount={course.price}
          currency={course.currency || 'USD'}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowCheckout(false)}
        />
      )}

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
                  <div style={styles.moduleThumbnailWrapper}>
                    <div style={styles.moduleThumbnailPlaceholder}>
                      <span style={styles.moduleThumbnailNumber}>{idx + 1}</span>
                    </div>
                    {mod.thumbnailUrl && (
                      <img
                        src={mod.thumbnailUrl}
                        alt={mod.title}
                        style={styles.moduleThumbnailOverlay}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
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
                    {expandedModules.has(mod.id) ? '\u25BC' : '\u25B6'}
                  </span>
                </div>
                {expandedModules.has(mod.id) && moduleLessons[mod.id] && (
                  <ul style={styles.lessonList} className="module-lessons">
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
                                  ...(!scheduleDate || !scheduleTime ? { backgroundColor: 'var(--border-color)', cursor: 'not-allowed' } : {}),
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
  loading: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
  error: {
    color: 'var(--danger)',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '20px',
    transition: 'background-color 0.2s',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
    marginBottom: '24px',
  },
  heroSection: {
    position: 'relative' as const,
    width: '100%',
    minHeight: '220px',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '280px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  heroOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
  },
  heroGradient: {
    width: '100%',
    height: '220px',
    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
  },
  heroContent: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px',
    zIndex: 1,
  },
  heroTitle: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    lineHeight: 1.2,
  },
  heroBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  thumbnail: { width: '100%', maxHeight: '300px', objectFit: 'cover' as const, display: 'block' },
  cardContent: { padding: '24px' },
  description: { color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px', fontSize: '15px' },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    gap: '6px',
    textAlign: 'center' as const,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statValuePrice: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--success)',
  },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '20px' },
  tag: {
    padding: '5px 12px',
    backgroundColor: 'var(--accent-light)',
    borderRadius: '16px',
    fontSize: '12px',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  errorMsg: {
    color: 'var(--danger)',
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--danger)',
    fontSize: '14px',
  },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  editButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  continueButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  unenrollButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--danger)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  enrollButton: {
    padding: '12px 32px',
    backgroundColor: 'var(--success)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 700,
    transition: 'background-color 0.2s',
  },
  modulesSection: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow)',
  },
  modulesTitle: { margin: '0 0 16px 0', color: 'var(--text-primary)' },
  empty: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' },
  moduleList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  moduleItem: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-secondary)',
    transition: 'background-color 0.15s',
  },
  moduleToggle: { fontSize: '14px', color: 'var(--accent)', flexShrink: 0 },
  moduleInfo: { display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' },
  moduleMeta: { fontSize: '13px', color: 'var(--text-secondary)' },
  moduleThumbnailWrapper: {
    position: 'relative' as const,
    width: '120px',
    height: '80px',
    flexShrink: 0,
  },
  moduleThumbnailOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    borderRadius: '8px',
  },
  moduleThumbnailPlaceholder: {
    width: '120px',
    height: '80px',
    borderRadius: '8px',
    backgroundColor: 'var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleThumbnailNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
  },
  moduleContentArea: {
    flex: 1,
    minWidth: 0,
  },
  moduleDescInline: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
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
    borderTop: '1px solid var(--border-color)',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  lessonType: {
    padding: '3px 10px',
    backgroundColor: 'var(--accent-light)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent)',
    flexShrink: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  lessonDuration: { marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' },
  moduleLiveBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px 12px 152px',
    flexWrap: 'wrap' as const,
  },
  liveBadge: {
    padding: '3px 12px',
    backgroundColor: 'var(--success)',
    color: 'var(--bg-card)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    animation: 'none',
  },
  goLiveButton: {
    padding: '8px 18px',
    backgroundColor: 'var(--success)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  publishHint: {
    fontSize: '12px',
    color: 'var(--warning)',
    fontStyle: 'italic',
  },
  scheduledBadge: {
    padding: '4px 12px',
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent)',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 600,
  },
  scheduleButton: {
    padding: '8px 18px',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  scheduleFormContainer: {
    width: '100%',
  },
  scheduleLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
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
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '150px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  timeInput: {
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '110px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--text-muted)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
  teacherCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'box-shadow 0.2s, transform 0.15s',
  },
  teacherAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
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
    color: 'var(--bg-card)',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherNameLink: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontSize: '15px',
  },
  teacherHeadline: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  teacherRating: {
    fontSize: '12px',
    color: 'var(--warning)',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  endSessionButton: {
    padding: '8px 20px',
    backgroundColor: 'var(--danger)',
    color: 'var(--bg-card)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
  },
};

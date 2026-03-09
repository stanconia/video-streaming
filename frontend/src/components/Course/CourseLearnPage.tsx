import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseModule, Lesson } from '../../types/course/course.types';
import { CourseProgress, LessonProgress } from '../../types/course/enrollment.types';
import { courseApi } from '../../services/api/course/CourseApi';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { LiveSession } from '../../types/live/liveSession.types';
import { useAuth } from '../../context/AuthContext';

interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

export const CourseLearnPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const { user } = useAuth();

  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  useEffect(() => {
    if (modules.length > 0 && !loading) {
      selectLesson();
    }
  }, [lessonId, modules, loading]);

  useEffect(() => {
    if (!courseId) return;
    const interval = setInterval(async () => {
      try {
        const sessions = await liveSessionApi.getSessionsForCourse(courseId);
        setLiveSessions(sessions);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modulesData, progressData] = await Promise.all([
        courseApi.getModules(courseId!),
        enrollmentApi.getCourseProgress(courseId!),
      ]);

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
      setProgress(progressData);
      try {
        const sessions = await liveSessionApi.getSessionsForCourse(courseId!);
        setLiveSessions(sessions);
      } catch { /* ignore */ }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = () => {
    if (lessonId) {
      for (const mod of modules) {
        const found = mod.lessons.find((l) => l.id === lessonId);
        if (found) {
          setActiveLesson(found);
          return;
        }
      }
    }
    // Default to first lesson
    for (const mod of modules) {
      if (mod.lessons.length > 0) {
        setActiveLesson(mod.lessons[0]);
        return;
      }
    }
    setActiveLesson(null);
  };

  const allLessons = useMemo(() => {
    const flat: Lesson[] = [];
    modules.forEach((m) => flat.push(...m.lessons));
    return flat;
  }, [modules]);

  const completedLessonIds = useMemo(() => {
    const set = new Set<string>();
    if (progress) {
      progress.modules.forEach((m) => {
        m.lessons.forEach((l) => {
          if (l.completed) set.add(l.lessonId);
        });
      });
    }
    return set;
  }, [progress]);

  const currentIndex = activeLesson
    ? allLessons.findIndex((l) => l.id === activeLesson.id)
    : -1;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const isLessonComplete = activeLesson
    ? completedLessonIds.has(activeLesson.id)
    : false;

  const handleToggleComplete = async () => {
    if (!activeLesson) return;
    try {
      setToggling(true);
      if (isLessonComplete) {
        await enrollmentApi.markLessonIncomplete(courseId!, activeLesson.id);
      } else {
        await enrollmentApi.markLessonComplete(courseId!, activeLesson.id);
      }
      const updatedProgress = await enrollmentApi.getCourseProgress(courseId!);
      setProgress(updatedProgress);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update completion status');
    } finally {
      setToggling(false);
    }
  };

  const navigateToLesson = (lesson: Lesson) => {
    navigate(`/courses/${courseId}/learn/${lesson.id}`);
    setActiveLesson(lesson);
  };

  if (loading) return <div style={styles.loading}>Loading course...</div>;

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.layout} className="learn-layout">
        {/* Left sidebar */}
        <div style={styles.sidebar} className="learn-sidebar">
          <div style={styles.sidebarHeader}>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              style={styles.backLink}
            >
              Back to Course
            </button>
            {progress && (
              <div style={styles.overallProgress}>
                <span style={styles.progressText}>
                  {Math.round(progress.progressPercentage)}% complete
                </span>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${progress.progressPercentage}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {liveSessions.filter(s => s.status === 'LIVE').length > 0 && (
            <div style={styles.liveBanner}>
              <strong>LIVE NOW</strong>
              {liveSessions.filter(s => s.status === 'LIVE').map(s => (
                <div key={s.id} style={styles.liveItem}>
                  <span>{s.title}</span>
                  <button
                    onClick={() => navigate(`/room/${s.roomId}/view`)}
                    style={styles.joinLiveButton}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}

          {liveSessions.filter(s => s.status === 'SCHEDULED').length > 0 && (
            <div style={styles.upcomingSessions}>
              <div style={styles.upcomingTitle}>Upcoming Sessions</div>
              {liveSessions.filter(s => s.status === 'SCHEDULED').slice(0, 3).map(s => (
                <div key={s.id} style={styles.upcomingItem}>
                  <div style={styles.upcomingItemTitle}>{s.title}</div>
                  <div style={styles.upcomingItemDate}>
                    {new Date(s.scheduledAt).toLocaleDateString()} at{' '}
                    {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.moduleTree}>
            {modules.map((mod) => (
              <div key={mod.id} style={styles.treeModule}>
                <div style={{ ...styles.treeModuleTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {mod.thumbnailUrl && (
                    <img src={mod.thumbnailUrl} alt={mod.title} style={{
                      width: '32px', height: '22px', borderRadius: '3px',
                      objectFit: 'cover' as const, flexShrink: 0,
                    }} />
                  )}
                  <span>{mod.title}</span>
                </div>
                <ul style={styles.treeList}>
                  {mod.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isComplete = completedLessonIds.has(lesson.id);
                    return (
                      <li
                        key={lesson.id}
                        style={{
                          ...styles.treeItem,
                          backgroundColor: isActive ? '#e8f0fe' : 'transparent',
                          fontWeight: isActive ? 'bold' : 'normal',
                        }}
                        onClick={() => navigateToLesson(lesson)}
                      >
                        <span style={styles.checkMark}>
                          {isComplete ? '[x]' : '[ ]'}
                        </span>
                        <span style={styles.treeLessonTitle}>{lesson.title}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div style={styles.mainContent} className="learn-main">
          {activeLesson ? (
            <>
              <div style={styles.lessonHeader}>
                <div>
                  <span style={styles.lessonTypeBadge}>{activeLesson.type}</span>
                  <h2 style={styles.lessonTitle}>{activeLesson.title}</h2>
                  {activeLesson.estimatedMinutes > 0 && (
                    <span style={styles.lessonDuration}>
                      Estimated: {activeLesson.estimatedMinutes} min
                    </span>
                  )}
                </div>
                <button
                  onClick={handleToggleComplete}
                  disabled={toggling}
                  style={
                    isLessonComplete
                      ? styles.markIncompleteButton
                      : styles.markCompleteButton
                  }
                >
                  {toggling
                    ? 'Updating...'
                    : isLessonComplete
                    ? 'Mark Incomplete'
                    : 'Mark Complete'}
                </button>
              </div>

              <div style={styles.lessonContent}>
                {activeLesson.type === 'TEXT' && (
                  <div style={styles.textContent}>{activeLesson.content}</div>
                )}
                {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (
                  <div style={styles.videoContainer}>
                    <video
                      src={activeLesson.videoUrl}
                      controls
                      style={styles.videoPlayer}
                    />
                    {activeLesson.content && (
                      <div style={styles.videoDescription}>
                        {activeLesson.content}
                      </div>
                    )}
                  </div>
                )}
                {activeLesson.type === 'FILE' && activeLesson.fileUrl && (
                  <div style={styles.fileContainer}>
                    <a
                      href={activeLesson.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      Download File
                    </a>
                    {activeLesson.content && (
                      <div style={styles.fileDescription}>
                        {activeLesson.content}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.navigation} className="lesson-nav">
                {prevLesson ? (
                  <button
                    onClick={() => navigateToLesson(prevLesson)}
                    style={styles.navButton}
                  >
                    Previous: {prevLesson.title}
                  </button>
                ) : (
                  <div />
                )}
                {nextLesson ? (
                  <button
                    onClick={() => navigateToLesson(nextLesson)}
                    style={styles.navButtonNext}
                  >
                    Next: {nextLesson.title}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </>
          ) : (
            <div style={styles.noContent}>
              <p>No lessons available in this course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '0', maxWidth: '100%', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  errorBanner: {
    color: '#721c24',
    padding: '12px 20px',
    backgroundColor: '#f8d7da',
    borderRadius: '0',
  },
  layout: { display: 'flex', minHeight: 'calc(100vh - 60px)' },
  sidebar: {
    width: '300px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    overflowY: 'auto' as const,
    flexShrink: 0,
  },
  sidebarHeader: { padding: '16px', borderBottom: '1px solid #eee' },
  backLink: {
    padding: '6px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '10px',
    display: 'block',
  },
  overallProgress: { marginTop: '8px' },
  progressText: { fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px', display: 'block' },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  moduleTree: { padding: '8px 0' },
  treeModule: { marginBottom: '4px' },
  treeModuleTitle: {
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  treeList: { listStyle: 'none', margin: 0, padding: 0 },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px 8px 20px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#333',
    borderBottom: '1px solid #f5f5f5',
  },
  checkMark: { fontFamily: 'monospace', fontSize: '12px', color: '#28a745', flexShrink: 0 },
  treeLessonTitle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  mainContent: {
    flex: 1,
    padding: '24px 32px',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto' as const,
  },
  lessonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
  },
  lessonTypeBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '6px',
  },
  lessonTitle: { margin: '0 0 4px 0', fontSize: '22px' },
  lessonDuration: { fontSize: '13px', color: '#888' },
  markCompleteButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  markIncompleteButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  lessonContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    minHeight: '300px',
    marginBottom: '24px',
  },
  textContent: { lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' as const },
  videoContainer: {},
  videoPlayer: { width: '100%', maxHeight: '480px', borderRadius: '4px', backgroundColor: '#000' },
  videoDescription: { marginTop: '16px', lineHeight: '1.6', fontSize: '14px', color: '#555' },
  fileContainer: {},
  fileLink: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  fileDescription: { marginTop: '16px', lineHeight: '1.6', fontSize: '14px', color: '#555' },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '8px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#e9ecef',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    maxWidth: '45%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  navButtonNext: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    maxWidth: '45%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  noContent: { textAlign: 'center', padding: '60px', color: '#888' },
  liveBanner: {
    margin: '0 12px',
    padding: '12px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
    borderLeft: '4px solid #28a745',
  },
  liveItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    fontSize: '13px',
  },
  joinLiveButton: {
    padding: '4px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  upcomingSessions: {
    margin: '8px 12px',
    padding: '10px',
    backgroundColor: '#f0f7ff',
    borderRadius: '6px',
  },
  upcomingTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: '6px',
  },
  upcomingItem: {
    padding: '6px 0',
    borderTop: '1px solid #d6e9f8',
  },
  upcomingItemTitle: { fontSize: '13px', fontWeight: 'bold', color: '#333' },
  upcomingItemDate: { fontSize: '11px', color: '#666' },
};

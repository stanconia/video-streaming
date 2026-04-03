import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/api/admin/DashboardApi';
import { courseApi } from '../../services/api/course/CourseApi';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { liveSessionApi } from '../../services/api/live/LiveSessionApi';
import { teacherApi } from '../../services/api/social/TeacherApi';
import { StudentDashboardData, TeacherDashboardData } from '../../types/admin/dashboard.types';
import { Course } from '../../types/course/course.types';
import { CourseEnrollment } from '../../types/course/enrollment.types';
import { LiveSession } from '../../types/live/liveSession.types';
import { TeacherProfile } from '../../types/social/teacher.types';
import { EarningsChart } from '../Dashboard/EarningsChart';

// ──────────────────────────────────────────────
// Landing page for unauthenticated users
// ──────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseApi.searchCourses({ sortBy: 'popular', size: 4 })
      .then((r) => setCourses(r.content))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Landing Navbar */}
      <div style={styles.landingNav}>
        <div style={styles.landingNavInner}>
          <span style={styles.landingBrand}>LearningHaven</span>
          <div style={styles.landingNavLinks}>
            <button onClick={() => navigate('/login')} style={styles.landingNavLink}>Log In</button>
            <button onClick={() => navigate('/register')} style={styles.landingSignup}>Sign Up</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.landingHero}>
        <h1 style={styles.landingTitle}>Learn from Expert Teachers, Live</h1>
        <p style={styles.landingSub}>
          Join thousands of students learning through interactive live classes,
          structured courses, and a supportive community.
        </p>
        <div style={styles.heroActions}>
          <button onClick={() => navigate('/register')} style={styles.btnPrimary}>Get Started Free</button>
          <button onClick={() => navigate('/register')} style={styles.btnSecondary}>Become a Teacher</button>
        </div>
      </div>

      <div style={styles.landingContent}>
      {/* How it works */}
      <div style={styles.sectionCenter}>
        <h2 style={styles.sectionTitleCenter}>How It Works</h2>
        <div style={styles.howGrid}>
          {[
            { num: '1', title: 'Browse & Discover', desc: 'Explore courses across dozens of subjects. Filter by difficulty, price, rating, and more.' },
            { num: '2', title: 'Enroll & Learn', desc: 'Enroll in courses with structured lessons, quizzes, and assignments. Track your progress as you go.' },
            { num: '3', title: 'Join Live Classes', desc: 'Attend live sessions with real-time video, chat, polls, and interactive whiteboards.' },
          ].map((s) => (
            <div key={s.num} style={styles.howStep}>
              <div style={styles.howNumber}>{s.num}</div>
              <div style={styles.howTitle}>{s.title}</div>
              <div style={styles.howDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={styles.sectionCenter}>
        <h2 style={styles.sectionTitleCenter}>Everything You Need to Learn</h2>
        <div style={styles.featuresGrid}>
          {[
            { icon: '\ud83c\udfa5', title: 'Live Classes', desc: 'Join interactive live sessions with video, screenshare, chat, and real-time collaboration.' },
            { icon: '\ud83d\udcda', title: 'Structured Courses', desc: 'Learn at your pace with organized modules, lessons, and progress tracking.' },
            { icon: '\ud83d\udcdd', title: 'Quizzes & Assignments', desc: 'Test your knowledge with quizzes and submit assignments for teacher feedback.' },
            { icon: '\ud83c\udfc6', title: 'Certificates', desc: 'Earn certificates when you complete courses to showcase your achievements.' },
          ].map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Courses */}
      {courses.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Popular Courses</h2>
            <Link to="/courses" style={styles.sectionLink}>View All &rarr;</Link>
          </div>
          <div style={styles.courseGrid} className="course-grid">
            {courses.map((c) => (
              <div key={c.id} style={styles.courseCard} className="course-card"
                   onClick={() => navigate(`/courses/${c.id}`)}>
                <div style={styles.courseThumb}>
                  {c.thumbnailUrl
                    ? <img src={c.thumbnailUrl} alt={c.title} style={styles.courseThumbImg} />
                    : <span style={styles.courseThumbIcon}>{'\ud83d\udcda'}</span>}
                  <span style={c.price === 0 ? styles.badgeFree : styles.badgePrice}>
                    {c.price === 0 ? 'Free' : `$${(c.price / 100).toFixed(2)}`}
                  </span>
                </div>
                <div style={styles.courseBody}>
                  <div style={styles.courseName}>{c.title}</div>
                  <div style={styles.courseMeta}>
                    {c.averageRating && <span style={styles.courseRating}>{'\u2733'} {c.averageRating.toFixed(1)}</span>}
                    <span>{c.enrolledCount} enrolled</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={styles.ctaBanner}>
        <h2 style={styles.ctaTitle}>Ready to Start Learning?</h2>
        <p style={styles.ctaSub}>Join LearningHaven today and get access to courses from expert teachers.</p>
        <button onClick={() => navigate('/register')} style={styles.btnPrimary}>Create Free Account</button>
      </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Student home view
// ──────────────────────────────────────────────
function StudentHome({ user }: { user: { displayName: string } }) {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);

  useEffect(() => {
    dashboardApi.getStudentDashboard().then(setData).catch(() => {});
    enrollmentApi.getMyEnrollments().then((e) => setEnrollments(e.filter((x) => x.status === 'ACTIVE').slice(0, 3))).catch(() => {});
    liveSessionApi.getMyUpcoming().then(setSessions).catch(() => {});
    courseApi.searchCourses({ sortBy: 'popular', size: 4 }).then((r) => setCourses(r.content)).catch(() => {});
    teacherApi.searchTeachers().then((t) => setTeachers(t.slice(0, 4))).catch(() => {});
  }, []);

  const activeCount = data?.activeEnrollments ?? 0;

  return (
    <div>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome back, {user.displayName.split(' ')[0]}</h1>
        <p style={styles.heroSub}>
          {activeCount > 0
            ? `You have ${activeCount} course${activeCount > 1 ? 's' : ''} in progress. Keep up the great work!`
            : 'Ready to start learning? Browse courses to get started.'}
        </p>
        <div style={styles.heroActions}>
          <button onClick={() => navigate('/courses')} style={styles.btnPrimary}>Browse Courses</button>
          <button onClick={() => navigate('/my-enrollments')} style={styles.btnSecondary}>My Enrollments</button>
          <button onClick={() => navigate('/progress')} style={styles.btnSecondary}>My Progress</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions} className="quick-actions-grid">
        {[
          { icon: '\ud83d\udcda', label: 'My Courses', sub: 'Continue learning', path: '/my-enrollments' },
          { icon: '\ud83d\udd0d', label: 'Browse Courses', sub: 'Discover new topics', path: '/courses' },
          { icon: '\ud83d\udcac', label: 'Messages', sub: 'Conversations', path: '/messages' },
          { icon: '\ud83d\udcc5', label: 'Calendar', sub: 'Upcoming sessions', path: '/calendar' },
        ].map((a) => (
          <div key={a.label} style={styles.quickAction} className="course-card" onClick={() => navigate(a.path)}>
            <div style={styles.qaIcon}>{a.icon}</div>
            <div>
              <div style={styles.qaLabel}>{a.label}</div>
              <div style={styles.qaSub}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      {data && (
        <div style={styles.statsRow} className="stats-grid">
          <div style={styles.statCard}><div style={styles.statLabel}>Active Courses</div><div style={{ ...styles.statValue, color: 'var(--accent)' }}>{data.activeEnrollments}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Completed</div><div style={{ ...styles.statValue, color: 'var(--success)' }}>{data.completedCourses}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Total Enrollments</div><div style={styles.statValue}>{data.totalEnrollments}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Total Spent</div><div style={{ ...styles.statValue, color: 'var(--warning)' }}>${data.totalSpent.toFixed(2)}</div></div>
        </div>
      )}

      {/* Continue Learning */}
      {enrollments.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Continue Learning</h2>
            <Link to="/my-enrollments" style={styles.sectionLink}>View All &rarr;</Link>
          </div>
          <div style={styles.learningGrid}>
            {enrollments.map((e) => (
              <div key={e.id} style={styles.learningCard} className="course-card"
                   onClick={() => navigate(`/courses/${e.courseId}/learn`)}>
                <div style={styles.learningThumb}>
                  <span style={styles.learningThumbIcon}>{'\ud83d\udcda'}</span>
                </div>
                <div style={styles.learningBody}>
                  <div style={styles.learningTitle}>{e.courseTitle}</div>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${e.progressPercentage}%` }} />
                  </div>
                  <div style={styles.progressText}>
                    <span>{Math.round(e.progressPercentage)}% complete</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Enrollments */}
      {data && data.recentEnrollments.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Recent Enrollments</h2>
            <Link to="/my-enrollments" style={styles.sectionLink}>View All &rarr;</Link>
          </div>
          <div style={styles.sessionList}>
            {data.recentEnrollments.map((e) => (
              <div key={e.id} style={{ ...styles.sessionCard, cursor: 'pointer' }}
                   onClick={() => navigate(`/courses/${e.courseId}/learn`)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={styles.sessionTitle}>{e.courseTitle}</div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
                      background: e.status === 'COMPLETED' ? 'var(--success-light)' : 'var(--accent-light)',
                      color: e.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent)',
                    }}>{e.status}</span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${e.progressPercentage}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={styles.progressText}>{Math.round(e.progressPercentage)}% complete</span>
                    <span style={styles.progressText}>Enrolled {new Date(e.enrolledAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {sessions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Upcoming Live Sessions</h2>
            <Link to="/calendar" style={styles.sectionLink}>View Calendar &rarr;</Link>
          </div>
          <div style={styles.sessionList}>
            {sessions.slice(0, 3).map((s) => {
              const d = new Date(s.scheduledAt);
              return (
                <div key={s.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionDate}>
                      <div style={styles.sessionMonth}>{d.toLocaleString('default', { month: 'short' })}</div>
                      <div style={styles.sessionDay}>{d.getDate()}</div>
                    </div>
                    <div>
                      <div style={styles.sessionTitle}>{s.title}</div>
                      <div style={styles.sessionMeta}>{s.teacherDisplayName} &middot; {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {s.durationMinutes} min</div>
                    </div>
                  </div>
                  {s.status === 'LIVE'
                    ? <button style={styles.joinBtn} onClick={() => navigate(`/room/${s.roomId}/view`)}>Join Now</button>
                    : <span style={styles.sessionBadge}>Scheduled</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Courses */}
      {courses.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Recommended For You</h2>
            <Link to="/courses" style={styles.sectionLink}>Browse All &rarr;</Link>
          </div>
          <div style={styles.courseGrid} className="course-grid">
            {courses.map((c) => (
              <div key={c.id} style={styles.courseCard} className="course-card"
                   onClick={() => navigate(`/courses/${c.id}`)}>
                <div style={styles.courseThumb}>
                  {c.thumbnailUrl
                    ? <img src={c.thumbnailUrl} alt={c.title} style={styles.courseThumbImg} />
                    : <span style={styles.courseThumbIcon}>{'\ud83d\udcda'}</span>}
                  <span style={c.price === 0 ? styles.badgeFree : styles.badgePrice}>
                    {c.price === 0 ? 'Free' : `$${(c.price / 100).toFixed(2)}`}
                  </span>
                </div>
                <div style={styles.courseBody}>
                  <div style={styles.courseName}>{c.title}</div>
                  <div style={styles.courseMeta}>
                    {c.averageRating && <span style={styles.courseRating}>{'\u2605'} {c.averageRating.toFixed(1)}</span>}
                    <span>{c.enrolledCount} enrolled</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Teachers */}
      {teachers.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Top Teachers</h2>
            <Link to="/teachers" style={styles.sectionLink}>View All &rarr;</Link>
          </div>
          <div style={styles.teacherGrid} className="course-grid">
            {teachers.map((t) => (
              <div key={t.id} style={styles.teacherCard} className="course-card"
                   onClick={() => navigate(`/teachers/${t.userId}`)}>
                <div style={styles.teacherAvatar}>
                  {t.profileImageUrl
                    ? <img src={t.profileImageUrl} alt={t.displayName} style={styles.teacherAvatarImg} />
                    : t.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={styles.teacherName}>{t.displayName}</div>
                <div style={styles.teacherSubject}>{t.subjects?.split(',')[0] || 'Teacher'}</div>
                {t.averageRating > 0 && (
                  <div style={styles.teacherStars}>{'\u2605'} {t.averageRating.toFixed(1)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Teacher home view
// ──────────────────────────────────────────────
function TeacherHome({ user }: { user: { displayName: string } }) {
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    dashboardApi.getTeacherDashboard().then(setData).catch(() => {});
    liveSessionApi.getMyUpcoming().then(setSessions).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ ...styles.hero, background: 'linear-gradient(135deg, #1a237e 0%, #4a148c 100%)' }}>
        <h1 style={styles.heroTitle}>Welcome back, {user.displayName.split(' ')[0]}</h1>
        <p style={styles.heroSub}>
          {data ? `You have ${data.totalClasses} course${data.totalClasses !== 1 ? 's' : ''} and ${data.totalStudents} student${data.totalStudents !== 1 ? 's' : ''}.` : 'Loading your dashboard...'}
        </p>
        <div style={styles.heroActions}>
          <button onClick={() => navigate('/courses/create')} style={styles.btnPrimary}>Create Course</button>
          <button onClick={() => navigate('/my-courses')} style={styles.btnSecondary}>My Courses</button>
          <button onClick={() => navigate('/earnings')} style={styles.btnSecondary}>View Earnings</button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div style={styles.statsRow} className="stats-grid">
          <div style={styles.statCard}><div style={styles.statLabel}>Total Students</div><div style={{ ...styles.statValue, color: 'var(--accent)' }}>{data.totalStudents}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Active Courses</div><div style={styles.statValue}>{data.totalClasses}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Total Earnings</div><div style={{ ...styles.statValue, color: 'var(--success)' }}>${data.totalEarnings.toFixed(2)}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Avg Rating</div><div style={{ ...styles.statValue, color: 'var(--warning)' }}>{data.averageRating.toFixed(1)} {'\u2605'}</div></div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.quickActions} className="quick-actions-grid">
        {[
          { icon: '\u2795', label: 'Create Course', sub: 'Add new content', path: '/courses/create' },
          { icon: '\ud83d\udcda', label: 'My Courses', sub: `${data?.totalClasses ?? 0} published`, path: '/my-courses' },
          { icon: '\ud83d\udcc8', label: 'Analytics', sub: 'View performance', path: '/dashboard/teacher' },
          { icon: '\ud83d\udcb0', label: 'Earnings', sub: `$${data?.totalEarnings.toFixed(0) ?? '0'}`, path: '/earnings' },
        ].map((a) => (
          <div key={a.label} style={styles.quickAction} className="course-card" onClick={() => navigate(a.path)}>
            <div style={styles.qaIcon}>{a.icon}</div>
            <div>
              <div style={styles.qaLabel}>{a.label}</div>
              <div style={styles.qaSub}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Earnings Chart */}
      {data && data.monthlyEarnings.length > 0 && (
        <div style={styles.section}>
          <EarningsChart data={data.monthlyEarnings} />
        </div>
      )}

      {/* Upcoming Sessions */}
      {sessions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitleText}>Upcoming Live Sessions</h2>
            <Link to="/calendar" style={styles.sectionLink}>View Calendar &rarr;</Link>
          </div>
          <div style={styles.sessionList}>
            {sessions.slice(0, 3).map((s) => {
              const d = new Date(s.scheduledAt);
              return (
                <div key={s.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionDate}>
                      <div style={styles.sessionMonth}>{d.toLocaleString('default', { month: 'short' })}</div>
                      <div style={styles.sessionDay}>{d.getDate()}</div>
                    </div>
                    <div>
                      <div style={styles.sessionTitle}>{s.title}</div>
                      <div style={styles.sessionMeta}>{s.courseTitle} &middot; {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  {s.status === 'LIVE'
                    ? <button style={styles.joinBtn} onClick={() => navigate(`/room/${s.roomId}/broadcast`)}>Start Session</button>
                    : <span style={styles.sessionBadge}>Scheduled</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main HomePage export
// ──────────────────────────────────────────────
export function HomePage() {
  const { user } = useAuth();

  if (!user) return <div><LandingPage /></div>;

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {user.role === 'TEACHER'
        ? <TeacherHome user={user} />
        : <StudentHome user={user} />}
    </div>
  );
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles: { [key: string]: React.CSSProperties } = {
  // Hero
  hero: {
    background: 'var(--gradient-primary)',
    borderRadius: '16px',
    padding: '48px 40px',
    color: '#fff',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroTitle: { fontSize: '32px', fontWeight: 700, marginBottom: '8px' },
  heroSub: { fontSize: '16px', opacity: 0.9, marginBottom: '24px' },
  heroActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  btnPrimary: {
    padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    border: 'none', cursor: 'pointer', background: '#fff', color: '#667eea',
  },
  btnSecondary: {
    padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', background: 'rgba(255,255,255,0.2)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
  },

  // Landing hero
  landingHero: {
    background: 'var(--gradient-primary)',
    borderRadius: '16px',
    padding: '80px 40px',
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: '48px',
    position: 'relative',
    overflow: 'hidden',
  },
  landingTitle: { fontSize: '44px', fontWeight: 700, marginBottom: '16px' },
  landingSub: { fontSize: '18px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 },

  // Quick Actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  quickAction: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'var(--bg-card)', borderRadius: '12px', padding: '16px',
    border: '1px solid var(--border-color)', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  qaIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', background: 'var(--accent-light)',
  },
  qaLabel: { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' },
  qaSub: { fontSize: '12px', color: 'var(--text-muted)' },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'var(--bg-card)', borderRadius: '12px', padding: '20px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)',
  },
  statLabel: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' },
  statValue: { fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' },

  // Sections
  section: { marginBottom: '32px' },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
  },
  sectionTitleText: { fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' },
  sectionLink: { fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 },
  sectionCenter: { marginBottom: '48px', textAlign: 'center' as const },
  sectionTitleCenter: { fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '32px' },

  // Continue Learning
  learningGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px',
  },
  learningCard: {
    background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', cursor: 'pointer',
  },
  learningThumb: {
    height: '120px', background: 'linear-gradient(135deg, var(--bg-secondary), var(--border-color))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  learningThumbIcon: { fontSize: '36px', opacity: 0.4 },
  learningBody: { padding: '16px' },
  learningTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' },
  progressBarBg: { height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' },
  progressBarFill: {
    height: '100%', background: 'linear-gradient(90deg, var(--accent), #667eea)', borderRadius: '3px',
  },
  progressText: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' },

  // Sessions
  sessionList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  sessionCard: {
    background: 'var(--bg-card)', borderRadius: '12px', padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)',
    flexWrap: 'wrap' as const, gap: '12px',
  },
  sessionInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  sessionDate: {
    background: 'var(--accent-light)', borderRadius: '10px', padding: '10px 14px',
    textAlign: 'center' as const, minWidth: '56px',
  },
  sessionMonth: { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const, fontWeight: 600 },
  sessionDay: { fontSize: '22px', fontWeight: 700, color: 'var(--accent)' },
  sessionTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' },
  sessionMeta: { fontSize: '13px', color: 'var(--text-secondary)' },
  joinBtn: {
    padding: '10px 20px', background: 'var(--success)', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  sessionBadge: {
    padding: '6px 14px', background: 'var(--accent-light)', color: 'var(--accent)',
    borderRadius: '16px', fontSize: '12px', fontWeight: 600,
  },

  // Course cards
  courseGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px',
  },
  courseCard: {
    background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', cursor: 'pointer',
  },
  courseThumb: {
    height: '120px', background: 'linear-gradient(135deg, var(--bg-secondary), var(--border-color))',
    position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  courseThumbImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  courseThumbIcon: { fontSize: '32px', opacity: 0.4 },
  badgeFree: {
    position: 'absolute' as const, top: '8px', right: '8px',
    padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
    background: '#d4edda', color: '#155724',
  },
  badgePrice: {
    position: 'absolute' as const, top: '8px', right: '8px',
    padding: '4px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
    background: 'rgba(0,0,0,0.6)', color: '#fff',
  },
  courseBody: { padding: '14px' },
  courseName: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '6px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
  },
  courseMeta: { fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' },
  courseRating: { color: 'var(--warning)' },

  // Teacher cards
  teacherGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px',
  },
  teacherCard: {
    background: 'var(--bg-card)', borderRadius: '12px', padding: '24px',
    textAlign: 'center' as const, boxShadow: 'var(--shadow)',
    border: '1px solid var(--border-color)', cursor: 'pointer',
  },
  teacherAvatar: {
    width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px', fontSize: '22px', fontWeight: 600, overflow: 'hidden',
  },
  teacherAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  teacherName: { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' },
  teacherSubject: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' },
  teacherStars: { color: 'var(--warning)', fontSize: '14px' },

  // How it works
  howGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '32px',
  },
  howStep: { padding: '24px' },
  howNumber: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'var(--gradient-primary)', color: '#fff', fontSize: '20px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  howTitle: { fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' },
  howDesc: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 },

  // Features
  featuresGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px',
  },
  featureCard: {
    background: 'var(--bg-card)', borderRadius: '12px', padding: '24px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', textAlign: 'center' as const,
  },
  featureIcon: { fontSize: '36px', marginBottom: '12px' },
  featureTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' },
  featureDesc: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 },

  // CTA
  ctaBanner: {
    background: 'var(--gradient-primary)', borderRadius: '16px', padding: '48px',
    textAlign: 'center' as const, color: '#fff', marginBottom: '32px',
  },
  ctaTitle: { fontSize: '28px', fontWeight: 700, marginBottom: '12px' },
  ctaSub: { fontSize: '16px', opacity: 0.9, marginBottom: '24px' },

  // Landing navbar
  landingNav: {
    background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
    padding: '12px 24px', position: 'sticky' as const, top: 0, zIndex: 50,
  },
  landingNavInner: {
    maxWidth: '1200px', margin: '0 auto', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
  },
  landingBrand: { fontSize: '20px', fontWeight: 700, color: 'var(--accent)' },
  landingNavLinks: { display: 'flex', alignItems: 'center', gap: '12px' },
  landingNavLink: {
    background: 'none', border: 'none', color: 'var(--accent)',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px',
  },
  landingSignup: {
    padding: '8px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  landingContent: {
    maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
  },
};

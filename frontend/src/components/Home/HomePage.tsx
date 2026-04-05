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
  const [stats, setStats] = useState({ learners: 0, courses: 0, pros: 0, rating: 0 });

  useEffect(() => {
    Promise.all([
      courseApi.searchCourses({ size: 1 }).then((r) => r.totalElements).catch(() => 0),
      teacherApi.searchTeachers().then((t) => t.length).catch(() => 0),
    ]).then(([courseCount, proCount]) => {
      setStats({
        learners: courseCount * 5,
        courses: courseCount,
        pros: proCount,
        rating: 4.8,
      });
    });
  }, []);

  const L = landingStyles;

  return (
    <div style={L.page}>
      {/* Navbar */}
      <nav style={L.nav}>
        <div style={L.navInner}>
          <span style={L.brand}>Kyro<span style={{ color: '#0d9488' }}>Academy</span></span>
          <div style={L.navActions}>
            <button onClick={() => navigate('/login')} style={L.btnSignIn}>Log In</button>
            <button onClick={() => navigate('/register')} style={L.btnGetStarted}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={L.hero}>
        <div style={L.heroGlow} />
        <div style={L.heroContent}>
          <div style={L.eyebrow}>
            <span style={L.eyebrowLine} />
            <span>The future of learning is live</span>
            <span style={L.eyebrowLine} />
          </div>
          <h1 style={L.heroTitle}>
            Master any skill with<br /><span style={L.gradientText}>expert Kyro Guides.</span>
          </h1>
          <p style={L.heroSub}>
            Interactive live classes, structured courses, and a global community of verified experts.
            Learn at your pace or join live — the choice is yours.
          </p>
          <div style={L.heroCtas}>
            <button onClick={() => navigate('/register')} style={L.btnHeroPrimary}>
              Start Learning Free <span style={{ marginLeft: '8px' }}>&rarr;</span>
            </button>
            <button onClick={() => navigate('/register')} style={L.btnHeroSecondary}>Become a Guide</button>
          </div>
        </div>
      </section>

      {/* Logos */}
      <div style={L.logos}>
        <div style={L.logosLabel}>Trusted by learners from</div>
        <div style={L.logosRow}>
          {['Google', 'Microsoft', 'Stanford', 'MIT', 'Amazon', 'Meta'].map((name) => (
            <span key={name} style={L.logoItem}>{name}</span>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <section style={L.sectionWrap}>
        <div style={L.inner}>
          {[
            { label: '01 \u2014 Discover', title: 'Courses built by experts, structured for results', desc: 'Browse hundreds of courses across every subject. Each one is organized into modules and lessons with quizzes, assignments, and progress tracking built in.', link: 'Explore courses', icon: '\ud83d\udcda', color: '#0d9488', bg: 'rgba(13,148,136,0.08)' },
            { label: '02 \u2014 Learn Live', title: 'Join live sessions with real-time interaction', desc: 'Attend live classes with HD video, screen sharing, interactive chat, polls, hand raise, and collaborative whiteboards. Learn directly from your Guide.', link: 'See upcoming sessions', icon: '\ud83c\udfa5', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', reverse: true },
            { label: '03 \u2014 Track Progress', title: 'Visualize your growth with every lesson completed', desc: 'Track completion rates, quiz scores, and assignment grades across all your courses. Earn certificates to showcase your achievements.', link: 'Start your journey', icon: '\ud83d\udcc8', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
          ].map((cap) => (
            <div key={cap.label} style={{ ...L.capRow, direction: cap.reverse ? 'rtl' as const : 'ltr' as const }}>
              <div style={{ direction: 'ltr' as const }}>
                <div style={L.capLabel}>{cap.label}</div>
                <h3 style={L.capTitle}>{cap.title}</h3>
                <p style={L.capDesc}>{cap.desc}</p>
                <span style={L.capLink}>{cap.link} &rarr;</span>
              </div>
              <div style={{ ...L.capVisual, background: cap.bg, borderColor: `${cap.color}22`, direction: 'ltr' as const }}>
                <span style={L.capIcon}>{cap.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...L.sectionWrap, background: '#f8fafc' }}>
        <div style={L.inner}>
          <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
            <div style={L.eyebrowSmall}>Platform</div>
            <h2 style={L.sectionTitle}>Everything you need, nothing you don't</h2>
            <p style={L.sectionDesc}>A complete learning platform designed for both Kyros and Guides.</p>
          </div>
          <div style={L.featGrid} className="landing-feat-grid">
            {[
              { icon: '\ud83c\udfa5', title: 'Live Classes', desc: 'Real-time video with chat, polls, hand raise, emoji reactions, and screen sharing.' },
              { icon: '\ud83d\udcda', title: 'Structured Courses', desc: 'Modules, lessons, and progress tracking organized for optimal learning outcomes.' },
              { icon: '\ud83d\udcdd', title: 'Quizzes & Assignments', desc: 'Test knowledge with auto-graded quizzes and get personalized Guide feedback.' },
              { icon: '\ud83c\udfc6', title: 'Certificates', desc: 'Earn verifiable certificates on course completion to showcase your skills.' },
              { icon: '\ud83d\udcac', title: 'Discussion Forums', desc: 'Collaborate with peers, ask questions, and deepen understanding together.' },
              { icon: '\ud83d\udcc5', title: 'Smart Scheduling', desc: 'Calendar integration with Google Calendar links and session reminders.' },
            ].map((f) => (
              <div key={f.title} style={L.featCard} className="course-card">
                <div style={L.featIcon}>{f.icon}</div>
                <div style={L.featTitle}>{f.title}</div>
                <div style={L.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={L.statsSection}>
        <div style={L.inner}>
          <div style={L.statsGrid} className="landing-stats-grid">
            {[
              { num: stats.learners > 0 ? stats.learners.toLocaleString() : '0', label: 'Active Kyros' },
              { num: stats.courses > 0 ? stats.courses.toString() : '0', label: 'Expert-Led Courses' },
              { num: stats.pros > 0 ? stats.pros.toString() : '0', label: 'Verified Guides' },
              { num: stats.rating > 0 ? stats.rating.toFixed(1) : '-', label: 'Average Rating' },
            ].map((s) => (
              <div key={s.label} style={L.statItem}>
                <div style={L.statNumber}>{s.num}</div>
                <div style={L.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ ...L.sectionWrap, background: '#f8fafc' }}>
        <div style={L.inner}>
          <div style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
            <div style={L.eyebrowSmall}>Testimonials</div>
            <h2 style={L.sectionTitle}>Loved by curious minds worldwide</h2>
          </div>
          <div style={L.testGrid} className="landing-test-grid">
            {[
              { quote: 'The live sessions changed everything for me. Being able to ask questions in real-time and get immediate feedback is incredibly valuable.', name: 'Sarah Kim', role: 'Data Science Kyro', color: '#0d9488' },
              { quote: 'As a Guide, this platform gives me everything I need. The course builder, analytics, and payment system are all seamlessly integrated.', name: 'James Rodriguez', role: 'Web Dev Guide', color: '#16a34a' },
              { quote: 'The progress tracking keeps me motivated every day. I can see exactly how far I\'ve come and what\'s ahead in each course.', name: 'Aisha Lawan', role: 'UX Design Kyro', color: '#0f766e' },
            ].map((t) => (
              <div key={t.name} style={L.testCard}>
                <div style={L.testStars}>{'\u2605\u2605\u2605\u2605\u2605'}</div>
                <p style={L.testQuote}>"{t.quote}"</p>
                <div style={L.testAuthor}>
                  <div style={{ ...L.testAvatar, background: t.color }}>{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <div style={L.testName}>{t.name}</div>
                    <div style={L.testRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={L.ctaOuter}>
        <div style={L.inner}>
          <div style={L.cta}>
            <h2 style={L.ctaTitle}>Ready to unlock your full potential?</h2>
            <p style={L.ctaSub}>Join thousands of learners mastering new skills with expert Guides. Your journey starts with a single click.</p>
            <button onClick={() => navigate('/register')} style={L.btnCtaWhite}>
              Get Started Free <span style={{ marginLeft: '8px' }}>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={L.footer}>
        <div style={L.footerInner}>
          <span style={L.brand}>Kyro<span style={{ color: '#0d9488' }}>Academy</span></span>
          <span style={L.footerCopy}>&copy; 2026 KyroAcademy</span>
        </div>
      </footer>
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
            <h2 style={styles.sectionTitleText}>Top Guides</h2>
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
                <div style={styles.teacherSubject}>{t.subjects?.split(',')[0] || 'Guide'}</div>
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
          <div style={styles.statCard}><div style={styles.statLabel}>Total Kyros</div><div style={{ ...styles.statValue, color: 'var(--accent)' }}>{data.totalStudents}</div></div>
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
          { icon: '\ud83c\udfe6', label: 'Account Setup', sub: 'Payment account', path: '/stripe-connect' },
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

  if (!user) return <LandingPage />;

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
// ──────────────────────────────────────────────
// Landing page styles (Arthur.ai-inspired dark)
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Landing page styles (Teal + White light theme)
// ──────────────────────────────────────────────
const landingStyles: { [key: string]: React.CSSProperties } = {
  page: { background: '#fff', color: '#0f172a', fontFamily: "'Inter', sans-serif", minHeight: '100vh' },

  // Nav
  nav: { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0' },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '32px' },
  navLink: { fontSize: '14px', fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  navActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  btnSignIn: { padding: '9px 20px', background: 'none', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '14px', fontWeight: 500, cursor: 'pointer', borderRadius: '8px' },
  btnGetStarted: { padding: '9px 22px', background: '#0d9488', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px' },

  // Hero
  hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const, padding: '140px 32px 80px', position: 'relative' as const, overflow: 'hidden', background: 'linear-gradient(180deg, #f0fdfa 0%, #fff 100%)' },
  heroGlow: { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '900px', height: '900px', background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)', pointerEvents: 'none' as const },
  heroContent: { position: 'relative' as const, zIndex: 1, maxWidth: '850px' },
  eyebrow: { fontSize: '13px', fontWeight: 500, color: '#0d9488', textTransform: 'uppercase' as const, letterSpacing: '3px', marginBottom: '28px', display: 'inline-flex', alignItems: 'center', gap: '10px' },
  eyebrowLine: { display: 'inline-block', width: '32px', height: '1px', background: '#0d9488' },
  heroTitle: { fontSize: '64px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2.5px', color: '#0f172a', marginBottom: '28px' },
  gradientText: { background: 'linear-gradient(135deg, #0d9488, #0f766e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { fontSize: '19px', color: '#64748b', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 44px', fontWeight: 400 },
  heroCtas: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' as const },
  btnHeroPrimary: { padding: '16px 36px', background: '#0d9488', color: '#fff', border: 'none', fontSize: '16px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer' },
  btnHeroSecondary: { padding: '16px 36px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '16px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer' },

  // Logos
  logos: { padding: '60px 32px 80px', textAlign: 'center' as const },
  logosLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '3px', marginBottom: '28px' },
  logosRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '56px', flexWrap: 'wrap' as const },
  logoItem: { fontSize: '20px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '-0.3px' },

  // Sections
  sectionWrap: { padding: '100px 32px' },
  inner: { maxWidth: '1200px', margin: '0 auto' },
  eyebrowSmall: { fontSize: '12px', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '3px', marginBottom: '20px' },
  sectionTitle: { fontSize: '44px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', color: '#0f172a', marginBottom: '16px' },
  sectionDesc: { fontSize: '17px', color: '#64748b', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' },

  // Capabilities
  capRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '120px' },
  capLabel: { fontSize: '12px', color: '#0d9488', textTransform: 'uppercase' as const, letterSpacing: '3px', marginBottom: '16px', fontWeight: 600 },
  capTitle: { fontSize: '34px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: '20px', color: '#0f172a' },
  capDesc: { fontSize: '16px', color: '#64748b', lineHeight: 1.7, marginBottom: '28px' },
  capLink: { color: '#0d9488', fontWeight: 600, fontSize: '15px', cursor: 'pointer' },
  capVisual: { borderRadius: '20px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' },
  capIcon: { fontSize: '80px', opacity: 0.5 },

  // Features
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  featCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', transition: 'all 0.3s' },
  featIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px', background: 'rgba(13,148,136,0.08)' },
  featTitle: { fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' },
  featDesc: { fontSize: '14px', color: '#64748b', lineHeight: 1.7 },

  // Stats
  statsSection: { background: '#0f172a', padding: '0 32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '1200px', margin: '0 auto' },
  statItem: { padding: '56px 32px', textAlign: 'center' as const, borderRight: '1px solid rgba(255,255,255,0.08)' },
  statNumber: { fontSize: '52px', fontWeight: 700, letterSpacing: '-2px', marginBottom: '8px', background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  statLabel: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 },

  // Testimonials
  testGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  testCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' },
  testStars: { color: '#f59e0b', fontSize: '16px', marginBottom: '20px', letterSpacing: '3px' },
  testQuote: { fontSize: '15px', color: '#64748b', lineHeight: 1.8, marginBottom: '28px', fontStyle: 'italic' as const },
  testAuthor: { display: 'flex', alignItems: 'center', gap: '14px' },
  testAvatar: { width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' },
  testName: { fontSize: '14px', fontWeight: 600, color: '#0f172a' },
  testRole: { fontSize: '13px', color: '#94a3b8', marginTop: '2px' },

  // CTA
  ctaOuter: { padding: '100px 32px' },
  cta: { background: 'linear-gradient(135deg, #0f766e, #0d9488)', borderRadius: '24px', padding: '80px 48px', textAlign: 'center' as const, position: 'relative' as const, overflow: 'hidden' },
  ctaTitle: { fontSize: '44px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: '20px' },
  ctaSub: { fontSize: '18px', color: 'rgba(255,255,255,0.8)', maxWidth: '550px', margin: '0 auto 40px', lineHeight: 1.7 },
  btnCtaWhite: { padding: '18px 40px', background: '#fff', color: '#0f766e', border: 'none', fontSize: '17px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer' },

  // Footer
  footer: { background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '48px 32px' },
  footerInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '20px' },
  footerLinks: { display: 'flex', gap: '28px' },
  footerLink: { color: '#64748b', fontSize: '14px', cursor: 'pointer' },
  footerCopy: { fontSize: '13px', color: '#94a3b8' },
};


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

};

import React, { useState } from 'react';
import './styles/theme.css';
import './styles/responsive.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { BroadcasterView } from './components/Broadcaster/BroadcasterView';
import { ViewerView } from './components/Viewer/ViewerView';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/Auth/LoginPage';
import { RegisterPage } from './components/Auth/RegisterPage';
import { ForgotPasswordPage } from './components/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { ParentalConsentPage } from './components/Auth/ParentalConsentPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { RecordingsList } from './components/Recording/RecordingsList';
import { PlaybackPage } from './components/Recording/PlaybackPage';
import { PaymentSuccess } from './components/Payment/PaymentSuccess';
import { Navbar } from './components/Navbar/Navbar';
import { NotificationsPage } from './components/Notification/NotificationsPage';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminUsers } from './components/Admin/AdminUsers';
import { PlatformStats } from './components/Admin/PlatformStats';
import { MessagesPage } from './components/Messaging/MessagesPage';
import { CalendarPage } from './components/Calendar/CalendarPage';
import { CourseList } from './components/Course/CourseList';
import { CourseDetail } from './components/Course/CourseDetail';
import { CreateCourse } from './components/Course/CreateCourse';
import { MyCourses } from './components/Course/MyCourses';
import { CourseBuilder } from './components/Course/CourseBuilder';
import { CourseLearnPage } from './components/Course/CourseLearnPage';
import { CourseProgressView } from './components/Course/CourseProgressView';
import { MyEnrollments } from './components/Course/MyEnrollments';
import { QuizTaker } from './components/Quiz/QuizTaker';
import { AssignmentView } from './components/Assignment/AssignmentView';
import { GradingView } from './components/Assignment/GradingView';
import { DiscussionForum } from './components/Discussion/DiscussionForum';
import { ThreadView } from './components/Discussion/ThreadView';
import { CourseAnalyticsPage } from './components/Dashboard/CourseAnalyticsPage';
import { StripeConnectSetup } from './components/Teacher/StripeConnectSetup';
import { EarningsPage } from './components/Teacher/EarningsPage';
import { TeacherList } from './components/Teacher/TeacherList';
import { TeacherProfilePage } from './components/Teacher/TeacherProfilePage';
import { UserProfilePage } from './components/Profile/UserProfilePage';
import { EditUserProfilePage } from './components/Profile/EditUserProfilePage';
import { ProgressDashboard } from './components/Progress/ProgressDashboard';
import { CourseProgressDetail } from './components/Progress/CourseProgressDetail';
import { HomePage } from './components/Home/HomePage';

function BroadcastPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomId] = useState(() => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.indexOf('room') + 1];
  });

  const userId = user?.userId || `user-${Math.random().toString(36).substr(2, 9)}`;
  const displayName = user?.displayName || 'Host';

  const handleLeave = () => {
    navigate('/');
  };

  return <BroadcasterView roomId={roomId} userId={userId} displayName={displayName} onLeave={handleLeave} />;
}

function ViewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomId] = useState(() => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.indexOf('room') + 1];
  });

  const userId = user?.userId || `viewer-${Math.random().toString(36).substr(2, 9)}`;
  const displayName = user?.displayName || 'Viewer';

  const handleLeave = () => {
    navigate('/');
  };

  return <ViewerView roomId={roomId} userId={userId} displayName={displayName} onLeave={handleLeave} />;
}

function ForceLogout() {
  React.useEffect(() => {
    localStorage.clear();
    window.location.href = '/login';
  }, []);
  return <div style={{ padding: '40px', textAlign: 'center' }}>Clearing session...</div>;
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/login', '/register', '/forgot-password', '/reset-password', '/parental-consent'].includes(location.pathname) ||
    location.pathname.includes('/broadcast') || location.pathname.includes('/view');

  return (
    <div style={styles.app}>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/parental-consent" element={<ParentalConsentPage />} />
        <Route path="/force-logout" element={<ForceLogout />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/room/:roomId/broadcast" element={<ProtectedRoute><BroadcastPage /></ProtectedRoute>} />
        <Route path="/room/:roomId/view" element={<ProtectedRoute><ViewPage /></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><RecordingsList /></ProtectedRoute>} />
        <Route path="/recordings/:id/play" element={<ProtectedRoute><PlaybackPage /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['ADMIN']}><PlatformStats /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
        <Route path="/courses/create" element={<ProtectedRoute allowedRoles={['TEACHER']}><CreateCourse /></ProtectedRoute>} />
        <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/courses/:courseId/builder" element={<ProtectedRoute allowedRoles={['TEACHER']}><CourseBuilder /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn" element={<ProtectedRoute><CourseLearnPage /></ProtectedRoute>} />
        <Route path="/courses/:courseId/learn/:lessonId" element={<ProtectedRoute><CourseLearnPage /></ProtectedRoute>} />
        <Route path="/courses/:courseId/progress" element={<ProtectedRoute><CourseProgressView /></ProtectedRoute>} />
        <Route path="/courses/:courseId/analytics" element={<ProtectedRoute allowedRoles={['TEACHER']}><CourseAnalyticsPage /></ProtectedRoute>} />
        <Route path="/courses/:courseId/quizzes/:quizId" element={<ProtectedRoute><QuizTaker /></ProtectedRoute>} />
        <Route path="/courses/:courseId/assignments/:assignmentId" element={<ProtectedRoute><AssignmentView /></ProtectedRoute>} />
        <Route path="/courses/:courseId/assignments/:assignmentId/grade" element={<ProtectedRoute allowedRoles={['TEACHER']}><GradingView /></ProtectedRoute>} />
        <Route path="/courses/:courseId/discussions" element={<ProtectedRoute><DiscussionForum /></ProtectedRoute>} />
        <Route path="/courses/:courseId/discussions/:threadId" element={<ProtectedRoute><ThreadView /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute allowedRoles={['TEACHER']}><MyCourses /></ProtectedRoute>} />
        <Route path="/my-enrollments" element={<ProtectedRoute><MyEnrollments /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressDashboard /></ProtectedRoute>} />
        <Route path="/progress/:enrollmentId" element={<ProtectedRoute><CourseProgressDetail /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
        <Route path="/teachers/:userId" element={<ProtectedRoute><TeacherProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditUserProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/stripe-connect" element={<ProtectedRoute allowedRoles={['TEACHER']}><StripeConnectSetup /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute allowedRoles={['TEACHER']}><EarningsPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-secondary)',
    fontFamily: 'Arial, sans-serif',
    color: 'var(--text-primary)',
    transition: 'background-color 0.2s, color 0.2s',
  },
};

export default App;

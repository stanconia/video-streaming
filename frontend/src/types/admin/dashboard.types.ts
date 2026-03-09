export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface TeacherDashboardData {
  totalEarnings: number;
  totalStudents: number;
  totalClasses: number;
  upcomingClasses: number;
  averageRating: number;
  totalReviews: number;
  monthlyEarnings: MonthlyEarning[];
  upcomingClassList: any[];
}

export interface EnrollmentSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  studentUserId: string;
  studentDisplayName: string;
  status: string;
  paidAmount: number;
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface StudentDashboardData {
  totalEnrollments: number;
  activeEnrollments: number;
  completedCourses: number;
  totalSpent: number;
  recentEnrollments: EnrollmentSummary[];
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number | null;
  totalRevenue: number;
}

export interface QuizAttemptSummary {
  quizId: string;
  quizTitle: string;
  percentage: number;
  passed: boolean;
}

export interface AssignmentGradeSummary {
  assignmentId: string;
  assignmentTitle: string;
  score: number | null;
  maxScore: number;
}

export interface StudentPerformance {
  studentUserId: string;
  studentDisplayName: string;
  progressPercentage: number;
  enrollmentStatus: string;
  paidAmount: number;
  averageQuizScore: number | null;
  averageAssignmentScore: number | null;
  quizAttempts: QuizAttemptSummary[];
  assignmentGrades: AssignmentGradeSummary[];
}

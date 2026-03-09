export interface CourseEnrollment {
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

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  modules: ModuleProgress[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lessons: LessonProgress[];
}

export interface LessonProgress {
  lessonId: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

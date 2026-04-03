export interface Course {
  id: string;
  teacherUserId: string;
  teacherDisplayName: string;
  teacherHeadline?: string;
  teacherProfileImageUrl?: string;
  teacherAverageRating?: number;
  title: string;
  description: string;
  subject: string;
  price: number;
  currency: string;
  thumbnailUrl: string | null;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedHours: number;
  published: boolean;
  tags: string | null;
  moduleCount: number;
  lessonCount: number;
  enrolledCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  subject: string;
  price: number;
  currency: string;
  thumbnailUrl?: string;
  difficultyLevel: string;
  estimatedHours: number;
  tags?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  lessonCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface CreateModuleRequest {
  title: string;
  description: string;
  orderIndex: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  content: string;
  type: 'TEXT' | 'VIDEO' | 'FILE';
  videoUrl: string | null;
  fileUrl: string | null;
  orderIndex: number;
  estimatedMinutes: number;
  createdAt: string;
}

export interface CreateLessonRequest {
  title: string;
  content: string;
  type: string;
  videoUrl?: string;
  fileKey?: string;
  orderIndex: number;
  estimatedMinutes: number;
}

export interface CourseSearchParams {
  q?: string;
  subject?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  minRating?: number;
  country?: string;
  page?: number;
  size?: number;
}

export interface SearchFilterValues {
  subject: string;
  difficulty: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  minRating: number;
  country: string;
}

export interface CourseSearchResponse {
  content: Course[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Quiz {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  passPercentage: number;
  timeLimitMinutes: number | null;
  orderIndex: number;
  questionCount: number;
  createdAt: string;
}

export interface CreateQuizRequest {
  title: string;
  description: string;
  passPercentage: number;
  timeLimitMinutes?: number;
  orderIndex: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  orderIndex: number;
  points: number;
}

export interface QuizQuestionRequest {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  studentUserId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  completedAt: string | null;
}

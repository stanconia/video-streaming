export interface Assignment {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxScore: number;
  orderIndex: number;
  submissionCount: number;
  createdAt: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  dueDate?: string;
  maxScore: number;
  orderIndex: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentUserId: string;
  studentDisplayName: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  submittedAt: string;
}

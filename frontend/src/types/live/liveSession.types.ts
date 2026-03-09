export interface LiveSession {
  id: string;
  courseId: string;
  courseTitle: string;
  coursePublished: boolean;
  moduleId: string | null;
  moduleTitle: string | null;
  teacherUserId: string;
  teacherDisplayName: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  roomId: string | null;
  createdAt: string;
}

export interface CreateLiveSessionRequest {
  courseId: string;
  moduleId?: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
}

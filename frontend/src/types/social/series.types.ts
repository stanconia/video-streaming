export interface ClassSeries {
  id: string;
  teacherUserId: string;
  teacherDisplayName: string;
  title: string;
  description: string;
  subject: string;
  recurrencePattern: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  dayOfWeek: number;
  timeOfDay: string;
  durationMinutes: number;
  maxStudents: number;
  price: number;
  currency: string;
  totalSessions: number;
  generatedClassCount: number;
  enrolledCount: number;
  ageMin: number | null;
  ageMax: number | null;
  tags: string | null;
  thumbnailUrl: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateSeriesRequest {
  title: string;
  description: string;
  subject: string;
  recurrencePattern: string;
  dayOfWeek: number;
  timeOfDay: string;
  durationMinutes: number;
  maxStudents: number;
  price: number;
  currency: string;
  totalSessions: number;
  startDate: string;
  ageMin?: number;
  ageMax?: number;
  tags?: string;
  thumbnailUrl?: string;
}

export interface SeriesEnrollment {
  id: string;
  seriesId: string;
  studentUserId: string;
  studentDisplayName: string;
  enrolledAt: string;
}

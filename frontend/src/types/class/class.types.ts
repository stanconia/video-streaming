export interface ScheduledClass {
  id: string;
  teacherUserId: string;
  teacherDisplayName: string;
  title: string;
  description: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  maxStudents: number;
  enrolledStudents: number;
  price: number;
  currency: string;
  status: 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  ageMin: number | null;
  ageMax: number | null;
  tags: string | null;
  thumbnailUrl: string | null;
  teacherAverageRating: number | null;
  waitlistCount: number;
  roomId: string | null;
  seriesId: string | null;
  seriesTitle: string | null;
  materialsCount: number;
  createdAt: string;
}

export interface CreateClassRequest {
  title: string;
  description: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  maxStudents: number;
  price: number;
  currency: string;
  ageMin?: number;
  ageMax?: number;
  tags?: string;
  thumbnailUrl?: string;
}

export interface Booking {
  id: string;
  classId: string;
  classTitle: string;
  studentUserId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paidAmount: number;
  createdAt: string;
  cancelledAt: string | null;
}

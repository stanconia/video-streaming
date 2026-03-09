export interface AttendanceRecord {
  id: string;
  classId: string;
  userId: string;
  userDisplayName: string;
  joinedAt: string;
  leftAt: string | null;
  durationMinutes: number | null;
}

export interface Certificate {
  id: string;
  classId: string;
  studentUserId: string;
  studentDisplayName: string;
  classTitle: string;
  teacherDisplayName: string;
  completedAt: string;
  certificateUrl: string | null;
  issuedAt: string;
}

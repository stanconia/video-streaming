export interface FavoriteTeacher {
  id: string;
  userId: string;
  teacherUserId: string;
  teacherDisplayName: string;
  createdAt: string;
}

export interface SavedClass {
  id: string;
  userId: string;
  classId: string;
  classTitle: string;
  classStatus: string;
  scheduledAt: string;
  createdAt: string;
}

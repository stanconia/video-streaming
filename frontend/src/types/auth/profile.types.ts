export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  role: string;
  phone?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt: string;
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  teacherProfileUserId?: string;
  subjectInterests?: string;
}

export interface UpdateProfileRequest {
  email?: string;
  displayName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  subjectInterests?: string;
}

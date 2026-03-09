export interface TeacherProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  headline: string;
  subjects: string;
  hourlyRate: number;
  experienceYears: number;
  profileImageUrl: string;
  verified: boolean;
  averageRating: number;
  reviewCount: number;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  backgroundCheckStatus: string | null;
  totalEarnings: number;
  createdAt: string;
}

export interface TeacherProfileRequest {
  bio: string;
  headline: string;
  subjects: string;
  hourlyRate: number;
  experienceYears: number;
  profileImageUrl?: string;
}

export interface Review {
  id: string;
  teacherUserId: string;
  studentUserId: string;
  studentDisplayName: string;
  classId: string;
  rating: number;
  comment: string;
  teacherReply: string | null;
  teacherRepliedAt: string | null;
  helpfulCount: number;
  createdAt: string;
}

export interface CreateReviewRequest {
  classId: string;
  rating: number;
  comment: string;
}

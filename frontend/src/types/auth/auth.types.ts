export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  requiresParentalConsent?: boolean;
  parentalConsentGranted?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  dateOfBirth: string;
  parentEmail?: string;
  phone?: string;
  location?: string;
  bio?: string;
  subjectInterests?: string;
  // Teacher-specific:
  headline?: string;
  subjects?: string;
  experienceYears?: number;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  requiresParentalConsent: boolean;
  parentalConsentGranted: boolean;
}

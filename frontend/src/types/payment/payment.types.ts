export interface StripeConnectStatus {
  accountId: string | null;
  onboardingUrl: string | null;
  onboarded: boolean;
}

export interface PayoutSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  payoutCount: number;
}

export interface TeacherEarning {
  classId: string;
  classTitle: string;
  studentName: string;
  amount: number;
  platformFee: number;
  teacherPayout: number;
  payoutStatus: string;
  date: string;
}

export interface RefundResponse {
  bookingId: string;
  amount: number;
  status: string;
  refundedAt: string;
}

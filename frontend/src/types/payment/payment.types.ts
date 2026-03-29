export interface BankAccountStatus {
  bankAccountAdded: boolean;
  bankAccountLast4: string | null;
  bankAccountHolderName: string | null;
  transfersEnabled: boolean;
}

export interface SetupBankAccountRequest {
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
}

// Backward compat alias
export type StripeConnectStatus = BankAccountStatus;

export interface PayoutSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  payoutCount: number;
}

export interface TeacherEarning {
  id: string;
  type: string;
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

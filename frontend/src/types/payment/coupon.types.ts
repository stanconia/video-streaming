export interface Coupon {
  id: string;
  code: string;
  teacherUserId: string;
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateCouponRequest {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  maxUses: number;
  validFrom?: string;
  validUntil?: string;
}

import React, { useState } from 'react';
import { Coupon } from '../../types/payment/coupon.types';
import { couponApi } from '../../services/api/payment/CouponApi';

interface CouponInputProps {
  classId: string;
  onApply: (coupon: Coupon) => void;
  onClear: () => void;
}

export const CouponInput: React.FC<CouponInputProps> = ({ classId, onApply, onClear }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const coupon = await couponApi.validateCoupon(code.trim(), classId);
      setAppliedCoupon(coupon);
      onApply(coupon);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setError(null);
    setAppliedCoupon(null);
    onClear();
  };

  const getDiscountLabel = (coupon: Coupon): string => {
    if (coupon.discountPercent != null) {
      return `${coupon.discountPercent}% off`;
    }
    if (coupon.discountAmount != null) {
      return `$${(coupon.discountAmount / 100).toFixed(2)} off`;
    }
    return 'Discount applied';
  };

  return (
    <div style={styles.container}>
      {!appliedCoupon ? (
        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={styles.input}
            disabled={loading}
          />
          <button
            onClick={handleApply}
            disabled={loading || !code.trim()}
            style={styles.applyButton}
          >
            {loading ? 'Checking...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div style={styles.appliedRow}>
          <div style={styles.successInfo}>
            <span style={styles.successText}>
              {appliedCoupon.code} - {getDiscountLabel(appliedCoupon)}
            </span>
          </div>
          <button onClick={handleClear} style={styles.clearButton}>
            Clear
          </button>
        </div>
      )}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { marginBottom: '12px' },
  inputRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'monospace' },
  applyButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' },
  appliedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#d4edda', borderRadius: '4px' },
  successInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  successText: { color: '#155724', fontSize: '14px', fontWeight: 'bold' },
  clearButton: { padding: '4px 12px', backgroundColor: 'transparent', color: '#155724', border: '1px solid #155724', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  error: { color: '#dc3545', fontSize: '13px', marginTop: '6px' },
};

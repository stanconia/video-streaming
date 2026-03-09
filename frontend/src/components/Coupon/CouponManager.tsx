import React, { useState, useEffect } from 'react';
import { Coupon, CreateCouponRequest } from '../../types/payment/coupon.types';
import { couponApi } from '../../services/api/payment/CouponApi';

type DiscountType = 'percent' | 'amount';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponApi.getMyCoupons();
      setCoupons(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Coupon code is required');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const request: CreateCouponRequest = {
        code: code.trim().toUpperCase(),
        maxUses: parseInt(maxUses) || 100,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
      };
      if (discountType === 'percent') {
        request.discountPercent = parseFloat(discountValue);
      } else {
        request.discountAmount = Math.round(parseFloat(discountValue) * 100);
      }
      await couponApi.createCoupon(request);
      setCode('');
      setDiscountValue('');
      setMaxUses('100');
      setValidFrom('');
      setValidUntil('');
      loadCoupons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Coupon Management</h1>

      <div style={styles.formCard}>
        <h2 style={styles.sectionTitle}>Create Coupon</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Coupon Code *</label>
            <input
              type="text"
              required
              placeholder="e.g., SAVE20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Discount Type</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="discountType"
                  checked={discountType === 'percent'}
                  onChange={() => setDiscountType('percent')}
                />
                {' '}Percentage
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="discountType"
                  checked={discountType === 'amount'}
                  onChange={() => setDiscountType('amount')}
                />
                {' '}Fixed Amount ($)
              </label>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              {discountType === 'percent' ? 'Discount Percent (%)' : 'Discount Amount ($)'}
            </label>
            <input
              type="number"
              min="0"
              step={discountType === 'percent' ? '1' : '0.01'}
              max={discountType === 'percent' ? '100' : undefined}
              required
              placeholder={discountType === 'percent' ? 'e.g., 20' : 'e.g., 5.00'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Max Uses</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} style={styles.submitButton}>
            {submitting ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Coupons</h2>
        {loading ? (
          <div style={styles.loading}>Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div style={styles.empty}>No coupons created yet.</div>
        ) : (
          <div style={styles.list}>
            {coupons.map((coupon) => (
              <div key={coupon.id} style={styles.couponItem}>
                <div style={styles.couponHeader}>
                  <span style={styles.couponCode}>{coupon.code}</span>
                  <span style={coupon.active ? styles.activeBadge : styles.inactiveBadge}>
                    {coupon.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={styles.couponDetails}>
                  <span>
                    Discount: {coupon.discountPercent != null
                      ? `${coupon.discountPercent}%`
                      : coupon.discountAmount != null
                        ? `$${(coupon.discountAmount / 100).toFixed(2)}`
                        : 'N/A'}
                  </span>
                  <span>Uses: {coupon.usedCount} / {coupon.maxUses}</span>
                  <span>Valid: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  formCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  field: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  radioGroup: { display: 'flex', gap: '20px', paddingTop: '4px' },
  radioLabel: { fontSize: '14px', color: '#333', cursor: 'pointer' },
  row: { display: 'flex', gap: '16px' },
  submitButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '8px' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  empty: { textAlign: 'center', padding: '20px', color: '#666' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  couponItem: { border: '1px solid #eee', borderRadius: '8px', padding: '16px' },
  couponHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  couponCode: { fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', color: '#333' },
  activeBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#d4edda', color: '#155724' },
  inactiveBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8d7da', color: '#721c24' },
  couponDetails: { display: 'flex', gap: '20px', fontSize: '14px', color: '#666', flexWrap: 'wrap' as const },
};

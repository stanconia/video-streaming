import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentApi } from '../../services/api/payment/PaymentApi';
import { CouponInput } from '../Coupon/CouponInput';
import { Coupon } from '../../types/payment/coupon.types';

interface CheckoutFormProps {
  classId: string;
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<{ onSuccess: (paymentIntentId: string) => void; onCancel: () => void; paymentIntentId: string }> = ({ onSuccess, onCancel, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setProcessing(true);
      setError(null);

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/success',
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        onSuccess(paymentIntentId);
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.paymentForm}>
      <PaymentElement />
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.buttonRow}>
        <button type="submit" disabled={!stripe || processing} style={styles.payButton}>
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
        <button type="button" onClick={onCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ classId, amount, currency, onSuccess, onCancel }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const getDiscountedAmount = (): number => {
    if (!appliedCoupon) return amount;
    if (appliedCoupon.discountPercent != null) {
      return Math.max(0, Math.round(amount * (1 - appliedCoupon.discountPercent / 100)));
    }
    if (appliedCoupon.discountAmount != null) {
      return Math.max(0, amount - appliedCoupon.discountAmount);
    }
    return amount;
  };

  useEffect(() => {
    initPayment();
  }, []);

  const initPayment = async () => {
    try {
      setLoading(true);
      const config = await paymentApi.getStripeConfig();
      setStripePromise(loadStripe(config.publishableKey));

      const intent = await paymentApi.createPaymentIntent(classId, amount, currency);
      setClientSecret(intent.clientSecret);
      setPaymentIntentId(intent.paymentIntentId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Initializing payment...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!stripePromise || !clientSecret) return <div style={styles.error}>Payment setup failed</div>;

  const discountedAmount = getDiscountedAmount();

  return (
    <div style={styles.checkoutContainer}>
      <h3>Payment</h3>
      <CouponInput
        classId={classId}
        onApply={(coupon) => setAppliedCoupon(coupon)}
        onClear={() => setAppliedCoupon(null)}
      />
      {appliedCoupon && discountedAmount !== amount && (
        <div style={styles.discountInfo}>
          <span style={{ textDecoration: 'line-through', color: '#999' }}>${(amount / 100).toFixed(2)}</span>
          <span style={{ fontWeight: 'bold', color: '#28a745', marginLeft: '8px' }}>${(discountedAmount / 100).toFixed(2)}</span>
        </div>
      )}
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm onSuccess={onSuccess} onCancel={onCancel} paymentIntentId={paymentIntentId} />
      </Elements>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  checkoutContainer: { marginTop: '24px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' },
  loading: { textAlign: 'center', padding: '20px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px', marginTop: '12px' },
  paymentForm: { marginTop: '16px' },
  buttonRow: { display: 'flex', gap: '12px', marginTop: '16px' },
  payButton: { padding: '12px 32px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  cancelButton: { padding: '12px 32px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  discountInfo: { display: 'flex', alignItems: 'center', fontSize: '16px', marginBottom: '12px', padding: '8px 12px', backgroundColor: '#d4edda', borderRadius: '4px' },
};

import React, { useState, useEffect } from 'react';
import { StripeConnectStatus } from '../../types/payment/payment.types';
import { stripeConnectApi } from '../../services/api/payment/StripeConnectApi';

export const StripeConnectSetup: React.FC = () => {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [bgCheckStatus, setBgCheckStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const [connectStatus, bgCheck] = await Promise.all([
        stripeConnectApi.getStatus(),
        stripeConnectApi.getBackgroundCheckStatus(),
      ]);
      setStatus(connectStatus);
      setBgCheckStatus(bgCheck.status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setError(null);
      const result = await stripeConnectApi.createAccount();
      setStatus(result);
      // After creating, get onboarding link
      const link = await stripeConnectApi.getOnboardingLink();
      if (link.onboardingUrl) {
        window.location.href = link.onboardingUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account');
    }
  };

  const handleOnboarding = async () => {
    try {
      setError(null);
      const link = await stripeConnectApi.getOnboardingLink();
      if (link.onboardingUrl) {
        window.location.href = link.onboardingUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get onboarding link');
    }
  };

  const handleBackgroundCheck = async () => {
    try {
      setError(null);
      const result = await stripeConnectApi.initiateBackgroundCheck();
      setBgCheckStatus(result.status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate background check');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Account Setup</h1>

      {error && <div style={styles.error}>{error}</div>}

      {/* Background Check Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Background Check</h2>
        {bgCheckStatus === 'CLEAR' ? (
          <div style={styles.successBadge}>Verified</div>
        ) : bgCheckStatus === 'PENDING' ? (
          <div style={styles.pendingBadge}>Pending Review</div>
        ) : (
          <div>
            <p style={styles.description}>Complete a background check to build trust with parents.</p>
            <button onClick={handleBackgroundCheck} style={styles.button}>Start Background Check</button>
          </div>
        )}
      </div>

      {/* Stripe Connect Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Payment Account</h2>
        {status?.onboarded ? (
          <div style={styles.successBadge}>Stripe Connected</div>
        ) : status?.accountId ? (
          <div>
            <p style={styles.description}>Your Stripe account is created but onboarding is not complete.</p>
            <button onClick={handleOnboarding} style={styles.button}>Complete Onboarding</button>
          </div>
        ) : (
          <div>
            <p style={styles.description}>Connect a Stripe account to receive payouts for your classes.</p>
            <button onClick={handleCreateAccount} style={styles.button}>Connect Stripe Account</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  title: { marginBottom: '24px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px', marginBottom: '16px' },
  section: { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' },
  sectionTitle: { marginBottom: '12px', fontSize: '18px' },
  description: { color: '#666', marginBottom: '16px', lineHeight: '1.5' },
  button: { padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  successBadge: { display: 'inline-block', padding: '8px 16px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: 'bold' },
  pendingBadge: { display: 'inline-block', padding: '8px 16px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontWeight: 'bold' },
};

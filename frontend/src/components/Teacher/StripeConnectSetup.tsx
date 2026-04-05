import React, { useState, useEffect } from 'react';
import { BankAccountStatus } from '../../types/payment/payment.types';
import { stripeConnectApi } from '../../services/api/payment/StripeConnectApi';

export const StripeConnectSetup: React.FC = () => {
  const [status, setStatus] = useState<BankAccountStatus | null>(null);
  const [bgCheckStatus, setBgCheckStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

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

  const validateForm = (): string | null => {
    if (!accountHolderName.trim()) return 'Account holder name is required';
    if (!/^\d{9}$/.test(routingNumber)) return 'Routing number must be exactly 9 digits';
    if (!/^\d{4,17}$/.test(accountNumber)) return 'Account number must be between 4 and 17 digits';
    if (accountNumber !== confirmAccountNumber) return 'Account numbers do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setSubmitting(true);
      const result = await stripeConnectApi.setupBankAccount({
        accountHolderName: accountHolderName.trim(),
        routingNumber,
        accountNumber,
      });
      setStatus(result);
      setSuccess('Bank account added successfully!');
      setShowForm(false);
      setAccountHolderName('');
      setRoutingNumber('');
      setAccountNumber('');
      setConfirmAccountNumber('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup bank account');
    } finally {
      setSubmitting(false);
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

  const shouldShowForm = showForm || !status?.bankAccountAdded;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Account Setup</h1>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Background Check Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Background Check</h2>
        {bgCheckStatus === 'CLEAR' ? (
          <div style={styles.successBadge}>Verified</div>
        ) : bgCheckStatus === 'PENDING' ? (
          <div style={styles.pendingBadge}>Pending Review</div>
        ) : (
          <div>
            <p style={styles.description}>
              Complete a background check to build trust with parents.
            </p>
            <button onClick={handleBackgroundCheck} style={styles.button}>
              Start Background Check
            </button>
          </div>
        )}
      </div>

      {/* Bank Account Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Bank Account for Payouts</h2>

        {status?.bankAccountAdded && !showForm ? (
          <div>
            <div style={styles.successBadge}>Bank Account Connected</div>
            <div style={styles.bankInfo}>
              <p><strong>Account Holder:</strong> {status.bankAccountHolderName}</p>
              <p><strong>Account:</strong> ****{status.bankAccountLast4}</p>
              {status.transfersEnabled ? (
                <p style={styles.activeText}>Ready to receive payouts</p>
              ) : (
                <p style={styles.pendingText}>Account verification in progress</p>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={styles.linkButton}
            >
              Update Bank Account
            </button>
          </div>
        ) : (
          <div>
            <p style={styles.description}>
              Enter your bank account details to receive payouts for your classes and courses.
              Your information is sent securely and we only store the last 4 digits.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="John Doe"
                  style={styles.input}
                  maxLength={100}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Routing Number</label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9 digits"
                  style={styles.input}
                  maxLength={9}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Number</label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Account number"
                  style={styles.input}
                  maxLength={17}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Account Number</label>
                <input
                  type="password"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter account number"
                  style={styles.input}
                  maxLength={17}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.button,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Setting up...' : 'Save Bank Account'}
              </button>
              {status?.bankAccountAdded && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={styles.linkButton}
                >
                  Cancel
                </button>
              )}
            </form>
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
  error: {
    color: '#721c24', padding: '12px', backgroundColor: '#f8d7da',
    borderRadius: '4px', marginBottom: '16px',
  },
  success: {
    color: '#155724', padding: '12px', backgroundColor: '#d4edda',
    borderRadius: '4px', marginBottom: '16px',
  },
  section: {
    backgroundColor: 'white', padding: '24px', borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px',
  },
  sectionTitle: { marginBottom: '12px', fontSize: '18px' },
  description: { color: '#666', marginBottom: '16px', lineHeight: '1.5' },
  button: {
    padding: '12px 24px', backgroundColor: '#0d9488', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 'bold',
  },
  linkButton: {
    padding: '8px 0', backgroundColor: 'transparent', color: '#0d9488',
    border: 'none', cursor: 'pointer', fontSize: '14px',
    textDecoration: 'underline', marginTop: '12px', marginLeft: '12px',
  },
  successBadge: {
    display: 'inline-block', padding: '8px 16px', backgroundColor: '#d4edda',
    color: '#155724', borderRadius: '4px', fontWeight: 'bold',
  },
  pendingBadge: {
    display: 'inline-block', padding: '8px 16px', backgroundColor: '#fff3cd',
    color: '#856404', borderRadius: '4px', fontWeight: 'bold',
  },
  bankInfo: {
    marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  activeText: { color: '#155724', fontWeight: 'bold', marginTop: '8px' },
  pendingText: { color: '#856404', fontWeight: 'bold', marginTop: '8px' },
  formGroup: { marginBottom: '16px' },
  label: {
    display: 'block', marginBottom: '4px', fontWeight: 'bold',
    fontSize: '14px', color: '#333',
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #ced4da',
    borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const,
  },
};

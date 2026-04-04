import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api/config';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (password.length === 0) return { level: 0, label: '', color: '#ddd' };
  if (password.length < 8) return { level: 1, label: 'Too short', color: '#cc0000' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 2) return { level: 2, label: 'Weak', color: '#ff9800' };
  if (score <= 3) return { level: 3, label: 'Fair', color: '#ffc107' };
  if (score <= 4) return { level: 4, label: 'Strong', color: '#4caf50' };
  return { level: 5, label: 'Very strong', color: '#2e7d32' };
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. The link may be expired or invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container} className="page-container">
        <div style={styles.card} className="auth-card">
          <h1 style={styles.title}>KyroAcademy</h1>
          <h2 style={styles.subtitle}>Reset Password</h2>
          <div style={styles.error}>
            Invalid reset link. Please request a new password reset.
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/forgot-password" style={styles.link}>Request New Reset Link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="page-container">
      <div style={styles.card} className="auth-card">
        <h1 style={styles.title}>KyroAcademy</h1>
        <h2 style={styles.subtitle}>Reset Password</h2>

        {success ? (
          <div style={styles.successContainer}>
            <div style={styles.success}>
              Your password has been reset successfully.
            </div>
            <p style={styles.infoText}>
              You can now sign in with your new password.
            </p>
            <Link to="/login" style={styles.backButton}>
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={styles.input}
                  placeholder="Enter new password"
                />
                {newPassword.length > 0 && (
                  <div style={styles.strengthContainer}>
                    <div style={styles.strengthBarBackground}>
                      <div
                        style={{
                          ...styles.strengthBarFill,
                          width: `${(passwordStrength.level / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span style={{ ...styles.strengthLabel, color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    ...styles.input,
                    borderColor: confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? '#cc0000'
                      : confirmPassword.length > 0 && confirmPassword === newPassword
                        ? '#4caf50'
                        : '#ddd',
                  }}
                  placeholder="Confirm new password"
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <span style={styles.mismatchText}>Passwords do not match</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
                style={{
                  ...styles.button,
                  opacity: isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <p style={styles.linkText}>
              <Link to="/login" style={styles.link}>Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '4px',
    color: '#007bff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '24px',
    fontWeight: 'normal',
    color: '#666',
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#cc0000',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#e6f7e6',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  backButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    marginTop: '8px',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '16px',
    color: '#666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
  },
  strengthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  strengthBarBackground: {
    flex: 1,
    height: '4px',
    backgroundColor: '#eee',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  strengthLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '80px',
    textAlign: 'right',
  },
  mismatchText: {
    fontSize: '12px',
    color: '#cc0000',
    marginTop: '2px',
  },
};

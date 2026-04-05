import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api/config';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err: any) {
      // Even on error, show the same message to avoid leaking email existence
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="page-container">
      <div style={styles.card} className="auth-card">
        <h1 style={styles.title}>KyroAcademy</h1>
        <h2 style={styles.subtitle}>Forgot Password</h2>

        {submitted ? (
          <div style={styles.successContainer}>
            <div style={styles.success}>
              If an account exists with this email, you'll receive a reset link.
            </div>
            <p style={styles.infoText}>
              Check your email inbox and follow the instructions to reset your password.
            </p>
            <Link to="/login" style={styles.backButton}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && <div style={styles.error}>{error}</div>}

            <p style={styles.infoText}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              <button type="submit" disabled={isSubmitting} style={styles.button}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={styles.linkText}>
              Remember your password? <Link to="/login" style={styles.link}>Sign In</Link>
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
    color: '#0d9488',
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
    marginBottom: '16px',
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
    backgroundColor: '#0d9488',
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
    backgroundColor: '#0d9488',
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
    color: '#0d9488',
    textDecoration: 'none',
  },
};

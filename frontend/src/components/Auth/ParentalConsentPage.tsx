import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api/auth/AuthApi';

export function ParentalConsentPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [consentType, setConsentType] = useState('');

  useEffect(() => {
    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid consent link. Please check the link from your email.');
      return;
    }

    authApi.handleParentalConsent(token, action)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
        setConsentType(result.consentType);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to process consent. The link may have expired.');
      });
  }, [token, action]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>KyroAcademy</h1>
        <h2 style={styles.subtitle}>Parental Consent</h2>

        {status === 'loading' && (
          <p style={{ textAlign: 'center', color: '#666' }}>Processing your response...</p>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              ...styles.statusBox,
              backgroundColor: action === 'approve' ? '#d4edda' : '#f8d7da',
              color: action === 'approve' ? '#155724' : '#721c24',
            }}>
              {action === 'approve' ? 'Approved' : 'Denied'}
            </div>
            <p style={{ color: '#333', margin: '16px 0' }}>{message}</p>
            {consentType === 'REGISTRATION' && action === 'approve' && (
              <p style={{ color: '#666', fontSize: '14px' }}>
                Your child can now log in and start using the platform.
              </p>
            )}
            {consentType === 'ENROLLMENT' && action === 'approve' && (
              <p style={{ color: '#666', fontSize: '14px' }}>
                Your child's course enrollment has been activated.
              </p>
            )}
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...styles.statusBox, backgroundColor: '#f8d7da', color: '#721c24' }}>
              Error
            </div>
            <p style={{ color: '#721c24', margin: '16px 0' }}>{message}</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/" style={styles.link}>Go to KyroAcademy</Link>
        </div>
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
    maxWidth: '450px',
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
  statusBox: {
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
};

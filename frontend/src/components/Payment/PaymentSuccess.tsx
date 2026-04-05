import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment Successful!</h1>
        <p style={styles.message}>Your booking has been confirmed. You'll be able to join the class when the teacher starts it.</p>
        <div style={styles.actions}>
          <button onClick={() => navigate('/my-classes')} style={styles.primaryButton}>
            View My Classes
          </button>
          <button onClick={() => navigate('/classes')} style={styles.secondaryButton}>
            Browse More Classes
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px 20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { color: '#28a745', marginBottom: '16px' },
  message: { color: '#666', lineHeight: '1.6', marginBottom: '32px' },
  actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
  primaryButton: { padding: '12px 32px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  secondaryButton: { padding: '12px 32px', backgroundColor: 'white', color: '#0d9488', border: '1px solid #0d9488', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
};

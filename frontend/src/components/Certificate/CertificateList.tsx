import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Certificate } from '../../types/course/certificate.types';
import { certificateApi } from '../../services/api/course/CertificateApi';

export const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await certificateApi.getMyCertificates();
      setCertificates(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>My Certificates</h1>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div style={styles.empty}>No certificates earned yet. Complete a class to earn your first certificate!</div>
      ) : (
        <div style={styles.grid}>
          {certificates.map((cert) => (
            <div
              key={cert.id}
              style={styles.card}
              onClick={() => navigate(`/certificates/${cert.id}`)}
            >
              <div style={styles.cardIcon}>
                <span style={styles.iconText}>{'\u{1F393}'}</span>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.classTitle}>{cert.classTitle}</h3>
                <div style={styles.detail}>
                  <span style={styles.label}>Teacher:</span>
                  <span>{cert.teacherDisplayName}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Completed:</span>
                  <span>{formatDate(cert.completedAt)}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Issued:</span>
                  <span>{formatDate(cert.issuedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', overflow: 'hidden', border: '2px solid #fd7e14' },
  cardIcon: { textAlign: 'center', padding: '20px 16px 8px', backgroundColor: '#fff8f0' },
  iconText: { fontSize: '48px' },
  cardBody: { padding: '16px' },
  classTitle: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' },
  detail: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' },
  label: { color: '#666', fontWeight: 'bold' },
};

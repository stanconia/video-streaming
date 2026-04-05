import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Certificate } from '../../types/course/certificate.types';
import { certificateApi } from '../../services/api/course/CertificateApi';

export const CertificateView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadCertificate();
  }, [id]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const data = await certificateApi.getCertificate(id!);
      setCertificate(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={styles.loading}>Loading certificate...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!certificate) return <div style={styles.error}>Certificate not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.actions}>
        <button onClick={() => navigate('/certificates')} style={styles.backButton}>Back to Certificates</button>
        <button onClick={handlePrint} style={styles.printButton}>Print Certificate</button>
      </div>

      <div style={styles.certificate}>
        <div style={styles.certificateInner}>
          <div style={styles.decorativeTop} />

          <div style={styles.certIcon}>{'\u{1F393}'}</div>

          <h1 style={styles.certMainTitle}>Certificate of Completion</h1>

          <p style={styles.certSubtext}>This is to certify that</p>

          <h2 style={styles.studentName}>{certificate.studentDisplayName}</h2>

          <p style={styles.certSubtext}>has successfully completed the course</p>

          <h3 style={styles.classTitle}>{certificate.classTitle}</h3>

          <p style={styles.certSubtext}>under the instruction of</p>

          <p style={styles.teacherName}>{certificate.teacherDisplayName}</p>

          <div style={styles.dateSection}>
            <div style={styles.dateBlock}>
              <span style={styles.dateLabel}>Completed</span>
              <span style={styles.dateValue}>{formatDate(certificate.completedAt)}</span>
            </div>
            <div style={styles.dateBlock}>
              <span style={styles.dateLabel}>Issued</span>
              <span style={styles.dateValue}>{formatDate(certificate.issuedAt)}</span>
            </div>
          </div>

          <div style={styles.decorativeBottom} />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center' },
  actions: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  printButton: { padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  certificate: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px' },
  certificateInner: { border: '3px solid #fd7e14', borderRadius: '6px', padding: '40px', textAlign: 'center', position: 'relative' },
  decorativeTop: { height: '4px', background: 'linear-gradient(to right, #fd7e14, #0d9488, #fd7e14)', marginBottom: '30px', borderRadius: '2px' },
  certIcon: { fontSize: '64px', marginBottom: '16px' },
  certMainTitle: { fontSize: '28px', color: '#333', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '2px', textTransform: 'uppercase' as const },
  certSubtext: { color: '#666', fontSize: '14px', marginBottom: '8px' },
  studentName: { fontSize: '24px', color: '#0d9488', marginBottom: '16px', fontStyle: 'italic' },
  classTitle: { fontSize: '20px', color: '#333', marginBottom: '16px' },
  teacherName: { fontSize: '18px', color: '#333', fontWeight: 'bold', marginBottom: '30px' },
  dateSection: { display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '30px' },
  dateBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  dateLabel: { fontSize: '12px', color: '#666', textTransform: 'uppercase' as const, marginBottom: '4px' },
  dateValue: { fontSize: '14px', color: '#333', fontWeight: 'bold' },
  decorativeBottom: { height: '4px', background: 'linear-gradient(to right, #fd7e14, #0d9488, #fd7e14)', marginTop: '10px', borderRadius: '2px' },
};

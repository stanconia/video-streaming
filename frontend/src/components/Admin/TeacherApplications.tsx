import React, { useState, useEffect } from 'react';
import { TeacherApplication } from '../../types/admin/admin.types';
import { adminApi } from '../../services/api/admin/AdminApi';

export const TeacherApplications: React.FC = () => {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getApplications(statusFilter || undefined);
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveApplication(id);
      loadApplications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectApplication(id);
      loadApplications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const getStatusStyle = (status: string): React.CSSProperties => {
    const colors: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: '#fff3cd', text: '#856404' },
      APPROVED: { bg: '#d4edda', text: '#155724' },
      REJECTED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    return { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: color.bg, color: color.text };
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Teacher Applications</h1>

      <div style={styles.filters}>
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{ ...styles.filterButton, ...(statusFilter === s ? styles.activeFilter : {}) }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : applications.length === 0 ? (
        <div style={styles.empty}>No applications found.</div>
      ) : (
        <div style={styles.list}>
          {applications.map((app) => (
            <div key={app.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.name}>{app.userDisplayName}</span>
                  <span style={styles.email}>{app.userEmail}</span>
                </div>
                <span style={getStatusStyle(app.status)}>{app.status}</span>
              </div>
              {app.notes && <p style={styles.notes}>{app.notes}</p>}
              <div style={styles.cardFooter}>
                <span style={styles.date}>Submitted: {formatDate(app.submittedAt)}</span>
                {app.status === 'PENDING' && (
                  <div style={styles.actions}>
                    <button onClick={() => handleApprove(app.id)} style={styles.approveButton}>Approve</button>
                    <button onClick={() => handleReject(app.id)} style={styles.rejectButton}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  pageTitle: { marginBottom: '20px' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px' },
  filterButton: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' },
  activeFilter: { backgroundColor: '#0d9488', color: 'white', borderColor: '#0d9488' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '40px', color: '#666', backgroundColor: 'white', borderRadius: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  name: { fontWeight: 'bold', fontSize: '16px', marginRight: '12px' },
  email: { color: '#666', fontSize: '14px' },
  notes: { color: '#555', fontSize: '14px', lineHeight: '1.5', margin: '0 0 12px 0' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: '12px', color: '#999' },
  actions: { display: 'flex', gap: '8px' },
  approveButton: { padding: '6px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  rejectButton: { padding: '6px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};

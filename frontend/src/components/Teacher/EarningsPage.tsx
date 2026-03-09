import React, { useState, useEffect } from 'react';
import { PayoutSummary, TeacherEarning } from '../../types/payment/payment.types';
import { payoutApi } from '../../services/api/payment/PayoutApi';
import { StatCard } from '../Dashboard/StatCard';

export const EarningsPage: React.FC = () => {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [history, setHistory] = useState<TeacherEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, h] = await Promise.all([
        payoutApi.getSummary(),
        payoutApi.getHistory(),
      ]);
      setSummary(s);
      setHistory(h);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading earnings...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container} className="page-container">
      <h1 style={styles.title}>Earnings</h1>

      {summary && (
        <div style={styles.statsGrid} className="stats-grid">
          <StatCard label="Total Earnings" value={`$${summary.totalEarnings.toFixed(2)}`} color="#28a745" />
          <StatCard label="Pending Payouts" value={`$${summary.pendingPayouts.toFixed(2)}`} color="#ffc107" />
          <StatCard label="Completed Payouts" value={`$${summary.completedPayouts.toFixed(2)}`} color="#007bff" />
          <StatCard label="Payout Count" value={summary.payoutCount} color="#6f42c1" />
        </div>
      )}

      <h2 style={styles.subtitle}>Earnings History</h2>
      {history.length === 0 ? (
        <p style={styles.emptyText}>No earnings yet. Bookings will appear here once students book your classes.</p>
      ) : (
        <div className="table-responsive"><table style={styles.table} className="earnings-table">
          <thead>
            <tr>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Fee (15%)</th>
              <th style={styles.th}>Your Payout</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((e, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.evenRow : {}}>
                <td style={styles.td}>{e.classTitle}</td>
                <td style={styles.td}>{e.studentName}</td>
                <td style={styles.td}>${e.amount.toFixed(2)}</td>
                <td style={styles.td}>${e.platformFee.toFixed(2)}</td>
                <td style={styles.td}>${e.teacherPayout.toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: e.payoutStatus === 'COMPLETED' ? '#d4edda' :
                      e.payoutStatus === 'HELD' ? '#fff3cd' : '#f8f9fa',
                    color: e.payoutStatus === 'COMPLETED' ? '#155724' :
                      e.payoutStatus === 'HELD' ? '#856404' : '#333',
                  }}>{e.payoutStatus}</span>
                </td>
                <td style={styles.td}>{new Date(e.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  title: { marginBottom: '24px' },
  subtitle: { marginBottom: '16px', marginTop: '32px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666' },
  error: { color: '#721c24', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  emptyText: { color: '#666', textAlign: 'center', padding: '40px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontSize: '13px', fontWeight: 'bold', color: '#495057' },
  td: { padding: '12px 16px', borderBottom: '1px solid #dee2e6', fontSize: '14px' },
  evenRow: { backgroundColor: '#f8f9fa' },
  badge: { display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
};

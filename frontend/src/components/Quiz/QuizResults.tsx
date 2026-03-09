import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuizAttempt } from '../../types/course/quiz.types';
import { quizApi } from '../../services/api/course/QuizApi';

interface QuizResultsProps {
  courseId: string;
  quizId: string;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ courseId, quizId }) => {
  const { user } = useAuth();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quizApi.getMyAttempts(courseId, quizId);
      setAttempts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  }, [courseId, quizId]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  if (loading) return <div style={styles.loading}>Loading results...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Quiz Results</h2>

      {error && <div style={styles.error}>{error}</div>}

      {attempts.length === 0 ? (
        <div style={styles.empty}>No attempts yet. Take the quiz to see your results here.</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Result</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} style={attempt.passed ? styles.passedRow : styles.failedRow}>
                  <td style={styles.td}>{formatDate(attempt.startedAt)}</td>
                  <td style={styles.td}>
                    {attempt.score} / {attempt.totalPoints}
                  </td>
                  <td style={styles.td}>{attempt.percentage.toFixed(1)}%</td>
                  <td style={styles.td}>
                    <span style={attempt.passed ? styles.passedBadge : styles.failedBadge}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {attempts.length > 0 && (
        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Attempts</span>
            <span style={styles.summaryValue}>{attempts.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Best Score</span>
            <span style={styles.summaryValue}>
              {Math.max(...attempts.map((a) => a.percentage)).toFixed(1)}%
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Times Passed</span>
            <span style={styles.summaryValue}>
              {attempts.filter((a) => a.passed).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  loading: { textAlign: 'center', padding: '20px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '24px', color: '#666', fontSize: '14px' },
  tableWrapper: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '12px', borderBottom: '2px solid #dee2e6', fontSize: '14px', color: '#555', fontWeight: 'bold' },
  td: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' },
  passedRow: { backgroundColor: '#f0fff0' },
  failedRow: { backgroundColor: '#fff5f5' },
  passedBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#d4edda', color: '#155724' },
  failedBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8d7da', color: '#721c24' },
  summary: { display: 'flex', gap: '24px', marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: '12px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' as const, fontWeight: 'bold' },
  summaryValue: { fontSize: '20px', fontWeight: 'bold', color: '#333' },
};

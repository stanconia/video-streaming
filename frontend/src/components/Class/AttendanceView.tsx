import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../../types/class/attendance.types';
import { classApi } from '../../services/api/class/ClassApi';

interface AttendanceViewProps {
  classId: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ classId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [classId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await classApi.getAttendance(classId);
      setRecords(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString();
  };

  if (loading) return <div style={styles.loading}>Loading attendance...</div>;
  if (records.length === 0) return <p style={styles.empty}>No attendance records.</p>;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Attendance ({records.length})</h3>
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span style={styles.col}>Student</span>
          <span style={styles.colSmall}>Joined</span>
          <span style={styles.colSmall}>Left</span>
          <span style={styles.colSmall}>Duration</span>
        </div>
        {records.map((r) => (
          <div key={r.id} style={styles.row}>
            <span style={styles.col}>{r.userDisplayName}</span>
            <span style={styles.colSmall}>{formatTime(r.joinedAt)}</span>
            <span style={styles.colSmall}>{formatTime(r.leftAt)}</span>
            <span style={styles.colSmall}>{r.durationMinutes != null ? `${r.durationMinutes} min` : '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { marginTop: '20px' },
  loading: { color: '#666', padding: '12px' },
  empty: { color: '#666', textAlign: 'center', padding: '12px' },
  title: { margin: '0 0 12px 0', fontSize: '16px' },
  table: { border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  headerRow: { display: 'flex', padding: '10px 16px', backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '13px', borderBottom: '2px solid #eee' },
  row: { display: 'flex', padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
  col: { flex: 2 },
  colSmall: { flex: 1 },
};

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color = '#007bff' }) => {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.value, color }}>{value}</div>
      <div style={styles.label}>{label}</div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', minWidth: '140px' },
  value: { fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' },
  label: { fontSize: '14px', color: '#666' },
};

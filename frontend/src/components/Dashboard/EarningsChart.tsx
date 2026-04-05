import React from 'react';
import { MonthlyEarning } from '../../types/admin/dashboard.types';

interface EarningsChartProps {
  data: MonthlyEarning[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  if (data.length === 0) return <p style={{ color: '#666', textAlign: 'center' }}>No earnings data yet.</p>;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Monthly Earnings</h3>
      <div style={styles.chart}>
        {data.map((d, i) => (
          <div key={i} style={styles.barWrapper}>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  height: `${(d.amount / maxAmount) * 100}%`,
                }}
              />
            </div>
            <div style={styles.barLabel}>{d.month}</div>
            <div style={styles.barValue}>${d.amount.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 16px 0', fontSize: '16px' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', padding: '0 8px' },
  barWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' },
  barContainer: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '70%', backgroundColor: '#0d9488', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s' },
  barLabel: { fontSize: '11px', color: '#666', marginTop: '6px' },
  barValue: { fontSize: '10px', color: '#333', fontWeight: 'bold' },
};

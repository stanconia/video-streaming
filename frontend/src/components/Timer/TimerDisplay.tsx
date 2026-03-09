import React, { useEffect, useRef } from 'react';

interface Props {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
}

export const TimerDisplay: React.FC<Props> = ({ remainingSeconds, isRunning, isPaused, isExpired }) => {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes timer-flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(styleEl);
    styleInjected.current = true;
    return () => {
      document.head.removeChild(styleEl);
      styleInjected.current = false;
    };
  }, []);

  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLow = remainingSeconds < 30 && remainingSeconds > 0;

  const textStyle: React.CSSProperties = {
    ...styles.time,
    color: isLow || isExpired ? '#ff4444' : '#e0e0e0',
    animation: isExpired ? 'timer-flash 1s ease-in-out infinite' : undefined,
  };

  const statusLabel = isExpired ? 'EXPIRED' : isPaused ? 'PAUSED' : isRunning ? 'LIVE' : '';

  return (
    <div style={styles.container}>
      <span style={textStyle}>{display}</span>
      {statusLabel && (
        <span style={{
          ...styles.status,
          color: isExpired ? '#ff4444' : isPaused ? '#f0c040' : '#4caf50',
        }}>
          {statusLabel}
        </span>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#1a1a2e',
    padding: '8px 16px',
    borderRadius: '6px',
  },
  time: {
    fontFamily: 'monospace',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  status: {
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
};

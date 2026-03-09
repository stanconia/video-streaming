import React, { useState } from 'react';

interface Props {
  isRunning: boolean;
  isPaused: boolean;
  onStart: (seconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<Props> = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onReset,
}) => {
  const [minutes, setMinutes] = useState(5);

  const handleStart = () => {
    if (minutes > 0) {
      onStart(minutes * 60);
    }
  };

  return (
    <div style={styles.container}>
      {!isRunning && !isPaused && (
        <div style={styles.row}>
          <input
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
            style={styles.input}
            placeholder="Minutes"
          />
          <span style={styles.label}>min</span>
          <button style={styles.startButton} onClick={handleStart}>
            Start Timer
          </button>
        </div>
      )}
      {isRunning && !isPaused && (
        <div style={styles.row}>
          <button style={styles.pauseButton} onClick={onPause}>
            Pause
          </button>
          <button style={styles.resetButton} onClick={onReset}>
            Reset
          </button>
        </div>
      )}
      {isPaused && (
        <div style={styles.row}>
          <button style={styles.startButton} onClick={onResume}>
            Resume
          </button>
          <button style={styles.resetButton} onClick={onReset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    width: '60px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    fontSize: '14px',
    textAlign: 'center',
  },
  label: {
    color: '#aaa',
    fontSize: '13px',
  },
  startButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  pauseButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#f0c040',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

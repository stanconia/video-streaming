import React from 'react';

interface BreakoutRoom {
  id: string;
  name: string;
}

interface Props {
  breakoutRooms: BreakoutRoom[];
  remainingSeconds: number | null;
  onEnd: () => void;
}

export const BreakoutOverview: React.FC<Props> = ({ breakoutRooms, remainingSeconds, onEnd }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Breakout Rooms</span>
        {remainingSeconds !== null && remainingSeconds >= 0 && (
          <span style={{
            ...styles.timer,
            color: remainingSeconds < 60 ? '#ff4444' : '#f0c040',
          }}>
            {formatTime(remainingSeconds)}
          </span>
        )}
      </div>
      <div style={styles.roomList}>
        {breakoutRooms.map(room => (
          <div key={room.id} style={styles.roomItem}>
            <span style={styles.roomName}>{room.name}</span>
          </div>
        ))}
      </div>
      <button style={styles.endButton} onClick={onEnd}>
        End All Breakouts
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  timer: {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  roomList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#16213e',
    borderRadius: '6px',
  },
  roomName: {
    color: '#e0e0e0',
    fontSize: '14px',
  },
  endButton: {
    padding: '12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
};

import React from 'react';

interface BreakoutRoom {
  id: string;
  name: string;
}

interface Props {
  breakoutRoom: BreakoutRoom;
  remainingSeconds: number | null;
  onLeave: () => void;
}

export const BreakoutRoomView: React.FC<Props> = ({ breakoutRoom, remainingSeconds, onLeave }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>Breakout Room</span>
          <span style={styles.roomName}>{breakoutRoom.name}</span>
        </div>
        {remainingSeconds !== null && remainingSeconds >= 0 && (
          <div style={{
            ...styles.timer,
            color: remainingSeconds < 60 ? '#ff4444' : '#f0c040',
          }}>
            {formatTime(remainingSeconds)}
          </div>
        )}
      </div>
      <div style={styles.content}>
        {/* Parent component renders actual video content here */}
      </div>
      <button style={styles.leaveButton} onClick={onLeave}>
        Return to Main Room
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    minHeight: '200px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid #333',
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  roomLabel: {
    color: '#888',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  roomName: {
    color: '#e0e0e0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  timer: {
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  content: {
    flex: 1,
    padding: '16px',
  },
  leaveButton: {
    margin: '12px',
    padding: '12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

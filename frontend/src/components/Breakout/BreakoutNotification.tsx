import React from 'react';

interface Props {
  roomName: string;
  onJoin: () => void;
}

export const BreakoutNotification: React.FC<Props> = ({ roomName, onJoin }) => (
  <div style={styles.banner}>
    <span style={styles.text}>
      You've been assigned to <strong>{roomName}</strong>. Click to join.
    </span>
    <button style={styles.joinButton} onClick={onJoin}>
      Join
    </button>
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f0c040',
    color: '#1a1a2e',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  text: {
    fontSize: '14px',
    flex: 1,
  },
  joinButton: {
    padding: '8px 20px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};

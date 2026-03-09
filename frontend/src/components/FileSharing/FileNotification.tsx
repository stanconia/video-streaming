import React from 'react';

interface Props {
  fileName: string;
  onDismiss: () => void;
}

export const FileNotification: React.FC<Props> = ({ fileName, onDismiss }) => (
  <div style={styles.toast}>
    <div style={styles.content}>
      <span style={styles.text}>New file shared: <strong>{fileName}</strong></span>
    </div>
    <button style={styles.dismissButton} onClick={onDismiss}>
      X
    </button>
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  toast: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#16213e',
    border: '1px solid #3a7bd5',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    maxWidth: '350px',
  },
  content: {
    flex: 1,
  },
  text: {
    color: '#e0e0e0',
    fontSize: '13px',
  },
  dismissButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    color: '#888',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
};

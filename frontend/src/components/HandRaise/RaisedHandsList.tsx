import React from 'react';

interface Props {
  raisedHands: Map<string, string>;
  onLowerHand: (userId: string) => void;
  onLowerAll: () => void;
}

export const RaisedHandsList: React.FC<Props> = ({ raisedHands, onLowerHand, onLowerAll }) => {
  const entries = Array.from(raisedHands.entries());

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        Raised Hands ({entries.length})
      </div>
      <div style={styles.list}>
        {entries.length === 0 ? (
          <div style={styles.empty}>No raised hands</div>
        ) : (
          entries.map(([userId, userName]) => (
            <div key={userId} style={styles.item}>
              <span style={styles.name}>{userName}</span>
              <button style={styles.lowerButton} onClick={() => onLowerHand(userId)}>
                Lower
              </button>
            </div>
          ))
        )}
      </div>
      {entries.length > 0 && (
        <button style={styles.lowerAllButton} onClick={onLowerAll}>
          Lower All
        </button>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  header: {
    color: '#f0c040',
    fontSize: '14px',
    fontWeight: 'bold',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  empty: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    padding: '16px 0',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: '#16213e',
    borderRadius: '6px',
  },
  name: {
    color: '#e0e0e0',
    fontSize: '13px',
  },
  lowerButton: {
    padding: '4px 10px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  lowerAllButton: {
    padding: '8px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
};

import React from 'react';

interface Props {
  isActive: boolean;
  participants: Map<string, string>;
  drawPermissions: Set<string>;
  onToggle: (active: boolean) => void;
  onGrantDraw: (userId: string) => void;
  onRevokeDraw: (userId: string) => void;
}

export const WhiteboardControls: React.FC<Props> = ({
  isActive,
  participants,
  drawPermissions,
  onToggle,
  onGrantDraw,
  onRevokeDraw,
}) => {
  const participantEntries = Array.from(participants.entries());

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.toggleButton,
          backgroundColor: isActive ? '#ff4444' : '#4caf50',
        }}
        onClick={() => onToggle(!isActive)}
      >
        {isActive ? 'Close Whiteboard' : 'Open Whiteboard'}
      </button>

      {isActive && participantEntries.length > 0 && (
        <div style={styles.permissionsList}>
          <div style={styles.permissionsHeader}>Draw Permissions</div>
          {participantEntries.map(([userId, userName]) => {
            const hasPermission = drawPermissions.has(userId);
            return (
              <div key={userId} style={styles.participantRow}>
                <span style={styles.participantName}>{userName}</span>
                <button
                  style={{
                    ...styles.permissionButton,
                    backgroundColor: hasPermission ? '#ff4444' : '#4caf50',
                  }}
                  onClick={() => hasPermission ? onRevokeDraw(userId) : onGrantDraw(userId)}
                >
                  {hasPermission ? 'Revoke' : 'Grant'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
  },
  toggleButton: {
    padding: '10px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  permissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  permissionsHeader: {
    color: '#aaa',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    paddingBottom: '4px',
    borderBottom: '1px solid #333',
  },
  participantRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: '#16213e',
    borderRadius: '6px',
  },
  participantName: {
    color: '#e0e0e0',
    fontSize: '13px',
  },
  permissionButton: {
    padding: '4px 10px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};

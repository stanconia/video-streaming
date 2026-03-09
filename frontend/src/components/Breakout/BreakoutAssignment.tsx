import React, { useState } from 'react';

interface BreakoutRoom {
  id: string;
  name: string;
}

interface Props {
  breakoutRooms: BreakoutRoom[];
  participants: Map<string, string>;
  onAssign: (assignments: Record<string, string>) => void;
}

export const BreakoutAssignment: React.FC<Props> = ({ breakoutRooms, participants, onAssign }) => {
  const participantEntries = Array.from(participants.entries());

  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    participantEntries.forEach(([userId]) => {
      initial[userId] = breakoutRooms.length > 0 ? breakoutRooms[0].id : '';
    });
    return initial;
  });

  const handleChange = (userId: string, roomId: string) => {
    setAssignments(prev => ({ ...prev, [userId]: roomId }));
  };

  const handleAutoAssign = () => {
    const shuffled = [...participantEntries].sort(() => Math.random() - 0.5);
    const autoAssigned: Record<string, string> = {};
    shuffled.forEach(([userId], index) => {
      const roomIndex = index % breakoutRooms.length;
      autoAssigned[userId] = breakoutRooms[roomIndex].id;
    });
    setAssignments(autoAssigned);
  };

  const handleSubmit = () => {
    onAssign(assignments);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Assign Participants</div>
      <div style={styles.list}>
        {participantEntries.map(([userId, userName]) => (
          <div key={userId} style={styles.row}>
            <span style={styles.name}>{userName}</span>
            <select
              value={assignments[userId] || ''}
              onChange={(e) => handleChange(userId, e.target.value)}
              style={styles.select}
            >
              {breakoutRooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {participantEntries.length === 0 && (
        <div style={styles.empty}>No participants to assign</div>
      )}
      <div style={styles.actions}>
        <button style={styles.autoButton} onClick={handleAutoAssign}>
          Auto Assign
        </button>
        <button style={styles.assignButton} onClick={handleSubmit}>
          Assign All
        </button>
      </div>
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
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 'bold',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: '#16213e',
    borderRadius: '6px',
    gap: '8px',
  },
  name: {
    color: '#e0e0e0',
    fontSize: '13px',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  select: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontSize: '12px',
    outline: 'none',
  },
  empty: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    padding: '16px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '6px',
    borderTop: '1px solid #333',
  },
  autoButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#3a7bd5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  assignButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};

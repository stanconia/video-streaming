import React, { useState } from 'react';

interface Props {
  onCreate: (names: string[], duration?: number) => void;
}

export const CreateBreakoutForm: React.FC<Props> = ({ onCreate }) => {
  const [roomCount, setRoomCount] = useState(2);
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = Array.from({ length: roomCount }, (_, i) => `Room ${i + 1}`);
    const durationMinutes = duration ? parseInt(duration) : undefined;
    onCreate(names, durationMinutes);
  };

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <div style={styles.field}>
        <label style={styles.label}>Number of Rooms</label>
        <select
          value={roomCount}
          onChange={(e) => setRoomCount(parseInt(e.target.value))}
          style={styles.select}
        >
          {Array.from({ length: 7 }, (_, i) => i + 2).map(n => (
            <option key={n} value={n}>{n} rooms</option>
          ))}
        </select>
      </div>

      <div style={styles.roomPreview}>
        {Array.from({ length: roomCount }, (_, i) => (
          <span key={i} style={styles.roomTag}>Room {i + 1}</span>
        ))}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Duration (optional)</label>
        <div style={styles.durationRow}>
          <input
            type="number"
            min={1}
            max={120}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="No limit"
            style={styles.input}
          />
          <span style={styles.unit}>minutes</span>
        </div>
      </div>

      <button type="submit" style={styles.submitButton}>
        Create Breakout Rooms
      </button>
    </form>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  select: {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
  },
  roomPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  roomTag: {
    padding: '4px 10px',
    backgroundColor: '#16213e',
    color: '#3a7bd5',
    fontSize: '12px',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  durationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
  },
  unit: {
    color: '#aaa',
    fontSize: '13px',
  },
  submitButton: {
    padding: '12px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

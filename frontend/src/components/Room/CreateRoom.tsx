import React, { useState } from 'react';
import { roomApi } from '../../services/api/RoomApi';

interface CreateRoomProps {
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onRoomCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const room = await roomApi.createRoom(roomName.trim());
      console.log('Room created:', room);
      onRoomCreated(room.id);
    } catch (err: any) {
      setError('Failed to create room');
      console.error('Error creating room:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create New Room</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="roomName" style={styles.label}>
            Room Name:
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            style={styles.input}
            disabled={creating}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" style={styles.button} disabled={creating}>
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  form: {
    marginTop: '20px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
  },
  error: {
    color: 'red',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
  },
};

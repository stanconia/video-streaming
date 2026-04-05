import React, { useState, useEffect } from 'react';
import { Room } from '../../types/live/room.types';
import { roomApi } from '../../services/api/live/RoomApi';

interface RoomListProps {
  onJoinRoom: (roomId: string, role: 'broadcaster' | 'viewer') => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const roomsList = await roomApi.getRooms();
      setRooms(roomsList);
      setError(null);
    } catch (err: any) {
      setError('Failed to load rooms');
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading rooms...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={loadRooms} style={styles.button}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Available Rooms</h2>

      {rooms.length === 0 ? (
        <p>No active rooms available</p>
      ) : (
        <div style={styles.roomGrid}>
          {rooms.map((room) => (
            <div key={room.id} style={styles.roomCard}>
              <h3>{room.name}</h3>
              <p>Room ID: {room.id.substring(0, 8)}...</p>
              <p>Status: {room.active ? 'Active' : 'Inactive'}</p>
              {room.broadcasterId && <p>Broadcaster: {room.broadcasterId}</p>}

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => onJoinRoom(room.id, 'viewer')}
                  style={styles.button}
                  disabled={!room.active}
                >
                  Join as Viewer
                </button>
                {!room.broadcasterId && (
                  <button
                    onClick={() => onJoinRoom(room.id, 'broadcaster')}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    Join as Broadcaster
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  roomCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '14px',
  },
  primaryButton: {
    backgroundColor: '#0d9488',
  },
  error: {
    color: 'red',
    padding: '10px',
    marginBottom: '10px',
  },
};

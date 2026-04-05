import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recording } from '../../types/live/recording.types';
import { recordingApi } from '../../services/api/live/RecordingApi';
import { useAuth } from '../../context/AuthContext';

export const RecordingsList: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const data = await recordingApi.getRecordings();
      setRecordings(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '--';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: '#d4edda', text: '#155724' },
      RECORDING: { bg: '#fff3cd', text: '#856404' },
      STARTING: { bg: '#cce5ff', text: '#004085' },
      STOPPING: { bg: '#cce5ff', text: '#004085' },
      UPLOADING: { bg: '#cce5ff', text: '#004085' },
      FAILED: { bg: '#f8d7da', text: '#721c24' },
    };
    const color = colors[status] || { bg: '#e2e3e5', text: '#383d41' };
    return (
      <span style={{ ...styles.badge, backgroundColor: color.bg, color: color.text }}>
        {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1>Recordings</h1>
            <p>Browse and play recorded sessions</p>
          </div>
          <div style={styles.headerActions}>
            {user && (
              <span style={styles.userName}>{user.displayName}</span>
            )}
            <button onClick={() => navigate('/')} style={styles.backButton}>
              Back to Rooms
            </button>
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading recordings...</div>
      ) : recordings.length === 0 ? (
        <div style={styles.empty}>
          <p>No recordings yet.</p>
          <p>Start a broadcast and click Record to create one.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {recordings.map((recording) => (
            <div key={recording.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.roomName}>{recording.roomName}</h3>
                {getStatusBadge(recording.status)}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.detail}>
                  <span style={styles.label}>Date:</span>
                  <span>{formatDate(recording.createdAt)}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Duration:</span>
                  <span>{formatDuration(recording.durationMs)}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>Size:</span>
                  <span>{formatFileSize(recording.fileSizeBytes)}</span>
                </div>
              </div>
              <div style={styles.cardFooter}>
                {recording.status === 'COMPLETED' ? (
                  <button
                    onClick={() => navigate(`/recordings/${recording.id}/play`)}
                    style={styles.playButton}
                  >
                    Play
                  </button>
                ) : (
                  <span style={styles.notReady}>
                    {recording.status === 'FAILED' ? 'Recording failed' : 'Processing...'}
                  </span>
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
  header: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    color: '#555',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
  },
  roomName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  cardBody: {
    padding: '16px',
  },
  detail: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  label: {
    color: '#666',
    fontWeight: 'bold',
  },
  cardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #eee',
    textAlign: 'center',
  },
  playButton: {
    padding: '8px 32px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  notReady: {
    color: '#999',
    fontSize: '14px',
  },
};

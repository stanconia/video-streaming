import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recording } from '../../types/live/recording.types';
import { recordingApi } from '../../services/api/live/RecordingApi';

export const PlaybackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadRecording(id);
  }, [id]);

  const loadRecording = async (recordingId: string) => {
    try {
      setLoading(true);
      const [rec, url] = await Promise.all([
        recordingApi.getRecording(recordingId),
        recordingApi.getPlaybackUrl(recordingId),
      ]);
      setRecording(rec);
      setPlaybackUrl(url);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load recording');
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading recording...</div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'Recording not found'}</div>
        <button onClick={() => navigate('/recordings')} style={styles.backButton}>
          Back to Recordings
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/recordings')} style={styles.backButton}>
          Back to Recordings
        </button>
        <h2 style={styles.title}>{recording.roomName}</h2>
      </div>

      <div style={styles.playerWrapper}>
        {playbackUrl ? (
          <video
            controls
            autoPlay={false}
            style={styles.videoPlayer}
            src={playbackUrl}
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <div style={styles.noPlayback}>Recording not available for playback</div>
        )}
      </div>

      <div style={styles.info}>
        <div style={styles.infoRow}>
          <span style={styles.label}>Room:</span>
          <span>{recording.roomName}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Recorded:</span>
          <span>{formatDate(recording.createdAt)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Duration:</span>
          <span>{formatDuration(recording.durationMs)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Size:</span>
          <span>{formatFileSize(recording.fileSizeBytes)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>Status:</span>
          <span>{recording.status}</span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '960px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  playerWrapper: {
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
    aspectRatio: '16/9',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  noPlayback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '18px',
  },
  info: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
    fontSize: '16px',
  },
  error: {
    color: '#721c24',
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
};

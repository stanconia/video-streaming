import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recording } from '../../types/live/recording.types';
import { recordingApi } from '../../services/api/live/RecordingApi';

export const PlaybackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

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

      // Load caption URL: use the one from the recording response, or fetch separately
      if (rec.captionUrl) {
        setCaptionUrl(rec.captionUrl);
      } else {
        const capUrl = await recordingApi.getCaptionUrl(recordingId);
        setCaptionUrl(capUrl);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!id) return;
    try {
      setTranscribing(true);
      setTranscribeError(null);
      await recordingApi.transcribeRecording(id);
      // Poll for caption availability (transcription is async)
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000;
      const poll = async () => {
        attempts++;
        const capUrl = await recordingApi.getCaptionUrl(id);
        if (capUrl) {
          setCaptionUrl(capUrl);
          setTranscribing(false);
        } else if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setTranscribing(false);
          setTranscribeError('Transcription is taking longer than expected. Please refresh later.');
        }
      };
      setTimeout(poll, pollInterval);
    } catch (err: any) {
      setTranscribing(false);
      setTranscribeError(err.response?.data?.error || 'Failed to start transcription');
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
            crossOrigin="anonymous"
            onError={() => setError('Failed to load video. The recording may still be processing.')}
          >
            {captionUrl && (
              <track
                kind="captions"
                src={captionUrl}
                srcLang="en"
                label="English"
                default
              />
            )}
            Your browser does not support the video element.
          </video>
        ) : recording.status === 'COMPLETED' ? (
          <div style={styles.noPlayback}>
            <p>Playback URL not available. Try refreshing.</p>
            <button onClick={() => loadRecording(id!)} style={styles.retryButton}>Retry</button>
          </div>
        ) : recording.status === 'UPLOADING' || recording.status === 'STOPPING' ? (
          <div style={styles.noPlayback}>
            <div style={styles.processingSpinner} />
            <p>Recording is being processed... This may take a minute.</p>
            <button onClick={() => loadRecording(id!)} style={styles.retryButton}>Check Again</button>
          </div>
        ) : recording.status === 'FAILED' ? (
          <div style={styles.noPlayback}>
            <p>Recording failed: {recording.errorMessage || 'Unknown error'}</p>
          </div>
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
        <div style={styles.infoRow}>
          <span style={styles.label}>Captions:</span>
          <span>{captionUrl ? 'Available' : 'Not generated'}</span>
        </div>
      </div>

      {recording.status === 'COMPLETED' && (
        <div style={styles.captionSection}>
          {captionUrl ? (
            <div style={styles.captionStatus}>
              Captions are available and will display automatically during playback.
            </div>
          ) : transcribing ? (
            <div style={styles.captionStatus}>
              <div style={styles.captionSpinner} />
              Captions generating... This may take a few minutes.
            </div>
          ) : (
            <div>
              <button onClick={handleGenerateCaptions} style={styles.generateButton}>
                Generate Captions
              </button>
              {transcribeError && (
                <div style={styles.transcribeError}>{transcribeError}</div>
              )}
            </div>
          )}
        </div>
      )}
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '16px',
    gap: '12px',
  },
  retryButton: {
    padding: '8px 20px',
    backgroundColor: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  processingSpinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid #333',
    borderTopColor: '#0d9488',
    animation: 'spin 1s linear infinite',
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
  captionSection: {
    marginTop: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  captionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#555',
    fontSize: '14px',
  },
  captionSpinner: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #ddd',
    borderTopColor: '#0d9488',
    animation: 'spin 1s linear infinite',
  },
  generateButton: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  transcribeError: {
    color: '#721c24',
    marginTop: '8px',
    fontSize: '13px',
  },
};

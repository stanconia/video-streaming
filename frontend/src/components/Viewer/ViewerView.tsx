import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { ChatWindow } from '../Chat/ChatWindow';
import { VideoGrid } from '../Video/VideoGrid';

interface ViewerViewProps {
  roomId: string;
  userId: string;
  onLeave: () => void;
}

export const ViewerView: React.FC<ViewerViewProps> = ({ roomId, userId, onLeave }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const { localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff, startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, signalingClient } = useWebRTC({
    roomId,
    role: 'viewer',
    userId,
  });

  // Auto-start camera when component mounts
  useEffect(() => {
    const autoStart = async () => {
      try {
        await startMedia();
        setIsStreaming(true);
      } catch (err) {
        console.error('Failed to auto-start media:', err);
      }
    };
    autoStart();
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleToggleCamera = async () => {
    if (isStreaming) {
      // Just toggle video, don't stop entire stream
      toggleVideo();
    } else {
      try {
        await startMedia();
        setIsStreaming(true);
      } catch (err) {
        console.error('Failed to start media:', err);
      }
    }
  };

  const handleLeave = () => {
    stopMedia();
    leave();
    onLeave();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Video Conference</h2>
        <div style={styles.status}>
          {isConnected ? (
            <span style={styles.statusConnected}>● Connected</span>
          ) : (
            <span style={styles.statusDisconnected}>● Disconnected</span>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.mainContent}>
        <div style={styles.videoSection}>
          {/* All participants grid (including local) */}
          <div style={styles.videoGridContainer}>
            <VideoGrid
              streams={remoteStreams}
              localStream={isVideoOff ? null : localStream}
              localUserId={userId}
              showLocalPlaceholder={isStreaming}
              isLocalMuted={isLocalMuted}
              onToggleLocalMute={toggleLocalMute}
              canMuteOthers={false}
            />
          </div>

          {remoteStreams.size === 0 && !localStream && (
            <div style={styles.waitingMessage}>
              Waiting for other participants to join...
            </div>
          )}

          <div style={styles.controls}>
            <button
              onClick={handleToggleCamera}
              style={isStreaming && !isVideoOff ? styles.stopButton : styles.startButton}
            >
              {isStreaming ? (isVideoOff ? 'Turn On Camera' : 'Turn Off Camera') : 'Start Camera'}
            </button>
            {isStreaming && (
              <button
                onClick={toggleLocalMute}
                style={isLocalMuted ? styles.unmuteMicButton : styles.muteMicButton}
              >
                {isLocalMuted ? '🔊 Unmute' : '🔇 Mute'}
              </button>
            )}
            <button onClick={handleLeave} style={styles.leaveButton}>
              Leave Room
            </button>
          </div>

          <div style={styles.info}>
            <p><strong>Room ID:</strong> {roomId}</p>
            <p><strong>User:</strong> {userId}</p>
            <p><strong>Participants:</strong> {remoteStreams.size + (localStream ? 1 : 0)}</p>
          </div>
        </div>

        <div style={styles.chatSection}>
          <ChatWindow
            roomId={roomId}
            userId={userId}
            userRole="viewer"
            signalingClient={signalingClient}
          />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  status: {
    fontSize: '14px',
  },
  statusConnected: {
    color: 'green',
  },
  statusDisconnected: {
    color: 'red',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '20px',
  },
  videoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  videoGridContainer: {
    minHeight: '400px',
  },
  waitingMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    color: '#888',
    padding: '60px',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    gap: '10px',
  },
  startButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  stopButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  leaveButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  muteMicButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#17a2b8',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  unmuteMicButton: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#ffc107',
    color: 'black',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  info: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  error: {
    color: 'red',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
  },
  chatSection: {
    minHeight: '400px',
  },
};

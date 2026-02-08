import React, { useState, useCallback } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { ChatWindow } from '../Chat/ChatWindow';
import { VideoGrid } from '../Video/VideoGrid';

interface BroadcasterViewProps {
  roomId: string;
  userId: string;
  onLeave: () => void;
}

export const BroadcasterView: React.FC<BroadcasterViewProps> = ({ roomId, userId, onLeave }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const { localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff, startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, muteParticipant, signalingClient } = useWebRTC({
    roomId,
    role: 'broadcaster',
    userId,
  });

  // Use callback ref to set srcObject immediately when video element is created
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (video && localStream) {
      video.srcObject = localStream;
      console.log('>>> BroadcasterView: Set srcObject on video element');
    }
  }, [localStream]);

  // Debug logging
  console.log('>>> BroadcasterView render - isStreaming:', isStreaming, 'isVideoOff:', isVideoOff, 'localStream:', !!localStream, 'remoteStreams.size:', remoteStreams.size);

  const handleStartMedia = async () => {
    try {
      await startMedia();
      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start media:', err);
    }
  };

  const handleToggleCamera = () => {
    toggleVideo();
  };

  const handleLeave = () => {
    stopMedia();
    leave();
    onLeave();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Video Conference - Host</h2>
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
          {/* Local video (large) */}
          <div style={styles.localVideoContainer}>
            {/* Always render video for audio, hide when camera off */}
            {isStreaming && (
              <video
                ref={setVideoRef}
                autoPlay
                muted
                playsInline
                style={isVideoOff ? styles.hiddenVideo : styles.localVideo}
              />
            )}
            {(!isStreaming || isVideoOff) && (
              <div style={styles.noVideo}>
                <div style={styles.avatar}>{userId.charAt(0).toUpperCase()}</div>
                <div style={styles.cameraOffText}>{!isStreaming ? 'Click "Start Camera" to begin' : 'Camera Off'}</div>
              </div>
            )}
            <div style={styles.localLabel}>
              You (Host) {isLocalMuted && '🔇'}
            </div>
          </div>

          {/* Remote participants grid */}
          {remoteStreams.size > 0 && (
            <div style={styles.remoteSection}>
              <h3>Participants ({remoteStreams.size})</h3>
              <VideoGrid
                streams={remoteStreams}
                onMuteParticipant={muteParticipant}
                canMuteOthers={true}
              />
            </div>
          )}

          <div style={styles.controls}>
            {!isStreaming ? (
              <button onClick={handleStartMedia} style={styles.startButton}>
                Start Camera
              </button>
            ) : (
              <button onClick={handleToggleCamera} style={isVideoOff ? styles.startButton : styles.stopButton}>
                {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              </button>
            )}
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
            <p><strong>Participants:</strong> {remoteStreams.size + 1}</p>
          </div>
        </div>

        <div style={styles.chatSection}>
          <ChatWindow
            roomId={roomId}
            userId={userId}
            userRole="broadcaster"
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
  localVideoContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '16/9',
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  hiddenVideo: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    opacity: 0,
    pointerEvents: 'none',
  },
  noVideo: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: 'white',
    fontWeight: 'bold',
  },
  cameraOffText: {
    marginTop: '10px',
    color: '#888',
    fontSize: '14px',
  },
  localLabel: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffc107',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
  },
  remoteSection: {
    marginTop: '10px',
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

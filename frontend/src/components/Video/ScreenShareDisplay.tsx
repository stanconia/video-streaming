import React, { useEffect, useRef } from 'react';

interface ScreenShareDisplayProps {
  stream: MediaStream;
  sharerUserId: string;
  isLocal: boolean;
  onStop?: () => void;
  canStop: boolean;
}

export const ScreenShareDisplay: React.FC<ScreenShareDisplayProps> = ({
  stream,
  sharerUserId,
  isLocal,
  onStop,
  canStop,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={styles.video}
      />
      <div style={styles.label}>
        Screen shared by {isLocal ? 'You' : sharerUserId}
      </div>
      {canStop && onStop && (
        <button onClick={onStop} style={styles.stopButton}>
          Stop Sharing
        </button>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: '16/9',
    border: '2px solid #ffc107',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  label: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffc107',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  stopButton: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

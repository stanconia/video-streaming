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
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    // Ensure playback starts — browsers may block unmuted autoplay
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // If autoplay fails unmuted, mute and retry
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [stream]);

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#000',
      borderRadius: '12px',
      overflow: 'hidden',
      flex: 1,
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        {isLocal ? 'You are sharing' : `${sharerUserId} is sharing`}
      </div>
      {canStop && onStop && (
        <button onClick={onStop} style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="2" y1="3" x2="22" y2="17"/>
          </svg>
          Stop Sharing
        </button>
      )}
    </div>
  );
};

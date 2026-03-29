import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface RemoteParticipant {
  stream: MediaStream | null;
  userId: string;
  displayName?: string;
  role: 'broadcaster' | 'viewer';
  hasVideo: boolean;
  isMuted: boolean;
}

interface VideoGridProps {
  streams: Map<string, RemoteParticipant>;
  localStream?: MediaStream | null;
  localUserId?: string;
  localDisplayName?: string;
  showLocalPlaceholder?: boolean;
  isLocalMuted?: boolean;
  isLocalVideoOff?: boolean;
  onToggleLocalMute?: () => void;
  onMuteParticipant?: (participantId: string) => void;
  canMuteOthers?: boolean;
  activeSpeakerId?: string | null;
  audioOutputDeviceId?: string;
  mode?: 'gallery' | 'filmstrip';
  /** Filmstrip direction: 'horizontal' (default) scrolls left-right, 'vertical' stacks top-down (for screen share sidebar) */
  filmstripDirection?: 'horizontal' | 'vertical';
}

// --- SVG Icon helpers ---
const MicOffSvg: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 9.34V5a3 3 0 00-5.94-.6M9 9v2a3 3 0 005.12 2.12M17 11a5 5 0 01-7.5 4.33M7 11a5 5 0 001.5 3.57M12 17v4M8 21h8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const avatarGradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

// --- VideoTile ---
const VideoTile: React.FC<{
  stream: MediaStream | null;
  name: string;
  isBroadcaster: boolean;
  isLocal?: boolean;
  hasVideo: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  canMute?: boolean;
  isSpeaking?: boolean;
  audioOutputDeviceId?: string;
  compact?: boolean;
}> = ({ stream, name, isBroadcaster, isLocal, hasVideo, isMuted, onToggleMute, canMute, isSpeaking, audioOutputDeviceId, compact }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && stream) video.srcObject = stream;
  }, [stream]);

  // Re-sync srcObject whenever the stream reference changes (prevents freezing)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLocal || !audioOutputDeviceId) return;
    if (typeof (video as any).setSinkId === 'function') {
      (video as any).setSinkId(audioOutputDeviceId).catch(() => {});
    }
  }, [audioOutputDeviceId, isLocal]);

  const avatarSize = compact ? 36 : 64;
  const fontSize = compact ? 16 : 28;
  const nameSize = compact ? 11 : 13;

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#1e1e1e',
      borderRadius: compact ? '8px' : '12px',
      overflow: 'hidden',
      aspectRatio: '16/9',
      border: isSpeaking ? '2px solid #2d8cff' : '2px solid #2a2a2a',
      boxShadow: isSpeaking ? '0 0 16px rgba(45, 140, 255, 0.4)' : 'none',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      {stream && (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={hasVideo ? {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          } : {
            position: 'absolute',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none' as const,
          }}
        />
      )}

      {(!hasVideo || !stream) && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e1e1e',
        }}>
          <div style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            background: getAvatarGradient(name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize,
            color: 'white',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            textTransform: 'uppercase' as const,
          }}>
            {name.charAt(0)}
          </div>
        </div>
      )}

      {/* Name tag - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: compact ? 4 : 8,
        left: compact ? 4 : 8,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '2px 6px' : '3px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
        maxWidth: '80%',
      }}>
        {isBroadcaster && (
          <span style={{ color: '#fbbf24', fontSize: nameSize, lineHeight: 1 }}>&#9733;</span>
        )}
        <span style={{
          color: '#fff',
          fontSize: nameSize,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>
          {name}{isLocal ? ' (You)' : ''}
        </span>
      </div>

      {/* Muted indicator - bottom right */}
      {isMuted && (
        <div style={{
          position: 'absolute',
          bottom: compact ? 4 : 8,
          right: compact ? 4 : 8,
          width: compact ? 22 : 28,
          height: compact ? 22 : 28,
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MicOffSvg size={compact ? 12 : 14} />
        </div>
      )}

      {/* Mute control for broadcaster */}
      {canMute && onToggleMute && !compact && (
        <button
          onClick={onToggleMute}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          title={isMuted ? 'Unmute participant' : 'Mute participant'}
        >
          {isMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 7v3m-4 0h8" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 9.34V5a3 3 0 00-5.94-.6M9 9v2a3 3 0 005.12 2.12M17 11a5 5 0 01-7.5 4.33M7 11a5 5 0 001.5 3.57M12 17v4M8 21h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

// --- Main VideoGrid ---
export const VideoGrid: React.FC<VideoGridProps> = ({
  streams,
  localStream,
  localUserId,
  localDisplayName,
  showLocalPlaceholder = false,
  isLocalMuted = false,
  isLocalVideoOff = false,
  onToggleLocalMute,
  onMuteParticipant,
  canMuteOthers = false,
  activeSpeakerId,
  audioOutputDeviceId,
  mode = 'gallery',
  filmstripDirection = 'horizontal',
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showLocalTile = localStream || showLocalPlaceholder;
  const participantCount = streams.size + (showLocalTile ? 1 : 0);
  const isMobile = windowWidth < 768;

  const getGridColumns = () => {
    if (mode === 'filmstrip') {
      return isMobile ? 2 : Math.min(participantCount, 2);
    }
    if (isMobile) {
      return participantCount <= 1 ? 1 : 2;
    }
    if (participantCount <= 1) return 1;
    if (participantCount <= 2) return 2;
    if (participantCount <= 4) return 2;
    if (participantCount <= 9) return 3;
    return 4;
  };

  const compact = mode === 'filmstrip';

  if (mode === 'filmstrip') {
    const isVertical = filmstripDirection === 'vertical';
    const tileSize = isMobile ? '120px' : '160px';

    return (
      <div style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        gap: '6px',
        overflowX: isVertical ? 'hidden' : 'auto',
        overflowY: isVertical ? 'auto' : 'hidden',
        padding: '4px',
        flexShrink: 0,
        ...(isVertical
          ? { width: isMobile ? '100%' : '180px', maxHeight: '100%' }
          : { width: '100%' }),
      }}>
        {showLocalTile && (
          <div style={{ width: isVertical ? '100%' : tileSize, flexShrink: 0 }}>
            <VideoTile
              stream={isLocalVideoOff ? null : localStream ?? null}
              name={localDisplayName || localUserId || 'You'}
              isBroadcaster={false}
              isLocal
              hasVideo={!!localStream && !isLocalVideoOff}
              isMuted={isLocalMuted}
              onToggleMute={onToggleLocalMute}
              canMute={false}
              isSpeaking={activeSpeakerId === localUserId}
              audioOutputDeviceId={audioOutputDeviceId}
              compact
            />
          </div>
        )}
        {Array.from(streams.entries()).map(([id, participant]) => (
          <div key={id} style={{ width: isVertical ? '100%' : tileSize, flexShrink: 0 }}>
            <VideoTile
              stream={participant.stream}
              name={participant.displayName || participant.userId}
              isBroadcaster={participant.role === 'broadcaster'}
              hasVideo={participant.hasVideo}
              isMuted={participant.isMuted}
              canMute={false}
              isSpeaking={activeSpeakerId === id}
              audioOutputDeviceId={audioOutputDeviceId}
              compact
            />
          </div>
        ))}
      </div>
    );
  }

  // Gallery mode
  const cols = getGridColumns();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? '4px' : '8px',
      width: '100%',
      flex: 1,
      alignContent: participantCount <= cols ? 'center' : 'start',
      minHeight: 0,
    }}>
      {showLocalTile && (
        <VideoTile
          stream={isLocalVideoOff ? null : localStream ?? null}
          name={localDisplayName || localUserId || 'You'}
          isBroadcaster={false}
          isLocal
          hasVideo={!!localStream && !isLocalVideoOff}
          isMuted={isLocalMuted}
          onToggleMute={onToggleLocalMute}
          canMute={false}
          isSpeaking={activeSpeakerId === localUserId}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      )}

      {Array.from(streams.entries()).map(([id, participant]) => (
        <VideoTile
          key={id}
          stream={participant.stream}
          name={participant.displayName || participant.userId}
          isBroadcaster={participant.role === 'broadcaster'}
          hasVideo={participant.hasVideo}
          isMuted={participant.isMuted}
          onToggleMute={canMuteOthers ? () => onMuteParticipant?.(id) : undefined}
          canMute={canMuteOthers}
          isSpeaking={activeSpeakerId === id}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      ))}

      {participantCount === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          color: '#666',
          padding: '60px 20px',
          gridColumn: '1 / -1',
          fontSize: '15px',
        }}>
          Waiting for participants to join...
        </div>
      )}
    </div>
  );
};

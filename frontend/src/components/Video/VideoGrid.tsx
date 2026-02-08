import React, { useCallback } from 'react';

export interface RemoteParticipant {
  stream: MediaStream | null;
  userId: string;
  role: 'broadcaster' | 'viewer';
  hasVideo: boolean;
  isMuted: boolean;
}

interface VideoGridProps {
  streams: Map<string, RemoteParticipant>;
  localStream?: MediaStream | null;
  localUserId?: string;
  showLocalPlaceholder?: boolean;
  isLocalMuted?: boolean;
  onToggleLocalMute?: () => void;
  onMuteParticipant?: (participantId: string) => void;
  canMuteOthers?: boolean; // Only broadcasters can mute others
}

const VideoTile: React.FC<{
  stream: MediaStream | null;
  name: string;
  isBroadcaster: boolean;
  isLocal?: boolean;
  hasVideo: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  canMute?: boolean;
  participantId?: string;
}> = ({ stream, name, isBroadcaster, isLocal, hasVideo, isMuted, onToggleMute, canMute }) => {
  // Use callback ref to set srcObject immediately when video element is created
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={styles.tile}>
      {/* Always render video element for audio, hide visually when camera is off */}
      {stream && (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={hasVideo ? styles.video : styles.hiddenVideo}
        />
      )}
      {(!hasVideo || !stream) && (
        <div style={styles.noVideo}>
          <div style={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
          <div style={styles.cameraOff}>Camera Off</div>
        </div>
      )}
      <div style={styles.nameTag}>
        <span style={isBroadcaster ? styles.broadcasterName : styles.viewerName}>
          {name} {isLocal && '(You)'} {isBroadcaster && '★'}
        </span>
        {isMuted && <span style={styles.mutedIcon}> 🔇</span>}
      </div>
      {canMute && onToggleMute && (
        <button
          onClick={onToggleMute}
          style={isMuted ? styles.unmuteButton : styles.muteButton}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔊' : '🔇'}
        </button>
      )}
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  streams,
  localStream,
  localUserId,
  showLocalPlaceholder = false,
  isLocalMuted = false,
  onToggleLocalMute,
  onMuteParticipant,
  canMuteOthers = false,
}) => {
  const showLocalTile = localStream || showLocalPlaceholder;
  const participantCount = streams.size + (showLocalTile ? 1 : 0);

  const getGridColumns = () => {
    if (participantCount <= 1) return 1;
    if (participantCount <= 4) return 2;
    if (participantCount <= 9) return 3;
    return 4;
  };

  return (
    <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)` }}>
      {/* Local video first */}
      {showLocalTile && (
        <VideoTile
          stream={localStream ?? null}
          name={localUserId || 'You'}
          isBroadcaster={false}
          isLocal={true}
          hasVideo={!!localStream}
          isMuted={isLocalMuted}
          onToggleMute={onToggleLocalMute}
          canMute={true}
        />
      )}

      {/* Remote videos */}
      {Array.from(streams.entries()).map(([odrive, participant]) => (
        <VideoTile
          key={odrive}
          stream={participant.stream}
          name={participant.userId}
          isBroadcaster={participant.role === 'broadcaster'}
          hasVideo={participant.hasVideo}
          isMuted={participant.isMuted}
          onToggleMute={canMuteOthers ? () => onMuteParticipant?.(odrive) : undefined}
          canMute={canMuteOthers}
          participantId={odrive}
        />
      ))}

      {participantCount === 0 && (
        <div style={styles.emptyState}>
          Waiting for participants...
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  grid: {
    display: 'grid',
    gap: '10px',
    width: '100%',
    minHeight: '300px',
  },
  tile: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '16/9',
  },
  video: {
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
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: 'white',
    fontWeight: 'bold',
  },
  cameraOff: {
    marginTop: '10px',
    color: '#888',
    fontSize: '12px',
  },
  nameTag: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    padding: '4px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '4px',
  },
  broadcasterName: {
    color: '#ffc107',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  viewerName: {
    color: 'white',
    fontSize: '12px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    color: '#888',
    padding: '40px',
    gridColumn: '1 / -1',
  },
  mutedIcon: {
    marginLeft: '4px',
  },
  muteButton: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unmuteButton: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

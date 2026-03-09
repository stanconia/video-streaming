import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useReactions } from '../../hooks/useReactions';
import { useTimer } from '../../hooks/useTimer';
import { useHandRaise } from '../../hooks/useHandRaise';
import { usePoll } from '../../hooks/usePoll';
import { useFileSharing } from '../../hooks/useFileSharing';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import { useBreakoutRooms } from '../../hooks/useBreakoutRooms';
import { useActiveSpeaker } from '../../hooks/useActiveSpeaker';
import { useAudioOutput } from '../../hooks/useAudioOutput';
import { SpeakerSelector } from '../Video/SpeakerSelector';
import { ChatWindow } from '../Chat/ChatWindow';
import { VideoGrid } from '../Video/VideoGrid';
import { ScreenShareDisplay } from '../Video/ScreenShareDisplay';
import { ReactionPicker } from '../Reactions/ReactionPicker';
import { ReactionOverlay } from '../Reactions/ReactionOverlay';
import { TimerDisplay } from '../Timer/TimerDisplay';
import { HandRaiseButton } from '../HandRaise/HandRaiseButton';
import { PollDisplay } from '../Poll/PollDisplay';
import { FileSharePanel } from '../FileSharing/FileSharePanel';
import { WhiteboardPanel } from '../Whiteboard/WhiteboardPanel';
import { BreakoutNotification } from '../Breakout/BreakoutNotification';
import { BreakoutRoomView } from '../Breakout/BreakoutRoomView';
import { SidebarTabs } from '../Sidebar/SidebarTabs';

interface ViewerViewProps {
  roomId: string;
  userId: string;
  displayName: string;
  onLeave: () => void;
}

export const ViewerView: React.FC<ViewerViewProps> = ({ roomId, userId, displayName, onLeave }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat');

  const {
    localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff,
    startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, signalingClient,
    activeScreenShare, isScreenSharing, screenSharePermissionStatus,
    startScreenShare, stopScreenShare,
    sessionEnded,
  } = useWebRTC({ roomId, role: 'viewer', userId, displayName });

  // Feature hooks
  const { reactions, sendReaction } = useReactions({ roomId, userId, signalingClient });
  const { remainingSeconds: timerRemaining, isRunning: timerRunning, isPaused: timerPaused, isExpired: timerExpired } = useTimer({ roomId, role: 'viewer', signalingClient });
  const { isHandRaised, raiseHand, lowerHand } = useHandRaise({ roomId, userId, role: 'viewer', signalingClient });
  const { currentPoll, submitVote } = usePoll({ roomId, userId, role: 'viewer', signalingClient });
  const { files } = useFileSharing({ roomId, userId, role: 'viewer', signalingClient });
  const { isActive: whiteboardActive, canDraw: whiteboardCanDraw, sendUpdate: whiteboardSendUpdate, setRemoteDrawCallback, incomingSnapshot: wbSnapshot, setIncomingSnapshot: setWbSnapshot } = useWhiteboard({ roomId, userId, role: 'viewer', signalingClient });
  const { isBreakoutActive, currentBreakoutRoom, assignment, remainingSeconds: breakoutRemaining, joinBreakout, leaveBreakout } = useBreakoutRooms({ roomId, userId, role: 'viewer', signalingClient });

  // Active speaker detection
  const speakerStreams = React.useMemo(() => {
    const entries: { userId: string; stream: MediaStream }[] = [];
    if (localStream) entries.push({ userId, stream: localStream });
    remoteStreams.forEach((p, uid) => { if (p.stream) entries.push({ userId: uid, stream: p.stream }); });
    return entries;
  }, [localStream, remoteStreams, userId]);
  const activeSpeakerId = useActiveSpeaker(speakerStreams);
  const { devices: audioOutputDevices, selectedDeviceId: audioOutputId, selectDevice: selectAudioOutput } = useAudioOutput();

  // Auto-start camera
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

  // Auto-leave when session is ended by the teacher
  useEffect(() => {
    if (sessionEnded) {
      stopMedia();
      leave();
      onLeave();
    }
  }, [sessionEnded]);

  const handleToggleCamera = async () => {
    if (isStreaming) {
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

  const getScreenShareButtonText = () => {
    if (isScreenSharing) return 'Stop Sharing';
    if (screenSharePermissionStatus === 'pending') return 'Requesting...';
    return 'Share Screen';
  };

  const isScreenShareButtonDisabled = () => {
    if (screenSharePermissionStatus === 'pending') return true;
    if (activeScreenShare && !isScreenSharing) return true;
    return false;
  };

  // Build sidebar tabs
  const sidebarTabs = [
    {
      id: 'chat',
      label: 'Chat',
      content: (
        <ChatWindow roomId={roomId} userId={userId} userRole="viewer" signalingClient={signalingClient} />
      ),
    },
    {
      id: 'polls',
      label: 'Polls',
      content: currentPoll ? (
        <PollDisplay
          poll={currentPoll}
          onVote={submitVote}
          onEnd={() => {}}
          role="viewer"
        />
      ) : (
        <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No active poll</div>
      ),
    },
    {
      id: 'files',
      label: 'Files',
      badge: files.length > 0 ? files.length : undefined,
      content: (
        <FileSharePanel
          files={files}
          onUpload={() => {}}
          isUploading={false}
          canUpload={false}
        />
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Video Conference</h2>
        <div style={styles.headerRight}>
          {(timerRunning || timerPaused || timerExpired) && (
            <TimerDisplay
              remainingSeconds={timerRemaining}
              isRunning={timerRunning}
              isPaused={timerPaused}
              isExpired={timerExpired}
            />
          )}
          {isConnected ? (
            <span style={styles.statusConnected}>Connected</span>
          ) : (
            <span style={styles.statusDisconnected}>Disconnected</span>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {screenSharePermissionStatus === 'denied' && (
        <div style={styles.deniedBanner}>
          Screen share request was denied by the host.
        </div>
      )}

      {/* Breakout notification */}
      {assignment && !currentBreakoutRoom && (
        <BreakoutNotification roomName={assignment.name} onJoin={joinBreakout} />
      )}

      {/* Breakout room view */}
      {currentBreakoutRoom && (
        <BreakoutRoomView
          breakoutRoom={currentBreakoutRoom}
          remainingSeconds={breakoutRemaining}
          onLeave={leaveBreakout}
        />
      )}

      <div style={styles.mainContent}>
        <div style={styles.videoSection}>
          {/* Screen share */}
          {activeScreenShare && (
            <ScreenShareDisplay
              stream={activeScreenShare.stream}
              sharerUserId={activeScreenShare.userId}
              isLocal={activeScreenShare.userId === userId}
              onStop={isScreenSharing ? stopScreenShare : undefined}
              canStop={isScreenSharing}
            />
          )}

          {/* Whiteboard */}
          <WhiteboardPanel
            isActive={whiteboardActive}
            canDraw={whiteboardCanDraw}
            onSendUpdate={whiteboardSendUpdate}
            onRegisterRemoteDraw={setRemoteDrawCallback}
            incomingSnapshot={wbSnapshot}
            onClearSnapshot={() => setWbSnapshot(null)}
          />

          {/* All participants grid with reaction overlay */}
          <div style={{ position: 'relative', ...(activeScreenShare ? styles.videoGridContainerSmall : styles.videoGridContainer) }}>
            <VideoGrid
              streams={remoteStreams}
              localStream={isVideoOff ? null : localStream}
              localUserId={userId}
              localDisplayName={displayName}
              showLocalPlaceholder={isStreaming}
              isLocalMuted={isLocalMuted}
              onToggleLocalMute={toggleLocalMute}
              canMuteOthers={false}
              activeSpeakerId={activeSpeakerId}
              audioOutputDeviceId={audioOutputId}
            />
            <ReactionOverlay reactions={reactions} />
          </div>

          {remoteStreams.size === 0 && !localStream && !activeScreenShare && (
            <div style={styles.waitingMessage}>
              Waiting for other participants to join...
            </div>
          )}

          {/* Controls */}
          <div style={styles.controls}>
            <button
              onClick={handleToggleCamera}
              style={isStreaming && !isVideoOff ? styles.stopButton : styles.startButton}
            >
              {isStreaming ? (isVideoOff ? 'Turn On Camera' : 'Turn Off Camera') : 'Start Camera'}
            </button>
            {isStreaming && (
              <button onClick={toggleLocalMute} style={isLocalMuted ? styles.unmuteMicButton : styles.muteMicButton}>
                {isLocalMuted ? 'Unmute' : 'Mute'}
              </button>
            )}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              disabled={isScreenShareButtonDisabled()}
              style={
                isScreenSharing
                  ? styles.stopScreenShareButton
                  : isScreenShareButtonDisabled()
                    ? styles.disabledButton
                    : styles.screenShareButton
              }
            >
              {getScreenShareButtonText()}
            </button>
            <HandRaiseButton
              isHandRaised={isHandRaised}
              onToggle={() => isHandRaised ? lowerHand() : raiseHand()}
            />
            <button onClick={() => setShowSidebar(!showSidebar)} style={showSidebar ? styles.chatButtonActive : styles.chatButton}>
              Panel
            </button>
            <button onClick={handleLeave} style={styles.leaveButton}>Leave</button>
          </div>

          {/* Reaction picker + Speaker selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <ReactionPicker onSelectEmoji={sendReaction} />
            <SpeakerSelector devices={audioOutputDevices} selectedDeviceId={audioOutputId} onSelect={selectAudioOutput} />
          </div>

          <div style={styles.info}>
            <p><strong>Room ID:</strong> {roomId}</p>
            <p><strong>User:</strong> {displayName}</p>
            <p><strong>Participants:</strong> {remoteStreams.size + (localStream ? 1 : 0)}</p>
          </div>
        </div>

        {showSidebar && (
          <div style={styles.sidebarSection}>
            <SidebarTabs tabs={sidebarTabs} activeTab={sidebarTab} onTabChange={setSidebarTab} />
          </div>
        )}
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  statusConnected: { color: 'green' },
  statusDisconnected: { color: 'red' },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '20px',
  },
  videoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  videoGridContainer: { minHeight: '400px' },
  videoGridContainerSmall: { maxHeight: '200px', overflow: 'auto' },
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
    gap: '8px',
    flexWrap: 'wrap',
  },
  startButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  stopButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  leaveButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#6c757d',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  muteMicButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#17a2b8',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  unmuteMicButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#ffc107',
    color: 'black',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  screenShareButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#fd7e14',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  stopScreenShareButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  disabledButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    backgroundColor: '#adb5bd',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    opacity: 0.6,
  },
  deniedBanner: {
    padding: '10px 16px',
    marginBottom: '15px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    color: '#721c24',
    fontSize: '14px',
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
  chatButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#6f42c1',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  chatButtonActive: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#5a32a3',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  sidebarSection: {
    minHeight: '400px',
  },
};

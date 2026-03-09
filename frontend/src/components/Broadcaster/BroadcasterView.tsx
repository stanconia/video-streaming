import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { recordingApi } from '../../services/api/live/RecordingApi';
import { ReactionPicker } from '../Reactions/ReactionPicker';
import { ReactionOverlay } from '../Reactions/ReactionOverlay';
import { TimerDisplay } from '../Timer/TimerDisplay';
import { TimerControls } from '../Timer/TimerControls';
import { RaisedHandsList } from '../HandRaise/RaisedHandsList';
import { CreatePollForm } from '../Poll/CreatePollForm';
import { PollDisplay } from '../Poll/PollDisplay';
import { FileSharePanel } from '../FileSharing/FileSharePanel';
import { WhiteboardPanel } from '../Whiteboard/WhiteboardPanel';
import { WhiteboardControls } from '../Whiteboard/WhiteboardControls';
import { CreateBreakoutForm } from '../Breakout/CreateBreakoutForm';
import { BreakoutAssignment } from '../Breakout/BreakoutAssignment';
import { BreakoutOverview } from '../Breakout/BreakoutOverview';
import { SidebarTabs } from '../Sidebar/SidebarTabs';

interface BroadcasterViewProps {
  roomId: string;
  userId: string;
  displayName: string;
  onLeave: () => void;
}

export const BroadcasterView: React.FC<BroadcasterViewProps> = ({ roomId, userId, displayName, onLeave }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showBreakoutSetup, setShowBreakoutSetup] = useState(false);
  const [showBreakoutAssign, setShowBreakoutAssign] = useState(false);

  const {
    localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff,
    startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, muteParticipant, signalingClient,
    activeScreenShare, isScreenSharing, screenShareRequest,
    startScreenShare, stopScreenShare, respondToScreenShareRequest, forceStopScreenShare,
    sessionEnded,
  } = useWebRTC({ roomId, role: 'broadcaster', userId, displayName });

  // Feature hooks
  const { reactions, sendReaction } = useReactions({ roomId, userId, signalingClient });
  const { remainingSeconds: timerRemaining, isRunning: timerRunning, isPaused: timerPaused, isExpired: timerExpired, startTimer, pauseTimer, resumeTimer, resetTimer } = useTimer({ roomId, role: 'broadcaster', signalingClient });
  const { raisedHands, lowerHand, lowerAllHands } = useHandRaise({ roomId, userId, role: 'broadcaster', signalingClient });
  const { currentPoll, createPoll, submitVote, endPoll } = usePoll({ roomId, userId, role: 'broadcaster', signalingClient });
  const { files, uploadAndShare, isUploading } = useFileSharing({ roomId, userId, role: 'broadcaster', signalingClient });
  const { isActive: whiteboardActive, canDraw: whiteboardCanDraw, drawPermissions, toggleWhiteboard, sendUpdate: whiteboardSendUpdate, grantDraw, revokeDraw, setRemoteDrawCallback, incomingSnapshot: wbSnapshot, setIncomingSnapshot: setWbSnapshot } = useWhiteboard({ roomId, userId, role: 'broadcaster', signalingClient });
  const { breakoutRooms, isBreakoutActive, remainingSeconds: breakoutRemaining, createBreakoutRooms, assignParticipants, endBreakoutRooms } = useBreakoutRooms({ roomId, userId, role: 'broadcaster', signalingClient });

  // Active speaker detection
  const speakerStreams = React.useMemo(() => {
    const entries: { userId: string; stream: MediaStream }[] = [];
    if (localStream) entries.push({ userId, stream: localStream });
    remoteStreams.forEach((p, uid) => { if (p.stream) entries.push({ userId: uid, stream: p.stream }); });
    return entries;
  }, [localStream, remoteStreams, userId]);
  const activeSpeakerId = useActiveSpeaker(speakerStreams);
  const { devices: audioOutputDevices, selectedDeviceId: audioOutputId, selectDevice: selectAudioOutput } = useAudioOutput();

  // Participant name map for whiteboard controls and breakout assignment
  const participantNames = new Map<string, string>();
  remoteStreams.forEach((participant, streamUserId) => {
    participantNames.set(streamUserId, participant.displayName || streamUserId);
  });

  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (video && localStream) {
      video.srcObject = localStream;
    }
  }, [localStream]);

  const handleStartMedia = async () => {
    try {
      await startMedia();
      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start media:', err);
    }
  };

  const handleToggleCamera = () => { toggleVideo(); };

  const handleLeave = () => {
    stopMedia();
    leave();
    onLeave();
  };

  // Recording elapsed timer
  useEffect(() => {
    if (isRecording) {
      setRecordingElapsed(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingElapsed(0);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  useEffect(() => {
    if (!signalingClient) return;
    const handler = (message: any) => {
      if (message.roomId === roomId) setIsRecording(message.isRecording);
    };
    signalingClient.on('recording-status-changed', handler);
    return () => { signalingClient.off('recording-status-changed'); };
  }, [signalingClient, roomId]);

  // Auto-leave when session is ended
  useEffect(() => {
    if (sessionEnded) {
      stopMedia();
      leave();
      onLeave();
    }
  }, [sessionEnded]);

  const handleStartRecording = async () => {
    try {
      setRecordingLoading(true);
      await recordingApi.startRecording({ roomId, userId });
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      alert(err.response?.data?.error || 'Failed to start recording');
    } finally {
      setRecordingLoading(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setRecordingLoading(true);
      await recordingApi.stopRecording({ roomId, userId });
      setIsRecording(false);
    } catch (err: any) {
      console.error('Failed to stop recording:', err);
      alert(err.response?.data?.error || 'Failed to stop recording');
    } finally {
      setRecordingLoading(false);
    }
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Build sidebar tabs
  const sidebarTabs = [
    {
      id: 'chat',
      label: 'Chat',
      content: (
        <ChatWindow roomId={roomId} userId={userId} userRole="broadcaster" signalingClient={signalingClient} />
      ),
    },
    {
      id: 'polls',
      label: 'Polls',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!currentPoll && !showCreatePoll && (
            <button style={styles.sidebarActionButton} onClick={() => setShowCreatePoll(true)}>
              Create Poll
            </button>
          )}
          {showCreatePoll && !currentPoll && (
            <CreatePollForm onCreatePoll={(q, opts) => { createPoll(q, opts); setShowCreatePoll(false); }} />
          )}
          {currentPoll && (
            <PollDisplay
              poll={currentPoll}
              onVote={submitVote}
              onEnd={endPoll}
              role="broadcaster"
            />
          )}
        </div>
      ),
    },
    {
      id: 'files',
      label: 'Files',
      badge: files.length > 0 ? files.length : undefined,
      content: (
        <FileSharePanel
          files={files}
          onUpload={uploadAndShare}
          isUploading={isUploading}
          canUpload={true}
        />
      ),
    },
    {
      id: 'hands',
      label: 'Hands',
      badge: raisedHands.size > 0 ? raisedHands.size : undefined,
      content: (
        <RaisedHandsList
          raisedHands={raisedHands}
          onLowerHand={(uid) => lowerHand(uid)}
          onLowerAll={lowerAllHands}
        />
      ),
    },
  ];

  // Add breakout tab when active
  if (isBreakoutActive) {
    sidebarTabs.push({
      id: 'breakout',
      label: 'Breakout',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {showBreakoutAssign && (
            <BreakoutAssignment
              breakoutRooms={breakoutRooms}
              participants={participantNames}
              onAssign={(a) => { assignParticipants(a); setShowBreakoutAssign(false); }}
            />
          )}
          {!showBreakoutAssign && (
            <button style={styles.sidebarActionButton} onClick={() => setShowBreakoutAssign(true)}>
              Assign Participants
            </button>
          )}
          <BreakoutOverview
            breakoutRooms={breakoutRooms}
            remainingSeconds={breakoutRemaining}
            onEnd={endBreakoutRooms}
          />
        </div>
      ),
    });
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Video Conference - Host</h2>
        <div style={styles.headerRight}>
          {(timerRunning || timerPaused || timerExpired) && (
            <TimerDisplay
              remainingSeconds={timerRemaining}
              isRunning={timerRunning}
              isPaused={timerPaused}
              isExpired={timerExpired}
            />
          )}
          {isRecording && (
            <span style={styles.recordingIndicator}>
              REC {formatElapsed(recordingElapsed)}
            </span>
          )}
          {isConnected ? (
            <span style={styles.statusConnected}>Connected</span>
          ) : (
            <span style={styles.statusDisconnected}>Disconnected</span>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {raisedHands.size > 0 && (
        <div style={styles.handRaiseBanner} onClick={() => { setShowSidebar(true); setSidebarTab('hands'); }}>
          <span style={styles.handRaiseIcon}>&#9995;</span>
          <span>
            <strong>{raisedHands.size} hand{raisedHands.size > 1 ? 's' : ''} raised</strong>
            {' — '}
            {Array.from(raisedHands.values()).join(', ')}
          </span>
          <button
            style={styles.lowerAllBannerButton}
            onClick={(e) => { e.stopPropagation(); lowerAllHands(); }}
          >
            Lower All
          </button>
        </div>
      )}

      {screenShareRequest && (
        <div style={styles.requestBanner}>
          <span><strong>{screenShareRequest.userId}</strong> wants to share their screen</span>
          <div style={styles.requestButtons}>
            <button onClick={() => respondToScreenShareRequest(true)} style={styles.approveButton}>Approve</button>
            <button onClick={() => respondToScreenShareRequest(false)} style={styles.denyButton}>Deny</button>
          </div>
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.videoSection}>
          {/* Timer controls (broadcaster only) */}
          {isStreaming && (
            <TimerControls
              isRunning={timerRunning}
              isPaused={timerPaused}
              onStart={startTimer}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onReset={resetTimer}
            />
          )}

          {/* Screen share */}
          {activeScreenShare && (
            <ScreenShareDisplay
              stream={activeScreenShare.stream}
              sharerUserId={activeScreenShare.userId}
              isLocal={activeScreenShare.userId === userId}
              onStop={() => {
                if (activeScreenShare.userId === userId) stopScreenShare();
                else forceStopScreenShare(activeScreenShare.userId);
              }}
              canStop={true}
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

          {/* Local video with reaction overlay */}
          <div style={{ position: 'relative', ...(activeScreenShare ? styles.localVideoContainerSmall : styles.localVideoContainer) }}>
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
            <div style={styles.localLabel}>{displayName} (Host) {isLocalMuted && 'Muted'}</div>
            <ReactionOverlay reactions={reactions} />
          </div>

          {remoteStreams.size > 0 && (
            <div style={styles.remoteSection}>
              <h3>Participants ({remoteStreams.size})</h3>
              <VideoGrid streams={remoteStreams} onMuteParticipant={muteParticipant} canMuteOthers={true} activeSpeakerId={activeSpeakerId} audioOutputDeviceId={audioOutputId} />
            </div>
          )}

          {/* Breakout setup (modal-like) */}
          {showBreakoutSetup && !isBreakoutActive && (
            <div style={styles.setupPanel}>
              <CreateBreakoutForm onCreate={(names, duration) => { createBreakoutRooms(names, duration); setShowBreakoutSetup(false); }} />
              <button style={styles.cancelButton} onClick={() => setShowBreakoutSetup(false)}>Cancel</button>
            </div>
          )}

          {/* Whiteboard controls for broadcaster */}
          {isStreaming && (
            <WhiteboardControls
              isActive={whiteboardActive}
              participants={participantNames}
              drawPermissions={drawPermissions}
              onToggle={toggleWhiteboard}
              onGrantDraw={grantDraw}
              onRevokeDraw={revokeDraw}
            />
          )}

          {/* Controls bar */}
          <div style={styles.controls}>
            {!isStreaming ? (
              <button onClick={handleStartMedia} style={styles.startButton}>Start Camera</button>
            ) : (
              <button onClick={handleToggleCamera} style={isVideoOff ? styles.startButton : styles.stopButton}>
                {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              </button>
            )}
            {isStreaming && (
              <button onClick={toggleLocalMute} style={isLocalMuted ? styles.unmuteMicButton : styles.muteMicButton}>
                {isLocalMuted ? 'Unmute' : 'Mute'}
              </button>
            )}
            {isStreaming && (
              <button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                disabled={!!activeScreenShare && !isScreenSharing}
                style={isScreenSharing ? styles.stopScreenShareButton : (activeScreenShare ? styles.disabledButton : styles.screenShareButton)}
              >
                {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </button>
            )}
            {isStreaming && (
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={recordingLoading}
                style={isRecording ? styles.stopRecordButton : styles.recordButton}
              >
                {recordingLoading
                  ? (isRecording ? 'Stopping...' : 'Starting...')
                  : isRecording
                    ? `Stop Rec (${formatElapsed(recordingElapsed)})`
                    : 'Record'}
              </button>
            )}
            {isStreaming && !isBreakoutActive && (
              <button onClick={() => setShowBreakoutSetup(!showBreakoutSetup)} style={styles.breakoutButton}>
                Breakout
              </button>
            )}
            {isStreaming && (
              <button onClick={() => setShowSidebar(!showSidebar)} style={showSidebar ? styles.chatButtonActive : styles.chatButton}>
                Panel
              </button>
            )}
            <button onClick={handleLeave} style={styles.leaveButton}>Leave</button>
          </div>

          {/* Reaction picker + Speaker selector */}
          {isStreaming && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <ReactionPicker onSelectEmoji={sendReaction} />
              <SpeakerSelector devices={audioOutputDevices} selectedDeviceId={audioOutputId} onSelect={selectAudioOutput} />
            </div>
          )}

          <div style={styles.info}>
            <p><strong>Room ID:</strong> {roomId}</p>
            <p><strong>Participants:</strong> {remoteStreams.size + 1}</p>
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
  localVideoContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '16/9',
  },
  localVideoContainerSmall: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    width: '240px',
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
  remoteSection: { marginTop: '10px' },
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
  handRaiseBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    marginBottom: '15px',
    backgroundColor: '#fff3cd',
    border: '2px solid #f0c040',
    borderRadius: '6px',
    color: '#856404',
    cursor: 'pointer',
    animation: 'none',
  },
  handRaiseIcon: {
    fontSize: '22px',
  },
  lowerAllBannerButton: {
    marginLeft: 'auto',
    padding: '6px 14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  },
  requestBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    color: '#856404',
  },
  requestButtons: { display: 'flex', gap: '8px' },
  approveButton: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  denyButton: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '14px',
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
  recordingIndicator: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  recordButton: {
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
  stopRecordButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #dc3545',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    color: '#dc3545',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  breakoutButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#e83e8c',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  sidebarActionButton: {
    padding: '10px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  setupPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  cancelButton: {
    padding: '8px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

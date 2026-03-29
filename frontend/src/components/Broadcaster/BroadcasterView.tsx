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
import { useChat } from '../../hooks/useChat';
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

// --- SVG Icon Components ---
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/>
    <path d="M5 11v1a7 7 0 0014 0v-1"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);
const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 9.34V5a3 3 0 00-5.94-.6"/>
    <path d="M9 9v2a3 3 0 005.12 2.12"/>
    <path d="M17 11a5 5 0 01-7.5 4.33"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);
const CamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 7l-7 5 7 5V7z"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const CamOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2"/>
    <path d="M23 7l-7 5 7 5V7z"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const ScreenShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <polyline points="8 10 12 6 16 10"/>
  </svg>
);
const RecordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="7"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const BreakoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="8" height="8" rx="1"/>
    <rect x="14" y="2" width="8" height="8" rx="1"/>
    <rect x="2" y="14" width="8" height="8" rx="1"/>
    <rect x="14" y="14" width="8" height="8" rx="1"/>
  </svg>
);
const LeaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 5.64a9 9 0 11-12.73 0"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
);
const PeopleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff,
    startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, muteParticipant, signalingClient,
    activeScreenShare, isScreenSharing, screenShareRequest,
    startScreenShare, stopScreenShare, respondToScreenShareRequest, forceStopScreenShare,
    sessionEnded,
  } = useWebRTC({ roomId, role: 'broadcaster', userId, displayName });

  const { reactions, sendReaction } = useReactions({ roomId, userId, signalingClient });
  const { remainingSeconds: timerRemaining, isRunning: timerRunning, isPaused: timerPaused, isExpired: timerExpired, startTimer, pauseTimer, resumeTimer, resetTimer } = useTimer({ roomId, role: 'broadcaster', signalingClient });
  const { raisedHands, lowerHand, lowerAllHands } = useHandRaise({ roomId, userId, role: 'broadcaster', signalingClient });
  const { currentPoll, createPoll, submitVote, endPoll } = usePoll({ roomId, userId, role: 'broadcaster', signalingClient });
  const { files, uploadAndShare, isUploading } = useFileSharing({ roomId, userId, role: 'broadcaster', signalingClient });
  const { isActive: whiteboardActive, canDraw: whiteboardCanDraw, drawPermissions, toggleWhiteboard, sendUpdate: whiteboardSendUpdate, grantDraw, revokeDraw, setRemoteDrawCallback, incomingSnapshot: wbSnapshot, setIncomingSnapshot: setWbSnapshot } = useWhiteboard({ roomId, userId, role: 'broadcaster', signalingClient });
  const { breakoutRooms, isBreakoutActive, remainingSeconds: breakoutRemaining, createBreakoutRooms, assignParticipants, endBreakoutRooms } = useBreakoutRooms({ roomId, userId, role: 'broadcaster', signalingClient });

  const speakerStreams = React.useMemo(() => {
    const entries: { userId: string; stream: MediaStream }[] = [];
    if (localStream) entries.push({ userId, stream: localStream });
    remoteStreams.forEach((p, uid) => { if (p.stream) entries.push({ userId: uid, stream: p.stream }); });
    return entries;
  }, [localStream, remoteStreams, userId]);
  const activeSpeakerId = useActiveSpeaker(speakerStreams);
  const { devices: audioOutputDevices, selectedDeviceId: audioOutputId, selectDevice: selectAudioOutput } = useAudioOutput();

  // Chat hook — always active so messages aren't lost when sidebar is closed
  const chatState = useChat({ roomId, userId, userRole: 'broadcaster', signalingClient });

  const participantNames = new Map<string, string>();
  remoteStreams.forEach((participant, streamUserId) => {
    participantNames.set(streamUserId, participant.displayName || streamUserId);
  });

  const handleStartMedia = async () => {
    try {
      await startMedia();
      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start media:', err);
    }
  };

  const handleLeave = () => {
    stopMedia();
    leave();
    onLeave();
  };

  useEffect(() => {
    if (isRecording) {
      setRecordingElapsed(0);
      recordingTimerRef.current = setInterval(() => setRecordingElapsed((p) => p + 1), 1000);
    } else {
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      setRecordingElapsed(0);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  useEffect(() => {
    if (!signalingClient) return;
    const handler = (message: any) => { if (message.roomId === roomId) setIsRecording(message.isRecording); };
    signalingClient.on('recording-status-changed', handler);
    return () => { signalingClient.off('recording-status-changed'); };
  }, [signalingClient, roomId]);

  useEffect(() => {
    if (sessionEnded) { stopMedia(); leave(); onLeave(); }
  }, [sessionEnded]);

  const handleStartRecording = async () => {
    try {
      setRecordingLoading(true);
      await recordingApi.startRecording({ roomId, userId });
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      alert(err.response?.data?.error || 'Failed to start recording');
    } finally { setRecordingLoading(false); }
  };

  const handleStopRecording = async () => {
    try {
      setRecordingLoading(true);
      await recordingApi.stopRecording({ roomId, userId });
      setIsRecording(false);
    } catch (err: any) {
      console.error('Failed to stop recording:', err);
      alert(err.response?.data?.error || 'Failed to stop recording');
    } finally { setRecordingLoading(false); }
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalParticipants = remoteStreams.size + 1;
  const hasScreenShare = !!activeScreenShare;

  // Sidebar tabs
  const sidebarTabs = [
    {
      id: 'chat',
      label: 'Chat',
      content: <ChatWindow chatState={chatState} userRole="broadcaster" />,
    },
    {
      id: 'polls',
      label: 'Polls',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!currentPoll && !showCreatePoll && (
            <button style={styles.sidebarActionButton} onClick={() => setShowCreatePoll(true)}>Create Poll</button>
          )}
          {showCreatePoll && !currentPoll && (
            <CreatePollForm onCreatePoll={(q, opts) => { createPoll(q, opts); setShowCreatePoll(false); }} />
          )}
          {currentPoll && <PollDisplay poll={currentPoll} onVote={submitVote} onEnd={endPoll} role="broadcaster" />}
        </div>
      ),
    },
    {
      id: 'files',
      label: 'Files',
      badge: files.length > 0 ? files.length : undefined,
      content: <FileSharePanel files={files} onUpload={uploadAndShare} isUploading={isUploading} canUpload={true} />,
    },
    {
      id: 'hands',
      label: 'Hands',
      badge: raisedHands.size > 0 ? raisedHands.size : undefined,
      content: <RaisedHandsList raisedHands={raisedHands} onLowerHand={(uid) => lowerHand(uid)} onLowerAll={lowerAllHands} />,
    },
    {
      id: 'tools',
      label: 'Tools',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Timer</div>
            <TimerControls isRunning={timerRunning} isPaused={timerPaused} onStart={startTimer} onPause={pauseTimer} onResume={resumeTimer} onReset={resetTimer} />
          </div>
          <div>
            <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Whiteboard</div>
            <WhiteboardControls isActive={whiteboardActive} participants={participantNames} drawPermissions={drawPermissions} onToggle={toggleWhiteboard} onGrantDraw={grantDraw} onRevokeDraw={revokeDraw} />
          </div>
        </div>
      ),
    },
  ];

  if (isBreakoutActive) {
    sidebarTabs.push({
      id: 'breakout',
      label: 'Breakout',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {showBreakoutAssign && (
            <BreakoutAssignment breakoutRooms={breakoutRooms} participants={participantNames} onAssign={(a) => { assignParticipants(a); setShowBreakoutAssign(false); }} />
          )}
          {!showBreakoutAssign && (
            <button style={styles.sidebarActionButton} onClick={() => setShowBreakoutAssign(true)}>Assign Participants</button>
          )}
          <BreakoutOverview breakoutRooms={breakoutRooms} remainingSeconds={breakoutRemaining} onEnd={endBreakoutRooms} />
        </div>
      ),
    });
  }

  return (
    <div style={styles.container}>
      {/* === TOP BAR === */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={styles.roomBadge}>
            <div style={styles.liveDot} />
            <span style={styles.roomName}>Live Session</span>
          </div>
          {isRecording && (
            <div style={styles.recBadge}>
              <div style={styles.recDot} />
              <span>REC {formatElapsed(recordingElapsed)}</span>
            </div>
          )}
          {(timerRunning || timerPaused || timerExpired) && (
            <TimerDisplay remainingSeconds={timerRemaining} isRunning={timerRunning} isPaused={timerPaused} isExpired={timerExpired} />
          )}
        </div>
        <div style={styles.topBarRight}>
          {!isConnected && <span style={styles.disconnectedBadge}>Reconnecting...</span>}
          <div style={styles.participantBadge}>
            <PeopleIcon />
            <span>{totalParticipants}</span>
          </div>
        </div>
      </div>

      {/* === BANNERS === */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {raisedHands.size > 0 && (
        <div style={styles.handRaiseBanner} onClick={() => { setShowSidebar(true); setSidebarTab('hands'); }}>
          <span style={{ fontSize: '18px' }}>&#9995;</span>
          <span style={{ flex: 1 }}>
            <strong>{raisedHands.size}</strong> hand{raisedHands.size > 1 ? 's' : ''} raised
            {!isMobile && <span style={{ color: '#a08020' }}> — {Array.from(raisedHands.values()).slice(0, 3).join(', ')}{raisedHands.size > 3 ? '...' : ''}</span>}
          </span>
          <button style={styles.lowerAllBtn} onClick={(e) => { e.stopPropagation(); lowerAllHands(); }}>Lower All</button>
        </div>
      )}

      {screenShareRequest && (
        <div style={styles.requestBanner}>
          <span><strong>{screenShareRequest.userId}</strong> wants to share their screen</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => respondToScreenShareRequest(true)} style={styles.approveBtn}>Approve</button>
            <button onClick={() => respondToScreenShareRequest(false)} style={styles.denyBtn}>Deny</button>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div style={{
        ...styles.mainArea,
        ...(showSidebar && !isMobile ? { gridTemplateColumns: '1fr 360px' } : { gridTemplateColumns: '1fr' }),
      }}>
        <div style={styles.videoArea}>
          {/* Pre-stream state */}
          {!isStreaming && (
            <div style={styles.preStreamContainer}>
              <div style={styles.preStreamAvatar}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <p style={styles.preStreamText}>Ready to start your session?</p>
              <button onClick={handleStartMedia} style={styles.startCameraBtn}>
                <CamIcon /> Start Camera
              </button>
            </div>
          )}

          {/* Whiteboard */}
          {isStreaming && (
            <WhiteboardPanel
              isActive={whiteboardActive}
              canDraw={whiteboardCanDraw}
              onSendUpdate={whiteboardSendUpdate}
              onRegisterRemoteDraw={setRemoteDrawCallback}
              incomingSnapshot={wbSnapshot}
              onClearSnapshot={() => setWbSnapshot(null)}
            />
          )}

          {/* Screen share + filmstrip OR gallery grid */}
          {isStreaming && hasScreenShare && (
            <div style={isMobile ? styles.screenShareLayoutMobile : styles.screenShareLayout}>
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
              <VideoGrid
                streams={remoteStreams}
                localStream={localStream}
                localUserId={userId}
                localDisplayName={displayName}
                showLocalPlaceholder={true}
                isLocalMuted={isLocalMuted}
                isLocalVideoOff={isVideoOff}
                onToggleLocalMute={toggleLocalMute}
                onMuteParticipant={muteParticipant}
                canMuteOthers={true}
                activeSpeakerId={activeSpeakerId}
                audioOutputDeviceId={audioOutputId}
                mode="filmstrip"
                filmstripDirection={isMobile ? 'horizontal' : 'vertical'}
              />
            </div>
          )}

          {isStreaming && !hasScreenShare && !whiteboardActive && (
            <div style={styles.speakerLayout}>
              <ReactionOverlay reactions={reactions} />
              {/* Teacher's own video — large main view */}
              <div style={styles.mainVideoWrapper}>
                {localStream && !isVideoOff ? (
                  <video
                    ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                    autoPlay
                    muted
                    playsInline
                    style={styles.mainVideo}
                  />
                ) : (
                  <div style={styles.mainVideoAvatar}>
                    <div style={styles.mainAvatarCircle}>{displayName.charAt(0).toUpperCase()}</div>
                    {!localStream && <span style={styles.mainAvatarLabel}>Camera Off</span>}
                  </div>
                )}
                <div style={styles.mainVideoNameTag}>
                  <span style={{ color: '#fbbf24', fontSize: '12px', lineHeight: 1 }}>&#9733;</span>
                  <span>{displayName} (You)</span>
                  {isLocalMuted && <span style={{ marginLeft: '6px', color: '#ef4444' }}>Muted</span>}
                </div>
              </div>
              {/* Participants — small grid strip */}
              {remoteStreams.size > 0 && (
                <div style={styles.participantStrip}>
                  <VideoGrid
                    streams={remoteStreams}
                    onMuteParticipant={muteParticipant}
                    canMuteOthers={true}
                    activeSpeakerId={activeSpeakerId}
                    audioOutputDeviceId={audioOutputId}
                    mode="filmstrip"
                  />
                </div>
              )}
            </div>
          )}

          {/* Breakout setup */}
          {showBreakoutSetup && !isBreakoutActive && (
            <div style={styles.overlayPanel}>
              <CreateBreakoutForm onCreate={(names, duration) => { createBreakoutRooms(names, duration); setShowBreakoutSetup(false); }} />
              <button style={styles.cancelBtn} onClick={() => setShowBreakoutSetup(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* === SIDEBAR === */}
        {showSidebar && (
          <div style={isMobile ? styles.sidebarMobile : styles.sidebar}>
            {isMobile && (
              <button style={styles.closeSidebarBtn} onClick={() => setShowSidebar(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            <SidebarTabs tabs={sidebarTabs} activeTab={sidebarTab} onTabChange={setSidebarTab} />
          </div>
        )}
      </div>

      {/* === FLOATING TOOLBAR === */}
      {isStreaming && (
        <div style={styles.toolbar}>
          <div style={styles.toolbarInner}>
            {/* Mic */}
            <button
              onClick={toggleLocalMute}
              style={isLocalMuted ? styles.controlBtnDanger : styles.controlBtn}
              title={isLocalMuted ? 'Unmute' : 'Mute'}
            >
              {isLocalMuted ? <MicOffIcon /> : <MicIcon />}
              {!isMobile && <span style={styles.controlLabel}>{isLocalMuted ? 'Unmute' : 'Mute'}</span>}
            </button>

            {/* Camera */}
            <button
              onClick={() => toggleVideo()}
              style={isVideoOff ? styles.controlBtnDanger : styles.controlBtn}
              title={isVideoOff ? 'Start Video' : 'Stop Video'}
            >
              {isVideoOff ? <CamOffIcon /> : <CamIcon />}
              {!isMobile && <span style={styles.controlLabel}>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>}
            </button>

            {/* Screen Share */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              disabled={!!activeScreenShare && !isScreenSharing}
              style={isScreenSharing ? styles.controlBtnActive : (activeScreenShare && !isScreenSharing ? styles.controlBtnDisabled : styles.controlBtn)}
              title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            >
              <ScreenShareIcon />
              {!isMobile && <span style={styles.controlLabel}>{isScreenSharing ? 'Stop Share' : 'Share'}</span>}
            </button>

            {/* Record */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={recordingLoading}
              style={isRecording ? styles.controlBtnRecording : styles.controlBtn}
              title={isRecording ? 'Stop Recording' : 'Record'}
            >
              <RecordIcon />
              {!isMobile && <span style={styles.controlLabel}>{isRecording ? 'Stop Rec' : 'Record'}</span>}
            </button>

            <div style={styles.toolbarDivider} />

            {/* Reactions */}
            <div style={{ position: 'relative' }}>
              <ReactionPicker onSelectEmoji={sendReaction} />
            </div>

            {/* Breakout */}
            {!isBreakoutActive && (
              <button
                onClick={() => setShowBreakoutSetup(!showBreakoutSetup)}
                style={styles.controlBtn}
                title="Breakout Rooms"
              >
                <BreakoutIcon />
                {!isMobile && <span style={styles.controlLabel}>Breakout</span>}
              </button>
            )}

            {/* Chat / Panel */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={showSidebar ? styles.controlBtnActive : styles.controlBtn}
              title="Panel"
            >
              <ChatIcon />
              {raisedHands.size > 0 && <div style={styles.notifDot} />}
              {!isMobile && <span style={styles.controlLabel}>Panel</span>}
            </button>

            {/* More menu (mobile) - speaker selector */}
            {!isMobile && audioOutputDevices.length > 1 && (
              <SpeakerSelector devices={audioOutputDevices} selectedDeviceId={audioOutputId} onSelect={selectAudioOutput} />
            )}

            <div style={styles.toolbarDivider} />

            {/* Leave */}
            <button onClick={handleLeave} style={styles.leaveBtn} title="Leave Session">
              <LeaveIcon />
              {!isMobile && <span>Leave</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0d0d0d',
    color: '#fff',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // --- Top Bar ---
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#161616',
    borderBottom: '1px solid #2a2a2a',
    flexShrink: 0,
    minHeight: '48px',
    zIndex: 10,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roomBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
  },
  roomName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e0e0e0',
  },
  recBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#ef4444',
  },
  recDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    animation: 'pulse 1.5s infinite',
  },
  participantBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#252525',
    borderRadius: '14px',
    fontSize: '13px',
    color: '#ccc',
  },
  disconnectedBadge: {
    padding: '3px 10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#ef4444',
  },

  // --- Banners ---
  errorBanner: {
    padding: '10px 16px',
    margin: '0 16px 0',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  handRaiseBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    margin: '8px 16px 0',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.25)',
    borderRadius: '8px',
    color: '#fbbf24',
    cursor: 'pointer',
    fontSize: '13px',
  },
  lowerAllBtn: {
    padding: '5px 12px',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  requestBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    margin: '8px 16px 0',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: '8px',
    color: '#93c5fd',
    fontSize: '13px',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  approveBtn: {
    padding: '5px 14px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  denyBtn: {
    padding: '5px 14px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },

  // --- Main Area ---
  mainArea: {
    flex: 1,
    display: 'grid',
    gap: '0',
    overflow: 'hidden',
    minHeight: 0,
  },
  videoArea: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    paddingBottom: '80px',
    gap: '8px',
    overflow: 'auto',
    minHeight: 0,
  },

  // --- Pre-stream ---
  preStreamContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  preStreamAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '42px',
    color: 'white',
    fontWeight: 700,
  },
  preStreamText: {
    color: '#888',
    fontSize: '16px',
    margin: 0,
  },
  startCameraBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 32px',
    backgroundColor: '#2d8cff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // --- Speaker layout (teacher large + participant strip) ---
  speakerLayout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minHeight: 0,
    overflow: 'auto',
    gap: '8px',
  },
  mainVideoWrapper: {
    position: 'relative',
    flex: 1,
    minHeight: '200px',
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  mainVideoAvatar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    height: '100%',
    minHeight: '200px',
  },
  mainAvatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    color: 'white',
    fontWeight: 700,
  },
  mainAvatarLabel: {
    color: '#666',
    fontSize: '14px',
  },
  mainVideoNameTag: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
  },
  participantStrip: {
    flexShrink: 0,
    maxHeight: '160px',
    overflow: 'auto',
  },

  // --- Screen share layout ---
  screenShareLayout: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    minHeight: '300px',
    overflow: 'auto',
  },
  screenShareLayoutMobile: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '200px',
    overflow: 'auto',
  },

  // --- Overlay panels ---
  overlayPanel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    border: '1px solid #333',
    zIndex: 20,
    maxWidth: '400px',
    width: '90%',
  },
  cancelBtn: {
    padding: '8px',
    backgroundColor: '#333',
    color: '#ccc',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },

  // --- Sidebar ---
  sidebar: {
    backgroundColor: '#161616',
    borderLeft: '1px solid #2a2a2a',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#161616',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
  },
  closeSidebarBtn: {
    alignSelf: 'flex-end',
    margin: '8px 8px 0',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#2a2a2a',
    color: '#aaa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Floating Toolbar ---
  toolbar: {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    padding: '0 8px',
    maxWidth: '95vw',
  },
  toolbarInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  toolbarDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#3a3a3a',
    margin: '0 4px',
  },

  // --- Control Buttons ---
  controlBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '10px',
    transition: 'background-color 0.15s',
    minWidth: '48px',
  },
  controlBtnDanger: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '10px',
    minWidth: '48px',
  },
  controlBtnActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 14px',
    backgroundColor: 'rgba(45, 140, 255, 0.2)',
    color: '#93c5fd',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '10px',
    minWidth: '48px',
  },
  controlBtnRecording: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '10px',
    minWidth: '48px',
    animation: 'pulse 1.5s infinite',
  },
  controlBtnDisabled: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    color: '#555',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed',
    fontSize: '10px',
    opacity: 0.5,
    minWidth: '48px',
  },
  controlLabel: {
    fontSize: '10px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  notifDot: {
    position: 'absolute',
    top: '6px',
    right: '10px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  leaveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },

  // --- Sidebar action ---
  sidebarActionButton: {
    padding: '10px',
    backgroundColor: '#2d8cff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};

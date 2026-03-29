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
import { useChat } from '../../hooks/useChat';
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

// --- SVG Icons ---
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
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
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

interface ViewerViewProps {
  roomId: string;
  userId: string;
  displayName: string;
  onLeave: () => void;
}

export const ViewerView: React.FC<ViewerViewProps> = ({ roomId, userId, displayName, onLeave }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    localStream, remoteStreams, isConnected, error, isLocalMuted, isVideoOff,
    startMedia, stopMedia, toggleVideo, leave, toggleLocalMute, signalingClient,
    activeScreenShare, isScreenSharing, screenSharePermissionStatus,
    startScreenShare, stopScreenShare,
    sessionEnded,
  } = useWebRTC({ roomId, role: 'viewer', userId, displayName });

  const { reactions, sendReaction } = useReactions({ roomId, userId, signalingClient });
  const { remainingSeconds: timerRemaining, isRunning: timerRunning, isPaused: timerPaused, isExpired: timerExpired } = useTimer({ roomId, role: 'viewer', signalingClient });
  const { isHandRaised, raiseHand, lowerHand } = useHandRaise({ roomId, userId, role: 'viewer', signalingClient });
  const { currentPoll, submitVote } = usePoll({ roomId, userId, role: 'viewer', signalingClient });
  const { files } = useFileSharing({ roomId, userId, role: 'viewer', signalingClient });
  const { isActive: whiteboardActive, canDraw: whiteboardCanDraw, sendUpdate: whiteboardSendUpdate, setRemoteDrawCallback, incomingSnapshot: wbSnapshot, setIncomingSnapshot: setWbSnapshot } = useWhiteboard({ roomId, userId, role: 'viewer', signalingClient });
  const { isBreakoutActive, currentBreakoutRoom, assignment, remainingSeconds: breakoutRemaining, joinBreakout, leaveBreakout } = useBreakoutRooms({ roomId, userId, role: 'viewer', signalingClient });

  // Chat hook — always active so messages aren't lost when sidebar is closed
  const chatState = useChat({ roomId, userId, userRole: 'viewer', signalingClient });

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
      try { await startMedia(); setIsStreaming(true); }
      catch (err) { console.error('Failed to auto-start media:', err); }
    };
    autoStart();
  }, []);

  useEffect(() => {
    if (sessionEnded) { stopMedia(); leave(); onLeave(); }
  }, [sessionEnded]);

  const handleToggleCamera = async () => {
    if (isStreaming) {
      toggleVideo();
    } else {
      try { await startMedia(); setIsStreaming(true); }
      catch (err) { console.error('Failed to start media:', err); }
    }
  };

  const handleLeave = () => { stopMedia(); leave(); onLeave(); };

  const getScreenShareBtnText = () => {
    if (isScreenSharing) return isMobile ? 'Stop' : 'Stop Share';
    if (screenSharePermissionStatus === 'pending') return 'Requesting...';
    return isMobile ? 'Share' : 'Share Screen';
  };

  const isScreenShareDisabled = () => {
    if (screenSharePermissionStatus === 'pending') return true;
    if (activeScreenShare && !isScreenSharing) return true;
    return false;
  };

  const totalParticipants = remoteStreams.size + 1;
  const hasScreenShare = !!activeScreenShare;

  // Sidebar tabs
  const sidebarTabs = [
    {
      id: 'chat',
      label: 'Chat',
      content: <ChatWindow chatState={chatState} userRole="viewer" />,
    },
    {
      id: 'polls',
      label: 'Polls',
      content: currentPoll ? (
        <PollDisplay poll={currentPoll} onVote={submitVote} onEnd={() => {}} role="viewer" />
      ) : (
        <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No active poll</div>
      ),
    },
    {
      id: 'files',
      label: 'Files',
      badge: files.length > 0 ? files.length : undefined,
      content: <FileSharePanel files={files} onUpload={() => {}} isUploading={false} canUpload={false} />,
    },
  ];

  return (
    <div style={styles.container}>
      {/* === TOP BAR === */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={styles.roomBadge}>
            <div style={styles.liveDot} />
            <span style={styles.roomName}>Live Session</span>
          </div>
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

      {screenSharePermissionStatus === 'denied' && (
        <div style={styles.deniedBanner}>Screen share request was denied by the host.</div>
      )}

      {/* Breakout notification */}
      {assignment && !currentBreakoutRoom && (
        <div style={{ margin: '8px 16px 0' }}>
          <BreakoutNotification roomName={assignment.name} onJoin={joinBreakout} />
        </div>
      )}
      {currentBreakoutRoom && (
        <div style={{ margin: '8px 16px 0' }}>
          <BreakoutRoomView breakoutRoom={currentBreakoutRoom} remainingSeconds={breakoutRemaining} onLeave={leaveBreakout} />
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div style={{
        ...styles.mainArea,
        ...(showSidebar && !isMobile ? { gridTemplateColumns: '1fr 360px' } : { gridTemplateColumns: '1fr' }),
      }}>
        <div style={styles.videoArea}>
          {/* Whiteboard */}
          <WhiteboardPanel
            isActive={whiteboardActive}
            canDraw={whiteboardCanDraw}
            onSendUpdate={whiteboardSendUpdate}
            onRegisterRemoteDraw={setRemoteDrawCallback}
            incomingSnapshot={wbSnapshot}
            onClearSnapshot={() => setWbSnapshot(null)}
          />

          {/* Screen share + filmstrip OR gallery grid */}
          {hasScreenShare && (
            <div style={isMobile ? styles.screenShareLayoutMobile : styles.screenShareLayout}>
              <ScreenShareDisplay
                stream={activeScreenShare.stream}
                sharerUserId={activeScreenShare.userId}
                isLocal={activeScreenShare.userId === userId}
                onStop={isScreenSharing ? stopScreenShare : undefined}
                canStop={isScreenSharing}
              />
              <VideoGrid
                streams={remoteStreams}
                localStream={isVideoOff ? null : localStream}
                localUserId={userId}
                localDisplayName={displayName}
                showLocalPlaceholder={isStreaming}
                isLocalMuted={isLocalMuted}
                isLocalVideoOff={isVideoOff}
                onToggleLocalMute={toggleLocalMute}
                canMuteOthers={false}
                activeSpeakerId={activeSpeakerId}
                audioOutputDeviceId={audioOutputId}
                mode="filmstrip"
                filmstripDirection={isMobile ? 'horizontal' : 'vertical'}
              />
            </div>
          )}

          {!hasScreenShare && !whiteboardActive && (() => {
            // Find the teacher (broadcaster) in remote streams
            let teacherEntry: [string, any] | undefined;
            const otherStreams = new Map<string, any>();
            remoteStreams.forEach((participant, id) => {
              if (participant.role === 'broadcaster' && !teacherEntry) {
                teacherEntry = [id, participant];
              } else {
                otherStreams.set(id, participant);
              }
            });

            return (
              <div style={styles.speakerLayout}>
                <ReactionOverlay reactions={reactions} />
                {/* Teacher video — large main view */}
                <div style={styles.mainVideoWrapper}>
                  {teacherEntry && teacherEntry[1].stream && teacherEntry[1].hasVideo ? (
                    <video
                      ref={(el) => { if (el && teacherEntry![1].stream) el.srcObject = teacherEntry![1].stream; }}
                      autoPlay
                      playsInline
                      muted={false}
                      style={styles.mainVideo}
                    />
                  ) : (
                    <div style={styles.mainVideoAvatar}>
                      <div style={styles.mainAvatarCircle}>
                        {teacherEntry ? (teacherEntry[1].displayName || teacherEntry[1].userId || 'T').charAt(0).toUpperCase() : 'T'}
                      </div>
                      <span style={styles.mainAvatarLabel}>
                        {teacherEntry ? (teacherEntry[1].hasVideo === false ? 'Camera Off' : 'Waiting for teacher...') : 'Waiting for teacher...'}
                      </span>
                    </div>
                  )}
                  {teacherEntry && (
                    <div style={styles.mainVideoNameTag}>
                      <span style={{ color: '#fbbf24', fontSize: '12px', lineHeight: 1 }}>&#9733;</span>
                      <span>{teacherEntry[1].displayName || teacherEntry[1].userId} (Teacher)</span>
                      {teacherEntry[1].isMuted && <span style={{ marginLeft: '6px', color: '#ef4444' }}>Muted</span>}
                    </div>
                  )}
                  {/* Hidden audio element for teacher audio (main video is muted to avoid echo, audio plays separately) */}
                  {teacherEntry && teacherEntry[1].stream && (
                    <audio
                      ref={(el) => { if (el && teacherEntry![1].stream) el.srcObject = teacherEntry![1].stream; }}
                      autoPlay
                    />
                  )}
                </div>
                {/* Other participants + self — small strip */}
                {(otherStreams.size > 0 || isStreaming) && (
                  <div style={styles.participantStrip}>
                    <VideoGrid
                      streams={otherStreams}
                      localStream={isVideoOff ? null : localStream}
                      localUserId={userId}
                      localDisplayName={displayName}
                      showLocalPlaceholder={isStreaming}
                      isLocalMuted={isLocalMuted}
                      isLocalVideoOff={isVideoOff}
                      onToggleLocalMute={toggleLocalMute}
                      canMuteOthers={false}
                      activeSpeakerId={activeSpeakerId}
                      audioOutputDeviceId={audioOutputId}
                      mode="filmstrip"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {remoteStreams.size === 0 && !localStream && !hasScreenShare && !whiteboardActive && (
            <div style={styles.waitingMessage}>
              <div style={styles.waitingSpinner} />
              <p>Waiting for the host to start...</p>
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
            onClick={handleToggleCamera}
            style={isVideoOff || !isStreaming ? styles.controlBtnDanger : styles.controlBtn}
            title={isVideoOff ? 'Start Video' : 'Stop Video'}
          >
            {isVideoOff || !isStreaming ? <CamOffIcon /> : <CamIcon />}
            {!isMobile && <span style={styles.controlLabel}>{isStreaming ? (isVideoOff ? 'Start Video' : 'Stop Video') : 'Start Cam'}</span>}
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            disabled={isScreenShareDisabled()}
            style={isScreenSharing ? styles.controlBtnActive : (isScreenShareDisabled() ? styles.controlBtnDisabled : styles.controlBtn)}
            title={getScreenShareBtnText()}
          >
            <ScreenShareIcon />
            {!isMobile && <span style={styles.controlLabel}>{getScreenShareBtnText()}</span>}
          </button>

          <div style={styles.toolbarDivider} />

          {/* Hand Raise */}
          <HandRaiseButton
            isHandRaised={isHandRaised}
            onToggle={() => isHandRaised ? lowerHand() : raiseHand()}
          />

          {/* Reactions */}
          <div style={{ position: 'relative' }}>
            <ReactionPicker onSelectEmoji={sendReaction} />
          </div>

          {/* Chat / Panel */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={showSidebar ? styles.controlBtnActive : styles.controlBtn}
            title="Panel"
          >
            <ChatIcon />
            {!isMobile && <span style={styles.controlLabel}>Panel</span>}
          </button>

          {/* Speaker selector (desktop only) */}
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
    margin: '8px 16px 0',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  deniedBanner: {
    padding: '10px 16px',
    margin: '8px 16px 0',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '13px',
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

  // --- Waiting ---
  waitingMessage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#666',
    fontSize: '16px',
  },
  waitingSpinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #333',
    borderTopColor: '#2d8cff',
    animation: 'spin 1s linear infinite',
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
};

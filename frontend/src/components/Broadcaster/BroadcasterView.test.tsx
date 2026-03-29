import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock all hooks and child components to isolate BroadcasterView behavior
const mockStartMedia = jest.fn().mockResolvedValue(undefined);
const mockStopMedia = jest.fn();
const mockToggleVideo = jest.fn();
const mockLeave = jest.fn();
const mockToggleLocalMute = jest.fn();

const defaultWebRTCReturn = {
  localStream: null,
  remoteStreams: new Map(),
  isConnected: true,
  error: null,
  isLocalMuted: false,
  isVideoOff: false,
  startMedia: mockStartMedia,
  stopMedia: mockStopMedia,
  toggleVideo: mockToggleVideo,
  leave: mockLeave,
  toggleLocalMute: mockToggleLocalMute,
  muteParticipant: jest.fn(),
  signalingClient: null,
  activeScreenShare: null,
  isScreenSharing: false,
  screenShareRequest: null,
  screenSharePermissionStatus: 'none' as const,
  startScreenShare: jest.fn(),
  stopScreenShare: jest.fn(),
  respondToScreenShareRequest: jest.fn(),
  forceStopScreenShare: jest.fn(),
  sessionEnded: false,
};

const mockUseWebRTC = jest.fn(() => ({ ...defaultWebRTCReturn }));

jest.mock('../../hooks/useWebRTC', () => ({ useWebRTC: () => mockUseWebRTC() }));
jest.mock('../../hooks/useReactions', () => ({ useReactions: () => ({ reactions: [], sendReaction: jest.fn() }) }));
jest.mock('../../hooks/useTimer', () => ({ useTimer: () => ({ remainingSeconds: 0, isRunning: false, isPaused: false, isExpired: false, startTimer: jest.fn(), pauseTimer: jest.fn(), resumeTimer: jest.fn(), resetTimer: jest.fn() }) }));
jest.mock('../../hooks/useHandRaise', () => ({ useHandRaise: () => ({ raisedHands: new Map(), lowerHand: jest.fn(), lowerAllHands: jest.fn() }) }));
jest.mock('../../hooks/usePoll', () => ({ usePoll: () => ({ currentPoll: null, createPoll: jest.fn(), submitVote: jest.fn(), endPoll: jest.fn() }) }));
jest.mock('../../hooks/useFileSharing', () => ({ useFileSharing: () => ({ files: [], uploadAndShare: jest.fn(), isUploading: false }) }));
jest.mock('../../hooks/useWhiteboard', () => ({ useWhiteboard: () => ({ isActive: false, canDraw: false, drawPermissions: new Set(), toggleWhiteboard: jest.fn(), sendUpdate: jest.fn(), grantDraw: jest.fn(), revokeDraw: jest.fn(), setRemoteDrawCallback: jest.fn(), incomingSnapshot: null, setIncomingSnapshot: jest.fn() }) }));
jest.mock('../../hooks/useBreakoutRooms', () => ({ useBreakoutRooms: () => ({ breakoutRooms: [], isBreakoutActive: false, remainingSeconds: 0, createBreakoutRooms: jest.fn(), assignParticipants: jest.fn(), endBreakoutRooms: jest.fn() }) }));
jest.mock('../../hooks/useActiveSpeaker', () => ({ useActiveSpeaker: () => null }));
jest.mock('../../hooks/useAudioOutput', () => ({ useAudioOutput: () => ({ devices: [], selectedDeviceId: '', selectDevice: jest.fn() }) }));

jest.mock('../Video/VideoGrid', () => ({ VideoGrid: (props: any) => <div data-testid="video-grid" data-mode={props.mode} data-can-mute={String(props.canMuteOthers)} /> }));
jest.mock('../Video/ScreenShareDisplay', () => ({ ScreenShareDisplay: () => <div data-testid="screen-share" /> }));
jest.mock('../Video/SpeakerSelector', () => ({ SpeakerSelector: () => null }));
jest.mock('../Chat/ChatWindow', () => ({ ChatWindow: () => <div>Chat</div> }));
jest.mock('../Reactions/ReactionPicker', () => ({ ReactionPicker: () => <div>Reactions</div> }));
jest.mock('../Reactions/ReactionOverlay', () => ({ ReactionOverlay: () => null }));
jest.mock('../Timer/TimerDisplay', () => ({ TimerDisplay: () => null }));
jest.mock('../Timer/TimerControls', () => ({ TimerControls: () => null }));
jest.mock('../HandRaise/RaisedHandsList', () => ({ RaisedHandsList: () => null }));
jest.mock('../Poll/CreatePollForm', () => ({ CreatePollForm: () => null }));
jest.mock('../Poll/PollDisplay', () => ({ PollDisplay: () => null }));
jest.mock('../FileSharing/FileSharePanel', () => ({ FileSharePanel: () => null }));
jest.mock('../Whiteboard/WhiteboardPanel', () => ({ WhiteboardPanel: () => null }));
jest.mock('../Whiteboard/WhiteboardControls', () => ({ WhiteboardControls: () => null }));
jest.mock('../Breakout/CreateBreakoutForm', () => ({ CreateBreakoutForm: () => null }));
jest.mock('../Breakout/BreakoutAssignment', () => ({ BreakoutAssignment: () => null }));
jest.mock('../Breakout/BreakoutOverview', () => ({ BreakoutOverview: () => null }));
jest.mock('../Sidebar/SidebarTabs', () => ({ SidebarTabs: () => <div data-testid="sidebar" /> }));
jest.mock('../../services/api/live/RecordingApi', () => ({ recordingApi: { startRecording: jest.fn(), stopRecording: jest.fn() } }));

import { BroadcasterView } from './BroadcasterView';

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
});

beforeEach(() => {
  mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn });
});

describe('BroadcasterView', () => {
  const defaultProps = {
    roomId: 'room-1',
    userId: 'teacher-1',
    displayName: 'Teacher',
    onLeave: jest.fn(),
  };

  it('renders pre-stream state with start camera button', () => {
    render(<BroadcasterView {...defaultProps} />);
    expect(screen.getByText(/ready to start/i)).toBeInTheDocument();
    expect(screen.getByText(/start camera/i)).toBeInTheDocument();
  });

  it('shows top bar with live indicator and participant count', () => {
    render(<BroadcasterView {...defaultProps} />);
    expect(screen.getByText('Live Session')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls startMedia when Start Camera is clicked', () => {
    render(<BroadcasterView {...defaultProps} />);
    fireEvent.click(screen.getByText(/start camera/i));
    expect(mockStartMedia).toHaveBeenCalled();
  });

  it('renders full viewport dark layout', () => {
    const { container } = render(<BroadcasterView {...defaultProps} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.height).toBe('100vh');
    expect(root.style.backgroundColor).toMatch(/(#0d0d0d|rgb\(13, 13, 13\))/);
  });

  it('does not render video grid before streaming starts', () => {
    render(<BroadcasterView {...defaultProps} />);
    expect(screen.queryByTestId('video-grid')).not.toBeInTheDocument();
  });

  it('calls onLeave when sessionEnded becomes true', () => {
    mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn, sessionEnded: true });
    render(<BroadcasterView {...defaultProps} />);
    expect(defaultProps.onLeave).toHaveBeenCalled();
  });

  it('shows participant count including remotes', () => {
    const remotes = new Map();
    remotes.set('s1', { stream: null, userId: 's1', displayName: 'Student 1', role: 'viewer', hasVideo: false, isMuted: false });
    remotes.set('s2', { stream: null, userId: 's2', displayName: 'Student 2', role: 'viewer', hasVideo: false, isMuted: false });
    mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn, remoteStreams: remotes });

    render(<BroadcasterView {...defaultProps} />);
    // 2 remotes + 1 self = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

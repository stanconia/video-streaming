import React from 'react';
import { render, screen } from '@testing-library/react';

const mockStartMedia = jest.fn().mockResolvedValue(undefined);
const mockLeave = jest.fn();

const defaultWebRTCReturn = {
  localStream: null as MediaStream | null,
  remoteStreams: new Map(),
  isConnected: true,
  error: null,
  isLocalMuted: false,
  isVideoOff: false,
  startMedia: mockStartMedia,
  stopMedia: jest.fn(),
  toggleVideo: jest.fn(),
  leave: mockLeave,
  toggleLocalMute: jest.fn(),
  muteParticipant: jest.fn(),
  signalingClient: null,
  activeScreenShare: null,
  isScreenSharing: false,
  screenShareRequest: null,
  screenSharePermissionStatus: 'none' as 'none' | 'pending' | 'approved' | 'denied',
  startScreenShare: jest.fn(),
  stopScreenShare: jest.fn(),
  respondToScreenShareRequest: jest.fn(),
  forceStopScreenShare: jest.fn(),
  sessionEnded: false,
};

const mockUseWebRTC = jest.fn(() => ({ ...defaultWebRTCReturn }));

jest.mock('../../hooks/useWebRTC', () => ({ useWebRTC: () => mockUseWebRTC() }));
jest.mock('../../hooks/useReactions', () => ({ useReactions: () => ({ reactions: [], sendReaction: jest.fn() }) }));
jest.mock('../../hooks/useTimer', () => ({ useTimer: () => ({ remainingSeconds: 0, isRunning: false, isPaused: false, isExpired: false }) }));
jest.mock('../../hooks/useHandRaise', () => ({ useHandRaise: () => ({ isHandRaised: false, raiseHand: jest.fn(), lowerHand: jest.fn() }) }));
jest.mock('../../hooks/usePoll', () => ({ usePoll: () => ({ currentPoll: null, submitVote: jest.fn() }) }));
jest.mock('../../hooks/useFileSharing', () => ({ useFileSharing: () => ({ files: [] }) }));
jest.mock('../../hooks/useWhiteboard', () => ({ useWhiteboard: () => ({ isActive: false, canDraw: false, sendUpdate: jest.fn(), setRemoteDrawCallback: jest.fn(), incomingSnapshot: null, setIncomingSnapshot: jest.fn() }) }));
jest.mock('../../hooks/useBreakoutRooms', () => ({ useBreakoutRooms: () => ({ isBreakoutActive: false, currentBreakoutRoom: null, assignment: null, remainingSeconds: 0, joinBreakout: jest.fn(), leaveBreakout: jest.fn() }) }));
jest.mock('../../hooks/useActiveSpeaker', () => ({ useActiveSpeaker: () => null }));
jest.mock('../../hooks/useAudioOutput', () => ({ useAudioOutput: () => ({ devices: [], selectedDeviceId: '', selectDevice: jest.fn() }) }));

jest.mock('../Video/VideoGrid', () => ({ VideoGrid: (props: any) => <div data-testid="video-grid" data-mode={props.mode} data-can-mute={String(props.canMuteOthers)} /> }));
jest.mock('../Video/ScreenShareDisplay', () => ({ ScreenShareDisplay: () => <div data-testid="screen-share" /> }));
jest.mock('../Video/SpeakerSelector', () => ({ SpeakerSelector: () => null }));
jest.mock('../Chat/ChatWindow', () => ({ ChatWindow: () => <div>Chat</div> }));
jest.mock('../Reactions/ReactionPicker', () => ({ ReactionPicker: () => <div>Reactions</div> }));
jest.mock('../Reactions/ReactionOverlay', () => ({ ReactionOverlay: () => null }));
jest.mock('../Timer/TimerDisplay', () => ({ TimerDisplay: () => null }));
jest.mock('../HandRaise/HandRaiseButton', () => ({ HandRaiseButton: () => <button>Hand</button> }));
jest.mock('../Poll/PollDisplay', () => ({ PollDisplay: () => null }));
jest.mock('../FileSharing/FileSharePanel', () => ({ FileSharePanel: () => null }));
jest.mock('../Whiteboard/WhiteboardPanel', () => ({ WhiteboardPanel: () => null }));
jest.mock('../Breakout/BreakoutNotification', () => ({ BreakoutNotification: () => null }));
jest.mock('../Breakout/BreakoutRoomView', () => ({ BreakoutRoomView: () => null }));
jest.mock('../Sidebar/SidebarTabs', () => ({ SidebarTabs: () => <div data-testid="sidebar" /> }));

import { ViewerView } from './ViewerView';

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn });
});

describe('ViewerView', () => {
  const defaultProps = {
    roomId: 'room-1',
    userId: 'student-1',
    displayName: 'Student',
    onLeave: jest.fn(),
  };

  it('renders full viewport dark layout', () => {
    const { container } = render(<ViewerView {...defaultProps} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.height).toBe('100vh');
    // jsdom converts hex to rgb
    expect(root.style.backgroundColor).toMatch(/(#0d0d0d|rgb\(13, 13, 13\))/);
  });

  it('shows top bar with Live Session label and participant count', () => {
    render(<ViewerView {...defaultProps} />);
    expect(screen.getByText('Live Session')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders speaker layout with teacher large and participant filmstrip', () => {
    render(<ViewerView {...defaultProps} />);
    // Should show "Waiting for teacher..." when no broadcaster is in remoteStreams
    expect(screen.getByText(/waiting for teacher/i)).toBeInTheDocument();
  });

  it('shows teacher video emphasized and other participants in strip', () => {
    const remotes = new Map();
    remotes.set('teacher-1', { stream: null, userId: 'teacher-1', displayName: 'Prof Smith', role: 'broadcaster', hasVideo: false, isMuted: false });
    remotes.set('student-2', { stream: null, userId: 'student-2', displayName: 'Alice', role: 'viewer', hasVideo: false, isMuted: false });
    mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn, remoteStreams: remotes });

    render(<ViewerView {...defaultProps} />);
    // Teacher should be in the large main view with star and "(Teacher)" label
    expect(screen.getByText(/Prof Smith/)).toBeInTheDocument();
    expect(screen.getByText(/(Teacher)/)).toBeInTheDocument();
    // Other participant should be in the filmstrip grid
    const grid = screen.getByTestId('video-grid');
    expect(grid.getAttribute('data-can-mute')).toBe('false');
  });

  it('renders floating toolbar with hand raise and leave', () => {
    render(<ViewerView {...defaultProps} />);
    expect(screen.getByText('Hand')).toBeInTheDocument();
    expect(screen.getByTitle('Leave Session')).toBeInTheDocument();
  });

  it('auto-starts media on mount', () => {
    render(<ViewerView {...defaultProps} />);
    expect(mockStartMedia).toHaveBeenCalled();
  });

  it('calls onLeave when sessionEnded is true', () => {
    mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn, sessionEnded: true });
    render(<ViewerView {...defaultProps} />);
    expect(defaultProps.onLeave).toHaveBeenCalled();
  });

  it('shows denied banner when screen share is denied', () => {
    mockUseWebRTC.mockReturnValue({ ...defaultWebRTCReturn, screenSharePermissionStatus: 'denied' });
    render(<ViewerView {...defaultProps} />);
    expect(screen.getByText(/denied by the host/i)).toBeInTheDocument();
  });
});

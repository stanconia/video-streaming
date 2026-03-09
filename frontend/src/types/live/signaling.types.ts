export interface SignalingMessage {
  type: string;
  requestId?: string;
  [key: string]: any;
}

export interface JoinRoomMessage extends SignalingMessage {
  type: 'join-room';
  roomId: string;
  role: 'broadcaster' | 'viewer';
  userId: string;
}

export interface GetRouterCapabilitiesMessage extends SignalingMessage {
  type: 'get-router-capabilities';
  roomId: string;
}

export interface CreateTransportMessage extends SignalingMessage {
  type: 'create-transport';
  roomId: string;
  direction: 'send' | 'receive';
}

export interface ConnectTransportMessage extends SignalingMessage {
  type: 'connect-transport';
  transportId: string;
  dtlsParameters: any;
  roomId: string;
}

export interface ProduceMessage extends SignalingMessage {
  type: 'produce';
  transportId: string;
  kind: 'audio' | 'video';
  rtpParameters: any;
  roomId: string;
  source?: 'camera' | 'screen';
}

// Screen share message types
export interface ScreenShareRequestMessage extends SignalingMessage {
  type: 'screen-share-request';
  roomId: string;
  userId: string;
}

export interface ScreenShareResponseMessage extends SignalingMessage {
  type: 'screen-share-response';
  roomId: string;
  targetUserId: string;
  approved: boolean;
}

export interface ScreenShareStatusUpdateMessage extends SignalingMessage {
  type: 'screen-share-status-update';
  roomId: string;
  userId: string;
  active: boolean;
}

export interface StopScreenShareMessage extends SignalingMessage {
  type: 'stop-screen-share';
  roomId: string;
  targetUserId: string;
}

// Screen share notification types
export interface ScreenShareRequestNotification {
  type: 'screen-share-request-notification';
  userId: string;
}

export interface ScreenSharePermissionNotification {
  type: 'screen-share-permission';
  approved: boolean;
}

export interface ScreenShareStatusNotification {
  type: 'screen-share-status';
  userId: string;
  active: boolean;
}

export interface ScreenShareStoppedNotification {
  type: 'screen-share-stopped';
}

export interface ConsumeMessage extends SignalingMessage {
  type: 'consume';
  transportId: string;
  producerId: string;
  rtpCapabilities: any;
  roomId: string;
}

export interface ResumeConsumerMessage extends SignalingMessage {
  type: 'resume-consumer';
  consumerId: string;
  roomId: string;
}

// Chat message types
export interface SendChatMessage extends SignalingMessage {
  type: 'send-chat-message';
  roomId: string;
  content: string;
  userId: string;
}

export interface ChatMessageNotification {
  type: 'chat-message';
  messageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'broadcaster' | 'viewer';
  content: string;
  timestamp: string;
}

export interface RecordingStatusNotification {
  type: 'recording-status-changed';
  roomId: string;
  isRecording: boolean;
}

// ==================== TIER 2: EMOJI REACTIONS ====================

export interface SendReactionMessage extends SignalingMessage {
  type: 'send-reaction';
  roomId: string;
  emoji: string;
}

export interface ReactionNotification {
  type: 'reaction';
  userId: string;
  emoji: string;
  timestamp: string;
}

// ==================== TIER 2: SESSION TIMER ====================

export interface StartTimerMessage extends SignalingMessage {
  type: 'start-timer';
  roomId: string;
  durationSeconds: number;
}

export interface PauseTimerMessage extends SignalingMessage {
  type: 'pause-timer';
  roomId: string;
}

export interface ResumeTimerMessage extends SignalingMessage {
  type: 'resume-timer';
  roomId: string;
}

export interface ResetTimerMessage extends SignalingMessage {
  type: 'reset-timer';
  roomId: string;
}

export interface TimerStartedNotification {
  type: 'timer-started';
  durationSeconds: number;
  serverTimestamp: string;
}

export interface TimerPausedNotification {
  type: 'timer-paused';
  remainingSeconds: number;
}

export interface TimerResumedNotification {
  type: 'timer-resumed';
  remainingSeconds: number;
  serverTimestamp: string;
}

export interface TimerResetNotification {
  type: 'timer-reset';
}

// ==================== TIER 2: HAND RAISE ====================

export interface RaiseHandMessage extends SignalingMessage {
  type: 'raise-hand';
  roomId: string;
}

export interface LowerHandMessage extends SignalingMessage {
  type: 'lower-hand';
  roomId: string;
  targetUserId: string;
}

export interface LowerAllHandsMessage extends SignalingMessage {
  type: 'lower-all-hands';
  roomId: string;
}

export interface HandRaisedNotification {
  type: 'hand-raised';
  userId: string;
  userName: string;
}

export interface HandLoweredNotification {
  type: 'hand-lowered';
  userId: string;
}

export interface AllHandsLoweredNotification {
  type: 'all-hands-lowered';
}

// ==================== TIER 2: POLLS ====================

export interface CreatePollMessage extends SignalingMessage {
  type: 'create-poll';
  roomId: string;
  question: string;
  options: string[];
}

export interface SubmitVoteMessage extends SignalingMessage {
  type: 'submit-vote';
  roomId: string;
  pollId: string;
  optionIndex: number;
}

export interface EndPollMessage extends SignalingMessage {
  type: 'end-poll';
  roomId: string;
  pollId: string;
}

export interface PollCreatedNotification {
  type: 'poll-created';
  pollId: string;
  question: string;
  options: string[];
}

export interface PollUpdatedNotification {
  type: 'poll-updated';
  pollId: string;
  votes: Record<number, number>;
  totalVotes: number;
}

export interface PollEndedNotification {
  type: 'poll-ended';
  pollId: string;
  finalResults: {
    question: string;
    options: string[];
    votes: Record<number, number>;
    totalVotes: number;
  };
}

// ==================== TIER 2: FILE SHARING ====================

export interface ShareFileMessage extends SignalingMessage {
  type: 'share-file';
  roomId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

export interface FileSharedNotification {
  type: 'file-shared';
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  sharedBy: string;
  timestamp: string;
}

// ==================== TIER 2: WHITEBOARD ====================

export interface WhiteboardToggleMessage extends SignalingMessage {
  type: 'whiteboard-toggle';
  roomId: string;
  active: boolean;
}

export interface WhiteboardUpdateMessage extends SignalingMessage {
  type: 'whiteboard-update';
  roomId: string;
  changes: any;
}

export interface WhiteboardGrantDrawMessage extends SignalingMessage {
  type: 'whiteboard-grant-draw';
  roomId: string;
  targetUserId: string;
}

export interface WhiteboardRevokeDrawMessage extends SignalingMessage {
  type: 'whiteboard-revoke-draw';
  roomId: string;
  targetUserId: string;
}

export interface WhiteboardSnapshotMessage extends SignalingMessage {
  type: 'whiteboard-snapshot';
  roomId: string;
  snapshot: any;
}

export interface WhiteboardToggledNotification {
  type: 'whiteboard-toggled';
  active: boolean;
}

export interface WhiteboardUpdateNotification {
  type: 'whiteboard-update';
  changes: any;
  userId: string;
}

export interface WhiteboardDrawPermissionNotification {
  type: 'whiteboard-draw-permission';
  targetUserId: string;
  granted: boolean;
}

export interface WhiteboardSnapshotNotification {
  type: 'whiteboard-snapshot';
  snapshot: any;
}

// ==================== TIER 2: BREAKOUT ROOMS ====================

export interface CreateBreakoutRoomsMessage extends SignalingMessage {
  type: 'create-breakout-rooms';
  roomId: string;
  roomNames: string[];
  durationMinutes?: number;
}

export interface AssignBreakoutMessage extends SignalingMessage {
  type: 'assign-breakout';
  roomId: string;
  assignments: Record<string, string>;
}

export interface JoinBreakoutMessage extends SignalingMessage {
  type: 'join-breakout';
  roomId: string;
  breakoutRoomId: string;
}

export interface LeaveBreakoutMessage extends SignalingMessage {
  type: 'leave-breakout';
  roomId: string;
}

export interface EndBreakoutRoomsMessage extends SignalingMessage {
  type: 'end-breakout-rooms';
  roomId: string;
}

export interface BreakoutRoomsCreatedNotification {
  type: 'breakout-rooms-created';
  rooms: Array<{ id: string; name: string }>;
  durationMinutes?: number;
}

export interface BreakoutAssignedNotification {
  type: 'breakout-assigned';
  breakoutRoomId: string;
  breakoutRoomName: string;
}

export interface BreakoutRoomsEndedNotification {
  type: 'breakout-rooms-ended';
}

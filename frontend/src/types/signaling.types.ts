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

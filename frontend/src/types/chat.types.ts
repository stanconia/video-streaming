export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'broadcaster' | 'viewer';
  content: string;
  timestamp: Date;
  isOwnMessage: boolean;
}

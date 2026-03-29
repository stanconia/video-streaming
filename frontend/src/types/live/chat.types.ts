export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'broadcaster' | 'viewer' | 'ai';
  content: string;
  timestamp: Date;
  isOwnMessage: boolean;
  isAiMessage?: boolean;
  isAiQuery?: boolean;
  isStreaming?: boolean;
}

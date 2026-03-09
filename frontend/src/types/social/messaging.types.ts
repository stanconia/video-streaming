export interface Conversation {
  id: string;
  otherUserId: string;
  otherDisplayName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  recipientUserId: string;
  content: string;
}

export interface MessagePage {
  content: Message[];
  totalPages: number;
  totalElements: number;
  number: number;
}

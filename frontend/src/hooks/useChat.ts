import { useState, useEffect, useCallback } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';
import { ChatMessage } from '../types/live/chat.types';
import { ChatMessageNotification } from '../types/live/signaling.types';

interface UseChatOptions {
  roomId: string;
  userId: string;
  userRole: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
}

export function useChat({ roomId, userId, userRole, signalingClient }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signalingClient) return;

    const handleChatMessage = (notification: ChatMessageNotification) => {
      const newMessage: ChatMessage = {
        id: notification.messageId,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderRole: notification.senderRole,
        content: notification.content,
        timestamp: new Date(notification.timestamp),
        isOwnMessage: notification.senderId === userId,
      };

      setMessages(prev => [...prev, newMessage]);
    };

    signalingClient.on('chat-message', handleChatMessage);

    return () => {
      signalingClient.off('chat-message');
    };
  }, [signalingClient, userId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!signalingClient || !content.trim()) return;

    try {
      await signalingClient.send({
        type: 'send-chat-message',
        roomId,
        content: content.trim(),
        userId,
      });
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
    }
  }, [signalingClient, roomId, userId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    sendMessage,
    isConnected: signalingClient?.isConnected() ?? false,
    error,
    clearError,
  };
}

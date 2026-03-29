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
  sendAiMessage: (question: string) => Promise<void>;
  requestSummary: () => Promise<void>;
  sessionSummary: string | null;
  isAiThinking: boolean;
  isSummaryGenerating: boolean;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
}

export function useChat({ roomId, userId, userRole, signalingClient }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);

  useEffect(() => {
    if (!signalingClient) return;

    const handleChatMessage = (notification: ChatMessageNotification & { isAiQuery?: boolean }) => {
      const newMessage: ChatMessage = {
        id: notification.messageId,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderRole: notification.senderRole,
        content: notification.content,
        timestamp: new Date(notification.timestamp),
        isOwnMessage: notification.senderId === userId,
        isAiQuery: notification.isAiQuery || false,
      };
      setMessages(prev => [...prev, newMessage]);
    };

    const handleAiStart = (notification: { messageId: string; roomId: string }) => {
      setIsAiThinking(true);
      // Add a placeholder AI message that will be filled by chunks
      const aiMessage: ChatMessage = {
        id: notification.messageId,
        senderId: 'ai-assistant',
        senderName: 'AI Assistant',
        senderRole: 'ai',
        content: '',
        timestamp: new Date(),
        isOwnMessage: false,
        isAiMessage: true,
        isStreaming: true,
      };
      setMessages(prev => [...prev, aiMessage]);
    };

    const handleAiChunk = (notification: { messageId: string; chunk: string }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === notification.messageId
            ? { ...msg, content: msg.content + notification.chunk }
            : msg
        )
      );
    };

    const handleAiComplete = (notification: { messageId: string; fullContent: string }) => {
      setIsAiThinking(false);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === notification.messageId
            ? { ...msg, content: notification.fullContent, isStreaming: false }
            : msg
        )
      );
    };

    const handleSummary = (notification: { summary: string }) => {
      setSessionSummary(notification.summary);
      setIsSummaryGenerating(false);
    };

    const handleSummaryGenerating = () => {
      setIsSummaryGenerating(true);
    };

    signalingClient.on('chat-message', handleChatMessage);
    signalingClient.on('ai-chat-message-start', handleAiStart);
    signalingClient.on('ai-chat-message-chunk', handleAiChunk);
    signalingClient.on('ai-chat-message-complete', handleAiComplete);
    signalingClient.on('session-summary', handleSummary);
    signalingClient.on('ai-summary-generating', handleSummaryGenerating);

    return () => {
      signalingClient.off('chat-message');
      signalingClient.off('ai-chat-message-start');
      signalingClient.off('ai-chat-message-chunk');
      signalingClient.off('ai-chat-message-complete');
      signalingClient.off('session-summary');
      signalingClient.off('ai-summary-generating');
    };
  }, [signalingClient, userId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!signalingClient || !content.trim()) return;

    // Auto-detect @ai prefix
    const trimmed = content.trim();
    if (trimmed.toLowerCase().startsWith('@ai ')) {
      const question = trimmed.slice(4).trim();
      if (question) {
        await sendAiMessageInternal(question);
        return;
      }
    }

    try {
      await signalingClient.send({
        type: 'send-chat-message',
        roomId,
        content: trimmed,
        userId,
      });
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
    }
  }, [signalingClient, roomId, userId]);

  const sendAiMessageInternal = useCallback(async (question: string) => {
    if (!signalingClient || !question.trim()) return;

    try {
      await signalingClient.send({
        type: 'send-ai-chat-message',
        roomId,
        question: question.trim(),
        userId,
      });
    } catch (err: any) {
      setError(`Failed to send AI message: ${err.message}`);
      setIsAiThinking(false);
    }
  }, [signalingClient, roomId, userId]);

  const sendAiMessage = useCallback(async (question: string) => {
    await sendAiMessageInternal(question);
  }, [sendAiMessageInternal]);

  const requestSummary = useCallback(async () => {
    if (!signalingClient) return;
    try {
      setIsSummaryGenerating(true);
      await signalingClient.send({
        type: 'request-session-summary',
        roomId,
      });
    } catch (err: any) {
      setError(`Failed to request summary: ${err.message}`);
      setIsSummaryGenerating(false);
    }
  }, [signalingClient, roomId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    sendMessage,
    sendAiMessage,
    requestSummary,
    sessionSummary,
    isAiThinking,
    isSummaryGenerating,
    isConnected: signalingClient?.isConnected() ?? false,
    error,
    clearError,
  };
}

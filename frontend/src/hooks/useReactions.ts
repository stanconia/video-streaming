import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';
import { ReactionNotification } from '../types/live/signaling.types';

interface UseReactionsOptions {
  roomId: string;
  userId: string;
  signalingClient: SignalingClient | null;
}

export interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  timestamp: number;
  x: number; // random horizontal position 0-100
}

export function useReactions({ roomId, userId, signalingClient }: UseReactionsOptions) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const lastReactionTime = useRef(0);

  useEffect(() => {
    if (!signalingClient) return;

    const handleReaction = (notification: ReactionNotification) => {
      const newReaction: Reaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: notification.userId,
        emoji: notification.emoji,
        timestamp: Date.now(),
        x: Math.random() * 80 + 10,
      };
      setReactions(prev => [...prev, newReaction]);
    };

    signalingClient.on('reaction', handleReaction);
    return () => { signalingClient.off('reaction'); };
  }, [signalingClient]);

  // Prune old reactions every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 3000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!signalingClient) return;
    const now = Date.now();
    if (now - lastReactionTime.current < 500) return; // rate limit
    lastReactionTime.current = now;

    try {
      await signalingClient.send({ type: 'send-reaction', roomId, emoji });
    } catch (err) {
      console.error('Failed to send reaction:', err);
    }
  }, [signalingClient, roomId]);

  return { reactions, sendReaction };
}

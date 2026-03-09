import { useState, useEffect, useCallback } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';

interface UseHandRaiseOptions {
  roomId: string;
  userId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export function useHandRaise({ roomId, userId, role, signalingClient }: UseHandRaiseOptions) {
  const [raisedHands, setRaisedHands] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('hand-raised', (msg: any) => {
      setRaisedHands(prev => new Map(prev).set(msg.userId, msg.userName));
    });
    signalingClient.on('hand-lowered', (msg: any) => {
      setRaisedHands(prev => { const next = new Map(prev); next.delete(msg.userId); return next; });
    });
    signalingClient.on('all-hands-lowered', () => {
      setRaisedHands(new Map());
    });

    return () => {
      signalingClient.off('hand-raised');
      signalingClient.off('hand-lowered');
      signalingClient.off('all-hands-lowered');
    };
  }, [signalingClient]);

  const raiseHand = useCallback(async () => {
    if (!signalingClient) return;
    await signalingClient.send({ type: 'raise-hand', roomId });
  }, [signalingClient, roomId]);

  const lowerHand = useCallback(async (targetUserId?: string) => {
    if (!signalingClient) return;
    await signalingClient.send({ type: 'lower-hand', roomId, targetUserId: targetUserId || userId });
  }, [signalingClient, roomId, userId]);

  const lowerAllHands = useCallback(async () => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'lower-all-hands', roomId });
  }, [signalingClient, roomId, role]);

  const isHandRaised = raisedHands.has(userId);

  return { raisedHands, isHandRaised, raiseHand, lowerHand, lowerAllHands };
}

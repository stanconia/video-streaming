import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';

interface UseWhiteboardOptions {
  roomId: string;
  userId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export function useWhiteboard({ roomId, userId, role, signalingClient }: UseWhiteboardOptions) {
  const [isActive, setIsActive] = useState(false);
  const [drawPermissions, setDrawPermissions] = useState<Set<string>>(new Set());
  const [incomingSnapshot, setIncomingSnapshot] = useState<any>(null);

  // Ref-based callback for real-time drawing — bypasses React state to avoid losing
  // rapid updates during batching. The WhiteboardPanel registers its draw function here.
  const remoteDrawRef = useRef<((changes: any) => void) | null>(null);

  const setRemoteDrawCallback = useCallback((cb: ((changes: any) => void) | null) => {
    remoteDrawRef.current = cb;
  }, []);

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('whiteboard-toggled', (msg: any) => {
      setIsActive(msg.active);
      if (!msg.active) setDrawPermissions(new Set());
    });

    signalingClient.on('whiteboard-update', (msg: any) => {
      // Call the draw callback directly — no React state involved
      if (remoteDrawRef.current) {
        remoteDrawRef.current(msg.changes);
      }
    });

    signalingClient.on('whiteboard-draw-permission', (msg: any) => {
      setDrawPermissions(prev => {
        const next = new Set(prev);
        if (msg.granted) next.add(msg.targetUserId);
        else next.delete(msg.targetUserId);
        return next;
      });
    });

    signalingClient.on('whiteboard-snapshot', (msg: any) => {
      setIncomingSnapshot(msg.snapshot);
    });

    return () => {
      signalingClient.off('whiteboard-toggled');
      signalingClient.off('whiteboard-update');
      signalingClient.off('whiteboard-draw-permission');
      signalingClient.off('whiteboard-snapshot');
    };
  }, [signalingClient]);

  const canDraw = role === 'broadcaster' || drawPermissions.has(userId);

  const toggleWhiteboard = useCallback(async (active: boolean) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'whiteboard-toggle', roomId, active });
  }, [signalingClient, roomId, role]);

  // Fire-and-forget for high-frequency drawing updates
  const sendUpdate = useCallback((changes: any) => {
    if (!signalingClient) return;
    signalingClient.sendNoAck({ type: 'whiteboard-update', roomId, changes });
  }, [signalingClient, roomId]);

  const grantDraw = useCallback(async (targetUserId: string) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'whiteboard-grant-draw', roomId, targetUserId });
  }, [signalingClient, roomId, role]);

  const revokeDraw = useCallback(async (targetUserId: string) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'whiteboard-revoke-draw', roomId, targetUserId });
  }, [signalingClient, roomId, role]);

  const sendSnapshot = useCallback(async (snapshot: any) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'whiteboard-snapshot', roomId, snapshot });
  }, [signalingClient, roomId, role]);

  return {
    isActive, canDraw, drawPermissions, toggleWhiteboard,
    sendUpdate, grantDraw, revokeDraw, sendSnapshot,
    setRemoteDrawCallback,
    incomingSnapshot, setIncomingSnapshot,
  };
}

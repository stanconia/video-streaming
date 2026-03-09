import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';

interface UseBreakoutRoomsOptions {
  roomId: string;
  userId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export interface BreakoutRoom {
  id: string;
  name: string;
}

export function useBreakoutRooms({ roomId, userId, role, signalingClient }: UseBreakoutRoomsOptions) {
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isBreakoutActive, setIsBreakoutActive] = useState(false);
  const [currentBreakoutRoom, setCurrentBreakoutRoom] = useState<BreakoutRoom | null>(null);
  const [assignment, setAssignment] = useState<BreakoutRoom | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('breakout-rooms-created', (msg: any) => {
      setBreakoutRooms(msg.rooms);
      setIsBreakoutActive(true);
      if (msg.durationMinutes) {
        setDurationMinutes(msg.durationMinutes);
        setRemainingSeconds(msg.durationMinutes * 60);
        timerRef.current = setInterval(() => {
          setRemainingSeconds(prev => prev !== null && prev > 0 ? prev - 1 : 0);
        }, 1000);
      }
    });

    signalingClient.on('breakout-assigned', (msg: any) => {
      setAssignment({ id: msg.breakoutRoomId, name: msg.breakoutRoomName });
    });

    signalingClient.on('breakout-rooms-ended', () => {
      setBreakoutRooms([]);
      setIsBreakoutActive(false);
      setCurrentBreakoutRoom(null);
      setAssignment(null);
      setDurationMinutes(null);
      setRemainingSeconds(null);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    });

    return () => {
      signalingClient.off('breakout-rooms-created');
      signalingClient.off('breakout-assigned');
      signalingClient.off('breakout-rooms-ended');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [signalingClient]);

  const createBreakoutRooms = useCallback(async (roomNames: string[], duration?: number) => {
    if (!signalingClient || role !== 'broadcaster') return;
    const msg: any = { type: 'create-breakout-rooms', roomId, roomNames };
    if (duration) msg.durationMinutes = duration;
    await signalingClient.send(msg);
  }, [signalingClient, roomId, role]);

  const assignParticipants = useCallback(async (assignments: Record<string, string>) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'assign-breakout', roomId, assignments });
  }, [signalingClient, roomId, role]);

  const joinBreakout = useCallback(async () => {
    if (!signalingClient || !assignment) return;
    await signalingClient.send({ type: 'join-breakout', roomId, breakoutRoomId: assignment.id });
    setCurrentBreakoutRoom(assignment);
  }, [signalingClient, roomId, assignment]);

  const leaveBreakout = useCallback(async () => {
    if (!signalingClient) return;
    await signalingClient.send({ type: 'leave-breakout', roomId });
    setCurrentBreakoutRoom(null);
  }, [signalingClient, roomId]);

  const endBreakoutRooms = useCallback(async () => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'end-breakout-rooms', roomId });
  }, [signalingClient, roomId, role]);

  return {
    breakoutRooms, isBreakoutActive, currentBreakoutRoom, assignment,
    durationMinutes, remainingSeconds,
    createBreakoutRooms, assignParticipants, joinBreakout, leaveBreakout, endBreakoutRooms,
  };
}

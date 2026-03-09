import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';

interface UseTimerOptions {
  roomId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export function useTimer({ roomId, role, signalingClient }: UseTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearCountdown = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const startCountdown = (seconds: number) => {
    clearCountdown();
    setRemainingSeconds(seconds);
    setIsRunning(true);
    setIsPaused(false);
    setIsExpired(false);
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearCountdown();
          setIsRunning(false);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('timer-started', (msg: any) => {
      startCountdown(msg.durationSeconds);
    });
    signalingClient.on('timer-paused', (msg: any) => {
      clearCountdown();
      setRemainingSeconds(msg.remainingSeconds);
      setIsRunning(false);
      setIsPaused(true);
    });
    signalingClient.on('timer-resumed', (msg: any) => {
      startCountdown(msg.remainingSeconds);
    });
    signalingClient.on('timer-reset', () => {
      clearCountdown();
      setRemainingSeconds(0);
      setIsRunning(false);
      setIsPaused(false);
      setIsExpired(false);
    });

    return () => {
      signalingClient.off('timer-started');
      signalingClient.off('timer-paused');
      signalingClient.off('timer-resumed');
      signalingClient.off('timer-reset');
      clearCountdown();
    };
  }, [signalingClient]);

  const startTimer = useCallback(async (durationSeconds: number) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'start-timer', roomId, durationSeconds });
  }, [signalingClient, roomId, role]);

  const pauseTimer = useCallback(async () => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'pause-timer', roomId });
  }, [signalingClient, roomId, role]);

  const resumeTimer = useCallback(async () => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'resume-timer', roomId });
  }, [signalingClient, roomId, role]);

  const resetTimer = useCallback(async () => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'reset-timer', roomId });
  }, [signalingClient, roomId, role]);

  return { remainingSeconds, isRunning, isPaused, isExpired, startTimer, pauseTimer, resumeTimer, resetTimer };
}

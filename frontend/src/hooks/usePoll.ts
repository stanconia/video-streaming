import { useState, useEffect, useCallback } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';

interface UsePollOptions {
  roomId: string;
  userId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export interface PollState {
  pollId: string;
  question: string;
  options: string[];
  votes: Record<number, number>;
  totalVotes: number;
  isActive: boolean;
  hasVoted: boolean;
  myVote: number | null;
}

export function usePoll({ roomId, userId, role, signalingClient }: UsePollOptions) {
  const [currentPoll, setCurrentPoll] = useState<PollState | null>(null);
  const [pollHistory, setPollHistory] = useState<PollState[]>([]);

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('poll-created', (msg: any) => {
      const votes: Record<number, number> = {};
      msg.options.forEach((_: string, i: number) => { votes[i] = 0; });
      setCurrentPoll({
        pollId: msg.pollId,
        question: msg.question,
        options: msg.options,
        votes,
        totalVotes: 0,
        isActive: true,
        hasVoted: false,
        myVote: null,
      });
    });

    signalingClient.on('poll-updated', (msg: any) => {
      setCurrentPoll(prev => prev && prev.pollId === msg.pollId
        ? { ...prev, votes: msg.votes, totalVotes: msg.totalVotes }
        : prev);
    });

    signalingClient.on('poll-ended', (msg: any) => {
      setCurrentPoll(prev => {
        if (prev && prev.pollId === msg.pollId) {
          const ended = { ...prev, isActive: false, votes: msg.finalResults.votes, totalVotes: msg.finalResults.totalVotes };
          setPollHistory(h => [...h, ended]);
          return ended;
        }
        return prev;
      });
    });

    return () => {
      signalingClient.off('poll-created');
      signalingClient.off('poll-updated');
      signalingClient.off('poll-ended');
    };
  }, [signalingClient]);

  const createPoll = useCallback(async (question: string, options: string[]) => {
    if (!signalingClient || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'create-poll', roomId, question, options });
  }, [signalingClient, roomId, role]);

  const submitVote = useCallback(async (optionIndex: number) => {
    if (!signalingClient || !currentPoll) return;
    await signalingClient.send({ type: 'submit-vote', roomId, pollId: currentPoll.pollId, optionIndex });
    setCurrentPoll(prev => prev ? { ...prev, hasVoted: true, myVote: optionIndex } : prev);
  }, [signalingClient, roomId, currentPoll]);

  const endPoll = useCallback(async () => {
    if (!signalingClient || !currentPoll || role !== 'broadcaster') return;
    await signalingClient.send({ type: 'end-poll', roomId, pollId: currentPoll.pollId });
  }, [signalingClient, roomId, currentPoll, role]);

  return { currentPoll, pollHistory, createPoll, submitVote, endPoll };
}

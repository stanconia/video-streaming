import { Router } from 'mediasoup/node/lib/types';
import { RecordingSession, RecordingResult } from './RecordingSession';
import { MediasoupRoom } from '../mediasoup/Room';

export class RecordingManager {
  private activeSessions: Map<string, RecordingSession> = new Map(); // roomId -> session

  async startRecording(
    roomId: string,
    recordingId: string,
    room: MediasoupRoom,
    router: Router
  ): Promise<{ success: boolean; error?: string }> {
    if (this.activeSessions.has(roomId)) {
      return { success: false, error: 'Room is already being recorded' };
    }

    // Find the broadcaster's audio and video producers (camera source only)
    const producersInfo = room.getProducersWithUserInfo();
    const broadcasterProducers = producersInfo.filter(
      (p) => p.role === 'broadcaster' && p.source === 'camera'
    );

    const audioProducerInfo = broadcasterProducers.find((p) => p.kind === 'audio');
    const videoProducerInfo = broadcasterProducers.find((p) => p.kind === 'video');

    if (!audioProducerInfo || !videoProducerInfo) {
      return {
        success: false,
        error: 'Broadcaster audio or video producer not found. Ensure the broadcaster is streaming.',
      };
    }

    const audioProducer = room.getProducerById(audioProducerInfo.producerId);
    const videoProducer = room.getProducerById(videoProducerInfo.producerId);

    if (!audioProducer || !videoProducer) {
      return { success: false, error: 'Could not retrieve producer objects' };
    }

    const session = new RecordingSession({
      roomId,
      recordingId,
      router,
      audioProducer,
      videoProducer,
    });

    try {
      await session.start();
      this.activeSessions.set(roomId, session);
      return { success: true };
    } catch (err: any) {
      console.error(`Failed to start recording for room ${roomId}:`, err);
      return { success: false, error: err.message };
    }
  }

  async stopRecording(
    roomId: string
  ): Promise<{ success: boolean; result?: RecordingResult; error?: string }> {
    const session = this.activeSessions.get(roomId);
    if (!session) {
      return { success: false, error: 'No active recording for this room' };
    }

    try {
      const result = await session.stop();
      this.activeSessions.delete(roomId);
      return { success: true, result };
    } catch (err: any) {
      console.error(`Failed to stop recording for room ${roomId}:`, err);
      this.activeSessions.delete(roomId);
      return { success: false, error: err.message };
    }
  }

  isRecording(roomId: string): boolean {
    return this.activeSessions.has(roomId);
  }

  getRecordingState(roomId: string): string {
    const session = this.activeSessions.get(roomId);
    return session?.getState() || 'none';
  }

  async stopAll(): Promise<void> {
    for (const [roomId, session] of this.activeSessions) {
      try {
        await session.stop();
      } catch (err) {
        console.error(`Error stopping recording for room ${roomId}:`, err);
        await session.cleanup();
      }
    }
    this.activeSessions.clear();
  }
}

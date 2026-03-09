export interface Recording {
  id: string;
  roomId: string;
  roomName: string;
  startedByUserId: string;
  status: 'STARTING' | 'RECORDING' | 'STOPPING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  durationMs?: number;
  fileSizeBytes?: number;
  playbackUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StartRecordingRequest {
  roomId: string;
  userId: string;
}

export interface StopRecordingRequest {
  roomId: string;
  userId: string;
}

import { useState, useEffect, useCallback } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';
import { fileApi } from '../services/api/shared/FileApi';

interface UseFileSharingOptions {
  roomId: string;
  userId: string;
  role: 'broadcaster' | 'viewer';
  signalingClient: SignalingClient | null;
}

export interface SharedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  sharedBy: string;
  timestamp: Date;
}

export function useFileSharing({ roomId, userId, role, signalingClient }: UseFileSharingOptions) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signalingClient) return;

    signalingClient.on('file-shared', (msg: any) => {
      setFiles(prev => [...prev, {
        fileId: msg.fileId,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileType: msg.fileType,
        downloadUrl: msg.downloadUrl,
        sharedBy: msg.sharedBy,
        timestamp: new Date(msg.timestamp),
      }]);
    });

    return () => { signalingClient.off('file-shared'); };
  }, [signalingClient]);

  const uploadAndShare = useCallback(async (file: File) => {
    if (!signalingClient) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await fileApi.uploadFile(file, roomId, userId);
      await signalingClient.send({
        type: 'share-file',
        roomId,
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: result.fileType,
        downloadUrl: result.downloadUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [signalingClient, roomId, userId]);

  return { files, uploadAndShare, isUploading, error };
}

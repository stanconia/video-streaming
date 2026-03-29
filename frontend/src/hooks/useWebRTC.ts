import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';
import { WebRTCClient } from '../services/webrtc/WebRTCClient';
import { mediaDevicesService } from '../services/webrtc/MediaDevices';
import { RemoteParticipant } from '../components/Video/VideoGrid';

interface UseWebRTCOptions {
  roomId: string;
  role: 'broadcaster' | 'viewer';
  userId: string;
  displayName?: string;
}

interface ActiveScreenShare {
  userId: string;
  stream: MediaStream;
}

interface ScreenShareRequest {
  userId: string;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, RemoteParticipant>;
  isConnected: boolean;
  error: string | null;
  isLocalMuted: boolean;
  isVideoOff: boolean;
  startMedia: () => Promise<void>;
  stopMedia: () => void;
  toggleVideo: () => void;
  leave: () => void;
  toggleLocalMute: () => void;
  muteParticipant: (participantId: string) => void;
  signalingClient: SignalingClient | null;
  // Screen share
  activeScreenShare: ActiveScreenShare | null;
  isScreenSharing: boolean;
  screenShareRequest: ScreenShareRequest | null;
  screenSharePermissionStatus: 'none' | 'pending' | 'approved' | 'denied';
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  respondToScreenShareRequest: (approved: boolean) => void;
  forceStopScreenShare: (targetUserId: string) => void;
  // Session ended
  sessionEnded: boolean;
}

export function useWebRTC({ roomId, role, userId, displayName }: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteParticipant>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Screen share state
  const [activeScreenShare, setActiveScreenShare] = useState<ActiveScreenShare | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareRequest, setScreenShareRequest] = useState<ScreenShareRequest | null>(null);
  const [screenSharePermissionStatus, setScreenSharePermissionStatus] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [sessionEnded, setSessionEnded] = useState(false);

  const signalingClientRef = useRef<SignalingClient | null>(null);
  const webrtcClientRef = useRef<WebRTCClient | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isProducingRef = useRef<boolean>(false);
  const screenShareProducerIdRef = useRef<string | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const screenShareRequestRef = useRef<ScreenShareRequest | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    screenShareRequestRef.current = screenShareRequest;
  }, [screenShareRequest]);

  // Internal: start screen sharing (after permission granted or host initiating directly)
  const startScreenShareInternal = useCallback(async () => {
    try {
      if (!webrtcClientRef.current || !signalingClientRef.current) {
        throw new Error('WebRTC client not initialized');
      }

      // Call getDisplayMedia FIRST — must be in user gesture context (before any await)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      // Now set up transport (async is OK after getDisplayMedia succeeds)
      await webrtcClientRef.current.createSendTransport();
      const screenTrack = screenStream.getVideoTracks()[0];

      // Handle browser's native "Stop sharing" button
      screenTrack.onended = () => {
        console.log('Screen share track ended (browser stop)');
        stopScreenShareInternal();
      };

      screenShareStreamRef.current = screenStream;
      const producer = await webrtcClientRef.current.produce(screenTrack, 'screen');
      screenShareProducerIdRef.current = producer.id;

      setIsScreenSharing(true);
      setActiveScreenShare({ userId, stream: screenStream });

      // Notify other participants
      await signalingClientRef.current.send({
        type: 'screen-share-status-update',
        roomId,
        userId,
        active: true,
      });

      console.log('Screen sharing started');
    } catch (err: any) {
      console.error('Error starting screen share:', err);
      setScreenSharePermissionStatus('none');
      // User cancelled the screen picker - not an error
      if (err.name !== 'NotAllowedError') {
        setError(`Failed to start screen share: ${err.message}`);
      }
    }
  }, [roomId, userId]);

  const stopScreenShareInternal = useCallback(async () => {
    // Stop screen share tracks
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(t => t.stop());
      screenShareStreamRef.current = null;
    }

    // Close the screen share producer
    if (screenShareProducerIdRef.current && webrtcClientRef.current) {
      webrtcClientRef.current.closeProducer(screenShareProducerIdRef.current);
      screenShareProducerIdRef.current = null;
    }

    setIsScreenSharing(false);
    setActiveScreenShare(null);
    setScreenSharePermissionStatus('none');

    // Notify other participants
    if (signalingClientRef.current) {
      try {
        await signalingClientRef.current.send({
          type: 'screen-share-status-update',
          roomId,
          userId,
          active: false,
        });
      } catch (err) {
        console.error('Error sending screen share status update:', err);
      }
    }

    console.log('Screen sharing stopped');
  }, [roomId, userId]);

  const initializeClients = useCallback(async () => {
    // If already initializing or initialized, return existing promise
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const initPromise = (async () => {
      try {
        // Initialize signaling client with auth token
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/signaling`;
        const token = localStorage.getItem('edulive_token') || undefined;
        const signalingClient = new SignalingClient(wsUrl, token);
        await signalingClient.connect();
        signalingClientRef.current = signalingClient;

        // Join room
        const joinResponse = await signalingClient.send({
          type: 'join-room',
          roomId,
          role,
          userId,
          displayName,
        });

        console.log('Join response:', joinResponse);

        // Initialize WebRTC client
        const webrtcClient = new WebRTCClient(signalingClient, roomId, userId, role);
        await webrtcClient.initialize();
        webrtcClientRef.current = webrtcClient;

        // If there are existing producers, consume them
        if (joinResponse.existingProducers && joinResponse.existingProducers.length > 0) {
          console.log('Found existing producers:', joinResponse.existingProducers);

          await webrtcClient.createRecvTransport();

          // Consume each producer
          for (const producer of joinResponse.existingProducers) {
            try {
              const participantId = producer.userId || producer.producerId;
              const producerSource = producer.source || 'camera';

              await webrtcClient.consume(producer.producerId, (track) => {
                console.log('Received remote track from existing producer:', track.kind, 'source:', producerSource);

                // Route screen share producers to activeScreenShare state
                if (producerSource === 'screen') {
                  const screenStream = new MediaStream([track]);
                  setActiveScreenShare({ userId: participantId, stream: screenStream });
                  return;
                }

                setRemoteStreams((prev) => {
                  const newStreams = new Map(prev);
                  const existingParticipant = newStreams.get(participantId);

                  // Create new stream, adding existing tracks if any
                  const newStream = new MediaStream();
                  if (existingParticipant?.stream) {
                    existingParticipant.stream.getTracks().forEach(t => newStream.addTrack(t));
                  }
                  newStream.addTrack(track);

                  // Always create a new participant object
                  const newParticipant = {
                    stream: newStream,
                    userId: existingParticipant?.userId || producer.userId || 'Participant',
                    displayName: existingParticipant?.displayName || producer.displayName || producer.userId,
                    role: existingParticipant?.role || producer.role || 'viewer',
                    hasVideo: true,
                    isMuted: existingParticipant?.isMuted || false,
                  };
                  newStreams.set(participantId, newParticipant);

                  console.log('>>> Updated remoteStreams from existing producer, size:', newStreams.size);
                  return newStreams;
                });
              });
            } catch (err: any) {
              console.error('Error consuming existing producer:', err);
            }
          }
        }

        // Listen for video toggle notifications from other participants
        signalingClient.on('participant-video-toggled', (message) => {
          console.log('>>> PARTICIPANT VIDEO TOGGLED:', message);
          const { odrive: odrive, isVideoOff: isVideoOff } = message;

          // Update remote participant's video status
          if (odrive !== userId) {
            setRemoteStreams((prev) => {
              const newStreams = new Map(prev);
              const participant = newStreams.get(odrive);
              if (participant) {
                newStreams.set(odrive, {
                  ...participant,
                  hasVideo: !isVideoOff,
                });
              }
              return newStreams;
            });
          }
        });

        // Listen for self-mute notifications from other participants
        signalingClient.on('participant-self-muted', (message) => {
          console.log('>>> PARTICIPANT SELF MUTED:', message);
          const { userId: odrive, isMuted } = message;

          // Update remote participant's mute status (skip if it's ourselves)
          if (odrive !== userId) {
            setRemoteStreams((prev) => {
              const newStreams = new Map(prev);
              const participant = newStreams.get(odrive);
              if (participant) {
                newStreams.set(odrive, {
                  ...participant,
                  isMuted,
                });
              }
              return newStreams;
            });
          }
        });

        // Listen for mute notifications from broadcaster
        signalingClient.on('participant-muted', (message) => {
          console.log('>>> PARTICIPANT MUTED:', message);
          const { targetUserId, isMuted } = message;

          // If we are the target, mute our local audio
          if (targetUserId === userId) {
            setIsLocalMuted(isMuted);
            // Actually mute/unmute the audio track (use ref to avoid stale closure)
            if (localStreamRef.current) {
              const audioTrack = localStreamRef.current.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = !isMuted;
              }
            }
          } else {
            // Update remote participant's mute status
            setRemoteStreams((prev) => {
              const newStreams = new Map(prev);
              const participant = newStreams.get(targetUserId);
              if (participant) {
                newStreams.set(targetUserId, {
                  ...participant,
                  isMuted,
                });
              }
              return newStreams;
            });
          }
        });

        // Listen for producer closed notifications
        signalingClient.on('producer-closed', (message) => {
          console.log('>>> PRODUCER CLOSED:', message);
          const participantId = message.userId || message.producerId;

          setRemoteStreams((prev) => {
            const newStreams = new Map(prev);
            const participant = newStreams.get(participantId);
            if (participant) {
              // Mark video as off but keep participant visible
              newStreams.set(participantId, {
                ...participant,
                hasVideo: false,
                stream: null,
              });
            }
            return newStreams;
          });
        });

        // Listen for new producers from ANY participant
        signalingClient.on('new-producer', async (message) => {
          console.log('>>> NEW PRODUCER NOTIFICATION received:', JSON.stringify(message));

          // Don't consume our own producers
          if (message.userId === userId) {
            console.log('>>> Skipping own producer (userId match)');
            return;
          }
          console.log('>>> Will consume producer from:', message.userId, 'source:', message.source);

          if (webrtcClientRef.current) {
            try {
              await webrtcClientRef.current.createRecvTransport();

              const participantId = message.userId || message.producerId;
              const producerSource = message.source || 'camera';

              console.log('>>> About to consume producer:', message.producerId);
              await webrtcClientRef.current.consume(message.producerId, (track) => {
                console.log('>>> TRACK RECEIVED in callback! kind:', track.kind, 'id:', track.id, 'source:', producerSource);

                // Route screen share producers to activeScreenShare state
                if (producerSource === 'screen') {
                  const screenStream = new MediaStream([track]);
                  setActiveScreenShare({ userId: participantId, stream: screenStream });
                  return;
                }

                setRemoteStreams((prev) => {
                  console.log('>>> setRemoteStreams called, prev size:', prev.size);
                  const newStreams = new Map(prev);
                  const existingParticipant = newStreams.get(participantId);

                  // Create new stream, adding existing tracks if any
                  const newStream = new MediaStream();
                  if (existingParticipant?.stream) {
                    existingParticipant.stream.getTracks().forEach(t => newStream.addTrack(t));
                  }
                  newStream.addTrack(track);

                  // Always create a new participant object to ensure React detects the change
                  const newParticipant = {
                    stream: newStream,
                    userId: existingParticipant?.userId || message.userId || 'Participant',
                    displayName: existingParticipant?.displayName || message.displayName || message.userId,
                    role: existingParticipant?.role || message.role || 'viewer',
                    hasVideo: true,
                    isMuted: existingParticipant?.isMuted || false,
                  };
                  newStreams.set(participantId, newParticipant);

                  console.log('>>> Updated remoteStreams, size:', newStreams.size, 'participantId:', participantId);
                  return newStreams;
                });
              });
            } catch (err: any) {
              console.error('>>> ERROR consuming producer:', err);
              setError(`Failed to consume stream: ${err.message}`);
            }
          }
        });

        // Screen share notification handlers
        signalingClient.on('screen-share-request-notification', (message) => {
          console.log('>>> SCREEN SHARE REQUEST:', message);
          setScreenShareRequest({ userId: message.userId });
        });

        signalingClient.on('screen-share-permission', async (message) => {
          console.log('>>> SCREEN SHARE PERMISSION:', message);
          if (message.approved) {
            setScreenSharePermissionStatus('approved');
            // Actually start the screen share now
            try {
              await startScreenShareInternal();
            } catch (err) {
              console.error('Error starting screen share after approval:', err);
            }
          } else {
            setScreenSharePermissionStatus('denied');
            // Auto-clear denied status after 3 seconds
            setTimeout(() => setScreenSharePermissionStatus('none'), 3000);
          }
        });

        signalingClient.on('screen-share-status', (message) => {
          console.log('>>> SCREEN SHARE STATUS:', message);
          if (!message.active) {
            setActiveScreenShare(null);
          }
        });

        signalingClient.on('screen-share-stopped', () => {
          console.log('>>> SCREEN SHARE STOPPED (forced by host)');
          stopScreenShareInternal();
        });

        // Listen for session-ended (teacher ended the live session)
        signalingClient.on('session-ended', (message) => {
          console.log('>>> SESSION ENDED:', message);
          setSessionEnded(true);
        });

        setIsConnected(true);
        console.log('WebRTC clients initialized');
      } catch (err: any) {
        console.error('Error initializing clients:', err);
        setError(`Initialization failed: ${err.message}`);
        throw err;
      }
    })();

    initPromiseRef.current = initPromise;
    return initPromise;
  }, [roomId, role, userId, startScreenShareInternal, stopScreenShareInternal]);

  // Start producing media (for all participants)
  const startMedia = useCallback(async () => {
    // Prevent double-calling (React strict mode)
    if (isProducingRef.current || localStreamRef.current) {
      console.log('Already producing, skipping startMedia');
      return;
    }
    isProducingRef.current = true;

    try {
      setError(null);

      // Wait for initialization if not ready yet
      if (!webrtcClientRef.current) {
        await initializeClients();
      }

      if (!webrtcClientRef.current) {
        throw new Error('WebRTC client not initialized');
      }

      // Get user media
      const stream = await mediaDevicesService.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      // Create send transport
      await webrtcClientRef.current.createSendTransport();

      // Produce tracks (camera source)
      for (const track of stream.getTracks()) {
        await webrtcClientRef.current.produce(track, 'camera');
        console.log(`Producing ${track.kind} track`);
      }

      console.log('Media started');
    } catch (err: any) {
      console.error('Error starting media:', err);
      setError(`Failed to start media: ${err.message}`);
      isProducingRef.current = false;
    }
  }, [initializeClients]);

  const stopMedia = useCallback(async () => {
    // Reset producing flag
    isProducingRef.current = false;

    // Notify server to close producers (which will notify other participants)
    if (signalingClientRef.current && webrtcClientRef.current) {
      try {
        await signalingClientRef.current.send({
          type: 'close-producers',
          roomId,
          userId,
        });
      } catch (err) {
        console.error('Error notifying server of producer close:', err);
      }
    }

    if (localStream) {
      mediaDevicesService.stopStream(localStream);
      setLocalStream(null);
    }

    if (webrtcClientRef.current) {
      webrtcClientRef.current.closeProducers();
    }

    console.log('Media stopped');
  }, [localStream, roomId, userId]);

  const leave = useCallback(() => {
    // Stop screen share if active
    if (isScreenSharing) {
      stopScreenShareInternal();
    }

    // If broadcaster, notify all participants that session has ended before leaving
    if (role === 'broadcaster' && signalingClientRef.current) {
      try {
        signalingClientRef.current.sendNoAck({
          type: 'session-ended',
          roomId,
        });
      } catch (err) {
        console.error('Error sending session-ended:', err);
      }
    }

    if (webrtcClientRef.current) {
      webrtcClientRef.current.close();
      webrtcClientRef.current = null;
    }

    if (signalingClientRef.current) {
      signalingClientRef.current.send({
        type: 'leave-room',
        roomId,
      });
      signalingClientRef.current.close();
      signalingClientRef.current = null;
    }

    if (localStream) {
      mediaDevicesService.stopStream(localStream);
      setLocalStream(null);
    }

    setRemoteStreams(new Map());
    setIsConnected(false);
    setActiveScreenShare(null);
    setIsScreenSharing(false);
    setScreenShareRequest(null);
    setScreenSharePermissionStatus('none');

    console.log('Left room');
  }, [roomId, role, localStream, isScreenSharing, stopScreenShareInternal]);

  // Toggle local video on/off
  const toggleVideo = useCallback(async () => {
    console.log('>>> toggleVideo called');
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoOffState = !isVideoOff;
        videoTrack.enabled = !newVideoOffState;
        setIsVideoOff(newVideoOffState);
        console.log(`>>> Local video ${newVideoOffState ? 'off' : 'on'}`);

        // Notify other participants about video status change
        if (signalingClientRef.current) {
          try {
            await signalingClientRef.current.send({
              type: 'video-toggle',
              roomId,
              userId,
              isVideoOff: newVideoOffState,
            });
          } catch (err) {
            console.error('Error sending video-toggle notification:', err);
          }
        }
      }
    }
  }, [isVideoOff, roomId, userId]);

  // Toggle local audio mute
  const toggleLocalMute = useCallback(async () => {
    console.log('>>> toggleLocalMute called, localStreamRef:', localStreamRef.current);
    console.log('>>> isLocalMuted:', isLocalMuted);

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      console.log('>>> audioTrack:', audioTrack);
      if (audioTrack) {
        const newMutedState = !isLocalMuted;
        audioTrack.enabled = !newMutedState;
        setIsLocalMuted(newMutedState);
        console.log(`>>> Local audio ${newMutedState ? 'muted' : 'unmuted'}`);

        // Notify other participants about mute status change
        if (signalingClientRef.current) {
          try {
            await signalingClientRef.current.send({
              type: 'self-mute',
              roomId,
              userId,
              isMuted: newMutedState,
            });
          } catch (err) {
            console.error('Error sending self-mute notification:', err);
          }
        }
      }
    }
  }, [isLocalMuted, roomId, userId]);

  // Mute a remote participant (broadcaster only)
  const muteParticipant = useCallback(async (participantId: string) => {
    if (role !== 'broadcaster') {
      console.warn('Only broadcasters can mute other participants');
      return;
    }

    if (signalingClientRef.current) {
      // Get current mute state
      const participant = remoteStreams.get(participantId);
      const newMutedState = !(participant?.isMuted ?? false);

      try {
        await signalingClientRef.current.send({
          type: 'mute-participant',
          roomId,
          targetUserId: participantId,
          isMuted: newMutedState,
        });

        // Update local state
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          const p = newStreams.get(participantId);
          if (p) {
            newStreams.set(participantId, {
              ...p,
              isMuted: newMutedState,
            });
          }
          return newStreams;
        });

        console.log(`Participant ${participantId} ${newMutedState ? 'muted' : 'unmuted'}`);
      } catch (err) {
        console.error('Error muting participant:', err);
      }
    }
  }, [role, roomId, remoteStreams]);

  // Screen share: public method - host starts directly, viewer requests permission
  const startScreenShare = useCallback(async () => {
    if (role === 'broadcaster') {
      // Host can share directly
      await startScreenShareInternal();
    } else {
      // Viewer must request permission
      if (!signalingClientRef.current) return;
      setScreenSharePermissionStatus('pending');
      try {
        await signalingClientRef.current.send({
          type: 'screen-share-request',
          roomId,
          userId,
        });
      } catch (err) {
        console.error('Error sending screen share request:', err);
        setScreenSharePermissionStatus('none');
      }
    }
  }, [role, roomId, userId, startScreenShareInternal]);

  // Screen share: stop (called by user or forced)
  const stopScreenShare = useCallback(() => {
    stopScreenShareInternal();
  }, [stopScreenShareInternal]);

  // Screen share: host responds to viewer request
  const respondToScreenShareRequest = useCallback(async (approved: boolean) => {
    const request = screenShareRequestRef.current;
    if (!request || !signalingClientRef.current) return;

    try {
      await signalingClientRef.current.send({
        type: 'screen-share-response',
        roomId,
        targetUserId: request.userId,
        approved,
      });
    } catch (err) {
      console.error('Error sending screen share response:', err);
    }

    setScreenShareRequest(null);
  }, [roomId]);

  // Screen share: host force-stops a viewer's share
  const forceStopScreenShare = useCallback(async (targetUserId: string) => {
    if (role !== 'broadcaster' || !signalingClientRef.current) return;

    try {
      await signalingClientRef.current.send({
        type: 'stop-screen-share',
        roomId,
        targetUserId,
      });
    } catch (err) {
      console.error('Error sending force stop screen share:', err);
    }

    // Also clear local screen share state since the share is ending
    setActiveScreenShare(null);
  }, [role, roomId]);

  // Initialize clients on mount (so we can receive notifications even before starting media)
  useEffect(() => {
    initializeClients().catch((err) => {
      console.error('Failed to initialize on mount:', err);
    });
  }, [initializeClients]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop screen share
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach(t => t.stop());
      }

      if (webrtcClientRef.current) {
        webrtcClientRef.current.close();
      }

      if (signalingClientRef.current) {
        signalingClientRef.current.send({
          type: 'leave-room',
          roomId,
        });
        signalingClientRef.current.close();
      }

      if (localStream) {
        mediaDevicesService.stopStream(localStream);
      }
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    isConnected,
    error,
    isLocalMuted,
    isVideoOff,
    startMedia,
    stopMedia,
    toggleVideo,
    leave,
    toggleLocalMute,
    muteParticipant,
    signalingClient: signalingClientRef.current,
    // Screen share
    activeScreenShare,
    isScreenSharing,
    screenShareRequest,
    screenSharePermissionStatus,
    startScreenShare,
    stopScreenShare,
    respondToScreenShareRequest,
    forceStopScreenShare,
    // Session ended
    sessionEnded,
  };
}

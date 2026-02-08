import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalingClient } from '../services/signaling/SignalingClient';
import { WebRTCClient } from '../services/webrtc/WebRTCClient';
import { mediaDevicesService } from '../services/webrtc/MediaDevices';
import { RemoteParticipant } from '../components/Video/VideoGrid';

interface UseWebRTCOptions {
  roomId: string;
  role: 'broadcaster' | 'viewer';
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
}

export function useWebRTC({ roomId, role, userId }: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteParticipant>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const signalingClientRef = useRef<SignalingClient | null>(null);
  const webrtcClientRef = useRef<WebRTCClient | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isProducingRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const initializeClients = useCallback(async () => {
    // If already initializing or initialized, return existing promise
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const initPromise = (async () => {
      try {
        // Initialize signaling client
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/signaling`;
        const signalingClient = new SignalingClient(wsUrl);
        await signalingClient.connect();
        signalingClientRef.current = signalingClient;

        // Join room
        const joinResponse = await signalingClient.send({
          type: 'join-room',
          roomId,
          role,
          userId,
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
              // Use userId as the key for grouping streams by participant
              const participantId = producer.userId || producer.producerId;

              await webrtcClient.consume(producer.producerId, (track) => {
                console.log('Received remote track from existing producer:', track.kind);

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
          console.log('>>> Will consume producer from:', message.userId);

          if (webrtcClientRef.current) {
            try {
              await webrtcClientRef.current.createRecvTransport();

              const participantId = message.userId || message.producerId;

              console.log('>>> About to consume producer:', message.producerId);
              await webrtcClientRef.current.consume(message.producerId, (track) => {
                console.log('>>> TRACK RECEIVED in callback! kind:', track.kind, 'id:', track.id);

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
                    role: existingParticipant?.role || message.role || 'viewer',
                    hasVideo: true,
                    isMuted: existingParticipant?.isMuted || false,
                  };
                  newStreams.set(participantId, newParticipant);

                  console.log('>>> Updated remoteStreams, size:', newStreams.size, 'participantId:', participantId);
                  console.log('>>> New participant:', JSON.stringify({
                    userId: newParticipant.userId,
                    role: newParticipant.role,
                    hasVideo: newParticipant.hasVideo,
                    streamTracks: newStream.getTracks().length
                  }));
                  return newStreams;
                });
              });
            } catch (err: any) {
              console.error('>>> ERROR consuming producer:', err);
              setError(`Failed to consume stream: ${err.message}`);
            }
          }
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
  }, [roomId, role, userId]);

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

      // Produce tracks
      for (const track of stream.getTracks()) {
        await webrtcClientRef.current.produce(track);
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

    console.log('Left room');
  }, [roomId, localStream]);

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

  // Initialize clients on mount (so we can receive notifications even before starting media)
  useEffect(() => {
    initializeClients().catch((err) => {
      console.error('Failed to initialize on mount:', err);
    });
  }, [initializeClients]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  };
}

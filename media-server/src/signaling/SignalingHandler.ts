import { MediasoupManager } from '../mediasoup/MediasoupManager';
import { MediasoupRoom } from '../mediasoup/Room';

export class SignalingHandler {
  private mediasoupManager: MediasoupManager;
  private rooms: Map<string, MediasoupRoom> = new Map();
  private participantRooms: Map<string, string> = new Map(); // sessionId -> roomId

  constructor(mediasoupManager: MediasoupManager) {
    this.mediasoupManager = mediasoupManager;
  }

  async handleMessage(message: any, sessionId: string): Promise<any> {
    try {
      console.log(`Handling message type: ${message.type} from session: ${sessionId}`);

      switch (message.type) {
        case 'join-room':
          return await this.handleJoinRoom(message, sessionId);

        case 'get-router-capabilities':
          return this.handleGetRouterCapabilities(message);

        case 'create-transport':
          return await this.handleCreateTransport(message);

        case 'connect-transport':
          return await this.handleConnectTransport(message);

        case 'produce':
          return await this.handleProduce(message, sessionId);

        case 'consume':
          return await this.handleConsume(message);

        case 'resume-consumer':
          return await this.handleResumeConsumer(message);

        case 'leave-room':
          return this.handleLeaveRoom(message, sessionId);

        case 'close-producers':
          return this.handleCloseProducers(message, sessionId);

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error: any) {
      console.error(`Error handling message: ${error.message}`);
      return {
        type: 'error',
        message: error.message,
        requestId: message.requestId,
      };
    }
  }

  private async handleJoinRoom(message: any, sessionId: string): Promise<any> {
    const { roomId, userId, role } = message;

    let room = this.rooms.get(roomId);
    if (!room) {
      // Create router for new room
      const router = await this.mediasoupManager.createRouter(roomId);
      room = new MediasoupRoom(router);
      this.rooms.set(roomId, room);
    }

    // Store participant info for later use
    room.addParticipant(sessionId, userId, role);
    this.participantRooms.set(sessionId, roomId);

    // Get existing producers with user info
    const existingProducers = room.getProducersWithUserInfo();

    return {
      type: 'room-joined',
      roomId,
      existingProducers, // Include existing producers with user info
      requestId: message.requestId,
    };
  }

  private handleGetRouterCapabilities(message: any): any {
    const { roomId } = message;
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    return {
      type: 'router-capabilities',
      capabilities: room.getRtpCapabilities(),
      requestId: message.requestId,
    };
  }

  private async handleCreateTransport(message: any): Promise<any> {
    const { roomId } = message;
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    const transport = await room.createWebRtcTransport();

    return {
      type: 'transport-created',
      transportId: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      requestId: message.requestId,
    };
  }

  private async handleConnectTransport(message: any): Promise<any> {
    const { transportId, dtlsParameters, roomId } = message;

    // Find room containing this transport
    const room = roomId ? this.rooms.get(roomId) : this.findRoomWithTransport(transportId);

    if (!room) {
      throw new Error(`Room not found for transport: ${transportId}`);
    }

    await room.connectTransport(transportId, dtlsParameters);

    return {
      type: 'transport-connected',
      transportId,
      requestId: message.requestId,
    };
  }

  private async handleProduce(message: any, sessionId: string): Promise<any> {
    const { transportId, kind, rtpParameters, roomId, userId, role } = message;

    const room = roomId ? this.rooms.get(roomId) : this.rooms.get(this.participantRooms.get(sessionId)!);

    if (!room) {
      throw new Error(`Room not found`);
    }

    const producer = await room.createProducer(transportId, kind, rtpParameters, sessionId);

    // Notify other participants about new producer (include userId for identification)
    const notification = {
      type: 'new-producer',
      producerId: producer.id,
      kind: producer.kind,
      userId: userId || sessionId,
      role: role || 'viewer',
    };

    return {
      type: 'producer-created',
      producerId: producer.id,
      kind: producer.kind,
      requestId: message.requestId,
      notification, // Include notification for broadcasting
    };
  }

  private async handleConsume(message: any): Promise<any> {
    const { transportId, producerId, rtpCapabilities, roomId } = message;

    const room = roomId ? this.rooms.get(roomId) : this.findRoomWithProducer(producerId);

    if (!room) {
      throw new Error(`Room not found for producer: ${producerId}`);
    }

    const consumer = await room.createConsumer(transportId, producerId, rtpCapabilities);

    return {
      type: 'consumer-created',
      consumerId: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      requestId: message.requestId,
    };
  }

  private async handleResumeConsumer(message: any): Promise<any> {
    const { consumerId, roomId } = message;

    const room = roomId ? this.rooms.get(roomId) : this.findRoomWithConsumer(consumerId);

    if (!room) {
      throw new Error(`Room not found for consumer: ${consumerId}`);
    }

    await room.resumeConsumer(consumerId);

    return {
      type: 'consumer-resumed',
      consumerId,
      requestId: message.requestId,
    };
  }

  private handleCloseProducers(message: any, sessionId: string): any {
    const { roomId, userId } = message;

    const room = roomId ? this.rooms.get(roomId) : this.rooms.get(this.participantRooms.get(sessionId)!);

    if (room) {
      // Close all producers for this session
      room.closeProducersBySession(sessionId);
    }

    // Notification to broadcast to other participants
    const notification = {
      type: 'producer-closed',
      userId: userId || sessionId,
    };

    return {
      type: 'producers-closed',
      requestId: message.requestId,
      notification,
    };
  }

  private handleLeaveRoom(message: any, sessionId: string): any {
    const roomId = message.roomId || this.participantRooms.get(sessionId);

    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.removeParticipant(sessionId);

        // If room is empty, clean it up
        // (In production, you might want a grace period)
        // For now, we'll keep the room alive until explicitly deleted
      }

      this.participantRooms.delete(sessionId);
    }

    return {
      type: 'left-room',
      roomId,
      requestId: message.requestId,
    };
  }

  private findRoomWithTransport(transportId: string): MediasoupRoom | undefined {
    // This is a simplified search; in production, maintain a transport->room map
    for (const room of this.rooms.values()) {
      // Check if room has this transport (would need to expose transports in Room)
      // For now, return the first room found
      return room;
    }
    return undefined;
  }

  private findRoomWithProducer(producerId: string): MediasoupRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.getProducerById(producerId)) {
        return room;
      }
    }
    return undefined;
  }

  private findRoomWithConsumer(consumerId: string): MediasoupRoom | undefined {
    // Similar to findRoomWithProducer, would need consumer lookup
    // For simplicity, return first room
    return this.rooms.values().next().value;
  }

  close(): void {
    this.rooms.forEach((room) => room.close());
    this.rooms.clear();
    this.participantRooms.clear();
  }
}

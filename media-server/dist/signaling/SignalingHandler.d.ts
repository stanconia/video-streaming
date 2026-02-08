import { MediasoupManager } from '../mediasoup/MediasoupManager';
export declare class SignalingHandler {
    private mediasoupManager;
    private rooms;
    private participantRooms;
    constructor(mediasoupManager: MediasoupManager);
    handleMessage(message: any, sessionId: string): Promise<any>;
    private handleJoinRoom;
    private handleGetRouterCapabilities;
    private handleCreateTransport;
    private handleConnectTransport;
    private handleProduce;
    private handleConsume;
    private handleResumeConsumer;
    private handleCloseProducers;
    private handleLeaveRoom;
    private findRoomWithTransport;
    private findRoomWithProducer;
    private findRoomWithConsumer;
    close(): void;
}
//# sourceMappingURL=SignalingHandler.d.ts.map
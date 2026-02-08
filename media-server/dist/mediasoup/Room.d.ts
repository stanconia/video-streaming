import { Router, WebRtcTransport, Producer, Consumer, RtpCapabilities, DtlsParameters } from 'mediasoup/node/lib/types';
export declare class MediasoupRoom {
    private router;
    private transports;
    private producers;
    private consumers;
    private participants;
    private producerOwners;
    constructor(router: Router);
    getRtpCapabilities(): RtpCapabilities;
    createWebRtcTransport(): Promise<WebRtcTransport>;
    connectTransport(transportId: string, dtlsParameters: DtlsParameters): Promise<void>;
    createProducer(transportId: string, kind: 'audio' | 'video', rtpParameters: any, sessionId?: string): Promise<Producer>;
    createConsumer(transportId: string, producerId: string, rtpCapabilities: RtpCapabilities): Promise<Consumer>;
    resumeConsumer(consumerId: string): Promise<void>;
    addParticipant(sessionId: string, userId?: string, role?: string): void;
    removeParticipant(sessionId: string): void;
    getProducers(): Producer[];
    getProducersWithUserInfo(): Array<{
        producerId: string;
        kind: string;
        userId: string;
        role: string;
    }>;
    getProducerById(producerId: string): Producer | undefined;
    closeProducer(producerId: string): void;
    closeProducersBySession(sessionId: string): void;
    close(): void;
}
//# sourceMappingURL=Room.d.ts.map
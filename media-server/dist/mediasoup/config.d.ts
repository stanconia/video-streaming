import { RtpCodecCapability, TransportListenInfo, WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';
export declare const config: {
    worker: {
        logLevel: WorkerLogLevel;
        logTags: WorkerLogTag[];
        rtcMinPort: number;
        rtcMaxPort: number;
    };
    webRtcTransport: {
        listenIps: TransportListenInfo[];
        initialAvailableOutgoingBitrate: number;
        minimumAvailableOutgoingBitrate: number;
        maxSctpMessageSize: number;
        maxIncomingBitrate: number;
    };
    setAnnouncedIp(ip: string): void;
    routerCodecs: RtpCodecCapability[];
};
//# sourceMappingURL=config.d.ts.map
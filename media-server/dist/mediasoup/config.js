"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    // Worker settings
    worker: {
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
        ],
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
    },
    // WebRTC transport settings
    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1',
            },
        ],
        initialAvailableOutgoingBitrate: 1000000,
        minimumAvailableOutgoingBitrate: 600000,
        maxSctpMessageSize: 262144,
        maxIncomingBitrate: 1500000,
    },
    setAnnouncedIp(ip) {
        exports.config.webRtcTransport.listenIps[0].announcedIp = ip;
        console.log(`Announced IP set to: ${ip}`);
    },
    // Router media codecs
    routerCodecs: [
        {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
        },
        {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
            parameters: {
                'x-google-start-bitrate': 1000,
            },
        },
        {
            kind: 'video',
            mimeType: 'video/H264',
            clockRate: 90000,
            parameters: {
                'packetization-mode': 1,
                'profile-level-id': '42e01f',
                'level-asymmetry-allowed': 1,
                'x-google-start-bitrate': 1000,
            },
        },
    ],
};
//# sourceMappingURL=config.js.map
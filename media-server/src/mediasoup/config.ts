import { RtpCodecCapability, TransportListenInfo, WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';
import * as os from 'os';

export const config = {
  // Worker settings
  worker: {
    logLevel: 'warn' as WorkerLogLevel,
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ] as WorkerLogTag[],
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
    ] as TransportListenInfo[],
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
    maxIncomingBitrate: 1500000,
  },

  setAnnouncedIp(ip: string): void {
    config.webRtcTransport.listenIps[0].announcedIp = ip;
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
  ] as RtpCodecCapability[],
};

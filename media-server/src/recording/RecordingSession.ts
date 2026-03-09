import { Router, PlainTransport, Consumer, Producer } from 'mediasoup/node/lib/types';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface RecordingSessionOptions {
  roomId: string;
  recordingId: string;
  router: Router;
  audioProducer: Producer;
  videoProducer: Producer;
  outputDir?: string;
}

export interface RecordingResult {
  filePath: string;
  durationMs: number;
  startedAt: Date;
  stoppedAt: Date;
}

type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping' | 'stopped' | 'error';

export class RecordingSession {
  private roomId: string;
  private recordingId: string;
  private router: Router;
  private audioProducer: Producer;
  private videoProducer: Producer;

  private audioTransport: PlainTransport | null = null;
  private videoTransport: PlainTransport | null = null;
  private audioConsumer: Consumer | null = null;
  private videoConsumer: Consumer | null = null;
  private ffmpegProcess: ChildProcess | null = null;

  private state: RecordingState = 'idle';
  private outputDir: string;
  private outputFilePath: string = '';
  private sdpFilePath: string = '';
  private startedAt: Date | null = null;
  private stoppedAt: Date | null = null;

  constructor(options: RecordingSessionOptions) {
    this.roomId = options.roomId;
    this.recordingId = options.recordingId;
    this.router = options.router;
    this.audioProducer = options.audioProducer;
    this.videoProducer = options.videoProducer;
    this.outputDir = options.outputDir || path.join(os.tmpdir(), 'recordings');
  }

  getState(): RecordingState {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot start recording: state is ${this.state}`);
    }
    this.state = 'starting';

    try {
      // Ensure output directory exists
      fs.mkdirSync(this.outputDir, { recursive: true });

      // 1. Create PlainTransport + Consumer for audio
      const audio = await this.createPlainTransportAndConsumer(this.audioProducer);
      this.audioTransport = audio.transport;
      this.audioConsumer = audio.consumer;

      // 2. Create PlainTransport + Consumer for video
      const video = await this.createPlainTransportAndConsumer(this.videoProducer);
      this.videoTransport = video.transport;
      this.videoConsumer = video.consumer;

      // 3. Generate SDP file
      const sdpContent = this.generateSdp();
      this.sdpFilePath = path.join(this.outputDir, `${this.recordingId}.sdp`);
      fs.writeFileSync(this.sdpFilePath, sdpContent);
      console.log(`[Recording:${this.recordingId}] SDP written to ${this.sdpFilePath}`);
      console.log(`[Recording:${this.recordingId}] SDP content:\n${sdpContent}`);

      // 4. Spawn FFmpeg
      this.outputFilePath = path.join(this.outputDir, `${this.recordingId}.webm`);
      this.ffmpegProcess = this.spawnFfmpeg(this.sdpFilePath, this.outputFilePath);

      // Give FFmpeg a moment to start listening on the ports
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Resume consumers so RTP starts flowing
      await this.audioConsumer.resume();
      await this.videoConsumer.resume();

      this.startedAt = new Date();
      this.state = 'recording';
      console.log(`[Recording:${this.recordingId}] Recording started for room ${this.roomId}`);
    } catch (err) {
      this.state = 'error';
      await this.cleanup();
      throw err;
    }
  }

  async stop(): Promise<RecordingResult> {
    if (this.state !== 'recording') {
      throw new Error(`Cannot stop recording: state is ${this.state}`);
    }
    this.state = 'stopping';

    // 1. Close consumers first (stops RTP flow to FFmpeg)
    if (this.audioConsumer && !this.audioConsumer.closed) {
      this.audioConsumer.close();
    }
    if (this.videoConsumer && !this.videoConsumer.closed) {
      this.videoConsumer.close();
    }

    // 2. Signal FFmpeg to finish gracefully
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      await new Promise<void>((resolve) => {
        const onExit = () => resolve();
        this.ffmpegProcess!.on('exit', onExit);
        this.ffmpegProcess!.kill('SIGINT');

        // Safety timeout: force kill after 10 seconds
        setTimeout(() => {
          if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
            this.ffmpegProcess.removeListener('exit', onExit);
            this.ffmpegProcess.kill('SIGKILL');
            resolve();
          }
        }, 10000);
      });
    }

    // 3. Close transports
    if (this.audioTransport && !this.audioTransport.closed) {
      this.audioTransport.close();
    }
    if (this.videoTransport && !this.videoTransport.closed) {
      this.videoTransport.close();
    }

    // 4. Clean up SDP file
    if (this.sdpFilePath && fs.existsSync(this.sdpFilePath)) {
      fs.unlinkSync(this.sdpFilePath);
    }

    this.stoppedAt = new Date();
    this.state = 'stopped';

    const durationMs = this.stoppedAt.getTime() - (this.startedAt?.getTime() || 0);

    console.log(`[Recording:${this.recordingId}] Recording stopped. Duration: ${durationMs}ms, File: ${this.outputFilePath}`);

    return {
      filePath: this.outputFilePath,
      durationMs,
      startedAt: this.startedAt!,
      stoppedAt: this.stoppedAt,
    };
  }

  private async createPlainTransportAndConsumer(
    producer: Producer
  ): Promise<{ transport: PlainTransport; consumer: Consumer }> {
    const transport = await this.router.createPlainTransport({
      listenInfo: { protocol: 'udp', ip: '127.0.0.1' },
      rtcpListenInfo: { protocol: 'udp', ip: '127.0.0.1' },
      rtcpMux: false,
      comedia: false,
    });

    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: this.router.rtpCapabilities,
      paused: true,
    });

    console.log(
      `[Recording:${this.recordingId}] PlainTransport created for ${producer.kind}: ` +
      `RTP port=${transport.tuple.localPort}, RTCP port=${transport.rtcpTuple?.localPort}`
    );

    return { transport, consumer };
  }

  private generateSdp(): string {
    if (!this.audioConsumer || !this.videoConsumer || !this.audioTransport || !this.videoTransport) {
      throw new Error('Consumers and transports must be created before generating SDP');
    }

    const audioRtp = this.audioConsumer.rtpParameters;
    const videoRtp = this.videoConsumer.rtpParameters;

    const audioCodec = audioRtp.codecs[0];
    const videoCodec = videoRtp.codecs[0];

    const audioPort = this.audioTransport.tuple.localPort;
    const audioRtcpPort = this.audioTransport.rtcpTuple?.localPort || audioPort + 1;
    const videoPort = this.videoTransport.tuple.localPort;
    const videoRtcpPort = this.videoTransport.rtcpTuple?.localPort || videoPort + 1;

    const audioSsrc = audioRtp.encodings?.[0]?.ssrc;
    const videoSsrc = videoRtp.encodings?.[0]?.ssrc;

    let sdp = '';
    sdp += `v=0\n`;
    sdp += `o=- 0 0 IN IP4 127.0.0.1\n`;
    sdp += `s=Recording ${this.recordingId}\n`;
    sdp += `c=IN IP4 127.0.0.1\n`;
    sdp += `t=0 0\n`;

    // Video media line (video first for WebM)
    sdp += `m=video ${videoPort} RTP/AVP ${videoCodec.payloadType}\n`;
    sdp += `a=rtpmap:${videoCodec.payloadType} ${videoCodec.mimeType.split('/')[1]}/${videoCodec.clockRate}\n`;
    sdp += `a=rtcp:${videoRtcpPort}\n`;
    const videoFmtp = this.buildFmtp(videoCodec);
    if (videoFmtp) sdp += `a=fmtp:${videoCodec.payloadType} ${videoFmtp}\n`;
    if (videoSsrc) sdp += `a=ssrc:${videoSsrc}\n`;

    // Audio media line
    sdp += `m=audio ${audioPort} RTP/AVP ${audioCodec.payloadType}\n`;
    sdp += `a=rtpmap:${audioCodec.payloadType} ${audioCodec.mimeType.split('/')[1]}/${audioCodec.clockRate}/${audioCodec.channels || 2}\n`;
    sdp += `a=rtcp:${audioRtcpPort}\n`;
    const audioFmtp = this.buildFmtp(audioCodec);
    if (audioFmtp) sdp += `a=fmtp:${audioCodec.payloadType} ${audioFmtp}\n`;
    if (audioSsrc) sdp += `a=ssrc:${audioSsrc}\n`;

    return sdp;
  }

  private buildFmtp(codec: any): string {
    if (!codec.parameters || Object.keys(codec.parameters).length === 0) return '';
    return Object.entries(codec.parameters)
      .map(([k, v]) => `${k}=${v}`)
      .join(';');
  }

  private spawnFfmpeg(sdpPath: string, outputPath: string): ChildProcess {
    const args = [
      '-loglevel', 'warning',
      '-protocol_whitelist', 'file,udp,rtp',
      '-fflags', '+genpts',
      '-i', sdpPath,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-f', 'webm',
      '-y',
      outputPath,
    ];

    console.log(`[Recording:${this.recordingId}] Spawning FFmpeg: ffmpeg ${args.join(' ')}`);

    const proc = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stderr?.on('data', (data: Buffer) => {
      console.log(`[FFmpeg:${this.recordingId}] ${data.toString().trim()}`);
    });

    proc.on('error', (err) => {
      console.error(`[FFmpeg:${this.recordingId}] Process error:`, err);
      this.state = 'error';
    });

    proc.on('exit', (code, signal) => {
      console.log(`[FFmpeg:${this.recordingId}] Exited: code=${code}, signal=${signal}`);
    });

    return proc;
  }

  async cleanup(): Promise<void> {
    if (this.audioConsumer && !this.audioConsumer.closed) this.audioConsumer.close();
    if (this.videoConsumer && !this.videoConsumer.closed) this.videoConsumer.close();
    if (this.audioTransport && !this.audioTransport.closed) this.audioTransport.close();
    if (this.videoTransport && !this.videoTransport.closed) this.videoTransport.close();
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) this.ffmpegProcess.kill('SIGKILL');
    if (this.sdpFilePath && fs.existsSync(this.sdpFilePath)) fs.unlinkSync(this.sdpFilePath);
  }
}

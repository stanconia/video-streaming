import * as mediasoupClient from 'mediasoup-client';
import { Device } from 'mediasoup-client';
import { Transport, Producer, Consumer, RtpCapabilities } from 'mediasoup-client/lib/types';
import { SignalingClient } from '../signaling/SignalingClient';

export class WebRTCClient {
  private device: Device;
  private signalingClient: SignalingClient;
  private roomId: string;
  private userId: string;
  private role: string;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();

  constructor(signalingClient: SignalingClient, roomId: string, userId: string = '', role: string = 'viewer') {
    this.device = new mediasoupClient.Device();
    this.signalingClient = signalingClient;
    this.roomId = roomId;
    this.userId = userId;
    this.role = role;
  }

  async initialize(): Promise<void> {
    console.log('Initializing WebRTC device...');

    // Get router RTP capabilities
    const response = await this.signalingClient.send({
      type: 'get-router-capabilities',
      roomId: this.roomId,
    });

    if (response.type === 'error') {
      throw new Error(`Failed to get router capabilities: ${response.message}`);
    }

    // Load device with router RTP capabilities
    await this.device.load({ routerRtpCapabilities: response.capabilities });
    console.log('Device loaded with RTP capabilities');
  }

  async createSendTransport(): Promise<void> {
    // Skip if already created
    if (this.sendTransport) {
      console.log('Send transport already exists, skipping creation');
      return;
    }

    console.log('Creating send transport...');

    const response = await this.signalingClient.send({
      type: 'create-transport',
      roomId: this.roomId,
      direction: 'send',
    });

    if (response.type === 'error') {
      throw new Error(`Failed to create send transport: ${response.message}`);
    }

    this.sendTransport = this.device.createSendTransport({
      id: response.transportId,
      iceParameters: response.iceParameters,
      iceCandidates: response.iceCandidates,
      dtlsParameters: response.dtlsParameters,
    });

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signalingClient.send({
          type: 'connect-transport',
          transportId: this.sendTransport!.id,
          dtlsParameters,
          roomId: this.roomId,
        });
        callback();
      } catch (error: any) {
        errback(error);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const response = await this.signalingClient.send({
          type: 'produce',
          transportId: this.sendTransport!.id,
          kind,
          rtpParameters,
          roomId: this.roomId,
          userId: this.userId,
          role: this.role,
          source: (appData?.source as string) || 'camera',
        });

        callback({ id: response.producerId });
      } catch (error: any) {
        errback(error);
      }
    });

    this.sendTransport.on('connectionstatechange', (state) => {
      console.log('Send transport connection state:', state);
    });

    console.log('Send transport created');
  }

  async createRecvTransport(): Promise<void> {
    // Skip if already created
    if (this.recvTransport) {
      console.log('Receive transport already exists, skipping creation');
      return;
    }

    console.log('Creating receive transport...');

    const response = await this.signalingClient.send({
      type: 'create-transport',
      roomId: this.roomId,
      direction: 'receive',
    });

    if (response.type === 'error') {
      throw new Error(`Failed to create receive transport: ${response.message}`);
    }

    this.recvTransport = this.device.createRecvTransport({
      id: response.transportId,
      iceParameters: response.iceParameters,
      iceCandidates: response.iceCandidates,
      dtlsParameters: response.dtlsParameters,
    });

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signalingClient.send({
          type: 'connect-transport',
          transportId: this.recvTransport!.id,
          dtlsParameters,
          roomId: this.roomId,
        });
        callback();
      } catch (error: any) {
        errback(error);
      }
    });

    this.recvTransport.on('connectionstatechange', (state) => {
      console.log('Receive transport connection state:', state);
    });

    console.log('Receive transport created');
  }

  async produce(track: MediaStreamTrack, source: 'camera' | 'screen' = 'camera'): Promise<Producer> {
    if (!this.sendTransport) {
      throw new Error('Send transport not created');
    }

    const producer = await this.sendTransport.produce({ track, appData: { source } });
    this.producers.set(producer.id, producer);

    producer.on('trackended', () => {
      console.log('Track ended');
    });

    producer.on('transportclose', () => {
      console.log('Producer transport closed');
      this.producers.delete(producer.id);
    });

    console.log(`Producer created: ${producer.id} (${producer.kind})`);
    return producer;
  }

  async consume(producerId: string, onTrack: (track: MediaStreamTrack) => void): Promise<Consumer> {
    if (!this.recvTransport) {
      throw new Error('Receive transport not created');
    }

    const response = await this.signalingClient.send({
      type: 'consume',
      transportId: this.recvTransport.id,
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
      roomId: this.roomId,
    });

    if (response.type === 'error') {
      throw new Error(`Failed to consume: ${response.message}`);
    }

    const consumer = await this.recvTransport.consume({
      id: response.consumerId,
      producerId: response.producerId,
      kind: response.kind,
      rtpParameters: response.rtpParameters,
    });

    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      console.log('Consumer transport closed');
      this.consumers.delete(consumer.id);
    });

    // Resume consumer
    await this.signalingClient.send({
      type: 'resume-consumer',
      consumerId: consumer.id,
      roomId: this.roomId,
    });

    // Provide track to caller
    console.log(`>>> Calling onTrack callback with track:`, consumer.track.kind, consumer.track.id);
    onTrack(consumer.track);

    console.log(`Consumer created: ${consumer.id} (${consumer.kind})`);
    return consumer;
  }

  getRtpCapabilities(): RtpCapabilities {
    return this.device.rtpCapabilities;
  }

  closeProducer(producerId: string): void {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  // Close all producers but keep the connection alive for receiving
  closeProducers(): void {
    console.log('Closing all producers...');
    this.producers.forEach((producer) => producer.close());
    this.producers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }
  }

  closeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  close(): void {
    console.log('Closing WebRTC client...');

    this.producers.forEach((producer) => producer.close());
    this.producers.clear();

    this.consumers.forEach((consumer) => consumer.close());
    this.consumers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
  }
}

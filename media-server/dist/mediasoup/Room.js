"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediasoupRoom = void 0;
const config_1 = require("./config");
class MediasoupRoom {
    constructor(router) {
        this.transports = new Map();
        this.producers = new Map();
        this.consumers = new Map();
        this.participants = new Map(); // sessionId -> info
        this.producerOwners = new Map(); // producerId -> sessionId
        this.router = router;
    }
    getRtpCapabilities() {
        return this.router.rtpCapabilities;
    }
    async createWebRtcTransport() {
        const transport = await this.router.createWebRtcTransport({
            listenIps: config_1.config.webRtcTransport.listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: config_1.config.webRtcTransport.initialAvailableOutgoingBitrate,
        });
        transport.on('dtlsstatechange', (dtlsState) => {
            if (dtlsState === 'closed') {
                console.log('Transport closed, cleaning up...');
                transport.close();
            }
        });
        transport.on('close', () => {
            console.log('Transport closed');
        });
        this.transports.set(transport.id, transport);
        console.log(`WebRTC transport created: ${transport.id}`);
        return transport;
    }
    async connectTransport(transportId, dtlsParameters) {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }
        await transport.connect({ dtlsParameters });
        console.log(`Transport connected: ${transportId}`);
    }
    async createProducer(transportId, kind, rtpParameters, sessionId) {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }
        const producer = await transport.produce({
            kind,
            rtpParameters,
        });
        producer.on('transportclose', () => {
            console.log('Producer transport closed');
            producer.close();
            this.producers.delete(producer.id);
            this.producerOwners.delete(producer.id);
        });
        this.producers.set(producer.id, producer);
        if (sessionId) {
            this.producerOwners.set(producer.id, sessionId);
        }
        console.log(`Producer created: ${producer.id} (${kind}) by session: ${sessionId}`);
        return producer;
    }
    async createConsumer(transportId, producerId, rtpCapabilities) {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }
        const producer = this.producers.get(producerId);
        if (!producer) {
            throw new Error(`Producer not found: ${producerId}`);
        }
        if (!this.router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error('Cannot consume this producer');
        }
        const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true, // Start paused, client will resume
        });
        consumer.on('transportclose', () => {
            console.log('Consumer transport closed');
            consumer.close();
            this.consumers.delete(consumer.id);
        });
        consumer.on('producerclose', () => {
            console.log('Consumer producer closed');
            consumer.close();
            this.consumers.delete(consumer.id);
        });
        this.consumers.set(consumer.id, consumer);
        console.log(`Consumer created: ${consumer.id} for producer: ${producerId}`);
        return consumer;
    }
    async resumeConsumer(consumerId) {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) {
            throw new Error(`Consumer not found: ${consumerId}`);
        }
        await consumer.resume();
        console.log(`Consumer resumed: ${consumerId}`);
    }
    addParticipant(sessionId, userId, role) {
        this.participants.set(sessionId, {
            userId: userId || sessionId,
            role: role || 'viewer',
        });
        console.log(`Participant added: ${sessionId} (${userId}, ${role})`);
    }
    removeParticipant(sessionId) {
        this.participants.delete(sessionId);
        // Also remove producers owned by this participant
        for (const [producerId, ownerSessionId] of this.producerOwners.entries()) {
            if (ownerSessionId === sessionId) {
                this.closeProducer(producerId);
            }
        }
        console.log(`Participant removed: ${sessionId}`);
    }
    getProducers() {
        return Array.from(this.producers.values());
    }
    getProducersWithUserInfo() {
        const result = [];
        for (const [producerId, producer] of this.producers.entries()) {
            const ownerSessionId = this.producerOwners.get(producerId);
            const participantInfo = ownerSessionId ? this.participants.get(ownerSessionId) : null;
            result.push({
                producerId: producer.id,
                kind: producer.kind,
                userId: participantInfo?.userId || 'Unknown',
                role: participantInfo?.role || 'viewer',
            });
        }
        return result;
    }
    getProducerById(producerId) {
        return this.producers.get(producerId);
    }
    closeProducer(producerId) {
        const producer = this.producers.get(producerId);
        if (producer) {
            producer.close();
            this.producers.delete(producerId);
            this.producerOwners.delete(producerId);
            console.log(`Producer closed: ${producerId}`);
        }
    }
    closeProducersBySession(sessionId) {
        const producersToClose = [];
        for (const [producerId, ownerSessionId] of this.producerOwners.entries()) {
            if (ownerSessionId === sessionId) {
                producersToClose.push(producerId);
            }
        }
        for (const producerId of producersToClose) {
            this.closeProducer(producerId);
        }
        console.log(`Closed ${producersToClose.length} producers for session: ${sessionId}`);
    }
    close() {
        console.log('Closing room...');
        // Close all consumers
        this.consumers.forEach((consumer) => consumer.close());
        this.consumers.clear();
        // Close all producers
        this.producers.forEach((producer) => producer.close());
        this.producers.clear();
        // Close all transports
        this.transports.forEach((transport) => transport.close());
        this.transports.clear();
        // Clear participants
        this.participants.clear();
        console.log('Room closed');
    }
}
exports.MediasoupRoom = MediasoupRoom;
//# sourceMappingURL=Room.js.map
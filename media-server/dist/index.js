"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const MediasoupManager_1 = require("./mediasoup/MediasoupManager");
const SignalingHandler_1 = require("./signaling/SignalingHandler");
const config_1 = require("./mediasoup/config");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize mediasoup
const mediasoupManager = new MediasoupManager_1.MediasoupManager();
const signalingHandler = new SignalingHandler_1.SignalingHandler(mediasoupManager);
/**
 * Discover the public IP of this container.
 * Uses http://checkip.amazonaws.com which returns the public IP as plain text.
 */
async function discoverPublicIp() {
    return new Promise((resolve, reject) => {
        http_1.default.get('http://checkip.amazonaws.com', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data.trim()));
        }).on('error', (err) => {
            reject(err);
        });
    });
}
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'media-server' });
});
// Signaling endpoint
app.post('/signaling', async (req, res) => {
    try {
        const sessionId = req.header('X-Session-Id') || 'unknown';
        const message = req.body;
        console.log(`Received signaling message from session ${sessionId}:`, message.type);
        const response = await signalingHandler.handleMessage(message, sessionId);
        res.json(response);
    }
    catch (error) {
        console.error('Error handling signaling message:', error);
        res.status(500).json({
            type: 'error',
            message: error.message || 'Internal server error',
        });
    }
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    signalingHandler.close();
    await mediasoupManager.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    signalingHandler.close();
    await mediasoupManager.close();
    process.exit(0);
});
// Start server
async function startServer() {
    try {
        // Auto-discover public IP if ANNOUNCED_IP is 'auto' or not set
        const announcedIp = process.env.ANNOUNCED_IP;
        if (!announcedIp || announcedIp === 'auto') {
            try {
                const publicIp = await discoverPublicIp();
                console.log(`Discovered public IP: ${publicIp}`);
                config_1.config.setAnnouncedIp(publicIp);
            }
            catch (err) {
                console.warn('Failed to discover public IP, falling back to 127.0.0.1:', err);
                config_1.config.setAnnouncedIp('127.0.0.1');
            }
        }
        else {
            console.log(`Using configured ANNOUNCED_IP: ${announcedIp}`);
        }
        console.log('Initializing mediasoup...');
        await mediasoupManager.initialize();
        app.listen(PORT, () => {
            console.log(`Media server listening on port ${PORT}`);
            console.log(`Signaling endpoint: http://localhost:${PORT}/signaling`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map
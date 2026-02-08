import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { MediasoupManager } from './mediasoup/MediasoupManager';
import { SignalingHandler } from './signaling/SignalingHandler';
import { config } from './mediasoup/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize mediasoup
const mediasoupManager = new MediasoupManager();
const signalingHandler = new SignalingHandler(mediasoupManager);

/**
 * Discover the public IP of this container.
 * Uses http://checkip.amazonaws.com which returns the public IP as plain text.
 */
async function discoverPublicIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get('http://checkip.amazonaws.com', (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'media-server' });
});

// Signaling endpoint
app.post('/signaling', async (req: Request, res: Response) => {
  try {
    const sessionId = req.header('X-Session-Id') || 'unknown';
    const message = req.body;

    console.log(`Received signaling message from session ${sessionId}:`, message.type);

    const response = await signalingHandler.handleMessage(message, sessionId);

    res.json(response);
  } catch (error: any) {
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
        config.setAnnouncedIp(publicIp);
      } catch (err) {
        console.warn('Failed to discover public IP, falling back to 127.0.0.1:', err);
        config.setAnnouncedIp('127.0.0.1');
      }
    } else {
      console.log(`Using configured ANNOUNCED_IP: ${announcedIp}`);
    }

    console.log('Initializing mediasoup...');
    await mediasoupManager.initialize();

    app.listen(PORT, () => {
      console.log(`Media server listening on port ${PORT}`);
      console.log(`Signaling endpoint: http://localhost:${PORT}/signaling`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

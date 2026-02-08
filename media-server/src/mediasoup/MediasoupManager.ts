import * as mediasoup from 'mediasoup';
import { Worker, Router } from 'mediasoup/node/lib/types';
import { config } from './config';
import * as os from 'os';

export class MediasoupManager {
  private workers: Worker[] = [];
  private routers: Map<string, Router> = new Map();
  private nextWorkerIndex = 0;

  async initialize(): Promise<void> {
    const numWorkers = os.cpus().length;
    console.log(`Creating ${numWorkers} mediasoup workers...`);

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: config.worker.logLevel,
        logTags: config.worker.logTags,
        rtcMinPort: config.worker.rtcMinPort,
        rtcMaxPort: config.worker.rtcMaxPort,
      });

      worker.on('died', (error) => {
        console.error('mediasoup worker died', error);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      console.log(`Worker ${i + 1} created with PID: ${worker.pid}`);
    }

    console.log('All mediasoup workers initialized');
  }

  async createRouter(roomId: string): Promise<Router> {
    const worker = this.getNextWorker();

    const router = await worker.createRouter({
      mediaCodecs: config.routerCodecs,
    });

    this.routers.set(roomId, router);
    console.log(`Router created for room ${roomId} on worker ${worker.pid}`);

    return router;
  }

  getRouter(roomId: string): Router | undefined {
    return this.routers.get(roomId);
  }

  deleteRouter(roomId: string): void {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      this.routers.delete(roomId);
      console.log(`Router deleted for room ${roomId}`);
    }
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  async close(): Promise<void> {
    console.log('Closing all mediasoup workers...');
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers = [];
    this.routers.clear();
  }
}

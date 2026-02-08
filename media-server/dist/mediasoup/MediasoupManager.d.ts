import { Router } from 'mediasoup/node/lib/types';
export declare class MediasoupManager {
    private workers;
    private routers;
    private nextWorkerIndex;
    initialize(): Promise<void>;
    createRouter(roomId: string): Promise<Router>;
    getRouter(roomId: string): Router | undefined;
    deleteRouter(roomId: string): void;
    private getNextWorker;
    close(): Promise<void>;
}
//# sourceMappingURL=MediasoupManager.d.ts.map
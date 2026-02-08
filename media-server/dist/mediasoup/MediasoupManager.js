"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediasoupManager = void 0;
const mediasoup = __importStar(require("mediasoup"));
const config_1 = require("./config");
const os = __importStar(require("os"));
class MediasoupManager {
    constructor() {
        this.workers = [];
        this.routers = new Map();
        this.nextWorkerIndex = 0;
    }
    async initialize() {
        const numWorkers = os.cpus().length;
        console.log(`Creating ${numWorkers} mediasoup workers...`);
        for (let i = 0; i < numWorkers; i++) {
            const worker = await mediasoup.createWorker({
                logLevel: config_1.config.worker.logLevel,
                logTags: config_1.config.worker.logTags,
                rtcMinPort: config_1.config.worker.rtcMinPort,
                rtcMaxPort: config_1.config.worker.rtcMaxPort,
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
    async createRouter(roomId) {
        const worker = this.getNextWorker();
        const router = await worker.createRouter({
            mediaCodecs: config_1.config.routerCodecs,
        });
        this.routers.set(roomId, router);
        console.log(`Router created for room ${roomId} on worker ${worker.pid}`);
        return router;
    }
    getRouter(roomId) {
        return this.routers.get(roomId);
    }
    deleteRouter(roomId) {
        const router = this.routers.get(roomId);
        if (router) {
            router.close();
            this.routers.delete(roomId);
            console.log(`Router deleted for room ${roomId}`);
        }
    }
    getNextWorker() {
        const worker = this.workers[this.nextWorkerIndex];
        this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
        return worker;
    }
    async close() {
        console.log('Closing all mediasoup workers...');
        for (const worker of this.workers) {
            worker.close();
        }
        this.workers = [];
        this.routers.clear();
    }
}
exports.MediasoupManager = MediasoupManager;
//# sourceMappingURL=MediasoupManager.js.map
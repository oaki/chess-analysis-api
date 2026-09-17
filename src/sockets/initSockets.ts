import {Server} from "socket.io";
import {getConfig} from "../config";
import userSockets from "./userSockets";
import {workerSockets} from "./workerSockets";
import {CONNECT_VISION, RASPBERRY, USER, WORKER} from "../const";
import {WorkerController} from "../modules/user/modules/worker/workerController";
import {raspberrySocket} from "./raspberry";
import {logger} from "../libs/logger";

import jwt from "jsonwebtoken";
import {PassThrough} from "stream";
import {findAvailableWorkerInSocketList} from "../libs/findWorkerInSocketList";
import {
    mapWorkerEvaluation,
    WatchAnalysisResponse,
} from "../modules/watchAnalysis/watchAnalysisMapper";

interface WatchAnalysisRequest {
    requestID: string;
    fen: string;
    maxVariations: number;
    milliseconds: number;
}

class Sockets {
    private workersIo = [];
    private usersIo = {};
    private config;
    private activeWatchAnalyses = new Map<string, () => void>();

    constructor(config) {
        this.config = config;
    }

    isWorkersOnline(uuids: string[]) {
        return uuids.map((uuid: string) => ({
            uuid: uuid,
            ready: this.isWorkerOnline(uuid)
        }));
    }

    isWorkerOnline(uuid: string) {
        return !!this.workersIo.find((socket) => socket.worker.uuid === uuid);
    }

    createWatchAnalysisStream(request: WatchAnalysisRequest): PassThrough | null {
        const activeWorker = this.workersIo.find((candidate) =>
            this.activeWatchAnalyses.has(candidate.id));
        const worker = activeWorker || findAvailableWorkerInSocketList(this.workersIo);
        if (!worker) {
            return null;
        }

        this.activeWatchAnalyses.get(worker.id)?.();

        const stream = new PassThrough();
        let latestLines = [];
        let lastEmission = Date.now();
        let finished = false;

        const writeResponse = (isFinal: boolean) => {
            const response: WatchAnalysisResponse = {
                requestID: request.requestID,
                lines: latestLines,
                isFinal,
            };
            stream.write(`${JSON.stringify(response)}\n`);
        };

        const remove = () => {
            worker.off("workerEvaluation", receiveEvaluation);
            if (this.activeWatchAnalyses.get(worker.id) === cancel) {
                this.activeWatchAnalyses.delete(worker.id);
                worker.worker.lastUsed = Date.now();
            }
        };

        const finish = () => {
            if (finished) {
                return;
            }
            finished = true;
            clearTimeout(finalTimer);
            if (latestLines.length > 0) {
                writeResponse(true);
            }
            remove();
            stream.end();
        };

        const cancel = () => {
            if (finished) {
                return;
            }
            worker.emit("stopWorker");
            finish();
        };

        const receiveEvaluation = (payload: string) => {
            const lines = mapWorkerEvaluation(payload, request.fen, request.maxVariations);
            if (!lines || lines.length === 0) {
                return;
            }

            latestLines = lines;
            const now = Date.now();
            if (now - lastEmission >= 1_000) {
                writeResponse(false);
                lastEmission = now;
            }
        };

        const finalTimer = setTimeout(finish, request.milliseconds + 250);
        this.activeWatchAnalyses.set(worker.id, cancel);
        worker.worker.lastUsed = Date.now() + request.milliseconds;
        worker.on("workerEvaluation", receiveEvaluation);
        worker.emit("stopWorker");
        worker.emit("setPositionToWorker", {
            FEN: request.fen,
            multiPv: request.maxVariations,
            delay: request.milliseconds,
        });

        stream.once("close", () => {
            if (!finished) {
                cancel();
            }
        });

        return stream;
    }

    connect(hapiServer) {
        const io = new Server(hapiServer.listener, {
            cors: {
                origin: ["http://localhost:3000", "https://www.chess-analysis.com"],
                methods: ["GET", "POST"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"]
            }
        });

        io.use(async (socketOrigin, next) => {
            const socket: any = socketOrigin;
            const type = socket.handshake.query.type;

            logger.debug({type}, "socket connection");

            switch (type) {
                case USER: {
                    const jwtToken = socket.handshake.query.token;
                    socket.handshake.user = jwt.decode(jwtToken, this.config.jwt.key);
                    next();
                    break;
                }

                case WORKER: {
                    if (socket.handshake.query?.token) {
                        const workerRepository = await WorkerController.getWorkerRepository();
                        const worker = await workerRepository.findOne({
                            where: {uuid: socket.handshake.query.token},
                            relations: ["user"]
                        });

                        if (worker) {
                            logger.info({workerId: worker.id}, "worker authenticated");
                            worker.lastUsed = Date.now();
                            socket.worker = worker;
                        } else {
                            logger.warn({token: socket.handshake.query.token}, "unregistered worker");
                            socket.worker = {lastUsed: Date.now(), isUnknown: true};
                        }
                        next();
                    } else {
                        logger.error("worker missing token");
                        next(new Error("Authentication error"));
                    }
                    break;
                }

                case RASPBERRY: {
                    try {
                        jwt.decode(socket.handshake.query.token, this.config.jwt.key);
                        next();
                    } catch (e) {
                        logger.error({err: e}, "raspberry auth error");
                        next(new Error("Authentication error"));
                    }
                    break;
                }

                case CONNECT_VISION: {
                    next();
                    break;
                }

                default:
                    logger.error({type}, "unknown socket type");
                    next(new Error("Authentication error"));
            }
        });

        io.on("connection", (socket) => {
            if (socket.handshake.query.type === CONNECT_VISION) {
                socket.on("offer", (data) => {
                    socket.broadcast.to(data.target).emit("offer", {sdp: data.sdp, source: socket.id});
                });
                socket.on("answer", (data) => {
                    socket.broadcast.to(data.target).emit("answer", {sdp: data.sdp, source: socket.id});
                });
                socket.on("ice-candidate", (data) => {
                    socket.broadcast.to(data.target).emit("ice-candidate", {candidate: data.candidate, source: socket.id});
                });
            }

            if (socket.handshake.query.type === USER) {
                userSockets(socket, this.usersIo, this.workersIo);
            }

            if (socket.handshake.query.type === RASPBERRY) {
                raspberrySocket(socket);
            }

            if (socket.handshake.query.type === WORKER) {
                workerSockets(socket, this.usersIo, this.workersIo);

                socket.on("workerIsReady", (response) => {
                    logger.debug({response}, "workerIsReady");
                });

                socket.emit("isReady", "Is worker ready");
            }

            socket.on("disconnect", () => {
                logger.debug({socketId: socket.id}, "socket disconnected");

                if (socket.handshake.query.type === USER) {
                    delete this.usersIo[socket.id];
                }

                if (socket.handshake.query.type === WORKER) {
                    const index = this.workersIo.findIndex((workerSocket) => socket.id === workerSocket.id);
                    this.workersIo.splice(index, 1);
                }
            });
        });
    }
}

export const SocketService = new Sockets(getConfig());

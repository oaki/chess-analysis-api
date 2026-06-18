import {Server} from "socket.io";
import {getConfig} from "../config";
import userSockets from "./userSockets";
import {workerSockets} from "./workerSockets";
import {CONNECT_VISION, RASPBERRY, USER, WORKER} from "../const";
import {WorkerController} from "../modules/user/modules/worker/workerController";
import {raspberrySocket} from "./raspberry";
import {logger} from "../libs/logger";

import jwt from "jsonwebtoken";

class Sockets {
    private workersIo = [];
    private usersIo = {};
    private config;

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

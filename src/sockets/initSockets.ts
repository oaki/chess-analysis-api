import * as socketIo from "socket.io";
import {getConfig} from "../config/index";
import {models} from "../models/database";
import userSockets from "./userSockets";
import workerSockets from "./workerSockets";
import {USER, WORKER} from "../const";

const JWT = require("jsonwebtoken");

/**
 * END GAME API syzygy
 * https://syzygy-tables.info/api/v2?fen=4k3/8/8/8/8/8/8/4K3%20w%20-%20-%200%201

 alternative
 http://www.shredderchess.com/online-chess/online-databases/endgame-database/
 http://www.shredderchess.com/online/playshredder/fetch.php?obid=et30.889997529737792&reqid=req0.357818294665617&hook=null&action=egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20w%20-%20-%200%201

 */


class Sockets {
    private workersIo = [];
    private usersIo = {};
    private config;

    constructor(config) {
        this.config = config;
    }

    isWorkersOnline(uuids: string[]) {

        return uuids.map((uuid: string) => {
            return {
                uuid: uuid,
                ready: this.isWorkerOnline(uuid)
            }
        })
    }

    isWorkerOnline(uuid: string) {
        return !!this.workersIo.find((socket) => socket.worker.uuid === uuid)
    }

    connect(hapiServer) {
        //create socket.io connection
        const io = socketIo(hapiServer.listener);

        io.use(async (socket, next) => {

            console.log("io->use->start");
            if (socket.handshake.query.type === USER) {
                const jwtToken = socket.handshake.query.token;
                socket.handshake.user = JWT.decode(jwtToken, this.config.jwt.key);

                next();
            } else if (socket.handshake.query.type === WORKER) {
                console.log("It is worker", socket.handshake.query && socket.handshake.query.token);
                if (socket.handshake.query && socket.handshake.query.token) {
                    let worker = await models.Worker.findOne({raw: true, where: {uuid: socket.handshake.query.token}});

                    if (worker) {
                        console.log("Add worker info to the socket", worker);
                        worker.lastUsed = Date.now();
                        socket.worker = worker;
                        next();
                    } else {

                        socket.worker = {
                            lastUsed: Date.now(),
                            isUnknown: true
                        }

                        console.warn("Worker is not registered in our database.", socket.handshake.query.token);
                        next();
                    }

                } else {

                    console.error("Worker - Authentication error");
                    next(new Error("Authentication error"));
                }
            } else {
                console.error("socket.handshake - Authentication error", socket.handshake);

                next(new Error("Authentication error"));
            }


        })

        io.on("connection", (socket) => {

            if (socket.handshake.query.type === USER) {
                userSockets(socket, this.usersIo, this.workersIo);
            }

            if (socket.handshake.query.type === WORKER) {
                workerSockets(socket, this.usersIo, this.workersIo);
            }

            socket.on("disconnect", () => {
                console.log("Server: disconnected", socket.id);

                if (socket.handshake.query.type === USER) {
                    delete this.usersIo[socket.id];
                }

                if (socket.handshake.query.type === WORKER) {
                    // need to be tested
                    const index = this.workersIo.findIndex((workerSocket) => socket.id === workerSocket.id);
                    this.workersIo.splice(index, 1);
                }

            });
        })
    }
}

export const SocketService = new Sockets(getConfig());


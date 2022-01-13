import {Server} from "socket.io";
// const { Server } = require('socket.io');
import {getConfig} from "../config";
import userSockets from "./userSockets";
import {workerSockets} from "./workerSockets";
import {RASPBERRY, USER, WORKER} from "../const";
import {WorkerController} from "../modules/user/modules/worker/workerController";
import {raspberrySocket} from "./raspberry";
/**
 * END GAME API syzygy
 * https://syzygy-tables.info/api/v2?fen=4k3/8/8/8/8/8/8/4K3%20w%20-%20-%200%201

 alternative
 http://www.shredderchess.com/online-chess/online-databases/endgame-database/
 http://www.shredderchess.com/online/playshredder/fetch.php?obid=et30.889997529737792&reqid=req0.357818294665617&hook=null&action=egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20w%20-%20-%200%201

 */
import {io} from "socket.io-client";

const JWT = require("jsonwebtoken");


function connectToNextChessMoveSocket() {
    console.log("connectToNextChessMoveSocket");
    debugger;
    const socket = io("wss://nextchessmove.com/socket/websocket", {
        query: {
            vsn: '2.0.0'
        },
        extraHeaders: {
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9,sk;q=0.8",
            "Cache-Control": "no-cache",
            "Connection": "Upgrade",
            "Cookie": "__gads=ID=d77f260fe4745a6f-22bcec888ca600c7:T=1608155203:RT=1608155203:S=ALNI_Ma_sMZsgmmlKb7rdMMp63gEU7k5EA; _pk_id.1.e07f=0eeb7963e5dbd61f.1608155204.; _pk_ref.1.e07f=%5B%22%22%2C%22%22%2C1611745836%2C%22https%3A%2F%2Flczero.org%2F%22%5D; __stripe_mid=debd98a4-6caf-410b-beef-d557007876c8f8e01c; __stripe_sid=34d2db8e-3bc7-4abf-97f8-cb469433ba10fe77db; user_remember_me=SFMyNTY.g2gDbQAAACBIVLu2owSIUoQhoLdST7fGuz50o-j8QfrofCypQXEvqW4GADz9H3N6AWIATxoA.RA05UAyq321N7cC1F3mfnGLIyvhbV2xsHVRXEfN3XHA; ncm_session=SFMyNTY.g3QAAAADbQAAAAtfY3NyZl90b2tlbm0AAAAYai1vcGQtam5tenZqd0xwblNZMnR0MHlibQAAAA5saXZlX3NvY2tldF9pZG0AAAA7dXNlcnNfc2Vzc2lvbnM6U0ZTN3RxTUVpRktFSWFDM1VrLTN4cnMtZEtQb19FSDY2SHdzcVVGeEw2az1tAAAACnVzZXJfdG9rZW5tAAAAIEhUu7ajBIhShCGgt1JPt8a7PnSj6PxB-uh8LKlBcS-p.x3dsc7IWOPusaD_W7EoQbt2lqLtha2CWtsbxHiWm2N0; uvts=f821f4fa-3ed2-4d1b-7eef-61a1879d68cf",
            "Host": "nextchessmove.com",
            "Origin": "https://nextchessmove.com",
            "Pragma": "no-cache",
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
            "Sec-WebSocket-Key": "Ci8TVxG91kJfgOBx5pkchA==",
            "Sec-WebSocket-Version": "13",
            "Upgrade": "websocket",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
        }
    });
    debugger;
    socket.on("connection", (socket) => {
        debugger;
        console.log('CONNECTED TO nextchessmove.com', socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
    });
    //
    // fetch("wss://nextchessmove.com/socket/websocket?vsn=2.0.0", {
    //     "headers": {
    //         "accept-language": "en-US,en;q=0.9,sk;q=0.8",
    //         "cache-control": "no-cache",
    //         "pragma": "no-cache",
    //         "sec-websocket-extensions": "permessage-deflate; client_max_window_bits",
    //         "sec-websocket-key": "NCKbmXH8apB35cxH5LEc5Q==",
    //         "sec-websocket-version": "13",
    //         "cookie": "__gads=ID=d77f260fe4745a6f-22bcec888ca600c7:T=1608155203:RT=1608155203:S=ALNI_Ma_sMZsgmmlKb7rdMMp63gEU7k5EA; _pk_id.1.e07f=0eeb7963e5dbd61f.1608155204.; _pk_ref.1.e07f=%5B%22%22%2C%22%22%2C1611745836%2C%22https%3A%2F%2Flczero.org%2F%22%5D; _ncm_session=cnRLNEpPNmM0UUlHK0NmalIxdkdhYTlGNWF2L05uS0x0bnFiQ0Rlb2hHM3c1eENaRHJlbTVpNDBYU2FGaUhwVHlmZmxDdHpGNFlMWWY2b0FKR2QvcG1LUkpBWHhiM1FVZnRlZ0RyQ1h3Z0s4aytGekxpUVRHSEF5L0ZvNTNpNkZuaHdxdHg3OXJQNmEwNDNOUWFLYUxmTHZkOXF3RkdzVFQxYU5WdUowS1pDbXExbVd1KzlYRXdRQ1Zqb2dSRHpNV3lLUkZ6dUFpYlBDWVdKU3ljVENWbTR6dmVIWk03M1ZMMHNTMm1KQ21pRT0tLS9JTWF1OEhMK1hnVG9ZOHhjdDRjRkE9PQ%3D%3D--97a9df26073d8d5792f4af85d9e03e497494cb44; __stripe_mid=debd98a4-6caf-410b-beef-d557007876c8f8e01c; user_remember_me=SFMyNTY.g2gDbQAAACC8W9mwiwegfIGaETauRKahv1wmx88Tm3H9asWHRYVarW4GAN6jhgl4AWIATxoA.P7jwVQ6HcRQ6rEVc2N9RheWkId6F00EVINBoqrO8MRU; ncm_session=SFMyNTY.g3QAAAADbQAAAAtfY3NyZl90b2tlbm0AAAAYMUFZVE5VbFh5VFFiM2c1SFp1Z09wUVZmbQAAAA5saXZlX3NvY2tldF9pZG0AAAA7dXNlcnNfc2Vzc2lvbnM6dkZ2WnNJc0hvSHlCbWhFMnJrU21vYjljSnNmUEU1dHhfV3JGaDBXRldxMD1tAAAACnVzZXJfdG9rZW5tAAAAILxb2bCLB6B8gZoRNq5EpqG_XCbHzxObcf1qxYdFhVqt.Ti3OvZhWREXvcuM-yXVhXCRAWM54ty9jDu_29OeMTz0; uvts=70a660a2-7914-4f3e-6e15-d39ff8b4dfb0; __stripe_sid=71f9b06a-36a1-417d-bb2a-fb05397f620f9d797f"
    //     },
    //     "body": null,
    //     "method": "GET",
    //     "mode": "cors"
    // });

}

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
        connectToNextChessMoveSocket();
        //create socket.io connection
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
            console.log("io->use->start", socket.handshake.query.type, socket.handshake.query.token);
            switch (socket.handshake.query.type) {
                case USER: {
                    const jwtToken = socket.handshake.query.token;
                    socket.handshake.user = JWT.decode(jwtToken, this.config.jwt.key);

                    next();
                    break;
                }

                case WORKER: {
                    if (socket.handshake.query && socket.handshake.query.token) {

                        const workerRepository = await WorkerController.getWorkerRepository();

                        let worker = await workerRepository.findOne({where: {uuid: socket.handshake.query.token},relations: ['user']} );

                        if (worker) {
                            console.log("Add worker info to the socket", worker, worker.user);
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

                    break;
                }

                case RASPBERRY: {
                    const jwtToken = socket.handshake.query.token;
                    console.log("raspberry jwtToken", jwtToken);
                    try {

                        const user = JWT.decode(jwtToken, this.config.jwt.key);
                        console.log("Raspberry user", user);
                        next();
                    } catch (e) {
                        console.log("Raspberry", e);
                    }
                }

                default:
                    console.error("socket.handshake - Authentication error", socket.handshake);
                    next(new Error("Authentication error"));
                    break;

            }
        })

        io.on("connection", (socket) => {

            if (socket.handshake.query.type === USER) {
                userSockets(socket, this.usersIo, this.workersIo);
            }

            if (socket.handshake.query.type === RASPBERRY) {
                raspberrySocket(socket);
            }

            if (socket.handshake.query.type === WORKER) {
                workerSockets(socket, this.usersIo, this.workersIo);

                socket.on("workerIsReady", (response) => {
                    console.log("workerIsReady response: ", response);
                });

                console.log("Send to worker: isReady");
                socket.emit("isReady", "Is worker ready");

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


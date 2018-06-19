import * as socketIo from 'socket.io';
import {getConfig} from '../config/index';
import {models} from "../models/database";
import userSockets from "./userSockets";
import workerSockets from "./workerSockets";
import {USER, WORKER} from "../const";

const JWT = require('jsonwebtoken');

/**
 * END GAME API syzygy
 * https://syzygy-tables.info/api/v2?fen=4k3/8/8/8/8/8/8/4K3%20w%20-%20-%200%201

 alternative
 http://www.shredderchess.com/online-chess/online-databases/endgame-database/
 http://www.shredderchess.com/online/playshredder/fetch.php?obid=et30.889997529737792&reqid=req0.357818294665617&hook=null&action=egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20w%20-%20-%200%201

 */
export async function initSockets(hapiServer) {

    const config = getConfig();

    const workersIo = [];
    const usersIo = {};

    // const sender = zeromq.socket('push');
    // sender.bindSync(`tcp://*:${config.worker.host1}`);
    //
    // const receiver = zeromq.socket('pull');
    // receiver.bindSync(`tcp://*:${config.worker.host2}`);
    //
    // receiver.on('message', (data) => {
    //     const json = JSON.parse(data.toString());
    //
    //     if (json && json[0]) {
    //         const response: IWorkerResponse = json[0];
    //
    //         console.log('4. Server: message->', JSON.stringify(response));
    //         if (sockets[response.userId]) {
    //
    //             const socket = sockets[response.userId];
    //             positionService.add(response.fen, positionService.mapWorkerToEvaluation(response));
    //
    //             const workerResponse: IEvaluation = PositionService.beforeSaveEvaluation(response);
    //             socket.emit('on_result', {
    //                 fen: response.fen, data: workerResponse,
    //             });
    //         }
    //     }
    // });


    //create socket.io connection
    const io = socketIo(hapiServer.listener);
    // const ioWorker = socketIo(hapiServer.listener);

    io.use(async (socket, next) => {

        if (socket.handshake.query.type === USER) {
            const jwtToken = socket.handshake.query.token;
            socket.handshake.user = JWT.decode(jwtToken, config.jwt.key);

            next();
        }

        if (socket.handshake.query.type === WORKER) {
            console.log('It is worker');
            if (socket.handshake.query && socket.handshake.query.token) {
                const worker = await models.Worker.find({raw: true, where: {uuid: socket.handshake.query.token}});

                if (worker) {
                    console.log('Add worker info to the socket', worker);
                    socket.worker = worker;
                    next();
                } else {
                    next(new Error('Worker is not registered in our database.'));
                }

            } else {
                next(new Error('Authentication error'));
            }
        }
        next(new Error('Authentication error'));
    })

    io.on('connection', (socket) => {

        if (socket.handshake.query.type === USER) {
            userSockets(socket, usersIo, workersIo);
        }

        if (socket.handshake.query.type === WORKER) {
            workerSockets(socket, usersIo, workersIo);
        }

        socket.on('disconnect', () => {
            console.log('Server: disconnected', socket.id);

            if (socket.handshake.query.type === USER) {
                delete usersIo[socket.id];
            }

            if (socket.handshake.query.type === WORKER) {
                // need to be tested
                const index = workersIo.findIndex((workerSocket) => socket.id === workerSocket.id);
                workersIo.splice(index, 1);
            }

        });
    })
}
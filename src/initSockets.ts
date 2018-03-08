import positionService, {PositionService} from "./services/positionService";
import * as socketIo from 'socket.io';
import * as zeromq from 'zeromq';
import {getConfig} from './config';

import {IEvaluation, IWorkerResponse} from "./interfaces";
import openingsService from "./services/openingsService";
import {countPieces} from "./tools";


/**
 * END GAME API syzygy
 * https://syzygy-tables.info/api/v2?fen=4k3/8/8/8/8/8/8/4K3%20w%20-%20-%200%201

 alternative
 http://www.shredderchess.com/online-chess/online-databases/endgame-database/
 http://www.shredderchess.com/online/playshredder/fetch.php?obid=et30.889997529737792&reqid=req0.357818294665617&hook=null&action=egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20egtb&fen=1r6/1B6/8/8/2K5/4k3/P7/8%20w%20-%20-%200%201

 */
export async function initSockets(hapiServer) {

    // Connect ZeroMQ to send messages on
    const config = getConfig();
    const sockets = {};
    const sender = zeromq.socket('push');
    sender.bindSync(`tcp://*:${config.worker.host1}`);

    const receiver = zeromq.socket('pull');
    receiver.bindSync(`tcp://*:${config.worker.host2}`);

    receiver.on('message', (data) => {
        const json = JSON.parse(data.toString());

        if (json && json[0]) {
            const response: IWorkerResponse = json[0];

            console.log('4. Server: message->', JSON.stringify(response));
            if (sockets[response.userId]) {

                const socket = sockets[response.userId];
                positionService.add(response.fen, positionService.mapWorkerToEvaluation(response));

                const workerResponse: IEvaluation = PositionService.beforeSaveEvaluation(response);
                socket.emit('on_result', {
                    fen: response.fen, data: workerResponse,
                });
            }
        }
    });

    //create socket.io connection
    const io = socketIo(hapiServer.listener);

    io.on('connection', (socket) => {
        console.log('1. a user connected', socket.id);

        sockets[socket.id] = socket;
        socket.on('setNewPosition', async (data) => {
            console.log('2. server->socket: setNewPosition');
            const position = {
                action: 'findBestMove',
                userId: socket.id,
                fen: data.FEN,
            };


            //try to find in book
            const opening = await openingsService.find(position.fen);
            if (opening) {
                console.log('is Opening', opening);
                socket.emit('on_result', {
                    fen: position.fen, data: opening
                });
            } else {


                //check how many pieces
                // if there is only 7 and less then try to load from end-game database

                if(countPieces(data.FEN)<=7){

                }

                const evaluation = await positionService.findAllMoves(data.FEN);

                if (evaluation === null) {
                    sender.send(JSON.stringify(position));
                } else {
                    const bestVariant = positionService.getBestVariant(evaluation);
                    console.log('I have it!!!!', bestVariant);

                    socket.emit('on_result', {
                        fen: data.FEN, data: JSON.parse(bestVariant)
                    });
                }
            }


        });

        socket.on('disconnect', () => {
            console.log('Server: user disconnected', socket.id);
            delete sockets[socket.id];
        });
    });


}
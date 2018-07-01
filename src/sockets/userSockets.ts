import {workersForEverybody} from "../models/workerForEverybody";
import openingsService from "../services/openingsService";
import positionService, {PositionService} from "../services/positionService";
import SyzygyService from '../services/syzygyService';
import {countPieces} from "../tools";

const random = require('lodash/random');

export default function (userSocket, usersIo, workerIo) {
    usersIo[userSocket.id] = userSocket;
    console.log('userSocket.id added to list', userSocket.id);

    userSocket.on('setNewPosition', async (data) => {
        console.log('2. server->socket: setNewPosition', data);
        const position = {
            action: 'findBestMove',
            userId: userSocket.id,
            fen: data.FEN,
        };

        //try to find in book
        const opening = await openingsService.find(position.fen);

        console.log('afterOpening', countPieces(data.FEN));

        if (opening) {
            userSocket.emit('openingMoves', {
                fen: position.fen, data: opening
            });
        } else {
            // @todo check how many pieces
            // if there is only 7 and less then try to load from end-game database

            if (countPieces(data.FEN) <= 7) {
                //https://tablebase.lichess.ovh/standard/mainline?fen=4k3/6KP/8/8/8/8/7p/8_w_-_-_0_1

                try {
                    const syzygyData = await SyzygyService.find(data.FEN);
                    console.log('emit->syzygyEvaluation', syzygyData);
                    userSocket.emit('syzygyEvaluation', syzygyData);
                } catch (e) {

                }
            } else {
                const evaluation = await positionService.findAllMoves(data.FEN);

                if (evaluation === null) {
                    console.log('Send the position to worker for evaluation.');


                    // @todo find BEST worker from you
                    let w = workerIo.find((socket) => {
                        return socket.worker.user_id === userSocket.handshake.user.user_id;
                    });


                    // use temporary server worker
                    if (!w) {
                        const listWorkers = workerIo.filter((socket) => {
                            //@todo creat
                            // e list in DB for all available workers which can be used for free for everybody
                            return workersForEverybody.indexOf(socket.worker.uuid) !== -1;
                        });

                        w = listWorkers[random(0, listWorkers.length)];
                    }

                    if (w) {
                        console.log('choose worker with uuid', w.worker.uuid);
                        console.log('setPositionToWorker', data);
                        w.emit('setPositionToWorker', data);
                        w.on('workerEvaluation', (data) => {
                            console.log('workerEvaluation', data);
                            userSocket.emit('workerEvaluation', data);
                        });
                    } else {
                        console.error('No worker available', userSocket.handshake.user.user_id, workerIo);
                    }

                    // userSocket.emit('evaluation', JSON.stringify(position));
                } else {
                    const bestVariant = positionService.getBestVariant(evaluation);
                    console.log('I have it!!!!', bestVariant);

                    const data = JSON.parse(bestVariant);

                    data.p = PositionService.normalizePv(data.p);
                    console.log('data after normalizePv', data, data.p);
                    userSocket.emit('workerEvaluation', JSON.stringify([data]));
                }
            }
        }
    });
}
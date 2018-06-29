import openingsService from "../services/openingsService";
import positionService from "../services/positionService";
import {countPieces} from "../tools";

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
        if (opening) {
            userSocket.emit('openingMoves', {
                fen: position.fen, data: opening
            });
        } else {
            // @todo check how many pieces
            // if there is only 7 and less then try to load from end-game database

            if (countPieces(data.FEN) <= 7) {

            }

            const evaluation = await positionService.findAllMoves(data.FEN);

            if (evaluation === null) {
                console.log('Send the position to worker for evaluation.');


                // @todo find BEST worker from you
                const w = workerIo.find((socket) => {
                    return socket.worker.user_id === userSocket.handshake.user.user_id;
                });

                if (w) {
                    console.log('setPositionToWorker', data);
                    w.emit('setPositionToWorker', data);
                    w.on('workerEvaluation', (data)=>{
                        userSocket.emit('workerEvaluation', data);
                    });
                }else{
                    console.error('No worker available',userSocket.handshake.user.user_id, workerIo);
                }

                // userSocket.emit('evaluation', JSON.stringify(position));
            } else {
                const bestVariant = positionService.getBestVariant(evaluation);
                console.log('I have it!!!!', bestVariant);

                userSocket.emit('on_result', {
                    fen: data.FEN,
                    data: JSON.parse(bestVariant)
                });
            }
        }
    });
}
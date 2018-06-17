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
            console.log('is Opening', opening);
            userSocket.emit('on_result', {
                fen: position.fen, data: opening
            });
        } else {
            //check how many pieces
            // if there is only 7 and less then try to load from end-game database

            if (countPieces(data.FEN) <= 7) {

            }

            const evaluation = await positionService.findAllMoves(data.FEN);
            console.log('evaluation', evaluation);
            console.log('workerIo', workerIo);
            //
            // if (evaluation === null) {
            //     sender.send(JSON.stringify(position));
            // } else {
            //     const bestVariant = positionService.getBestVariant(evaluation);
            //     console.log('I have it!!!!', bestVariant);
            //
            //     socket.emit('on_result', {
            //         fen: data.FEN, data: JSON.parse(bestVariant)
            //     });
            // }
        }
    });
}
import openingsService from "../services/openingsService";
import positionService, {PositionService} from "../services/positionService";
import SyzygyService from "../services/syzygyService";
import {countPieces} from "../tools";
import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "../libs/findWorkerInSocketList";
import {LINE_MAP} from "../interfaces";

const random = require("lodash/random");

export default function (userSocket, usersIo, workersIo) {
    usersIo[userSocket.id] = userSocket;
    console.log("userSocket.id added to list", userSocket.id);

    userSocket.on("setNewPosition", async (data) => {
        console.log("2. server->socket: setNewPosition", data);
        const fen: string = data.FEN;
        const position = {
            action: "findBestMove",
            userId: userSocket.id,
            fen,
        };

        //try to find in book
        const opening = await openingsService.find(position.fen);

        if (opening) {
            userSocket.emit("openingMoves", {
                fen: position.fen, data: opening
            });
        } else {
            // @todo check how many pieces
            // if there is only 7 and less then try to load from end-game database

            if (countPieces(data.FEN) <= 7) {
                //https://tablebase.lichess.ovh/standard/mainline?fen=4k3/6KP/8/8/8/8/7p/8_w_-_-_0_1

                try {
                    const syzygyData = await SyzygyService.find(fen);
                    console.log("emit->syzygyEvaluation", syzygyData);
                    userSocket.emit("syzygyEvaluation", syzygyData);
                } catch (e) {

                }
            } else {
                const evaluation = await positionService.findAllMoves(fen);

                if (evaluation === null) {
                    console.log("Send the position to worker for evaluation.");

                    console.log({workersIo});
                    // @todo find BEST worker from you
                    let workerIo = findMyWorkerInSocketList(workersIo, userSocket.handshake.user.user_id);

                    // use temporary server worker
                    if (!workerIo) {
                        workerIo = findAvailableWorkerInSocketList(workersIo);
                        console.log("findAvailableWorkerInSocketList", {workerIo});
                    }

                    if (workerIo) {
                        console.log({worker: workerIo.worker, workerIo});
                        console.log("Your worker", workerIo.worker.lastUsed, userSocket.handshake.user, workersIo.map(socket => socket.worker.user_id));

                        workerIo.worker.lastUsed = Date.now();
                        console.log("choose worker with uuid", workerIo.worker.uuid);
                        console.log("setPositionToWorker", data);
                        workerIo.emit("setPositionToWorker", data);


                        // if (!w._events || !w._events.workerEvaluation) {
                        workerIo.on("workerEvaluation", (data) => {
                            console.log("workerEvaluation", data);
                            userSocket.emit("workerEvaluation", data);
                        });
                        // }

                    } else {
                        userSocket.emit("noWorkerAvailable", fen);
                    }

                    // userSocket.emit('evaluation', JSON.stringify(position));
                } else {

                    console.log("I have it!!!!", evaluation);

                    const data = JSON.parse(evaluation.data);


                    data.p = PositionService.normalizePv(data.p);
                    data[LINE_MAP.nodes] = Number(data[LINE_MAP.nodes]) * 1000;
                    data.fen = fen; //add fen

                    console.log("data after normalizePv", data, data.p);
                    userSocket.emit("workerEvaluation", JSON.stringify([data]));
                }
            }
        }
    });
}
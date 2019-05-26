import openingsService from "../services/openingsService";
import positionService from "../services/positionService";
import SyzygyService from "../services/syzygyService";
import {countPieces} from "../tools";
import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "../libs/findWorkerInSocketList";
import {IEvaluation, LINE_MAP} from "../interfaces";
import chessgamesComService from "../services/chessgamesComService";
import nextchessmoveComService from "../services/nextchessmoveComService";

const random = require("lodash/random");

export default function (userSocket, usersIo, workersIo) {
    usersIo[userSocket.id] = userSocket;
    console.log("userSocket.id added to list", userSocket.id, Object.keys(usersIo));

    userSocket.on("setNewPosition", async (data) => {
        console.log("2. server->socket: setNewPosition", data);
        const fen: string = data.FEN;
        const previousEvaluation: IEvaluation = data.previousEvaluation;

        const position = {
            action: "findBestMove",
            userId: userSocket.id,
            fen,
        };


        //try to find in book
        const opening = await openingsService.find(position.fen);

        if (opening) {
            console.log("Find in opening");
            userSocket.emit("openingMoves", {
                fen: position.fen, data: opening
            });
        } else {
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
                let evaluation = await positionService.findAllMoves(fen);

                if (evaluation === null) {

                    console.log("try nextchessmoveComService");
                    const result = await nextchessmoveComService.getResult(fen);

                    if (result && result.length > 0) {
                        console.log("I found it!!!!", result);

                        positionService.add(fen, result[0]);
                        userSocket.emit("workerEvaluation", JSON.stringify(result));

                        return;

                    }
                }

                //try to check portals with evaluations
                if (evaluation === null) {

                    const result = await chessgamesComService.getResult(fen);

                    if (result && result.length > 0) {
                        console.log("I found it!!!!", result);

                        positionService.add(fen, result[0]);

                        userSocket.emit("workerEvaluation", JSON.stringify(result));

                        return;

                    }
                }

                if (evaluation === null) {
                    console.log("Send the position to worker for evaluation.");

                    // @todo find BEST worker from you
                    let workerIo = findMyWorkerInSocketList(workersIo, userSocket.handshake.user.user_id);

                    // use temporary server worker
                    if (!workerIo) {
                        workerIo = findAvailableWorkerInSocketList(workersIo);
                        console.log("findAvailableWorkerInSocketList");
                    }

                    if (workerIo) {

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

                    const data = {
                        [LINE_MAP.score]: evaluation.score,
                        [LINE_MAP.depth]: evaluation.depth,
                        [LINE_MAP.pv]: evaluation.pv,
                        [LINE_MAP.nodes]: evaluation.nodes,
                        [LINE_MAP.time]: evaluation.time,
                        [LINE_MAP.tbhits]: evaluation.tbhits,
                        fen: fen,
                    };

                    console.log("data after normalizePv", data, data.p);
                    userSocket.emit("workerEvaluation", JSON.stringify([data]));
                }
            }
        }
    });
}
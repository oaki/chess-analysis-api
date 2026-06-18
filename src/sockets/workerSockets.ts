import positionService from "../services/positionService";
import {IEvaluation, IWorkerResponse} from "../interfaces";
import {logger} from "../libs/logger";

import forEach from "lodash/forEach";

export function workerSockets(workerSocket, usersIo, workerIo) {
    workerIo.push(workerSocket);
    logger.debug({socketId: workerSocket.id, total: workerIo.length}, "worker connected");

    workerSocket.on("workerEvaluation", (jsonString: string) => {
        const data = JSON.parse(jsonString);
        forEach(data, (workerResponse: IWorkerResponse) => {
            positionService.add(workerResponse.fen, workerResponse as IEvaluation);
        });
    });
}

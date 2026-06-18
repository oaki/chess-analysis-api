import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "../libs/findWorkerInSocketList";
import {logger} from "../libs/logger";

export function useWorkers(workersIo, userSocket, data, fen) {
    let workerIo = findMyWorkerInSocketList(workersIo, userSocket.handshake.user.user_id);

    if (!workerIo) {
        workerIo = findAvailableWorkerInSocketList(workersIo);
    }

    if (workerIo) {
        logger.debug({workerId: workerIo.id, workerUuid: workerIo.worker?.uuid}, "dispatching to worker");
        workerIo.worker.lastUsed = Date.now();
        workerIo.emit("stopWorker");
        workerIo.emit("setPositionToWorker", data);

        workerIo.on("workerEvaluation", (data) => {
            userSocket.emit("workerEvaluation", data);
        });
    } else {
        userSocket.emit("noWorkerAvailable", fen);
    }
}

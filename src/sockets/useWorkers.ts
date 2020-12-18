import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "../libs/findWorkerInSocketList";

export function useWorkers(workersIo, userSocket, data, fen) {
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
}
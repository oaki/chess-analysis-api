import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "../libs/findWorkerInSocketList";

function getAllWorkersId(workersIo){
    return workersIo.map(worker=>{
        return worker.id
    })
}
export function useWorkers(workersIo, userSocket, data, fen) {
    // @todo find BEST worker from you
    console.log('useWorkers->allAvailableWorkers', getAllWorkersId(workersIo));
    let workerIo = findMyWorkerInSocketList(workersIo, userSocket.handshake.user.user_id);

    // use temporary server worker
    if (!workerIo) {
        workerIo = findAvailableWorkerInSocketList(workersIo);
        console.log("findAvailableWorkerInSocketList", workerIo.id);
    }

    if (workerIo) {

        console.log("Your worker", workerIo.worker, userSocket.handshake.user);

        workerIo.worker.lastUsed = Date.now();
        console.log("choose worker with uuid", workerIo.worker.uuid);
        console.log("setPositionToWorker", data);
        workerIo.emit("setPositionToWorker", data);

        workerIo.on("workerEvaluation", (data) => {
            console.log("workerEvaluation", data);
            userSocket.emit("workerEvaluation", data);
        });

    } else {
        userSocket.emit("noWorkerAvailable", fen);
    }
}
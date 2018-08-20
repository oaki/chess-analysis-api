export function findMyWorkerInSocketList(list: any[], userId) {
    return list
        .find((socket) => socket.worker.user_id === userId);
}

export function findAvailableWorkerInSocketList(list: any[]) {

    return list.filter((socket) => {
        return !socket.worker.lastUsed || socket.worker.lastUsed < Date.now() - 60 * 1000
    });
}
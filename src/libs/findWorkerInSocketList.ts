export function findMyWorkerInSocketList(list: any[], userId) {
    return list
        .find((socket) => socket.worker.user.id === userId);
}

export function findAvailableWorkerInSocketList(list: any[]) {

    return list.find((socket) => {
        return !socket.worker.lastUsed || socket.worker.lastUsed < (Date.now() - 5 * 1000)
    });
}
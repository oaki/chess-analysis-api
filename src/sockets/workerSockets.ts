export default function (workerSocket, usersIo, workerIo) {
    workerIo.push(workerSocket);
    console.log('workerSocket.id added to list', workerSocket.id);

    workerSocket.on('workerEvaluation', (data) => {
        console.log('workerEvaluation', data);

    });


}
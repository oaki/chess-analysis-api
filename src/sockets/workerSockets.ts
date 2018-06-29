import positionService from "../services/positionService";
import {IEvaluation, IWorkerResponse} from "../interfaces";

const forEach = require('lodash/forEach');

export default function (workerSocket, usersIo, workerIo) {
    workerIo.push(workerSocket);
    console.log('workerSocket.id added to list', workerSocket.id);

    workerSocket.on('workerEvaluation', (jsonString: string) => {
        console.log('workerEvaluation', jsonString);
        const data = JSON.parse(jsonString);
        forEach(data, (workerResponse: IWorkerResponse) => {
            const fen = workerResponse.fen;
            const evaluation: IEvaluation = workerResponse;
            positionService.add(fen, evaluation);
        });
    });


}
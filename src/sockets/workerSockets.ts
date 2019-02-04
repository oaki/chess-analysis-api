import positionService from "../services/positionService";
import {IEvaluation, IWorkerResponse} from "../interfaces";

const forEach = require('lodash/forEach');

export default function (workerSocket, usersIo, workerIo) {
    workerIo.push(workerSocket);
    console.log("workerSocket.id added to list", workerSocket.id, Object.keys(workerIo));

    workerSocket.on('workerEvaluation', (jsonString: string) => {
        const data = JSON.parse(jsonString);
        console.log('workerEvaluation', data);
        forEach(data, (workerResponse: IWorkerResponse) => {
            const fen = workerResponse.fen;
            const evaluation: IEvaluation = workerResponse;
            positionService.add(fen, evaluation);
        });
    });


}
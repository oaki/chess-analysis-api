import positionService from "../../services/positionService";
import {IEvaluation, LINE_MAP} from "../../interfaces";
import {useWorkers} from "../useWorkers";
import openingsService, {OpeningResponse} from "../../services/openingsService";

function openingToEvaluation(fen: string, openings: OpeningResponse[]): IEvaluation[] {
    return openings.map((opening) => {
        return {
            [LINE_MAP.mate]: false,
            [LINE_MAP.score]: "0",
            [LINE_MAP.depth]: 0,
            [LINE_MAP.pv]: opening.move,
            [LINE_MAP.fen]: fen,
        }
    })
}

export async function engineStrategy(fen: string, userSocket, workersIo, data) {
    //try to find in book
    const opening = await openingsService.find(fen);

    if (opening) {
        userSocket.emit("workerEvaluation", JSON.stringify(openingToEvaluation(fen, opening)));
        return;
    }

    let evaluation = await positionService.findAllMoves(fen);
    if (evaluation) {
        const data = {
            [LINE_MAP.score]: evaluation.score,
            [LINE_MAP.depth]: evaluation.depth,
            [LINE_MAP.pv]: evaluation.pv,
            [LINE_MAP.nodes]: evaluation.nodes,
            [LINE_MAP.time]: evaluation.time,
            [LINE_MAP.tbhits]: evaluation.tbhits,
            fen: fen,
        };

        userSocket.emit("workerEvaluation", JSON.stringify([data]));
        return;
    }

    // try {
    //     const chessgamesComServiceResult = await chessgamesComService.getResult(fen);
    //
    //     if (chessgamesComServiceResult && chessgamesComServiceResult.length > 0) {
    //         positionService.add(fen, chessgamesComServiceResult[0]);
    //         userSocket.emit("workerEvaluation", JSON.stringify(chessgamesComServiceResult));
    //         return;
    //     }
    // } catch (err) {
    // }
    useWorkers(workersIo, userSocket, data, fen);
}
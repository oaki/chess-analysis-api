import positionService from "../../services/positionService";
import {IEvaluation, LINE_MAP} from "../../interfaces";
import {useWorkers} from "../useWorkers";
import openingsService, {OpeningResponse} from "../../services/openingsService";
import chessgamesComService from "../../services/chessgamesComService";
import {NextChessMoveComService} from "../../services/nextchessmoveComService";

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
    //     console.log("-----------------------------------------------------------");
    //     console.log("START use nextchessmoveComService");
    //     const nextchessmoveComServiceResult = await NextChessMoveComService.getResult(fen);
    //
    //     if (nextchessmoveComServiceResult && nextchessmoveComServiceResult.length > 0) {
    //
    //         positionService.add(fen, nextchessmoveComServiceResult[0]);
    //         userSocket.emit("workerEvaluation", JSON.stringify(nextchessmoveComServiceResult));
    //
    //         return;
    //
    //     }
    // } catch (err) {
    // }
    useWorkers(workersIo, userSocket, data, fen);
}
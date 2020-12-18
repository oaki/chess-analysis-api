import positionService from "../../services/positionService";
import {LINE_MAP} from "../../interfaces";
import chessgamesComService from "../../services/chessgamesComService";
import {useWorkers} from "../useWorkers";

export async function engineStrategy(fen: string, userSocket, workersIo, data) {
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

    try {
        const chessgamesComServiceResult = await chessgamesComService.getResult(fen);

        if (chessgamesComServiceResult && chessgamesComServiceResult.length > 0) {
            positionService.add(fen, chessgamesComServiceResult[0]);
            userSocket.emit("workerEvaluation", JSON.stringify(chessgamesComServiceResult));
            return;
        }
    } catch (err) {
    }
    useWorkers(workersIo, userSocket, data, fen);
}
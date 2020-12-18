import openingsService from "../services/openingsService";
import positionService from "../services/positionService";
import SyzygyService from "../services/syzygyService";
import {countPieces} from "../tools";
import {IEvaluation, LINE_MAP} from "../interfaces";
import chessgamesComService from "../services/chessgamesComService";
import {NextChessMoveComService} from "../services/nextchessmoveComService";
import {checkPreviousEvaluation} from "../libs/checkEvaluation";
import {engineStrategy} from "./evaluationStrategy/engineStrategy";
import {useWorkers} from "./useWorkers";


const Chess = require("chess.js").Chess;

const uuid = require("uuid/v1");

export default function (userSocket, usersIo, workersIo) {
    usersIo[userSocket.id] = userSocket;
    console.log("userSocket.id added to list", userSocket.id, Object.keys(usersIo));

    userSocket.on("setNewPosition", async (data) => {
        const processId = uuid();
        console.log("-----------------------------------------------------------");
        console.log("------------- START CHOOSE EVALUATION PROCESS -------------");
        console.log(`--------- processId=${processId} -------------`);
        console.log("2. server->socket: setNewPosition", data);
        const fen: string = data.FEN;
        const move: string = data.move;
        const previousEvaluation: IEvaluation = data.previousEvaluation;
        const mode: "engine" | "default" = data.mode || "default";

        const position = {
            action: "findBestMove",
            userId: userSocket.id,
            fen,
        };

        if(mode === 'engine'){
            await engineStrategy(position.fen, workersIo, userSocket, data);
            return;
        }

        //try to find in book
        const opening = await openingsService.find(position.fen);

        if (opening) {
            console.log(processId, "It is opening");
            userSocket.emit("openingMoves", {
                fen: position.fen, data: opening
            });
            return;
        }
        // if there is only 7 and less then try to load from end-game database

        if (countPieces(data.FEN) <= 7) {
            //https://tablebase.lichess.ovh/standard/mainline?fen=4k3/6KP/8/8/8/8/7p/8_w_-_-_0_1

            try {
                const syzygyData = await SyzygyService.find(fen);
                console.log("-----------------------------------------------------------");
                console.log(processId, "syzygyEvaluation");
                userSocket.emit("syzygyEvaluation", syzygyData);

                return;
            } catch (e) {

            }
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

            console.log("-----------------------------------------------------------");
            console.log(processId, "position service");
            userSocket.emit("workerEvaluation", JSON.stringify([data]));
            return;
        }
        // from FE will get previous evaluation and we check if the evaluation is good.
        // if it's good than it's strong (lot of nodes) than use workers

        if (previousEvaluation && checkPreviousEvaluation(fen, previousEvaluation)) {

            //check if previous evaluation is good but only score is not good than parse evaluation and send next moves back
            const pv = previousEvaluation[LINE_MAP.pv];
            if (pv) {
                const moves = pv.split(" ");
                if (moves.length > 0 && moves[0] === move) {
                    const newChess = new Chess(fen);
                    newChess.move(move);
                    const newFen = newChess.fen();
                    const newMoves = moves.slice(1);
                    const newNodes = Math.floor(previousEvaluation[LINE_MAP.nodes] - 25 * 1000 * 1000);
                    const newEvaluation = {...previousEvaluation};
                    newEvaluation[LINE_MAP.pv] = newMoves.join(" ");
                    newEvaluation[LINE_MAP.nodes] = newNodes;
                    newEvaluation[LINE_MAP.fen] = newFen;
                    userSocket.emit("workerEvaluation", JSON.stringify([newEvaluation]));
                    console.log("-----------------------------------------------------------");
                    console.log(processId, "use previous evaluation", newEvaluation);
                    return;
                }
            }

            console.log("-----------------------------------------------------------");
            console.log(processId, "use workers", previousEvaluation);
            useWorkers(workersIo, userSocket, data, fen);
            return;
        }

        try {
            const nextchessmoveComServiceResult = await NextChessMoveComService.getResult(fen);

            if (nextchessmoveComServiceResult && nextchessmoveComServiceResult.length > 0) {

                console.log("-----------------------------------------------------------");
                console.log(processId, "use nextchessmoveComService");
                positionService.add(fen, nextchessmoveComServiceResult[0]);
                userSocket.emit("workerEvaluation", JSON.stringify(nextchessmoveComServiceResult));

                return;

            }
        } catch (err) {
        }

        //try to check portals with evaluations

        try {
            const chessgamesComServiceResult = await chessgamesComService.getResult(fen);

            if (chessgamesComServiceResult && chessgamesComServiceResult.length > 0) {
                console.log("-----------------------------------------------------------");
                console.log(processId, "use chessgamesComService");
                positionService.add(fen, chessgamesComServiceResult[0]);
                userSocket.emit("workerEvaluation", JSON.stringify(chessgamesComServiceResult));
                return;
            }
        } catch (err) {
        }


        //"Send the position to worker for evaluation."

        console.log("-----------------------------------------------------------");
        console.log(processId, "USE WORKERS");
        useWorkers(workersIo, userSocket, data, fen);

    });
}


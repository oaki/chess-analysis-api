import openingsService from "../services/openingsService";
import positionService from "../services/positionService";
import SyzygyService from "../services/syzygyService";
import {countPieces} from "../tools";
import {IEvaluation, LINE_MAP} from "../interfaces";
import {checkPreviousEvaluation} from "../libs/checkEvaluation";
import {engineStrategy} from "./evaluationStrategy/engineStrategy";
import {useWorkers} from "./useWorkers";
import {logger} from "../libs/logger";

const Chess = require("chess.js").Chess;
const uuid = require("uuid/v1");

export default function (userSocket, usersIo, workersIo) {
    usersIo[userSocket.id] = userSocket;
    logger.debug({socketId: userSocket.id, total: Object.keys(usersIo).length}, "user connected");

    userSocket.on("setNewPosition", async (data) => {
        const processId = uuid();
        const fen: string = data.FEN;
        const move: string = data.move;
        const previousEvaluation: IEvaluation = data.previousEvaluation;
        const mode: "engine" | "default" = data.mode || "default";

        logger.debug({processId, fen, mode}, "setNewPosition");

        if (mode === "engine") {
            await engineStrategy(fen, userSocket, workersIo, data);
            return;
        }

        const opening = await openingsService.find(fen);
        if (opening) {
            logger.debug({processId}, "served from opening book");
            userSocket.emit("openingMoves", {fen, data: opening});
            return;
        }

        if (countPieces(data.FEN) <= 7) {
            try {
                const syzygyData = await SyzygyService.find(fen);
                logger.debug({processId}, "served from syzygy");
                userSocket.emit("syzygyEvaluation", syzygyData);
                return;
            } catch (e) {
                // syzygy unavailable — fall through
            }
        }

        const evaluation = await positionService.findAllMoves(fen);
        if (evaluation) {
            const response = {
                [LINE_MAP.score]: evaluation.score,
                [LINE_MAP.depth]: evaluation.depth,
                [LINE_MAP.pv]: evaluation.pv,
                [LINE_MAP.nodes]: evaluation.nodes,
                [LINE_MAP.time]: evaluation.time,
                [LINE_MAP.tbhits]: evaluation.tbhits,
                fen,
            };
            logger.debug({processId}, "served from position DB");
            userSocket.emit("workerEvaluation", JSON.stringify([response]));
            return;
        }

        if (previousEvaluation && checkPreviousEvaluation(fen, previousEvaluation)) {
            const pv = previousEvaluation[LINE_MAP.pv];
            if (pv) {
                const moves = pv.split(" ");
                if (moves.length > 0 && moves[0] === move) {
                    const newChess = new Chess(fen);
                    newChess.move(move);
                    const newEvaluation = {
                        ...previousEvaluation,
                        [LINE_MAP.pv]: moves.slice(1).join(" "),
                        [LINE_MAP.nodes]: Math.floor(previousEvaluation[LINE_MAP.nodes] - 25_000_000),
                        [LINE_MAP.fen]: newChess.fen(),
                    };
                    logger.debug({processId}, "reused previous evaluation");
                    userSocket.emit("workerEvaluation", JSON.stringify([newEvaluation]));
                    return;
                }
            }

            logger.debug({processId}, "forwarding to workers (prev eval acceptable)");
            useWorkers(workersIo, userSocket, data, fen);
            return;
        }

        logger.debug({processId}, "forwarding to workers");
        useWorkers(workersIo, userSocket, data, fen);
    });
}

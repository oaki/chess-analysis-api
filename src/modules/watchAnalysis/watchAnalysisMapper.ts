import {LINE_MAP} from "../../interfaces";

const Chess = require("chess.js").Chess;

export interface WatchAnalysisLine {
    rank: number;
    evaluation: {centipawns: {_0: number}} | {mateIn: {_0: number}};
    depth: number | null;
    moves: string[];
}

export interface WatchAnalysisResponse {
    requestID: string;
    lines: WatchAnalysisLine[];
    isFinal: boolean;
}

export function isValidAnalysisFen(fen: string): boolean {
    try {
        return new Chess().validate_fen(fen).valid === true;
    } catch (_) {
        return false;
    }
}

function principalVariationSan(fen: string, pv: string): string[] {
    const chess = new Chess(fen);
    const result: string[] = [];

    for (const coordinateMove of String(pv || "").trim().split(/\s+/).slice(0, 8)) {
        const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(coordinateMove);
        if (!match) {
            break;
        }

        const move = chess.move({
            from: match[1],
            to: match[2],
            promotion: match[3],
        });
        if (!move) {
            break;
        }
        result.push(move.san);
    }

    return result;
}

export function mapWorkerEvaluation(
    payload: string,
    fen: string,
    maxVariations: number,
): WatchAnalysisLine[] | null {
    let evaluations: any;
    try {
        evaluations = JSON.parse(payload);
    } catch (_) {
        return null;
    }

    if (!Array.isArray(evaluations)) {
        return null;
    }

    const whiteToMove = fen.split(/\s+/)[1] === "w";
    const perspective = whiteToMove ? 1 : -1;

    return evaluations
        .filter((evaluation) => evaluation && evaluation.fen === fen)
        .map((evaluation, index): WatchAnalysisLine | null => {
            const rank = Number(evaluation[LINE_MAP.multipv] || index + 1);
            const depth = Number(evaluation[LINE_MAP.depth]);
            const mate = Number(evaluation[LINE_MAP.mate]);
            const pawnScore = Number(evaluation[LINE_MAP.score]);

            if (!Number.isInteger(rank) || rank < 1 || rank > maxVariations) {
                return null;
            }

            const evaluationValue = evaluation[LINE_MAP.mate] !== false
                && evaluation[LINE_MAP.mate] !== "false"
                && Number.isFinite(mate)
                ? {mateIn: {_0: mate * perspective}}
                : Number.isFinite(pawnScore)
                    ? {centipawns: {_0: Math.round(pawnScore * 100) * perspective}}
                    : null;

            if (!evaluationValue) {
                return null;
            }

            return {
                rank,
                evaluation: evaluationValue,
                depth: Number.isFinite(depth) ? depth : null,
                moves: principalVariationSan(fen, evaluation[LINE_MAP.pv]),
            };
        })
        .filter((line): line is WatchAnalysisLine => line !== null)
        .sort((left, right) => left.rank - right.rank)
        .slice(0, maxVariations);
}

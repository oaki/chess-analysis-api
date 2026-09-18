import type {OpeningResponse} from "../../services/openingsService";
import {WatchAnalysisLine} from "./watchAnalysisMapper";

const Chess = require("chess.js").Chess;

export type MoveQuality = "best" | "good" | "risky" | "bad" | "unknown";

export interface MoveAdvice {
    uci: string;
    san: string;
    rank: number;
    evaluation?: WatchAnalysisLine["evaluation"];
    depth?: number;
    wdl?: {win: number; draw: number; loss: number};
    expectedScoreLoss?: number;
    quality: MoveQuality;
    hangsMaterial: boolean;
    capturedValue?: number;
    opening?: {weight: number; share: number};
}

export interface MoveAdviceResponse {
    requestID: string;
    fen: string;
    depth: number | null;
    moves: MoveAdvice[];
}

function uci(move: any): string {
    return `${move.from}${move.to}${move.promotion || ""}`;
}

function expectedScore(line: WatchAnalysisLine, whiteToMove: boolean): number {
    if (line.wdl) {
        return (line.wdl.win + 0.5 * line.wdl.draw) / 1000;
    }

    if ("mateIn" in line.evaluation) {
        const whiteMates = line.evaluation.mateIn._0 > 0;
        return whiteMates === whiteToMove ? 1 : 0;
    }

    const whiteCentipawns = line.evaluation.centipawns._0;
    const sideCentipawns = whiteCentipawns * (whiteToMove ? 1 : -1);
    return 1 / (1 + Math.exp(-sideCentipawns / 250));
}

function quality(loss: number | undefined): MoveQuality {
    if (loss === undefined) return "unknown";
    if (loss <= 0.01) return "best";
    if (loss <= 0.03) return "good";
    if (loss <= 0.08) return "risky";
    return "bad";
}

function capturedValueAfterBestReply(fen: string, pv: string[] | undefined): number | undefined {
    if (!pv || pv.length < 2) return undefined;
    const chess = new Chess(fen);
    const play = (coordinate: string) => {
        const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(coordinate);
        return match ? chess.move({from: match[1], to: match[2], promotion: match[3]}) : null;
    };
    if (!play(pv[0])) return undefined;
    const reply = play(pv[1]);
    if (!reply?.captured) return undefined;
    return {p: 1, n: 3, b: 3, r: 5, q: 9, k: 0}[reply.captured];
}

export function buildMoveAdvice(
    requestID: string,
    fen: string,
    lines: WatchAnalysisLine[],
    openings: OpeningResponse[],
): MoveAdviceResponse {
    const chess = new Chess(fen);
    const legalMoves = chess.moves({verbose: true});
    const whiteToMove = fen.split(/\s+/)[1] === "w";
    const linesByMove = new Map(lines.filter(line => line.uci).map(line => [line.uci, line]));
    const scores = lines.map(line => expectedScore(line, whiteToMove));
    const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;
    const totalOpeningWeight = openings.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const openingByMove = new Map(openings.map(item => [item.move, item]));

    const moves = legalMoves.map((legalMove): MoveAdvice => {
        const moveUci = uci(legalMove);
        const line = linesByMove.get(moveUci);
        const score = line ? expectedScore(line, whiteToMove) : undefined;
        const loss = score === undefined || bestScore === undefined
            ? undefined
            : Math.max(0, bestScore - score);
        const capturedValue = line ? capturedValueAfterBestReply(fen, line.pvUci) : undefined;
        const opening = openingByMove.get(moveUci);

        return {
            uci: moveUci,
            san: legalMove.san,
            rank: line?.rank ?? Number.MAX_SAFE_INTEGER,
            evaluation: line?.evaluation,
            depth: line?.depth ?? undefined,
            wdl: line?.wdl,
            expectedScoreLoss: loss === undefined ? undefined : Number(loss.toFixed(4)),
            quality: quality(loss),
            hangsMaterial: capturedValue !== undefined && (loss ?? 0) > 0.08,
            capturedValue,
            opening: opening ? {
                weight: Number(opening.weight),
                share: totalOpeningWeight > 0 ? Number(opening.weight) / totalOpeningWeight : 0,
            } : undefined,
        };
    }).sort((left, right) => {
        if (left.rank !== right.rank) return left.rank - right.rank;
        return left.uci.localeCompare(right.uci);
    });

    moves.forEach((move, index) => move.rank = index + 1);
    const depths = moves.map(move => move.depth).filter((depth): depth is number => depth !== undefined);
    return {
        requestID,
        fen,
        depth: depths.length > 0 ? Math.min(...depths) : null,
        moves,
    };
}

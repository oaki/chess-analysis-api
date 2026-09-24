import {IEvaluation, LINE_MAP} from "../interfaces";
import {evaluationConnection} from "../libs/connectEvaluationDatabase";
import {decodeFenHash} from "../libs/fenHash";
import {checkEvaluation, saveCriterium} from "../libs/checkEvaluation";
import {calculateComputeScore} from "../libs/computeScore";
import {decodePv, encodePv} from "../libs/moveEncoding";
import {
    BestMoveRecord,
    findBestMove,
    resolveEngineId,
    resolveSourceId,
    upsertBestMove,
} from "../modules/bestMoves/bestMovesRepository";

const LIVE_SEARCH_ENGINE_NAME = "Live Watch-Analyze Worker";
const LIVE_SEARCH_SOURCE_NAME = "live-watch-analyze";
const LIVE_SEARCH_CONFIRMATIONS = 1;

export type StoredPosition = {
    score: number;
    depth: number | null;
    pv: string;
    nodes: number;
    time: number;
    tbhits: number;
    import: boolean;
};

function toUciPv(pv: readonly number[]): string {
    return decodePv(pv).join(" ");
}

function toStoredPosition(record: BestMoveRecord): StoredPosition {
    return {
        score: record.evalCp / 100,
        depth: record.depth,
        pv: toUciPv(record.pv),
        nodes: record.nodes,
        time: record.timeMs,
        tbhits: 0,
        import: record.confirmations > LIVE_SEARCH_CONFIRMATIONS,
    };
}

function toFiniteOrNull(value: number): number | null {
    return Number.isFinite(value) ? value : null;
}

async function add(fen: string, evaluation: IEvaluation): Promise<void> {
    if (!checkEvaluation(fen, evaluation)) {
        return;
    }

    const db = await evaluationConnection();
    const positionKey = decodeFenHash(fen).toString();

    const nodes = evaluation[LINE_MAP.nodes] ?? 0;
    const timeMs = Number(evaluation[LINE_MAP.time] ?? "0");
    const evalCp = Math.round(Number(evaluation[LINE_MAP.score]) * 100);
    const depth = toFiniteOrNull(evaluation[LINE_MAP.depth]);
    const pvTokens = evaluation[LINE_MAP.pv].trim().split(/\s+/).filter((token) => token.length > 0);

    const [engineId, sourceId] = await Promise.all([
        resolveEngineId(db, LIVE_SEARCH_ENGINE_NAME),
        resolveSourceId(db, LIVE_SEARCH_SOURCE_NAME),
    ]);

    await upsertBestMove(db, {
        positionKey,
        pv: encodePv(pvTokens),
        evalCp,
        nodes,
        timeMs,
        depth,
        computeScore: calculateComputeScore(nodes, timeMs),
        engineId,
        sourceId,
        confirmations: LIVE_SEARCH_CONFIRMATIONS,
    });
}

async function findAllMoves(fen: string): Promise<StoredPosition | null> {
    const db = await evaluationConnection();
    const positionKey = decodeFenHash(fen).toString();
    const record = await findBestMove(db, positionKey);

    if (record === null) {
        return null;
    }

    return toStoredPosition(record);
}

async function findCompleteAnalysis(fen: string): Promise<IEvaluation | null> {
    const position = await findAllMoves(fen);

    if (position === null) {
        return null;
    }

    const isSufficientlyComputed = position.nodes >= saveCriterium.nodes
        || position.time >= saveCriterium.maxTimeMs
        || position.import;

    if (!isSufficientlyComputed) {
        return null;
    }

    return {
        [LINE_MAP.depth]: position.depth ?? 0,
        [LINE_MAP.score]: String(position.score),
        [LINE_MAP.nodes]: position.nodes,
        [LINE_MAP.time]: String(position.time),
        [LINE_MAP.pv]: position.pv,
        [LINE_MAP.tbhits]: String(position.tbhits),
        [LINE_MAP.import]: position.import ? 1 : 0,
        [LINE_MAP.mate]: false,
        [LINE_MAP.multipv]: "1",
        [LINE_MAP.fen]: fen,
    };
}

export default {
    findAllMoves,
    findCompleteAnalysis,
    add,
};

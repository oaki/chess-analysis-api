import {Connection} from "typeorm";
import {Chess} from "chess.js";
import {ParsePgn} from "../../../models/ParsePgn";
import {decodeFenHash} from "../../../libs/fenHash";
import {encodePv} from "../../../libs/moveEncoding";
import {calculateComputeScore} from "../../../libs/computeScore";
import {logger} from "../../../libs/logger";
import {resolveEngineId, resolveSourceId, upsertBestMove} from "../bestMovesRepository";
import {buildConsensus, MINIMUM_CONFIRMATIONS} from "./consensus";
import {DEFAULT_IMPORT_THRESHOLDS, evalPawnsToCentipawns, ImportThresholds, passesImportFilter} from "./importFilter";
import {isRawMoveMeta, ParsedObservation} from "./types";

const GAMES_SEPARATOR = "[Event ";

export function splitPgnGames(content: string): string[] {
    return content
        .split(GAMES_SEPARATOR)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0)
        .map((chunk) => `${GAMES_SEPARATOR}${chunk}`);
}

/**
 * Replays one TCEC-annotated game and turns every sufficiently-computed,
 * non-book, non-mate move into a ParsedObservation. Positions are tracked by
 * replaying the game with chess.js rather than trusting the `fen=` field in
 * each comment, because book-move comments don't carry one. `meta.pv` has
 * already been converted from SAN to space-separated UCI by
 * ParsePgn.parsePgnWithJson() (via prepareMoves/convertSanToDefaultMoveAnnotation
 * in libs/utils.ts) by the time it reaches this function.
 */
export function extractObservations(
    gameText: string,
    thresholds: ImportThresholds = DEFAULT_IMPORT_THRESHOLDS,
): ParsedObservation[] {
    const parser = new ParsePgn();
    const parsed = parser.parsePgnWithJson(gameText);
    const chess = new Chess();
    const observations: ParsedObservation[] = [];

    parsed.moves.forEach((moveEntry: {move: string; meta: unknown}, index: number) => {
        const fenBeforeMove: string = chess.fen();
        const isWhiteToMove = index % 2 === 0;
        const engineName: string = isWhiteToMove ? parsed.meta.whiteName : parsed.meta.blackName;

        if (isRawMoveMeta(moveEntry.meta) && passesImportFilter(moveEntry.meta, thresholds)) {
            // meta.pv only ever reaches here already-converted to a non-empty
            // UCI string — ParsePgn.parsePgnWithJson() throws first if the SAN
            // it started from couldn't be replayed (caught by the caller).
            const pvUci = moveEntry.meta.pv.trim().split(/\s+/);

            observations.push({
                positionKey: decodeFenHash(fenBeforeMove).toString(),
                uciMove: pvUci[0],
                pvUci,
                engineName,
                nodes: Number(moveEntry.meta.n),
                timeMs: Number(moveEntry.meta.mt),
                depth: Number(moveEntry.meta.d),
                evalCp: evalPawnsToCentipawns(moveEntry.meta.wv),
            });
        }

        chess.move(moveEntry.move, {sloppy: true});
    });

    return observations;
}

export type ImportSummary = {
    gamesParsed: number;
    observations: number;
    positionsWritten: number;
};

export async function importPgnContent(
    db: Connection,
    sourceName: string,
    content: string,
    thresholds: ImportThresholds = DEFAULT_IMPORT_THRESHOLDS,
    minConfirmations: number = MINIMUM_CONFIRMATIONS,
): Promise<ImportSummary> {
    const games = splitPgnGames(content);
    const observations = games.flatMap((game) => {
        try {
            return extractObservations(game, thresholds);
        } catch (error) {
            logger.warn({err: error}, "failed to parse a game during best-move import, skipping it");
            return [];
        }
    });

    const consensus = buildConsensus(observations, minConfirmations);
    const sourceId = await resolveSourceId(db, sourceName);
    const engineIdByName = new Map<string, number>();

    for (const result of consensus) {
        const {engineName} = result.representative;
        let engineId = engineIdByName.get(engineName);

        if (engineId === undefined) {
            engineId = await resolveEngineId(db, engineName);
            engineIdByName.set(engineName, engineId);
        }

        const {representative} = result;

        await upsertBestMove(db, {
            positionKey: result.positionKey,
            pv: encodePv(representative.pvUci),
            evalCp: representative.evalCp,
            nodes: representative.nodes,
            timeMs: representative.timeMs,
            depth: representative.depth,
            computeScore: calculateComputeScore(representative.nodes, representative.timeMs),
            engineId,
            sourceId,
            confirmations: result.confirmations,
        });
    }

    return {
        gamesParsed: games.length,
        observations: observations.length,
        positionsWritten: consensus.length,
    };
}

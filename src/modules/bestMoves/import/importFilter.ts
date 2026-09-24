import {RawMoveMeta} from "./types";

export type ImportThresholds = {
    minNodes: number;
    maxAbsEvalCp: number;
};

/**
 * 50M nodes is a starting point (see docs/adr/0001-best-moves-cache.md) —
 * expected to be revisited once the first import's node-count distribution
 * is known.
 */
export const DEFAULT_IMPORT_THRESHOLDS: ImportThresholds = {
    minNodes: 50_000_000,
    maxAbsEvalCp: 250,
};

export function isMateScore(wv: string): boolean {
    return wv.startsWith("M");
}

export function evalPawnsToCentipawns(wv: string): number {
    return Math.round(Number(wv) * 100);
}

/**
 * TCEC opening-book moves carry a `{book, ...}` comment with none of these
 * fields, so a plain field check already excludes them — see
 * src/modules/bestMoves/import/pgnBestMovesImporter.ts and the ADR.
 */
export function passesImportFilter(meta: RawMoveMeta, thresholds: ImportThresholds): boolean {
    if (isMateScore(meta.wv)) {
        return false;
    }

    const nodes = Number(meta.n);
    const evalCp = evalPawnsToCentipawns(meta.wv);

    if (!Number.isFinite(nodes) || !Number.isFinite(evalCp)) {
        return false;
    }

    if (nodes < thresholds.minNodes) {
        return false;
    }

    return Math.abs(evalCp) <= thresholds.maxAbsEvalCp;
}

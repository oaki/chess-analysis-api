import {ParsedObservation} from "./types";

export type ConsensusResult = {
    positionKey: string;
    confirmations: number;
    representative: ParsedObservation;
};

/**
 * Default: at least two independently-developed engines must agree, or the
 * position doesn't count as "we have good reason to trust this move" — see
 * docs/adr/0001-best-moves-cache.md. A caller importing from a source that
 * structurally can't produce two agreeing engines (e.g. a TCEC superfinal,
 * which is a head-to-head match between exactly two engines — see
 * ADR follow-up) may lower this, accepting a single engine's move as long as
 * it still cleared the import filter's node/eval thresholds.
 */
export const MINIMUM_CONFIRMATIONS = 2;

function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const item of items) {
        const key = keyOf(item);
        const bucket = groups.get(key);

        if (bucket === undefined) {
            groups.set(key, [item]);
        } else {
            bucket.push(item);
        }
    }

    return groups;
}

function pickRepresentative(observations: readonly ParsedObservation[]): ParsedObservation {
    return observations.reduce((best, current) => (current.nodes > best.nodes ? current : best));
}

/**
 * Groups observations by position, then by the move each engine chose from
 * it. A position where independent engines disagree is dropped entirely
 * rather than guessed — this is the "don't guess conflicts" rule from the
 * proposal that started this design.
 */
export function buildConsensus(
    observations: readonly ParsedObservation[],
    minConfirmations: number = MINIMUM_CONFIRMATIONS,
): ConsensusResult[] {
    const results: ConsensusResult[] = [];
    const byPosition = groupBy(observations, (observation) => observation.positionKey);

    for (const [positionKey, positionObservations] of byPosition) {
        const byMove = groupBy(positionObservations, (observation) => observation.uciMove);

        if (byMove.size !== 1) {
            continue;
        }

        const [agreeing] = [...byMove.values()];
        const distinctEngines = new Set(agreeing.map((observation) => observation.engineName));

        if (distinctEngines.size < minConfirmations) {
            continue;
        }

        results.push({
            positionKey,
            confirmations: distinctEngines.size,
            representative: pickRepresentative(agreeing),
        });
    }

    return results;
}

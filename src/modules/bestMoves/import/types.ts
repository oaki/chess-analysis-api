export type ParsedObservation = {
    positionKey: string;
    uciMove: string;
    pvUci: readonly string[];
    engineName: string;
    nodes: number;
    timeMs: number;
    depth: number | null;
    evalCp: number;
};

/**
 * Field names match the TCEC PGN comment format verbatim (see
 * games/evaluation/superfinal15.pgn), e.g.
 * {d=19, sd=57, mt=101451, tl=7108549, s=53207, n=5397474, pv=Na6 g4 Nc5 ...,
 *  tb=0, h=14.2, ph=0.0, wv=0.79, R50=49, ...}
 * `pv` is SAN, not UCI — TCEC's `pvl` (long algebraic) field isn't present in
 * this data source, so the importer converts `pv` to UCI itself by replaying
 * it with chess.js from the position it starts at.
 */
export type RawMoveMeta = {
    d: string;
    n: string;
    mt: string;
    wv: string;
    pv: string;
};

export function isRawMoveMeta(value: unknown): value is RawMoveMeta {
    return (
        typeof value === "object"
        && value !== null
        && "d" in value && typeof value.d === "string" && value.d.length > 0
        && "n" in value && typeof value.n === "string" && value.n.length > 0
        && "mt" in value && typeof value.mt === "string" && value.mt.length > 0
        && "wv" in value && typeof value.wv === "string" && value.wv.length > 0
        && "pv" in value && typeof value.pv === "string" && value.pv.length > 0
    );
}

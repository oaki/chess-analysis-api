import {beforeEach, describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
    mockResolveEngineId: vi.fn(),
    mockResolveSourceId: vi.fn(),
    mockUpsertBestMove: vi.fn(),
}));

vi.mock("../bestMovesRepository", () => ({
    resolveEngineId: mocks.mockResolveEngineId,
    resolveSourceId: mocks.mockResolveSourceId,
    upsertBestMove: mocks.mockUpsertBestMove,
}));

// The real polyglot module mixes require() with hardcoded ".js" extensions
// that only resolve after a tsc build, not against source — every other
// test touching fenHash mocks it out for the same reason. Here it's a
// deterministic passthrough so position-key equality is still meaningful.
vi.mock("../../../libs/fenHash", () => ({
    decodeFenHash: (fen: string) => fen,
}));

import {extractObservations, importPgnContent, splitPgnGames} from "./pgnBestMovesImporter";

const Chess = require("chess.js").Chess;

// meta.pv is SAN here, same as the real games/evaluation/superfinal15.pgn —
// ParsePgn.parsePgnWithJson() converts it to UCI internally before this
// module ever sees it (see pgnBestMovesImporter.ts's docblock). Each pv
// string must be legal chess notation for whichever side is to move at that
// point, or parsing the whole game throws (ParsePgn's prepareMoves replays
// pv eagerly for every annotated move, not just the ones this importer keeps).
function gameText(white: string, black: string, whiteMoveComment: string, blackMoveComment: string): string {
    return `[Event "Test"]
[White "${white}"]
[Black "${black}"]
[Result "1-0"]

1. d4 {book, mb=+0+0+0+0+0,} Nf6 {book, mb=+0+0+0+0+0,}
2. c4 {${whiteMoveComment}} g6 {${blackMoveComment}}
`;
}

const WHITE_C4_COMMENT = "d=30, n=60000000, mt=25000, wv=0.20, pv=c4 g6,";
const BLACK_G6_COMMENT = "d=30, n=60000000, mt=25000, wv=-0.10, pv=g6 Nc3,";
const BLACK_G6_MATE_COMMENT = "d=30, n=60000000, mt=25000, wv=M5, pv=g6,";
const UNDER_THRESHOLD_COMMENT = "d=30, n=1000, mt=25000, wv=0.20, pv=c4,";
const UNDER_THRESHOLD_REPLY_COMMENT = "d=30, n=1000, mt=20000, wv=-0.10, pv=g6,";

describe("splitPgnGames", () => {
    it("splits a multi-game PGN blob back into individual [Event ...] games", () => {
        const blob = `${gameText("A", "B", UNDER_THRESHOLD_COMMENT, UNDER_THRESHOLD_REPLY_COMMENT)}\n${
            gameText("C", "D", UNDER_THRESHOLD_COMMENT, UNDER_THRESHOLD_REPLY_COMMENT)}`;

        const games = splitPgnGames(blob);

        expect(games).toHaveLength(2);
        expect(games[0]).toContain("[White \"A\"]");
        expect(games[1]).toContain("[White \"C\"]");
        games.forEach((game) => expect(game.startsWith("[Event ")).toBe(true));
    });
});

describe("extractObservations", () => {
    it("skips book moves and mate scores, keeping only the move that clears the filter", () => {
        const game = gameText("Stockfish 19", "Stockfish 18", WHITE_C4_COMMENT, BLACK_G6_MATE_COMMENT);

        const observations = extractObservations(game);

        expect(observations).toHaveLength(1);
        expect(observations[0]).toMatchObject({
            uciMove: "c2c4",
            engineName: "Stockfish 19",
            nodes: 60_000_000,
            timeMs: 25_000,
            depth: 30,
            evalCp: 20,
        });

        const chess = new Chess();
        chess.move("d4");
        chess.move("Nf6");
        expect(observations[0].positionKey).toBe(chess.fen());
    });

    it("keeps both sides' moves when both clear the filter", () => {
        const game = gameText("Stockfish 19", "Stockfish 18", WHITE_C4_COMMENT, BLACK_G6_COMMENT);

        const observations = extractObservations(game);

        expect(observations).toHaveLength(2);
        expect(observations[1]).toMatchObject({uciMove: "g7g6", engineName: "Stockfish 18"});
    });

    it("produces no observations when every move is book or under threshold", () => {
        const game = gameText("Stockfish 19", "Stockfish 18", UNDER_THRESHOLD_COMMENT, UNDER_THRESHOLD_REPLY_COMMENT);

        expect(extractObservations(game)).toEqual([]);
    });
});

describe("importPgnContent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockResolveSourceId.mockResolvedValue(1);
        mocks.mockResolveEngineId.mockImplementation((_db: unknown, name: string) => Promise.resolve(
            name === "Stockfish 19" ? 10 : 20,
        ));
    });

    it("writes a consensus position once two engines independently reach and agree on it", async () => {
        // Black's reply is left as a mate score so only White's c4 reaches
        // consensus, keeping this test focused on a single write.
        const blob = `${gameText("Stockfish 19", "Berserk", WHITE_C4_COMMENT, BLACK_G6_MATE_COMMENT)}\n${
            gameText("Stockfish 18", "Rival", WHITE_C4_COMMENT, BLACK_G6_MATE_COMMENT)}`;

        const db = {} as never;
        const summary = await importPgnContent(db, "TCEC", blob);

        expect(summary.gamesParsed).toBe(2);
        expect(summary.positionsWritten).toBe(1);
        expect(mocks.mockUpsertBestMove).toHaveBeenCalledTimes(1);

        const [, write] = mocks.mockUpsertBestMove.mock.calls[0];
        expect(write.confirmations).toBe(2);
        expect(write.sourceId).toBe(1);
    });

    it("resolves each distinct engine only once across multiple confirmed positions", async () => {
        // Two independent openings (different positions), each confirmed by
        // Stockfish 19 as the representative (highest nodes) engine — the
        // second position's lookup should hit the in-batch engine-id cache
        // instead of resolving "Stockfish 19" again.
        const openingA = (white: string, black: string, comment: string, reply: string): string => `[Event "Test"]
[White "${white}"]
[Black "${black}"]
[Result "1-0"]

1. d4 {book, mb=+0+0+0+0+0,} Nf6 {book, mb=+0+0+0+0+0,}
2. c4 {${comment}} g6 {${reply}}
`;
        const openingB = (white: string, black: string, comment: string, reply: string): string => `[Event "Test"]
[White "${white}"]
[Black "${black}"]
[Result "1-0"]

1. e4 {book, mb=+0+0+0+0+0,} e5 {book, mb=+0+0+0+0+0,}
2. Nf3 {${comment}} Nc6 {${reply}}
`;
        const commentHigh = "d=30, n=90000000, mt=30000, wv=0.10, pv=Nf3,";
        const commentLow = "d=30, n=60000000, mt=30000, wv=0.10, pv=Nf3,";
        // Below the node threshold on purpose, and "Nc6" is legal as White's
        // reply-comment pv in both openings (from either "d4 Nf6 c4" or
        // "e4 e5 Nf3", the b8 knight can always reach c6) even though it
        // never gets read: only White's move reaches consensus here.
        const quietReply = "d=30, n=1000, mt=20000, wv=-0.10, pv=Nc6,";

        const blob = [
            openingA("Stockfish 19", "Berserk", commentHigh, quietReply),
            openingA("Stockfish 18", "Rival", commentLow, quietReply),
            openingB("Stockfish 19", "Komodo", commentHigh, quietReply),
            openingB("Stockfish 17.1", "Ethereal", commentLow, quietReply),
        ].join("\n");

        const db = {} as never;
        const summary = await importPgnContent(db, "TCEC", blob);

        expect(summary.positionsWritten).toBe(2);
        expect(mocks.mockResolveEngineId).toHaveBeenCalledTimes(1);
        expect(mocks.mockResolveEngineId).toHaveBeenCalledWith(db, "Stockfish 19");
    });

    it("skips a game it can't parse and still processes the rest of the batch", async () => {
        const brokenGame = "[Event \"Missing the blank line that separates header from moves\"";
        const blob = `${brokenGame}\n${
            gameText("Stockfish 19", "Berserk", WHITE_C4_COMMENT, BLACK_G6_MATE_COMMENT)}\n${
            gameText("Stockfish 18", "Rival", WHITE_C4_COMMENT, BLACK_G6_MATE_COMMENT)}`;

        const db = {} as never;
        const summary = await importPgnContent(db, "TCEC", blob);

        expect(summary.gamesParsed).toBe(3);
        expect(summary.positionsWritten).toBe(1);
    });

    it("writes nothing when only one engine's opinion is available", async () => {
        const blob = gameText("Stockfish 19", "Berserk", WHITE_C4_COMMENT, BLACK_G6_COMMENT);

        const db = {} as never;
        const summary = await importPgnContent(db, "TCEC", blob);

        expect(summary.positionsWritten).toBe(0);
        expect(mocks.mockUpsertBestMove).not.toHaveBeenCalled();
    });

    it("accepts single-engine positions when minConfirmations is lowered to 1 (e.g. a TCEC superfinal)", async () => {
        // A superfinal is a head-to-head match between exactly two engines,
        // so cross-engine agreement on an identical position is rare to
        // nonexistent — this is the real-world case that motivated making
        // minConfirmations configurable per import (see ADR follow-up).
        const blob = gameText("Stockfish 19", "Berserk", WHITE_C4_COMMENT, BLACK_G6_COMMENT);

        const db = {} as never;
        const summary = await importPgnContent(db, "TCEC", blob, undefined, 1);

        expect(summary.positionsWritten).toBe(2);
        expect(mocks.mockUpsertBestMove).toHaveBeenCalledTimes(2);
        const [, firstWrite] = mocks.mockUpsertBestMove.mock.calls[0];
        expect(firstWrite.confirmations).toBe(1);
    });
});

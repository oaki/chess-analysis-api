import {describe, expect, it} from "vitest";
import {isValidAnalysisFen, mapWorkerEvaluation} from "./watchAnalysisMapper";

const whiteFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const blackFen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

describe("watchAnalysisMapper", () => {
    it("validates complete FEN strings", () => {
        expect(isValidAnalysisFen(whiteFen)).toBe(true);
        expect(isValidAnalysisFen("not-a-fen")).toBe(false);
    });

    it("maps worker centipawns and coordinate PV to the Swift wire format", () => {
        const result = mapWorkerEvaluation(JSON.stringify([
            {fen: whiteFen, u: "1", d: "18", s: 0.35, m: false, p: "e2e4 e7e5 g1f3"},
            {fen: whiteFen, u: "2", d: "17", s: -0.12, m: "false", p: "d2d4 d7d5"},
        ]), whiteFen, 2);

        expect(result).toEqual([
            {
                rank: 1,
                evaluation: {centipawns: {_0: 35}},
                depth: 18,
                moves: ["e4", "e5", "Nf3"],
                uci: "e2e4",
                wdl: undefined,
                pvUci: ["e2e4", "e7e5", "g1f3"],
            },
            {
                rank: 2,
                evaluation: {centipawns: {_0: -12}},
                depth: 17,
                moves: ["d4", "d5"],
                uci: "d2d4",
                wdl: undefined,
                pvUci: ["d2d4", "d7d5"],
            },
        ]);
    });

    it("normalizes a mate score to White's perspective", () => {
        const result = mapWorkerEvaluation(JSON.stringify([
            {fen: blackFen, u: "1", d: "20", s: null, m: "3", p: "g8f6"},
        ]), blackFen, 1);

        expect(result?.[0].evaluation).toEqual({mateIn: {_0: -3}});
    });

    it("ignores malformed, stale, and out-of-range worker data", () => {
        expect(mapWorkerEvaluation("not-json", whiteFen, 3)).toBeNull();
        expect(mapWorkerEvaluation(JSON.stringify({}), whiteFen, 3)).toBeNull();
        expect(mapWorkerEvaluation(JSON.stringify([
            {fen: blackFen, u: "1", d: "1", s: 0, m: false, p: "e7e5"},
            {fen: whiteFen, u: "4", d: "1", s: 0, m: false, p: "e2e4"},
            {fen: whiteFen, u: "1", d: "bad", s: "bad", m: false, p: "bad"},
        ]), whiteFen, 3)).toEqual([]);
    });
});

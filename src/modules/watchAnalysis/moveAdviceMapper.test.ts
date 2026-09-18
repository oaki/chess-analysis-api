import {describe, expect, it} from "vitest";
import {buildMoveAdvice} from "./moveAdviceMapper";

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("buildMoveAdvice", () => {
    it("orders engine moves and overlays opening shares", () => {
        const result = buildMoveAdvice("request", fen, [
            {
                rank: 1,
                evaluation: {centipawns: {_0: 30}},
                depth: 10,
                moves: ["e4"],
                uci: "e2e4",
                pvUci: ["e2e4", "e7e5"],
                wdl: {win: 200, draw: 700, loss: 100},
            },
            {
                rank: 2,
                evaluation: {centipawns: {_0: 10}},
                depth: 10,
                moves: ["d4"],
                uci: "d2d4",
                pvUci: ["d2d4", "d7d5"],
                wdl: {win: 150, draw: 700, loss: 150},
            },
        ], [
            {move: "e2e4", san: "e4", fen, weight: "60"},
            {move: "d2d4", san: "d4", fen, weight: "40"},
        ]);

        expect(result.moves[0]).toMatchObject({
            uci: "e2e4",
            rank: 1,
            quality: "best",
            expectedScoreLoss: 0,
            opening: {weight: 60, share: 0.6},
        });
        expect(result.moves[1]).toMatchObject({
            uci: "d2d4",
            rank: 2,
            quality: "risky",
            expectedScoreLoss: 0.05,
        });
        expect(result.moves).toHaveLength(20);
        expect(result.moves.at(-1)?.quality).toBe("unknown");
    });

    it("marks an immediately captured piece only when the engine loss is bad", () => {
        const tacticalFen = "3rk3/8/8/8/4Q3/8/8/4K3 w - - 0 1";
        const result = buildMoveAdvice("request", tacticalFen, [
            {
                rank: 1,
                evaluation: {centipawns: {_0: 300}},
                depth: 10,
                moves: ["Qe3"],
                uci: "e4e3",
                pvUci: ["e4e3", "e8f7"],
                wdl: {win: 800, draw: 150, loss: 50},
            },
            {
                rank: 2,
                evaluation: {centipawns: {_0: -400}},
                depth: 10,
                moves: ["Qd4", "exd4"],
                uci: "e4d4",
                pvUci: ["e4d4", "d8d4"],
                wdl: {win: 50, draw: 100, loss: 850},
            },
        ], []);

        expect(result.moves.find(move => move.uci === "e4d4")).toMatchObject({
            quality: "bad",
            hangsMaterial: true,
            capturedValue: 9,
        });
    });
});

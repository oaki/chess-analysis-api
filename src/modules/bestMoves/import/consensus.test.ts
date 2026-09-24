import {describe, expect, it} from "vitest";
import {buildConsensus} from "./consensus";
import {ParsedObservation} from "./types";

function makeObservation(overrides: Partial<ParsedObservation> = {}): ParsedObservation {
    return {
        positionKey: "position-a",
        uciMove: "e2e4",
        pvUci: ["e2e4", "e7e5"],
        engineName: "Stockfish 19",
        nodes: 100_000_000,
        timeMs: 30_000,
        depth: 30,
        evalCp: 20,
        ...overrides,
    };
}

describe("buildConsensus", () => {
    it("writes nothing for a position only one engine has an opinion on", () => {
        const results = buildConsensus([makeObservation()]);
        expect(results).toEqual([]);
    });

    it("confirms a position where two distinct engines agree", () => {
        const results = buildConsensus([
            makeObservation({engineName: "Stockfish 19", nodes: 3_800_000_000}),
            makeObservation({engineName: "Stockfish 18", nodes: 7_100_000_000}),
        ]);

        expect(results).toHaveLength(1);
        expect(results[0].confirmations).toBe(2);
        expect(results[0].positionKey).toBe("position-a");
    });

    it("picks the highest-nodes observation among the agreeing engines as representative", () => {
        const results = buildConsensus([
            makeObservation({engineName: "Stockfish 19", nodes: 3_800_000_000}),
            makeObservation({engineName: "Stockfish 18", nodes: 7_100_000_000}),
            makeObservation({engineName: "Stockfish 18-dev", nodes: 2_400_000_000}),
        ]);

        expect(results[0].confirmations).toBe(3);
        expect(results[0].representative.engineName).toBe("Stockfish 18");
        expect(results[0].representative.nodes).toBe(7_100_000_000);
    });

    it("drops a position entirely when engines disagree on the best move", () => {
        const results = buildConsensus([
            makeObservation({engineName: "Stockfish 19", uciMove: "e2e4"}),
            makeObservation({engineName: "Stockfish 18", uciMove: "d2d4"}),
        ]);

        expect(results).toEqual([]);
    });

    it("does not let the same engine appearing twice count as two confirmations", () => {
        const results = buildConsensus([
            makeObservation({engineName: "Stockfish 19", nodes: 1_000_000_000}),
            makeObservation({engineName: "Stockfish 19", nodes: 2_000_000_000}),
        ]);

        expect(results).toEqual([]);
    });

    it("accepts a single engine's opinion when minConfirmations is lowered to 1", () => {
        const results = buildConsensus([makeObservation({engineName: "Stockfish 19"})], 1);

        expect(results).toHaveLength(1);
        expect(results[0].confirmations).toBe(1);
    });

    it("keeps positions independent of each other", () => {
        const results = buildConsensus([
            makeObservation({positionKey: "position-a", engineName: "Stockfish 19"}),
            makeObservation({positionKey: "position-a", engineName: "Stockfish 18"}),
            makeObservation({positionKey: "position-b", engineName: "Stockfish 19", uciMove: "d2d4"}),
        ]);

        expect(results).toHaveLength(1);
        expect(results[0].positionKey).toBe("position-a");
    });
});

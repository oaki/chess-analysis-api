import {describe, expect, it} from "vitest";
import {countPieces, getFirstMove, pairValues} from "./tools";

describe("tools", () => {
    it("pairValues returns value for regular key", () => {
        const line = "info depth 22 nodes 109243";
        expect(pairValues("depth", line)).toBe("22");
    });

    it("pairValues returns full pv sequence", () => {
        const line = "info depth 22 pv e2e4 e7e5 g1f3";
        expect(pairValues("pv", line)).toBe("e2e4 e7e5 g1f3");
    });

    it("pairValues returns undefined when key is missing", () => {
        const line = "info depth 22 nodes 109243";
        expect(pairValues("mate", line)).toBeUndefined();
    });

    it("countPieces counts pieces in FEN", () => {
        expect(countPieces("8/8/8/8/8/8/8/8 w - - 0 1")).toBe(0);
        expect(countPieces("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(32);
    });

    it("getFirstMove returns first move from pv", () => {
        expect(getFirstMove("e2e4 e7e5 g1f3")).toBe("e2e4");
    });
});

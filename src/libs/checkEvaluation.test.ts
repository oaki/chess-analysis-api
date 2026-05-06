import {describe, expect, it} from "vitest";
import {checkEvaluation, checkPreviousEvaluation} from "./checkEvaluation";
import {LINE_MAP} from "../interfaces";

function makeEvaluation(overrides: Record<string, any> = {}) {
    return {
        [LINE_MAP.depth]: 30,
        [LINE_MAP.nodes]: 90000000,
        [LINE_MAP.score]: "2.1",
        [LINE_MAP.pv]: "e2e4 e7e5",
        [LINE_MAP.mate]: false,
        ...overrides,
    } as any;
}

describe("checkEvaluation", () => {
    const richFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const sparseFen = "8/8/8/8/8/8/8/K6k w - - 0 1";

    it("returns true for strong non-mate evaluation with enough nodes", () => {
        expect(checkEvaluation(richFen, makeEvaluation())).toBe(true);
    });

    it("returns false when position has too few pieces", () => {
        expect(checkEvaluation(sparseFen, makeEvaluation())).toBe(false);
    });

    it("returns false when pv is missing", () => {
        expect(checkEvaluation(richFen, makeEvaluation({[LINE_MAP.pv]: ""}))).toBe(false);
    });

    it("returns false when mate is present", () => {
        expect(checkEvaluation(richFen, makeEvaluation({[LINE_MAP.mate]: "3"}))).toBe(false);
    });

    it("respects useScore option", () => {
        const highScoreEval = makeEvaluation({[LINE_MAP.score]: "10"});
        expect(checkEvaluation(richFen, highScoreEval, {useScore: true})).toBe(false);
        expect(checkEvaluation(richFen, highScoreEval, {useScore: false})).toBe(true);
    });

    it("returns true when import flag is present even with low nodes", () => {
        const imported = makeEvaluation({[LINE_MAP.nodes]: 10, [LINE_MAP.import]: 1});
        expect(checkEvaluation(richFen, imported)).toBe(true);
    });
});

describe("checkPreviousEvaluation", () => {
    const richFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    it("returns true for high score and enough nodes", () => {
        const evaluation = makeEvaluation({[LINE_MAP.score]: "4.5"});
        expect(checkPreviousEvaluation(richFen, evaluation)).toBe(true);
    });

    it("returns false for low score", () => {
        const evaluation = makeEvaluation({[LINE_MAP.score]: "2.9"});
        expect(checkPreviousEvaluation(richFen, evaluation)).toBe(false);
    });
});

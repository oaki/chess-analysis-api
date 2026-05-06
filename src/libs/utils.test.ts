import {beforeEach, describe, expect, it, vi} from "vitest";
import {
    calculationGameCoefficient,
    convertResult,
    convertSanToDefaultMoveAnnotation,
    generatePgn,
    getAllMatches,
    prepareMoves,
    Result,
} from "./utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("utils", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("generatePgn creates pgn with numbered moves and result", () => {
        const pgn = generatePgn([
            {move: "e4", meta: {pv: ""}},
            {move: "e5", meta: {pv: ""}},
            {move: "Nf3", meta: {pv: ""}},
        ]);

        expect(pgn).toContain("1. e4 e5 2. Nf3 ");
        expect(pgn.trimEnd()).toMatch(/1-0$/);
    });

    it("prepareMoves clones moves and converts pv to coordinate format", () => {
        const input = [{move: "e4", meta: {pv: "e4 e5"}}];

        const output = prepareMoves(input);

        expect(output).not.toBe(input);
        expect(output[0]).not.toBe(input[0]);
        expect(output[0].meta.pv).toBe("e2e4 e7e5");
    });

    it("prepareMoves throws for invalid move", () => {
        expect(() => prepareMoves([{move: "not-a-move", meta: {pv: ""}}])).toThrow(
            "Move is not valid: not-a-move",
        );
    });

    it("convertSanToDefaultMoveAnnotation converts san sequence", () => {
        const result = convertSanToDefaultMoveAnnotation("e4 e5 Nf3", START_FEN);
        expect(result).toBe("e2e4 e7e5 g1f3");
    });

    it("convertSanToDefaultMoveAnnotation returns empty input unchanged", () => {
        expect(convertSanToDefaultMoveAnnotation("", "start")).toBe("");
    });

    it("convertSanToDefaultMoveAnnotation throws for invalid move", () => {
        expect(() => convertSanToDefaultMoveAnnotation("e4 ???", START_FEN)).toThrow(
            "Move does not exist: ???",
        );
    });

    it("getAllMatches returns matches with offsets and groups", () => {
        const matches = getAllMatches("ab12 cd34", /([a-z]+)(\d+)/g);
        expect(matches).toEqual([
            {match: "ab12", offset: 0, groups: ["ab", "12"]},
            {match: "cd34", offset: 5, groups: ["cd", "34"]},
        ]);
    });

    it("calculationGameCoefficient covers white outcomes", () => {
        expect(calculationGameCoefficient("w", Result["1-0"], 3500, 3500)).toBe(500);
        expect(calculationGameCoefficient("w", Result["1/2-1/2"], 3500, 3500)).toBe(700);
        expect(calculationGameCoefficient("w", Result["0-1"], 3500, 3500)).toBe(900);
    });

    it("calculationGameCoefficient covers black outcomes", () => {
        expect(calculationGameCoefficient("b", Result["0-1"], 3500, 3500)).toBe(500);
        expect(calculationGameCoefficient("b", Result["1/2-1/2"], 3500, 3500)).toBe(700);
        expect(calculationGameCoefficient("b", Result["1-0"], 3500, 3500)).toBe(900);
    });

    it("convertResult accepts valid values", () => {
        expect(convertResult("1-0")).toBe(Result["1-0"]);
        expect(convertResult("1/2-1/2")).toBe(Result["1/2-1/2"]);
        expect(convertResult("0-1")).toBe(Result["0-1"]);
    });

    it("convertResult throws for invalid value", () => {
        expect(() => convertResult("x-x")).toThrow("Result is not correct: x-x");
    });
});

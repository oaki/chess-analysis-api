import {describe, expect, it} from "vitest";
import {decodePv, decodeUciMove, EMPTY_ENCODED_MOVE, encodePv, encodeUciMove, PV_LENGTH} from "./moveEncoding";

describe("moveEncoding", () => {
    describe("encodeUciMove / decodeUciMove", () => {
        it.each([
            "e2e4",
            "e7e5",
            "g1f3",
            "a1a8",
            "h8h1",
            "e7e8q",
            "a2a1n",
            "a2a1r",
            "a2a1b",
        ])("round-trips %s", (uciMove) => {
            const encoded = encodeUciMove(uciMove);
            expect(encoded).toBeGreaterThanOrEqual(0);
            expect(encoded).toBeLessThanOrEqual(0b111111111111111);
            expect(decodeUciMove(encoded)).toBe(uciMove);
        });

        it("produces distinct codes for distinct moves", () => {
            const codes = new Set([
                encodeUciMove("e2e4"),
                encodeUciMove("e2e3"),
                encodeUciMove("d2d4"),
                encodeUciMove("e7e8q"),
                encodeUciMove("e7e8n"),
            ]);
            expect(codes.size).toBe(5);
        });

        it("throws on a malformed move", () => {
            expect(() => encodeUciMove("e2e9")).toThrow();
            expect(() => encodeUciMove("z2e4")).toThrow();
            expect(() => encodeUciMove("e2e4x")).toThrow();
            expect(() => encodeUciMove("")).toThrow();
        });

        it("throws when decoding an out-of-range code", () => {
            expect(() => decodeUciMove(-1)).toThrow();
            expect(() => decodeUciMove(0b1000000000000000)).toThrow();
        });

        it("throws for a promotion code that encodeUciMove never produces (e.g. a corrupted stored value)", () => {
            // Low 3 bits = 5, one past the highest valid promotion code (4 = "n").
            expect(() => decodeUciMove(0b101)).toThrow();
        });
    });

    describe("encodePv / decodePv", () => {
        it("pads shorter lines with EMPTY_ENCODED_MOVE up to PV_LENGTH", () => {
            const encoded = encodePv(["e2e4", "e7e5"]);
            expect(encoded).toHaveLength(PV_LENGTH);
            expect(encoded[2]).toBe(EMPTY_ENCODED_MOVE);
            expect(decodePv(encoded)).toEqual(["e2e4", "e7e5"]);
        });

        it("truncates longer lines to PV_LENGTH", () => {
            const nineMoves = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1"];
            const encoded = encodePv(nineMoves);
            expect(encoded).toHaveLength(PV_LENGTH);
            expect(decodePv(encoded)).toEqual(nineMoves.slice(0, PV_LENGTH));
        });

        it("stops at the first unparseable token and pads the rest", () => {
            const encoded = encodePv(["e2e4", "not-a-move", "g1f3"]);
            expect(decodePv(encoded)).toEqual(["e2e4"]);
        });

        it("round-trips an empty line", () => {
            const encoded = encodePv([]);
            expect(encoded.every((move) => move === EMPTY_ENCODED_MOVE)).toBe(true);
            expect(decodePv(encoded)).toEqual([]);
        });
    });
});

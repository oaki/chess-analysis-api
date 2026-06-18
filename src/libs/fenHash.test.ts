import {describe, expect, it, vi, beforeEach} from "vitest";

const generateHash = vi.hoisted(() => vi.fn());
const warnMock = vi.hoisted(() => vi.fn());

vi.mock("./polyglot", () => ({
    Polyglot: class {
        generate_hash = generateHash;
    },
}));

vi.mock("./logger", () => ({
    logger: {warn: warnMock, info: vi.fn(), debug: vi.fn(), error: vi.fn()},
}));

import {decodeFenHash} from "./fenHash";

describe("decodeFenHash", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns hash for valid fen", () => {
        generateHash.mockReturnValue(BigInt("12345678901234567"));
        const result = decodeFenHash("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        expect(result).toBe(BigInt("12345678901234567"));
    });

    it("passes fen directly to polyglot", () => {
        generateHash.mockReturnValue(0n);
        const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
        decodeFenHash(fen);
        expect(generateHash).toHaveBeenCalledWith(fen);
    });

    it("rethrows errors from polyglot and logs invalid fen", () => {
        const error = new Error("invalid fen");
        generateHash.mockImplementation(() => { throw error; });

        expect(() => decodeFenHash("bad-fen")).toThrow("invalid fen");
        expect(warnMock).toHaveBeenCalledWith({fen: "bad-fen"}, "Fen is incorrect");
    });
});

import {beforeEach, describe, expect, it, vi} from "vitest";
import {LINE_MAP} from "../interfaces";
import {encodeUciMove} from "../libs/moveEncoding";

function encodedPv(...uciMoves: string[]): number[] {
    const encoded = uciMoves.map(encodeUciMove);
    while (encoded.length < 8) {
        encoded.push(0);
    }
    return encoded;
}

const mocks = vi.hoisted(() => ({
    mockCheckEvaluation: vi.fn(),
    mockEvaluationConnection: vi.fn(),
    mockDecodeFenHash: vi.fn(),
    mockFindBestMove: vi.fn(),
    mockUpsertBestMove: vi.fn(),
    mockResolveEngineId: vi.fn(),
    mockResolveSourceId: vi.fn(),
}));

vi.mock("../libs/checkEvaluation", async () => {
    const actual = await vi.importActual<typeof import("../libs/checkEvaluation")>("../libs/checkEvaluation");
    return {
        ...actual,
        checkEvaluation: mocks.mockCheckEvaluation,
    };
});

vi.mock("../libs/connectEvaluationDatabase", () => ({
    evaluationConnection: mocks.mockEvaluationConnection,
}));

vi.mock("../libs/fenHash", () => ({
    decodeFenHash: mocks.mockDecodeFenHash,
}));

vi.mock("../modules/bestMoves/bestMovesRepository", () => ({
    findBestMove: mocks.mockFindBestMove,
    upsertBestMove: mocks.mockUpsertBestMove,
    resolveEngineId: mocks.mockResolveEngineId,
    resolveSourceId: mocks.mockResolveSourceId,
}));

import positionService from "./positionService";

function makeEvaluation(overrides: Partial<Record<string, unknown>> = {}): ReturnType<typeof buildEvaluation> {
    return buildEvaluation(overrides);
}

function buildEvaluation(overrides: Partial<Record<string, unknown>>) {
    return {
        [LINE_MAP.depth]: 20,
        [LINE_MAP.score]: "0.5",
        [LINE_MAP.nodes]: 12_345_678,
        [LINE_MAP.time]: "1234",
        [LINE_MAP.import]: 0,
        [LINE_MAP.tbhits]: "42",
        [LINE_MAP.pv]: "e2e4 e7e5",
        [LINE_MAP.mate]: false,
        ...overrides,
    };
}

describe("positionService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockEvaluationConnection.mockResolvedValue({});
        mocks.mockResolveEngineId.mockResolvedValue(6);
        mocks.mockResolveSourceId.mockResolvedValue(5);
    });

    describe("add", () => {
        it("skips DB when evaluation is rejected", async () => {
            mocks.mockCheckEvaluation.mockReturnValue(false);

            await positionService.add("fen", makeEvaluation());

            expect(mocks.mockUpsertBestMove).not.toHaveBeenCalled();
        });

        it("resolves engine/source and upserts an encoded write for the live-search path", async () => {
            mocks.mockCheckEvaluation.mockReturnValue(true);
            mocks.mockDecodeFenHash.mockReturnValue(123456789012345n);

            await positionService.add("fen", makeEvaluation({
                [LINE_MAP.nodes]: 14_500_000,
                [LINE_MAP.time]: "2000",
                [LINE_MAP.score]: "0.73",
            }));

            expect(mocks.mockResolveEngineId).toHaveBeenCalledWith({}, "Live Watch-Analyze Worker");
            expect(mocks.mockResolveSourceId).toHaveBeenCalledWith({}, "live-watch-analyze");
            expect(mocks.mockUpsertBestMove).toHaveBeenCalledWith({}, expect.objectContaining({
                positionKey: "123456789012345",
                evalCp: 73,
                nodes: 14_500_000,
                timeMs: 2000,
                depth: 20,
                engineId: 6,
                sourceId: 5,
                confirmations: 1,
            }));

            const [, write] = mocks.mockUpsertBestMove.mock.calls[0];
            expect(write.pv).toHaveLength(8);
        });
    });

    describe("findAllMoves", () => {
        it("returns null when no position exists", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue(null);

            const result = await positionService.findAllMoves("fen");

            expect(result).toBeNull();
        });

        it("decodes the stored pv back into a UCI string", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue({
                positionKey: "1",
                pv: encodedPv("e2e4"),
                evalCp: 42,
                nodes: 7,
                timeMs: 1000,
                depth: 10,
                computeScore: 10,
                engineId: 1,
                sourceId: 1,
                confirmations: 1,
            });

            const result = await positionService.findAllMoves("fen");

            expect(result).toEqual({
                score: 0.42,
                depth: 10,
                pv: "e2e4",
                nodes: 7,
                time: 1000,
                tbhits: 0,
                import: false,
            });
        });
    });

    describe("findCompleteAnalysis", () => {
        it("returns null when no position is stored at all", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue(null);

            const result = await positionService.findCompleteAnalysis("fen");

            expect(result).toBeNull();
        });

        it("returns null when neither nodes, time, nor import clear the bar", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue({
                positionKey: "1",
                pv: encodedPv("e2e4"),
                evalCp: 42,
                nodes: 1000,
                timeMs: 1000,
                depth: 10,
                computeScore: 5,
                engineId: 1,
                sourceId: 1,
                confirmations: 1,
            });

            const result = await positionService.findCompleteAnalysis("fen");

            expect(result).toBeNull();
        });

        it("returns a full evaluation once the node threshold is met", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue({
                positionKey: "1",
                pv: encodedPv("e2e4"),
                evalCp: 42,
                nodes: 90_000_000,
                timeMs: 120_000,
                depth: 28,
                computeScore: 80,
                engineId: 1,
                sourceId: 1,
                confirmations: 1,
            });

            const result = await positionService.findCompleteAnalysis("fen");

            expect(result).toMatchObject({
                [LINE_MAP.depth]: 28,
                [LINE_MAP.score]: "0.42",
                [LINE_MAP.nodes]: 90_000_000,
                [LINE_MAP.pv]: "e2e4",
                [LINE_MAP.fen]: "fen",
            });
        });

        it("trusts an import-confirmed position below the node/time bar", async () => {
            mocks.mockDecodeFenHash.mockReturnValue(1n);
            mocks.mockFindBestMove.mockResolvedValue({
                positionKey: "1",
                pv: encodedPv("e2e4"),
                evalCp: 10,
                nodes: 1000,
                timeMs: 1000,
                depth: 30,
                computeScore: 5,
                engineId: 1,
                sourceId: 1,
                confirmations: 3,
            });

            const result = await positionService.findCompleteAnalysis("fen");

            expect(result).toMatchObject({[LINE_MAP.import]: 1});
        });
    });
});

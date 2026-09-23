import {beforeEach, describe, expect, it, vi} from "vitest";
import {PassThrough} from "stream";

const createStreamMock = vi.hoisted(() => vi.fn());
const getConfigMock = vi.hoisted(() => vi.fn());
const findCompleteAnalysisMock = vi.hoisted(() => vi.fn());

vi.mock("../../sockets/initSockets", () => ({
    SocketService: {createWatchAnalysisStream: createStreamMock},
}));
vi.mock("../../config", () => ({getConfig: getConfigMock}));
vi.mock("../../services/positionService", () => ({
    default: {findCompleteAnalysis: findCompleteAnalysisMock},
}));

import {watchAnalysisRoute} from "./watchAnalysisRoute";

const validPayload = {
    requestID: "d9428888-122b-4a4a-b15d-eceea8c9957a",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    maxVariations: 3,
    milliseconds: 10_000,
};

describe("watchAnalysisRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getConfigMock.mockReturnValue({watchAnalysis: {apiKey: "secret"}});
        findCompleteAnalysisMock.mockResolvedValue(null);
    });

    it("returns an NDJSON stream for an authenticated valid request", async () => {
        const stream = new PassThrough();
        createStreamMock.mockReturnValue(stream);
        const response = {
            type: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
        };
        const h = {response: vi.fn(() => response)};

        const result = await watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: validPayload,
        }, h);

        expect(createStreamMock).toHaveBeenCalledWith(validPayload);
        expect(h.response).toHaveBeenCalledWith(stream);
        expect(response.type).toHaveBeenCalledWith("application/x-ndjson; charset=utf-8");
        expect(response.header).toHaveBeenCalledWith("Cache-Control", "no-store");
        expect(response.header).toHaveBeenCalledWith("X-Accel-Buffering", "no");
        expect(result).toBe(response);
    });

    it("rejects an invalid FEN", async () => {
        await expect(watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: {...validPayload, fen: "bad"},
        }, {response: vi.fn()})).rejects.toThrow("Invalid FEN");
    });

    it("rejects a missing bearer token", async () => {
        await expect(watchAnalysisRoute()[0].handler({
            headers: {},
            payload: validPayload,
        }, {response: vi.fn()})).rejects.toThrow("Invalid analysis credentials");
    });

    it("returns unavailable when no worker is connected", async () => {
        createStreamMock.mockReturnValue(null);
        await expect(watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: validPayload,
        }, {response: vi.fn()})).rejects.toThrow("No analysis worker is available");
    });

    it("returns a completed DB evaluation without starting a worker", async () => {
        findCompleteAnalysisMock.mockResolvedValue({
            fen: validPayload.fen,
            d: 30,
            s: "0.25",
            n: 90_000_000,
            t: "120000",
            p: "e2e4 e7e5",
            h: "0",
            i: 0,
            m: false,
            u: "1",
        });
        const response = {
            type: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
        };
        const h = {response: vi.fn(() => response)};

        const result = await watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: validPayload,
        }, h);

        expect(createStreamMock).not.toHaveBeenCalled();
        expect(h.response).toHaveBeenCalledWith(expect.stringContaining('"cached":true'));
        expect(response.header).toHaveBeenCalledWith("X-Analysis-Cache", "HIT");
        expect(result).toBe(response);
    });

    it("forceRecompute bypasses the DB cache", async () => {
        const stream = new PassThrough();
        createStreamMock.mockReturnValue(stream);
        const response = {type: vi.fn().mockReturnThis(), header: vi.fn().mockReturnThis()};
        const h = {response: vi.fn(() => response)};
        const payload = {...validPayload, forceRecompute: true};

        await watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload,
        }, h);

        expect(findCompleteAnalysisMock).not.toHaveBeenCalled();
        expect(createStreamMock).toHaveBeenCalledWith(payload);
    });
});

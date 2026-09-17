import {beforeEach, describe, expect, it, vi} from "vitest";
import {PassThrough} from "stream";

const createStreamMock = vi.hoisted(() => vi.fn());
const getConfigMock = vi.hoisted(() => vi.fn());

vi.mock("../../sockets/initSockets", () => ({
    SocketService: {createWatchAnalysisStream: createStreamMock},
}));
vi.mock("../../config", () => ({getConfig: getConfigMock}));

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
    });

    it("returns an NDJSON stream for an authenticated valid request", () => {
        const stream = new PassThrough();
        createStreamMock.mockReturnValue(stream);
        const response = {
            type: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
        };
        const h = {response: vi.fn(() => response)};

        const result = watchAnalysisRoute()[0].handler({
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

    it("rejects an invalid FEN", () => {
        expect(() => watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: {...validPayload, fen: "bad"},
        }, {response: vi.fn()})).toThrow("Invalid FEN");
    });

    it("returns unavailable when no worker is connected", () => {
        createStreamMock.mockReturnValue(null);
        expect(() => watchAnalysisRoute()[0].handler({
            headers: {authorization: "Bearer secret"},
            payload: validPayload,
        }, {response: vi.fn()})).toThrow("No analysis worker is available");
    });
});

import {beforeEach, describe, expect, it, vi} from "vitest";
import {LINE_MAP} from "../interfaces";
import fetchTimeoutMock from "../test/shims/fetch-timeout";

describe("NextChessMoveComService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("parses evaluation when API returns valid log lines", async () => {
        const payload = {
            log: [
                [0, "info depth 20 nodes 12345 time 77 cp 52 tbhits 0 pv e2e4 e7e5"],
                [1, "bestmove e2e4"],
            ],
        };
        const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 5 9";

        fetchTimeoutMock.mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        const {NextChessMoveComService} = await import("./nextchessmoveComService");

        const result = await NextChessMoveComService.getResult(fen);
        expect(fetchTimeoutMock).toHaveBeenCalled();
        expect(result).toEqual([
            {
                [LINE_MAP.score]: "0.52",
                [LINE_MAP.depth]: 20,
                [LINE_MAP.pv]: "e2e4 e7e5",
                [LINE_MAP.nodes]: 12345,
                [LINE_MAP.time]: "77",
                [LINE_MAP.tbhits]: "0",
                [LINE_MAP.mate]: false,
                [LINE_MAP.fen]: fen,
            },
        ]);
    });

    it("returns null when response is not ok", async () => {
        fetchTimeoutMock.mockResolvedValue({
            ok: false,
            json: vi.fn(),
        });
        const {NextChessMoveComService} = await import("./nextchessmoveComService");
        expect(await NextChessMoveComService.getResult("fen")).toBeNull();
    });

    it("returns null when depth or nodes missing from info line", async () => {
        fetchTimeoutMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                log: [
                    [0, "info time 77 cp 52 pv e2e4"],
                    [1, "bestmove e2e4"],
                ],
            }),
        });
        const {NextChessMoveComService} = await import("./nextchessmoveComService");
        expect(await NextChessMoveComService.getResult("fen")).toBeNull();
    });

    it("returns null when bestmove line missing", async () => {
        fetchTimeoutMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                log: [[0, "info depth 20 nodes 10 cp 0 pv e2e4"]],
            }),
        });
        const {NextChessMoveComService} = await import("./nextchessmoveComService");
        expect(await NextChessMoveComService.getResult("fen")).toBeNull();
    });

    it("returns null for commented/invalid payload", async () => {
        fetchTimeoutMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                comment: "error",
                log: [],
            }),
        });

        const {NextChessMoveComService} = await import("./nextchessmoveComService");
        const result = await NextChessMoveComService.getResult("fen");
        expect(result).toBeNull();
    });

    it("returns null when request throws", async () => {
        fetchTimeoutMock.mockRejectedValue(new Error("timeout"));
        const {NextChessMoveComService} = await import("./nextchessmoveComService");
        const result = await NextChessMoveComService.getResult("fen");
        expect(result).toBeNull();
    });
});

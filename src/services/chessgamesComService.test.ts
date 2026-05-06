import {beforeEach, describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
    fetchMock: vi.fn(),
}));

vi.mock("node-fetch", () => ({
    default: mocks.fetchMock,
}));

describe("ChessgamesComService", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("maps parsed lines to evaluation format", async () => {
        const html = `
        <table>
          <td>
            1) +0.26 (34 ply) 1.Nf3 e6
            2 minute analysis by stockfish
          </td>
        </table>`;

        mocks.fetchMock.mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue(html),
        });

        const {default: chessgamesService} = await import("./chessgamesComService");
        const fen = "fen-value";
        const result = await chessgamesService.getResult(fen);

        expect(result).toEqual([
            expect.objectContaining({
                s: "+0.26",
                d: "34",
                p: "1.Nf3 e6",
                n: 0,
                m: false,
                fen,
            }),
        ]);
        expect(Number(result?.[0]?.t)).toBeGreaterThan(0);
    });

    it("uses hour multiplier in parseTime", async () => {
        const html = `
        <table>
          <td>
            1) +0.10 (10 ply) 1.e4 e5
            2 hour analysis by stockfish
          </td>
        </table>`;

        mocks.fetchMock.mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue(html),
        });

        const {default: chessgamesService} = await import("./chessgamesComService");
        const result = await chessgamesService.getResult("fen");

        expect(result?.[0]?.t).toBe(String(2 * 60 * 60 * 1000));
    });

    it("uses default second multiplier for unknown time unit", async () => {
        const html = `
        <table>
          <td>
            1) +0.05 (8 ply) 1.d4 d5
            5 weirdunit analysis by stockfish
          </td>
        </table>`;

        mocks.fetchMock.mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue(html),
        });

        const {default: chessgamesService} = await import("./chessgamesComService");
        const result = await chessgamesService.getResult("fen");

        expect(result?.[0]?.t).toBe(String(5000));
    });

    it("maps multiple variant lines", async () => {
        const html = `
        <table>
          <td>
            1) +0.26 (34 ply) 1.Nf3 e6
            2) -0.10 (20 ply) 1.e4 c5
            1 minute analysis by stockfish
          </td>
        </table>`;

        mocks.fetchMock.mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue(html),
        });

        const {default: chessgamesService} = await import("./chessgamesComService");
        const result = await chessgamesService.getResult("fen");

        expect(result).toHaveLength(2);
        expect(result?.[0]?.p).toContain("Nf3");
        expect(result?.[1]?.p).toContain("e4");
    });

    it("throws when fetch response is not ok", async () => {
        mocks.fetchMock.mockResolvedValue({
            ok: false,
            text: vi.fn(),
        });

        const {default: chessgamesService} = await import("./chessgamesComService");
        await expect(chessgamesService.getResult("fen")).rejects.toThrow();
    });
});

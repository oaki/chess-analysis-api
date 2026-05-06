import {beforeEach, describe, expect, it, vi} from "vitest";
import fetch from "node-fetch";
import syzygyService from "./syzygyService";
import {ParsePgn} from "../models/ParsePgn";

vi.mock("node-fetch", () => ({
    default: vi.fn(),
}));

describe("syzygyService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("returns parsed json when response is ok", async () => {
        vi.spyOn(ParsePgn, "replaceAll").mockReturnValue("fen_prepared");
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({moves: [{uci: "e2e4"}]}),
        });

        const result = await syzygyService.find("original fen");

        expect(fetch).toHaveBeenCalledWith("https://tablebase.lichess.ovh/standard?fen=fen_prepared");
        expect(result).toEqual({moves: [{uci: "e2e4"}]});
    });

    it("returns undefined when response is not ok", async () => {
        vi.spyOn(ParsePgn, "replaceAll").mockReturnValue("fen_prepared");
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: vi.fn(),
        });

        const result = await syzygyService.find("original fen");
        expect(result).toBeUndefined();
    });

    it("rethrows fetch errors", async () => {
        vi.spyOn(ParsePgn, "replaceAll").mockReturnValue("fen_prepared");
        (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network fail"));

        await expect(syzygyService.find("original fen")).rejects.toThrow("network fail");
    });
});

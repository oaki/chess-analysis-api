import {beforeEach, describe, expect, it, vi} from "vitest";

const findMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/openingsService", () => ({
    default: {find: findMock},
}));

import {OpeningBookController} from "./openingBookController";

describe("OpeningBookController", () => {
    let controller: OpeningBookController;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        controller = new OpeningBookController();
    });

    it("returns results when opening book finds moves", async () => {
        const moves = [{fen: "some-fen", move: "e2e4", weight: 100, san: "e4"}];
        findMock.mockResolvedValue(moves);

        const result = await controller.get({fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"});

        expect(findMock).toHaveBeenCalledWith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        expect(result).toEqual(moves);
    });

    it("throws 404 Boom when opening book returns null", async () => {
        findMock.mockResolvedValue(null);

        await expect(controller.get({fen: "invalid-fen"})).rejects.toMatchObject({
            isBoom: true,
            output: {statusCode: 404},
        });
    });

    it("returns empty array without throwing (empty result is valid)", async () => {
        findMock.mockResolvedValue([]);

        const result = await controller.get({fen: "some-fen"});
        expect(result).toEqual([]);
    });

    it("propagates service errors", async () => {
        findMock.mockRejectedValue(new Error("service error"));

        await expect(controller.get({fen: "some-fen"})).rejects.toThrow("service error");
    });
});

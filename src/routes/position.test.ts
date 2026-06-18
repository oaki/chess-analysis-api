import {beforeEach, describe, expect, it, vi} from "vitest";

const findAllMovesMock = vi.hoisted(() => vi.fn());

vi.mock("joi", () => ({
    default: {
        object: () => ({fen: "fen-schema"}),
        any: () => ({required: () => ({description: () => "fen-schema"})}),
    },
}));

vi.mock("../services/positionService", () => ({
    default: {
        findAllMoves: findAllMovesMock,
    },
}));

import {positionRoute} from "./position";

describe("positionRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns fallback text when evaluation is null", async () => {
        findAllMovesMock.mockResolvedValue(null);
        const route = positionRoute()[0];

        const result = await route.handler({query: {fen: "fen"}}, {});

        expect(findAllMovesMock).toHaveBeenCalledWith("fen");
        expect(result).toBe("Position is not in DB. ");
    });

    it("returns evaluation object when found", async () => {
        const evaluation = {score: 0.2, pv: "e2e4"};
        findAllMovesMock.mockResolvedValue(evaluation);
        const route = positionRoute()[0];

        const result = await route.handler({query: {fen: "fen2"}}, {});

        expect(findAllMovesMock).toHaveBeenCalledWith("fen2");
        expect(result).toEqual(evaluation);
    });
});

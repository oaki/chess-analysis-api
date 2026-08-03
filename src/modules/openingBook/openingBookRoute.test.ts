import {describe, expect, it, vi, beforeEach} from "vitest";

const getMock = vi.hoisted(() => vi.fn());

vi.mock("./openingBookController", () => ({
    OpeningBookController: class {
        get = getMock;
    },
}));

import {openingBookRoute} from "./openingBookRoute";

describe("openingBookRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns an array with one route definition", () => {
        const routes = openingBookRoute();
        expect(Array.isArray(routes)).toBe(true);
        expect(routes).toHaveLength(1);
    });

    it("route is GET /opening-book", () => {
        const [route] = openingBookRoute();
        expect(route.method).toBe("GET");
        expect(route.path).toBe("/opening-book");
    });

    it("route has api tag for swagger", () => {
        const [route] = openingBookRoute();
        expect(route.config.tags).toContain("api");
    });

    it("route has query validation schema", () => {
        const [route] = openingBookRoute();
        expect(route.config.validate.query).toBeDefined();
    });

    it("handler calls controller.get with fen and returns response with ttl", async () => {
        const moves = [{san: "e4", move: "e2e4", weight: 100, fen: "some-fen"}];
        getMock.mockResolvedValue(moves);

        const [route] = openingBookRoute();
        const request = {query: {fen: "startpos"}};
        const ttlMock = vi.fn().mockReturnThis();
        const responseMock = vi.fn().mockReturnValue({ttl: ttlMock});
        const h = {response: responseMock};

        await route.handler(request, h);

        expect(getMock).toHaveBeenCalledWith({fen: "startpos"});
        expect(responseMock).toHaveBeenCalledWith(moves);
        expect(ttlMock).toHaveBeenCalled();
    });

    it("handler propagates controller errors", async () => {
        const boom404 = {isBoom: true, output: {statusCode: 404}};
        getMock.mockRejectedValue(boom404);

        const [route] = openingBookRoute();
        const request = {query: {fen: "unknown"}};
        const h = {response: vi.fn().mockReturnValue({ttl: vi.fn()})};

        await expect(route.handler(request, h)).rejects.toMatchObject({isBoom: true});
    });
});

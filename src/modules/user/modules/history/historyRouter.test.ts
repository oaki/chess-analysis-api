import {beforeEach, describe, expect, it, vi} from "vitest";

const addNewGame = vi.hoisted(() => vi.fn());
const removeGame = vi.hoisted(() => vi.fn());
const importNewGameFromPgn = vi.hoisted(() => vi.fn());
const getAll = vi.hoisted(() => vi.fn());
const getLastGame = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const updateGame = vi.hoisted(() => vi.fn());

vi.mock("./historyController", () => ({
    OrderType: {ASC: "ASC", DESC: "DESC"},
    HistoryController: class {
        addNewGame = addNewGame;
        removeGame = removeGame;
        importNewGameFromPgn = importNewGameFromPgn;
        getAll = getAll;
        getLastGame = getLastGame;
        get = get;
        updateGame = updateGame;
        static addNewGame = addNewGame;
        static removeGame = removeGame;
    },
}));

import {historyRoute} from "./historyRouter";

describe("historyRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("returns array of routes", () => {
        expect(Array.isArray(historyRoute())).toBe(true);
        expect(historyRoute().length).toBeGreaterThan(0);
    });

    it("all routes require jwt auth", () => {
        for (const route of historyRoute()) {
            expect(route.config.auth).toBe("jwt");
        }
    });

    it("POST /user/history calls HistoryController.addNewGame with userId", async () => {
        addNewGame.mockResolvedValue({id: 1});
        const route = historyRoute().find(r => r.method === "POST" && r.path === "/user/history");

        await route!.handler({auth: {credentials: {user_id: 42}}});

        expect(addNewGame).toHaveBeenCalledWith({userId: 42});
    });

    it("DELETE /user/history/{id} calls HistoryController.removeGame with numeric id and userId", async () => {
        removeGame.mockResolvedValue({status: "success"});
        const route = historyRoute().find(r => r.method === "DELETE");

        await route!.handler({params: {id: "5"}, auth: {credentials: {user_id: 42}}});

        expect(removeGame).toHaveBeenCalledWith({id: 5, userId: 42});
    });

    it("GET /user/history calls getAll with pagination and order", async () => {
        getAll.mockResolvedValue([]);
        const route = historyRoute().find(r => r.method === "GET" && r.path === "/user/history");

        await route!.handler({
            query: {offset: 0, limit: 10, order: "ASC"},
            auth: {credentials: {user_id: 42}},
        });

        expect(getAll).toHaveBeenCalledWith({userId: 42, offset: 0, limit: 10, order: "ASC"});
    });

    it("GET /user/history/{id} calls get with id and userId", async () => {
        get.mockResolvedValue({id: 3});
        const route = historyRoute().find(r => r.method === "GET" && r.path === "/user/history/{id}");

        await route!.handler({params: {id: 3}, auth: {credentials: {user_id: 42}}});

        expect(get).toHaveBeenCalledWith({userId: 42, id: 3});
    });

    it("PUT /user/history/{id} calls updateGame with moves", async () => {
        updateGame.mockResolvedValue({status: "success"});
        const route = historyRoute().find(r => r.method === "PUT");

        await route!.handler({
            params: {id: 3},
            payload: {moves: ["e4", "e5"]},
            auth: {credentials: {user_id: 42}},
        });

        expect(updateGame).toHaveBeenCalledWith({userId: 42, gameId: 3, moves: ["e4", "e5"]});
    });

    it("POST /user/history/import-pgn parses payload json and calls importNewGameFromPgn", async () => {
        importNewGameFromPgn.mockResolvedValue({id: 7});
        const route = historyRoute().find(r => r.path === "/user/history/import-pgn");

        await route!.handler({
            payload: JSON.stringify({pgn: "1.e4 e5"}),
            auth: {credentials: {user_id: 42}},
        });

        expect(importNewGameFromPgn).toHaveBeenCalledWith({userId: 42, pgn: "1.e4 e5"});
    });
});

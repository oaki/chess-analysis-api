import {beforeEach, describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
    gameDbConnection: vi.fn(),
    decodeFenHash: vi.fn(() => "position-hash"),
}));

vi.mock("../../libs/connectGameDatabase", () => ({
    gameDbConnection: mocks.gameDbConnection,
}));

vi.mock("../../libs/fenHash", () => ({
    decodeFenHash: mocks.decodeFenHash,
}));

vi.mock("../../libs/logger", () => ({
    logger: {warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn()},
}));

import {get} from "./gameDatabaseController";

describe("gameDatabaseController.get", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads games without PostgreSQL-specific raw SQL", async () => {
        const moveQuery = {
            select: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            getRawOne: vi.fn().mockResolvedValue({id: 42}),
        };
        const gameMoveQuery = {
            select: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            offset: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            getRawMany: vi.fn().mockResolvedValue([{gameId: 7}, {gameId: 3}]),
        };
        const games = [
            {
                id: 3,
                white: "Third",
                black: "Player",
                whiteElo: 2200,
                blackElo: 2100,
                result: "1-0",
                pgnHash: "pgn-3",
                pgn: "1. d4 d5 2. e4 c6 3. Nc3 Nf6",
            },
            {
                id: 7,
                white: "First",
                black: "Player",
                whiteElo: 2400,
                blackElo: 2300,
                result: "1/2-1/2",
                pgnHash: "pgn-7",
                pgn: "1. d4 d5 2. e4 c6 3. Nc3 Nf6",
            },
        ];
        const gameRepository = {
            findByIds: vi.fn().mockResolvedValue(games),
        };
        const managerQuery = vi.fn().mockRejectedValue(
            Object.assign(new Error("MariaDB syntax error near '\"gameId\"'"), {code: "ER_PARSE_ERROR"}),
        );
        const db = {
            getRepository: vi.fn((entity: {name: string}) => {
                if (entity.name === "Move") return {createQueryBuilder: vi.fn(() => moveQuery)};
                if (entity.name === "GameMovesMove") return {createQueryBuilder: vi.fn(() => gameMoveQuery)};
                if (entity.name === "Game") return gameRepository;
                throw new Error(`Unexpected repository: ${entity.name}`);
            }),
            manager: {query: managerQuery},
        };
        mocks.gameDbConnection.mockResolvedValue(db);

        const result = await get({
            fen: "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3",
            side: "w",
            offset: 0,
            limit: 2,
        });

        expect(managerQuery).not.toHaveBeenCalled();
        expect(gameMoveQuery.orderBy).toHaveBeenCalledWith("gameMove.cw", "ASC");
        expect(gameMoveQuery.offset).toHaveBeenCalledWith(0);
        expect(gameMoveQuery.limit).toHaveBeenCalledWith(2);
        expect(gameRepository.findByIds).toHaveBeenCalledWith([7, 3]);
        expect(result.games.map(game => game.id)).toEqual([7, 3]);
    });
});

import {beforeEach, describe, expect, it, vi} from "vitest";
import {LINE_MAP} from "../interfaces";

const mocks = vi.hoisted(() => ({
    mockCheckEvaluation: vi.fn(),
    mockEvaluationConnection: vi.fn(),
    mockDecodeFenHash: vi.fn(),
}));

vi.mock("../libs/checkEvaluation", () => ({
    checkEvaluation: mocks.mockCheckEvaluation,
}));

vi.mock("../libs/connectEvaluationDatabase", () => ({
    evaluationConnection: mocks.mockEvaluationConnection,
}));

vi.mock("../libs/fenHash", () => ({
    decodeFenHash: mocks.mockDecodeFenHash,
}));

vi.mock("../modules/evaluatedDatabase/entity/evaluatedPosition", () => ({
    EvaluatedPosition: class EvaluatedPosition {},
}));

import positionService from "./positionService";

function makeEvaluation(overrides: Record<string, any> = {}) {
    return {
        [LINE_MAP.depth]: 20,
        [LINE_MAP.score]: "0.5",
        [LINE_MAP.nodes]: 12345678,
        [LINE_MAP.time]: "1234",
        [LINE_MAP.import]: 0,
        [LINE_MAP.tbhits]: "42",
        [LINE_MAP.pv]: "e2e4 e7e5",
        ...overrides,
    } as any;
}

describe("positionService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("add skips DB when evaluation is rejected", async () => {
        mocks.mockCheckEvaluation.mockReturnValue(false);

        await positionService.add("fen", makeEvaluation());

        expect(mocks.mockEvaluationConnection).not.toHaveBeenCalled();
    });

    it("add inserts new evaluation when better position does not exist", async () => {
        mocks.mockCheckEvaluation.mockReturnValue(true);
        mocks.mockDecodeFenHash.mockReturnValue("hash");

        const getOne = vi.fn().mockResolvedValue(null);
        const selectBuilder = {
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getOne,
        };
        const execute = vi.fn();
        const insertBuilder = {
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            execute,
        };
        const db = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue(selectBuilder),
            }),
            createQueryBuilder: vi.fn().mockReturnValue(insertBuilder),
        };

        mocks.mockEvaluationConnection.mockResolvedValue(db);

        await positionService.add("fen", makeEvaluation({[LINE_MAP.nodes]: 14500000, [LINE_MAP.tbhits]: "x"}));

        expect(insertBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
            fen: "fen",
            fenHash: "hash",
            depth: 20,
            score: 0.5,
            nodes: 15,
            time: 1234,
            import: false,
            tbhits: 0,
            pv: "e2e4 e7e5",
        }));
        expect(execute).toHaveBeenCalled();
    });

    it("add does not insert when existing nodes are higher", async () => {
        mocks.mockCheckEvaluation.mockReturnValue(true);
        mocks.mockDecodeFenHash.mockReturnValue("hash");

        const selectBuilder = {
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getOne: vi.fn().mockResolvedValue({nodes: 99}),
        };
        const insertBuilder = {
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            execute: vi.fn(),
        };
        const db = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue(selectBuilder),
            }),
            createQueryBuilder: vi.fn().mockReturnValue(insertBuilder),
        };
        mocks.mockEvaluationConnection.mockResolvedValue(db);

        await positionService.add("fen", makeEvaluation({[LINE_MAP.nodes]: 1000000}));

        expect(insertBuilder.execute).not.toHaveBeenCalled();
    });

    it("findAllMoves returns position with expanded nodes", async () => {
        mocks.mockDecodeFenHash.mockReturnValue("hash");
        const position = {nodes: 7, pv: "e2e4"};

        const selectBuilder = {
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getOne: vi.fn().mockResolvedValue(position),
        };
        const db = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue(selectBuilder),
            }),
        };
        mocks.mockEvaluationConnection.mockResolvedValue(db);

        const result = await positionService.findAllMoves("fen");

        expect(result).toEqual({nodes: 7000000, pv: "e2e4"});
    });

    it("findAllMoves returns null when no position exists", async () => {
        mocks.mockDecodeFenHash.mockReturnValue("hash");
        const selectBuilder = {
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            getOne: vi.fn().mockResolvedValue(null),
        };
        const db = {
            getRepository: vi.fn().mockReturnValue({
                createQueryBuilder: vi.fn().mockReturnValue(selectBuilder),
            }),
        };
        mocks.mockEvaluationConnection.mockResolvedValue(db);

        const result = await positionService.findAllMoves("fen");
        expect(result).toBeNull();
    });
});

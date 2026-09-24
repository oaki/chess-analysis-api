import {describe, expect, it, vi} from "vitest";
import {findBestMove, resolveEngineId, resolveSourceId, upsertBestMove} from "./bestMovesRepository";

function makeRecord(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        positionKey: "123",
        pv: [1, 0, 0, 0, 0, 0, 0, 0],
        evalCp: 42,
        nodes: 1000,
        timeMs: 2000,
        depth: 20,
        computeScore: 50,
        engineId: 1,
        sourceId: 1,
        confirmations: 1,
        ...overrides,
    };
}

describe("bestMovesRepository", () => {
    describe("resolveEngineId", () => {
        it("returns the id of an already-known engine without inserting", async () => {
            const findOne = vi.fn().mockResolvedValue({id: 7, name: "Stockfish 19"});
            const save = vi.fn();
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveEngineId(db, "Stockfish 19");

            expect(id).toBe(7);
            expect(save).not.toHaveBeenCalled();
        });

        it("creates a new engine row when the name is unknown", async () => {
            const findOne = vi.fn().mockResolvedValue(undefined);
            const save = vi.fn().mockResolvedValue({id: 42, name: "Some New Engine"});
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveEngineId(db, "Some New Engine");

            expect(id).toBe(42);
            expect(save).toHaveBeenCalledTimes(1);
        });

        it("re-reads the row when a concurrent insert wins the unique constraint", async () => {
            const findOne = vi.fn()
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({id: 99, name: "Concurrent Engine"});
            const save = vi.fn().mockRejectedValue(new Error("duplicate key value violates unique constraint"));
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveEngineId(db, "Concurrent Engine");

            expect(id).toBe(99);
            expect(findOne).toHaveBeenCalledTimes(2);
        });

        it("rethrows when the retry also fails to find the row", async () => {
            const findOne = vi.fn().mockResolvedValue(undefined);
            const save = vi.fn().mockRejectedValue(new Error("boom"));
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            await expect(resolveEngineId(db, "Missing Engine")).rejects.toThrow("boom");
        });
    });

    describe("resolveSourceId", () => {
        it("returns the id of an already-known source without inserting", async () => {
            const findOne = vi.fn().mockResolvedValue({id: 3, name: "TCEC"});
            const save = vi.fn();
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveSourceId(db, "TCEC");

            expect(id).toBe(3);
            expect(save).not.toHaveBeenCalled();
        });

        it("creates a new source row when the name is unknown", async () => {
            const findOne = vi.fn().mockResolvedValue(undefined);
            const save = vi.fn().mockResolvedValue({id: 55, name: "Some New Source"});
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveSourceId(db, "Some New Source");

            expect(id).toBe(55);
        });

        it("re-reads the row when a concurrent insert wins the unique constraint", async () => {
            const findOne = vi.fn()
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({id: 77, name: "Concurrent Source"});
            const save = vi.fn().mockRejectedValue(new Error("duplicate key value violates unique constraint"));
            const db = {getRepository: vi.fn().mockReturnValue({findOne, save})} as never;

            const id = await resolveSourceId(db, "Concurrent Source");

            expect(id).toBe(77);
        });
    });

    describe("upsertBestMove", () => {
        it("sends a 10-column parametrized insert with the row's pv", async () => {
            const query = vi.fn().mockResolvedValue(undefined);
            const db = {manager: {query}} as never;

            await upsertBestMove(db, makeRecord());

            expect(query).toHaveBeenCalledTimes(1);
            const [sql, params] = query.mock.calls[0];
            expect(sql).toContain("ON CONFLICT (position_key) DO UPDATE");
            expect(sql).toContain("excluded.confirmations >= best_move.confirmations");
            expect(sql).toContain("excluded.compute_score > best_move.compute_score");
            expect(params).toHaveLength(10);
            expect(params[0]).toBe("123");
        });

        it("rejects a pv that isn't exactly 8 entries", async () => {
            const db = {manager: {query: vi.fn()}} as never;

            await expect(upsertBestMove(db, makeRecord({pv: [1, 2, 3]}))).rejects.toThrow();
        });
    });

    describe("findBestMove", () => {
        it("returns null when nothing is stored for the position", async () => {
            const findOne = vi.fn().mockResolvedValue(undefined);
            const db = {getRepository: vi.fn().mockReturnValue({findOne})} as never;

            const result = await findBestMove(db, "123");

            expect(result).toBeNull();
        });

        it("maps the stored entity onto a BestMoveRecord", async () => {
            const record = makeRecord();
            const findOne = vi.fn().mockResolvedValue(record);
            const db = {getRepository: vi.fn().mockReturnValue({findOne})} as never;

            const result = await findBestMove(db, "123");

            expect(result).toEqual(record);
        });
    });
});

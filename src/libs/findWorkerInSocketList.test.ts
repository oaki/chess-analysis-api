import {describe, expect, it, vi} from "vitest";
import {findAvailableWorkerInSocketList, findMyWorkerInSocketList} from "./findWorkerInSocketList";

describe("findWorkerInSocketList", () => {
    it("findMyWorkerInSocketList returns matching worker socket", () => {
        const sockets = [
            {worker: {user: {id: "u1"}}},
            {worker: {user: {id: "u2"}}},
        ];

        expect(findMyWorkerInSocketList(sockets, "u2")).toBe(sockets[1]);
        expect(findMyWorkerInSocketList(sockets, "missing")).toBeUndefined();
    });

    it("findAvailableWorkerInSocketList returns worker not used recently", () => {
        const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
        const sockets = [
            {worker: {lastUsed: 999_500}},
            {worker: {lastUsed: 900_000}},
        ];

        expect(findAvailableWorkerInSocketList(sockets)).toBe(sockets[1]);
        nowSpy.mockRestore();
    });

    it("findAvailableWorkerInSocketList treats missing lastUsed as available", () => {
        const sockets = [
            {worker: {}},
            {worker: {lastUsed: Date.now()}},
        ];

        expect(findAvailableWorkerInSocketList(sockets)).toBe(sockets[0]);
    });
});

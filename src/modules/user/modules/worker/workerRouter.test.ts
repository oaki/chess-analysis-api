import {beforeEach, describe, expect, it, vi} from "vitest";

const getAll = vi.hoisted(() => vi.fn());
const checkStatus = vi.hoisted(() => vi.fn());
const add = vi.hoisted(() => vi.fn());
const del = vi.hoisted(() => vi.fn());

vi.mock("./workerController", () => ({
    WorkerController: class {
        getAll = getAll;
        checkStatus = checkStatus;
        add = add;
        delete = del;
    },
}));

import {workerRoute} from "./workerRouter";

describe("workerRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("returns array of routes", () => {
        expect(Array.isArray(workerRoute())).toBe(true);
        expect(workerRoute().length).toBeGreaterThan(0);
    });

    it("all routes require jwt auth", () => {
        for (const route of workerRoute()) {
            expect(route.config.auth).toBe("jwt");
        }
    });

    it("GET /user/workers calls getAll with userId and pagination", async () => {
        getAll.mockResolvedValue([]);
        const route = workerRoute().find(r => r.method === "GET" && r.path === "/user/workers");

        await route!.handler({query: {offset: 0, limit: 10}, auth: {credentials: {user_id: 5}}});

        expect(getAll).toHaveBeenCalledWith({userId: 5, offset: 0, limit: 10});
    });

    it("GET /user/workers/ready calls checkStatus with uuids", async () => {
        checkStatus.mockResolvedValue([{uuid: "abc", ready: true}]);
        const route = workerRoute().find(r => r.path === "/user/workers/ready");
        const uuids = ["abc-uuid"];

        await route!.handler({query: {uuids}, auth: {credentials: {user_id: 5}}});

        expect(checkStatus).toHaveBeenCalledWith({userId: 5, uuids});
    });

    it("POST /user/workers calls add with uuid and name from payload", async () => {
        add.mockResolvedValue({uuid: "new-uuid"});
        const route = workerRoute().find(r => r.method === "POST" && r.path === "/user/workers");

        await route!.handler({
            payload: {uuid: "worker-uuid", name: "My Worker"},
            auth: {credentials: {user_id: 5}},
        });

        expect(add).toHaveBeenCalledWith({userId: 5, workerUuid: "worker-uuid", name: "My Worker"});
    });

    it("DELETE /user/workers/{id} calls delete with numeric id", async () => {
        del.mockResolvedValue({status: "success"});
        const route = workerRoute().find(r => r.method === "DELETE");

        await route!.handler({params: {id: "3"}, auth: {credentials: {user_id: 5}}});

        expect(del).toHaveBeenCalledWith({userId: 5, id: 3});
    });
});

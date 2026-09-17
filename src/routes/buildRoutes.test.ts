import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("./files", () => ({filesRoute: vi.fn(() => [{path: "/files"}])}));
vi.mock("./position", () => ({positionRoute: vi.fn(() => [{path: "/position"}])}));
vi.mock("./default", () => ({defaultRoute: vi.fn(() => [{path: "/"}])}));
vi.mock("../modules/openingBook/openingBookRoute", () => ({openingBookRoute: vi.fn(() => [{path: "/opening-book"}])}));
vi.mock("../modules/evaluatedDatabase/evaluationDatabaseRoute", () => ({evaluationDatabaseRoute: vi.fn(() => [{path: "/evaluation"}])}));
vi.mock("../modules/user/modules/history/historyRouter", () => ({historyRoute: vi.fn(() => [{path: "/history"}])}));
vi.mock("../modules/auth/authRoutes", () => ({authRoute: vi.fn(() => [{path: "/auth"}])}));
vi.mock("../modules/user/userRouter", () => ({userRoute: vi.fn(() => [{path: "/user"}])}));
vi.mock("../modules/user/modules/worker/workerRouter", () => ({workerRoute: vi.fn(() => [{path: "/worker"}])}));
vi.mock("../modules/gameDatabase/gameDatabaseRouter", () => ({gameDatabaseRouter: vi.fn(() => [{path: "/games"}])}));
vi.mock("../modules/watchAnalysis/watchAnalysisRoute", () => ({watchAnalysisRoute: vi.fn(() => [{path: "/watch/analyze"}])}));

import routes from "./buildRoutes";

describe("buildRoutes", () => {
    beforeEach(() => {});

    it("registers default and files routes without version prefix", () => {
        const route = vi.fn();
        const server = {route, info: {}};

        routes(server);

        // default and files are registered separately (no /v1 prefix)
        expect(route.mock.calls[0][0]).toEqual([{path: "/"}]);
        expect(route.mock.calls[1][0]).toEqual([{path: "/files"}]);
    });

    it("registers all API routes with /v1 prefix in a single call", () => {
        const route = vi.fn();
        const server = {route, info: {}};

        routes(server);

        // 3 calls total: defaultRoute, filesRoute, versioned batch
        expect(route).toHaveBeenCalledTimes(3);

        // 3rd call is the versioned batch — 9 route groups × 1 route each
        const versionedRoutes = route.mock.calls[2][0];
        expect(versionedRoutes).toHaveLength(9);
        expect(versionedRoutes[0]).toEqual({path: "/v1/auth"});
        expect(versionedRoutes[1]).toEqual({path: "/v1/user"});
        expect(versionedRoutes[7]).toEqual({path: "/v1/games"});
        expect(versionedRoutes[8]).toEqual({path: "/v1/watch/analyze"});
    });

    it("applies /v1 prefix to all API routes", () => {
        const route = vi.fn();
        const server = {route, info: {}};

        routes(server);

        const versionedRoutes: Array<{path: string}> = route.mock.calls[2][0];
        for (const r of versionedRoutes) {
            expect(r.path).toMatch(/^\/v1\//);
        }
    });
});

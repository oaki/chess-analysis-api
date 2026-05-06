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
vi.mock("../config", () => ({config: {environment: "test"}}));

import routes from "./buildRoutes";

describe("buildRoutes", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("registers all route groups", () => {
        const route = vi.fn();
        const server = {route, info: {}};

        routes(server);

        expect(route).toHaveBeenCalledTimes(10);
        expect(route.mock.calls[0][0]).toEqual([{path: "/auth"}]);
        expect(route.mock.calls[1][0]).toEqual([{path: "/user"}]);
        expect(route.mock.calls[2][0]).toEqual([{path: "/"}]);
        expect(route.mock.calls[9][0]).toEqual([{path: "/games"}]);
    });
});

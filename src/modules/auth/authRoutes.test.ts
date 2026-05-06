import {beforeEach, describe, expect, it, vi} from "vitest";

const authMocks = vi.hoisted(() => ({
    createJwtToken: vi.fn(),
    createTemporaryJwtToken: vi.fn(),
    pairTemporaryToken: vi.fn(),
    checkTemporaryToken: vi.fn(),
}));

vi.mock("./authController", () => ({
    AuthController: {
        createJwtToken: authMocks.createJwtToken,
        createTemporaryJwtToken: authMocks.createTemporaryJwtToken,
        pairTemporaryToken: authMocks.pairTemporaryToken,
        checkTemporaryToken: authMocks.checkTemporaryToken,
    },
    tokenOptions: {},
}));

import {authRoute} from "./authRoutes";

describe("authRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("register route forwards jwt token", async () => {
        authMocks.createJwtToken.mockResolvedValue({token: "x"});
        const route = authRoute().find((r) => r.path === "/auth/register");

        const result = await route?.handler({payload: {jwt_token: "google-jwt"}});

        expect(authMocks.createJwtToken).toHaveBeenCalledWith({jwtToken: "google-jwt"});
        expect(result).toEqual({token: "x"});
    });

    it("temporary-session route returns temp token", async () => {
        authMocks.createTemporaryJwtToken.mockResolvedValue({token: "temp"});
        const route = authRoute().find((r) => r.path === "/auth/temporary-session");

        const result = await route?.handler();

        expect(authMocks.createTemporaryJwtToken).toHaveBeenCalled();
        expect(result).toEqual({token: "temp"});
    });

    it("pair-temporary-session parses payload and forwards tokens", async () => {
        authMocks.pairTemporaryToken.mockResolvedValue({status: "success"});
        const route = authRoute().find((r) => r.path === "/auth/pair-temporary-session");

        const result = await route?.handler({
            payload: JSON.stringify({google_token: "g", temporary_token: "t"}),
        });

        expect(authMocks.pairTemporaryToken).toHaveBeenCalledWith({googleToken: "g", temporaryToken: "t"});
        expect(result).toEqual({status: "success"});
    });

    it("check-temporary-token parses payload and forwards token", async () => {
        authMocks.checkTemporaryToken.mockResolvedValue({status: "success"});
        const route = authRoute().find((r) => r.path === "/auth/check-temporary-token");

        const result = await route?.handler({
            payload: JSON.stringify({temporary_token: "temp"}),
        });

        expect(authMocks.checkTemporaryToken).toHaveBeenCalledWith({temporaryToken: "temp"});
        expect(result).toEqual({status: "success"});
    });
});

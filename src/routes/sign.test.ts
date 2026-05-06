import {describe, expect, it} from "vitest";
import {signRoute} from "./sign";

describe("signRoute", () => {
    it("returns authentication error text when auth fails", () => {
        const route = signRoute()[0];
        const result = route.handler({
            auth: {
                isAuthenticated: false,
                error: {message: "invalid token"},
            },
        }, {});

        expect(result).toContain("Authentication failed due to: invalid token");
    });

    it("returns formatted credentials when auth succeeds", () => {
        const route = signRoute()[0];
        const creds = {user: "abc"};
        const result = route.handler({
            auth: {
                isAuthenticated: true,
                credentials: creds,
            },
        }, {});

        expect(result).toContain("<pre>");
        expect(result).toContain('"user": "abc"');
    });
});

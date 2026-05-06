import {describe, expect, it, vi} from "vitest";
import {AuthenticationController} from "./authenticationController";

describe("AuthenticationController", () => {
    it("validateJwt returns true for payload with user_id", async () => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        await expect(AuthenticationController.validateJwt({user_id: 123})).resolves.toEqual({isValid: true});
    });

    it("validateJwt returns false when user_id missing", async () => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        await expect(AuthenticationController.validateJwt({})).resolves.toEqual({isValid: false});
    });
});

import {describe, expect, it} from "vitest";
import {requireWatchAnalysisApiKey} from "./watchAnalysisAuth";

describe("requireWatchAnalysisApiKey", () => {
    it("accepts an exact bearer token", () => {
        expect(() => requireWatchAnalysisApiKey("Bearer secret", "secret")).not.toThrow();
    });

    it.each([
        undefined,
        "secret",
        "Basic secret",
        "Bearer wrong",
        "Bearer secret extra",
    ])("rejects invalid authorization %s", (authorization) => {
        expect(() => requireWatchAnalysisApiKey(authorization, "secret"))
            .toThrow("Invalid analysis credentials");
    });

    it("fails closed when the server key is not configured", () => {
        expect(() => requireWatchAnalysisApiKey("Bearer secret", ""))
            .toThrow("Watch analysis authentication is not configured");
    });
});

import {describe, expect, it, vi, beforeEach} from "vitest";

describe("config", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("getConfig returns object with required top-level keys", async () => {
        const {getConfig} = await import("./index");
        const cfg = getConfig();

        expect(cfg).toHaveProperty("server");
        expect(cfg).toHaveProperty("jwt");
        expect(cfg).toHaveProperty("environment");
        expect(cfg).toHaveProperty("appDatabase");
        expect(cfg).toHaveProperty("gameDatabase");
        expect(cfg).toHaveProperty("evaluationDatabase");
    });

    it("server config has numeric port", async () => {
        const {getConfig} = await import("./index");
        const cfg = getConfig();
        expect(cfg.server.port).toBeDefined();
        expect(typeof cfg.server.port).toBe("number");
    });

    it("jwt config has key property (may be undefined if .env not loaded)", async () => {
        const {getConfig} = await import("./index");
        const cfg = getConfig();
        expect(cfg.jwt).toHaveProperty("key");
    });

    it("getConfig returns the same config object on repeated calls (singleton)", async () => {
        const {getConfig} = await import("./index");
        const cfg1 = getConfig();
        const cfg2 = getConfig();
        expect(cfg1).toBe(cfg2);
    });

    it("appDatabase config has type and host", async () => {
        const {getConfig} = await import("./index");
        const cfg = getConfig();
        expect(cfg.appDatabase).toHaveProperty("type");
        expect(cfg.appDatabase).toHaveProperty("host");
    });

    it("Environment enum is exported", async () => {
        const {Environment} = await import("./index");
        expect(Environment.DEVELOPMENT).toBeDefined();
        expect(Environment.PRODUCTION).toBeDefined();
    });
});

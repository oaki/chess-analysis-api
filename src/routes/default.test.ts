import {describe, expect, it} from "vitest";
import {defaultRoute} from "./default";

describe("defaultRoute", () => {
    it("returns route definition and renders server info", async () => {
        const server = {
            info: {
                host: "localhost",
                port: 8080,
                uri: "http://localhost:8080",
                address: "127.0.0.1",
            },
        };

        const routes = defaultRoute(server);
        expect(routes).toHaveLength(1);
        expect(routes[0].method).toBe("GET");
        expect(routes[0].path).toBe("/");

        const html = await routes[0].handler({}, {});
        expect(html).toContain("Default route is running");
        expect(html).toContain("localhost");
        expect(html).toContain("8080");
    });
});

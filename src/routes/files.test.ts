import {describe, expect, it} from "vitest";
import {filesRoute} from "./files";

describe("filesRoute", () => {
    it("returns /files route and responds oks", async () => {
        const routes = filesRoute({});
        expect(routes).toHaveLength(1);
        expect(routes[0].path).toBe("/files");

        const result = await routes[0].handler({}, {});
        expect(result).toBe("oks");
    });
});

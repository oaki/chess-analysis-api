import path from "node:path";
import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "fetch-timeout": path.resolve(rootDir, "src/test/shims/fetch-timeout.ts"),
        },
    },
    test: {
        include: ["src/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            all: true,
            include: ["src/**/*.ts"],
            exclude: [
                "src/**/*.test.ts",
                "src/test/shims/**",
                "src/**/*.d.ts",
                "src/**/entity/**",
                "src/index.ts",
                "src/convertDb.ts",
                "src/bootstrap.ts",
            ],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
    },
});

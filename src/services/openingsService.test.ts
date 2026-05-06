import {beforeEach, describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => {
    let loadedCallback: (() => void) | null = null;
    const findMock = vi.fn();
    const loadBookMock = vi.fn();

    class PolyglotMock {
        public find = findMock;

        load_book(stream: any) {
            loadBookMock(stream);
        }

        on(event: string, callback: () => void) {
            if (event === "loaded") {
                loadedCallback = callback;
            }
        }
    }

    return {
        findMock,
        loadBookMock,
        triggerLoaded: () => {
            if (loadedCallback) {
                loadedCallback();
            }
        },
    };
});

vi.mock("../libs/polyglot", () => ({
    Polyglot: class {
        public find = mocks.findMock;
        load_book = mocks.loadBookMock;
        on(event: string, callback: () => void) {
            if (event === "loaded") {
                // store per-instance "loaded" callback
                (this as any)._loaded = callback;
            }
        }
    },
}));

vi.mock("fs", () => ({
    createReadStream: vi.fn().mockReturnValue({}),
}));

vi.mock("../config", () => ({
    Environment: {
        DEVELOPMENT: "development",
        PRODUCTION: "production",
    },
    getConfig: () => ({
        environment: "production",
    }),
}));

vi.mock("chess.js", () => ({
    Chess: class {
        private currentFen: string;
        constructor(fen: string) {
            this.currentFen = fen;
        }
        move({from, to}: { from: string; to: string }) {
            return {san: `${from}-${to}`};
        }
        fen() {
            return this.currentFen;
        }
    },
}));

describe("openingsService", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    it("returns empty array before book is loaded", async () => {
        const {default: openingsService} = await import("./openingsService");

        const result = await openingsService.find("fen");
        expect(result).toEqual([]);
    });

    it("returns prepared variants after loaded event", async () => {
        const fs = await import("fs");
        const {default: openingsService} = await import("./openingsService");

        // trigger async loader completion
        const polyglotInstance = (openingsService as any).book;
        polyglotInstance._loaded();

        mocks.findMock.mockReturnValue([
            {algebraic_move: "e2e4", weight: "10"},
        ]);

        const result = await openingsService.find("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

        expect((fs.createReadStream as any)).toHaveBeenCalled();
        expect(mocks.findMock).toHaveBeenCalled();
        expect(result).toEqual([
            expect.objectContaining({
                move: "e2e4",
                weight: "10",
            }),
        ]);
        expect(typeof result?.[0]?.san).toBe("string");
        expect(typeof result?.[0]?.fen).toBe("string");
    });

    it("returns null when polyglot returns nothing", async () => {
        const {default: openingsService} = await import("./openingsService");
        const polyglotInstance = (openingsService as any).book;
        polyglotInstance._loaded();

        mocks.findMock.mockReturnValue(null);
        const result = await openingsService.find("fen");
        expect(result).toBeNull();
    });
});

import {describe, expect, it} from "vitest";
import {DEFAULT_IMPORT_THRESHOLDS, evalPawnsToCentipawns, isMateScore, passesImportFilter} from "./importFilter";
import {RawMoveMeta} from "./types";

function makeMeta(overrides: Partial<RawMoveMeta> = {}): RawMoveMeta {
    return {
        d: "33",
        n: "1472556152",
        mt: "39183",
        wv: "0.25",
        pv: "Re1 Re8 Bf4",
        ...overrides,
    };
}

describe("importFilter", () => {
    describe("isMateScore", () => {
        it("recognises the TCEC mate-in-N encoding", () => {
            expect(isMateScore("M13")).toBe(true);
            expect(isMateScore("M1")).toBe(true);
        });

        it("does not flag a normal pawn score", () => {
            expect(isMateScore("0.25")).toBe(false);
            expect(isMateScore("-1.30")).toBe(false);
        });
    });

    describe("evalPawnsToCentipawns", () => {
        it("converts a decimal pawn score to rounded centipawns", () => {
            expect(evalPawnsToCentipawns("0.25")).toBe(25);
            expect(evalPawnsToCentipawns("-1.3")).toBe(-130);
        });
    });

    describe("passesImportFilter", () => {
        it("accepts a well-computed, quiet, non-mate position", () => {
            expect(passesImportFilter(makeMeta(), DEFAULT_IMPORT_THRESHOLDS)).toBe(true);
        });

        it("rejects a mate score", () => {
            expect(passesImportFilter(makeMeta({wv: "M13"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
        });

        it("rejects a non-numeric node or eval reading", () => {
            expect(passesImportFilter(makeMeta({n: "not-a-number"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
            expect(passesImportFilter(makeMeta({wv: "not-a-number"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
        });

        it("rejects a position below the node threshold", () => {
            expect(passesImportFilter(makeMeta({n: "1000"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
        });

        it("rejects a decisive evaluation above the eval cutoff", () => {
            expect(passesImportFilter(makeMeta({wv: "3.5"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
            expect(passesImportFilter(makeMeta({wv: "-3.5"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(false);
        });

        it("accepts right at the threshold boundaries", () => {
            expect(passesImportFilter(makeMeta({n: "50000000", wv: "2.50"}), DEFAULT_IMPORT_THRESHOLDS)).toBe(true);
        });
    });
});

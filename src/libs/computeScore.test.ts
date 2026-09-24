import {describe, expect, it} from "vitest";
import {calculateComputeScore, calculateNodeScore, calculateTimeScore, COMPUTE_SCORE_MAX} from "./computeScore";

describe("computeScore", () => {
    describe("calculateNodeScore", () => {
        it.each([
            [10_000_000, 0],
            [100_000_000, 0.25],
            [1_000_000_000, 0.5],
            [10_000_000_000, 0.75],
            [100_000_000_000, 1],
        ])("maps %i nodes to a score of %f", (nodes, expected) => {
            expect(calculateNodeScore(nodes)).toBeCloseTo(expected, 10);
        });

        it("clamps below the floor and above the ceiling", () => {
            expect(calculateNodeScore(1)).toBe(0);
            expect(calculateNodeScore(1_000_000_000_000_000)).toBe(1);
        });

        it("treats non-positive nodes as zero", () => {
            expect(calculateNodeScore(0)).toBe(0);
            expect(calculateNodeScore(-5)).toBe(0);
        });
    });

    describe("calculateTimeScore", () => {
        it("is 0 at the 5 second floor and 1 at the 600 second ceiling", () => {
            expect(calculateTimeScore(5_000)).toBeCloseTo(0, 10);
            expect(calculateTimeScore(600_000)).toBeCloseTo(1, 10);
        });

        it("clamps outside the floor/ceiling", () => {
            expect(calculateTimeScore(1_000)).toBe(0);
            expect(calculateTimeScore(10_000_000)).toBe(1);
        });

        it("treats non-positive time as zero", () => {
            expect(calculateTimeScore(0)).toBe(0);
        });
    });

    describe("calculateComputeScore", () => {
        it("weights nodes at 80% and time at 20%, scaled to 0-10000", () => {
            const score = calculateComputeScore(1_000_000_000, 600_000);
            // nodeScore(1B) = 0.5, timeScore(600s) = 1 -> 0.5*0.8 + 1*0.2 = 0.6
            expect(score).toBe(6000);
        });

        it("never exceeds COMPUTE_SCORE_MAX", () => {
            const score = calculateComputeScore(1_000_000_000_000_000, 10_000_000);
            expect(score).toBe(COMPUTE_SCORE_MAX);
        });

        it("is 0 for negligible search effort", () => {
            expect(calculateComputeScore(0, 0)).toBe(0);
        });
    });
});

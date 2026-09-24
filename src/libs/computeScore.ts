export const COMPUTE_SCORE_MAX = 10000;

const NODE_LOG_FLOOR = 7; // log10(10,000,000)
const NODE_LOG_RANGE = 4; // 10M..100B maps to 0..1
const TIME_LOG_FLOOR_SECONDS = 5;
const TIME_LOG_CEILING_SECONDS = 600;
const NODE_WEIGHT = 0.8;
const TIME_WEIGHT = 0.2;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function calculateNodeScore(nodes: number): number {
    if (nodes <= 0) {
        return 0;
    }

    return clamp((Math.log10(nodes) - NODE_LOG_FLOOR) / NODE_LOG_RANGE, 0, 1);
}

export function calculateTimeScore(timeMs: number): number {
    if (timeMs <= 0) {
        return 0;
    }

    const seconds = timeMs / 1000;
    const logRange = Math.log10(TIME_LOG_CEILING_SECONDS) - Math.log10(TIME_LOG_FLOOR_SECONDS);

    return clamp((Math.log10(seconds) - Math.log10(TIME_LOG_FLOOR_SECONDS)) / logRange, 0, 1);
}

/**
 * Measures how much search effort backs an evaluation (nodes + time), not how
 * strong the engine is — engine identity is tracked separately.
 */
export function calculateComputeScore(nodes: number, timeMs: number): number {
    const nodeScore = calculateNodeScore(nodes);
    const timeScore = calculateTimeScore(timeMs);

    return Math.round(COMPUTE_SCORE_MAX * (nodeScore * NODE_WEIGHT + timeScore * TIME_WEIGHT));
}

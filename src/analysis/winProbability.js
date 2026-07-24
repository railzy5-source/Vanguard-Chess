/**
 * winProbability.js
 *
 * Chess.com-style win probability calculations.
 * Based on evaluation changes instead of raw centipawn loss.
 */

export const MATE_SCORE = 32000;

/**
 * Clamp a value.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Returns true if an evaluation represents mate.
 */
export function isMateScore(score) {
    return Math.abs(score) >= MATE_SCORE - 1000;
}

/**
 * Convert Stockfish evaluation (centipawns) to win probability.
 *
 * Returns:
 * 0.0 -> completely lost
 * 0.5 -> equal
 * 1.0 -> completely winning
 */
export function evaluationToWinProbability(score) {

    if (isMateScore(score)) {
        return score > 0 ? 1 : 0;
    }

    score = clamp(score, -1000, 1000);

    return 1 / (1 + Math.exp(-score / 140));
}

/**
 * Convert win probability to %
 */
export function winProbabilityPercent(score) {
    return Math.round(
        evaluationToWinProbability(score) * 1000
    ) / 10;
}

/**
 * Calculate win probability change.
 *
 * Positive = move worsened position.
 * Negative = move improved position.
 */
export function winProbabilityLoss(beforeEval, afterEval) {

    const before = evaluationToWinProbability(beforeEval);
    const after = evaluationToWinProbability(afterEval);

    return before - after;
}

/**
 * Calculate accuracy from win probability change.
 *
 * 100 = perfect
 * 0 = catastrophic
 */
export function accuracyFromWinProbability(beforeEval, afterEval) {

    const loss = Math.max(
        0,
        winProbabilityLoss(beforeEval, afterEval)
    );

    // Chess.com-like smooth curve
    const accuracy =
        100 * Math.exp(-4.5 * loss);

    return Math.round(clamp(accuracy, 0, 100));
}

/**
 * Position category.
 *
 * Used for dynamic move thresholds.
 */
export function getPositionCategory(evalCp) {

    if (isMateScore(evalCp)) {
        return evalCp > 0
            ? "MATE_WIN"
            : "MATE_LOSS";
    }

    const abs = Math.abs(evalCp);

    if (abs < 50)
        return "EQUAL";

    if (abs < 200)
        return "SLIGHT";

    if (abs < 500)
        return "CLEAR";

    return "DECISIVE";
}

/**
 * Human readable advantage.
 */
export function getAdvantage(evalCp) {

    if (isMateScore(evalCp))
        return evalCp > 0
            ? "Winning by force"
            : "Losing by force";

    if (evalCp > 500)
        return "Completely winning";

    if (evalCp > 200)
        return "Clearly better";

    if (evalCp > 50)
        return "Slightly better";

    if (evalCp > -50)
        return "Equal";

    if (evalCp > -200)
        return "Slightly worse";

    if (evalCp > -500)
        return "Clearly worse";

    return "Completely losing";
}
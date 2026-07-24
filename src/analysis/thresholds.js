/**
 * thresholds.js
 *
 * Dynamic Chess.com-style move classification thresholds.
 * These thresholds are based on WIN PROBABILITY LOSS,
 * not raw centipawns.
 */

export const POSITION = {

    EQUAL: "EQUAL",

    SLIGHT: "SLIGHT",

    CLEAR: "CLEAR",

    DECISIVE: "DECISIVE",

    MATE_WIN: "MATE_WIN",

    MATE_LOSS: "MATE_LOSS"

};

export const THRESHOLDS = {

    EQUAL: {
        excellent: 0.010,
        good: 0.030,
        inaccuracy: 0.070,
        mistake: 0.170,
        blunder: Infinity
    },

    SLIGHT: {
        excellent: 0.015,
        good: 0.040,
        inaccuracy: 0.090,
        mistake: 0.200,
        blunder: Infinity
    },

    CLEAR: {
        excellent: 0.025,
        good: 0.060,
        inaccuracy: 0.130,
        mistake: 0.260,
        blunder: Infinity
    },

    DECISIVE: {

        // Already winning or losing.

        excellent: 0.050,

        good: 0.120,

        // Chess.com would often call this a Miss.

        miss: 0.250,

        mistake: 0.450,

        blunder: Infinity
    },

    MATE_WIN: {

        excellent: 0,

        good: 0,

        miss: 0,

        mistake: 0,

        blunder: Infinity
    },

    MATE_LOSS: {

        excellent: 0.20,

        good: 0.35,

        inaccuracy: 0.50,

        mistake: 0.75,

        blunder: Infinity
    }

};

/**
 * Returns the threshold table
 * for a position category.
 */
export function getThresholds(positionCategory) {

    return THRESHOLDS[positionCategory]
        || THRESHOLDS.EQUAL;

}

/**
 * Classify a move from
 * win probability loss.
 */
export function classifyFromLoss(positionCategory, loss) {

    const t = getThresholds(positionCategory);

    if (loss <= t.excellent)
        return "Excellent";

    if (loss <= t.good)
        return "Good";

    if ("miss" in t && loss <= t.miss)
        return "Miss";

    if (loss <= t.inaccuracy)
        return "Inaccuracy";

    if (loss <= t.mistake)
        return "Mistake";

    return "Blunder";

}
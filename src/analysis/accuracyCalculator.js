/**
 * accuracyCalculator.js
 *
 * Calculates Chess.com-style game accuracy from
 * move accuracies (based on win probability loss).
 */

import {
    accuracyFromWinProbability
} from "./winProbability.js";

export class AccuracyCalculator {

    constructor() {
        this.moves = [];
    }

    /**
     * Add a move to the calculation.
     */
    addMove(bestEval, playedEval) {

        const accuracy =
            accuracyFromWinProbability(
                bestEval,
                playedEval
            );

        this.moves.push({
            accuracy,
            bestEval,
            playedEval
        });

        return accuracy;
    }

    /**
     * Average move accuracy.
     */
    getAverageAccuracy() {

        if (!this.moves.length)
            return 100;

        const total =
            this.moves.reduce(
                (sum, move) =>
                    sum + move.accuracy,
                0
            );

        return Math.round(
            (total / this.moves.length) * 10
        ) / 10;
    }

    /**
     * Statistics for UI.
     */
    getStats() {

        const stats = {

            moves: this.moves.length,

            average:
                this.getAverageAccuracy(),

            perfect: 0,

            excellent: 0,

            good: 0,

            inaccurate: 0,

            mistakes: 0,

            blunders: 0

        };

        for (const move of this.moves) {

            const a = move.accuracy;

            if (a === 100)
                stats.perfect++;

            else if (a >= 95)
                stats.excellent++;

            else if (a >= 85)
                stats.good++;

            else if (a >= 70)
                stats.inaccurate++;

            else if (a >= 50)
                stats.mistakes++;

            else
                stats.blunders++;
        }

        return stats;

    }

    reset() {
        this.moves.length = 0;
    }

}
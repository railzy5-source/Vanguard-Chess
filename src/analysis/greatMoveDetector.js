/**
 * greatMoveDetector.js
 *
 * Detects Chess.com-style Great moves.
 *
 * Great moves are:
 *
 * • Only winning move
 * • Only drawing move
 * • Only defensive resource
 */

export function isGreat({

    classification,

    multipv = [],

    evalBefore,

    evalAfter,

    bestEval

}) {

    // Brilliant overrides Great

    if (classification !== "Best")
        return false;

    if (multipv.length < 2)
        return false;

    // second-best move

    const second = multipv[1];

    if (!second)
        return false;

    // If second move is much worse,
    // then this move was unique.

    const gap =
        Math.abs(bestEval - second.score);

    if (gap >= 120)
        return true;

    // Defensive resource

    if (

        evalBefore < -200 &&

        evalAfter > evalBefore + 150

    )
        return true;

    return false;

}
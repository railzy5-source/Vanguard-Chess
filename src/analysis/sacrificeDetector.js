/**
 * sacrificeDetector.js
 *
 * Detects whether a move intentionally sacrifices material
 * while maintaining or improving the evaluation.
 *
 * This is NOT responsible for deciding "Brilliant".
 * It only answers:
 *
 *    Was this move a real sacrifice?
 */

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 0
};

/**
 * Material count from a FEN.
 */
export function getMaterial(fen) {

    const board = fen.split(" ")[0];

    let white = 0;
    let black = 0;

    for (const c of board) {

        if (c === "/") continue;

        if (!isNaN(c)) continue;

        const value =
            PIECE_VALUES[c.toLowerCase()] || 0;

        if (c === c.toUpperCase())
            white += value;
        else
            black += value;
    }

    return {
        white,
        black
    };

}

/**
 * Material balance.
 *
 * Positive = White ahead.
 * Negative = Black ahead.
 */
export function materialBalance(fen) {

    const material =
        getMaterial(fen);

    return (
        material.white -
        material.black
    );

}

/**
 * Detect whether the move
 * voluntarily gave up material.
 */
export function isMaterialSacrifice(

    fenBefore,

    fenAfter,

    playerColor

) {

    const before =
        materialBalance(fenBefore);

    const after =
        materialBalance(fenAfter);

    if (playerColor === "w") {

        return after < before;

    }

    return after > before;

}

/**
 * Returns how much
 * material was sacrificed.
 */
export function sacrificeValue(

    fenBefore,

    fenAfter,

    playerColor

) {

    const before =
        materialBalance(fenBefore);

    const after =
        materialBalance(fenAfter);

    if (playerColor === "w") {

        return Math.max(
            0,
            before - after
        );

    }

    return Math.max(
        0,
        after - before
    );

}

/**
 * True sacrifice if:
 *
 * 1. Material given up
 * 2. Evaluation maintained
 */
export function isTrueSacrifice({

    fenBefore,

    fenAfter,

    playerColor,

    evalBefore,

    evalAfter

}) {

    if (
        !isMaterialSacrifice(
            fenBefore,
            fenAfter,
            playerColor
        )
    ) {

        return false;

    }

    // sacrifice accepted
    // but position stays equal or better

    const tolerance = 40;

    return evalAfter >=
        evalBefore - tolerance;

}
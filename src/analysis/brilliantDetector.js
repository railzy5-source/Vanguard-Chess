/**
 * brilliantDetector.js
 *
 * Chess.com-style Brilliant move detection.
 *
 * A move is Brilliant when:
 *
 * ✓ Best engine move
 * ✓ Genuine sacrifice
 * ✓ Evaluation maintained
 * ✓ Position improves or remains winning
 */

import { isTrueSacrifice } from "./sacrificeDetector.js";

export function isBrilliant({

    classification,

    fenBefore,

    fenAfter,

    playerColor,

    evalBefore,

    evalAfter,

    bestEval,

    isForced = false

}) {

    // must be engine best

    if (classification !== "Best")
        return false;

    // forced moves aren't brilliant

    if (isForced)
        return false;

    // must sacrifice material

    if (!isTrueSacrifice({

        fenBefore,

        fenAfter,

        playerColor,

        evalBefore,

        evalAfter

    }))
        return false;

    // evaluation must stay basically the same

    if (Math.abs(bestEval - evalAfter) > 25)
        return false;

    return true;

}
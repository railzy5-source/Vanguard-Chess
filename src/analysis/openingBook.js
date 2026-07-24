/**
 * openingBook.js
 *
 * Simple opening book detection.
 * Can later be upgraded to use ECO/PGN databases.
 */

export function isBookMove(moveNumber, openingName) {

    if (!openingName)
        return false;

    // Chess.com generally stops calling moves
    // "Book" once theory has ended.

    if (moveNumber > 20)
        return false;

    return true;

}

export function buildBookResult(openingName) {

    return {

        classification: "Book",

        opening: openingName,

        reason:
            `Opening theory: ${openingName}`

    };

}
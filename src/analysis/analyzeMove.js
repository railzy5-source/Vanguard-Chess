/**
 * analyzeMove.js
 *
 * Connects ChessEngine output with the analysis pipeline.
 *
 * Converts:
 * Stockfish data
 *
 * into:
 * Chess.com style move review data
 */

import { Chess } from "chess.js";

import { classifyMove } from "./moveClassifier.js";
import { AccuracyCalculator } from "./accuracyCalculator.js";


export async function analyzeMove({

    engine,

    fenBefore,

    playedMove,

    playerColor,

    moveNumber,

    openingName = null

}) {


    const game = new Chess(fenBefore);


    // Evaluation BEFORE move

    const beforeAnalysis =
        await engine.analyzePosition(
            fenBefore,
            3
        );


    if (!beforeAnalysis.length) {

        return null;

    }


    const bestMove =
        beforeAnalysis[0];


    const bestEval =
        bestMove.score;



    // Apply player's move

    let moveResult;


    try {

        moveResult =
            game.move({
                from: playedMove.substring(0,2),
                to: playedMove.substring(2,4),
                promotion:
                    playedMove.length > 4
                    ? playedMove.substring(4,5)
                    : undefined
            });


    } catch(e) {

        console.error(e);
        return null;

    }


    if (!moveResult)
        return null;



    const fenAfter =
        game.fen();



    // Evaluate resulting position

    const afterAnalysis =
        await engine.analyzePosition(
            fenAfter,
            3
        );



    const afterEval =
        afterAnalysis[0]
            ? afterAnalysis[0].score
            : 0;



    const classification =
        classifyMove({

            fenBefore,

            fenAfter,

            playerColor,

            playedMove,

            bestMove:
                bestMove.moveUci,

            bestEval,

            evalAfter:
                afterEval,

            multiPV:
                beforeAnalysis,

            moveNumber,

            openingName

        });



    const accuracy =
        new AccuracyCalculator();


    const moveAccuracy =
        accuracy.addMove(
            bestEval,
            afterEval
        );



    return {

        move:
            playedMove,

        san:
            moveResult.san,


        fenBefore,

        fenAfter,


        bestMove:
            bestMove.moveUci,


        bestEval,

        evalAfter:
            afterEval,


        multiPV:
            beforeAnalysis,


        classification,


        accuracy:
            moveAccuracy

    };

}
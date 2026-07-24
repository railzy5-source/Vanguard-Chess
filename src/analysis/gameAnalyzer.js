/**
 * gameAnalyzer.js
 *
 * Main analysis pipeline.
 *
 * PGN
 *  |
 *  ↓
 * Engine evaluation
 *  |
 *  ↓
 * Move classification
 *  |
 *  ↓
 * Accuracy calculation
 *  |
 *  ↓
 * Review object
 */

import { Chess } from "chess.js";

import {
    classifyMove
} from "./moveClassifier.js";

import {
    AccuracyCalculator
} from "./accuracyCalculator.js";



export class GameAnalyzer {


    constructor(engine) {

        this.engine = engine;

    }





    /**
     * Analyse complete PGN
     */
    async analyzePGN(
        pgn,
        options = {}
    ) {


        const {

            openingName = null

        } = options;




        const chess =
            new Chess();



        const loaded =
            chess.loadPgn(
                pgn
            );



        if(!loaded) {

            throw new Error(
                "Invalid PGN"
            );

        }





        const history =
            chess.history({
                verbose:true
            });



        /*
            Restart game.
            We need the position BEFORE every move.
        */

        const replay =
            new Chess();





        const whiteAccuracy =
            new AccuracyCalculator();


        const blackAccuracy =
            new AccuracyCalculator();





        const moves = [];





        for(
            let i = 0;
            i < history.length;
            i++
        ) {


            const move =
                history[i];



            const fenBefore =
                replay.fen();



            const playerColor =
                replay.turn() === 'w'
                    ? 'white'
                    : 'black';



            const uci =
                move.from
                +
                move.to
                +
                (
                    move.promotion || ''
                );





            /*
                Ask Stockfish
            */


            const evaluation =
                await this.engine.evaluateMove({

                    fenBefore,

                    playedMove:
                        uci,

                    playerColor

                });





            if(!evaluation)
                continue;







            const classification =
                classifyMove({

                    fenBefore,

                    fenAfter:
                        evaluation.fenAfter,


                    playerColor,


                    playedMove:
                        uci,


                    bestMove:
                        evaluation.bestMove,


                    bestEval:
                        evaluation.bestEval,


                    evalAfter:
                        evaluation.playedEval,


                    multiPV:
                        evaluation.multiPV,


                    moveNumber:
                        Math.floor(i / 2) + 1,


                    openingName

                });







            let accuracy;



            if(playerColor === "white") {


                accuracy =
                    whiteAccuracy.addMove(

                        evaluation.bestEval,

                        evaluation.playedEval

                    );


            }

            else {


                accuracy =
                    blackAccuracy.addMove(

                        evaluation.bestEval,

                        evaluation.playedEval

                    );


            }






            moves.push({

                number:
                    Math.floor(i / 2) + 1,


                color:
                    playerColor,


                san:
                    move.san,


                uci,


                classification,


                accuracy,


                bestMove:
                    evaluation.bestMove,


                bestEval:
                    evaluation.bestEval,


                playedEval:
                    evaluation.playedEval,


                fenBefore:
                    evaluation.fenBefore,


                fenAfter:
                    evaluation.fenAfter,


                multiPV:
                    evaluation.multiPV


            });





            /*
                Advance replay board
            */


            replay.move(move);



        }






        return {


            moves,



            accuracy:{


                white:
                    whiteAccuracy
                    .getAverageAccuracy(),


                black:
                    blackAccuracy
                    .getAverageAccuracy()


            },



            stats:{


                white:
                    whiteAccuracy
                    .getStats(),


                black:
                    blackAccuracy
                    .getStats()


            }


        };


    }


}
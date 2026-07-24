import {

    evaluationToWinProbability,

    winProbabilityLoss,

    accuracyFromWinProbability,

    getPositionCategory

} from "./winProbability.js";


import {
    classifyFromLoss
} from "./thresholds.js";


import {
    isBrilliant
} from "./brilliantDetector.js";


import {
    isGreat
} from "./greatMoveDetector.js";





export function classifyMove(data) {


    const {

        playedMove,

        bestMove,


        evalBefore,

        evalAfter,


        bestEval,


        fenBefore,

        fenAfter,


        playerColor,


        moveNumber,


        openingMove = false,


        multipv = [],


        multiPV = [],


        isForced = false


    } = data;



    /*
        Support both names
    */

    const candidates =
        multipv.length
            ? multipv
            : multiPV;





    //----------------------------------------
    // Opening
    //----------------------------------------

    if(openingMove) {


        return buildResult(
            "Book",
            evalBefore,
            evalAfter,
            bestEval,
            "Opening theory."
        );

    }






    //----------------------------------------
    // Was it best?
    //----------------------------------------

    const isBest =

        playedMove === bestMove

        ||

        candidates.some(move =>

            (
                move.moveUci === playedMove
                ||
                move.move === playedMove
            )

            &&

            Math.abs(
                bestEval - move.score
            ) <= 12

        );








    if(isBest) {



        //--------------------------------
        // Brilliant check
        //--------------------------------

        if(

            isBrilliant({

                classification:"Best",

                fenBefore,

                fenAfter,

                playerColor,

                evalBefore,

                evalAfter,

                bestEval,

                isForced

            })

        ) {


            return buildResult(

                "Brilliant",

                evalBefore,

                evalAfter,

                bestEval,

                "A brilliant sacrifice or tactical idea."

            );

        }







        //--------------------------------
        // Great check
        //--------------------------------

        if(

            isGreat({

                classification:"Best",

                multipv:candidates,

                evalBefore,

                evalAfter,

                bestEval

            })

        ) {


            return buildResult(

                "Great",

                evalBefore,

                evalAfter,

                bestEval,

                "A difficult and accurate move."

            );

        }







        return buildResult(

            "Best",

            evalBefore,

            evalAfter,

            bestEval,

            "Engine's preferred move."

        );


    }







    //----------------------------------------
    // Mate loss detection
    //----------------------------------------

    if(

        Math.abs(evalBefore) >= 30000

        &&

        Math.abs(evalAfter) < 30000

    ) {


        return buildResult(

            "Blunder",

            evalBefore,

            evalAfter,

            bestEval,

            "Missed a forced mate."

        );

    }







    //----------------------------------------
    // Normal evaluation loss
    //----------------------------------------

    const category =
        getPositionCategory(
            evalBefore
        );



    const loss =

        Math.max(

            0,

            winProbabilityLoss(

                bestEval,

                evalAfter

            )

        );






    const classification =

        classifyFromLoss(

            category,

            loss

        );







    return buildResult(

        classification,

        evalBefore,

        evalAfter,

        bestEval,

        buildReason(
            classification
        )

    );

}








function buildResult(

    classification,

    evalBefore,

    evalAfter,

    bestEval,

    reason=""

) {


    return {


        classification,


        accuracy:

            accuracyFromWinProbability(

                bestEval,

                evalAfter

            ),



        cpLoss:

            Math.max(

                0,

                bestEval - evalAfter

            ),



        evaluationBefore:

            evalBefore,



        evaluationAfter:

            evalAfter,



        bestEvaluation:

            bestEval,



        winProbabilityBefore:

            evaluationToWinProbability(
                evalBefore
            ),



        winProbabilityAfter:

            evaluationToWinProbability(
                evalAfter
            ),



        reason


    };


}








function buildReason(type) {


    const reasons = {


        Best:
            "Engine's preferred move.",


        Brilliant:
            "A creative tactical idea or sacrifice.",


        Great:
            "A difficult and accurate move.",


        Excellent:
            "Maintains the advantage.",


        Good:
            "A solid move.",


        Inaccuracy:
            "A stronger continuation existed.",


        Miss:
            "A stronger tactical opportunity was missed.",


        Mistake:
            "The position noticeably worsened.",


        Blunder:
            "The move caused serious damage.",


        Book:
            "Opening theory."

    };


    return reasons[type] || "";

}

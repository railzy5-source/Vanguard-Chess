/**
 * coach.js
 *
 * Converts chess analysis into Coach Naomi reactions.
 *
 * Engine
 *   |
 *   ↓
 * Analysis
 *   |
 *   ↓
 * Coach Bridge
 *   |
 *   ↓
 * CoachNaomi
 */


export class ChessCoach {


    constructor(coachInstance) {

        this.coach =
            coachInstance;

    }




    /**
     * React to analysed move
     */
    reviewMove(moveData) {


        if(!this.coach)
            return;



        const {

            san,

            classification,

            accuracy,

            bestMove,

            multiPV,

            playerColor,


            fenBefore,

            fenAfter


        } = moveData;





        const message =
            this.generateMessage({

                classification,

                accuracy,

                bestMove,

                san

            });





        this.coach.reactToMove({

            san,


            classification,


            isPlayer:true,


            isCheck:
                false,


            isCheckmate:
                false,


            isCapture:
                san.includes("x"),


            bestMoveSan:
                bestMove,


            openingName:
                null

        });



    }







    /**
     * Generate deeper explanations
     */
    generateMessage(data) {


        const {

            classification,

            accuracy,

            bestMove,

            san


        } = data;



        switch(
            classification
        ) {



            case "Brilliant":

                return (

                    `💎 Brilliant ${san}! ` +

                    `You found a rare tactical idea.`

                );





            case "Great":

                return (

                    `🌟 Excellent vision! ` +

                    `${san} was a difficult move to find.`

                );





            case "Best":

                return (

                    `🎯 Perfect. ${san} was the engine's top choice.`

                );





            case "Excellent":

                return (

                    `✨ Very accurate. ` +

                    `You maintained the advantage.`

                );





            case "Good":

                return (

                    `👍 Solid move. The position remains healthy.`

                );





            case "Inaccuracy":

                return (

                    `🤔 Slight slip. ` +

                    `A stronger idea was available.`

                );





            case "Miss":

                return (

                    `⚠️ Opportunity missed. ` +

                    `Look for tactical chances before moving.`

                );





            case "Mistake":

                return (

                    `😅 This changed the position. ` +

                    `Let's find what went wrong.`

                );





            case "Blunder":

                return (

                    `🚨 Big mistake. ` +

                    `Always check checks, captures and threats.`

                );





            default:

                return null;

        }


    }



}

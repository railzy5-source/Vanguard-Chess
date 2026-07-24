/**
 * Hikari Chess Coach - Engine Wrapper Module
 *
 * Stockfish Web Worker wrapper.
 *
 * Responsibilities:
 * - Stockfish communication
 * - MultiPV analysis
 * - Bot strength scaling
 * - Objective analysis
 * - Evaluation data provider
 *
 * Classification and coaching are handled separately.
 */

import { Chess } from 'chess.js';


export class ChessEngine {

    constructor() {

        this.worker = null;

        this.isReady = false;

        this.uciReady = false;

        this.engineBusy = false;

        this.multiPVData = [];

        this.currentTask = null;


        // Bot settings
        this.difficulty = 'Club';

        this.currentSkillLevel = 10;

        this.currentElo = 1500;


        // Analysis cache
        this.analysisCache = new Map();


        // Prevent stale PV data
        this.lastDepth = 0;


        this.initStockfish();

    }



    /**
     * Initialise Stockfish worker
     */
    initStockfish() {

        try {


            const stockfishCdn =
                'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';



            const workerCode =
                `importScripts('${stockfishCdn}');`;



            const blob =
                new Blob(
                    [workerCode],
                    {
                        type:
                        'application/javascript'
                    }
                );



            const blobUrl =
                URL.createObjectURL(blob);



            this.worker =
                new Worker(blobUrl);



            this.worker.onmessage =
                (e) => {

                    this.handleEngineMessage(
                        e.data
                    );

                };



            this.worker.onerror =
                (err) => {

                    console.warn(
                        'Stockfish worker failed:',
                        err
                    );


                    this.worker = null;

                };



            // Start UCI handshake

            this.sendCommand(
                'uci'
            );



        }
        catch(e) {


            console.warn(
                'Stockfish unavailable. Using fallback engine.',
                e
            );


            this.worker = null;

        }

    }




    /**
     * Send command safely
     */
    sendCommand(command) {

        if (!this.worker)
            return;


        this.worker.postMessage(
            command
        );

    }





    /**
     * Handle UCI messages
     */
    handleEngineMessage(msg) {


        if (typeof msg !== 'string')
            return;



        /*
            Stockfish startup

            uci
              |
              ↓
            uciok
              |
              ↓
            options
              |
              ↓
            isready
        */


        if (msg === 'uciok') {


            this.uciReady = true;


            this.sendCommand(
                'setoption name MultiPV value 3'
            );


            this.sendCommand(
                'setoption name Threads value 1'
            );


            this.sendCommand(
                'setoption name Hash value 64'
            );


            this.sendCommand(
                'isready'
            );


            return;

        }



        if (msg === 'readyok') {


            this.isReady = true;


            return;

        }




        if (
            msg.startsWith('info depth')
            &&
            msg.includes('score')
            &&
            msg.includes('pv')
        ) {


            this.parseInfoLine(
                msg
            );

        }





        if (
            msg.startsWith('bestmove')
        ) {


            const parts =
                msg.split(' ');



            const bestMove =
                parts[1];



            if (!this.currentTask)
                return;




            const task =
                this.currentTask;



            this.currentTask = null;

            this.engineBusy = false;




            if(task.type === 'bestmove') {


                task.resolve({

                    bestMove,

                    multiPV:
                        [
                            ...this.multiPVData
                        ]

                });


            }



            else if(task.type === 'analyze') {


                task.resolve(

                    [
                        ...this.multiPVData
                    ]

                );


            }

        }

    }

    /**
     * Parse Stockfish info line
     *
     * Converts UCI output into:
     * {
     *   rank,
     *   moveUci,
     *   score,
     *   evalStr,
     *   pv
     * }
     */
    parseInfoLine(msg) {


        const multipvMatch =
            msg.match(/multipv (\d+)/);


        const cpMatch =
            msg.match(/score cp (-?\d+)/);


        const mateMatch =
            msg.match(/score mate (-?\d+)/);


        const pvMatch =
            msg.match(/ pv (.+)/);



        if (!pvMatch)
            return;



        const rank =
            multipvMatch
                ? parseInt(
                    multipvMatch[1],
                    10
                )
                : 1;



        const pv =
            pvMatch[1]
                .trim()
                .split(' ');



        const moveUci =
            pv[0];



        let score = 0;

        let evalStr = '+0.00';



        /*
            winProbability.js uses:

            MATE_SCORE = 32000

            Keep everything compatible.
        */


        if (mateMatch) {


            const mate =
                parseInt(
                    mateMatch[1],
                    10
                );



            score =
                mate > 0
                    ? 32000 - mate
                    : -32000 + Math.abs(mate);



            evalStr =
                mate > 0
                    ? `#${mate}`
                    : `-#${Math.abs(mate)}`;

        }


        else if(cpMatch) {


            score =
                parseInt(
                    cpMatch[1],
                    10
                );



            evalStr =
                (
                    score >= 0
                        ? '+'
                        : ''
                )
                +
                (
                    score / 100
                ).toFixed(2);

        }




        this.multiPVData[rank - 1] = {


            rank,


            moveUci,


            score,


            evalStr,


            pv


        };

    }





    /**
     * Set engine strength by ELO
     */
    setEngineElo(elo) {


        const clamped =
            Math.max(
                100,
                Math.min(
                    2700,
                    elo
                )
            );



        this.sendCommand(
            'setoption name UCI_LimitStrength value true'
        );


        this.sendCommand(
            `setoption name UCI_Elo value ${clamped}`
        );



        let skillLevel = 20;
        let depth = 12;
        let movetime = 1000;
        let blunderChance = 0;




        if(clamped <= 600) {

            skillLevel = 0;
            depth = 2;
            movetime = 100;
            blunderChance = 0.55;

        }


        else if(clamped <= 1000) {

            skillLevel = 1;
            depth = 4;
            movetime = 250;
            blunderChance = 0.40;

        }


        else if(clamped <= 1400) {

            skillLevel = 5;
            depth = 6;
            movetime = 450;
            blunderChance = 0.25;

        }


        else if(clamped <= 1800) {

            skillLevel = 10;
            depth = 9;
            movetime = 900;
            blunderChance = 0.12;

        }


        else if(clamped <= 2200) {

            skillLevel = 15;
            depth = 12;
            movetime = 1400;
            blunderChance = 0.05;

        }



        else {

            skillLevel = 20;
            depth = 18;
            movetime = 2500;

        }





        this.sendCommand(
            `setoption name Skill Level value ${skillLevel}`
        );


        this.currentSkillLevel =
            skillLevel;


        this.currentElo =
            clamped;



        return {

            depth,

            movetime,

            skillLevel,

            blunderChance

        };


    }





    /**
     * Set difficulty preset
     */
    setDifficulty(
        level,
        chessElo = 1500
    ) {


        this.difficulty =
            level;



        if(level === 'ELO') {

            return this.setEngineElo(
                chessElo
            );

        }



        const settings = {


            Beginner: {

                skill:3,

                elo:600

            },


            Club: {

                skill:10,

                elo:1200

            },


            Master: {

                skill:20,

                elo:2600

            }

        };



        const s =
            settings[level];



        if(!s)
            return;



        this.sendCommand(
            'setoption name UCI_LimitStrength value false'
        );



        this.sendCommand(
            `setoption name Skill Level value ${s.skill}`
        );



        this.currentSkillLevel =
            s.skill;



        this.currentElo =
            s.elo;


    }







    /**
     * Get engine best move
     */
    getBestMove(
        fen,
        difficulty = this.difficulty,
        chessElo = 1500
    ) {


        return new Promise(
            resolve => {


                this.multiPVData = [];



                let depth = 8;

                let movetime = 800;

                let blunderChance = 0;



                if(difficulty === 'ELO') {


                    const s =
                        this.setEngineElo(
                            chessElo
                        );


                    depth =
                        s.depth;


                    movetime =
                        s.movetime;


                    blunderChance =
                        s.blunderChance;


                }



                else {


                    const preset =
                        this.setDifficulty(
                            difficulty
                        );


                }





                if(
                    this.worker
                    &&
                    this.isReady
                ) {


                    this.engineBusy = true;



                    this.currentTask = {


                        type:'bestmove',


                        resolve:
                            result =>
                                resolve({

                                    ...result,

                                    blunderChance

                                })

                    };



                    this.sendCommand(
                        `position fen ${fen}`
                    );



                    this.sendCommand(
                        `go depth ${depth} movetime ${movetime}`
                    );

                }



                else {


                    const fallback =
                        this.fallbackAnalyze(
                            fen,
                            3
                        );


                    resolve({

                        bestMove:
                            fallback[0]?.moveUci
                            || null,


                        multiPV:
                            fallback,


                        blunderChance

                    });


                }


            }

        );


    }






    /**
     * Objective analysis.
     *
     * Always runs full strength.
     *
     * Used for:
     * - move grading
     * - accuracy
     * - best move arrows
     * - coach review
     */
    analyzePosition(
        fen,
        multiPVCount = 3
    ) {


        const cacheKey =
            `${fen}_${multiPVCount}_objective`;



        if(this.analysisCache.has(cacheKey)) {

            return Promise.resolve(
                this.analysisCache.get(cacheKey)
            );

        }





        if(this.engineBusy) {

            this.stop();

        }




        return new Promise(resolve => {


            this.multiPVData = [];



            const finish =
                result => {


                    if(result?.length) {


                        this.analysisCache.set(
                            cacheKey,
                            result
                        );



                        if(this.analysisCache.size > 100) {


                            const first =
                                this.analysisCache
                                .keys()
                                .next()
                                .value;


                            this.analysisCache.delete(
                                first
                            );


                        }

                    }


                    resolve(result);

                };





            if(
                this.worker
                &&
                this.isReady
            ) {



                this.engineBusy = true;



                this.currentTask = {


                    type:'analyze',


                    resolve:finish


                };




                /*
                    Force objective strength.

                    Never inherit bot difficulty.
                */


                this.sendCommand(
                    'setoption name UCI_LimitStrength value false'
                );


                this.sendCommand(
                    'setoption name Skill Level value 20'
                );



                this.sendCommand(
                    `setoption name MultiPV value ${multiPVCount}`
                );



                this.sendCommand(
                    `position fen ${fen}`
                );



                this.sendCommand(
                    'go depth 12 movetime 1200'
                );


            }


            else {


                finish(
                    this.fallbackAnalyze(
                        fen,
                        multiPVCount
                    )
                );


            }


        });


    }







    /**
     * Evaluate a played move.
     *
     * This is the main connection point
     * between engine and analysis modules.
     *
     * Returns:
     *
     * {
     * fenBefore,
     * fenAfter,
     * playedMove,
     * bestMove,
     * bestEval,
     * playedEval,
     * multiPV
     * }
     */
    async evaluateMove({

        fenBefore,

        playedMove,

        playerColor

    }) {



        const before =
            await this.analyzePosition(
                fenBefore,
                3
            );



        if(!before.length)
            return null;




        const best =
            before[0];



        const game =
            new Chess(
                fenBefore
            );




        const move = {


            from:
                playedMove.substring(0,2),


            to:
                playedMove.substring(2,4),


            promotion:
                playedMove.length > 4
                    ? playedMove.substring(4,5)
                    : undefined

        };




        const played =
            game.move(move);



        if(!played)
            return null;



        const fenAfter =
            game.fen();




        const after =
            await this.analyzePosition(
                fenAfter,
                3
            );



        const playedEval =
            after.length
                ? after[0].score
                : 0;





        return {


            fenBefore,


            fenAfter,


            playedMove,


            playerColor,



            san:
                played.san,



            bestMove:
                best.moveUci,



            bestEval:
                best.score,



            playedEval,



            multiPV:
                before


        };


    }








    /**
     * Generate continuation line.
     *
     * Uses Stockfish PV when available.
     */
    getContinuationLine(
        fen,
        moveUci,
        plies = 10
    ) {


        const result = [];



        const game =
            new Chess(fen);



        try {


            let move =
                game.move({

                    from:
                        moveUci.substring(0,2),

                    to:
                        moveUci.substring(2,4),

                    promotion:
                        moveUci.length > 4
                        ? moveUci.substring(4,5)
                        : undefined

                });



            if(!move)
                return result;



            result.push({

                fen:
                    game.fen(),


                moveSan:
                    move.san,


                moveUci,


                color:
                    move.color

            });





            for(
                let i = 1;
                i < plies;
                i++
            ) {


                if(game.isGameOver())
                    break;



                const pv =
                    this.fallbackAnalyze(
                        game.fen(),
                        1
                    );



                if(!pv.length)
                    break;



                const next =
                    pv[0].moveUci;



                const m =
                    game.move({

                        from:
                            next.substring(0,2),

                        to:
                            next.substring(2,4),

                        promotion:
                            next.length > 4
                            ? next.substring(4,5)
                            : undefined

                    });



                if(!m)
                    break;



                result.push({

                    fen:
                        game.fen(),


                    moveSan:
                        m.san,


                    moveUci:
                        next,


                    color:
                        m.color

                });


            }


        }
        catch(e) {


            console.error(
                'Continuation error',
                e
            );


        }



        return result;

    }








    /**
     * Offline fallback evaluator.
     */
    fallbackAnalyze(
        fen,
        count = 3
    ) {


        const game =
            new Chess(fen);



        const moves =
            game.moves({
                verbose:true
            });



        if(!moves.length)
            return [];



        const white =
            game.turn() === 'w';




        const scores =
            moves.map(move => {


                game.move(move);



                const score =
                    this.evaluatePositionSimple(
                        game
                    );



                game.undo();




                return {


                    moveUci:
                        move.from
                        +
                        move.to
                        +
                        (move.promotion || ''),



                    san:
                        move.san,



                    score:
                        white
                        ? score
                        : -score


                };


            });




        scores.sort(
            (a,b)=>
                b.score-a.score
        );



        return scores
            .slice(0,count)
            .map(
                (m,i)=>({


                    rank:i+1,


                    moveUci:
                        m.moveUci,


                    san:
                        m.san,


                    score:
                        m.score,


                    evalStr:
                        (
                            m.score >=0
                            ? '+'
                            :''
                        )
                        +
                        (
                            m.score/100
                        ).toFixed(2),



                    pv:[
                        m.moveUci
                    ]


                })
            );


    }







    evaluatePositionSimple(game) {


        if(game.isCheckmate()) {


            return game.turn()==='w'
                ? -32000
                : 32000;

        }



        if(game.isDraw())
            return 0;



        const values = {


            p:100,

            n:320,

            b:330,

            r:500,

            q:900,

            k:20000


        };



        let score = 0;



        const board =
            game.board();



        for(
            let r=0;
            r<8;
            r++
        ) {


            for(
                let c=0;
                c<8;
                c++
            ) {


                const piece =
                    board[r][c];



                if(!piece)
                    continue;



                const value =
                    values[piece.type];



                if(piece.color==='w')
                    score += value;

                else
                    score -= value;


            }

        }



        return score;


    }







    stop() {


        if(this.worker)
            this.sendCommand('stop');



        if(
            this.currentTask
            &&
            this.currentTask.resolve
        ) {


            this.currentTask.resolve([]);

        }



        this.currentTask = null;

        this.engineBusy = false;

        this.multiPVData = [];

    }



}

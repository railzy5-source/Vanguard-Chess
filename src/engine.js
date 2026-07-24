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
 */

import { Chess } from 'chess.js';


export class ChessEngine {

    constructor() {

        this.worker = null;

        this.isReady = false;

        this.uciReady = false;

        this.readyResolve = null;

        this.engineBusy = false;

        this.multiPVData = [];

        this.currentTask = null;


        this.difficulty = 'Club';

        this.currentSkillLevel = 10;

        this.currentElo = 1500;


        this.analysisCache = new Map();

        this.lastDepth = 0;


        this.readyPromise = this.initStockfish();

    }



    async initStockfish() {

        return new Promise((resolve) => {

            this.readyResolve = resolve;


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


                        if(this.readyResolve)
                            this.readyResolve(false);

                    };



                this.sendCommand(
                    'uci'
                );


            }
            catch(e) {

                console.warn(
                    'Stockfish unavailable:',
                    e
                );


                this.worker = null;


                resolve(false);

            }


        });

    }




    sendCommand(command) {

        if(!this.worker)
            return;


        this.worker.postMessage(
            command
        );

    }





    handleEngineMessage(msg) {


        if(typeof msg !== 'string')
            return;




        if(msg === 'uciok') {


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





        if(msg === 'readyok') {


            this.isReady = true;


            if(this.readyResolve) {

                this.readyResolve(true);

                this.readyResolve = null;

            }


            return;

        }




        if(
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





        if(
            msg.startsWith('bestmove')
        ) {


            const bestMove =
                msg.split(' ')[1];



            if(!this.currentTask)
                return;



            const task =
                this.currentTask;



            this.currentTask = null;

            this.engineBusy = false;



            if(task.type === 'bestmove') {


                task.resolve({

                    bestMove,

                    multiPV:
                        this.multiPVData
                        .filter(Boolean)

                });


            }


            if(task.type === 'analyze') {


                task.resolve(

                    this.multiPVData
                    .filter(Boolean)

                );


            }


        }

    }
        parseInfoLine(msg) {

        const multipvMatch =
            msg.match(/multipv (\d+)/);


        const cpMatch =
            msg.match(/score cp (-?\d+)/);


        const mateMatch =
            msg.match(/score mate (-?\d+)/);


        const pvMatch =
            msg.match(/ pv (.+)/);



        if(!pvMatch)
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



        if(mateMatch) {


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

            Beginner:{
                skill:3,
                elo:600
            },

            Club:{
                skill:10,
                elo:1200
            },

            Master:{
                skill:20,
                elo:2600
            }

        };



        const selected =
            settings[level];



        if(!selected)
            return;



        this.sendCommand(
            'setoption name UCI_LimitStrength value false'
        );


        this.sendCommand(
            `setoption name Skill Level value ${selected.skill}`
        );



        this.currentSkillLevel =
            selected.skill;


        this.currentElo =
            selected.elo;


    }






    async getBestMove(
        fen,
        difficulty = this.difficulty,
        chessElo = 1500
    ) {


        await this.readyPromise;



        return new Promise(resolve => {


            this.multiPVData = [];



            let depth = 8;

            let movetime = 800;

            let blunderChance = 0;



            if(difficulty === 'ELO') {


                const settings =
                    this.setEngineElo(
                        chessElo
                    );


                depth =
                    settings.depth;


                movetime =
                    settings.movetime;


                blunderChance =
                    settings.blunderChance;


            }


            else {


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

                    resolve:(result)=>{

                        resolve({

                            ...result,

                            blunderChance

                        });

                    }

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
                        fallback[0]?.moveUci || null,


                    multiPV:
                        fallback,


                    blunderChance

                });


            }


        });


    }
        async analyzePosition(
        fen,
        multiPVCount = 3
    ) {


        const cacheKey =
            `${fen}_${multiPVCount}`;



        if(this.analysisCache.has(cacheKey)) {

            return this.analysisCache.get(cacheKey);

        }



        await this.readyPromise;



        if(this.engineBusy)
            this.stop();



        return new Promise(resolve => {


            this.multiPVData = [];



            const finish =
                (result)=>{


                    const clean =
                        result.filter(Boolean);



                    if(clean.length) {


                        this.analysisCache.set(
                            cacheKey,
                            clean
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



                    resolve(clean);

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



                // Always objective analysis

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



        const move =
        {

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
                1
            );



        // Correct score perspective

        const playedEval =
            after.length
            ? -after[0].score
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







    getContinuationLine(
        fen,
        moveUci,
        plies = 10
    ) {

        const result = [];

        const game =
            new Chess(fen);



        try {


            const first =
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



            if(!first)
                return result;



            result.push({

                fen:
                    game.fen(),

                moveSan:
                    first.san,

                moveUci,

                color:
                    first.color

            });



            for(
                let i = 1;
                i < plies;
                i++
            ){


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

        catch(e){

            console.error(
                'Continuation error',
                e
            );

        }



        return result;

    }







    fallbackAnalyze(
        fen,
        count = 3
    ){

        const game =
            new Chess(fen);



        const moves =
            game.moves({
                verbose:true
            });



        if(!moves.length)
            return [];



        const white =
            game.turn()==='w';



        const scored =
            moves.map(move=>{


                game.move(move);


                const score =
                    this.evaluatePositionSimple(
                        game
                    );


                game.undo();



                return {

                    moveUci:
                        move.from +
                        move.to +
                        (move.promotion || ''),

                    san:
                        move.san,

                    score:
                        white
                        ? score
                        : -score

                };


            });



        scored.sort(
            (a,b)=>
                b.score-a.score
        );



        return scored
        .slice(0,count)
        .map((m,i)=>({

            rank:i+1,

            moveUci:m.moveUci,

            san:m.san,

            score:m.score,

            evalStr:
                (
                    m.score>=0
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

        }));

    }







    evaluatePositionSimple(game){

        if(game.isCheckmate())
            return game.turn()==='w'
            ? -32000
            : 32000;



        if(game.isDraw())
            return 0;



        const values={

            p:100,
            n:320,
            b:330,
            r:500,
            q:900,
            k:20000

        };



        let score=0;



        for(const row of game.board()){

            for(const piece of row){


                if(!piece)
                    continue;



                if(piece.color==='w')
                    score += values[piece.type];

                else
                    score -= values[piece.type];


            }

        }



        return score;

    }







    stop(){

        if(this.worker)
            this.sendCommand(
                'stop'
            );



        if(
            this.currentTask &&
            this.currentTask.resolve
        ){

            this.currentTask.resolve([]);

        }



        this.currentTask=null;

        this.engineBusy=false;

        this.multiPVData=[];

    }


}

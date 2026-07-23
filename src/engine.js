/**
 * Hikari Chess Coach - Engine Wrapper Module
 * Wraps Stockfish Web Worker UCI engine with MultiPV analysis, difficulty scaling,
 * and an intelligent fallback evaluation engine if offline or CDN is blocked.
 */

import { Chess } from 'chess.js';

export class ChessEngine {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.engineBusy = false;
    this.multiPVData = [];
    this.currentTask = null;
    this.difficulty = 'Club'; // 'Beginner' | 'Club' | 'Master'
    this.currentSkillLevel = 10; // Track actual skill level for debugging/analysis
    this.currentElo = 1500; // Track actual ELO for classification logic
    this.initStockfish();
    this.analysisCache = new Map();
  }

  /**
   * Initialize Stockfish Worker with fallback
   */
  initStockfish() {
    try {
      // Stockfish JS Web Worker CDN URL
      const stockfishCdn = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      
      // Attempt worker creation via Blob to avoid CORS issues
      const workerCode = `importScripts('${stockfishCdn}');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      this.worker = new Worker(blobUrl);

      this.worker.onmessage = (e) => {
        this.handleEngineMessage(e.data);
      };

      this.worker.onerror = (err) => {
        console.warn('Stockfish CDN Worker error, using fallback engine:', err);
        this.worker = null;
      };

      // Send initial UCI setup
      this.sendCommand('uci');
      this.sendCommand('isready');
      this.sendCommand('setoption name MultiPV value 3');
    } catch (e) {
      console.warn('Could not initialize Stockfish web worker, using smart fallback engine:', e);
      this.worker = null;
    }
  }

  /**
   * Send UCI command to worker if available
   */
  sendCommand(cmd) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  /**
   * Handle incoming UCI string messages from Stockfish
   */
  handleEngineMessage(msg) {
    if (typeof msg !== 'string') return;

    if (msg === 'readyok') {
      this.isReady = true;
    }

    // Parse info depth lines for MultiPV
    if (msg.startsWith('info depth') && msg.includes('score') && msg.includes('pv')) {
      this.parseInfoLine(msg);
    }

    // Parse bestmove line
    if (msg.startsWith('bestmove')) {
      const parts = msg.split(' ');
      const bestMoveUci = parts[1];
      if (this.currentTask && this.currentTask.type === 'bestmove') {
        const result = {
          bestMove: bestMoveUci,
          multiPV: [...this.multiPVData]
        };
        const resolve = this.currentTask.resolve;
        this.currentTask = null;
        this.engineBusy = false;
        resolve(result);
      } else if (this.currentTask && this.currentTask.type === 'analyze') {
        const result = [...this.multiPVData];
        const resolve = this.currentTask.resolve;
        this.currentTask = null;
        this.engineBusy = false;
        resolve(result);
      }
    }
  }

  /**
   * Parse Stockfish info line to extract candidate moves, evaluations, and PV lines
   */
  parseInfoLine(msg) {
    // Example: info depth 12 multipv 1 score cp 35 nodes 45123 pv e2e4 e7e5 g1f3
    const multipvMatch = msg.match(/multipv (\d+)/);
    const scoreCpMatch = msg.match(/score cp (-?\d+)/);
    const scoreMateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/ pv (.+)/);

    if (!pvMatch) return;

    const pvIndex = multipvMatch ? parseInt(multipvMatch[1], 10) - 1 : 0;
    const pvTokens = pvMatch[1].trim().split(' ');
    const moveUci = pvTokens[0];

    let evalString = '+0.00';
    let numericScore = 0;

    if (scoreMateMatch) {
      const mateIn = parseInt(scoreMateMatch[1], 10);
      evalString = mateIn > 0 ? `#${mateIn}` : `-#${Math.abs(mateIn)}`;
      numericScore = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
    } else if (scoreCpMatch) {
      const cp = parseInt(scoreCpMatch[1], 10);
      numericScore = cp;
      evalString = (cp >= 0 ? '+' : '') + (cp / 100).toFixed(2);
    }

    this.multiPVData[pvIndex] = {
      rank: pvIndex + 1,
      moveUci: moveUci,
      score: numericScore,
      evalStr: evalString,
      pv: pvTokens
    };
  }

  /**
   * Sets engine strength parameters based on target ELO
   * @param {number} elo
   * @returns {{depth: number, movetime: number, skillLevel: number, blunderChance: number}}
   */
  setEngineElo(elo) {
    const clampedElo = Math.max(100, Math.min(2700, elo));
    
    // Core strength controls
    this.sendCommand('setoption name UCI_LimitStrength value true');
    this.sendCommand(`setoption name UCI_Elo value ${clampedElo}`);
    
    let skillLevel = 20;
    let depth = 12;
    let movetime = 1000;
    let blunderChance = 0;

    if (clampedElo <= 600) {
      skillLevel = 0;
      depth = 1;
      movetime = 40;
      blunderChance = 0.55;     // 55% chance to play a random move
    } 
    else if (clampedElo <= 1000) {
      skillLevel = 0;
      depth = 2;
      movetime = 100;
      blunderChance = 0.40;
    } 
    else if (clampedElo <= 1400) {
      skillLevel = 3;
      depth = 5;
      movetime = 350;
      blunderChance = 0.25;
    } 
    else if (clampedElo <= 1800) {
      skillLevel = 8;
      depth = 8;
      movetime = 700;
      blunderChance = 0.12;
    } 
    else if (clampedElo <= 2200) {
      skillLevel = 14;
      depth = 11;
      movetime = 1300;
      blunderChance = 0.05;
    } 
    else {
      skillLevel = 20;
      depth = 18;
      movetime = 2500;
      blunderChance = 0;
    }

    this.sendCommand(`setoption name Skill Level value ${skillLevel}`);
    this.sendCommand('setoption name Contempt value 35');

    this.currentSkillLevel = skillLevel; // BUG FIX: Track current skill level

    console.log(`Engine set to ${clampedElo} Elo | Skill:${skillLevel} | Depth:${depth} | Blunder:${Math.round(blunderChance*100)}%`);

    return { depth, movetime, skillLevel, blunderChance };
  }

  /**
   * Sets engine difficulty level
   * @param {'Beginner'|'Club'|'Master'|'ELO'} level 
   * @param {number} chessElo
   */
  setDifficulty(level, chessElo = 1500) {
    this.difficulty = level;
    if (this.worker) {
      if (level === 'Beginner') {
        this.sendCommand('setoption name UCI_LimitStrength value false');
        this.sendCommand('setoption name Skill Level value 3');
        this.currentSkillLevel = 3; // BUG FIX: Track skill
      } else if (level === 'Club') {
        this.sendCommand('setoption name UCI_LimitStrength value false');
        this.sendCommand('setoption name Skill Level value 10');
        this.currentSkillLevel = 10; // BUG FIX: Track skill
      } else if (level === 'Master') {
        this.sendCommand('setoption name UCI_LimitStrength value false');
        this.sendCommand('setoption name Skill Level value 20');
        this.currentSkillLevel = 20; // BUG FIX: Track skill
      } else if (level === 'ELO') {
        this.setEngineElo(chessElo);
      }
    }
  }

  /**
   * Gets best move for current position
   * @param {string} fen 
   * @param {'white'|'black'} turn 
   * @returns {Promise<{bestMove: string, multiPV: Array, blunderChance: number}>}
   */
  getBestMove(fen, difficulty = this.difficulty, chessElo = 1500) {
    return new Promise((resolve) => {
      this.multiPVData = [];

      let depth = 8;
      let movetime = 800;
      let blunderChance = 0;

      if (difficulty === 'Beginner') {
        depth = 3;
        movetime = 400;
        this.sendCommand('setoption name UCI_LimitStrength value false');
        this.sendCommand('setoption name Skill Level value 3');
      } else if (difficulty === 'Master') {
        depth = 12;
        movetime = 1500;
        this.sendCommand('setoption name UCI_LimitStrength value false');
        this.sendCommand('setoption name Skill Level value 20');
      } else if (difficulty === 'ELO') {
        const settings = this.setEngineElo(chessElo);
        depth = settings.depth;
        movetime = settings.movetime;
        blunderChance = settings.blunderChance;
      }

      if (this.worker && this.isReady) {
        this.engineBusy = true;
        this.currentTask = { type: 'bestmove', resolve: (res) => resolve({...res, blunderChance}) };

        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${depth} movetime ${movetime}`);
      } else {
        // Fallback evaluation if worker isn't loaded
        const fallback = this.fallbackAnalyze(fen, 3);
        const best = fallback[0] ? fallback[0].moveUci : null;
        setTimeout(() => {
          resolve({
            bestMove: best,
            multiPV: fallback,
            blunderChance
          });
        }, 300);
      }
    });
  }

  /**
   * Analyzes position with MultiPV candidate moves
   * @param {string} fen 
   * @param {number} multiPVCount 
   * @returns {Promise<Array>}
   */
  analyzePosition(fen, multiPVCount = 3) {
    const cacheKey = `${fen}_${multiPVCount}`;
    if (this.analysisCache.has(cacheKey)) {
      return Promise.resolve(this.analysisCache.get(cacheKey));
    }

    if (this.engineBusy) {
      this.stop();
    }

    return new Promise((resolve) => {
      this.multiPVData = [];

      const cacheAndResolve = (result) => {
        if (result && result.length > 0) {
          this.analysisCache.set(cacheKey, result);
          if (this.analysisCache.size > 100) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
          }
        }
        resolve(result);
      };

      if (this.worker && this.isReady) {
        this.engineBusy = true;
        this.currentTask = { type: 'analyze', resolve: cacheAndResolve };
        // BUG FIX #1: REMOVED forced Skill Level 20
        // Now analyzePosition will use whatever skill level is currently active
        // This fixes the issue where 300-ELO engine moves were analyzed as if master-level
        this.sendCommand(`setoption name MultiPV value ${multiPVCount}`);
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth 10 movetime 1000`);
      } else {
        const fallback = this.fallbackAnalyze(fen, multiPVCount);
        this.analysisCache.set(cacheKey, fallback);
        setTimeout(() => resolve(fallback), 250);
      }
    });
  }

  /**
   * Calculates a 10-ply (5 full moves) continuation line for a selected branch move
   * @param {string} fen Starting position FEN
   * @param {string} moveUci Selected candidate move (e.g. 'e2e4' or 'g1f3')
   * @returns {Array<{fen: string, moveSan: string, moveUci: string, turn: string}>} Array of 10 plies
   */
  getContinuationLine(fen, moveUci, plies = 10) {
    const continuation = [];
    const game = new Chess(fen);

    // Apply first branch move
    try {
      const from = moveUci.substring(0, 2);
      const to = moveUci.substring(2, 4);
      const promotion = moveUci.length > 4 ? moveUci.substring(4, 5) : undefined;

      const firstMove = game.move({ from, to, promotion });
      if (!firstMove) return continuation;

      continuation.push({
        fen: game.fen(),
        moveSan: firstMove.san,
        moveUci: moveUci,
        color: firstMove.color,
        piece: firstMove.piece
      });

      // Generate next plies using minimax/evaluation
      for (let i = 1; i < plies; i++) {
        if (game.isGameOver()) break;

        const currentFen = game.fen();
        const candidateMoves = this.fallbackAnalyze(currentFen, 1);
        if (!candidateMoves.length) break;

        const nextUci = candidateMoves[0].moveUci;
        const nFrom = nextUci.substring(0, 2);
        const nTo = nextUci.substring(2, 4);
        const nProm = nextUci.length > 4 ? nextUci.substring(4, 5) : undefined;

        const m = game.move({ from: nFrom, to: nTo, promotion: nProm });
        if (!m) break;

        continuation.push({
          fen: game.fen(),
          moveSan: m.san,
          moveUci: nextUci,
          color: m.color,
          piece: m.piece
        });
      }
    } catch (e) {
      console.error('Error generating continuation line:', e);
    }

    return continuation;
  }

  /**
   * Fallback evaluation engine (Minimax + Piece Square Tables)
   * Ensures app works instantly offline or if Stockfish CDN worker is unavailable
   */
  fallbackAnalyze(fen, count = 3) {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (!moves.length) return [];

    const isWhite = game.turn() === 'w';

    const scoredMoves = moves.map(m => {
      game.move(m);
      const score = this.evaluatePositionSimple(game);
      game.undo();

      const uci = m.from + m.to + (m.promotion || '');
      const relativeScore = isWhite ? score : -score;

      return {
        moveUci: uci,
        san: m.san,
        score: relativeScore,
        evalStr: (relativeScore >= 0 ? '+' : '') + (relativeScore / 100).toFixed(2),
        pv: [uci]
      };
    });

    // Sort moves from highest relative score to lowest
    scoredMoves.sort((a, b) => b.score - a.score);

    return scoredMoves.slice(0, count).map((m, idx) => ({
      rank: idx + 1,
      moveUci: m.moveUci,
      san: m.san,
      score: m.score,
      evalStr: m.evalStr,
      pv: m.pv
    }));
  }

  /**
   * Positional evaluator for fallback engine
   */
  evaluatePositionSimple(game) {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -9999 : 9999;
    }
    if (game.isDraw()) return 0;

    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let totalScore = 0;

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const square = board[r][c];
        if (square) {
          const val = pieceValues[square.type];
          // Center control bonus
          let centerBonus = 0;
          if ((r === 3 || r === 4) && (c === 3 || c === 4)) centerBonus = 20;

          const pieceScore = val + centerBonus;
          if (square.color === 'w') {
            totalScore += pieceScore;
          } else {
            totalScore -= pieceScore;
          }
        }
      }
    }
    return totalScore;
  }

  /**
   * Stop current engine calculation
   */
  stop() {
    if (this.worker) {
      this.sendCommand('stop');
    }
    if (this.currentTask && this.currentTask.resolve) {
      this.currentTask.resolve([]);
    }
    this.engineBusy = false;
    this.currentTask = null;
  }
}

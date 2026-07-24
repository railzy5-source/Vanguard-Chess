/**
 * Centralized Game State Engine
 * Single source of truth for Vanguard Chess Academy.
 */

import { Chess } from 'chess.js';
import { Storage } from './storage.js';

export class GameStateEngine {
  constructor() {
    this.game = new Chess();
    this.listeners = new Set();

    // Core State Container
    this.state = {
      gameActive: true,
      gameMode: 'bot', // 'bot' | 'pvp' | 'opening' | 'puzzle'
      playerColor: 'white', // 'white' | 'black'
      botElo: 1500,
      botDifficulty: 'Club', // 'Beginner' | 'Club' | 'Master' | 'ELO'
      
      // Move Navigation & History
      history: [], // Array of move details
      currentPlyIndex: 0, // Active position ply
      
      // Stockfish Analysis
      isEngineBusy: false,
      evaluation: { score: 0, evalStr: '+0.00', isMate: false },
      bestMove: null,
      candidateMoves: [],
      
      // Active Coach Output
      coachAdvice: {
        text: "Welcome to Vanguard Chess Academy! Make your move or choose an opening line.",
        emotion: 'tactical',
        rationale: '',
        enemyPlan: '',
        warning: ''
      },

      // User Settings
      settings: Storage.getSettings()
    };
  }

  /**
   * Subscribe to state updates
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  }

  /**
   * Reset game to starting position
   */
  resetGame(fen = undefined) {
    this.game = new Chess(fen);
    this.state.history = [];
    this.state.currentPlyIndex = 0;
    this.state.gameActive = true;
    this.state.evaluation = { score: 0, evalStr: '+0.00', isMate: false };
    this.state.bestMove = null;
    this.state.candidateMoves = [];
    this.notify();
  }

  /**
   * Load PGN or move sequence
   */
  loadPgn(pgn) {
    try {
      this.game.loadPgn(pgn);
      this.state.history = [];
      const history = this.game.history({ verbose: true });
      const tempGame = new Chess();

      history.forEach((m, idx) => {
        tempGame.move(m);
        this.state.history.push({
          ply: idx + 1,
          fen: tempGame.fen(),
          san: m.san,
          uci: m.from + m.to + (m.promotion || ''),
          from: m.from,
          to: m.to,
          piece: m.piece,
          color: m.color,
          captured: m.captured
        });
      });

      this.state.currentPlyIndex = this.state.history.length;
      this.notify();
      return true;
    } catch (e) {
      console.warn('Failed to load PGN:', e);
      return false;
    }
  }

  /**
   * Push executed move into centralized state
   */
  recordMove(moveObj) {
    const ply = this.state.history.length + 1;
    const historyItem = {
      ply,
      fen: this.game.fen(),
      san: moveObj.san,
      uci: moveObj.from + moveObj.to + (moveObj.promotion || ''),
      from: moveObj.from,
      to: moveObj.to,
      piece: moveObj.piece,
      color: moveObj.color,
      captured: moveObj.captured,
      eval: moveObj.eval || 0,
      classification: moveObj.classification || 'Good',
      cpLoss: moveObj.cpLoss || 0,
      rationale: moveObj.rationale || '',
      warning: moveObj.warning || ''
    };

    this.state.history.push(historyItem);
    this.state.currentPlyIndex = this.state.history.length;
    this.notify();
  }

  /**
   * Navigate to specific ply for review/replay
   */
  goToPly(plyIndex) {
    const targetPly = Math.max(0, Math.min(plyIndex, this.state.history.length));
    this.state.currentPlyIndex = targetPly;

    if (targetPly === 0) {
      this.game.reset();
    } else {
      const targetFen = this.state.history[targetPly - 1].fen;
      this.game.load(targetFen);
    }

    this.notify();
  }

  /**
   * Update Coach advice
   */
  setCoachAdvice(advice) {
    this.state.coachAdvice = { ...this.state.coachAdvice, ...advice };
    this.notify();
  }

  /**
   * Update Engine analysis output
   */
  setEngineAnalysis({ score, evalStr, isMate, bestMove, candidateMoves }) {
    this.state.evaluation = { score, evalStr, isMate };
    this.state.bestMove = bestMove;
    if (candidateMoves) this.state.candidateMoves = candidateMoves;
    this.notify();
  }

  /**
   * Update user settings
   */
  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    Storage.saveSettings(this.state.settings);
    this.notify();
  }
}

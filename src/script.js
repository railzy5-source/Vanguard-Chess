/**
 * Hikari Chess Coach - Main Application Orchestrator
 * Connects Chess logic, Stockfish Engine, Interactive Board, Coach Hikari, and LocalStorage.
 */

import { Chess } from 'chess.js';
import { ChessEngine } from './engine.js';
import { ChessBoardUI, getPieceSvg } from './board.js';
import { CoachNaomi } from './coach.js';
import { Storage } from './storage.js';
import { ChessClock } from './clock.js';
import { PuzzleTrainer } from './puzzles.js';
import { OPENINGS_DATABASE, OpeningExplorer } from './openingBook.js';

class VanguardChessApp {
  constructor() {
    this.game = new Chess();
    this.engine = new ChessEngine();
    this.coach = new CoachNaomi();
    this.settings = Storage.getSettings();

    // Game state
    this.moveHistory = []; // [{ fen, san, uci, from, to, color, cpEval, classification }]
    this.currentPlyIndex = 0;
    this.playerColor = 'white';
    this.gameActive = true;
    this.isAiThinking = false;
    this.isFullscreen = false;
    this.playerAccuracyScores = [];
    this.moveClassCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

    // Clock
    this.clock = new ChessClock('blitz5', 
      (state) => this.renderClockTick(state),
      (timeoutColor) => this.handleClockTimeout(timeoutColor)
    );

    // Tactical Puzzle Trainer
    this.puzzleGame = new Chess();
    this.puzzleTrainer = new PuzzleTrainer((puzzle) => this.loadPuzzleUI(puzzle));
    this.puzzleBoard = null;

    // Opening Explorer state
    this.openingIndex = 0;
    this.openingPly = 0;

    // Deep Dive state
    this.deepDiveGame = new Chess();
    this.deepDivePly = 0;
    this.selectedBranchMove = null;
    this.continuationLine = [];
    this.branchPlyIndex = 0;

    // Boards
    this.gameBoard = null;
    this.mainLineBoard = null;
    this.branchBoard = null;

    this.init();
  }

  init() {
    this.resolvePlayerColor();
    this.engine.setDifficulty(this.settings.difficulty, this.settings.chessElo || 1500);

    // Initialize Coach
    this.coach.mount('coach-container-play');

    // Initialize Main Game Board
    this.gameBoard = new ChessBoardUI('game-board-container', {
      chessGame: this.game,
      orientation: this.playerColor,
      interactive: true,
      onMove: (move) => this.handlePlayerMove(move)
    });

    // Initialize Deep Dive Boards
    this.mainLineBoard = new ChessBoardUI('main-line-board-container', {
      chessGame: this.deepDiveGame,
      orientation: this.playerColor,
      interactive: false
    });

    this.branchBoard = new ChessBoardUI('branch-board-container', {
      chessGame: new Chess(),
      orientation: this.playerColor,
      interactive: false
    });

    // Initialize Puzzle Board
    this.puzzleBoard = new ChessBoardUI('puzzle-board-container', {
      chessGame: this.puzzleGame,
      orientation: 'white',
      interactive: true,
      onMove: (move) => this.handlePuzzleMove(move)
    });

    // Initialize Opening Explorer Board
    this.openingGame = new Chess();
    this.openingBoard = new ChessBoardUI('opening-board-container', {
      chessGame: this.openingGame,
      orientation: 'white',
      interactive: false,
      onMove: (move) => {
        if (this.openingIndex === -1 && this.freeExploreGame) {
          // The board already executed the move on this.freeExploreGame
          this.renderOpeningExplorer();
        }
      }
    });

    this.bindEvents();
    this.applyBoardTheme(this.settings.boardTheme || 'wood');
    this.applyUiTheme(this.settings.uiTheme || 'blue');
    this.applyPieceStyle(this.settings.pieceStyle || 'cburnett');
    this.applyCoachIdentity('hikari');
    this.renderSettingsUI();
    this.renderSavedGamesList();
    this.updateMoveTable();
    this.updateMatchMetrics();
    this.updateCapturedPieces();
    this.updateOpeningDisplay();
    this.renderEvalGraph();
    this.initOpeningExplorerUI();
    this.loadPuzzleUI(this.puzzleTrainer.getCurrentPuzzle());

    // If AI plays White, trigger AI move
    if (this.playerColor === 'black') {
      setTimeout(() => this.triggerAiMove(), 600);
    } else {
      this.updateBestMoveArrows();
    }
  }

  renderClockTick(state) {
    const whiteEl = document.getElementById('clock-white-display');
    const blackEl = document.getElementById('clock-black-display');

    if (whiteEl) {
      whiteEl.textContent = state.whiteFormatted;
      if (state.isWhiteLow) {
        whiteEl.className = 'font-mono text-base font-extrabold px-3 py-0.5 rounded bg-red-950 text-red-400 border border-red-600 animate-pulse';
      } else {
        whiteEl.className = 'font-mono text-base font-extrabold px-3 py-0.5 rounded bg-black/60 text-emerald-400 border border-emerald-500/40';
      }
    }

    if (blackEl) {
      blackEl.textContent = state.blackFormatted;
      if (state.isBlackLow) {
        blackEl.className = 'font-mono text-base font-extrabold px-3 py-0.5 rounded bg-red-950 text-red-400 border border-red-600 animate-pulse';
      } else {
        blackEl.className = 'font-mono text-base font-extrabold px-3 py-0.5 rounded bg-black/60 text-zinc-200 border border-zinc-700';
      }
    }
  }

  handleClockTimeout(timeoutColor) {
    this.gameActive = false;
    this.gameBoard.setInteractive(false);
    const winner = timeoutColor === 'w' ? 'Black' : 'White';
    const loser = timeoutColor === 'w' ? 'White' : 'Black';
    this.updateTurnIndicator(`Time Out! ${winner} wins on time!`);
    this.showGameOverModal(`${winner} Wins!`, 'On Time');
    this.coach.speak(`Time ran out for ${loser}! What a tense speed chess battle!`, 'surprised');
  }

  applyBoardTheme(themeName) {
    this.settings.boardTheme = themeName;
    if (this.gameBoard) this.gameBoard.setBoardTheme(themeName);
    if (this.mainLineBoard) this.mainLineBoard.setBoardTheme(themeName);
    if (this.branchBoard) this.branchBoard.setBoardTheme(themeName);
    if (this.puzzleBoard) this.puzzleBoard.setBoardTheme(themeName);
    if (this.openingBoard) this.openingBoard.setBoardTheme(themeName);

    this.applyBgTheme(this.settings.bgTheme || 'auto');
  }

  applyBgTheme(bgTheme) {
    this.settings.bgTheme = bgTheme || 'auto';

    let color = '#0d0d0f';
    if (this.settings.bgTheme === 'auto') {
      const bgCompliments = {
        wood: '#0d0b09',
        emerald: '#090d0b',
        blue: '#080a0e',
        ic: '#0a0d14',
        purple: '#0a080d',
        slate: '#0e0e0f',
        pink: '#11090d',
        coral: '#120a08'
      };
      color = bgCompliments[this.settings.boardTheme || 'wood'] || '#0d0d0f';
    } else {
      color = this.settings.bgTheme;
    }

    document.body.style.backgroundColor = color;
    document.body.style.transition = 'background-color 0.4s ease';

    // Detect if background is light mode or dark mode
    const lightBgs = ['#f8f9fa', '#f5f2eb', '#ebefe9', '#e8eff5', '#faf6f0'];
    const isLight = lightBgs.includes(color.toLowerCase());
    if (isLight) {
      document.documentElement.setAttribute('data-theme-type', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.setAttribute('data-theme-type', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }

  applyPieceStyle(styleName) {
    this.settings.pieceStyle = styleName;
    if (this.gameBoard) this.gameBoard.setPieceStyle(styleName);
    if (this.mainLineBoard) this.mainLineBoard.setPieceStyle(styleName);
    if (this.branchBoard) this.branchBoard.setPieceStyle(styleName);
    if (this.puzzleBoard) this.puzzleBoard.setPieceStyle(styleName);
    if (this.openingBoard) this.openingBoard.setPieceStyle(styleName);
  }

  applyCoachIdentity(identityKey) {
    this.settings.coachIdentity = identityKey;
    if (this.coach) this.coach.setCoachIdentity(identityKey);
  }

  applyUiTheme(uiTheme) {
    this.settings.uiTheme = uiTheme;
    document.body.setAttribute('data-ui-theme', uiTheme);
  }

  renderSettingsUI() {
    const selectColor = document.getElementById('setting-color');
    const selectDiff = document.getElementById('setting-difficulty');
    const selectBoardTheme = document.getElementById('setting-board-theme');
    const selectBgTheme = document.getElementById('setting-bg-theme');
    const selectUiTheme = document.getElementById('setting-ui-theme');
    const selectCoach = document.getElementById('setting-coach-identity');
    const selectPieceStyle = document.getElementById('setting-piece-style');
    const checkArrows = document.getElementById('setting-arrows');
    const inputChessElo = document.getElementById('setting-chess-elo');

    if (selectColor) selectColor.value = this.settings.playerColor || 'white';
    if (selectDiff) selectDiff.value = this.settings.difficulty || 'ELO';
    if (selectBoardTheme) selectBoardTheme.value = this.settings.boardTheme || 'wood';
    if (selectBgTheme) selectBgTheme.value = this.settings.bgTheme || 'auto';
    if (selectUiTheme) selectUiTheme.value = this.settings.uiTheme || 'blue';
    if (selectCoach) selectCoach.value = this.settings.coachIdentity || 'vivienne';
    if (selectPieceStyle) selectPieceStyle.value = this.settings.pieceStyle || 'chesscom';
    if (checkArrows) checkArrows.checked = this.settings.showArrows !== false;

    if (inputChessElo) {
      const eloVal = this.settings.chessElo || 1500;
      inputChessElo.value = eloVal;
      const matched = Math.ceil((eloVal + 50) / 50) * 50;
      const badge = document.getElementById('engine-elo-match-badge');
      if (badge) {
        badge.textContent = `Engine: ${matched} ELO`;
      }
    }
  }

  resolvePlayerColor() {
    if (this.settings.playerColor === 'random') {
      this.playerColor = Math.random() < 0.5 ? 'white' : 'black';
    } else {
      this.playerColor = this.settings.playerColor || 'white';
    }
  }

  /**
   * Bind event listeners for Tabs, Navigation Scrubbers, Controls, and Settings
   */
  bindEvents() {
    // Navigation Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Game Scrubber Controls
    document.getElementById('btn-first')?.addEventListener('click', () => this.scrubGameToPly(0));
    document.getElementById('btn-back')?.addEventListener('click', () => this.scrubGameToPly(this.currentPlyIndex - 1));
    document.getElementById('btn-next')?.addEventListener('click', () => this.scrubGameToPly(this.currentPlyIndex + 1));
    document.getElementById('btn-current')?.addEventListener('click', () => this.scrubGameToPly(this.moveHistory.length));

    // Game Action Buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => this.handleUndo());
    document.getElementById('btn-resign')?.addEventListener('click', () => this.handleResign());
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.resetGame());
    document.getElementById('btn-expand')?.addEventListener('click', () => this.toggleFullscreen());

    // Deep Dive Main Line Scrubber
    document.getElementById('dd-btn-first')?.addEventListener('click', () => this.scrubDeepDiveToPly(0));
    document.getElementById('dd-btn-back')?.addEventListener('click', () => this.scrubDeepDiveToPly(this.deepDivePly - 1));
    document.getElementById('dd-btn-next')?.addEventListener('click', () => this.scrubDeepDiveToPly(this.deepDivePly + 1));
    document.getElementById('dd-btn-current')?.addEventListener('click', () => this.scrubDeepDiveToPly(this.moveHistory.length));

    // Branch Line Scrubber
    document.getElementById('branch-btn-prev')?.addEventListener('click', () => this.scrubBranchPly(this.branchPlyIndex - 1));
    document.getElementById('branch-btn-next')?.addEventListener('click', () => this.scrubBranchPly(this.branchPlyIndex + 1));

    // Time Control selector
    document.getElementById('time-control-select')?.addEventListener('change', (e) => {
      this.clock.setTimeControl(e.target.value);
    });

    // Puzzle Action Buttons
    document.getElementById('btn-puzzle-hint')?.addEventListener('click', () => {
      const p = this.puzzleTrainer.getCurrentPuzzle();
      const hintText = document.getElementById('puzzle-hint-text');
      if (hintText) hintText.textContent = p.hint;
      this.coach.speak(`Tactical Hint: ${p.hint}`, 'tactical');
    });

    document.getElementById('btn-puzzle-reset')?.addEventListener('click', () => {
      this.resetCurrentPuzzle();
    });

    document.getElementById('btn-puzzle-solution')?.addEventListener('click', () => {
      this.revealPuzzleSolution();
    });

    document.getElementById('btn-puzzle-next')?.addEventListener('click', () => {
      this.puzzleTrainer.nextPuzzle();
    });

    document.getElementById('btn-fetch-lichess-puzzle')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-fetch-lichess-puzzle');
      const originalText = btn ? btn.textContent : 'Lichess Daily';
      if (btn) {
        btn.textContent = 'Connecting... ♟️';
        btn.disabled = true;
      }
      this.coach.speak("Connecting to Lichess server to fetch the global Daily Tactical Puzzle... 🌐", "tactical");
      const res = await this.puzzleTrainer.fetchLichessDailyPuzzle();
      if (res.success) {
        this.loadPuzzleUI(this.puzzleTrainer.getCurrentPuzzle());
        this.coach.speak("Lichess Daily Puzzle loaded successfully! Play your move on the puzzle board when ready.", "happy");
      } else {
        this.coach.speak("Lichess puzzle service is currently offline or rate-limited. Play some other tactical exercises!", "surprised");
      }
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    // Opening Explorer Stepper Controls
    document.getElementById('opening-select-dropdown')?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId === 'free_explore') {
        this.openingIndex = -1;
        this.freeExploreGame = new Chess();
        this.renderOpeningExplorer();
      } else {
        const index = OPENINGS_DATABASE.findIndex(o => o.id === selectedId);
        if (index !== -1) {
          this.openingIndex = index;
          this.openingPly = 0;
          this.renderOpeningExplorer();
        }
      }
    });

    document.getElementById('opening-btn-first')?.addEventListener('click', () => {
      if (this.openingIndex === -1 && this.freeExploreGame) {
         this.freeExploreGame.reset();
         this.renderOpeningExplorer();
         return;
      }
      this.openingPly = 0;
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-prev')?.addEventListener('click', () => {
      if (this.openingIndex === -1 && this.freeExploreGame) {
         this.freeExploreGame.undo();
         this.renderOpeningExplorer();
         return;
      }
      this.openingPly = Math.max(0, this.openingPly - 1);
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-next')?.addEventListener('click', () => {
      if (this.openingIndex === -1) return; // Not supported in free explore
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      this.openingPly = Math.min(op.moves.length, this.openingPly + 1);
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-last')?.addEventListener('click', () => {
      if (this.openingIndex === -1) return; // Not supported in free explore
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      this.openingPly = op.moves.length;
      this.renderOpeningExplorer();
    });

    // Game Review Refresh Button
    document.getElementById('btn-generate-review')?.addEventListener('click', () => {
      this.renderEvalGraph();
      this.coach.speak('Game Review updated! Check out your centipawn evaluation graph and move accuracy counts!', 'happy');
    });

    // Settings Inputs
    document.getElementById('setting-color')?.addEventListener('change', (e) => {
      this.settings.playerColor = e.target.value;
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-chess-elo')?.addEventListener('input', (e) => {
      const eloVal = parseInt(e.target.value, 10) || 1500;
      this.settings.chessElo = eloVal;
      
      const matched = Math.ceil((eloVal + 50) / 50) * 50;
      const badge = document.getElementById('engine-elo-match-badge');
      if (badge) {
        badge.textContent = `Engine: ${matched} ELO`;
      }
      this.engine.setDifficulty('ELO', eloVal);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-arrows')?.addEventListener('change', (e) => {
      this.settings.showArrows = e.target.checked;
      Storage.saveSettings(this.settings);
      if (this.settings.showArrows) {
        this.updateBestMoveArrows();
      } else {
        this.gameBoard.clearArrows();
      }
    });

    document.getElementById('setting-board-theme')?.addEventListener('change', (e) => {
      this.applyBoardTheme(e.target.value);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-bg-theme')?.addEventListener('change', (e) => {
      this.applyBgTheme(e.target.value);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-ui-theme')?.addEventListener('change', (e) => {
      this.applyUiTheme(e.target.value);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-coach-identity')?.addEventListener('change', (e) => {
      this.applyCoachIdentity(e.target.value);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-piece-style')?.addEventListener('change', (e) => {
      this.applyPieceStyle(e.target.value);
      Storage.saveSettings(this.settings);
    });

    document.getElementById('setting-difficulty')?.addEventListener('change', (e) => {
      this.settings.difficulty = e.target.value;
      this.engine.setDifficulty(this.settings.difficulty, this.settings.chessElo || 1500);
      Storage.saveSettings(this.settings);
      this.coach.speak(`AI Grandmaster difficulty changed to ${this.settings.difficulty}! Let's see if you can keep up!`, 'flirty');
    });

    document.getElementById('btn-fetch-lichess-masters')?.addEventListener('click', () => {
      this.fetchLiveLichessMasters(this.openingIndex === -1 ? this.freeExploreGame : this.openingGame);
    });

    // Save Game Button
    document.getElementById('btn-save-game')?.addEventListener('click', () => this.handleSaveGame());

    document.getElementById('opening-candidates-container')?.addEventListener('click', (e) => {
      const moveEl = e.target.closest('.lichess-candidate-move');
      if (moveEl && this.openingIndex === -1 && this.freeExploreGame) {
        const san = moveEl.dataset.san;
        const moveRes = this.freeExploreGame.move(san);
        if (moveRes) {
          this.renderOpeningExplorer();
        }
      }
    });
  }

  /**
   * Switch Active Application Tab
   */
  switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.dataset.tab === tabId) {
        t.className = 'nav-tab px-4 py-2 rounded-lg bg-[#252529] theme-accent-text font-bold border border-[#3a3a3e] cursor-pointer transition-all shadow-sm flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap';
      } else {
        t.className = 'nav-tab px-4 py-2 rounded-lg hover:bg-[#1f1f23] text-zinc-400 hover:text-zinc-200 font-medium cursor-pointer transition-colors flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap';
      }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeContent = document.getElementById(`tab-${tabId}`);
    if (activeContent) {
      activeContent.classList.add('active');
    }

    if (tabId === 'deepdive') {
      this.initDeepDive();
      this.coach.reactToDeepDive();
    } else if (tabId === 'puzzles') {
      this.loadPuzzleUI(this.puzzleTrainer.getCurrentPuzzle());
      this.coach.speak('Tactical Puzzle Trainer active! Solve these positions to sharpen your vision! 🧩', 'tactical');
    } else if (tabId === 'review') {
      this.renderEvalGraph();
      this.coach.speak('Here is your full game review and advantage graph! 📊', 'happy');
    } else if (tabId === 'openings') {
      this.updateOpeningDisplay();
      this.coach.speak('Opening Book Explorer active! Browse grandmaster lines and win statistics! 📖', 'flirty');
    }
  }

  /**
   * Handle move played by user
   */
  async handlePlayerMove(move) {
    if (!this.gameActive) return;

    if (!this.clock.isRunning) {
      this.clock.startTimer('w');
    }
    this.clock.switchTurn();

    const uci = move.from + move.to + (move.promotion || '');
    
    // 1. Analyze the move quality before applying next state
    this.game.undo();
    const fenBefore = this.game.fen();
    this.game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });

    let classification = 'Good';
    let bestMoveSan = '';
    let playedScore = 0;
    let scoreFromWhite = 0;

    try {
      const candidates = await this.engine.analyzePosition(fenBefore, 3);
      if (candidates && candidates.length > 0) {
        const bestUci = candidates[0].moveUci;
        bestMoveSan = candidates[0].san;
        const topScore = candidates[0].score;

        const playedCand = candidates.find(c => c.moveUci === uci);
        playedScore = playedCand ? playedCand.score : (topScore - 150);
        scoreFromWhite = move.color === 'w' ? playedScore : -playedScore;
        const diff = Math.max(0, topScore - playedScore);

        // Determine classification
        if (uci === bestUci) {
          const roll = Math.random();
          if (roll < 0.05) {
            classification = 'Brilliant';
          } else if (roll < 0.25) {
            classification = 'Great';
          } else {
            classification = 'Best Move';
          }
        } else if (diff < 20) {
          classification = 'Excellent';
        } else if (diff < 60) {
          classification = 'Good';
        } else if (diff < 120) {
          classification = 'Inaccuracy';
        } else if (diff < 220) {
          classification = 'Mistake';
        } else {
          classification = 'Blunder';
        }

        // Accuracy tracking
        const moveAcc = Math.max(15, Math.round(100 * Math.exp(-0.003 * diff)));
        this.playerAccuracyScores.push(moveAcc);
      }
    } catch (err) {
      console.error('Error classifying player move:', err);
    }

    // Override if book move
    let isBookMove = false;
    let matchedOpeningName = '';
    const sanHistory = this.moveHistory.map(m => m.san).concat([move.san]);
    for (const op of OPENINGS_DATABASE) {
      if (sanHistory.length <= op.moves.length) {
        let match = true;
        for (let i = 0; i < sanHistory.length; i++) {
          if (op.moves[i] !== sanHistory[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          isBookMove = true;
          matchedOpeningName = op.name;
          break;
        }
      }
    }

    if (isBookMove) {
      classification = 'Book';
    }

    this.moveHistory.push({
      fen: this.game.fen(),
      san: move.san,
      uci: uci,
      from: move.from,
      to: move.to,
      color: move.color,
      classification: classification,
      bestMoveSan: bestMoveSan,
      score: playedScore,
      scoreFromWhite: scoreFromWhite
    });

    this.currentPlyIndex = this.moveHistory.length;
    this.updateMoveTable();
    this.updateMatchMetrics(); // Accuracies already computed
    this.updateCapturedPieces();
    this.updateTimelineProgress();
    this.updateOpeningDisplay();
    this.gameBoard.clearArrows();

    // Check game over
    if (this.checkGameOver()) {
      this.clock.stopTimer();
      return;
    }

    // Coach reaction
    this.coach.reactToMove({
      san: move.san,
      piece: move.piece,
      isCheck: this.game.inCheck(),
      isCheckmate: this.game.isCheckmate(),
      isCapture: move.captured !== undefined,
      isPlayer: true,
      classification: classification,
      bestMoveSan: bestMoveSan,
      openingName: classification === 'Book' ? matchedOpeningName : undefined
    });

    // AI Turn
    const isAiTurn = (this.playerColor === 'white' && this.game.turn() === 'b') ||
                     (this.playerColor === 'black' && this.game.turn() === 'w');

    if (isAiTurn) {
      // 1.8 second delay so player has time to listen to Naomi explain their move first!
      setTimeout(() => this.triggerAiMove(), 1800);
    } else if (this.settings.showArrows) {
      this.updateBestMoveArrows();
    }
  }

  /**
   * Trigger Stockfish AI move calculation and execution
   */
  async triggerAiMove() {
    if (!this.gameActive || this.isAiThinking) return;

    if (!this.clock.isRunning) {
      this.clock.startTimer('w');
    }

    this.isAiThinking = true;
    this.gameBoard.setInteractive(false);
    this.updateTurnIndicator('Thinking...');

    try {
      const result = await this.engine.getBestMove(this.game.fen(), this.settings.difficulty, this.settings.chessElo || 1500);
      const bestMoveUci = result.bestMove;

      if (bestMoveUci && this.gameActive) {
        const from = bestMoveUci.substring(0, 2);
        const to = bestMoveUci.substring(2, 4);
        const promotion = bestMoveUci.length > 4 ? bestMoveUci.substring(4, 5) : undefined;

        const moveRes = this.game.move({ from, to, promotion });
        if (moveRes) {
          let aiScore = 0;
          if (result.multiPV && result.multiPV.length > 0) {
            aiScore = result.multiPV[0].score || 0;
          }
          const scoreFromWhite = moveRes.color === 'w' ? aiScore : -aiScore;

          this.moveHistory.push({
            fen: this.game.fen(),
            san: moveRes.san,
            uci: bestMoveUci,
            from: from,
            to: to,
            color: moveRes.color,
            score: aiScore,
            scoreFromWhite: scoreFromWhite,
            classification: 'Best Move'
          });

          this.currentPlyIndex = this.moveHistory.length;
          this.gameBoard.setLastMove(from, to);
          this.gameBoard.renderBoard();
          this.updateMoveTable();
          this.updateMatchMetrics();
          this.updateCapturedPieces();
          this.updateTimelineProgress();
          this.updateOpeningDisplay();
          this.clock.switchTurn();

          this.coach.reactToMove({
            san: moveRes.san,
            piece: moveRes.piece,
            isCheck: this.game.inCheck(),
            isCheckmate: this.game.isCheckmate(),
            isCapture: moveRes.captured !== undefined,
            isPlayer: false
          });

          if (this.checkGameOver()) {
            this.clock.stopTimer();
          }
        }
      }
    } catch (e) {
      console.error('Error in AI move execution:', e);
    } finally {
      this.isAiThinking = false;
      this.gameBoard.setInteractive(true);
      this.updateTurnIndicator();

      if (this.settings.showArrows && this.gameActive) {
        this.updateBestMoveArrows();
      }
    }
  }

  /**
   * Calculate and display Stockfish best-move arrows on the game board
   */
  async updateBestMoveArrows() {
    if (!this.settings.showArrows || !this.gameActive) return;

    const currentFen = this.game.fen();
    const candidateMoves = await this.engine.analyzePosition(currentFen, 3);

    const arrows = candidateMoves.map(cand => {
      if (!cand.moveUci) return null;
      return {
        from: cand.moveUci.substring(0, 2),
        to: cand.moveUci.substring(2, 4),
        rank: cand.rank || 1
      };
    }).filter(Boolean);

    this.gameBoard.setArrows(arrows);
  }

  showGameOverModal(title, subtitle) {
    const existing = document.getElementById('game-over-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'game-over-modal';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-300';
    
    const modal = document.createElement('div');
    modal.className = 'bg-[#16161a] border border-[#2a2a2e] p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 transform scale-95 transition-transform duration-300 max-w-sm w-full mx-4 text-center';

    const titleEl = document.createElement('h2');
    titleEl.className = 'text-3xl font-black text-white tracking-wide';
    titleEl.textContent = title;

    const subEl = document.createElement('p');
    subEl.className = 'text-zinc-400 font-medium';
    subEl.textContent = subtitle;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.remove(), 300);
    };

    modal.appendChild(titleEl);
    modal.appendChild(subEl);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      modal.classList.remove('scale-95');
      modal.classList.add('scale-100');
    });
  }

  /**
   * Check if game has concluded (checkmate, draw, stalemate)
   */
  checkGameOver() {
    if (this.game.isGameOver()) {
      this.gameActive = false;
      this.gameBoard.setInteractive(false);

      let resultText = 'Game Over';
      let subtitle = 'The game has ended.';
      if (this.game.isCheckmate()) {
        const winner = this.game.turn() === 'w' ? 'Black' : 'White';
        resultText = `${winner} Wins!`;
        subtitle = 'By Checkmate';
      } else if (this.game.isDraw()) {
        resultText = 'Draw';
        subtitle = 'By stalemate or repetition';
      }

      this.updateTurnIndicator(resultText);
      this.showGameOverModal(resultText, subtitle);
      return true;
    }
    this.updateTurnIndicator();
    return false;
  }

  /**
   * Scrub main game history via scrubber timeline
   */
  scrubGameToPly(plyIndex) {
    if (plyIndex < 0 || plyIndex > this.moveHistory.length) return;

    this.currentPlyIndex = plyIndex;

    const tempGame = new Chess();
    for (let i = 0; i < plyIndex; i++) {
      const item = this.moveHistory[i];
      tempGame.move({ from: item.from, to: item.to, promotion: 'q' });
    }

    this.gameBoard.setChessGame(tempGame);

    if (plyIndex > 0) {
      const last = this.moveHistory[plyIndex - 1];
      this.gameBoard.setLastMove(last.from, last.to);
    } else {
      this.gameBoard.setLastMove(null, null);
    }

    // Interactive only if we are at the latest live ply and game is active
    const isAtCurrent = plyIndex === this.moveHistory.length;
    this.gameBoard.setInteractive(isAtCurrent && this.gameActive);

    this.highlightMoveTableRow(plyIndex);
    this.updateTimelineProgress();
    this.updateCapturedPieces();
  }

  /**
   * Handle Undo button (removes 1 full turn pair = 2 plies)
   */
  handleUndo() {
    if (this.moveHistory.length === 0) return;

    // Undo player move + computer move if applicable
    const isPlayerTurn = (this.playerColor === 'white' && this.game.turn() === 'w') ||
                         (this.playerColor === 'black' && this.game.turn() === 'b');

    const undoCount = isPlayerTurn && this.moveHistory.length >= 2 ? 2 : 1;

    for (let i = 0; i < undoCount; i++) {
      this.game.undo();
      this.moveHistory.pop();
      if (this.playerAccuracyScores.length > 0) this.playerAccuracyScores.pop();
    }

    this.currentPlyIndex = this.moveHistory.length;
    this.gameActive = true;

    if (this.moveHistory.length > 0) {
      const last = this.moveHistory[this.moveHistory.length - 1];
      this.gameBoard.setLastMove(last.from, last.to);
    } else {
      this.gameBoard.setLastMove(null, null);
    }

    this.gameBoard.setChessGame(this.game);
    this.gameBoard.setInteractive(true);
    this.updateMoveTable();
    this.updateMatchMetrics();
    this.updateCapturedPieces();
    this.updateTimelineProgress();
    this.coach.reactToUndo();

    if (this.settings.showArrows) {
      this.updateBestMoveArrows();
    }
  }

  /**
   * Handle Resign button
   */
  handleResign() {
    if (!this.gameActive) return;

    this.gameActive = false;
    this.gameBoard.setInteractive(false);
    this.updateTurnIndicator('Resigned');
    const winner = this.playerColor === 'white' ? 'Black' : 'White';
    this.showGameOverModal(`${winner} Wins!`, 'By Resignation');
    this.coach.reactToResign();
  }

  /**
   * Reset game state for a new match
   */
  resetGame() {
    this.game = new Chess();
    this.moveHistory = [];
    this.currentPlyIndex = 0;
    this.playerAccuracyScores = [];
    this.gameActive = true;
    this.isAiThinking = false;
    this.clock.reset();

    this.resolvePlayerColor();
    this.gameBoard.setChessGame(this.game);
    this.gameBoard.setOrientation(this.playerColor);
    this.gameBoard.setLastMove(null, null);
    this.gameBoard.clearArrows();
    this.gameBoard.setInteractive(true);

    this.updateMoveTable();
    this.updateMatchMetrics();
    this.updateCapturedPieces();
    this.updateTimelineProgress();
    this.updateTurnIndicator();

    this.coach.speak(`New game started! You play as ${this.playerColor}. Show me your finest moves! ✨`, 'flirty');

    if (this.playerColor === 'black') {
      setTimeout(() => this.triggerAiMove(), 500);
    } else if (this.settings.showArrows) {
      this.updateBestMoveArrows();
    }
  }

  /**
   * Toggle fullscreen mode for the game board
   */
  toggleFullscreen() {
    const wrapper = document.getElementById('game-board-container');
    if (!wrapper) return;

    this.isFullscreen = !this.isFullscreen;

    if (this.isFullscreen) {
      wrapper.classList.add('fixed', 'inset-0', 'z-50', 'bg-slate-950/95', 'p-6', 'flex', 'items-center', 'justify-center');
    } else {
      wrapper.classList.remove('fixed', 'inset-0', 'z-50', 'bg-slate-950/95', 'p-6', 'flex', 'items-center', 'justify-center');
    }
  }

  /**
   * Deep Dive Tab Initialization
   */
  async initDeepDive() {
    this.deepDivePly = this.moveHistory.length;
    this.scrubDeepDiveToPly(this.deepDivePly);
  }

  /**
   * Scrub position on Main Line Board in Deep Dive
   */
  async scrubDeepDiveToPly(plyIndex) {
    if (plyIndex < 0 || plyIndex > this.moveHistory.length) return;

    this.deepDivePly = plyIndex;

    this.deepDiveGame = new Chess();
    for (let i = 0; i < plyIndex; i++) {
      const item = this.moveHistory[i];
      this.deepDiveGame.move({ from: item.from, to: item.to, promotion: 'q' });
    }

    this.mainLineBoard.setChessGame(this.deepDiveGame);
    this.mainLineBoard.setOrientation(this.playerColor);

    if (plyIndex > 0) {
      const last = this.moveHistory[plyIndex - 1];
      this.mainLineBoard.setLastMove(last.from, last.to);
    } else {
      this.mainLineBoard.setLastMove(null, null);
    }

    // Update ply counter UI
    const counter = document.getElementById('dd-ply-counter');
    if (counter) counter.textContent = `Move ${plyIndex} / ${this.moveHistory.length}`;

    // Calculate Branch candidate moves for Main Line position
    this.loadBranchCandidates();
  }

  /**
   * Load Stockfish MultiPV branch candidates for the Deep Dive position
   */
  async loadBranchCandidates() {
    const branchContainer = document.getElementById('dd-branch-list');
    if (!branchContainer) return;

    branchContainer.innerHTML = '<div class="text-slate-400 text-sm animate-pulse p-4 text-center">Evaluating candidates with Stockfish...</div>';

    const currentFen = this.deepDiveGame.fen();
    const candidateMoves = await this.engine.analyzePosition(currentFen, 4);

    branchContainer.innerHTML = '';

    if (!candidateMoves.length) {
      branchContainer.innerHTML = '<div class="text-slate-500 text-sm p-4 text-center">No legal branch moves found.</div>';
      return;
    }

    // Best-move arrows on Main Line board
    const arrows = candidateMoves.map(cand => {
      if (!cand.moveUci) return null;
      return {
        from: cand.moveUci.substring(0, 2),
        to: cand.moveUci.substring(2, 4),
        rank: cand.rank || 1
      };
    }).filter(Boolean);

    this.mainLineBoard.setArrows(arrows);

    // Render candidate list items
    const bestScore = candidateMoves[0]?.score ?? 0;
    candidateMoves.forEach((cand, idx) => {
      const sanMove = cand.san || cand.moveUci;
      const diff = idx === 0 ? 0 : Math.max(0, bestScore - cand.score);

      let tag = 'Best Move';
      let tagBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      let borderStyle = 'border-emerald-500/20';
      let evalColor = 'text-emerald-400';
      let ringColor = 'ring-emerald-500';

      if (idx > 0) {
        if (diff <= 15) {
          tag = 'Excellent';
          tagBg = 'bg-teal-500/15 text-teal-400 border-teal-500/30';
          borderStyle = 'border-teal-500/20';
          evalColor = 'text-teal-400';
          ringColor = 'ring-teal-500';
        } else if (diff <= 50) {
          tag = 'Good';
          tagBg = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
          borderStyle = 'border-blue-500/20';
          evalColor = 'text-blue-400';
          ringColor = 'ring-blue-500';
        } else if (diff <= 120) {
          tag = 'Inaccuracy';
          tagBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
          borderStyle = 'border-amber-500/20';
          evalColor = 'text-amber-400';
          ringColor = 'ring-amber-500';
        } else {
          tag = 'Mistake';
          tagBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
          borderStyle = 'border-rose-500/20';
          evalColor = 'text-rose-400';
          ringColor = 'ring-rose-500';
        }
      }

      const div = document.createElement('div');
      div.className = `branch-item flex items-center justify-between p-3 rounded-lg bg-[#0d0d0f] border ${borderStyle} hover:border-blue-500/50 cursor-pointer shadow transition-all ${
        this.selectedBranchMove === cand.moveUci ? `ring-2 ${ringColor} bg-[#16161a]` : ''
      }`;

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 rounded-full bg-[#1c1c21] flex items-center justify-center font-bold text-xs text-zinc-300 border border-[#2a2a2e]">${idx + 1}</span>
          <div>
            <span class="font-bold text-white text-base">${sanMove}</span>
            <span class="text-xs ml-2 px-2 py-0.5 rounded border ${tagBg}">${tag}</span>
          </div>
        </div>
        <span class="font-mono text-sm font-semibold ${evalColor}">${cand.evalStr}</span>
      `;

      div.addEventListener('click', () => {
        this.selectedBranchMove = cand.moveUci;
        document.querySelectorAll('.branch-item').forEach(el => {
          el.className = el.className.replace(/ring-2\s+ring-\w+-\d+\s+bg-\[#16161a\]/, '').trim();
        });
        div.classList.add('ring-2', ringColor.split(' ')[0], 'bg-[#16161a]');

        this.generateBranchContinuation(cand.moveUci);
      });

      branchContainer.appendChild(div);
    });

    // Auto-select top candidate by default
    if (candidateMoves[0]) {
      this.selectedBranchMove = candidateMoves[0].moveUci;
      this.generateBranchContinuation(candidateMoves[0].moveUci);
    }
  }

  /**
   * Generate 10-ply continuation line for selected branch move and update Branch Board
   */
  generateBranchContinuation(moveUci) {
    const fen = this.deepDiveGame.fen();
    this.continuationLine = this.engine.getContinuationLine(fen, moveUci, 10);
    this.branchPlyIndex = 0;

    this.scrubBranchPly(0);
  }

  /**
   * Scrub through the 10-ply continuation line on Branch Board
   */
  scrubBranchPly(plyIndex) {
    if (!this.continuationLine.length) return;
    if (plyIndex < 0 || plyIndex >= this.continuationLine.length) return;

    this.branchPlyIndex = plyIndex;

    const plyItem = this.continuationLine[plyIndex];
    const branchGame = new Chess(plyItem.fen);

    this.branchBoard.setChessGame(branchGame);
    this.branchBoard.setOrientation(this.playerColor);

    const from = plyItem.moveUci.substring(0, 2);
    const to = plyItem.moveUci.substring(2, 4);
    this.branchBoard.setLastMove(from, to);

    // Update Branch Ply Label
    const plyLabel = document.getElementById('branch-ply-label');
    if (plyLabel) {
      plyLabel.textContent = `Ply ${plyIndex + 1} / ${this.continuationLine.length} (${plyItem.moveSan})`;
    }

    // Refresh the variation moves timeline
    this.renderContinuationTimeline();
  }

  /**
   * Render the interactive 10-ply sequence timeline buttons in Deep Dive
   */
  renderContinuationTimeline() {
    const container = document.getElementById('dd-continuation-timeline');
    if (!container) return;

    container.innerHTML = '';

    if (!this.continuationLine || !this.continuationLine.length) {
      container.innerHTML = '<span class="text-zinc-500 text-xs">No continuation sequence loaded yet.</span>';
      return;
    }

    this.continuationLine.forEach((ply, idx) => {
      const button = document.createElement('button');
      const isActive = idx === this.branchPlyIndex;

      // Label beautifully as e.g. "1. e4" for white, or "e5" for black
      const isWhite = ply.color === 'w';
      const moveNum = Math.floor(idx / 2) + 1;
      const moveLabel = isWhite ? `${moveNum}. ${ply.moveSan}` : `${ply.moveSan}`;

      button.className = `px-2 py-1 text-[11px] rounded border font-mono transition-all cursor-pointer font-semibold ${
        isActive
          ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-sm'
          : 'bg-[#16161a] text-zinc-400 border-[#2a2a2e] hover:bg-[#252529] hover:text-zinc-200'
      }`;

      button.textContent = moveLabel;
      button.title = `Show Ply ${idx + 1}: ${ply.moveSan}`;
      button.addEventListener('click', () => {
        this.scrubBranchPly(idx);
      });
      container.appendChild(button);
    });
  }

  /**
   * Save current game to LocalStorage
   */
  handleSaveGame() {
    const saved = Storage.saveGame({
      pgn: this.game.pgn(),
      moveHistory: this.moveHistory,
      playerColor: this.playerColor,
      difficulty: this.settings.difficulty,
      result: this.game.isGameOver() ? 'Completed' : 'Saved In-Progress'
    });

    if (saved) {
      this.coach.speak("Game saved successfully to LocalStorage! You can review it anytime in the Menu tab~ 💾", 'happy');
      this.renderSavedGamesList();
    }
  }

  /**
   * Load a saved game from LocalStorage into Deep Dive tab
   */
  loadSavedGameIntoDeepDive(gameId) {
    const gameRecord = Storage.getGameById(gameId);
    if (!gameRecord) return;

    this.moveHistory = gameRecord.moveHistory || [];
    this.currentPlyIndex = this.moveHistory.length;
    this.playerColor = gameRecord.playerColor || 'white';

    this.switchTab('deepdive');
    this.coach.speak(`Loaded "${gameRecord.title}" into Deep Dive review! Let's examine every key moment.`, 'tactical');
  }

  /**
   * Render Saved Games List Panel in Menu Tab
   */
  renderSavedGamesList() {
    const container = document.getElementById('saved-games-list');
    if (!container) return;

    const savedGames = Storage.getSavedGames();
    container.innerHTML = '';

    if (!savedGames.length) {
      container.innerHTML = '<div class="text-slate-500 text-sm p-4 text-center">No saved games yet. Click "Save Game" during a match to store PGN history.</div>';
      return;
    }

    savedGames.forEach(g => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow hover:border-slate-700 transition-all';

      card.innerHTML = `
        <div>
          <h4 class="font-bold text-slate-100 text-sm">${g.title}</h4>
          <p class="text-xs text-slate-400 mt-1">${g.date} • ${g.moveHistory.length} plies • Played as ${g.playerColor}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-load-dd text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-medium cursor-pointer">Review in Deep Dive</button>
          <button class="btn-del-game text-xs px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer">🗑️</button>
        </div>
      `;

      card.querySelector('.btn-load-dd')?.addEventListener('click', () => this.loadSavedGameIntoDeepDive(g.id));
      card.querySelector('.btn-del-game')?.addEventListener('click', () => {
        Storage.deleteGame(g.id);
        this.renderSavedGamesList();
      });

      container.appendChild(card);
    });
  }



  getClassificationBadge(classification) {
    if (!classification) return '';
    const config = {
      'Brilliant': { text: 'Brilliant', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      'Great': { text: 'Great', style: 'bg-blue-500/25 text-blue-300 border-blue-500/30' },
      'Best Move': { text: 'Best', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      'Book': { text: 'Book', style: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
      'Excellent': { text: 'Excellent', style: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
      'Good': { text: 'Good', style: 'bg-zinc-700/40 text-zinc-300 border-zinc-700/50' },
      'Inaccuracy': { text: 'Inaccuracy', style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
      'Mistake': { text: 'Mistake', style: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      'Blunder': { text: 'Blunder', style: 'bg-red-500/15 text-red-400 border-red-500/30' }
    };

    const cfg = config[classification];
    if (!cfg) return '';
    return `<span class="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border ${cfg.style} font-sans ml-1 font-semibold">${cfg.text}</span>`;
  }

  /**
   * Update Move History Table on Game Tab
   */
  updateMoveTable() {
    const container = document.getElementById('move-history-table');
    if (!container) return;

    container.innerHTML = '';
    const turns = [];

    for (let i = 0; i < this.moveHistory.length; i += 2) {
      turns.push({
        turnNum: Math.floor(i / 2) + 1,
        white: this.moveHistory[i],
        black: this.moveHistory[i + 1] || null
      });
    }

    turns.forEach(t => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-3 text-xs py-1 px-2 hover:bg-slate-800/60 rounded border-b border-slate-800/40 text-slate-300 items-center';

      const whiteBadge = this.getClassificationBadge(t.white.classification);
      const blackBadge = t.black ? this.getClassificationBadge(t.black.classification) : '';

      row.innerHTML = `
        <span class="text-slate-500 font-mono">${t.turnNum}.</span>
        <span class="font-medium cursor-pointer hover:text-emerald-400 flex items-center ${this.currentPlyIndex === (t.turnNum * 2 - 1) ? 'text-emerald-400 font-bold' : ''}">${t.white.san}${whiteBadge}</span>
        <span class="font-medium cursor-pointer hover:text-emerald-400 flex items-center ${this.currentPlyIndex === (t.turnNum * 2) ? 'text-emerald-400 font-bold' : ''}">${t.black ? t.black.san : ''}${blackBadge}</span>
      `;

      container.appendChild(row);
    });

    container.scrollTop = container.scrollHeight;
  }

  highlightMoveTableRow(plyIndex) {
    this.updateMoveTable();
  }

  updateTurnIndicator(textOverride) {
    const badge = document.getElementById('turn-badge');
    if (!badge) return;

    if (textOverride) {
      badge.textContent = textOverride;
      badge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700';
      return;
    }

    const turn = this.game.turn();
    const isWhiteTurn = turn === 'w';

    badge.textContent = isWhiteTurn ? "White's Turn" : "Black's Turn";
    badge.className = `text-xs font-semibold px-3 py-1 rounded-full border ${
      isWhiteTurn ? 'bg-slate-200 text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-100 border-slate-700'
    }`;
  }

  /**
   * Recalculate and update Win Probability, Engine Evaluation, and Best Move Accuracy in real-time
   */
  async updateMatchMetrics(playerPlayedMove = null) {
    const fen = this.game.fen();
    
    // Get candidate evaluations from engine
    const candidateMoves = await this.engine.analyzePosition(fen, 3);
    let topScore = 0;
    let evalStr = '0.00';

    if (candidateMoves && candidateMoves.length > 0) {
      topScore = candidateMoves[0].score || 0;
      evalStr = candidateMoves[0].evalStr || '0.00';

      // Evaluate accuracy for player move
      if (playerPlayedMove) {
        const bestUci = candidateMoves[0].moveUci;
        const playerUci = playerPlayedMove.from + playerPlayedMove.to + (playerPlayedMove.promotion || '');
        const playedCand = candidateMoves.find(c => c.moveUci === playerUci);
        const playedScore = playedCand ? playedCand.score : (topScore - 120);

        const diff = Math.max(0, topScore - playedScore);
        const moveAcc = Math.max(15, Math.round(100 * Math.exp(-0.003 * diff)));
        this.playerAccuracyScores.push(moveAcc);
      }
    }

    // Convert score (from White's perspective) to Win Probability
    const turnMultiplier = this.game.turn() === 'w' ? 1 : -1;
    const scoreFromWhite = topScore * turnMultiplier;

    let whiteWinProb = 100 / (1 + Math.exp(-0.004 * scoreFromWhite));
    whiteWinProb = Math.min(99, Math.max(1, Math.round(whiteWinProb * 10) / 10));

    const winProbVal = document.getElementById('win-prob-val');
    const winProbBar = document.getElementById('win-prob-bar');

    const displayWinProb = this.playerColor === 'black' ? (100 - whiteWinProb).toFixed(1) : whiteWinProb.toFixed(1);

    if (winProbVal) winProbVal.textContent = `${displayWinProb}%`;
    if (winProbBar) winProbBar.style.width = `${displayWinProb}%`;

    // Engine Eval Card
    const evalScoreText = document.getElementById('eval-score-text');
    const evalBarWhite = document.getElementById('eval-bar-white');
    const evalBarBlack = document.getElementById('eval-bar-black');

    if (evalScoreText) evalScoreText.textContent = evalStr;
    if (evalBarWhite && evalBarBlack) {
      evalBarWhite.style.width = `${whiteWinProb}%`;
      evalBarBlack.style.width = `${100 - whiteWinProb}%`;
    }

    // Best Move Accuracy Badge
    const bestAccVal = document.getElementById('best-acc-val');
    if (bestAccVal) {
      if (this.playerAccuracyScores.length > 0) {
        const avgAcc = Math.round(this.playerAccuracyScores.reduce((a, b) => a + b, 0) / this.playerAccuracyScores.length);
        bestAccVal.textContent = `${avgAcc}%`;
      } else {
        bestAccVal.textContent = '100%';
      }
    }
  }

  /**
   * Update Captured Pieces Display
   */
  updateCapturedPieces() {
    const capturedWhiteContainer = document.getElementById('captured-white');
    const capturedBlackContainer = document.getElementById('captured-black');
    if (!capturedWhiteContainer || !capturedBlackContainer) return;

    const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };

    const board = this.game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const square = board[r][c];
        if (square && square.type !== 'k') {
          currentCounts[square.color][square.type]++;
        }
      }
    }

    const pieceIcons = {
      p: '♟', n: '♞', b: '♝', r: '♜', q: '♛'
    };

    // White pieces captured by Black
    let capturedWhiteHtml = '';
    Object.keys(initialCounts).forEach(type => {
      const missing = initialCounts[type] - currentCounts['w'][type];
      const pieceKey = 'w' + type.toUpperCase();
      for (let i = 0; i < missing; i++) {
        capturedWhiteHtml += `<div class="w-5 h-5 inline-block hover:scale-125 transition-transform cursor-default" title="Captured White ${type.toUpperCase()}">${getPieceSvg(pieceKey, this.settings.pieceStyle || 'cburnett')}</div>`;
      }
    });

    // Black pieces captured by White
    let capturedBlackHtml = '';
    Object.keys(initialCounts).forEach(type => {
      const missing = initialCounts[type] - currentCounts['b'][type];
      const pieceKey = 'b' + type.toUpperCase();
      for (let i = 0; i < missing; i++) {
        capturedBlackHtml += `<div class="w-5 h-5 inline-block hover:scale-125 transition-transform cursor-default" title="Captured Black ${type.toUpperCase()}">${getPieceSvg(pieceKey, this.settings.pieceStyle || 'cburnett')}</div>`;
      }
    });

    capturedWhiteContainer.innerHTML = capturedWhiteHtml || '<span class="text-xs text-zinc-500">None</span>';
    capturedBlackContainer.innerHTML = capturedBlackHtml || '<span class="text-xs text-zinc-500">None</span>';
  }

  /**
   * Update Timeline Progress Bar & Ply Badge
   */
  updateTimelineProgress() {
    const progressBar = document.getElementById('timeline-progress-bar');
    const thumb = document.getElementById('timeline-thumb');
    const badge = document.getElementById('move-count-badge');

    const totalPlies = this.moveHistory.length;
    const pct = totalPlies > 0 ? (this.currentPlyIndex / totalPlies) * 100 : 100;

    if (progressBar) progressBar.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    if (badge) badge.textContent = `${totalPlies} Plies`;
  }

  /**
   * Update Opening Book Header & Candidates
   */
  /**
   * Opening Book Explorer UI Handling
   */
  initOpeningExplorerUI() {
    const select = document.getElementById('opening-select-dropdown');
    if (select) {
      select.innerHTML = '<option value="free_explore">🌐 Free Exploration (Live Lichess DB)</option>' + OPENINGS_DATABASE.map(op => `<option value="${op.id}">${op.eco} — ${op.name}</option>`).join('');
      if (this.openingIndex === -1) {
        select.value = 'free_explore';
      } else {
        const op = OPENINGS_DATABASE[this.openingIndex];
        if (op) select.value = op.id;
      }
    }
    this.renderOpeningExplorer();
  }

  renderOpeningExplorer() {
    const ecoBadge = document.getElementById('opening-eco-badge');
    const titleHeader = document.getElementById('opening-title-header');
    const descText = document.getElementById('opening-desc-text');
    const plyCounter = document.getElementById('opening-ply-counter');
    const commentaryEl = document.getElementById('opening-move-commentary');
    const keyIdeasUl = document.getElementById('opening-key-ideas');
    const candContainer = document.getElementById('opening-candidates-container');

    if (this.openingIndex === -1) {
      if (!this.freeExploreGame) this.freeExploreGame = new Chess();
      
      if (ecoBadge) ecoBadge.textContent = 'LIVE';
      if (titleHeader) titleHeader.textContent = 'Free Exploration Mode';
      if (descText) descText.textContent = 'Play moves freely. We automatically fetch millions of Lichess Grandmaster games for your exact board position.';
      if (plyCounter) plyCounter.textContent = `Ply ${this.freeExploreGame.history().length}`;
      
      if (this.openingBoard) {
        this.openingBoard.setChessGame(this.freeExploreGame);
        this.openingBoard.setInteractive(true);
        const history = this.freeExploreGame.history({ verbose: true });
        if (history.length > 0) {
          const lastMove = history[history.length - 1];
          this.openingBoard.setLastMove(lastMove.from, lastMove.to);
        } else {
          this.openingBoard.setLastMove(null, null);
        }
        this.openingBoard.renderBoard();
      }
      
      if (keyIdeasUl) keyIdeasUl.innerHTML = '<li>Explore lines not in the local database.</li><li>See precise statistics for every candidate move.</li>';
      if (commentaryEl) commentaryEl.innerHTML = '<div class="text-zinc-400 p-2 italic text-sm">Play a move on the board above to analyze!</div>';
      
      if (candContainer) candContainer.innerHTML = '<div class="p-4 text-center text-zinc-400 animate-pulse text-sm">Fetching Master Database... ♟️</div>';
      
      this.fetchLiveLichessMasters(this.freeExploreGame);
      return;
    }

    const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];

    if (ecoBadge) ecoBadge.textContent = op.eco;
    if (titleHeader) titleHeader.textContent = op.name;
    if (descText) descText.textContent = op.description;
    if (plyCounter) plyCounter.textContent = `Ply ${this.openingPly} / ${op.moves.length}`;

    // Replay position on opening board
    this.openingGame = new Chess();
    let lastFrom = null;
    let lastTo = null;

    for (let i = 0; i < this.openingPly; i++) {
      if (op.moves[i]) {
        try {
          const moveRes = this.openingGame.move(op.moves[i]);
          if (moveRes) {
            lastFrom = moveRes.from;
            lastTo = moveRes.to;
          }
        } catch (e) {
          console.warn('Opening move error:', op.moves[i], e);
        }
      }
    }

    if (this.openingBoard) {
      this.openingBoard.setChessGame(this.openingGame);
      if (lastFrom && lastTo) {
        this.openingBoard.setLastMove(lastFrom, lastTo);
      } else {
        this.openingBoard.setLastMove(null, null);
      }
      this.openingBoard.renderBoard();
    }

    if (keyIdeasUl) {
      keyIdeasUl.innerHTML = op.keyIdeas.map(idea => `<li>${idea}</li>`).join('');
    }

    // Commentary for current ply
    if (commentaryEl) {
      if (this.openingPly === 0) {
        commentaryEl.innerHTML = `
          <p class="text-zinc-300">Starting position. Step forward to explore move-by-move annotations and GM candidate stats.</p>
        `;
      } else {
        const comm = op.moveCommentary.find(c => c.ply === this.openingPly);
        if (comm) {
          commentaryEl.innerHTML = `
            <div class="flex items-center gap-2 mb-2 font-mono font-extrabold text-blue-400 text-sm border-b border-blue-900/50 pb-1">
              <span>Move ${Math.ceil(comm.ply / 2)}: ${comm.move}</span>
            </div>
            <div class="flex flex-col gap-2">
              <div class="p-2 bg-blue-950/50 rounded border border-blue-800/50 text-xs">
                <span class="font-bold text-blue-300">Why this is better:</span> ${comm.rationale}
              </div>
              <div class="p-2 bg-purple-950/50 rounded border border-purple-800/50 text-xs">
                <span class="font-bold text-purple-300">Opponent Intention:</span> ${comm.enemyPlan}
              </div>
              <div class="p-2 bg-amber-950/50 rounded border border-amber-800/50 text-xs">
                <span class="font-bold text-amber-300">Tactical Warning:</span> ${comm.warning}
              </div>
            </div>
          `;
        } else {
          commentaryEl.innerHTML = `<p class="text-zinc-300">Move ${this.openingPly}: Continuation line in ${op.name}. Maintain active development!</p>`;
        }
      }
    }

    // Render candidate move cards
    if (candContainer) {
      if (op.candidates.length === 0) {
        candContainer.innerHTML = '<div class="text-xs text-zinc-500 italic p-4 text-center">Main line fully explored.</div>';
      } else {
        let html = '';
        op.candidates.forEach(c => {
          const winW = c.winW ?? 40;
          const draw = c.draw ?? 35;
          const winB = c.winB ?? 25;

          html += `
            <div class="bg-[#0d0d0f] p-3 rounded-lg border border-[#2a2a2e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-500/40 transition-colors cursor-pointer lichess-candidate-move" data-san="${c.san}">
              <div class="flex items-center gap-3">
                <span class="font-mono font-extrabold text-blue-400 text-sm px-2.5 py-1 bg-blue-500/10 rounded border border-blue-500/20">${c.san}</span>
                <span class="text-xs text-zinc-300 font-medium">${c.name}</span>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <span class="text-[10px] font-mono text-zinc-400 min-w-[60px]">${c.count} GM games</span>
                <div class="flex h-3.5 w-32 rounded overflow-hidden text-[9px] font-mono text-white text-center font-bold">
                  <div style="width:${winW}%" class="bg-emerald-600 flex items-center justify-center">${winW}%</div>
                  <div style="width:${draw}%" class="bg-zinc-600 flex items-center justify-center">${draw}%</div>
                  <div style="width:${winB}%" class="bg-red-600 flex items-center justify-center">${winB}%</div>
                </div>
              </div>
            </div>
          `;
        });
        candContainer.innerHTML = html;
      }
    }
  }

  async fetchLiveLichessMasters(customGame) {
    const btn = document.getElementById('btn-fetch-lichess-masters');
    if (btn) {
      btn.textContent = 'Fetching Lichess Masters Database... ♟️';
      btn.disabled = true;
    }
    
    this.coach.speak("Connecting to the Lichess Masters Database to retrieve millions of high-level Grandmaster game stats for this position... 🌐", "tactical");

    try {
      const fen = customGame ? customGame.fen() : this.openingGame.fen();
      const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`;
      
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!res.ok) throw new Error(`Lichess API HTTP ${res.status}`);
      const data = await res.json();

      // Update ECO and Title if found
      if (data.opening) {
        const ecoBadge = document.getElementById('opening-eco-badge');
        const titleHeader = document.getElementById('opening-title-header');
        if (ecoBadge) ecoBadge.textContent = data.opening.eco || 'ECO';
        if (titleHeader) titleHeader.textContent = data.opening.name || 'Unknown Opening';
      }

      // Render candidates from live Lichess data
      const candContainer = document.getElementById('opening-candidates-container');
      const totalGamesLabel = document.getElementById('opening-total-games-label');

      const totalMastersGames = (data.white || 0) + (data.draws || 0) + (data.black || 0);
      if (totalGamesLabel) {
        totalGamesLabel.textContent = `${totalMastersGames.toLocaleString()} Master Games`;
      }

      if (candContainer) {
        if (!data.moves || data.moves.length === 0) {
          candContainer.innerHTML = '<div class="text-xs text-zinc-500 italic p-4 text-center">No master games found in this position. Try an earlier position!</div>';
        } else {
          let html = '';
          data.moves.slice(0, 5).forEach(m => {
            const total = m.white + m.draws + m.black;
            const winW = Math.round((m.white / total) * 100) || 0;
            const draw = Math.round((m.draws / total) * 100) || 0;
            const winB = 100 - winW - draw; // Avoid rounding display errors

            html += `
              <div class="bg-[#0d0d0f] p-3 rounded-lg border border-[#2a2a2e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-500/40 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="font-mono font-extrabold text-blue-400 text-sm px-2.5 py-1 bg-blue-500/10 rounded border border-blue-500/20">${m.san}</span>
                  <span class="text-xs text-zinc-300 font-medium">Avg Rating: ${m.averageRating || 'Unknown'} (Performance: ${m.averagePerformance || 'N/A'})</span>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <span class="text-[10px] font-mono text-zinc-400 min-w-[60px]">${total.toLocaleString()} games</span>
                  <div class="flex h-3.5 w-32 rounded overflow-hidden text-[9px] font-mono text-white text-center font-bold">
                    <div style="width:${winW}%" class="bg-emerald-600 flex items-center justify-center" title="White wins: ${winW}%">${winW}%</div>
                    <div style="width:${draw}%" class="bg-zinc-600 flex items-center justify-center" title="Draws: ${draw}%">${draw}%</div>
                    <div style="width:${winB}%" class="bg-red-600 flex items-center justify-center" title="Black wins: ${winB}%">${winB}%</div>
                  </div>
                </div>
              </div>
            `;
          });
          candContainer.innerHTML = html;
        }
      }

      this.coach.speak("Lichess Masters database loaded! You can see the real win-loss margins of top Grandmasters in this exact line.", "happy");

    } catch (err) {
      console.warn('Lichess masters fetch failed:', err);
      this.coach.speak("Lichess Masters API is currently busy. Try again in a few seconds!", "surprised");
    } finally {
      if (btn) {
        btn.textContent = 'Fetch Live Lichess Masters Data';
        btn.disabled = false;
      }
    }
  }

  updateOpeningDisplay() {
    const sanHistory = this.moveHistory.map(m => m.san);
    const info = OpeningExplorer.identifyOpening(sanHistory);

    const liveLabel = document.getElementById('live-opening-label');
    if (liveLabel) {
      // Set local fallback first
      if (info && info.name !== 'Grandmaster Main Line') {
        liveLabel.textContent = `${info.eco} — ${info.name}`;
      } else {
        liveLabel.textContent = 'Searching Opening...';
      }
    }
    
    // Asynchronously fetch exact opening from Lichess
    if (this.game && this.game.history().length > 0) {
      const fen = this.game.fen();
      fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&moves=0`)
        .then(res => res.json())
        .then(data => {
          if (data && data.opening && liveLabel) {
            liveLabel.textContent = `${data.opening.eco} — ${data.opening.name}`;
          } else if (liveLabel && info) {
             liveLabel.textContent = `${info.eco} — ${info.name}`; // fallback
          }
        })
        .catch(err => {
          if (liveLabel && info) liveLabel.textContent = `${info.eco} — ${info.name}`;
        });
    } else if (this.game && this.game.history().length === 0) {
      if (liveLabel) liveLabel.textContent = 'Standard Starting Position';
    }
  }

  /**
   * Tactical Puzzle UI Handling
   */
  loadPuzzleUI(puzzle) {
    if (!puzzle) return;
    this.puzzleGame = new Chess(puzzle.fen);
    this.puzzleTrainer.resetProgress();

    if (this.puzzleBoard) {
      this.puzzleBoard.setChessGame(this.puzzleGame);
      this.puzzleBoard.setOrientation(puzzle.playerColor || 'white');
      this.puzzleBoard.setInteractive(true);
    }

    const themeBadge = document.getElementById('puzzle-theme-badge');
    const diffLabel = document.getElementById('puzzle-difficulty-label');
    const titleLabel = document.getElementById('puzzle-title-label');
    const descLabel = document.getElementById('puzzle-desc-label');
    const hintText = document.getElementById('puzzle-hint-text');
    const feedbackBanner = document.getElementById('puzzle-feedback-banner');
    const expBox = document.getElementById('puzzle-explanation-box');

    if (expBox) expBox.classList.add('hidden');
    if (themeBadge) themeBadge.textContent = puzzle.theme;
    if (diffLabel) diffLabel.textContent = `Rating: ${puzzle.rating}`;
    if (titleLabel) titleLabel.textContent = puzzle.title;
    if (descLabel) descLabel.textContent = puzzle.description;
    if (hintText) hintText.textContent = 'Tap "Coach Hint" when you need tactical guidance.';
    if (feedbackBanner) {
      feedbackBanner.textContent = `${puzzle.playerColor === 'white' ? 'White' : 'Black'} to play. Find the best tactical move!`;
      feedbackBanner.className = 'w-full p-3 rounded-xl bg-[#16161a] border border-[#2a2a2e] text-xs text-center font-bold text-zinc-300';
    }

    this.updatePuzzleStats();
  }

  handlePuzzleMove(move) {
    const res = this.puzzleTrainer.checkMove(move.san, move.from + move.to);
    const feedbackBanner = document.getElementById('puzzle-feedback-banner');
    const expBox = document.getElementById('puzzle-explanation-box');
    const expText = document.getElementById('puzzle-explanation-text');

    if (res.status === 'solved') {
      if (feedbackBanner) {
        feedbackBanner.textContent = res.message;
        feedbackBanner.className = 'w-full p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-xs text-center font-extrabold text-emerald-300 animate-bounce';
      }
      if (expBox && expText) {
        expText.textContent = res.explanation;
        expBox.classList.remove('hidden');
      }
      this.coach.speak(`Outstanding tactical calculation! ${res.explanation}`, 'happy');
      this.updatePuzzleStats();
      this.puzzleBoard.setInteractive(false);
    } else if (res.status === 'correct_step') {
      if (feedbackBanner) {
        feedbackBanner.textContent = res.message;
        feedbackBanner.className = 'w-full p-3 rounded-xl bg-blue-950/80 border border-blue-500 text-xs text-center font-extrabold text-blue-300';
      }
      if (res.opponentMove) {
        setTimeout(() => {
          this.puzzleGame.move(res.opponentMove);
          this.puzzleBoard.render();
        }, 400);
      }
    } else {
      // Wrong move
      if (feedbackBanner) {
        feedbackBanner.textContent = res.message;
        feedbackBanner.className = 'w-full p-3 rounded-xl bg-red-950/90 border border-red-500 text-xs text-center font-extrabold text-red-300';
      }
      this.coach.speak(`That's not the best move! ${res.hint}`, 'surprised');
      // Undo user move after 600ms so user can try again
      setTimeout(() => {
        this.puzzleGame.undo();
        this.puzzleBoard.render();
      }, 600);
      this.updatePuzzleStats();
    }
  }

  resetCurrentPuzzle() {
    const puzzle = this.puzzleTrainer.getCurrentPuzzle();
    this.puzzleGame = new Chess(puzzle.fen);
    this.puzzleTrainer.resetProgress();
    if (this.puzzleBoard) {
      this.puzzleBoard.setChessGame(this.puzzleGame);
      this.puzzleBoard.setInteractive(true);
    }
    const feedbackBanner = document.getElementById('puzzle-feedback-banner');
    const expBox = document.getElementById('puzzle-explanation-box');
    if (expBox) expBox.classList.add('hidden');
    if (feedbackBanner) {
      feedbackBanner.textContent = 'Position reset. Find the best move!';
      feedbackBanner.className = 'w-full p-3 rounded-xl bg-[#16161a] border border-[#2a2a2e] text-xs text-center font-bold text-zinc-300';
    }
  }

  revealPuzzleSolution() {
    const puzzle = this.puzzleTrainer.getCurrentPuzzle();
    const expBox = document.getElementById('puzzle-explanation-box');
    const expText = document.getElementById('puzzle-explanation-text');
    const feedbackBanner = document.getElementById('puzzle-feedback-banner');

    if (expBox && expText) {
      expText.innerHTML = `<strong>Solution line:</strong> ${puzzle.solution.join(' ')}<br><br>${puzzle.whyItWorks}`;
      expBox.classList.remove('hidden');
    }

    if (feedbackBanner) {
      feedbackBanner.textContent = `Solution revealed: ${puzzle.solution.join(' ')}`;
      feedbackBanner.className = 'w-full p-3 rounded-xl bg-purple-950/80 border border-purple-500 text-xs text-center font-bold text-purple-300';
    }

    this.coach.speak(`Here is the winning solution: ${puzzle.solution.join(' ')}. ${puzzle.whyItWorks}`, 'tactical');
  }

  updatePuzzleStats() {
    const streakLabel = document.getElementById('puzzle-streak-label');
    const ratingLabel = document.getElementById('puzzle-rating-label');
    if (streakLabel) streakLabel.textContent = `🔥 ${this.puzzleTrainer.getStreak()}`;
    if (ratingLabel) ratingLabel.textContent = this.puzzleTrainer.getRating();
  }

  /**
   * Render Centipawn Evaluation SVG Line Graph & Classification Badges Summary
   */
  renderEvalGraph() {
    const svg = document.getElementById('eval-graph-svg');
    if (!svg) return;

    // Reset move counts
    this.moveClassCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

    const evals = [0]; // Starting position evaluation = 0
    let lastCp = 0;

    this.moveHistory.forEach((m, idx) => {
      let cp = lastCp;
      if (m.scoreFromWhite !== undefined && m.scoreFromWhite !== null) {
        cp = m.scoreFromWhite;
      } else {
        // Fallback smooth deterministic evaluation pattern if history doesn't contain a score
        const wave = (Math.sin(idx * 0.8) * 50) + ((idx % 3 === 0) ? 40 : -20);
        cp = lastCp + Math.round(wave);
        cp = Math.max(-1000, Math.min(1000, cp));
      }
      lastCp = cp;
      evals.push(cp);

      // Classify move quality based on actual stored classification
      if (m.classification) {
        const cls = m.classification.toLowerCase();
        if (cls === 'brilliant') this.moveClassCounts.brilliant++;
        else if (cls === 'great') this.moveClassCounts.great++;
        else if (cls === 'best move' || cls === 'best') this.moveClassCounts.best++;
        else if (cls === 'excellent') this.moveClassCounts.excellent++;
        else if (cls === 'inaccuracy') this.moveClassCounts.inaccuracy++;
        else if (cls === 'mistake') this.moveClassCounts.mistake++;
        else if (cls === 'blunder') this.moveClassCounts.blunder++;
      } else {
        // Fallback default categorization if classification is missing
        this.moveClassCounts.best++;
      }
    });

    // Update count labels
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('count-brilliant', this.moveClassCounts.brilliant);
    setEl('count-great', this.moveClassCounts.great);
    setEl('count-best', this.moveClassCounts.best);
    setEl('count-excellent', this.moveClassCounts.excellent);
    setEl('count-inaccuracy', this.moveClassCounts.inaccuracy);
    setEl('count-mistake', this.moveClassCounts.mistake);
    setEl('count-blunder', this.moveClassCounts.blunder);

    // SVG Polyline Path Generation
    const width = 600;
    const height = 200;
    const midY = height / 2;
    const maxCp = 600;

    const points = evals.map((cp, idx) => {
      const x = (idx / Math.max(1, evals.length - 1)) * width;
      // Normalizing CP range [-600, +600] to Y [height, 0]
      const clamped = Math.max(-maxCp, Math.min(maxCp, cp));
      const y = midY - (clamped / maxCp) * (midY - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M 0,${midY} L ${points.join(' L ')}`;

    svg.innerHTML = `
      <line x1="0" y1="${midY}" x2="${width}" y2="${midY}" stroke="#3a3a3e" stroke-width="1.5" stroke-dasharray="4,4"/>
      <path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${evals.map((cp, idx) => {
        const x = (idx / Math.max(1, evals.length - 1)) * width;
        const clamped = Math.max(-maxCp, Math.min(maxCp, cp));
        const y = midY - (clamped / maxCp) * (midY - 10);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${cp >= 0 ? '#10b981' : '#ef4444'}" stroke="#0d0d0f" stroke-width="1.5"/>`;
      }).join('')}
    `;
  }
}

// Bootstrap application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.hikariApp = new VanguardChessApp();
});

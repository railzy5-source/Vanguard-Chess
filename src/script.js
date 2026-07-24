/**
 * Vanguard Chess Coach - Main Application Orchestrator
 * Connects Chess logic, Stockfish Engine, Interactive Board, Coach Naomi, and LocalStorage.
 */

import { Chess } from 'chess.js';
import { ChessEngine } from './engine.js';
import { ChessBoardUI } from './board.js';
import { CoachNaomi } from './coach.js';
import { Storage } from './storage.js';
import { ChessClock } from './clock.js';
import { OPENINGS_DATABASE, OpeningExplorer } from './openingBook.js';
import { MoveClassifier } from './classifier.js';
import { FactsEngine } from './factsEngine.js';
import { LLMCoach } from './llmCoach.js';

function getPieceSvg(pieceKey, style = 'cburnett') {
  const symbols = {
    'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
  };
  const isWhite = pieceKey.startsWith('w');
  const symbol = symbols[pieceKey] || '♟';
  const colorStyle = isWhite
    ? 'color: #f8fafc; text-shadow: 0 1px 2px rgba(0,0,0,0.9);'
    : 'color: #0f172a; text-shadow: 0 1px 2px rgba(255,255,255,0.6);';
  return `<span style="${colorStyle}" class="text-base font-bold leading-none select-none inline-flex items-center justify-center w-full h-full">${symbol}</span>`;
}

class VanguardChessApp {
  constructor() {
    window.app = this;
    this.game = new Chess();
    this.engine = new ChessEngine();
    this.coach = new CoachNaomi();
    this.settings = Storage.getSettings();
    
    // Initialize LLM Coach (optional, falls back gracefully)
    this.llmCoach = new LLMCoach();

    // Centralized Game State
    this.state = {
      moveHistory: [],
      currentPlyIndex: 0,
      playerColor: 'white',
      gameActive: true,
      isAiThinking: false,
      isFullscreen: false,
      playerAccuracyScores: [],
      moveClassCounts: { brilliant: 0, great: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      openingIndex: 0,
      openingPly: 0,
      deepDivePly: 0,
      selectedBranchMove: null,
      continuationLine: [],
      branchPlyIndex: 0
    };

    // Clock
    this.clock = new ChessClock('blitz5', 
      (state) => this.renderClockTick(state),
      (timeoutColor) => this.handleClockTimeout(timeoutColor)
    );

    // Deep Dive & Opening Games
    this.deepDiveGame = new Chess();

    // Boards
    this.gameBoard = null;
    this.mainLineBoard = null;
    this.branchBoard = null;

    this.init();
  }

  get moveHistory() { return this.state.moveHistory; }
  set moveHistory(v) { this.state.moveHistory = v; }

  get currentPlyIndex() { return this.state.currentPlyIndex; }
  set currentPlyIndex(v) { this.state.currentPlyIndex = v; }

  get playerColor() { return this.state.playerColor; }
  set playerColor(v) { this.state.playerColor = v; }

  get gameActive() { return this.state.gameActive; }
  set gameActive(v) { this.state.gameActive = v; }

  get isAiThinking() { return this.state.isAiThinking; }
  set isAiThinking(v) { this.state.isAiThinking = v; }

  get isFullscreen() { return this.state.isFullscreen; }
  set isFullscreen(v) { this.state.isFullscreen = v; }

  get playerAccuracyScores() { return this.state.playerAccuracyScores; }
  set playerAccuracyScores(v) { this.state.playerAccuracyScores = v; }

  get moveClassCounts() { return this.state.moveClassCounts; }
  set moveClassCounts(v) { this.state.moveClassCounts = v; }

  get openingIndex() { return this.state.openingIndex; }
  set openingIndex(v) { this.state.openingIndex = v; }

  get openingPly() { return this.state.openingPly; }
  set openingPly(v) { this.state.openingPly = v; }

  get deepDivePly() { return this.state.deepDivePly; }
  set deepDivePly(v) { this.state.deepDivePly = v; }

  get selectedBranchMove() { return this.state.selectedBranchMove; }
  set selectedBranchMove(v) { this.state.selectedBranchMove = v; }

  get continuationLine() { return this.state.continuationLine; }
  set continuationLine(v) { this.state.continuationLine = v; }

  get branchPlyIndex() { return this.state.branchPlyIndex; }
  set branchPlyIndex(v) { this.state.branchPlyIndex = v; }

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

    // Initialize Opening Explorer Board
    this.openingGame = new Chess();
    this.openingBoard = new ChessBoardUI('opening-board-container', {
      chessGame: this.openingGame,
      orientation: 'white',
      interactive: false,
      onMove: (move) => {
        if (this.openingIndex === -1 && this.freeExploreGame) {
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

    // If AI plays White, trigger AI move
    if (this.playerColor === 'black') {
      setTimeout(() => this.triggerAiMove(), 600);
    } else {
      this.updateBestMoveArrows();
    }
  }

  /**
   * Check if a move is in the opening book
   * This prevents false "mistake" classifications for principled opening moves
   */
  isBookMove(moveSan) {
    const sanHistory = this.moveHistory.map(m => m.san);
    const testHistory = [...sanHistory, moveSan];
    
    for (const opening of OPENINGS_DATABASE) {
      if (testHistory.length <= opening.moves.length) {
        let match = true;
        for (let i = 0; i < testHistory.length; i++) {
          if (opening.moves[i] !== testHistory[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          return {
            isBook: true,
            openingName: opening.name,
            openingId: opening.id,
            keyIdeas: opening.keyIdeas || [],
            nextMove: opening.moves[testHistory.length] || null
          };
        }
      }
    }
    
    return { isBook: false };
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
    if (selectPieceStyle) selectPieceStyle.value = this.settings.pieceStyle || 'cburnett';
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

    // Keyboard Arrow navigation for Deep Dive
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (this.currentTab === 'deepdive') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.scrubDeepDiveToPly(this.deepDivePly - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.scrubDeepDiveToPly(this.deepDivePly + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.scrubBranchPly(this.branchPlyIndex - 1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.scrubBranchPly(this.branchPlyIndex + 1);
        }
      }
    });

    // Time Control selector
    document.getElementById('time-control-select')?.addEventListener('change', (e) => {
      this.clock.setTimeControl(e.target.value);
    });

    // Opening Explorer Sub-Tab Switching
    document.querySelectorAll('.opening-subtab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.subtab;
        
        document.querySelectorAll('.opening-subtab-btn').forEach(b => {
          if (b.dataset.subtab === targetTab) {
            b.className = 'opening-subtab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-blue-600 text-white shadow';
          } else {
            b.className = 'opening-subtab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#0d0d0f] text-zinc-400 hover:text-white border border-[#2a2a2e]';
          }
        });

        document.querySelectorAll('.opening-subtab-panel').forEach(panel => {
          if (panel.id === `opening-subtab-panel-${targetTab}`) {
            panel.classList.remove('hidden');
            panel.classList.add('flex');
          } else {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
          }
        });
      });
    });

    // Opening Side Filter Change
    document.getElementById('opening-side-filter')?.addEventListener('change', () => {
      this.renderOpeningDropdown();
      this.renderOpeningExplorer();
    });

    // Opening Stepper Chips Click Delegate
    document.getElementById('opening-stepper-chips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.opening-chip');
      if (chip && chip.dataset.ply !== undefined) {
        const ply = parseInt(chip.dataset.ply, 10);
        this.openingPly = ply;
        this.renderOpeningExplorer();
      }
    });

    // Opening Explorer Stepper Controls & Flip
    document.getElementById('opening-select-dropdown')?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const index = OPENINGS_DATABASE.findIndex(o => o.id === selectedId);
      if (index !== -1) {
        this.openingIndex = index;
        this.openingPly = 0;
        this.userFlippedOpeningBoard = false;
        this.renderOpeningExplorer();
      }
    });

    document.getElementById('opening-btn-flip')?.addEventListener('click', () => {
      if (this.openingBoard) {
        this.userFlippedOpeningBoard = true;
        const current = this.openingBoard.orientation || 'white';
        const newOrient = current === 'white' ? 'black' : 'white';
        this.openingBoard.setOrientation(newOrient);
      }
    });

    document.getElementById('opening-btn-first')?.addEventListener('click', () => {
      this.openingPly = 0;
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-prev')?.addEventListener('click', () => {
      this.openingPly = Math.max(0, this.openingPly - 1);
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-next')?.addEventListener('click', () => {
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      this.openingPly = Math.min(op.moves.length, this.openingPly + 1);
      this.renderOpeningExplorer();
    });

    document.getElementById('opening-btn-last')?.addEventListener('click', () => {
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      this.openingPly = op.moves.length;
      this.renderOpeningExplorer();
    });

    // Mark as Mastered Toggle
    document.getElementById('opening-btn-mastered')?.addEventListener('click', () => {
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      let mastered = JSON.parse(localStorage.getItem('hikari_mastered_openings') || '[]');
      if (mastered.includes(op.id)) {
        mastered = mastered.filter(id => id !== op.id);
        this.coach.speak(`Removed ${op.name} from your mastered list.`, 'normal');
      } else {
        mastered.push(op.id);
        this.coach.speak(`🎉 Awesome! ${op.name} added to your Mastered Repertoire!`, 'happy');
      }
      localStorage.setItem('hikari_mastered_openings', JSON.stringify(mastered));
      this.renderOpeningExplorer();
      this.renderOpeningDropdown();
    });

    // Practice Position Against Bot
    document.getElementById('opening-btn-practice-bot')?.addEventListener('click', () => {
      const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];
      if (this.openingGame) {
        const fen = this.openingGame.fen();
        this.game = new Chess(fen);
        this.gameBoard.setChessGame(this.game);
        this.gameBoard.setOrientation(op.side === 'black' ? 'black' : 'white');
        this.moveHistory = [];
        this.gameActive = true;

        this.switchTab('play');

        this.coach.speak(`⚔️ Practice position loaded for ${op.name}! Make your move against Coach Naomi!`, 'flirty');
      }
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

    // Save Game Button
    document.getElementById('btn-save-game')?.addEventListener('click', () => this.handleSaveGame());
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

    if (tabId === 'deepdive' || tabId === 'review') {
      const activeContent = document.getElementById('tab-deepdive');
      if (activeContent) activeContent.classList.add('active');
      this.initDeepDive();
      this.coach.reactToDeepDive();
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

    // Check if this is a book move FIRST — this prevents false "mistake" flags
    const sanHistory = this.moveHistory.map(m => m.san);
    const bookCheck = this.isBookMove(move.san);
    let isBookMove = false;
    let matchedOpeningName = '';
    let openingKeyIdeas = [];

    if (bookCheck.isBook) {
      isBookMove = true;
      matchedOpeningName = bookCheck.openingName;
      openingKeyIdeas = bookCheck.keyIdeas || [];
    }

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

        // Use MoveClassifier with book override
        const result = MoveClassifier.classifyMove({
          playedUci: uci,
          bestUci: bestUci,
          evalBefore: topScore,
          evalAfter: playedScore,
          isSacrifice: move.captured !== undefined && move.piece !== 'p' && move.captured !== 'p',
          isBook: isBookMove,
          openingName: matchedOpeningName
        });

        classification = result.classification;

        // Accuracy tracking
        const moveAcc = Math.max(15, Math.round(100 * Math.exp(-0.003 * diff)));
        this.playerAccuracyScores.push(moveAcc);
      }
    } catch (err) {
      console.error('Error classifying player move:', err);
    }

    // If it's a book move, override classification
    if (isBookMove) {
      classification = 'Book';
    }

    // Get facts for the coach
    const facts = FactsEngine.analyze(this.game);

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
      scoreFromWhite: scoreFromWhite,
      isBook: isBookMove,
      openingName: matchedOpeningName,
      facts: facts
    });

    this.currentPlyIndex = this.moveHistory.length;
    this.updateMoveTable();
    this.updateMatchMetrics();
    this.updateCapturedPieces();
    this.updateTimelineProgress();
    this.updateOpeningDisplay();
    this.gameBoard.clearArrows();

    // Check game over
    if (this.checkGameOver()) {
      this.clock.stopTimer();
      return;
    }

    // Coach reaction with LLM support
    const moveResult = {
      san: move.san,
      piece: move.piece,
      isCheck: this.game.inCheck(),
      isCheckmate: this.game.isCheckmate(),
      isCapture: move.captured !== undefined,
      isPlayer: true,
      classification: classification,
      bestMoveSan: bestMoveSan,
      openingName: matchedOpeningName,
      isBook: isBookMove,
      game: this.game,
      facts: facts
    };

    await this.coach.reactToMove(moveResult);

    // AI Turn
    const isAiTurn = (this.playerColor === 'white' && this.game.turn() === 'b') ||
                     (this.playerColor === 'black' && this.game.turn() === 'w');

    if (isAiTurn) {
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
      let bestMoveUci = result.bestMove;

      // Apply blunder chance at low elo
      if (result.blunderChance > 0 && Math.random() < result.blunderChance) {
        const legalMoves = this.game.moves({ verbose: true });
        if (legalMoves.length > 0) {
          const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          bestMoveUci = randomMove.from + randomMove.to + (randomMove.promotion || '');
          console.log(`🤖 Engine blundered! Played random move: ${bestMoveUci}`);
        }
      }

      if (bestMoveUci && this.gameActive) {
        const from = bestMoveUci.substring(0, 2);
        const to = bestMoveUci.substring(2, 4);
        const promotion = bestMoveUci.length > 4 ? bestMoveUci.substring(4, 5) : undefined;

        const moveRes = this.game.move({ from, to, promotion });
        if (moveRes) {
          let aiClassification = 'Good';
          let aiScore = 0;
          let bestAiMoveSan = '';
          
          if (result.multiPV && result.multiPV.length > 0) {
            const bestAiMove = result.multiPV[0];
            bestAiMoveSan = bestAiMove.san;
            const playedAiMove = result.multiPV.find(m => m.moveUci === bestMoveUci);
            
            aiScore = playedAiMove ? playedAiMove.score : (bestAiMove.score - 150);
            const topScore = bestAiMove.score;

            const classRes = MoveClassifier.classifyMove({
              playedUci: bestMoveUci,
              bestUci: bestAiMove.moveUci,
              evalBefore: topScore,
              evalAfter: aiScore,
              isSacrifice: moveRes.captured !== undefined && moveRes.piece !== 'p' && moveRes.captured !== 'p'
            });

            aiClassification = classRes.classification;
            console.log(`🤖 AI Move: ${moveRes.san} | Score: ${aiScore} | Class: ${aiClassification}`);
          }
          
          const scoreFromWhite = moveRes.color === 'w' ? aiScore : -aiScore;

          // Get facts for opponent move
          const facts = FactsEngine.analyze(this.game);

          this.moveHistory.push({
            fen: this.game.fen(),
            san: moveRes.san,
            uci: bestMoveUci,
            from: from,
            to: to,
            color: moveRes.color,
            score: aiScore,
            scoreFromWhite: scoreFromWhite,
            classification: aiClassification,
            bestMoveSan: bestAiMoveSan,
            isBook: false,
            facts: facts
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

          const moveResult = {
            san: moveRes.san,
            piece: moveRes.piece,
            isCheck: this.game.inCheck(),
            isCheckmate: this.game.isCheckmate(),
            isCapture: moveRes.captured !== undefined,
            isPlayer: false,
            classification: aiClassification,
            game: this.game,
            facts: facts
          };

          await this.coach.reactToMove(moveResult);

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
    if (!candidateMoves.length) return;

    const bestScore = candidateMoves[0]?.score ?? 0;
    const arrows = candidateMoves.map((cand) => {
      if (!cand.moveUci) return null;
      const diff = Math.max(0, bestScore - (cand.score ?? 0));
      let brush = 'green';
      let rank = 1;
      if (diff > 80) { brush = 'red'; rank = 4; }
      else if (diff > 35) { brush = 'yellow'; rank = 3; }
      else if (diff > 5) { brush = 'blue'; rank = 2; }

      return {
        from: cand.moveUci.substring(0, 2),
        to: cand.moveUci.substring(2, 4),
        rank: rank,
        brush: brush
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

    const counter = document.getElementById('dd-ply-counter');
    if (counter) counter.textContent = `Move ${plyIndex} / ${this.moveHistory.length}`;

    this.loadBranchCandidates();
    this.renderEvalGraph();
    this.updateDeepDiveCoachReview(plyIndex);
  }

  /**
   * Update Coach Naomi Detailed Move Breakdown & Game Review panel in Deep Dive
   */
  updateDeepDiveCoachReview(plyIndex) {
    const container = document.getElementById('dd-coach-breakdown-content');
    const counterEl = document.getElementById('dd-coach-review-counter');
    if (!container) return;

    if (counterEl) {
      counterEl.textContent = `Showing Move ${plyIndex} of ${this.moveHistory.length}`;
    }

    if (this.moveHistory.length === 0) {
      container.innerHTML = `<div class="text-zinc-500 text-xs p-6 text-center">No game moves recorded yet. Play a game or load saved games to review!</div>`;
      return;
    }

    if (plyIndex === 0) {
      container.innerHTML = `
        <div class="bg-[#0d0d0f] p-4 rounded-xl border border-[#2a2a2e] flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="text-base">👑</span>
            <h4 class="font-bold text-white text-xs uppercase tracking-wider">Coach Naomi's Opening Guidance</h4>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">
            "Welcome to the starting position! Before any moves are played, remember our core principles: control the central squares (e4, d4, e5, d5), develop your Knights before your Bishops, and prepare to castle early to keep your King secure."
          </p>
        </div>
      `;
      return;
    }

    const moveItem = this.moveHistory[plyIndex - 1];
    const classification = moveItem.classification || 'Good';
    const badge = this.getClassificationBadge(classification);
    const san = moveItem.san;
    const bestSan = moveItem.bestMoveSan;
    const isWhite = moveItem.color === 'w';
    const moveNum = Math.ceil(plyIndex / 2);

    let whatYouShouldHaveDone = '';
    if (classification === 'Blunder' || classification === 'Mistake' || classification === 'Inaccuracy') {
      if (bestSan && bestSan !== san) {
        whatYouShouldHaveDone = `Instead of playing <strong>${san}</strong>, you should have played <strong>${bestSan}</strong>. Playing <strong>${bestSan}</strong> avoids the evaluation loss and maintains much stronger control.`;
      } else {
        whatYouShouldHaveDone = `Playing <strong>${san}</strong> resulted in an evaluation drop (${classification.toLowerCase()}). You should have chosen a safer developing move or defended vulnerable squares.`;
      }
    } else if (bestSan && bestSan !== san) {
      whatYouShouldHaveDone = `While <strong>${san}</strong> is playable, Stockfish suggests <strong>${bestSan}</strong> as slightly more accurate for central coordination.`;
    } else {
      whatYouShouldHaveDone = `Playing <strong>${san}</strong> was the absolute top Stockfish recommendation! You executed the most precise line available.`;
    }

    let whatYouMissed = '';
    if (classification === 'Blunder' || classification === 'Mistake') {
      whatYouMissed = `This move overlooked tactical threats or gave away material control. Watch out for hanging pieces, enemy lines of sight, and make sure every piece is adequately defended before advancing.`;
    } else if (classification === 'Inaccuracy') {
      whatYouMissed = `This move was slightly slow. You missed the opportunity to increase active pressure or stake a stronger claim in the center.`;
    } else if (classification === 'Brilliant' || classification === 'Best Move') {
      whatYouMissed = `Fantastic calculation! You didn't miss a beat—this move maximizes your tactical potential and puts maximum pressure on the opponent.`;
    } else {
      whatYouMissed = `Solid positional awareness. Your pieces are developing naturally, maintaining harmonious coordination across the board.`;
    }

    container.innerHTML = `
      <div class="flex flex-col gap-3">
        <div class="bg-[#0d0d0f] p-3 rounded-lg border border-[#2a2a2e] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-blue-400">Move ${moveNum} (${isWhite ? 'White' : 'Black'})</span>
            <span class="text-sm font-bold text-white font-mono px-2 py-0.5 bg-[#16161a] rounded border border-[#2a2a2e]">${san}</span>
          </div>
          <div class="flex items-center gap-2">
            <div>${badge}</div>
            <span class="text-[11px] font-mono text-zinc-400">${moveItem.scoreFromWhite !== undefined ? (moveItem.scoreFromWhite > 0 ? `+${moveItem.scoreFromWhite.toFixed(1)}` : moveItem.scoreFromWhite.toFixed(1)) : '0.0'}</span>
          </div>
        </div>

        <div class="bg-[#0d0d0f] p-3 rounded-lg border border-[#2a2a2e] flex flex-col gap-2.5">
          <div class="flex items-center gap-1.5 border-b border-[#2a2a2e] pb-2">
            <span class="text-sm">👑</span>
            <h4 class="font-bold text-white text-[11px] uppercase tracking-wider">Coach Naomi's Grandmaster Analysis</h4>
          </div>
          
          <div class="flex flex-col gap-2 text-xs text-zinc-300 leading-relaxed">
            <p>
              <strong class="text-blue-400">What you should have done:</strong> ${whatYouShouldHaveDone}
            </p>
            <p>
              <strong class="text-cyan-400">What you missed:</strong> ${whatYouMissed}
            </p>
          </div>
        </div>
      </div>

      <div class="border-t border-[#2a2a2e] pt-2.5 mt-1">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Jump to Move Breakdown:</span>
        <div class="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto pr-1" id="dd-all-moves-nav">
          ${this.moveHistory.map((m, i) => {
            const pNum = i + 1;
            const isSel = pNum === plyIndex;
            return `
              <button onclick="window.app.scrubDeepDiveToPly(${pNum})" class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold cursor-pointer transition-all ${
                isSel 
                  ? 'bg-blue-600 text-white shadow border border-blue-500' 
                  : 'bg-[#0d0d0f] text-zinc-300 border border-[#2a2a2e] hover:bg-[#1f1f23]'
              }">
                ${Math.ceil(pNum/2)}. ${m.san}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
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

    const bestScore = candidateMoves[0]?.score ?? 0;

    const arrows = candidateMoves.map((cand) => {
      if (!cand.moveUci) return null;
      const diff = Math.max(0, bestScore - (cand.score ?? 0));
      let brush = 'green';
      let rank = 1;
      if (diff > 80) { brush = 'red'; rank = 4; }
      else if (diff > 35) { brush = 'yellow'; rank = 3; }
      else if (diff > 5) { brush = 'blue'; rank = 2; }

      return {
        from: cand.moveUci.substring(0, 2),
        to: cand.moveUci.substring(2, 4),
        rank: rank,
        brush: brush
      };
    }).filter(Boolean);

    this.mainLineBoard.setArrows(arrows);

    const tempChess = new Chess(currentFen);
    candidateMoves.forEach((cand, idx) => {
      let sanMove = cand.san;
      if (!sanMove && cand.moveUci) {
        const from = cand.moveUci.substring(0, 2);
        const to = cand.moveUci.substring(2, 4);
        const promotion = cand.moveUci.length > 4 ? cand.moveUci.substring(4, 5) : undefined;
        try {
          const testGame = new Chess(currentFen);
          const m = testGame.move({ from, to, promotion });
          if (m) sanMove = m.san;
        } catch (err) {}
      }
      if (!sanMove) sanMove = cand.moveUci;

      const diff = Math.max(0, bestScore - (cand.score ?? 0));
      let rank = 1;
      let tag = 'Best Move';
      let tagBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      let borderStyle = 'border-emerald-500/30';
      let evalColor = 'text-emerald-400';
      let ringColor = 'ring-emerald-500';
      let rankBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      let arrowDot = 'bg-emerald-500';

      if (diff > 80) {
        rank = 4;
        tag = 'Suboptimal';
        tagBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        borderStyle = 'border-rose-500/30';
        evalColor = 'text-rose-400';
        ringColor = 'ring-rose-500';
        rankBadge = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
        arrowDot = 'bg-rose-500';
      } else if (diff > 35) {
        rank = 3;
        tag = 'Alternative';
        tagBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        borderStyle = 'border-amber-500/30';
        evalColor = 'text-amber-400';
        ringColor = 'ring-amber-500';
        rankBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
        arrowDot = 'bg-amber-500';
      } else if (diff > 5) {
        rank = 2;
        tag = 'Excellent';
        tagBg = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        borderStyle = 'border-blue-500/30';
        evalColor = 'text-blue-400';
        ringColor = 'ring-blue-500';
        rankBadge = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
        arrowDot = 'bg-blue-500';
      }

      const isSelected = this.selectedBranchMove === cand.moveUci;
      const div = document.createElement('div');
      div.className = `branch-item flex items-center justify-between p-2.5 px-3 rounded-lg bg-[#0d0d0f] border ${borderStyle} hover:border-blue-500/50 cursor-pointer shadow transition-all ${
        isSelected ? `ring-2 ${ringColor} bg-[#16161a]` : ''
      }`;

      div.innerHTML = `
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full ${arrowDot} shrink-0 shadow-sm" title="Board Arrow Color"></span>
            <span class="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs border ${rankBadge}">${rank}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm font-mono">${sanMove}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded border ${tagBg}">${tag}</span>
          </div>
        </div>
        <span class="font-mono text-xs font-semibold ${evalColor}">${cand.evalStr}</span>
      `;

      div.addEventListener('click', () => {
        this.selectedBranchMove = cand.moveUci;
        document.querySelectorAll('.branch-item').forEach(el => {
          el.classList.remove('ring-2', 'ring-emerald-500', 'ring-blue-500', 'ring-amber-500', 'ring-rose-500', 'bg-[#16161a]');
        });
        div.classList.add('ring-2', ringColor, 'bg-[#16161a]');

        this.generateBranchContinuation(cand.moveUci);
      });

      branchContainer.appendChild(div);
    });

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

    const plyLabel = document.getElementById('branch-ply-label');
    if (plyLabel) {
      plyLabel.textContent = `Ply ${plyIndex + 1} / ${this.continuationLine.length} (${plyItem.moveSan})`;
    }

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

    if (this.game.isCheckmate()) {
      const loserIsWhite = this.game.turn() === 'w';
      const whiteWinProbMate = loserIsWhite ? 0 : 100;
      const mateEvalStr = loserIsWhite ? '-#0' : '+#0';

      const winProbVal = document.getElementById('win-prob-val');
      const winProbBar = document.getElementById('win-prob-bar');
      const displayWinProbMate = this.playerColor === 'black' ? (100 - whiteWinProbMate) : whiteWinProbMate;
      if (winProbVal) winProbVal.textContent = `${displayWinProbMate.toFixed(1)}%`;
      if (winProbBar) winProbBar.style.width = `${displayWinProbMate}%`;

      const evalScoreText = document.getElementById('eval-score-text');
      const evalBarWhite = document.getElementById('eval-bar-white');
      const evalBarBlack = document.getElementById('eval-bar-black');
      if (evalScoreText) evalScoreText.textContent = mateEvalStr;
      if (evalBarWhite && evalBarBlack) {
        evalBarWhite.style.width = `${whiteWinProbMate}%`;
        evalBarBlack.style.width = `${100 - whiteWinProbMate}%`;
      }

      const bestAccValMate = document.getElementById('best-acc-val');
      if (bestAccValMate) {
        if (this.playerAccuracyScores.length > 0) {
          const avgAccMate = Math.round(this.playerAccuracyScores.reduce((a, b) => a + b, 0) / this.playerAccuracyScores.length);
          bestAccValMate.textContent = `${avgAccMate}%`;
        } else {
          bestAccValMate.textContent = '100%';
        }
      }
      return;
    }

    const candidateMoves = await this.engine.analyzePosition(fen, 3);
    let topScore = 0;
    let evalStr = '0.00';

    if (candidateMoves && candidateMoves.length > 0) {
      topScore = candidateMoves[0].score || 0;
      evalStr = candidateMoves[0].evalStr || '0.00';

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

    const turnMultiplier = this.game.turn() === 'w' ? 1 : -1;
    const scoreFromWhite = topScore * turnMultiplier;

    let whiteWinProb = 100 / (1 + Math.exp(-0.004 * scoreFromWhite));
    whiteWinProb = Math.min(99, Math.max(1, Math.round(whiteWinProb * 10) / 10));

    const winProbVal = document.getElementById('win-prob-val');
    const winProbBar = document.getElementById('win-prob-bar');

    const displayWinProb = this.playerColor === 'black' ? (100 - whiteWinProb).toFixed(1) : whiteWinProb.toFixed(1);

    if (winProbVal) winProbVal.textContent = `${displayWinProb}%`;
    if (winProbBar) winProbBar.style.width = `${displayWinProb}%`;

    const evalScoreText = document.getElementById('eval-score-text');
    const evalBarWhite = document.getElementById('eval-bar-white');
    const evalBarBlack = document.getElementById('eval-bar-black');

    if (evalScoreText) evalScoreText.textContent = evalStr;
    if (evalBarWhite && evalBarBlack) {
      evalBarWhite.style.width = `${whiteWinProb}%`;
      evalBarBlack.style.width = `${100 - whiteWinProb}%`;
    }

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

    let capturedWhiteHtml = '';
    Object.keys(initialCounts).forEach(type => {
      const missing = initialCounts[type] - currentCounts['w'][type];
      const pieceKey = 'w' + type.toUpperCase();
      for (let i = 0; i < missing; i++) {
        capturedWhiteHtml += `<div class="w-5 h-5 inline-block hover:scale-125 transition-transform cursor-default" title="Captured White ${type.toUpperCase()}">${getPieceSvg(pieceKey, this.settings.pieceStyle || 'cburnett')}</div>`;
      }
    });

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
   * Opening Book Explorer UI Handling
   */
  initOpeningExplorerUI() {
    const sideFilter = document.getElementById('opening-side-filter');
    if (sideFilter) {
      sideFilter.addEventListener('change', () => {
        this.renderOpeningDropdown();
        this.renderOpeningExplorer();
      });
    }
    
    const select = document.getElementById('opening-select-dropdown');
    if (select) {
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        const idx = OPENINGS_DATABASE.findIndex(op => op.id === val);
        if (idx !== -1) {
          this.openingIndex = idx;
          this.openingPly = 0;
          this.userFlippedOpeningBoard = false;
        }
        this.renderOpeningExplorer();
      });
    }

    this.renderOpeningDropdown();
    this.renderOpeningExplorer();
  }

  renderOpeningDropdown() {
    const select = document.getElementById('opening-select-dropdown');
    const sideFilter = document.getElementById('opening-side-filter');
    if (!select) return;
    
    let selectedSide = sideFilter ? sideFilter.value : 'white';
    if (selectedSide !== 'white' && selectedSide !== 'black') {
      selectedSide = 'white';
      if (sideFilter) sideFilter.value = 'white';
    }

    const mastered = JSON.parse(localStorage.getItem('hikari_mastered_openings') || '[]');
    const filteredOpenings = OPENINGS_DATABASE.filter(op => op.side === selectedSide);
    
    if (filteredOpenings.length === 0) {
      select.innerHTML = '<option value="">No openings found</option>';
      return;
    }

    const beginnerGroup = filteredOpenings.filter(op => op.tier === 'Beginner Core');
    const intermediateGroup = filteredOpenings.filter(op => op.tier !== 'Beginner Core');

    const formatOption = (op) => {
      const isMastered = mastered.includes(op.id);
      return `<option value="${op.id}">${isMastered ? '⭐ ' : ''}${op.eco} — ${op.name}</option>`;
    };

    let optionsHtml = '';
    if (beginnerGroup.length > 0) {
      optionsHtml += `<optgroup label="🌱 Beginner Core Repertoire">`;
      optionsHtml += beginnerGroup.map(formatOption).join('');
      optionsHtml += `</optgroup>`;
    }
    if (intermediateGroup.length > 0) {
      optionsHtml += `<optgroup label="🚀 Intermediate / Advanced">`;
      optionsHtml += intermediateGroup.map(formatOption).join('');
      optionsHtml += `</optgroup>`;
    }

    select.innerHTML = optionsHtml;
    
    const currentOp = OPENINGS_DATABASE[this.openingIndex];
    if (currentOp && currentOp.side === selectedSide) {
      select.value = currentOp.id;
    } else {
      const firstIdx = OPENINGS_DATABASE.findIndex(op => op.id === filteredOpenings[0].id);
      this.openingIndex = firstIdx !== -1 ? firstIdx : 0;
      this.openingPly = 0;
      this.userFlippedOpeningBoard = false;
      select.value = filteredOpenings[0].id;
    }
  }

  renderOpeningExplorer() {
    const ecoBadge = document.getElementById('opening-eco-badge');
    const sideBadge = document.getElementById('opening-side-badge');
    const tierBadge = document.getElementById('opening-tier-badge');
    const diffBadge = document.getElementById('opening-difficulty-badge');
    const titleHeader = document.getElementById('opening-title-header');
    const descText = document.getElementById('opening-desc-text');
    const plyCounter = document.getElementById('opening-ply-counter');
    const stepperChips = document.getElementById('opening-stepper-chips');
    const theoryText = document.getElementById('opening-theory-text');
    const keyIdeasUl = document.getElementById('opening-key-ideas');
    const plansContainer = document.getElementById('opening-plans-container');
    const whatIfContainer = document.getElementById('opening-whatif-container');
    const trapsContainer = document.getElementById('opening-traps-container');
    const commentaryEl = document.getElementById('opening-move-commentary');
    const evalBadge = document.getElementById('opening-move-eval-badge');
    const candContainer = document.getElementById('opening-candidates-container');

    if (this.openingIndex < 0 || this.openingIndex >= OPENINGS_DATABASE.length) {
      this.openingIndex = 0;
    }

    const op = OPENINGS_DATABASE[this.openingIndex] || OPENINGS_DATABASE[0];

    const masteredBtn = document.getElementById('opening-btn-mastered');
    const masteredLabel = document.getElementById('opening-mastered-label');
    const masteredStar = document.getElementById('opening-mastered-star');
    const masteredList = JSON.parse(localStorage.getItem('hikari_mastered_openings') || '[]');
    const isMastered = masteredList.includes(op.id);

    if (masteredBtn && masteredLabel) {
      if (isMastered) {
        masteredBtn.className = 'px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm';
        masteredLabel.textContent = 'Mastered Repertoire!';
        if (masteredStar) masteredStar.textContent = '⭐';
      } else {
        masteredBtn.className = 'px-3 py-1.5 rounded-lg bg-[#0d0d0f] hover:bg-amber-500/10 text-zinc-400 hover:text-amber-300 border border-[#2a2a2e] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm';
        masteredLabel.textContent = 'Mark Mastered';
        if (masteredStar) masteredStar.textContent = '☆';
      }
    }

    if (ecoBadge) ecoBadge.textContent = op.eco;
    if (tierBadge) {
      tierBadge.textContent = op.tier || 'Beginner Core';
      tierBadge.className = op.tier === 'Beginner Core'
        ? 'px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30'
        : 'px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30';
    }
    if (sideBadge) {
      sideBadge.textContent = op.side === 'black' ? 'Black Opening' : 'White Opening';
      sideBadge.className = op.side === 'black' 
        ? 'px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-500/30'
        : 'px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-xs border border-blue-500/30';
    }
    if (diffBadge) diffBadge.textContent = op.difficulty || 'Grandmaster';
    if (titleHeader) titleHeader.textContent = op.name;
    if (descText) descText.textContent = op.description;
    if (plyCounter) plyCounter.textContent = `Ply ${this.openingPly} / ${op.moves.length}`;

    // Render Move Stepper Chips
    if (stepperChips) {
      let chipsHtml = `
        <button class="opening-chip px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
          this.openingPly === 0 ? 'bg-blue-600 text-white shadow' : 'bg-[#1f1f23] text-zinc-300 hover:bg-[#2a2a30]'
        }" data-ply="0">Start</button>
      `;

      for (let i = 0; i < op.moves.length; i++) {
        const isCurrent = (this.openingPly === i + 1);
        const moveNum = Math.floor(i / 2) + 1;
        const prefix = (i % 2 === 0) ? `${moveNum}. ` : '';
        chipsHtml += `
          <button class="opening-chip px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
            isCurrent ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400' : 'bg-[#1f1f23] text-zinc-300 hover:bg-[#2a2a30]'
          }" data-ply="${i + 1}">${prefix}${op.moves[i]}</button>
        `;
      }
      stepperChips.innerHTML = chipsHtml;
    }

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
      this.openingBoard.setInteractive(false);

      if (!this.userFlippedOpeningBoard && this.openingPly === 0) {
        this.openingBoard.setOrientation(op.side === 'black' ? 'black' : 'white');
      }

      if (lastFrom && lastTo) {
        this.openingBoard.setLastMove(lastFrom, lastTo);
      } else {
        this.openingBoard.setLastMove(null, null);
      }
      this.openingBoard.renderBoard();

      if (this.openingPly < op.moves.length) {
        try {
          const nextSan = op.moves[this.openingPly];
          const testGame = new Chess(this.openingGame.fen());
          const testMove = testGame.move(nextSan);
          if (testMove) {
            this.openingBoard.setArrows([
              { from: testMove.from, to: testMove.to, rank: 1, brush: 'green' }
            ]);
          }
        } catch (err) {
          console.warn('Arrow generation error:', err);
        }
      }
    }

    // Theory & Key Ideas
    if (theoryText) theoryText.textContent = op.theoryOverview || op.description;
    if (keyIdeasUl) {
      keyIdeasUl.innerHTML = op.keyIdeas.map(idea => `<li class="leading-relaxed">${idea}</li>`).join('');
    }

    // Strategic Plans Panel
    if (plansContainer) {
      if (!op.keyPlans || op.keyPlans.length === 0) {
        plansContainer.innerHTML = '<div class="text-xs text-zinc-500 italic p-2">Standard development plans apply.</div>';
      } else {
        plansContainer.innerHTML = op.keyPlans.map(plan => `
          <div class="bg-[#0d0d0f] p-3.5 rounded-xl border border-[#2a2a2e] flex flex-col gap-2 hover:border-blue-500/40 transition-colors">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-blue-400 text-xs">${plan.title}</span>
              <span class="text-[10px] font-mono font-bold text-zinc-400 px-2 py-0.5 rounded bg-[#1f1f23] border border-[#2a2a2e]">Target: ${plan.target}</span>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed">${plan.description}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-1">
              <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Key Moves:</span>
              ${plan.recommendedMoves.map(m => `<span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[11px] font-bold border border-blue-500/20">${m}</span>`).join('')}
            </div>
          </div>
        `).join('');
      }
    }

    // "What If..." Contingency Scenarios Panel
    if (whatIfContainer) {
      if (!op.whatIfScenarios || op.whatIfScenarios.length === 0) {
        whatIfContainer.innerHTML = '<div class="text-xs text-zinc-500 italic p-2">Standard theoretical responses apply.</div>';
      } else {
        whatIfContainer.innerHTML = op.whatIfScenarios.map((sc, idx) => `
          <div class="bg-[#0d0d0f] p-3.5 rounded-xl border border-[#2a2a2e] flex flex-col gap-2 hover:border-amber-500/40 transition-colors">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-amber-400 text-xs">${sc.title}</span>
              <span class="text-[10px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">Scenario #${idx + 1}</span>
            </div>
            <div class="text-[11px] text-zinc-400 font-semibold bg-[#16161a] p-2 rounded border border-[#2a2a2e]">
              ⚡ <span class="text-zinc-200">Trigger:</span> ${sc.trigger}
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed"><span class="font-bold text-emerald-400">Winning Strategy:</span> ${sc.strategy}</p>
            <div class="p-2 bg-amber-950/20 rounded border border-amber-800/30 text-xs text-amber-200/90 leading-relaxed">
              💡 <span class="font-bold text-amber-300">Coach Naomi Advice:</span> ${sc.advice}
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-1">
              <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Counter Moves:</span>
              ${sc.counterMoves.map(m => `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/20">${m}</span>`).join('')}
            </div>
          </div>
        `).join('');
      }
    }

    // Traps & Common Mistakes Panel
    if (trapsContainer) {
      if (!op.commonTrapsAndMistakes || op.commonTrapsAndMistakes.length === 0) {
        trapsContainer.innerHTML = '<div class="text-xs text-zinc-500 italic p-3">No sharp immediate traps known for this solid variation. Focus on principled central development.</div>';
      } else {
        trapsContainer.innerHTML = op.commonTrapsAndMistakes.map(t => `
          <div class="bg-[#0d0d0f] p-3.5 rounded-xl border border-red-900/30 flex flex-col gap-2 hover:border-red-500/50 transition-colors">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-red-400 text-xs flex items-center gap-1.5">⚠️ ${t.trapName}</span>
              <span class="text-[10px] font-mono font-bold text-red-300 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">Critical Trap</span>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed"><span class="font-bold text-zinc-200">The Danger:</span> ${t.description}</p>
            <div class="p-2.5 bg-red-950/30 rounded-lg border border-red-800/40 text-xs text-red-200/90 leading-relaxed flex items-start gap-1.5">
              <span>🎯</span>
              <div>
                <span class="font-bold text-red-300 block">How to punish or avoid:</span>
                ${t.punishment}
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Move Breakdown Panel
    if (commentaryEl) {
      if (this.openingPly === 0) {
        commentaryEl.innerHTML = `
          <p class="text-zinc-300">Starting position. Step forward or click any move chip in the sequence above to explore move-by-move annotations and GM candidate stats.</p>
        `;
        if (evalBadge) evalBadge.textContent = '0.00';
      } else {
        const comm = op.moveCommentary.find(c => c.ply === this.openingPly);
        if (comm) {
          if (evalBadge) evalBadge.textContent = comm.evalStr || '+0.20';
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
          if (evalBadge) evalBadge.textContent = '+0.20';
          commentaryEl.innerHTML = `<p class="text-zinc-300">Move ${this.openingPly}: Continuation line in ${op.name}. Maintain active development!</p>`;
        }
      }
    }

    // Candidate Move Cards
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

  updateOpeningDisplay() {
    const sanHistory = this.moveHistory.map(m => m.san);
    const info = OpeningExplorer.identifyOpening(sanHistory);

    const liveLabel = document.getElementById('live-opening-label');
    if (liveLabel) {
      if (info) {
        liveLabel.textContent = `${info.eco} — ${info.name}`;
      } else if (this.moveHistory.length === 0) {
        liveLabel.textContent = 'Standard Starting Position';
      } else {
        liveLabel.textContent = 'Custom Position';
      }
    }
  }

  /**
   * Render Centipawn Evaluation SVG Line Graph & Classification Badges Summary
   */
  renderEvalGraph() {
    const svg = document.getElementById('eval-graph-svg');
    if (!svg) return;

    this.moveClassCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

    const evals = [0];
    let lastCp = 0;

    this.moveHistory.forEach((m, idx) => {
      let cp = lastCp;
      if (m.scoreFromWhite !== undefined && m.scoreFromWhite !== null) {
        cp = m.scoreFromWhite;
      } else {
        const wave = (Math.sin(idx * 0.8) * 50) + ((idx % 3 === 0) ? 40 : -20);
        cp = lastCp + Math.round(wave);
        cp = Math.max(-1000, Math.min(1000, cp));
      }
      lastCp = cp;
      evals.push(cp);

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
        this.moveClassCounts.best++;
      }
    });

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

    const width = 600;
    const height = 40;
    const midY = height / 2;
    const maxCp = 1500;

    const points = evals.map((cp, idx) => {
      const x = (idx / Math.max(1, evals.length - 1)) * width;
      const clamped = Math.max(-maxCp, Math.min(maxCp, cp));
      const norm = clamped / maxCp;
      const compressed = Math.sign(norm) * Math.pow(Math.abs(norm), 0.75);
      const y = midY + compressed * (midY - 3);
      return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), cp, ply: idx };
    });

    const pathD = `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ');
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' L ');

    const blackAreaD = `M 0,0 L 0,${points[0].y} L ${pointsStr} L ${width},${points[points.length - 1].y} L ${width},0 Z`;
    const whiteAreaD = `M 0,${height} L 0,${points[0].y} L ${pointsStr} L ${width},${points[points.length - 1].y} L ${width},${height} Z`;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `
      <path d="${blackAreaD}" fill="#18181b" opacity="0.95"/>
      <path d="${whiteAreaD}" fill="#f4f4f5" opacity="0.95"/>
      <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${points.map(p => {
        const isActive = p.ply === this.deepDivePly;
        if (isActive) {
          return `
            <circle cx="${p.x}" cy="${p.y}" r="6" fill="#38bdf8" fill-opacity="0.3" class="animate-ping"/>
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" class="cursor-pointer eval-point" data-ply="${p.ply}"/>
          `;
        }
        return `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${p.cp >= 0 ? '#10b981' : '#f43f5e'}" stroke="#0d0d0f" stroke-width="1" class="cursor-pointer hover:r-4 transition-all eval-point" data-ply="${p.ply}"/>`;
      }).join('')}
    `;

    svg.onclick = (evt) => {
      const pointEl = evt.target.closest('.eval-point');
      if (pointEl && pointEl.dataset.ply !== undefined) {
        const targetPly = parseInt(pointEl.dataset.ply, 10);
        if (!isNaN(targetPly)) {
          this.scrubDeepDiveToPly(targetPly);
        }
      }
    };
  }
}

// Bootstrap application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.hikariApp = new VanguardChessApp();
});

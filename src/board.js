/**
 * Hikari Chess Coach - Interactive Board Component
 * Renders an interactive chessboard with realistic Staunton vector piece SVGs, customizable board themes,
 * drag & drop, legal move dots, last move highlights, and best-move colored arrows overlay.
 */

// Board Color Palettes (Official Lichess Chessground & Classic Themes)
export const BOARD_THEMES = {
  wood: {
    name: 'Lichess Maple Wood',
    light: '#f0d9b5',
    dark: '#b58863',
    lightText: '#b58863',
    darkText: '#f0d9b5',
    wrapperBg: 'bg-[#2b1810]',
    borderColor: '#42281d'
  },
  emerald: {
    name: 'Lichess Tournament Green',
    light: '#ebecd0',
    dark: '#779556',
    lightText: '#779556',
    darkText: '#ebecd0',
    wrapperBg: 'bg-[#1a1a1e]',
    borderColor: '#2a2a2e'
  },
  blue: {
    name: 'Lichess Midnight Blue',
    light: '#eae9d2',
    dark: '#4b7399',
    lightText: '#4b7399',
    darkText: '#eae9d2',
    wrapperBg: 'bg-[#131b2e]',
    borderColor: '#1e293b'
  },
  ic: {
    name: 'Lichess IC Grey-Blue',
    light: '#dee3e6',
    dark: '#8ca2ad',
    lightText: '#8ca2ad',
    darkText: '#dee3e6',
    wrapperBg: 'bg-[#182026]',
    borderColor: '#2a3b47'
  },
  purple: {
    name: 'Lichess Purple',
    light: '#f2e8f7',
    dark: '#7d4891',
    lightText: '#7d4891',
    darkText: '#f2e8f7',
    wrapperBg: 'bg-[#1e0f29]',
    borderColor: '#431f5c'
  },
  slate: {
    name: 'Lichess Slate',
    light: '#e2e8f0',
    dark: '#475569',
    lightText: '#475569',
    darkText: '#e2e8f0',
    wrapperBg: 'bg-[#0f172a]',
    borderColor: '#334155'
  },
  pink: {
    name: 'Pink & White',
    light: '#ffffff',
    dark: '#fbcfe8',
    lightText: '#fbcfe8',
    darkText: '#ffffff',
    wrapperBg: 'bg-[#2c0a1f]',
    borderColor: '#fbcfe8'
  },
  coral: {
    name: 'Coral & Sand',
    light: '#f2e6d9',
    dark: '#cd5c5c',
    lightText: '#cd5c5c',
    darkText: '#f2e6d9',
    wrapperBg: 'bg-[#2a0e0e]',
    borderColor: '#cd5c5c'
  }
};

export const UNICODE_PIECES = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

/**
 * Official Lichess Cburnett Vector Pieces (Clean, high-performance inline SVGs)
 */
export const CBURNETT_SVGS = {
  wP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><path d="M 22.5,9 C 19.8,9 17.7,11.1 17.7,13.8 C 17.7,15.7 18.8,17.3 20.4,18 C 18.2,18.9 16.5,21 16.5,23.5 C 16.5,24.1 16.6,24.7 16.8,25.3 C 14.3,26.7 12.5,29.3 12.5,32.5 L 32.5,32.5 C 32.5,29.3 30.7,26.7 28.2,25.3 C 28.4,24.7 28.5,24.1 28.5,23.5 C 28.5,21 26.8,18.9 24.6,18 C 26.2,17.3 27.3,15.7 27.3,13.8 C 27.3,11.1 25.2,9 22.5,9 z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/><path d="M 12.5,32.5 L 32.5,32.5 L 32.5,36 L 12.5,36 z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  wN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 32.5,11 38.5,18 31,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 21,18 21,18 C 19,20 18,21 15,20 C 13,19.5 13,17.5 14,16.5 C 15,15.5 15,14 13.5,14 C 12,14 11,15.5 10.5,18 C 10,20.5 8,20.5 8,20.5 C 8,20.5 9,18 9.5,17 C 10,16 9.5,14.5 9.5,14.5 C 9.5,14.5 11.5,12 15,11 C 18.5,10 22,10 22,10 z" fill="#ffffff"/><path d="M 9.5,25.5 C 10.5,24.5 12,24.5 13,25.5" stroke="#000000"/><circle cx="15" cy="15.5" r="1.2" fill="#000000"/></g></svg>`,

  wB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#ffffff"><path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,23 27.5,18 C 25,13 24.5,10 22.5,10 C 20.5,10 20,13 17.5,18 C 15,23 14.5,30.5 15,32 z"/><circle cx="22.5" cy="8" r="2.5"/></g><path d="M 17.5,26 L 27.5,26"/><path d="M 22.5,21 L 22.5,31"/><path d="M 20,13.5 L 25,13.5"/></g></svg>`,

  wR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="#ffffff" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 14,29.5 L 14,17 L 11,14 z"/><path d="M 12,14 L 33,14"/><path d="M 14,29.5 L 31,29.5"/></g></svg>`,

  wQ: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="#ffffff" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,32 12.5,34.5 12,36 L 33,36 C 32.5,34.5 32.5,32 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/><path d="M 11.5,30 L 33.5,30"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="6" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,

  wK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8"/><g fill="#ffffff"><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z"/><path d="M 11.5,37 C 17,35.5 28,35.5 33.5,37 C 34.5,33.5 35.5,25 35.5,23 C 24,20 21,20 9.5,23 C 9.5,25 10.5,33.5 11.5,37 z"/><path d="M 11.5,30 C 17,29 28,29 33.5,30"/><path d="M 11.5,33.5 C 17,32.5 28,32.5 33.5,33.5"/></g></g></svg>`,

  bP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><path d="M 22.5,9 C 19.8,9 17.7,11.1 17.7,13.8 C 17.7,15.7 18.8,17.3 20.4,18 C 18.2,18.9 16.5,21 16.5,23.5 C 16.5,24.1 16.6,24.7 16.8,25.3 C 14.3,26.7 12.5,29.3 12.5,32.5 L 32.5,32.5 C 32.5,29.3 30.7,26.7 28.2,25.3 C 28.4,24.7 28.5,24.1 28.5,23.5 C 28.5,21 26.8,18.9 24.6,18 C 26.2,17.3 27.3,15.7 27.3,13.8 C 27.3,11.1 25.2,9 22.5,9 z" fill="#000000" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/><path d="M 12.5,32.5 L 32.5,32.5 L 32.5,36 L 12.5,36 z" fill="#000000" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  bN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 32.5,11 38.5,18 31,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 21,18 21,18 C 19,20 18,21 15,20 C 13,19.5 13,17.5 14,16.5 C 15,15.5 15,14 13.5,14 C 12,14 11,15.5 10.5,18 C 10,20.5 8,20.5 8,20.5 C 8,20.5 9,18 9.5,17 C 10,16 9.5,14.5 9.5,14.5 C 9.5,14.5 11.5,12 15,11 C 18.5,10 22,10 22,10 z" fill="#000000"/><path d="M 9.5,25.5 C 10.5,24.5 12,24.5 13,25.5" stroke="#ffffff"/><circle cx="15" cy="15.5" r="1.2" fill="#ffffff"/></g></svg>`,

  bB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#000000"><path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,23 27.5,18 C 25,13 24.5,10 22.5,10 C 20.5,10 20,13 17.5,18 C 15,23 14.5,30.5 15,32 z"/><circle cx="22.5" cy="8" r="2.5"/></g><path d="M 17.5,26 L 27.5,26" stroke="#ffffff"/><path d="M 22.5,21 L 22.5,31" stroke="#ffffff"/><path d="M 20,13.5 L 25,13.5" stroke="#ffffff"/></g></svg>`,

  bR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="#000000" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 14,29.5 L 14,17 L 11,14 z"/><path d="M 12,14 L 33,14" stroke="#ffffff"/><path d="M 14,29.5 L 31,29.5" stroke="#ffffff"/></g></svg>`,

  bQ: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="#000000" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,32 12.5,34.5 12,36 L 33,36 C 32.5,34.5 32.5,32 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/><path d="M 11.5,30 L 33.5,30" stroke="#ffffff"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="6" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,

  bK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" class="w-full h-full pointer-events-none select-none"><g fill="none" fill-rule="evenodd" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke="#ffffff"/><g fill="#000000"><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z"/><path d="M 11.5,37 C 17,35.5 28,35.5 33.5,37 C 34.5,33.5 35.5,25 35.5,23 C 24,20 21,20 9.5,23 C 9.5,25 10.5,33.5 11.5,37 z"/><path d="M 11.5,30 C 17,29 28,29 33.5,30" stroke="#ffffff"/><path d="M 11.5,33.5 C 17,32.5 28,32.5 33.5,33.5" stroke="#ffffff"/></g></g></svg>`
};

/**
 * Returns Piece SVG or image markup based on selected piece set
 */
export function getPieceSvg(pieceKey, style = 'cburnett') {
  if (style === 'unicode') {
    const color = pieceKey[0]; // 'w' or 'b'
    const type = pieceKey[1].toLowerCase(); // 'p', 'n', 'b', 'r', 'q', 'k'
    const symbol = UNICODE_PIECES[color]?.[type] || '';
    const textColor = color === 'w' ? '#ffffff' : '#000000';
    return `<span class="piece-unicode inline-block text-center leading-none select-none font-bold text-3xl sm:text-4xl md:text-5xl" style="color: ${textColor};">${symbol}</span>`;
  }

  // Official Lichess Chessground piece sets
  if (style === 'cburnett') {
    return CBURNETT_SVGS[pieceKey] || `<img src="https://lichess1.org/assets/piece/cburnett/${pieceKey}.svg" class="w-full h-full select-none pointer-events-none" alt="${pieceKey}" draggable="false" />`;
  }

  const lichessSet = ['merida', 'alpha', 'staunty', 'california', 'maestro', 'dubrovny', 'fresca', 'cardinal'].includes(style)
    ? style
    : 'cburnett';

  return `<img src="https://lichess1.org/assets/piece/${lichessSet}/${pieceKey}.svg" class="w-full h-full select-none pointer-events-none" alt="${pieceKey}" draggable="false" />`;
}

export class ChessBoardUI {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.orientation = options.orientation || 'white';
    this.interactive = options.interactive !== false;
    this.onMoveCallback = options.onMove || null;
    this.boardTheme = options.boardTheme || 'wood';
    this.pieceStyle = options.pieceStyle || 'staunton3d';

    this.selectedSquare = null;
    this.legalMoves = [];
    this.lastMove = null; // { from: 'e2', to: 'e4' }
    this.lastMoveBadge = null; // { square: 'e4', type: 'brilliant', text: '‼️' }
    this.arrows = []; // array of { from, to, color, rank }
    this.userArrows = []; // array of { from, to, color }
    this.userHighlights = new Set(); // Set of square names 'e4'
    this.rightClickStartSquare = null;
    this.chessGame = options.chessGame || null;

    this.draggedSquare = null;

    this.initDOM();
  }

  setLastMoveBadge(square, type, icon) {
    this.lastMoveBadge = square ? { square, type, icon } : null;
    this.renderBoard();
  }

  initDOM() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div id="board-wrapper-element" class="board-wrapper relative aspect-square w-full max-w-[540px] mx-auto select-none rounded-lg overflow-hidden shadow-2xl border transition-all duration-300">
        <div class="board-grid grid grid-cols-8 grid-rows-8 w-full h-full border border-black/50"></div>
        <svg class="board-arrows-overlay absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <marker id="arrow-rank-1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-rank-2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker id="arrow-rank-3" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>
          <g id="arrows-group"></g>
        </svg>
      </div>
    `;

    this.wrapperElement = this.container.querySelector('#board-wrapper-element');
    this.gridElement = this.container.querySelector('.board-grid');
    this.arrowsGroup = this.container.querySelector('#arrows-group');

    this.applyWrapperStyle();
    this.renderBoard();
  }

  setChessGame(game) {
    this.chessGame = game;
    this.selectedSquare = null;
    this.legalMoves = [];
    this.renderBoard();
  }

  setOrientation(color) {
    this.orientation = color;
    this.renderBoard();
    this.renderArrows();
  }

  setBoardTheme(themeName) {
    if (BOARD_THEMES[themeName]) {
      this.boardTheme = themeName;
      this.applyWrapperStyle();
      this.renderBoard();
    }
  }

  setPieceStyle(styleName) {
    this.pieceStyle = styleName;
    this.renderBoard();
  }

  applyWrapperStyle() {
    if (!this.wrapperElement) return;
    const theme = BOARD_THEMES[this.boardTheme] || BOARD_THEMES.wood;
    this.wrapperElement.className = `board-wrapper relative aspect-square w-full max-w-[540px] mx-auto select-none rounded-lg overflow-hidden shadow-2xl border transition-all duration-300 ${theme.wrapperBg}`;
    this.wrapperElement.style.borderColor = theme.borderColor;
  }

  setInteractive(flag) {
    this.interactive = flag;
  }

  setLastMove(from, to) {
    this.lastMove = from && to ? { from, to } : null;
    this.renderBoard();
  }

  setArrows(arrows) {
    this.arrows = arrows || [];
    this.renderArrows();
  }

  clearArrows() {
    this.arrows = [];
    if (this.arrowsGroup) this.arrowsGroup.innerHTML = '';
  }

  /**
   * Render 64 squares with pieces and highlights based on selected board theme
   */
  renderBoard() {
    if (!this.gridElement || !this.chessGame) return;

    this.gridElement.innerHTML = '';
    const boardState = this.chessGame.board();
    const isWhiteOriented = this.orientation === 'white';

    const theme = BOARD_THEMES[this.boardTheme] || BOARD_THEMES.wood;

    let kingSquare = null;
    let checkers = [];
    try {
      if (this.chessGame.inCheck()) {
        const turn = this.chessGame.turn();
        for (let r_ = 0; r_ < 8; r_++) {
          for (let c_ = 0; c_ < 8; c_++) {
            const p = boardState[r_][c_];
            if (p && p.type === 'k' && p.color === turn) {
              kingSquare = String.fromCharCode(97 + c_) + (8 - r_);
              break;
            }
          }
          if (kingSquare) break;
        }

        if (typeof this.chessGame.checkers === 'function') {
          checkers = this.chessGame.checkers();
        } else if (typeof this.chessGame.getCheckers === 'function') {
          checkers = this.chessGame.getCheckers();
        }
      }
    } catch (err) {
      console.warn('Error identifying check states:', err);
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const row = isWhiteOriented ? r : 7 - r;
        const col = isWhiteOriented ? c : 7 - c;

        const squareName = String.fromCharCode(97 + col) + (8 - row);
        const isDark = (row + col) % 2 === 1;

        const squareDiv = document.createElement('div');
        squareDiv.dataset.square = squareName;
        squareDiv.className = `square relative flex items-center justify-center w-full h-full cursor-pointer transition-colors duration-150`;
        squareDiv.style.backgroundColor = isDark ? theme.dark : theme.light;

        // Last move highlight
        if (this.lastMove && (this.lastMove.from === squareName || this.lastMove.to === squareName)) {
          squareDiv.classList.add('ring-2', 'ring-blue-400', 'z-10');
          squareDiv.style.backgroundColor = isDark ? '#3b82f6aa' : '#60a5faaa';
        }

        // Check outlines
        if (squareName === kingSquare) {
          squareDiv.classList.add('ring-4', 'ring-red-500', 'ring-offset-2', 'z-10', 'animate-pulse');
          squareDiv.style.backgroundColor = isDark ? '#ef4444aa' : '#f87171aa';
        } else if (checkers.includes(squareName)) {
          squareDiv.classList.add('ring-2', 'ring-orange-500', 'z-10', 'animate-pulse');
          squareDiv.style.backgroundColor = isDark ? '#f9731688' : '#fb923c88';
        }

        // User right-click highlight
        if (this.userHighlights.has(squareName)) {
          const hl = document.createElement('div');
          hl.className = 'user-square-highlight absolute inset-0 bg-amber-500/40 ring-4 ring-amber-400 pointer-events-none z-10 animate-pulse';
          squareDiv.appendChild(hl);
        }

        // Move classification badge floating overlay
        if (this.lastMoveBadge && this.lastMoveBadge.square === squareName) {
          const badgeDiv = document.createElement('div');
          let bgClass = 'bg-emerald-500';
          if (this.lastMoveBadge.type === 'brilliant') bgClass = 'bg-cyan-400 text-black shadow-cyan-500/50';
          else if (this.lastMoveBadge.type === 'great') bgClass = 'bg-teal-500 text-white';
          else if (this.lastMoveBadge.type === 'best') bgClass = 'bg-emerald-500 text-white';
          else if (this.lastMoveBadge.type === 'excellent') bgClass = 'bg-green-600 text-white';
          else if (this.lastMoveBadge.type === 'inaccuracy') bgClass = 'bg-yellow-500 text-black';
          else if (this.lastMoveBadge.type === 'mistake') bgClass = 'bg-orange-500 text-white';
          else if (this.lastMoveBadge.type === 'blunder') bgClass = 'bg-red-600 text-white animate-bounce';
          else if (this.lastMoveBadge.type === 'book') bgClass = 'bg-amber-700 text-amber-100';

          badgeDiv.className = `absolute -top-1.5 -right-1.5 z-30 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold shadow-lg flex items-center justify-center border border-white/40 ${bgClass}`;
          badgeDiv.textContent = this.lastMoveBadge.icon || '🎯';
          squareDiv.appendChild(badgeDiv);
        }

        // File/Rank coordinate labels
        if (col === (isWhiteOriented ? 0 : 7)) {
          const rankSpan = document.createElement('span');
          rankSpan.className = `absolute top-0.5 left-1 text-[10px] font-bold opacity-80 pointer-events-none`;
          rankSpan.style.color = isDark ? theme.darkText : theme.lightText;
          rankSpan.textContent = 8 - row;
          squareDiv.appendChild(rankSpan);
        }

        if (row === (isWhiteOriented ? 7 : 0)) {
          const fileSpan = document.createElement('span');
          fileSpan.className = `absolute bottom-0.5 right-1 text-[10px] font-bold opacity-80 pointer-events-none`;
          fileSpan.style.color = isDark ? theme.darkText : theme.lightText;
          fileSpan.textContent = String.fromCharCode(97 + col);
          squareDiv.appendChild(fileSpan);
        }

        // Piece rendering
        const piece = boardState[row][col];
        if (piece) {
          const pieceKey = piece.color + piece.type.toUpperCase();
          const pieceContainer = document.createElement('div');
          pieceContainer.className = 'piece-wrapper w-[92%] h-[92%] flex items-center justify-center pointer-events-auto transition-transform duration-100 hover:scale-[1.03] active:scale-95 cursor-grab active:cursor-grabbing';
          pieceContainer.innerHTML = getPieceSvg(pieceKey, this.pieceStyle);
          pieceContainer.draggable = this.interactive;

          // Drag events
          pieceContainer.addEventListener('dragstart', (e) => {
            if (!this.interactive) return e.preventDefault();
            this.draggedSquare = squareName;
            this.handleSquareClick(squareName, true);
            e.dataTransfer.setData('text/plain', squareName);
          });

          squareDiv.appendChild(pieceContainer);
        }

        // Legal move dot / capture ring
        const isLegal = this.legalMoves.find(m => m.to === squareName);
        if (isLegal) {
          const indicator = document.createElement('div');
          if (piece) {
            // Capture ring
            indicator.className = 'legal-capture-ring absolute inset-1 border-4 border-amber-400/90 rounded-full pointer-events-none animate-pulse z-10';
          } else {
            // Destination dot
            indicator.className = 'legal-move-dot w-3.5 h-3.5 bg-blue-500/80 rounded-full pointer-events-none shadow-md z-10';
          }
          squareDiv.appendChild(indicator);
        }

        // Prevent context menu and handle right-click arrow/highlight drawing
        squareDiv.addEventListener('contextmenu', (e) => e.preventDefault());

        squareDiv.addEventListener('mousedown', (e) => {
          if (e.button === 2) { // Right click
            e.preventDefault();
            this.rightClickStartSquare = squareName;
          } else if (e.button === 0) { // Left click clears user arrows & highlights
            if (this.userArrows.length > 0 || this.userHighlights.size > 0) {
              this.userArrows = [];
              this.userHighlights.clear();
              this.renderBoard();
            }
          }
        });

        squareDiv.addEventListener('mouseup', (e) => {
          if (e.button === 2 && this.rightClickStartSquare) {
            e.preventDefault();
            const startSq = this.rightClickStartSquare;
            const endSq = squareName;
            this.rightClickStartSquare = null;

            if (startSq === endSq) {
              // Single right click toggles highlight
              if (this.userHighlights.has(startSq)) {
                this.userHighlights.delete(startSq);
              } else {
                this.userHighlights.add(startSq);
              }
            } else {
              // Right-click drag adds or removes arrow
              const existingIndex = this.userArrows.findIndex(a => a.from === startSq && a.to === endSq);
              if (existingIndex >= 0) {
                this.userArrows.splice(existingIndex, 1);
              } else {
                this.userArrows.push({ from: startSq, to: endSq, rank: 2 });
              }
            }
            this.renderBoard();
          }
        });

        // Click & Dragover/Drop listeners
        squareDiv.addEventListener('click', () => {
          if (this.interactive) {
            this.handleSquareClick(squareName);
          }
        });

        squareDiv.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        squareDiv.addEventListener('drop', (e) => {
          e.preventDefault();
          if (!this.interactive) return;
          const fromSquare = e.dataTransfer.getData('text/plain') || this.draggedSquare;
          if (fromSquare && fromSquare !== squareName) {
            this.attemptMove(fromSquare, squareName);
          }
        });

        this.gridElement.appendChild(squareDiv);
      }
    }

    this.renderArrows();
  }

  handleSquareClick(squareName, isDragStart = false) {
    if (!this.chessGame || !this.interactive) return;

    const pieceOnSquare = this.chessGame.get(squareName);

    if (this.selectedSquare) {
      if (this.selectedSquare === squareName && !isDragStart) {
        this.selectedSquare = null;
        this.legalMoves = [];
        this.renderBoard();
        return;
      }

      const isLegal = this.legalMoves.find(m => m.to === squareName);
      if (isLegal) {
        this.attemptMove(this.selectedSquare, squareName);
        return;
      }
    }

    if (pieceOnSquare && pieceOnSquare.color === this.chessGame.turn()) {
      this.selectedSquare = squareName;
      this.legalMoves = this.chessGame.moves({ square: squareName, verbose: true });
      this.renderBoard();
    } else {
      this.selectedSquare = null;
      this.legalMoves = [];
      this.renderBoard();
    }
  }

  attemptMove(from, to) {
    if (!this.chessGame) return;

    try {
      const moveObj = { from, to, promotion: 'q' };
      const result = this.chessGame.move(moveObj);

      if (result) {
        this.lastMove = { from, to };
        this.selectedSquare = null;
        this.legalMoves = [];
        this.renderBoard();

        if (typeof this.onMoveCallback === 'function') {
          this.onMoveCallback(result);
        }
      }
    } catch (e) {
      console.warn('Invalid move attempted:', from, to, e);
    }
  }

  squareToCoordinates(square) {
    const colChar = square[0];
    const rowNum = parseInt(square[1], 10);

    const colIndex = colChar.charCodeAt(0) - 97;
    const rowIndex = 8 - rowNum;

    const isWhite = this.orientation === 'white';

    const col = isWhite ? colIndex : 7 - colIndex;
    const row = isWhite ? rowIndex : 7 - rowIndex;

    const x = (col + 0.5) * (100 / 8);
    const y = (row + 0.5) * (100 / 8);

    return { x, y };
  }

  renderArrows() {
    if (!this.arrowsGroup) return;

    this.arrowsGroup.innerHTML = '';
    const allArrows = [...(this.arrows || []), ...(this.userArrows || [])];
    if (!allArrows.length) return;

    const colors = {
      1: { stroke: '#3b82f6', marker: 'url(#arrow-rank-1)' },
      2: { stroke: '#10b981', marker: 'url(#arrow-rank-2)' },
      3: { stroke: '#f59e0b', marker: 'url(#arrow-rank-3)' }
    };

    allArrows.forEach(arr => {
      if (!arr.from || !arr.to) return;

      const p1 = this.squareToCoordinates(arr.from);
      const p2 = this.squareToCoordinates(arr.to);

      const rank = arr.rank || 1;
      const style = colors[rank] || colors[1];

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${p1.x}%`);
      line.setAttribute('y1', `${p1.y}%`);
      line.setAttribute('x2', `${p2.x}%`);
      line.setAttribute('y2', `${p2.y}%`);
      line.setAttribute('stroke', style.stroke);
      line.setAttribute('stroke-width', '4.5');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', rank === 1 ? '0.9' : '0.75');
      line.setAttribute('marker-end', style.marker);

      this.arrowsGroup.appendChild(line);
    });
  }
}

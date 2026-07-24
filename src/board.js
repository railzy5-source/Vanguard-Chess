import { Chessground } from 'chessground';

export class ChessBoardUI {
  constructor(containerId, options = {}) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.orientation = options.orientation || 'white';
    this.interactive = options.interactive !== false;
    this.onMoveCallback = options.onMove || null;
    this.chessGame = options.chessGame || null;
    this.boardTheme = options.boardTheme || 'wood';
    this.pieceStyle = options.pieceStyle || 'cburnett';

    this.initBoard();
  }

  initBoard() {
    if (!this.container) return;
    this.container.classList.add("chessground-wrapper");
    this.container.style.width = '100%';
    this.container.style.aspectRatio = '1/1';
    this.container.style.maxWidth = '540px';
    this.container.style.margin = '0 auto';

    const initialFen = this.chessGame ? this.chessGame.fen() : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const turn = this.chessGame ? (this.chessGame.turn() === 'w' ? 'white' : 'black') : 'white';
    const dests = (this.interactive && this.chessGame) ? this.toDests(this.chessGame) : new Map();

    this.cg = Chessground(this.container, {
      fen: initialFen,
      orientation: this.orientation,
      turnColor: turn,
      animation: {
        enabled: true,
        duration: 200
      },
      draggable: {
        enabled: true,
        showGhost: true,
        deleteOnOffboard: false
      },
      selectable: {
        enabled: true
      },
      movable: {
        color: this.interactive ? turn : null,
        free: false,
        dests: dests,
        showDests: true,
        events: {
          after: (orig, dest) => this.handleMove(orig, dest)
        }
      },
      premovable: {
        enabled: true
      },
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: true,
        eraseOnClick: false,
        brushes: {
          green: { key: 'g', color: '#10b981', opacity: 0.85, lineWidth: 10 },
          blue: { key: 'b', color: '#3b82f6', opacity: 0.85, lineWidth: 10 },
          yellow: { key: 'y', color: '#f59e0b', opacity: 0.85, lineWidth: 10 },
          red: { key: 'r', color: '#ef4444', opacity: 0.85, lineWidth: 10 }
        }
      },
      highlight: {
        lastMove: true,
        check: true
      }
    });

    if (this.chessGame) {
      this.updateBoard();
    }
  }

  toDests(game) {
    const dests = new Map();
    if (!game) return dests;
    const squares = [
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
      'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
      'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
    ];
    squares.forEach(s => {
      const ms = game.moves({ square: s, verbose: true });
      if (ms.length) dests.set(s, ms.map(m => m.to));
    });
    return dests;
  }

  updateBoard() {
    if (!this.chessGame || !this.cg) return;
    const fen = this.chessGame.fen();
    const turn = this.chessGame.turn() === 'w' ? 'white' : 'black';
    const dests = this.interactive ? this.toDests(this.chessGame) : new Map();
    this.cg.set({
      fen,
      turnColor: turn,
      movable: {
        color: this.interactive ? turn : null,
        dests: dests
      }
    });
  }

  renderBoard() {
    this.updateBoard();
  }

  render() {
    this.updateBoard();
  }

  handleMove(orig, dest) {
    if (!this.chessGame) return;
    try {
      const move = this.chessGame.move({ from: orig, to: dest, promotion: 'q' });
      if (move) {
        if (typeof this.onMoveCallback === 'function') {
          this.onMoveCallback(move);
        }
        this.updateBoard();
      } else {
        this.updateBoard(); // Reset board if move was invalid
      }
    } catch (e) {
      this.updateBoard();
    }
  }

  setChessGame(game) {
    this.chessGame = game;
    this.updateBoard();
  }

  setOrientation(color) {
    this.orientation = color;
    if (this.cg) {
      this.cg.set({ orientation: color });
    }
  }

  setInteractive(flag) {
    this.interactive = flag;
    if (this.cg) {
      const turn = this.chessGame ? (this.chessGame.turn() === 'w' ? 'white' : 'black') : 'white';
      const dests = (flag && this.chessGame) ? this.toDests(this.chessGame) : new Map();
      this.cg.set({
        movable: {
          color: flag ? turn : null,
          dests: dests
        }
      });
    }
  }

  setLastMove(from, to) {
    if (!this.cg) return;
    if (from && to) {
      this.cg.set({ lastMove: [from, to] });
    } else {
      this.cg.set({ lastMove: [] });
    }
  }

  setArrows(arrows) {
    if (!this.cg) return;
    this.cg.set({
      drawable: {
        shapes: (arrows || []).map(a => {
          let brush = a.brush;
          if (!brush) {
            const rank = a.rank || 1;
            if (rank === 1) brush = 'green';
            else if (rank === 2) brush = 'blue';
            else if (rank === 3) brush = 'yellow';
            else brush = 'red';
          }
          return {
            orig: a.from,
            dest: a.to,
            brush: brush
          };
        })
      }
    });
  }

  clearArrows() {
    if (!this.cg) return;
    this.cg.set({ drawable: { shapes: [] } });
  }

  setBoardTheme(themeName) {
    this.boardTheme = themeName;
    if (this.container) {
      this.container.setAttribute('data-board-theme', themeName);
    }
  }

  setPieceStyle(styleName) {
    this.pieceStyle = styleName;
    if (this.container) {
      this.container.setAttribute('data-piece-style', styleName);
    }
  }
}

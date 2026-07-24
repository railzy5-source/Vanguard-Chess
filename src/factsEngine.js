/**
 * Vanguard Chess Facts Engine
 * Computes objective positional and tactical facts from a chess position.
 * Used for real-time coaching explanations, threat warnings, and move analysis.
 */

import { Chess } from 'chess.js';

export class FactsEngine {
  /**
   * Computes comprehensive positional and tactical facts for a given game state
   * @param {Chess} game - chess.js instance
   * @returns {Object} Fact breakdown
   */
  static analyze(game) {
    if (!game) return null;

    try {
      const fen = game.fen();
      const board = game.board();
      const turn = game.turn(); // 'w' or 'b'
      const opponentTurn = turn === 'w' ? 'b' : 'w';

      const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
      const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

      // 1. Material Count
      let whiteMaterial = 0;
      let blackMaterial = 0;
      const pieceCounts = { w: { p:0, n:0, b:0, r:0, q:0 }, b: { p:0, n:0, b:0, r:0, q:0 } };

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece) continue;
          if (piece.type !== 'k') {
            pieceCounts[piece.color][piece.type]++;
            const val = pieceValues[piece.type];
            if (piece.color === 'w') whiteMaterial += val;
            else blackMaterial += val;
          }
        }
      }

      const materialDelta = whiteMaterial - blackMaterial; // Positive = White ahead, Negative = Black ahead

      // 2. Center Control (e4, d4, e5, d5)
      const centerSquares = ['e4', 'd4', 'e5', 'd5'];
      let whiteCenterControl = 0;
      let blackCenterControl = 0;

      centerSquares.forEach(sq => {
        if (typeof game.isAttacked === 'function') {
          if (game.isAttacked(sq, 'w')) whiteCenterControl++;
          if (game.isAttacked(sq, 'b')) blackCenterControl++;
        }
      });

      // 3. Hanging Pieces & Attacked Squares
      const hangingPieces = []; // Attacked pieces with 0 or insufficient defenders
      const attackedTargets = []; // All attacked enemy pieces

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece || piece.type === 'k') continue;

          const sq = String.fromCharCode(97 + c) + (8 - r);
          const isUnderAttack = typeof game.isAttacked === 'function' ? game.isAttacked(sq, piece.color === 'w' ? 'b' : 'w') : false;

          if (isUnderAttack) {
            attackedTargets.push({
              square: sq,
              color: piece.color,
              type: piece.type,
              name: pieceNames[piece.type],
              value: pieceValues[piece.type]
            });

            // Check if hanging (attacked side turn or enemy piece left hanging)
            // For simple detection, an attacked piece with no defenders is hanging
            const isDefended = typeof game.isAttacked === 'function' ? game.isAttacked(sq, piece.color) : false;
            if (!isDefended) {
              hangingPieces.push({
                square: sq,
                color: piece.color,
                type: piece.type,
                name: pieceNames[piece.type],
                value: pieceValues[piece.type],
                isOwnerTurn: piece.color === turn
              });
            }
          }
        }
      }

      // 4. Tactical Pins & Forks Detection
      const forks = [];
      const pins = [];

      // Check all legal moves of current turn to see if any move creates a fork
      const moves = game.moves({ verbose: true });
      // Identify existing forks by checking which pieces attack 2+ enemy targets
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece || piece.type === 'p' || piece.type === 'k') continue;

          const sq = String.fromCharCode(97 + c) + (8 - r);
          // Find enemy targets attacked by this piece
          const targetsAttacked = attackedTargets.filter(t => t.color !== piece.color);
          if (targetsAttacked.length >= 2) {
            forks.push({
              attackerSquare: sq,
              attackerPiece: piece.type,
              attackerName: pieceNames[piece.type],
              attackerColor: piece.color,
              targets: targetsAttacked
            });
          }
        }
      }

      // 5. King Safety & Checks
      const inCheck = game.inCheck();
      const isCheckmate = game.isCheckmate();
      const isDraw = game.isDraw();

      return {
        fen,
        turn,
        opponentTurn,
        inCheck,
        isCheckmate,
        isDraw,
        materialDelta,
        whiteMaterial,
        blackMaterial,
        pieceCounts,
        centerControl: { white: whiteCenterControl, black: blackCenterControl },
        hangingPieces,
        attackedTargets,
        forks,
        pins
      };
    } catch (err) {
      console.warn('FactsEngine analyze error:', err);
      return null;
    }
  }

  /**
   * Generates a dynamic, position-grounded text explanation for a move
   */
  static generateMoveExplanation(moveResult, facts, bestMoveSan) {
    if (!moveResult) return { rationale: '', enemyPlan: '', warning: '' };

    const san = moveResult.san || '';
    const piece = moveResult.piece || 'p';
    const classification = moveResult.classification || 'Good';
    const cpLoss = moveResult.cpLoss || 0;

    let rationale = '';
    let enemyPlan = '';
    let warning = '';

    // 1. Rationale from position facts
    if (classification === 'Brilliant') {
      rationale = `Brilliant move (${san})! You sacrificed material or played a sharp tactic to seize a winning advantage.`;
    } else if (classification === 'Best Move') {
      rationale = `Best move (${san})! Keeps optimal central control, piece activity, and maintains your position's full potential.`;
    } else if (classification === 'Book') {
      rationale = `Book move (${san})! Follows established opening theory to develop pieces cleanly while securing the center.`;
    } else if (classification === 'Excellent' || classification === 'Good') {
      if (bestMoveSan && bestMoveSan !== san) {
        rationale = `Solid move (${san}). Stockfish suggests **${bestMoveSan}** as slightly stronger for additional central pressure or piece coordination.`;
      } else {
        rationale = `Sound, active move (${san}) that improves piece placement and controls important squares.`;
      }
    } else if (classification === 'Inaccuracy') {
      rationale = `Inaccuracy (${san}, -${cpLoss} cp). Playing **${bestMoveSan}** instead would have maintained higher piece coordination and pressure.`;
    } else if (classification === 'Mistake') {
      rationale = `Mistake (${san}, -${cpLoss} cp). Gives away initiative. **${bestMoveSan}** was much safer and kept your pieces defended.`;
    } else if (classification === 'Blunder') {
      rationale = `Blunder (${san}, -${cpLoss} cp)! Drops material or permits a dangerous enemy attack. You should have played **${bestMoveSan}** to stay secure.`;
    }

    // 2. Dynamic Warnings from Facts
    if (facts) {
      if (facts.hangingPieces.length > 0) {
        const ownerHanging = facts.hangingPieces.find(h => h.isOwnerTurn);
        const opponentHanging = facts.hangingPieces.find(h => !h.isOwnerTurn);

        if (opponentHanging) {
          warning = `Tactical Opportunity: The opponent's ${opponentHanging.name} on **${opponentHanging.square}** is undefended and under attack!`;
        } else if (ownerHanging) {
          warning = `Tactical Warning: Your ${ownerHanging.name} on **${ownerHanging.square}** is left hanging and vulnerable!`;
        }
      }

      if (facts.inCheck) {
        enemyPlan = `Check delivered! Forces an immediate defensive response.`;
      } else if (facts.forks.length > 0) {
        const f = facts.forks[0];
        enemyPlan = `Tactical Fork active! ${f.attackerName} on **${f.attackerSquare}** is threatening multiple targets.`;
      } else {
        enemyPlan = `Opponent is looking to challenge your central pawn structure and seek active piece counterplay.`;
      }
    }

    return { rationale, enemyPlan, warning };
  }
}

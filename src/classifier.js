/**
 * Objective Move Classifier Engine
 * Evaluates move quality using fixed, universal Centipawn Loss standards.
 * Opening book awareness prevents false "mistake" classifications.
 */

export class MoveClassifier {
  /**
   * Classifies a move using objective centipawn loss against the best engine move
   * 
   * @param {Object} params
   * @param {string} params.playedUci - UCI string of played move (e.g., 'e2e4')
   * @param {string} params.bestUci - UCI string of top Stockfish move
   * @param {number} params.evalBefore - Evaluation score before move (in centipawns from active player POV)
   * @param {number} params.evalAfter - Evaluation score after move (in centipawns from active player POV)
   * @param {boolean} [params.isSacrifice=false] - Whether move sacrificed material
   * @param {boolean} [params.isBook=false] - Whether move is known opening theory
   * @param {string} [params.openingName] - Name of the opening if it's a book move
   * @returns {Object} { classification, cpLoss, badge, icon, color }
   */
  static classifyMove({ playedUci, bestUci, evalBefore = 0, evalAfter = 0, isSacrifice = false, isBook = false, openingName = '' }) {
    // BOOK MOVES — OVERRIDE everything else
    // This prevents principled opening moves from being incorrectly flagged as mistakes
    if (isBook) {
      return {
        classification: 'Book',
        cpLoss: 0,
        badge: '📖 Book Move',
        icon: '📖',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        openingName: openingName || 'Book Theory'
      };
    }

    // Exact match with engine best move
    const isExactBest = playedUci && bestUci && (playedUci === bestUci || playedUci.slice(0, 4) === bestUci.slice(0, 4));

    // Calculate CP loss (non-negative)
    let cpLoss = Math.max(0, evalBefore - evalAfter);
    if (isExactBest) cpLoss = 0;

    // Check Brilliant (Sacrifice with minimal CP loss and strong evaluation)
    if (isSacrifice && cpLoss <= 15 && evalAfter >= -50) {
      return {
        classification: 'Brilliant',
        cpLoss,
        badge: 'Brilliant!!',
        icon: '!!',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      };
    }

    if (cpLoss === 0 || isExactBest) {
      return {
        classification: 'Best Move',
        cpLoss: 0,
        badge: 'Best Move',
        icon: '★',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    }

    if (cpLoss <= 20) {
      return {
        classification: 'Excellent',
        cpLoss,
        badge: 'Excellent',
        icon: '✓',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      };
    }

    if (cpLoss <= 50) {
      return {
        classification: 'Good',
        cpLoss,
        badge: 'Good Move',
        icon: '👍',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      };
    }

    if (cpLoss <= 120) {
      return {
        classification: 'Inaccuracy',
        cpLoss,
        badge: 'Inaccuracy?!',
        icon: '?!',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      };
    }

    if (cpLoss <= 250) {
      return {
        classification: 'Mistake',
        cpLoss,
        badge: 'Mistake?',
        icon: '?',
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      };
    }

    return {
      classification: 'Blunder',
      cpLoss,
      badge: 'Blunder??',
      icon: '??',
      color: 'text-red-400 bg-red-500/10 border-red-500/30'
    };
  }
}

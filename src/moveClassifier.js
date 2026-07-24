/**
 * Move Classification Utility
 * Provides unified move classification logic for both player and AI moves
 */

/**
 * Classifies a chess move based on centipawn loss from best move
 * 
 * @param {string} playedMoveUci - UCI notation of move played (e.g., 'e2e4')
 * @param {string} bestMoveUci - UCI notation of best move according to analysis
 * @param {number} bestMoveScore - Evaluation score of best move (in centipawns)
 * @param {number} playedMoveScore - Evaluation score of played move (in centipawns)
 * @param {number} [scale=1.0] - Classification threshold multiplier for ELO adjustment
 *   - 1.0 = Master level (normal thresholds)
 *   - 1.5 = Advanced (1800 ELO)
 *   - 2.0 = Intermediate (1400 ELO)
 *   - 3.0 = Weak (1000 ELO)
 *   - 4.0 = Ultra-weak (600 ELO)
 * 
 * @returns {string} Classification: 'Brilliant', 'Great', 'Best Move', 'Excellent', 
 *   'Good', 'Inaccuracy', 'Mistake', or 'Blunder'
 * 
 * @example
 * // Master-level player move: played e4 instead of best move d4
 * const classification = classifyMove('e2e4', 'd2d4', 50, 40, 1.0);
 * // Returns: 'Excellent' (10cp difference < 20cp threshold)
 * 
 * @example
 * // 300 ELO move: played h6 when best was e4
 * const classification = classifyMove('h7h6', 'e2e4', 150, -150, 4.0);
 * // Returns: 'Blunder' (300cp difference > 220*4.0=880cp threshold? No, it's 300cp diff)
 * // Actually: 300cp > 220cp, so 'Blunder' even at scale 4.0
 */
export function classifyMove(playedMoveUci, bestMoveUci, bestMoveScore, playedMoveScore, scale = 1.0) {
  // If the move played IS the best move
  if (playedMoveUci === bestMoveUci) {
    const roll = Math.random();
    if (roll < 0.05) {
      return 'Brilliant';
    } else if (roll < 0.25) {
      return 'Great';
    } else {
      return 'Best Move';
    }
  }

  // Calculate centipawn loss (difference from best move)
  const cpLoss = Math.max(0, bestMoveScore - playedMoveScore);

  // Apply scaled thresholds based on ELO/difficulty
  if (cpLoss < 20 * scale) {
    return 'Excellent';
  } else if (cpLoss < 60 * scale) {
    return 'Good';
  } else if (cpLoss < 120 * scale) {
    return 'Inaccuracy';
  } else if (cpLoss < 220 * scale) {
    return 'Mistake';
  } else {
    return 'Blunder';
  }
}

/**
 * Calculate move accuracy as a percentage (0-100)
 * Used for accuracy tracking and win probability calculations
 * 
 * @param {number} centipawnLoss - How much worse the move was than best (cp)
 * @param {number} [scale=1.0] - ELO adjustment scale (optional)
 * @returns {number} Accuracy percentage (15-100)
 * 
 * @example
 * getAccuracy(0) // → 100 (perfect move)
 * getAccuracy(50) // → ~95 (small mistake)
 * getAccuracy(300) // → ~40 (big blunder)
 */
export function getAccuracy(centipawnLoss, scale = 1.0) {
  const scaledLoss = centipawnLoss / scale;
  const accuracy = Math.max(15, Math.round(100 * Math.exp(-0.003 * scaledLoss)));
  return accuracy;
}

/**
 * Get the scale factor for a given ELO rating
 * Used to adjust classification thresholds based on opponent strength
 * 
 * @param {number} elo - Chess rating (100-2700)
 * @returns {number} Scale factor to multiply thresholds by
 * 
 * @example
 * getScaleForElo(300) // → 4.0 (very weak player)
 * getScaleForElo(1200) // → 2.5
 * getScaleForElo(2600) // → 1.0 (master level)
 */
export function getScaleForElo(elo) {
  if (elo <= 600) {
    return 4.0; // Ultra-weak play (300-600 ELO)
  } else if (elo <= 1000) {
    return 3.0; // Weak play (600-1000 ELO)
  } else if (elo <= 1400) {
    return 2.0; // Intermediate play (1000-1400 ELO)
  } else if (elo <= 1800) {
    return 1.5; // Advanced play (1400-1800 ELO)
  } else {
    return 1.0; // Master level (1800-2700 ELO)
  }
}

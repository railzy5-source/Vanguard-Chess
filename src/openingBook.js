/**
 * Hikari Chess Coach - Opening Book Explorer & Master Theory Engine
 * Deep 10-15 ply opening variations, move-by-move GM strategic commentary,
 * candidate statistics, and live Lichess Masters API Explorer integration.
 */

export const OPENINGS_DATABASE = [
  {
    id: 'sicilian_najdorf',
    eco: 'B90',
    name: 'Sicilian Defense: Najdorf Variation',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    uciSequence: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'a7a6'],
    description: 'The sharpest and most deeply analyzed opening in chess history, favored by Bobby Fischer and Garry Kasparov. An aggressive asymmetrical battle for central supremacy.',
    keyIdeas: [
      'White aims to castle queenside in the English Attack (Be3, f3, Qd2, g4) and launch a kingside pawn storm.',
      'Black expands queenside with ...b5, targets White\'s e4 pawn, and utilizes the open c-file with ...Rc8.',
      'Black controls b5 with 5...a6 to stop Nb5/Bb5+ checks.'
    ],
    moveCommentary: [
      {
        ply: 1, move: 'e4',
        rationale: 'Stakes a claim in the center and opens diagonals for Queen and Bishop.',
        enemyPlan: 'Black will challenge White\'s e4 pawn from the flank (c5) or symmetrically (e5).',
        warning: 'Avoid pushing e5 too early before pieces are developed.'
      },
      {
        ply: 2, move: 'c5',
        rationale: 'The Sicilian Defense! Black attacks d4 from the flank, creating an asymmetrical pawn structure.',
        enemyPlan: 'White usually plays 2.Nf3 to prepare 3.d4 open central tension.',
        warning: 'Black must be careful not to fall behind in piece development.'
      },
      {
        ply: 3, move: 'Nf3',
        rationale: 'White develops the knight toward the center and prepares the d4 pawn break.',
        enemyPlan: 'Black plays 2...d6 to control e5 and prepare Nf6.',
        warning: 'Watch out for early Black ...e5 counter-strikes.'
      },
      {
        ply: 4, move: 'd6',
        rationale: 'Guards e5, controls c5/e5 squares, and clears a path for the light-squared bishop.',
        enemyPlan: 'White will play 3.d4 to trade pawns and open lines.',
        warning: 'Do not play ...e5 immediately if it leaves a backward d6 pawn.'
      },
      {
        ply: 5, move: 'd4',
        rationale: 'Open Sicilian! White opens the center to leverage superior development speed.',
        enemyPlan: 'Black will trade ...cxd4 to exchange a flank pawn for White\'s central d-pawn.',
        warning: 'White must accept Black\'s long-term central pawn majority.'
      },
      {
        ply: 6, move: 'cxd4',
        rationale: 'Trading flank pawn for central pawn. Black secures two central pawns (d6/e7) vs White\'s one (e4).',
        enemyPlan: 'White recaptures with 4.Nxd4 with an active central knight.',
        warning: 'Ensure White\'s d4 knight does not dominate the center freely.'
      },
      {
        ply: 7, move: 'Nxd4',
        rationale: 'White recaptures with the knight, establishing central presence and active piece placement.',
        enemyPlan: 'Black plays 4...Nf6 to attack White\'s e4 pawn with tempo.',
        warning: 'Watch out for Black ...e5 or ...d5 pawn breaks later.'
      },
      {
        ply: 8, move: 'Nf6',
        rationale: 'Black develops with tempo, forcing White to defend e4.',
        enemyPlan: 'White plays 5.Nc3 to defend e4 solidly.',
        warning: 'Be careful of tactical tricks if White plays 5.f3 instead.'
      },
      {
        ply: 9, move: 'Nc3',
        rationale: 'White defends e4 and develops the queen\'s knight.',
        enemyPlan: 'Black plays 5...a6—the signature Najdorf move!',
        warning: 'Watch out for Black ...b5 queenside expansion.'
      },
      {
        ply: 10, move: 'a6',
        rationale: 'The hallmark of the Najdorf! Prevents Nb5 and Bb5+ checks while preparing ...b5 queenside expansion.',
        enemyPlan: 'White chooses between 6.Be3 (English Attack), 6.Bg5 (Classical Main Line), or 6.h3 (Adams Attack).',
        warning: 'Black\'s king remains in the center for a few moves—watch out for central sacrifices!'
      }
    ],
    candidates: [
      { san: 'Be3', name: 'English Attack (Main Line)', winW: 39, draw: 34, winB: 27, count: '142,500' },
      { san: 'Bg5', name: 'Classical Main Line', winW: 40, draw: 32, winB: 28, count: '98,200' },
      { san: 'h3', name: 'Adams Attack', winW: 37, draw: 36, winB: 27, count: '45,100' },
      { san: 'Be2', name: 'Opocensky Variation', winW: 35, draw: 38, winB: 27, count: '62,000' }
    ]
  },
  {
    id: 'sicilian_dragon',
    eco: 'B70',
    name: 'Sicilian Defense: Dragon Variation',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'],
    uciSequence: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'g7g6'],
    description: 'Named for Black\'s pawn structure resembling the Draco constellation. Black fianchettoes the dark-squared bishop onto h8-a1 to strike White\'s queenside.',
    keyIdeas: [
      'Black\'s Bg7 dark-squared bishop is a sniper laser along the h8-a1 diagonal.',
      'White usually plays the lethal Yugoslav Attack (Be3, f3, Qd2, Bc4, O-O-O) aiming for a h4-h5 mating storm.',
      'Black counter-attacks on the c-file with ...Rc8 and exchange sacrifices on c3 (...Rxc3).'
    ],
    moveCommentary: [
      { ply: 1, move: 'e4', rationale: 'Central pawn push.', enemyPlan: 'Sicilian Defense.', warning: 'Watch d4.' },
      { ply: 2, move: 'c5', rationale: 'Sicilian Defense.', enemyPlan: 'Open Sicilian with 2.Nf3.', warning: 'Mind development speed.' },
      { ply: 3, move: 'Nf3', rationale: 'Developing knight.', enemyPlan: '2...d6.', warning: 'Be ready for open d4.' },
      { ply: 4, move: 'd6', rationale: 'Controlling e5.', enemyPlan: '3.d4.', warning: 'Keep piece activity high.' },
      { ply: 5, move: 'd4', rationale: 'Opening center.', enemyPlan: '3...cxd4.', warning: 'White leads in development.' },
      { ply: 6, move: 'cxd4', rationale: 'Central trade.', enemyPlan: '4.Nxd4.', warning: 'Black gets long-term pawn majority.' },
      { ply: 7, move: 'Nxd4', rationale: 'Knight recapture.', enemyPlan: '4...Nf6.', warning: 'Watch e4 pawn.' },
      { ply: 8, move: 'Nf6', rationale: 'Attacking e4.', enemyPlan: '5.Nc3.', warning: 'Force White to defend.' },
      { ply: 9, move: 'Nc3', rationale: 'Defending e4.', enemyPlan: '5...g6 Dragon setup!', warning: 'Prepare sharp tactical play.' },
      { ply: 10, move: 'g6', rationale: 'The Dragon Dragon setup! Preparing ...Bg7 to dominate dark squares.', enemyPlan: 'White Yugoslav Attack (Be3, f3, Qd2).', warning: 'White will push h4-h5 to open your king!' }
    ],
    candidates: [
      { san: 'Be3', name: 'Yugoslav Attack', winW: 42, draw: 28, winB: 30, count: '110,000' },
      { san: 'Be2', name: 'Classical Line', winW: 36, draw: 38, winB: 26, count: '48,000' }
    ]
  },
  {
    id: 'ruy_lopez_marshall',
    eco: 'C89',
    name: 'Ruy Lopez: Marshall Attack',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5'],
    uciSequence: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6', 'e1g1', 'f8e7', 'f1e1', 'b7b5', 'a4b3', 'e8g8', 'c2c3', 'd7d5'],
    description: 'One of Black\'s most formidable gambit counter-attacks in chess history. Black sacrifices the d5 pawn for massive piece activity and a deadly kingside attack.',
    keyIdeas: [
      'Black sacrifices a pawn with ...d5 to rip open lines before White sets up d4.',
      'Black launches a fast attack with ...Bd6, ...Qh4, ...Ng4, and ...f5.'
    ],
    moveCommentary: [
      { ply: 1, move: 'e4', rationale: 'King\'s Pawn.', enemyPlan: '1...e5.', warning: 'Standard classical game.' },
      { ply: 2, move: 'e5', rationale: 'Symmetric response.', enemyPlan: '2.Nf3.', warning: 'Defend e5.' },
      { ply: 3, move: 'Nf3', rationale: 'Attacking e5.', enemyPlan: '2...Nc6.', warning: 'Defend e5.' },
      { ply: 4, move: 'Nc6', rationale: 'Defending e5.', enemyPlan: '3.Bb5 Ruy Lopez.', warning: 'Watch out for Bb5 pins.' },
      { ply: 5, move: 'Bb5', rationale: 'The Ruy Lopez!', enemyPlan: '3...a6 Morphy Defense.', warning: 'Pressures c6 defender.' },
      { ply: 6, move: 'a6', rationale: 'Morphy Defense.', enemyPlan: '4.Ba4.', warning: 'Puts the question to the bishop.' },
      { ply: 7, move: 'Ba4', rationale: 'Maintaining pressure.', enemyPlan: '4...Nf6.', warning: 'Keeps diagonal options open.' },
      { ply: 8, move: 'Nf6', rationale: 'Developing knight.', enemyPlan: '5.O-O.', warning: 'Attacks White e4 pawn.' },
      { ply: 9, move: 'O-O', rationale: 'Castling safely.', enemyPlan: '5...Be7.', warning: 'E4 pawn is defended indirectly.' },
      { ply: 10, move: 'Be7', rationale: 'Preparing castle.', enemyPlan: '6.Re1.', warning: 'Prepares kingside castle.' },
      { ply: 11, move: 'Re1', rationale: 'Defending e4.', enemyPlan: '6...b5.', warning: 'Controls e-file.' },
      { ply: 12, move: 'b5', rationale: 'Driving bishop back.', enemyPlan: '7.Bb3.', warning: 'Gains queenside space.' },
      { ply: 13, move: 'Bb3', rationale: 'Retreating bishop.', enemyPlan: '7...O-O.', warning: 'Bishop points at f7.' },
      { ply: 14, move: 'O-O', rationale: 'Black castles.', enemyPlan: '8.c3.', warning: 'Prepares central strike.' },
      { ply: 15, move: 'c3', rationale: 'Prepares d4.', enemyPlan: '8...d5 Marshall Gambit!', warning: 'Watch out for Black\'s d5 pawn sacrifice!' },
      { ply: 16, move: 'd5', rationale: 'The Marshall Gambit! Black strikes in the center with a pawn sacrifice for massive attack!', enemyPlan: 'White accepts with 9.exd5 or plays Anti-Marshall 9.d3.', warning: 'Black gets huge tactical initiative against White\'s king!' }
    ],
    candidates: [
      { san: 'exd5', name: 'Marshall Accepted', winW: 36, draw: 46, winB: 18, count: '85,000' },
      { san: 'd3', name: 'Anti-Marshall', winW: 38, draw: 42, winB: 20, count: '62,000' }
    ]
  },
  {
    id: 'italian_evans',
    eco: 'C52',
    name: 'Italian Game: Evans Gambit',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4'],
    uciSequence: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'b2b4', 'c5b4', 'c2c3', 'b4a5', 'd2d4'],
    description: 'A romantic 19th-century gambit favored by Paul Morphy and Garry Kasparov. White offers the b-pawn to gain total central domination and speed.',
    keyIdeas: [
      'White sacrifices b4 to pull Black\'s bishop away and gain a tempo with c3 and d4.',
      'White sets up lethal threats against f7 and b7 with Qb3 and Ba3.'
    ],
    moveCommentary: [
      { ply: 1, move: 'e4', rationale: 'King\'s pawn push.', enemyPlan: '1...e5.', warning: 'Center stake.' },
      { ply: 2, move: 'e5', rationale: 'Symmetric response.', enemyPlan: '2.Nf3.', warning: 'Defend e5.' },
      { ply: 3, move: 'Nf3', rationale: 'Knight development.', enemyPlan: '2...Nc6.', warning: 'Attack e5.' },
      { ply: 4, move: 'Nc6', rationale: 'Defending e5.', enemyPlan: '3.Bc4 Italian Game.', warning: 'Solid defense.' },
      { ply: 5, move: 'Bc4', rationale: 'Italian Game! Aiming at f7.', enemyPlan: '3...Bc5 Giuoco Piano.', warning: 'Focuses on f7.' },
      { ply: 6, move: 'Bc5', rationale: 'Giuoco Piano setup.', enemyPlan: '4.b4 Evans Gambit!', warning: 'Watch for b4 gambit!' },
      { ply: 7, move: 'b4', rationale: 'The Evans Gambit! Offering a wing pawn to seize central momentum!', enemyPlan: '4...Bxb4 accepted.', warning: 'Gains tempo on Black bishop.' },
      { ply: 8, move: 'Bxb4', rationale: 'Gambit accepted.', enemyPlan: '5.c3.', warning: 'Black takes the material.' },
      { ply: 9, move: 'c3', rationale: 'Driving bishop back while building d4.', enemyPlan: '5...Ba5.', warning: 'Prepares full center d4.' },
      { ply: 10, move: 'Ba5', rationale: 'Bishop retreats.', enemyPlan: '6.d4.', warning: 'Maintains pin on c3/d2.' },
      { ply: 11, move: 'd4', rationale: 'White seizes the full central pawn duo (e4/d4)!', enemyPlan: '6...exd4.', warning: 'White has overwhelming central development.' }
    ],
    candidates: [
      { san: 'exd4', name: 'Main Gambit Accepted', winW: 44, draw: 28, winB: 28, count: '45,000' },
      { san: 'd6', name: 'Lasker Defense', winW: 38, draw: 32, winB: 30, count: '18,000' }
    ]
  },
  {
    id: 'london_system',
    eco: 'A48',
    name: 'London System: Main Line Setup',
    moves: ['d4', 'Nf6', 'Bf4', 'd5', 'e3', 'c5', 'c3', 'Nc6', 'Nd2', 'e6'],
    uciSequence: ['d2d4', 'g8f6', 'c1f4', 'd7d5', 'e2e3', 'c7c5', 'c2c3', 'b8c6', 'b1d2', 'e7e6'],
    description: 'A solid, universal opening framework for White that can be played against almost any Black setup. High solid control with low tactical risk.',
    keyIdeas: [
      'White builds an impenetrable pyramid pawn triangle on c3-d4-e3 with an active dark-squared bishop on f4.',
      'White places Ne5 and launches a kingside attack or controls the central e-file.'
    ],
    moveCommentary: [
      { ply: 1, move: 'd4', rationale: 'Queen\'s Pawn opening.', enemyPlan: '1...Nf6 or 1...d5.', warning: 'Solid central control.' },
      { ply: 2, move: 'Nf6', rationale: 'Flexible defense.', enemyPlan: '2.Bf4 London System.', warning: 'Prevents e4.' },
      { ply: 3, move: 'Bf4', rationale: 'The London Bishop! Placed outside the pawn chain before e3.', enemyPlan: '2...d5.', warning: 'Active dark-squared bishop.' },
      { ply: 4, move: 'd5', rationale: 'Black claims d5.', enemyPlan: '3.e3.', warning: 'Symmetric central presence.' },
      { ply: 5, move: 'e3', rationale: 'Solidifying d4 pawn.', enemyPlan: '3...c5.', warning: 'Locks light squares.' },
      { ply: 6, move: 'c5', rationale: 'Black challenges d4.', enemyPlan: '4.c3.', warning: 'Strikes at White center.' },
      { ply: 7, move: 'c3', rationale: 'Pyramid structure established (c3-d4-e3)!', enemyPlan: '4...Nc6.', warning: 'Impenetrable pawn base.' },
      { ply: 8, move: 'Nc6', rationale: 'Developing knight.', enemyPlan: '5.Nd2.', warning: 'Pressures d4.' },
      { ply: 9, move: 'Nd2', rationale: 'Flexible knight placement supporting c4 or e4 breaks.', enemyPlan: '5...e6.', warning: 'Supports c3.' },
      { ply: 10, move: 'e6', rationale: 'Solidifying Black\'s central pawns.', enemyPlan: '6.Ngf3.', warning: 'Prepares Bd3 and Ne5.' }
    ],
    candidates: [
      { san: 'Ngf3', name: 'Main Knight Line', winW: 39, draw: 39, winB: 22, count: '140,000' },
      { san: 'Bd3', name: 'Active Bishop Line', winW: 40, draw: 37, winB: 23, count: '95,000' }
    ]
  }
];

export class OpeningExplorer {
  /**
   * Fetch real-time Grandmaster statistics from Lichess Masters Explorer API
   * @param {string} fen Current position FEN
   */
  static async fetchLichessMastersData(fen) {
    try {
      const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Lichess Explorer HTTP ${res.status}`);
      const data = await res.json();

      const totalGames = (data.white || 0) + (data.draws || 0) + (data.black || 0);

      const candidateMoves = (data.moves || []).map(m => {
        const moveTotal = (m.white || 0) + (m.draws || 0) + (m.black || 0);
        const winW = moveTotal > 0 ? Math.round((m.white / moveTotal) * 100) : 33;
        const draw = moveTotal > 0 ? Math.round((m.draws / moveTotal) * 100) : 34;
        const winB = moveTotal > 0 ? Math.round((m.black / moveTotal) * 100) : 33;

        return {
          san: m.san,
          uci: m.uci,
          count: moveTotal.toLocaleString(),
          winW,
          draw,
          winB,
          avgRating: m.averageRating || 2450
        };
      });

      return {
        success: true,
        eco: data.opening?.eco || 'ECO',
        openingName: data.opening?.name || 'Grandmaster Main Line',
        totalGames: totalGames.toLocaleString(),
        candidates: candidateMoves,
        topGames: data.topGames || []
      };
    } catch (err) {
      console.warn('Lichess Masters API fetch failed, using fallback database:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Find matching opening by move history or ECO code in local DB
   */
  static identifyOpening(moveHistorySan = []) {
    if (!moveHistorySan || moveHistorySan.length === 0) {
      return OPENINGS_DATABASE[0];
    }

    let bestMatch = OPENINGS_DATABASE[0];
    let maxMatchLen = -1;

    for (const op of OPENINGS_DATABASE) {
      let isMatch = true;
      for (let i = 0; i < op.moves.length; i++) {
        if (i >= moveHistorySan.length) break;
        if (op.moves[i] !== moveHistorySan[i]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch && op.moves.length > maxMatchLen) {
        maxMatchLen = op.moves.length;
        bestMatch = op;
      }
    }

    return bestMatch;
  }

  static getById(id) {
    return OPENINGS_DATABASE.find(o => o.id === id) || OPENINGS_DATABASE[0];
  }
}

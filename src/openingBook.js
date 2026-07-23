/**
 * Hikari Chess Coach - Opening Book Explorer & Master Theory Engine
 * Deep 10-15 ply opening variations, move-by-move GM strategic commentary,
 * candidate statistics, and live Lichess Masters API Explorer integration.
 */

export const OPENINGS_DATABASE = [
  {
    id: 'queens_gambit_declined',
    side: 'white',
    eco: 'D35',
    name: 'Queen\'s Gambit Declined: Exchange Variation',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'c6', 'e3'],
    uciSequence: ['d2d4', 'd7d5', 'c2c4', 'e7e6', 'b1c3', 'g8f6', 'c4d5', 'e6d5', 'c1g5', 'c7c6', 'e2e3'],
    description: 'A deeply strategic and solid defense for Black. In the Exchange Variation, White stabilizes the center and plays for a minority attack on the queenside or central control.',
    keyIdeas: [
      'White will often execute the Carlsbad structure minority attack (b4-b5).',
      'Black aims for piece activity on the kingside or breaks with c5/e5.'
    ],
    moveCommentary: [
      { ply: 1, move: 'd4', rationale: 'Claims center space.', enemyPlan: '1...d5 or 1...Nf6.', warning: 'Watch out for hypermodern setups.' },
      { ply: 2, move: 'd5', rationale: 'Challenges the center directly.', enemyPlan: '2.c4.', warning: 'Defend d5 securely.' },
      { ply: 3, move: 'c4', rationale: 'The Queen\'s Gambit! Challenges d5 immediately.', enemyPlan: '2...e6 or 2...c6.', warning: 'c4 is unprotected but sacrificing it is temporary.' },
      { ply: 4, move: 'e6', rationale: 'Queen\'s Gambit Declined. Solidly defends d5.', enemyPlan: '3.Nc3.', warning: 'Blocks the light-squared bishop.' },
      { ply: 5, move: 'Nc3', rationale: 'Develops and pressures d5.', enemyPlan: '3...Nf6.', warning: 'Prepare for pins from Bb4.' },
      { ply: 6, move: 'Nf6', rationale: 'Develops kingside knight and defends d5.', enemyPlan: '4.cxd5 or 4.Bg5.', warning: 'Be ready for Bg5 pins.' },
      { ply: 7, move: 'cxd5', rationale: 'Exchange Variation! Clarifies the center early.', enemyPlan: '4...exd5.', warning: 'Opens the c-file.' },
      { ply: 8, move: 'exd5', rationale: 'Recaptures and opens the c8-h3 diagonal for the bishop.', enemyPlan: '5.Bg5.', warning: 'Watch out for Carlsbad pawn structures.' },
      { ply: 9, move: 'Bg5', rationale: 'Pins the f6 knight, putting pressure on Black\'s setup.', enemyPlan: '5...c6 or 5...Be7.', warning: 'Forces Black to make a decision.' },
      { ply: 10, move: 'c6', rationale: 'Solidifies d5 and prepares to develop the queen.', enemyPlan: '6.e3.', warning: 'Limits the c6 square for the b8 knight.' },
      { ply: 11, move: 'e3', rationale: 'Solidifies the center and prepares to develop the light-squared bishop.', enemyPlan: '6...Be7.', warning: 'Prepares for slow maneuvering.' }
    ],
    candidates: [
      { san: 'Be7', name: 'Main Line', winW: 39, draw: 44, winB: 17, count: '65,000' },
      { san: 'Bf5', name: 'Active Bishop', winW: 35, draw: 40, winB: 25, count: '12,000' }
    ]
  },
  {
    id: 'caro_kann_advance',
    side: 'black',
    eco: 'B12',
    name: 'Caro-Kann Defense: Advance Variation',
    moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5'],
    uciSequence: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'e4e5', 'c8f5', 'g1f3', 'e7e6', 'f1e2', 'c6c5'],
    description: 'A modern and highly aggressive approach by White against the solid Caro-Kann, gaining space immediately.',
    keyIdeas: [
      'White claims a space advantage with the e5 pawn and restricts Black.',
      'Black develops the light-squared bishop outside the pawn chain before playing e6.'
    ],
    moveCommentary: [
      { ply: 1, move: 'e4', rationale: 'King\'s pawn opening.', enemyPlan: '1...c6.', warning: 'Prepare for asymmetrical structures.' },
      { ply: 2, move: 'c6', rationale: 'The Caro-Kann Defense! Prepares d5 solidly.', enemyPlan: '2.d4.', warning: 'Passive early on, relies on solid pawn structure.' },
      { ply: 3, move: 'd4', rationale: 'Seizes the full center.', enemyPlan: '2...d5.', warning: 'Challenges Black to break it.' },
      { ply: 4, move: 'd5', rationale: 'Strikes back at the center.', enemyPlan: '3.e5 or 3.Nc3.', warning: 'Threatens the e4 pawn.' },
      { ply: 5, move: 'e5', rationale: 'The Advance Variation! Gains space and cramps Black.', enemyPlan: '3...Bf5.', warning: 'Commits the pawn structure.' },
      { ply: 6, move: 'Bf5', rationale: 'Develops the bishop outside the pawn chain before playing e6.', enemyPlan: '4.Nf3 or 4.h4.', warning: 'Bishop can be a target.' },
      { ply: 7, move: 'Nf3', rationale: 'Develops solidly, preparing kingside castling.', enemyPlan: '4...e6.', warning: 'Watch out for Black\'s c5 break.' },
      { ply: 8, move: 'e6', rationale: 'Solidifies the center and prepares to develop kingside.', enemyPlan: '5.Be2.', warning: 'Locks in the c8 bishop if it wasn\'t out.' },
      { ply: 9, move: 'Be2', rationale: 'Develops bishop, prepares castling, keeps flexibility.', enemyPlan: '5...c5 or 5...Ne7.', warning: 'Passive but solid.' },
      { ply: 10, move: 'c5', rationale: 'Strikes at the base of White\'s pawn chain (d4)!', enemyPlan: '6.O-O or 6.Be3.', warning: 'Opens lines.' }
    ],
    candidates: [
      { san: 'O-O', name: 'Castling Main Line', winW: 38, draw: 38, winB: 24, count: '32,000' },
      { san: 'Be3', name: 'Defending d4', winW: 41, draw: 34, winB: 25, count: '15,000' }
    ]
  },
  {
    id: 'french_winawer',
    side: 'black',
    eco: 'C18',
    name: 'French Defense: Winawer Variation',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+'],
    uciSequence: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1c3', 'f8b4', 'e4e5', 'c7c5', 'a2a3', 'b4c3'],
    description: 'A sharp and complex struggle. Black pins the knight and is willing to trade bishop for knight to damage White\'s pawn structure.',
    keyIdeas: [
      'Black creates doubled c-pawns for White.',
      'White gets the bishop pair and attacking chances on the kingside.'
    ],
    moveCommentary: [
      { ply: 1, move: 'e4', rationale: 'King\'s pawn opening.', enemyPlan: '1...e6.', warning: 'Prepare for closed centers.' },
      { ply: 2, move: 'e6', rationale: 'The French Defense! Prepares d5 while avoiding open games.', enemyPlan: '2.d4.', warning: 'The light-squared bishop is often blocked.' },
      { ply: 3, move: 'd4', rationale: 'White takes full central control.', enemyPlan: '2...d5.', warning: 'Must be prepared to defend or advance.' },
      { ply: 4, move: 'd5', rationale: 'Black challenges the center.', enemyPlan: '3.Nc3, 3.Nd2, or 3.e5.', warning: 'Attacks e4.' },
      { ply: 5, move: 'Nc3', rationale: 'Develops and defends e4 flexibly.', enemyPlan: '3...Bb4 or 3...Nf6.', warning: 'Allows pins.' },
      { ply: 6, move: 'Bb4', rationale: 'The Winawer! Pins the knight and threatens to win the e4 pawn.', enemyPlan: '4.e5.', warning: 'Commits to trading the dark-squared bishop.' },
      { ply: 7, move: 'e5', rationale: 'Gains space and attacks.', enemyPlan: '4...c5.', warning: 'Closes the center.' },
      { ply: 8, move: 'c5', rationale: 'Strikes at the base of the pawn chain.', enemyPlan: '5.a3.', warning: 'Creates tension.' },
      { ply: 9, move: 'a3', rationale: 'Forces Black to decide on the pinned bishop.', enemyPlan: '5...Bxc3+.', warning: 'Weakens queenside slightly.' },
      { ply: 10, move: 'Bxc3+', rationale: 'Black damages White\'s pawn structure, doubling the c-pawns.', enemyPlan: '6.bxc3.', warning: 'Gives up the bishop pair.' }
    ],
    candidates: [
      { san: 'bxc3', name: 'Main Line', winW: 41, draw: 32, winB: 27, count: '28,000' }
    ]
  },
  {
    id: 'kings_indian',
    side: 'black',
    eco: 'E97',
    name: 'King\'s Indian Defense: Mar del Plata',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'],
    uciSequence: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'e2e4', 'd7d6', 'g1f3', 'e8g8', 'f1e2', 'e7e5', 'e1g1', 'b8c6', 'd4d5', 'c6e7'],
    description: 'A hypermodern opening where Black allows White a massive pawn center, only to counterattack aggressively, often on the kingside.',
    keyIdeas: [
      'White usually attacks on the queenside (c5 break).',
      'Black launches a pawn storm on the kingside (f5-f4, g5-g4).'
    ],
    moveCommentary: [
      { ply: 1, move: 'd4', rationale: 'Queen\'s pawn opening.', enemyPlan: '1...Nf6.', warning: 'Flexible control.' },
      { ply: 2, move: 'Nf6', rationale: 'Prevents e4 and keeps options open.', enemyPlan: '2.c4.', warning: 'Hypermodern approach.' },
      { ply: 3, move: 'c4', rationale: 'Grabs space.', enemyPlan: '2...g6.', warning: 'Prepares Nc3.' },
      { ply: 4, move: 'g6', rationale: 'Prepares to fianchetto the bishop.', enemyPlan: '3.Nc3.', warning: 'Delays central occupation.' },
      { ply: 5, move: 'Nc3', rationale: 'Supports e4 and controls d5.', enemyPlan: '3...Bg7.', warning: 'Solid development.' },
      { ply: 6, move: 'Bg7', rationale: 'King\'s Indian setup. Bishop eyes the long diagonal.', enemyPlan: '4.e4.', warning: 'Ready to castle.' },
      { ply: 7, move: 'e4', rationale: 'Builds a massive pawn center.', enemyPlan: '4...d6.', warning: 'Beware of overextension.' },
      { ply: 8, move: 'd6', rationale: 'Controls e5 and prepares to challenge the center.', enemyPlan: '5.Nf3.', warning: 'Restricts the g7 bishop.' },
      { ply: 9, move: 'Nf3', rationale: 'Classical variation. Develops knight.', enemyPlan: '5...O-O.', warning: 'Solid control.' },
      { ply: 10, move: 'O-O', rationale: 'King safety.', enemyPlan: '6.Be2.', warning: 'Prepares e5 strike.' },
      { ply: 11, move: 'Be2', rationale: 'Prepares castling.', enemyPlan: '6...e5.', warning: 'Develops bishop.' },
      { ply: 12, move: 'e5', rationale: 'Strikes at the center! Challenges d4.', enemyPlan: '7.O-O.', warning: 'Defines the pawn structure.' },
      { ply: 13, move: 'O-O', rationale: 'White castles safely.', enemyPlan: '7...Nc6.', warning: 'King is secure.' },
      { ply: 14, move: 'Nc6', rationale: 'Increases pressure on d4.', enemyPlan: '8.d5.', warning: 'Provokes d5 advance.' },
      { ply: 15, move: 'd5', rationale: 'Closes the center and gains space.', enemyPlan: '8...Ne7.', warning: 'Now White will attack queenside, Black kingside.' },
      { ply: 16, move: 'Ne7', rationale: 'The Mar del Plata variation! Knight repositions for kingside attack.', enemyPlan: '9.Ne1 or 9.b4.', warning: 'Prepares f5 break.' }
    ],
    candidates: [
      { san: 'b4', name: 'Bayonet Attack', winW: 41, draw: 30, winB: 29, count: '14,000' },
      { san: 'Ne1', name: 'Classical Main Line', winW: 39, draw: 31, winB: 30, count: '18,500' }
    ]
  },
  {
    id: 'nimzo_indian',
    side: 'black',
    eco: 'E50',
    name: 'Nimzo-Indian Defense',
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'],
    uciSequence: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'],
    description: 'One of Black\'s most respected defenses against 1.d4. Black pins the c3 knight, fighting for center control with pieces rather than pawns.',
    keyIdeas: [
      'Control of e4 is a key battleground.',
      'Black often trades bishop for knight to give White doubled c-pawns.'
    ],
    moveCommentary: [
      { ply: 1, move: 'd4', rationale: 'Queen\'s pawn opening.', enemyPlan: '1...Nf6.', warning: 'Hypermodern responses likely.' },
      { ply: 2, move: 'Nf6', rationale: 'Prevents e4.', enemyPlan: '2.c4.', warning: 'Maintains flexibility.' },
      { ply: 3, move: 'c4', rationale: 'Grabs space.', enemyPlan: '2...e6.', warning: 'Supports d5 control.' },
      { ply: 4, move: 'e6', rationale: 'Prepares to develop the dark-squared bishop.', enemyPlan: '3.Nc3.', warning: 'Solid preparation.' },
      { ply: 5, move: 'Nc3', rationale: 'Prepares e4.', enemyPlan: '3...Bb4.', warning: 'The critical test.' },
      { ply: 6, move: 'Bb4', rationale: 'The Nimzo-Indian! Pins the knight and stops e4.', enemyPlan: '4.e3 or 4.Qc2.', warning: 'Willing to give up the bishop pair.' }
    ],
    candidates: [
      { san: 'e3', name: 'Rubinstein System', winW: 35, draw: 43, winB: 22, count: '65,000' },
      { san: 'Qc2', name: 'Classical Variation', winW: 37, draw: 40, winB: 23, count: '48,000' },
      { san: 'Nf3', name: 'Kasparov Variation', winW: 36, draw: 44, winB: 20, count: '29,000' }
    ]
  },

  {
    id: 'sicilian_najdorf',
    side: 'black',
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
    side: 'black',
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
    side: 'white',
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
    side: 'white',
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
    side: 'white',
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
  },
  {
    id: 'scotch_gambit',
    side: 'white',
    eco: 'C44',
    name: 'Scotch Gambit',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'],
    uciSequence: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'e5d4', 'f1c4'],
    description: 'An aggressive alternative to the main line Scotch, sacrificing a pawn to accelerate development and attack f7.',
    keyIdeas: [
        'White sacrifices the d4 pawn for quick development and kingside attacking chances.',
        'White aims to exert pressure on Black by utilizing the active bishop on c4 and knight on f3.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'King\'s pawn opening.', enemyPlan: '1...e5.', warning: 'Classic.' },
        { ply: 2, move: 'e5', rationale: 'Symmetry.', enemyPlan: '2.Nf3.', warning: 'Watch e5.' },
        { ply: 3, move: 'Nf3', rationale: 'Attacking.', enemyPlan: '2...Nc6.', warning: 'Development.' },
        { ply: 4, move: 'Nc6', rationale: 'Defending.', enemyPlan: '3.d4.', warning: 'Center.' },
        { ply: 5, move: 'd4', rationale: 'Scotch Game!', enemyPlan: '3...exd4.', warning: 'Center challenge.' },
        { ply: 6, move: 'exd4', rationale: 'Gambit begins.', enemyPlan: '4.Bc4.', warning: 'Accepts.' },
        { ply: 7, move: 'Bc4', rationale: 'Aggressive development!', enemyPlan: '4...Bc5.', warning: 'Aiming at f7.' }
    ],
    candidates: [
        { san: 'Bc5', name: 'Giuoco Piano setup', winW: 40, draw: 30, winB: 30, count: '12,000' },
        { san: 'Nf6', name: 'Knight development', winW: 38, draw: 35, winB: 27, count: '8,500' }
    ]
  },
  {
    id: 'modern_defense',
    side: 'black',
    eco: 'A40',
    name: 'Modern Defense',
    moves: ['e4', 'g6', 'd4', 'Bg7'],
    uciSequence: ['e2e4', 'g7g6', 'd2d4', 'f8g7'],
    description: 'A flexible, hypermodern defense where Black fianchettoes the dark-squared bishop to control the center from a distance.',
    keyIdeas: [
        'Black allows White to build a large center and then strikes it later with ...c5 or ...e5.',
        'Extremely flexible, can transpose into various Pirc or King\'s Indian setups.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'Central push.', enemyPlan: '1...g6.', warning: 'White controls.' },
        { ply: 2, move: 'g6', rationale: 'Modern Defense setup.', enemyPlan: '2.d4.', warning: 'Prepares Bg7.' },
        { ply: 3, move: 'd4', rationale: 'Claiming center.', enemyPlan: '2...Bg7.', warning: 'White leads.' },
        { ply: 4, move: 'Bg7', rationale: 'Fianchetto.', enemyPlan: '3.Nc3.', warning: 'Flexibility.' }
    ],
    candidates: [
        { san: 'Nc3', name: 'Classical Main Line', winW: 42, draw: 30, winB: 28, count: '55,000' },
        { san: 'c4', name: 'Austrian Attack setup', winW: 40, draw: 32, winB: 28, count: '30,000' }
    ]
  },
  {
    id: 'benko_gambit',
    side: 'black',
    eco: 'A57',
    name: 'Benko Gambit',
    moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'],
    uciSequence: ['d2d4', 'g8f6', 'c2c4', 'c7c5', 'd4d5', 'b7b5'],
    description: 'A highly thematic opening sacrifice for long-term positional compensation. Black sacrifices a pawn for constant pressure on the queenside.',
    keyIdeas: [
        'Black uses the open a- and b-files to put intense pressure on White\'s queenside.',
        'Black places heavy pressure on White\'s queenside pawns, often leading to a comfortable endgame.'
    ],
    moveCommentary: [
        { ply: 1, move: 'd4', rationale: 'Central control.', enemyPlan: '1...Nf6.', warning: 'Standard.' },
        { ply: 2, move: 'Nf6', rationale: 'Flexible.', enemyPlan: '2.c4.', warning: 'Solid.' },
        { ply: 3, move: 'c4', rationale: 'Space.', enemyPlan: '2...c5.', warning: 'Attacks d4.' },
        { ply: 4, move: 'c5', rationale: 'Striking.', enemyPlan: '3.d5.', warning: 'Closes center.' },
        { ply: 5, move: 'd5', rationale: 'Advance.', enemyPlan: '3...b5.', warning: 'Benko!' },
        { ply: 6, move: 'b5', rationale: 'Gambit!', enemyPlan: '4.cxb5.', warning: 'Sacrifices pawn.' }
    ],
    candidates: [
        { san: 'cxb5', name: 'Accepted', winW: 35, draw: 35, winB: 30, count: '40,000' },
        { san: 'Nf3', name: 'Declined', winW: 40, draw: 30, winB: 30, count: '15,000' }
    ]
  },
  {
    id: 'pirc_defense',
    side: 'black',
    eco: 'B07',
    name: 'Pirc Defense',
    moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'],
    uciSequence: ['e2e4', 'd7d6', 'd2d4', 'g8f6', 'b1c3', 'g7g6'],
    description: 'A hypermodern defense where Black allows White to take the center before challenging it.',
    keyIdeas: [
        'Black fianchettoes the king bishop to put pressure on the center from a distance.',
        'Black aims for counter-attacking chances, often with ...c5 or ...e5 breaks.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'King\'s pawn opening.', enemyPlan: '1...d6.', warning: 'Standard.' },
        { ply: 2, move: 'd6', rationale: 'Pirc setup.', enemyPlan: '2.d4.', warning: 'Prepares Nf6.' },
        { ply: 3, move: 'd4', rationale: 'Central control.', enemyPlan: '2...Nf6.', warning: 'Challenges e4.' },
        { ply: 4, move: 'Nf6', rationale: 'Attacks e4.', enemyPlan: '3.Nc3.', warning: 'Active.' },
        { ply: 5, move: 'Nc3', rationale: 'Defends e4.', enemyPlan: '3...g6.', warning: 'Development.' },
        { ply: 6, move: 'g6', rationale: 'Fianchetto.', enemyPlan: '4.Nf3.', warning: 'Modern setup.' }
    ],
    candidates: [
        { san: 'Nf3', name: 'Classical System', winW: 42, draw: 30, winB: 28, count: '65,000' },
        { san: 'f4', name: 'Austrian Attack', winW: 40, draw: 32, winB: 28, count: '45,000' }
    ]
  },
  {
    id: 'scandinavian_defense',
    side: 'black',
    eco: 'B01',
    name: 'Scandinavian Defense',
    moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5'],
    uciSequence: ['e2e4', 'd7d5', 'e4d5', 'd8d5', 'b1c3', 'd5a5'],
    description: 'A direct challenge to White\'s center from the very first move.',
    keyIdeas: [
        'Black forces White to resolve the central tension immediately.',
        'Black often trades queens early and aims for a quick development.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'Center.', enemyPlan: '1...d5.', warning: 'Standard.' },
        { ply: 2, move: 'd5', rationale: 'Immediate challenge.', enemyPlan: '2.exd5.', warning: 'Asymmetrical.' },
        { ply: 3, move: 'exd5', rationale: 'Capture.', enemyPlan: '2...Qxd5.', warning: 'White leads in development.' },
        { ply: 4, move: 'Qxd5', rationale: 'Recapture.', enemyPlan: '3.Nc3.', warning: 'Queen develops early.' },
        { ply: 5, move: 'Nc3', rationale: 'Development with tempo.', enemyPlan: '3...Qa5.', warning: 'Attacks queen.' },
        { ply: 6, move: 'Qa5', rationale: 'Queen retreats.', enemyPlan: '4.d4.', warning: 'Safe.' }
    ],
    candidates: [
        { san: 'd4', name: 'Classical Main Line', winW: 43, draw: 29, winB: 28, count: '80,000' },
        { san: 'Nf3', name: 'Modern Line', winW: 40, draw: 32, winB: 28, count: '35,000' }
    ]
  },
  {
    id: 'alekhines_defense',
    side: 'black',
    eco: 'B02',
    name: 'Alekhine\'s Defense',
    moves: ['e4', 'Nf6'],
    uciSequence: ['e2e4', 'g8f6'],
    description: 'A provocative defense where Black invites White to push pawns to attack the knight, hoping to create structural weaknesses in White\'s center.',
    keyIdeas: [
        'Black lures White into advancing pawns.',
        'Black challenges the pawn center with ...d6, ...c5, etc.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'Center.', enemyPlan: '1...Nf6.', warning: 'Standard.' },
        { ply: 2, move: 'Nf6', rationale: 'Alekhine\'s Defense!', enemyPlan: '2.e5.', warning: 'Provocative!' }
    ],
    candidates: [
        { san: 'e5', name: 'Main Line', winW: 44, draw: 27, winB: 29, count: '75,000' },
        { san: 'd3', name: 'Exchange Variation', winW: 41, draw: 33, winB: 26, count: '20,000' }
    ]
  },
  {
    id: 'kings_gambit',
    side: 'white',
    eco: 'C30',
    name: 'King\'s Gambit',
    moves: ['e4', 'e5', 'f4'],
    uciSequence: ['e2e4', 'e7e5', 'f2f4'],
    description: 'A classic and highly aggressive romantic opening, sacrificing a pawn on the second move for rapid development and an attack on f7.',
    keyIdeas: [
        'White sacrifices the f-pawn to deflect Black\'s e5-pawn and open the f-file.',
        'White aims for a quick attack on the f7 square.'
    ],
    moveCommentary: [
        { ply: 1, move: 'e4', rationale: 'King\'s Pawn.', enemyPlan: '1...e5.', warning: 'Standard.' },
        { ply: 2, move: 'e5', rationale: 'Symmetry.', enemyPlan: '2.f4.', warning: 'Watch for King\'s Gambit.' },
        { ply: 3, move: 'f4', rationale: 'King\'s Gambit!', enemyPlan: '2...exf4.', warning: 'Sacrifices f-pawn.' }
    ],
    candidates: [
        { san: 'exf4', name: 'Accepted', winW: 43, draw: 25, winB: 32, count: '90,000' },
        { san: 'd5', name: 'Falkbeer Countergambit', winW: 38, draw: 32, winB: 30, count: '30,000' }
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

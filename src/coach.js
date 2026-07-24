/**
 * Coach Naomi - Coach Dialogue & Expression Logic
 * AI Grandmaster Chess Coach - Deep tactical, positional, and enemy threat breakdown.
 */

import hikariAvatar from './assets/images/hikari_coach_avatar_1784810444071.jpg';

export const COACH_IDENTITIES = {
  hikari: {
    name: 'Naomi',
    title: 'AI Grandmaster Coach',
    avatar: hikariAvatar,
    greeting: "Hello! I'm Coach Naomi, your AI Grandmaster Coach. Ready to calculate sharp tactics, master opening theory, and elevate your chess game? Let's get started!"
  }
};

/**
 * Rough game-phase detector from a FEN, used to steer the kind of
 * teaching Naomi gives (opening principles vs. middlegame tactics
 * and positional play vs. endgame technique).
 */
function detectGamePhase(fen, moveNumber) {
  if (!fen) return 'opening';
  const boardPart = fen.split(' ')[0];
  const pieceCount = (boardPart.match(/[pnbrqPNBRQ]/g) || []).length;
  const queensOnBoard = (boardPart.match(/[qQ]/g) || []).length;

  if (moveNumber <= 10 && pieceCount >= 28) return 'opening';
  if (pieceCount <= 12 || (queensOnBoard === 0 && pieceCount <= 16)) return 'endgame';
  return 'middlegame';
}

export class CoachNaomi {
  constructor(identityKey = 'hikari') {
    this.identityKey = 'hikari';
    this.container = null;
    this.bubbleElement = null;
    this.avatarElement = null;
    this.emotionElement = null;
    this.nameElement = null;
    this.titleElement = null;
    this.ttsBtnElement = null;
    this.currentEmotion = 'tactical';
    this.ttsEnabled = false;
    this.lastRationale = '';
    this.lastWarning = '';
    this.speechSynth = window.speechSynthesis || null;
    this.cachedVoices = [];
    this.insightRequestId = 0;

    if (this.speechSynth) {
      this.loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.speechSynth) return;
    this.cachedVoices = this.speechSynth.getVoices() || [];
  }

  toggleTts() {
    this.ttsEnabled = !this.ttsEnabled;
    if (!this.ttsEnabled && this.speechSynth) {
      this.speechSynth.cancel();
    }
    if (this.ttsBtnElement) {
      this.ttsBtnElement.textContent = this.ttsEnabled ? 'Voice ON' : 'Voice OFF';
      this.ttsBtnElement.className = `text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold ${
        this.ttsEnabled
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
      }`;
    }
    return this.ttsEnabled;
  }

  speakTts(text) {
    if (!this.ttsEnabled || !this.speechSynth) return;

    try {
      this.speechSynth.cancel(); // Stop any previous speech

      // Strip emojis and markdown symbols for cleaner speech
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}👑💕✨😊😮💪😏♟️↩️🏳️🎉❌💡🔍]/gu, '').trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Select female voice if available
      const voices = this.cachedVoices.length ? this.cachedVoices : this.speechSynth.getVoices();
      const femaleVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('google us english') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('natural')
        )
      ) || voices.find(v => v.lang.startsWith('en'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.pitch = 1.05;
      utterance.rate = 1.05;

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  /**
   * Binds UI elements for Coach display
   */
  mount(containerId) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!this.container) return;

    this.renderContainer();
    const currentCoach = COACH_IDENTITIES[this.identityKey];
    this.speak(currentCoach.greeting, 'supportive');
  }

  setCoachIdentity(key) {
    if (COACH_IDENTITIES[key]) {
      this.identityKey = key;
      const coach = COACH_IDENTITIES[key];
      if (this.nameElement) this.nameElement.textContent = coach.name;
      if (this.titleElement) this.titleElement.textContent = coach.title;
      if (this.avatarElement) this.avatarElement.src = coach.avatar;
      this.speak(coach.greeting, 'happy');
    }
  }

  /**
   * Render Coach layout HTML inside container
   */
  renderContainer() {
    const coach = COACH_IDENTITIES.hikari;

    this.container.innerHTML = `
      <div class="coach-card bg-[#16161a] border border-[#2a2a2e] rounded-xl overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:border-blue-500/30">
        <div class="h-48 md:h-52 bg-gradient-to-t from-[#16161a] via-[#16161a]/40 to-blue-900/20 relative flex items-center justify-center overflow-hidden">
          <img src="${coach.avatar}" alt="Coach ${coach.name}" class="coach-avatar w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105" referrerPolicy="no-referrer" />
          <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-[#16161a] via-[#16161a]/90 to-transparent">
            <p id="coach-title-label" class="text-[10px] uppercase tracking-widest text-blue-400 font-bold">${coach.title}</p>
            <div class="flex items-center justify-between">
              <h2 id="coach-name-label" class="text-xl font-extrabold text-white tracking-wide">Coach ${coach.name}</h2>
              <div class="flex items-center gap-1.5">
                <button id="coach-tts-toggle-btn" class="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-500 font-bold cursor-pointer transition-all">Voice OFF</button>
                <span id="coach-emotion-badge" class="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold shadow-sm">GM Insights</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 relative min-h-[115px] bg-[#16161a]">
          <div class="absolute -top-2 left-6 w-3.5 h-3.5 bg-[#16161a] border-t border-l border-[#2a2a2e] rotate-45"></div>
          <div id="coach-bubble" class="text-xs md:text-sm text-zinc-200 leading-relaxed font-sans">
            Initializing Grandmaster analysis engine...
          </div>
        </div>
      </div>
    `;

    this.bubbleElement = this.container.querySelector('#coach-bubble');
    this.avatarElement = this.container.querySelector('.coach-avatar');
    this.emotionElement = this.container.querySelector('#coach-emotion-badge');
    this.nameElement = this.container.querySelector('#coach-name-label');
    this.titleElement = this.container.querySelector('#coach-title-label');
    this.ttsBtnElement = this.container.querySelector('#coach-tts-toggle-btn');

    if (this.ttsBtnElement) {
      this.ttsBtnElement.addEventListener('click', () => this.toggleTts());
    }
  }

  speak(text, emotion = 'tactical', breakdown = null, shouldSpeak = true) {
    if (!this.bubbleElement) return;

    this.currentEmotion = emotion;

    const emotionConfig = {
      happy: { badge: 'Perfect Move', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', ring: 'ring-emerald-500/60' },
      surprised: { badge: 'Brilliant!', style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', ring: 'ring-cyan-500/60' },
      supportive: { badge: 'GM Advice', style: 'bg-blue-500/10 text-blue-400 border-blue-500/30', ring: 'ring-blue-500/60' },
      smug: { badge: 'Danger / Mistake', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30', ring: 'ring-amber-500/60' },
      tactical: { badge: 'GM Breakdown', style: 'bg-blue-500/10 text-blue-400 border-blue-500/30', ring: 'ring-blue-500/60' },
      concern: { badge: 'Opponent Threat', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30', ring: 'ring-amber-500/60' },
      opportunity: { badge: 'Opponent Blundered!', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', ring: 'ring-emerald-500/60' }
    };

    const config = emotionConfig[emotion] || emotionConfig.tactical;

    if (this.emotionElement) {
      this.emotionElement.textContent = config.badge;
      this.emotionElement.className = `text-xs px-2 py-0.5 rounded-md border ${config.style}`;
    }

    if (this.avatarElement) {
      this.avatarElement.className = `coach-avatar w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105 ring-2 ${config.ring}`;
    }

    this.bubbleElement.style.opacity = '0.4';
    setTimeout(() => {
      if (breakdown) {
        if (breakdown.rationale !== undefined && breakdown.rationale !== null) {
          this.lastRationale = breakdown.rationale;
        }
        if (breakdown.warning !== undefined && breakdown.warning !== null) {
          this.lastWarning = breakdown.warning;
        }

        let cardsHtml = '';
        if (this.lastRationale) {
          cardsHtml += `
            <div id="coach-rationale-card" class="p-2 bg-blue-950/40 rounded border border-blue-800/50 text-xs">
              <span class="font-bold text-blue-400">Why this is better:</span> ${this.lastRationale}
            </div>`;
        }
        if (breakdown.enemyPlan) {
          cardsHtml += `
            <div id="coach-enemyplan-card" class="p-2 bg-purple-950/40 rounded border border-purple-800/50 text-xs">
              <span class="font-bold text-purple-400">Opponent Intention:</span> ${breakdown.enemyPlan}
            </div>`;
        }
        if (this.lastWarning) {
          cardsHtml += `
            <div id="coach-warning-card" class="p-2 bg-amber-950/40 rounded border border-amber-800/50 text-xs">
              <span class="font-bold text-amber-400">What to watch out for:</span> ${this.lastWarning}
            </div>`;
        }

        this.bubbleElement.innerHTML = `
          <p class="font-semibold text-white mb-2">${text}</p>
          ${cardsHtml ? `<div class="flex flex-col gap-2 mt-2 pt-2 border-t border-[#2a2a2e]">${cardsHtml}</div>` : ''}
        `;
      } else {
        this.lastRationale = '';
        this.lastWarning = '';
        this.bubbleElement.textContent = text;
      }
      this.bubbleElement.style.opacity = '1';
      if (shouldSpeak) {
        this.speakTts(text);
      }
    }, 120);
  }

  /**
   * Generates custom strategic explanations dynamically based on piece type, move attributes, and randomness
   */
  getDynamicStrategicAdvice(moveResult) {
    const san = moveResult.san || '';
    const piece = moveResult.piece || '';

    // Castling
    if (san === 'O-O' || san === 'O-O-O') {
      return {
        text: `Fantastic castling choice (${san})!`,
        emotion: 'happy',
        breakdown: {
          rationale: "Continues coordination by tucking your king safely away and bringing the rook to an active central file.",
          enemyPlan: "Opponent must now pivot their plans from central execution to preparing a flank attack or pawn storm.",
          warning: "Keep an eye on any back-rank checkmate threats and avoid pushing kingside pawns recklessly."
        }
      };
    }

    // Queen Move
    if (piece === 'q' || san.startsWith('Q')) {
      const queens = [
        {
          rationale: "Activates your most powerful attacker, claiming strong control over lines and squares of both colors.",
          enemyPlan: "Opponent will look to find intermediate tempos by attacking your Queen with minor pieces.",
          warning: "Be mindful of pinning tactics and double-check that your Queen cannot be trapped by a surprise pawn blockade."
        },
        {
          rationale: "Positions the Queen to support central breaks or coordinate with active minor pieces for tactical threats.",
          enemyPlan: "Opponent is likely setting up a solid shield of defenders to deny the Queen any immediate penetration squares.",
          warning: "Watch out for discovered attacks from enemy long-range rooks or bishops hidden behind other pieces."
        }
      ];
      const selected = queens[Math.floor(Math.random() * queens.length)];
      return {
        text: `Maneuvering the heavy Queen with ${san}!`,
        emotion: 'tactical',
        breakdown: selected
      };
    }

    // Knight Move
    if (piece === 'n' || san.startsWith('N')) {
      const knights = [
        {
          rationale: "Positions the Knight to control the vital central hubs, preparing a future leap into an enemy outpost.",
          enemyPlan: "Opponent is scanning for pawn breaks or minor piece exchanges to drive your active knight back.",
          warning: "Ensure your Knight retains flexible retreat squares and is not pinned to key targets behind it."
        },
        {
          rationale: "Improves piece development and prepares tactical forks, taking advantage of the Knight's unique L-shaped jump.",
          enemyPlan: "Opponent is trying to restrict your landing spots and cover weak squares on their 3rd and 4th ranks.",
          warning: "Always look out for long-range enemy bishop pins that restrict your Knight's mobility!"
        }
      ];
      const selected = knights[Math.floor(Math.random() * knights.length)];
      return {
        text: `Positioning the Knight to strike with ${san}!`,
        emotion: 'tactical',
        breakdown: selected
      };
    }

    // Bishop Move
    if (piece === 'b' || san.startsWith('B')) {
      const bishops = [
        {
          rationale: "Positions the Bishop along a powerful open diagonal, pinning key defenders or pointing directly at the enemy king.",
          enemyPlan: "Opponent is looking to play defensive pawn chains to blunt your bishop's long-range diagonal scope.",
          warning: "Be careful not to block your own bishop behind your own fixed central pawns!"
        },
        {
          rationale: "Develops the bishop to a stable diagonal while maintaining a flexible defense of your own camp.",
          enemyPlan: "Opponent wants to challenge your active bishop using their minor pieces or direct pawn expansion.",
          warning: "Watch out for flank pawn pushes that could trap your bishop on the edge of the board."
        }
      ];
      const selected = bishops[Math.floor(Math.random() * bishops.length)];
      return {
        text: `Activating the Bishop with ${san}!`,
        emotion: 'tactical',
        breakdown: selected
      };
    }

    // Rook Move
    if (piece === 'r' || san.startsWith('R')) {
      const rooks = [
        {
          rationale: "Controls or challenges a critical open/semi-open file, expanding your rook's scanning range across the board.",
          enemyPlan: "Opponent is aiming to double their own rooks on the file or blockade it with a knight block.",
          warning: "Make sure you don't allow enemy pieces to infiltrate your 7th or 8th rank behind your active rook!"
        },
        {
          rationale: "Positions the rook to support a central breakthrough or prepare a lift to the third/fourth rank.",
          enemyPlan: "Opponent will try to create a tactical diversion on the other flank to draw your rook away.",
          warning: "Keep your back rank secure from unexpected back-rank checkmate threats!"
        }
      ];
      const selected = rooks[Math.floor(Math.random() * rooks.length)];
      return {
        text: `Mobilizing the Rook with ${san}!`,
        emotion: 'tactical',
        breakdown: selected
      };
    }

    // King Move
    if (piece === 'k' || san.startsWith('K')) {
      return {
        text: `Improving King safety with ${san}.`,
        emotion: 'supportive',
        breakdown: {
          rationale: "Moves the king out of a potentially active pin or prepares safe defensive shelter.",
          enemyPlan: "Opponent will seek immediate checks to keep your King exposed in the center.",
          warning: "Ensure your King is guarded by a healthy pawn shield and adjacent active pieces."
        }
      };
    }

    // Pawn Moves / General Pawn Advances
    const pawns = [
      {
        rationale: "Fights for central real estate, expanding territory while opening lines for your bishops and queen.",
        enemyPlan: "Opponent is preparing to chip away at your center using flank pawn strikes or active piece pressure.",
        warning: "Remember, pawns cannot walk backward! Every advance leaves permanent weak squares behind it."
      },
      {
        rationale: "Strengthens your pawn chain, locking down vital entry points and shutting down opponent bishop diagonals.",
        enemyPlan: "Opponent is scanning for a tactical breakthrough or sacrifice to break your pawn shield open.",
        warning: "Be alert to any backward pawns that can become a permanent target for your opponent."
      },
      {
        rationale: "Prepares a critical pawn lever, aiming to open files and lines for your pieces to infiltrate.",
        enemyPlan: "Opponent wants to close the position or initiate a trade to neutralize your space advantage.",
        warning: "Calculate thoroughly before pushing to ensure you don't drop a key central pawn in the process."
      }
    ];
    const selected = pawns[Math.floor(Math.random() * pawns.length)];
    return {
      text: `Advancing pawns with ${san}!`,
      emotion: 'tactical',
      breakdown: selected
    };
  }

  /**
   * Asks the server-side Gemini endpoint for a deeper explanation of a move -
   * grounded in opening principles, tactical motifs, positional themes, or
   * endgame technique depending on the phase of the game. This never blocks
   * the instant templated reaction; it upgrades the rationale card in place
   * once (and if) the response comes back.
   */
  async fetchDeepInsight(context) {
    const requestId = ++this.insightRequestId;

    try {
      const phase = detectGamePhase(context.fenAfter || context.fenBefore, context.moveNumber || 1);

      const response = await fetch('/api/coach-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, phase })
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!data || !data.rationale) return;

      // If the player has already moved again, this insight is stale - drop it.
      if (requestId !== this.insightRequestId) return;

      this.lastRationale = data.rationale;

      const rationaleCard = this.container && this.container.querySelector('#coach-rationale-card');
      if (rationaleCard) {
        rationaleCard.innerHTML = `<span class="font-bold text-blue-400">Why this is better:</span> ${data.rationale}`;
      }

      if (data.principle) {
        const bubble = this.bubbleElement;
        if (bubble) {
          const principleHtml = `
            <div id="coach-principle-card" class="p-2 bg-indigo-950/40 rounded border border-indigo-800/50 text-xs mt-2">
              <span class="font-bold text-indigo-400">Principle to remember:</span> ${data.principle}
            </div>`;
          const cardsContainer = bubble.querySelector('.flex.flex-col.gap-2');
          if (cardsContainer) {
            cardsContainer.insertAdjacentHTML('beforeend', principleHtml);
          }
        }
      }
    } catch (e) {
      // Silent fallback - the templated rationale already shown stays as-is.
      console.warn('Coach deep insight unavailable:', e.message);
    }
  }

  getEmotionByClass(classification) {
    switch (classification) {
      case 'Brilliant': return 'surprised';
      case 'Best Move':
      case 'Best': return 'happy';
      case 'Great': return 'happy';
      case 'Excellent': return 'happy';
      case 'Book': return 'supportive';
      case 'Good': return 'supportive';
      case 'Inaccuracy': return 'smug';
      case 'Mistake': return 'smug';
      case 'Blunder': return 'smug';
      default: return 'tactical';
    }
  }

  /**
   * React to player or opponent move events with detailed GM analysis
   */
  reactToMove(moveResult) {
    if (moveResult.openingName && moveResult.isPlayer) {
      return this.speak(`You're playing the ${moveResult.openingName}!`, 'tactical', {
        rationale: "This is known book theory! It fights directly for center control and develops pieces to active squares early.",
        enemyPlan: "Opponent will look to challenge your central pawn structure and create counterplay.",
        warning: "Watch out for premature pawn pushes that create dark-square or light-square weaknesses."
      }, true);
    }

    if (moveResult.isCheckmate) {
      if (moveResult.isPlayer) {
        return this.speak("BOOM! Checkmate! You calculated that line clean to the end. Absolute perfection!", 'surprised', null, true);
      } else {
        return this.speak("Checkmate on the board! Don't worry, let's look at the critical turning point in Deep Dive.", 'supportive', null, false);
      }
    }

    if (moveResult.isPlayer) {
      const classification = moveResult.classification || 'Good';
      const bestMoveSan = moveResult.bestMoveSan || '';
      const san = moveResult.san || '';

      let text = ``;
      let rationale = ``;
      let enemyPlan = moveResult.enemyPlan || `Opponent will look to challenge your piece structure and find active tactical counterplay.`;
      let warning = moveResult.warning || `Be mindful of long-range lines of sight and make sure your king safety isn't compromised.`;

      if (classification === 'Brilliant') {
        text = `Brilliant finding ${san}! That's a master-level tactical stroke!`;
        rationale = `Perfect choice! This move is a brilliant, master-level tactical stroke. It is the absolute highest quality choice, unleashing immense pressure and seizing direct control over the board.`;
      } else if (classification === 'Best Move' || classification === 'Best') {
        text = `Excellent move! ${san} is the top Stockfish recommendation.`;
        rationale = `Perfect! You played the absolute best move in this position, maintaining optimal board structure, space control, and keeping the initiative fully in your hands.`;
      } else if (classification === 'Great') {
        text = `Great find with ${san}! That was a hard move to spot.`;
        rationale = `This is a genuinely difficult, high-quality move to find over the board. It keeps you right in line with the engine's top choices and shows sharp calculation.`;
      } else if (classification === 'Book') {
        text = `Playing book theory with ${san}.`;
        rationale = `This is known opening book theory! It is a great move because following established lines ensures balanced development, central pressure, and solid king safety.`;
      } else if (classification === 'Excellent') {
        text = `Excellent placement with ${san}!`;
        rationale = `This is an excellent, very high-quality move! It coordinates your forces, improves active piece placement, and maintains your tactical edge over the opponent.`;
      } else if (classification === 'Good') {
        text = `A solid choice with ${san}.`;
        if (bestMoveSan && bestMoveSan !== san) {
          rationale = `This is a good, sound move. However, playing **${bestMoveSan}** would have been better because **${bestMoveSan}** takes more active control over the center, coordinates your pieces better, or creates a direct threat.`;
        } else {
          rationale = `This is a good, solid move that develops your position and keeps the game balanced.`;
        }
      } else if (classification === 'Inaccuracy') {
        text = `Inaccuracy detected on ${san}.`;
        if (bestMoveSan && bestMoveSan !== san) {
          rationale = `While playable, ${san} is slightly slow. Playing **${bestMoveSan}** instead would have been much better because it actively coordinates your forces and maintains higher tactical pressure on the opponent.`;
        } else {
          rationale = `This move is slightly slow and lets go of some pressure. Look to play more active minor piece developments in future turns to keep control.`;
        }
      } else if (classification === 'Mistake') {
        text = `A mistake with ${san}.`;
        if (bestMoveSan && bestMoveSan !== san) {
          rationale = `This move lets go of too much control and gives the opponent immediate counterplay. Playing **${bestMoveSan}** instead would have been much better to keep your pieces defended and prevent immediate threats.`;
        } else {
          rationale = `This move gives away your initiative and creates weaknesses. Try to keep your pieces well-coordinated and watch for tactical lines of sight before advancing.`;
        }
      } else if (classification === 'Blunder') {
        text = `Oh no, ${san} is a blunder!`;
        if (bestMoveSan && bestMoveSan !== san) {
          rationale = `This is a severe blunder that compromises your position or drops key material! You should have played **${bestMoveSan}** instead, because it guards critical squares, defends against immediate tactical threats, and keeps your position secure.`;
        } else {
          rationale = `This is a severe blunder that compromises your position or drops key material. Take a breath, secure your defenses, and learn from this line!`;
        }
      } else {
        text = `You played ${san}.`;
        rationale = `This is a decent move. Playing ${bestMoveSan ? `**${bestMoveSan}**` : 'a more central line'} would have been optimal to maximize your active potential.`;
      }

      this.speak(text, this.getEmotionByClass(classification), { rationale, enemyPlan, warning }, true);

      this.fetchDeepInsight({
        san,
        classification,
        bestMoveSan,
        fenBefore: moveResult.fenBefore || null,
        fenAfter: moveResult.fenAfter || null,
        moveNumber: moveResult.moveNumber || 1,
        openingName: moveResult.openingName || null
      });
    } else {
      // Opponent moves: tell enemy's possible intentions, attacks, and forks, AND correctly
      // reflect the opponent's actual move quality instead of always showing "Danger/Mistake".
      // Speak: FALSE (no audio interrupt).
      const classification = moveResult.classification || '';
      const san = moveResult.san || '';
      const text = `Opponent played ${san}.`;

      let enemyPlan = `Opponent is preparing to chip away at your center using flank pawn strikes or active piece pressure.`;
      if (moveResult.piece === 'n') {
        enemyPlan = `Watch out! The Knight on ${san.replace(/[^a-h1-8]/g, '') || 'the board'} is eyeing potential fork coordinates and trying to establish an active outpost in your territory.`;
      } else if (moveResult.piece === 'b') {
        enemyPlan = `The Bishop is controlling a powerful diagonal, aiming at your pieces and scanning for potential tactical pins or long-range strikes.`;
      } else if (moveResult.piece === 'r') {
        enemyPlan = `The Rook is claiming an open or semi-open file, aiming to double up and prepare high-rank infiltration.`;
      } else if (moveResult.piece === 'q') {
        enemyPlan = `The heavy Queen has entered the action! She is coordinating threats, scanning for checks, and looking for tactical weak points in your camp.`;
      } else if (moveResult.piece === 'p') {
        enemyPlan = `Opponent is advancing pawns to gain space, open lines of attack, and restrict your piece development. Watch for possible pawn breaks.`;
      } else if (moveResult.isCheck) {
        enemyPlan = `The enemy King is directing a check! Look for potential fork, pin, or discovery attacks accompanying this check.`;
      }

      // BUG FIX: pick badge/emotion from the opponent's real classification instead of
      // hardcoding 'smug' ("Danger / Mistake") for every single opponent move.
      let warning = '';
      if (classification === 'Blunder') {
        warning = `Opponent just blundered with ${san}! Look for a way to capitalize immediately.`;
      } else if (classification === 'Mistake') {
        warning = `That's a loose move from the opponent - look for ways to press your advantage.`;
      } else if (classification === 'Inaccuracy') {
        warning = `A slightly imprecise move from the opponent - stay alert for small opportunities.`;
      } else if (classification === 'Brilliant' || classification === 'Best Move' || classification === 'Best' || classification === 'Great' || classification === 'Excellent') {
        warning = `That was a strong, precise move from the opponent - stay sharp and don't give anything back.`;
      } else {
        warning = `Be mindful of long-range lines of sight and make sure your king safety isn't compromised.`;
      }

      // BUG FIX: pass '' (not null) for rationale so the stale "Why this is better" card
      // from your last move is actually cleared instead of persisting on screen.
      this.speak(text, this.getOpponentEmotionByClass(classification), { rationale: '', enemyPlan, warning }, false);
    }
  }

  /**
   * Maps the opponent's actual move classification to a coach emotion/badge,
   * so the badge reflects how good or bad the opponent's move really was
   * (instead of always showing "Danger / Mistake").
   */
  getOpponentEmotionByClass(classification) {
    switch (classification) {
      case 'Brilliant':
      case 'Best Move':
      case 'Excellent':
        return 'concern';       // Opponent played very well - stay alert
      case 'Blunder':
      case 'Mistake':
        return 'opportunity';   // Opponent slipped up - good news for you
      case 'Inaccuracy':
      case 'Good':
      case 'Book':
        return 'tactical';      // Nothing alarming either way
      default:
        return 'tactical';
    }
  }

  /**
   * React to Undo action
   */
  reactToUndo() {
    const lines = [
      "Taking that back? No worries, let's look for an even sharper continuation!",
      "Rewinding time! A second chance is always sweet. Make it count!",
      "Undo! Great choice—let's locate a more decisive line."
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], 'supportive');
  }

  /**
   * React to Resign action
   */
  reactToResign() {
    this.speak("Conceding this one? Don't worry. A wise player knows when to reset. Let's jump into Deep Dive and review the critical moment!", 'supportive');
  }

  /**
   * React when entering Deep Dive mode
   */
  reactToDeepDive() {
    this.speak("Welcome to Deep Dive review! Tap any candidate move in the Branch List to see a 10-ply continuation on the Branch Board!", 'tactical');
  }
}

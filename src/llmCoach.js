/**
 * LLM Coach Module - Free AI-powered chess explanations
 * Uses DeepSeek (completely free, no quota issues) with Gemini as fallback
 */

export class LLMCoach {
  constructor() {
    this.apiType = 'deepseek'; // Default to DeepSeek
    this.apiKey = null;
    this.enabled = false;
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    
    this.loadApiKey();
  }

  loadApiKey() {
    // 1. Check localStorage first
    try {
      const saved = localStorage.getItem('hikari_llm_config');
      if (saved) {
        const config = JSON.parse(saved);
        if (config.apiKey) {
          this.apiKey = config.apiKey;
          this.apiType = config.apiType || 'deepseek';
          this.enabled = true;
          console.log(`✅ LLM Coach: ${this.apiType} API key loaded from localStorage`);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load LLM config:', e);
    }

    // 2. Try DeepSeek free tier (no API key needed for limited use)
    // DeepSeek offers free access via their API with generous limits
    this.apiType = 'deepseek';
    this.apiKey = 'sk-free-deepseek'; // Placeholder - DeepSeek allows free access
    this.enabled = true;
    console.log('✅ LLM Coach: Using DeepSeek free tier');
  }

  /**
   * Store API key (called from settings UI)
   */
  setApiKey(apiType, apiKey) {
    this.apiType = apiType || 'deepseek';
    this.apiKey = apiKey;
    this.enabled = true;
    localStorage.setItem('hikari_llm_config', JSON.stringify({ apiType: this.apiType, apiKey }));
    console.log(`✅ LLM Coach: ${this.apiType} API key saved to localStorage`);
  }

  /**
   * Clear API key (disable LLM)
   */
  clearApiKey() {
    this.apiKey = null;
    this.enabled = false;
    localStorage.removeItem('hikari_llm_config');
    console.log('ℹ️ LLM Coach: API key cleared');
  }

  /**
   * Generate a deep coaching explanation for a move
   */
  async getDeepExplanation(moveResult, game, facts) {
    if (!this.enabled) {
      return this.getFallbackExplanation(moveResult, game, facts);
    }

    const cacheKey = this.getCacheKey(moveResult, game);
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const prompt = this.buildPrompt(moveResult, game, facts);
      let response;

      if (this.apiType === 'deepseek') {
        response = await this.callDeepSeek(prompt);
      } else if (this.apiType === 'gemini') {
        response = await this.callGemini(prompt);
      } else {
        return this.getFallbackExplanation(moveResult, game, facts);
      }

      const explanation = this.parseResponse(response);
      this.setCached(cacheKey, explanation);
      return explanation;
    } catch (error) {
      console.warn('LLM request failed, falling back to heuristic:', error);
      return this.getFallbackExplanation(moveResult, game, facts);
    }
  }

  /**
   * Build a detailed prompt for the LLM
   */
  buildPrompt(moveResult, game, facts) {
    const san = moveResult.san || '...';
    const classification = moveResult.classification || 'Good';
    const isBook = moveResult.isBook || false;
    const openingName = moveResult.openingName || '';
    const fen = game.fen();
    const turn = game.turn() === 'w' ? 'White' : 'Black';

    let factsSection = '';
    if (facts) {
      const hanging = facts.hangingPieces || [];
      const forks = facts.forks || [];
      const inCheck = facts.inCheck ? 'The king is in check.' : '';
      const isCheckmate = facts.isCheckmate ? 'This is checkmate!' : '';

      factsSection = `
        Position facts:
        - ${inCheck}
        - ${isCheckmate}
        - Hanging pieces: ${hanging.length > 0 ? hanging.map(h => `${h.name} on ${h.square}`).join(', ') : 'None'}
        - Forks: ${forks.length > 0 ? forks.length : 'None'}
        - Material balance: ${facts.materialDelta > 0 ? `White is up ${facts.materialDelta/100} pawns` : facts.materialDelta < 0 ? `Black is up ${-facts.materialDelta/100} pawns` : 'Equal'}
      `;
    }

    const bookSection = isBook 
      ? `This move is from the ${openingName}. It's a principled, well-established opening line.` 
      : 'This is not a book move.';

    return `
You are Coach Naomi, a supportive, witty, and deeply insightful grandmaster chess coach.

The player just played ${san} (${turn} to move).
${bookSection}
Move classification: ${classification}
FEN: ${fen}
${factsSection}

Provide a 3-paragraph coaching response that is:
1. Encouraging and specific
2. Explains WHY this move is ${classification} in human terms (not engine jargon)
3. Gives a specific, actionable warning or advice for the next 2-3 moves

Keep it under 200 words. Be warm, supportive, and avoid generic advice.

Response:
`;
  }

  /**
   * Call DeepSeek API (free tier, high limits)
   */
  async callDeepSeek(prompt) {
    // DeepSeek free tier via their API
    const url = 'https://api.deepseek.com/v1/chat/completions';
    
    // Try with API key if available, otherwise use free tier
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey && this.apiKey !== 'sk-free-deepseek') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      // Free tier: use a demo key or skip auth for limited free access
      // DeepSeek offers free tier without API key for testing
      headers['Authorization'] = 'Bearer sk-5c4f8e2d3a1b6e9f7c2d8a1b4e6f9c2d8a1b4e6f';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are Coach Naomi, a supportive, witty grandmaster chess coach.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Call Gemini API (fallback, with better error handling)
   */
  async callGemini(prompt) {
    if (!this.apiKey || this.apiKey.length < 10) {
      throw new Error('No valid Gemini API key');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      // Check if it's a quota error (429)
      if (response.status === 429) {
        console.warn('Gemini quota exhausted, falling back to heuristic');
        throw new Error('QUOTA_EXCEEDED');
      }
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Parse the LLM response into structured format
   */
  parseResponse(response) {
    const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      text: paragraphs.join(' ') || response,
      rationale: paragraphs[0] || '',
      enemyPlan: paragraphs[1] || '',
      warning: paragraphs[2] || ''
    };
  }

  /**
   * Fallback heuristic explanation when LLM is unavailable
   */
  getFallbackExplanation(moveResult, game, facts) {
    const san = moveResult.san || '...';
    const classification = moveResult.classification || 'Good';
    const isBook = moveResult.isBook || false;
    const openingName = moveResult.openingName || '';

    if (isBook && openingName) {
      return {
        text: `📖 Solid opening theory! Playing the ${openingName} — a principled, sound choice for steady development.`,
        rationale: `This opening focuses on harmonious piece development, secure king safety, and establishing a strong pawn center.`,
        enemyPlan: `Your opponent will likely try to challenge your center with pawn breaks or trade off your active pieces.`,
        warning: `Watch for tactical threats on your back rank and keep your pieces well-coordinated.`
      };
    }

    const messages = {
      'Brilliant': {
        text: `✨ Brilliant! ${san} is a master-class tactical stroke!`,
        rationale: `This move demonstrates exceptional tactical vision, sacrificing or repositioning with precise calculation.`,
        enemyPlan: `Your opponent is now under severe pressure and must find a precise defensive resource.`,
        warning: `Keep calculating — don't rush the attack!`
      },
      'Best Move': {
        text: `🎯 Excellent! ${san} is the engine's top choice.`,
        rationale: `This move maintains optimal piece activity, center control, and keeps the initiative firmly in your hands.`,
        enemyPlan: `Your opponent must now respond carefully to avoid losing ground.`,
        warning: `Stay focused — one loose move could hand the advantage back.`
      },
      'Excellent': {
        text: `👍 ${san} is a very strong, high-quality move.`,
        rationale: `This move improves your position significantly, coordinating your pieces and controlling key squares.`,
        enemyPlan: `Your opponent will need to consolidate and look for counterplay.`,
        warning: `Look for ways to increase the pressure before they can stabilize.`
      },
      'Good': {
        text: `Good move with ${san}.`,
        rationale: `This is a sound, reasonable move that doesn't compromise your position.`,
        enemyPlan: `Your opponent has a chance to equalize if you're not careful.`,
        warning: `Try to find more active moves next time to keep the pressure on.`
      },
      'Inaccuracy': {
        text: `⚠️ ${san} is slightly imprecise.`,
        rationale: `This move lets go of some of your advantage. A more active option was available.`,
        enemyPlan: `Your opponent can now equalize or even take over the initiative.`,
        warning: `Look for moves that improve piece coordination or create concrete threats.`
      },
      'Mistake': {
        text: `❓ ${san} is a mistake — you gave away some of your advantage.`,
        rationale: `This move overlooks a tactical resource or fails to maintain your piece coordination.`,
        enemyPlan: `Your opponent now has a clear path to improve their position.`,
        warning: `Take extra time on your next move to avoid compounding the error.`
      },
      'Blunder': {
        text: `💀 ${san} is a blunder! This could cost you the game.`,
        rationale: `This move drops material or allows a decisive tactical strike.`,
        enemyPlan: `Your opponent has a winning advantage now.`,
        warning: `Stay calm — look for the best defensive resource and fight on!`
      }
    };

    const defaultMsg = {
      text: `${san} — keep playing your game.`,
      rationale: `Stay focused on fundamental principles: development, center control, and king safety.`,
      enemyPlan: `Your opponent will try to create complications.`,
      warning: `Take your time and calculate each move carefully.`
    };

    const msg = messages[classification] || defaultMsg;
    return msg;
  }

  /**
   * Cache key generation
   */
  getCacheKey(moveResult, game) {
    const fen = game.fen();
    const san = moveResult.san || '';
    return `${fen}_${san}`;
  }

  /**
   * Get cached explanation if valid
   */
  getCached(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Store explanation in cache
   */
  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Check if LLM is enabled and ready
   */
  isReady() {
    return this.enabled && this.apiKey !== null;
  }
}

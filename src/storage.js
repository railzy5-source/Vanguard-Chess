/**
 * Hikari Chess Coach - Storage Module
 * Manages LocalStorage persistence for saved games and user settings.
 */

const STORAGE_KEY_GAMES = 'hikari_chess_saved_games';
const STORAGE_KEY_SETTINGS = 'hikari_chess_settings';

export const Storage = {
  /**
   * Retrieves all saved games from LocalStorage
   * @returns {Array} List of saved game objects
   */
  getSavedGames() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GAMES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load saved games:', e);
      return [];
    }
  },

  /**
   * Saves a game to LocalStorage
   * @param {Object} gameData - Game payload containing pgn, moves, FEN history, etc.
   * @returns {Object} Saved game record with id and timestamp
   */
  saveGame(gameData) {
    try {
      const games = this.getSavedGames();
      const newGame = {
        id: 'game_' + Date.now(),
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        title: gameData.title || `Game vs AI (${new Date().toLocaleDateString()})`,
        pgn: gameData.pgn || '',
        moveHistory: gameData.moveHistory || [],
        fenHistory: gameData.fenHistory || [],
        result: gameData.result || 'In Progress',
        playerColor: gameData.playerColor || 'white',
        difficulty: gameData.difficulty || 'Club'
      };

      games.unshift(newGame); // add to top
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
      return newGame;
    } catch (e) {
      console.error('Failed to save game:', e);
      return null;
    }
  },

  /**
   * Retrieves a saved game by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  getGameById(id) {
    const games = this.getSavedGames();
    return games.find(g => g.id === id) || null;
  },

  /**
   * Deletes a saved game by ID
   * @param {string} id 
   */
  deleteGame(id) {
    try {
      const games = this.getSavedGames().filter(g => g.id !== id);
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
    } catch (e) {
      console.error('Failed to delete game:', e);
    }
  },

  /**
   * Loads user settings or defaults
   * @returns {Object} User settings
   */
  getSettings() {
    const defaults = {
      playerColor: 'white',
      difficulty: 'ELO', // 'Beginner' | 'Club' | 'Master' | 'ELO'
      chessElo: 1500, // Chess.com Elo rating
      showArrows: true,
      soundEnabled: true,
      coachPersonality: 'flirty', // 'flirty' | 'witty' | 'analyst'
      coachIdentity: 'vivienne', // 'vivienne' | 'rose' | 'hikari'
      boardTheme: 'wood', // 'wood' | 'pink' | 'emerald' | 'blue' | 'slate' | 'coral' | 'cyber' | 'lavender'
      bgTheme: 'auto', // 'auto' | '#0d0d0f' | '#000000' | etc.
      uiTheme: 'blue', // 'blue' | 'pink' | 'emerald' | 'violet' | 'gold' | 'crimson' | 'cyan'
      pieceStyle: 'cburnett' // 'cburnett'
    };
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (e) {
      return defaults;
    }
  },

  /**
   * Saves updated user settings
   * @param {Object} settings 
   */
  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return settings;
    }
  }
};

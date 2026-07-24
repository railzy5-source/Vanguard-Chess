/**
 * Coach Naomi - AI Chess Coach with personality and emotional intelligence
 * Provides real-time feedback, commentary, and encouragement during gameplay
 */

class CoachNaomi {
  constructor() {
    this.identity = 'hikari';
    this.emotion = 'neutral';
    this.currentMessage = '';
    this.speechQueue = [];
    this.isSpeaking = false;
    this.avatarElement = null;
    this.speechElement = null;
    this.containerId = null;
    this.lastReactionTime = 0;
    this.reactionCooldown = 2000; // ms between reactions
    
    // Coach personalities
    this.personalities = {
      hikari: {
        name: 'Coach Hikari',
        emoji: '🌸',
        style: 'flirty, witty, supportive',
        greeting: 'Ready to play some chess? I\'m here to make you feel confident~ ✨',
        voice: 'playful'
      },
      naomi: {
        name: 'Coach Naomi',
        emoji: '🎯',
        style: 'analytical, focused, precise',
        greeting: 'Position analysis ready. Let\'s find the best moves together.',
        voice: 'professional'
      },
      vivienne: {
        name: 'Coach Vivienne',
        emoji: '👑',
        style: 'elegant, encouraging, wise',
        greeting: 'Darling, what a lovely position we have! Let\'s explore it.',
        voice: 'elegant'
      }
    };
    
    // Emotion-based responses with multiple variations
    this.emotionalResponses = {
      happy: {
        emoji: '😊',
        reactions: [
          'That was brilliant! You\'re playing like a grandmaster! 🌟',
          'Beautiful move! Your intuition is so sharp today! ✨',
          'I\'m so proud of you! That was perfect calculation! 🏆',
          'Exquisite play! You\'re making this look easy! 💫',
          'You\'re on fire today! What a brilliant sequence! 🔥'
        ]
      },
      surprised: {
        emoji: '😲',
        reactions: [
          'Oh my! I didn\'t see that coming! Incredible! 🌟',
          'Wow! That\'s such a creative idea! I\'m impressed! 💡',
          'You\'re full of surprises today! Amazing! 🎯',
          'What a shocking move! You\'re playing like a genius! 🧠'
        ]
      },
      flirty: {
        emoji: '😉',
        reactions: [
          'You\'re making me blush with those moves! 💕',
          'Keep playing like that and I might fall for you~ 😘',
          'Is it hot in here or is it just your brilliant play? 🔥',
          'You know how to sweep a girl off her feet with your chess skills! 💝'
        ]
      },
      tactical: {
        emoji: '🧠',
        reactions: [
          'Tactical vision on point! You saw the combination! 🎯',
          'That\'s the winning pattern! Excellent calculation! 📈',
          'You\'re thinking like a grandmaster! What a mind! 🧠',
          'The tactical awareness here is outstanding! 💪'
        ]
      },
      encouraging: {
        emoji: '💪',
        reactions: [
          'You\'ve got this! Stay focused and confident! 🌟',
          'Believe in yourself! You have all the skills! 💪',
          'Every move counts. You\'re doing amazing! ✨',
          'Keep your head up! You\'re playing great chess! 🏆'
        ]
      },
      disappointed: {
        emoji: '😅',
        reactions: [
          'Oops! That wasn\'t the best move. Let\'s recover together! 💪',
          'Even grandmasters blunder sometimes. Stay calm! 🎯',
          'That\'s a learning opportunity. Let\'s analyze it! 📚',
          'Don\'t worry about it! Mistakes help us grow! 🌱'
        ]
      },
      neutral: {
        emoji: '🤔',
        reactions: [
          'Interesting position! What\'s your plan? 🤔',
          'Let\'s think about this carefully... 🧠',
          'Many possibilities here! Choose wisely! 💭',
          'The position is balanced. Time for some creativity! 🎨'
        ]
      }
    };
    
    // Move classification reactions
    this.classificationReactions = {
      brilliant: {
        emoji: '💎',
        messages: [
          'Brilliant!! That\'s a Grandmaster-level move! Your intuition is on fire! 🔥',
          'EXCEPTIONAL! That\'s a move worthy of the world championship! 🏆',
          'Genius! I\'m genuinely impressed by that calculation! 💡',
          'That\'s a work of art! You saw something incredible! 🎨'
        ]
      },
      great: {
        emoji: '🌟',
        messages: [
          'Great move! You\'re finding strong tactical ideas! Keep it up! ⚡',
          'Excellent choice! That really puts pressure on the position! 💪',
          'Well played! You\'re reading the position beautifully! 🎯',
          'Strong move! Your chess intuition is developing rapidly! 🌱'
        ]
      },
      best: {
        emoji: '🎯',
        messages: [
          'Best move in the position! You calculated perfectly! 🧠',
          'Perfect choice! The engine agrees with you! 💫',
          'Optimal play! You\'re thinking like a computer! 🤖',
          'Textbook execution! That\'s the best possible move! 📚'
        ]
      },
      excellent: {
        emoji: '💫',
        messages: [
          'Excellent! Solid play with clear positional understanding! 🌟',
          'Very nice move! Building pressure step by step! 🎯',
          'Clean and effective! You\'re playing with confidence! 💪',
          'Smooth move! Your positional play is improving! 📈'
        ]
      },
      book: {
        emoji: '📖',
        messages: [
          'Book move! Following grandmaster theory perfectly! 📚',
          'Opening knowledge on display! You\'ve studied well! 🎓',
          'Classical move! Grandmasters play this line! 🏆',
          'Theory approved! You\'re following the best lines! 💫'
        ]
      },
      good: {
        emoji: '👍',
        messages: [
          'Good move! Maintaining the pressure nicely! 💪',
          'Solid choice! You\'re staying in the game! 🎯',
          'Reasonable move! Keep finding good positions! 🌱',
          'Playable! You\'re keeping things balanced! ⚖️'
        ]
      },
      inaccuracy: {
        emoji: '🤔',
        messages: [
          'Hmm, not the most precise. Maybe consider what the best move might be? 💭',
          'Slight inaccuracy! Let\'s find a better way next time! 🎯',
          'Not terrible, but there might be something stronger! 💡',
          'A small slip! We can improve on this position! 📈'
        ]
      },
      mistake: {
        emoji: '😅',
        messages: [
          'That\'s a mistake! Don\'t worry, we all make them. Let\'s recover! 💪',
          'Oops! That wasn\'t the best. Stay calm and find the counterplay! 🎯',
          'Mistake detected! Learn from this and come back stronger! 🌱',
          'We all blunder sometimes! Focus on the next move! 💫'
        ]
      },
      blunder: {
        emoji: '😲',
        messages: [
          'Oh no! A blunder! Stay calm and look for tactical chances! ⚡',
          'That changes things dramatically! Let\'s adapt! 🎯',
          'A tough moment! But champions bounce back! 💪',
          'Lost material? Time to fight back with counterplay! 🔥'
        ]
      }
    };
  }

  /**
   * Mount the coach UI to a container element
   */
  mount(containerId) {
    this.containerId = containerId;
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Coach container #${containerId} not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create coach avatar wrapper
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'flex items-center gap-3 p-3 bg-[#0d0d0f] rounded-xl border border-[#2a2a2e] transition-all duration-300';
    avatarWrapper.id = 'coach-avatar-wrapper';

    // Avatar image/emoji with status indicator
    const avatar = document.createElement('div');
    avatar.className = 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center text-2xl transition-all duration-300 flex-shrink-0';
    avatar.id = 'coach-avatar';
    const personality = this.personalities[this.identity] || this.personalities.hikari;
    avatar.textContent = personality.emoji || '🌸';
    this.avatarElement = avatar;

    // Online status dot
    const statusDot = document.createElement('div');
    statusDot.className = 'absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d0d0f]';
    statusDot.id = 'coach-status-dot';
    
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'relative flex-shrink-0';
    avatarContainer.appendChild(avatar);
    avatarContainer.appendChild(statusDot);

    // Speech bubble
    const speechBubble = document.createElement('div');
    speechBubble.className = 'flex-1 min-h-[60px] flex items-center';
    
    const speechText = document.createElement('p');
    speechText.className = 'text-sm text-zinc-200 leading-relaxed transition-all duration-300';
    speechText.id = 'coach-speech-text';
    speechText.textContent = personality.greeting || 'Hello! Let\'s play some chess!';
    this.speechElement = speechText;

    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'hidden flex items-center gap-1 text-blue-400 text-xs font-medium';
    typingIndicator.id = 'coach-typing-indicator';
    typingIndicator.innerHTML = `
      <span>thinking</span>
      <span class="typing-dots">
        <span class="inline-block animate-pulse">.</span>
        <span class="inline-block animate-pulse delay-75">.</span>
        <span class="inline-block animate-pulse delay-150">.</span>
      </span>
    `;

    speechBubble.appendChild(speechText);
    speechBubble.appendChild(typingIndicator);
    avatarWrapper.appendChild(avatarContainer);
    avatarWrapper.appendChild(speechBubble);
    container.appendChild(avatarWrapper);

    // Add typing indicator styles if not already present
    if (!document.getElementById('coach-typing-styles')) {
      const styles = document.createElement('style');
      styles.id = 'coach-typing-styles';
      styles.textContent = `
        .typing-dots span {
          animation: pulse 1.4s infinite both;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    // Initial greeting after mount
    setTimeout(() => {
      this.speak(personality.greeting, 'neutral');
    }, 500);
  }

  /**
   * Set coach identity/personality
   */
  setCoachIdentity(identityKey) {
    if (this.personalities[identityKey]) {
      this.identity = identityKey;
      this.updateAvatar();
      const personality = this.personalities[identityKey];
      this.speak(personality.greeting, 'neutral');
    }
  }

  /**
   * Update avatar display
   */
  updateAvatar() {
    if (this.avatarElement) {
      const personality = this.personalities[this.identity] || this.personalities.hikari;
      this.avatarElement.textContent = personality.emoji || '🌸';
    }
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    if (this.speechElement) {
      this.speechElement.classList.add('opacity-50');
    }
    const typing = document.getElementById('coach-typing-indicator');
    if (typing) {
      typing.classList.remove('hidden');
    }
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    if (this.speechElement) {
      this.speechElement.classList.remove('opacity-50');
    }
    const typing = document.getElementById('coach-typing-indicator');
    if (typing) {
      typing.classList.add('hidden');
    }
  }

  /**
   * Speak a message with emotion
   */
  speak(message, emotion = 'neutral') {
    if (!this.speechElement) return;

    // Clear any pending timeouts
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
    }

    this.showTyping();

    // Simulate thinking delay
    const thinkingTime = Math.min(300 + Math.random() * 400, 700);
    this.speechTimeout = setTimeout(() => {
      this.hideTyping();
      this.emotion = emotion;
      this.currentMessage = message;
      this.speechElement.textContent = message;
      
      // Animate in with a bounce
      this.speechElement.style.opacity = '0';
      this.speechElement.style.transform = 'translateY(8px)';
      
      requestAnimationFrame(() => {
        this.speechElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.speechElement.style.opacity = '1';
        this.speechElement.style.transform = 'translateY(0)';
      });

      // Update avatar based on emotion
      this.updateAvatarEmotion(emotion);
      
      // Update status dot
      this.updateStatusDot(emotion);
      
    }, thinkingTime);
  }

  /**
   * Update avatar based on emotion
   */
  updateAvatarEmotion(emotion) {
    if (!this.avatarElement) return;
    
    const emotionData = this.emotionalResponses[emotion] || this.emotionalResponses.neutral;
    this.avatarElement.textContent = emotionData.emoji;
    
    // Bounce animation
    this.avatarElement.style.transition = 'transform 0.2s ease';
    this.avatarElement.style.transform = 'scale(1.25)';
    setTimeout(() => {
      this.avatarElement.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Update status dot based on emotion
   */
  updateStatusDot(emotion) {
    const dot = document.getElementById('coach-status-dot');
    if (!dot) return;
    
    const colors = {
      happy: 'bg-emerald-500',
      surprised: 'bg-yellow-500',
      flirty: 'bg-pink-500',
      tactical: 'bg-blue-500',
      encouraging: 'bg-green-500',
      disappointed: 'bg-orange-500',
      neutral: 'bg-gray-500'
    };
    
    dot.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0d0f] ${colors[emotion] || colors.neutral}`;
  }

  /**
   * React to a player's move
   */
  reactToMove(moveData) {
    const now = Date.now();
    if (now - this.lastReactionTime < this.reactionCooldown) {
      // Queue the reaction for later
      if (this.pendingReaction) {
        clearTimeout(this.pendingReaction);
      }
      this.pendingReaction = setTimeout(() => {
        this.reactToMove(moveData);
      }, this.reactionCooldown);
      return;
    }
    this.lastReactionTime = now;

    const { san, piece, isCheck, isCheckmate, isCapture, isPlayer, classification, bestMoveSan, openingName } = moveData;

    // Priority reactions
    if (isCheckmate) {
      if (isPlayer) {
        this.speak('Checkmate! You did it! That was absolutely phenomenal! 🏆', 'happy');
      } else {
        this.speak('Checkmate! The AI got you! Let\'s analyze and learn from this! 🎯', 'surprised');
      }
      return;
    }

    if (isCheck) {
      const checkMessages = isPlayer 
        ? ['Check! You\'re attacking the king! Keep the pressure on! ⚡', 'Check! Watch for tactical opportunities! 🎯']
        : ['Check! The AI is attacking! Stay alert and defend! ⚠️', 'Check! Find the best defensive move! 🛡️'];
      this.speak(checkMessages[Math.floor(Math.random() * checkMessages.length)], 'tactical');
      return;
    }

    // React based on move classification
    if (isPlayer && classification) {
      const reactions = this.classificationReactions[classification.toLowerCase()];
      if (reactions) {
        const message = reactions.messages[Math.floor(Math.random() * reactions.messages.length)];
        let emotion = 'neutral';
        if (['brilliant', 'great', 'best'].includes(classification.toLowerCase())) {
          emotion = 'happy';
        } else if (['mistake', 'blunder'].includes(classification.toLowerCase())) {
          emotion = 'disappointed';
        } else if (['inaccuracy'].includes(classification.toLowerCase())) {
          emotion = 'surprised';
        } else {
          emotion = 'tactical';
        }
        this.speak(message, emotion);
        return;
      }
    }

    // Opening book moves
    if (classification === 'Book' && openingName) {
      this.speak(`Book move! Following ${openingName} theory! You've studied well! 📖`, 'tactical');
      return;
    }

    // Capture reactions
    if (isCapture && isPlayer) {
      const captureMessages = [
        'Nice capture! Taking control of the board! 💪',
        'Good capture! Material advantage! 💎',
        'Smooth capture! You\'re picking off the pieces! 🎯',
        'Excellent! Capturing like a grandmaster! 🌟'
      ];
      this.speak(captureMessages[Math.floor(Math.random() * captureMessages.length)], 'happy');
      return;
    }

    // AI move reactions
    if (!isPlayer) {
      const aiReactions = [
        `The AI played ${san}. What's your counter? 💭`,
        `Interesting move from the AI! How will you respond? 🧠`,
        `${san} - Let's see if you can handle this! 😉`,
        `The AI is tricky! Stay focused and calculate! 🎯`,
        `AI makes a move! Time to find the best response! 💪`
      ];
      this.speak(aiReactions[Math.floor(Math.random() * aiReactions.length)], 'tactical');
      return;
    }

    // Default reaction for standard moves
    const defaultReactions = [
      `Move ${san} played! Solid choice! 🎯`,
      `${san} - Good move! Keep it up! 💪`,
      `I like ${san}! You're playing well! ✨`,
      `Let's see how the position develops after ${san}! 🤔`
    ];
    this.speak(defaultReactions[Math.floor(Math.random() * defaultReactions.length)], 'neutral');
  }

  /**
   * React when user undoes a move
   */
  reactToUndo() {
    const undoMessages = [
      'Undoing moves? Sometimes it\'s good to review! Let\'s find a better line! 🔄',
      'Rewinding time! Let\'s see if we can find something stronger! ⏪',
      'Going back! Every grandmaster reviews their games! 📚',
      'Undo! Let\'s analyze this position more carefully! 🧠'
    ];
    this.speak(undoMessages[Math.floor(Math.random() * undoMessages.length)], 'encouraging');
  }

  /**
   * React when user resigns
   */
  reactToResign() {
    const resignMessages = [
      'You resigned? That\'s okay! Every game is a learning opportunity! 🎓',
      'Resignation accepted! Let\'s analyze and improve for next time! 💪',
      'Good game! You showed great fighting spirit! 🏆',
      'Resignation is a sign of respect. You played well! 🌟'
    ];
    this.speak(resignMessages[Math.floor(Math.random() * resignMessages.length)], 'encouraging');
  }

  /**
   * React to entering Deep Dive mode
   */
  reactToDeepDive() {
    const diveMessages = [
      'Deep Dive mode! Let\'s analyze every move and explore all possibilities! 🧠',
      'Entering the depths of chess analysis! This is where champions are made! 📈',
      'Deep Dive activated! Let\'s find the hidden tactical treasures! 💎',
      'Ready for deep analysis! We\'ll uncover every nuance of this position! 🔍'
    ];
    this.speak(diveMessages[Math.floor(Math.random() * diveMessages.length)], 'tactical');
  }

  /**
   * Random encouragement for neutral moments
   */
  randomEncouragement() {
    const messages = [
      'You\'re doing great! Keep up the pressure! 💪',
      'I believe in your chess abilities! You\'re improving so much! 🌟',
      'Your tactical vision is getting sharper! Keep calculating! 🧠',
      'Stay focused! One move at a time! You\'ve got this! 🎯',
      'Remember your opening principles! Develop pieces and castle early! 📖',
      'Trust your instincts! Your chess intuition is strong! ✨',
      'You\'re playing like a natural! Keep it up! 🏆'
    ];
    this.speak(messages[Math.floor(Math.random() * messages.length)], 'encouraging');
  }

  /**
   * Update coach display with custom message
   */
  update(message, emotion = 'neutral') {
    this.speak(message, emotion);
  }

  /**
   * Get current coach state
   */
  getState() {
    return {
      identity: this.identity,
      emotion: this.emotion,
      currentMessage: this.currentMessage,
      personality: this.personalities[this.identity]
    };
  }

  /**
   * React to specific events with custom messages
   */
  reactToEvent(eventType, data = null) {
    const eventReactions = {
      'game_start': [
        'New game! Let\'s see what you\'ve got! 🎯',
        'Fresh start! Time to show your best chess! 💪',
        'Here we go! I\'m excited to watch you play! 🌟'
      ],
      'game_end': [
        'Game over! Let\'s review what we learned! 📚',
        'Well played! Every game makes us stronger! 💪',
        'Good game! Let\'s analyze the key moments! 🧠'
      ],
      'capture': [
        'Nice capture! You\'re winning material! 💎',
        'Smooth capture! Good vision! 🎯',
        'Capturing with purpose! Excellent! 🌟'
      ],
      'castle': [
        'King safety first! Great move! 🏰',
        'Castling early! Smart development! 🎯',
        'Securing your king! Very solid play! 💪'
      ],
      'promotion': [
        'Queen promotion! Game changer! 👑',
        'Promoting! You\'re on your way to victory! 🌟',
        'A new queen! What a powerful move! ⚡'
      ]
    };
    
    const reactions = eventReactions[eventType];
    if (reactions) {
      this.speak(reactions[Math.floor(Math.random() * reactions.length)], 'happy');
    }
  }
}

// Export the CoachNaomi class
export { CoachNaomi };

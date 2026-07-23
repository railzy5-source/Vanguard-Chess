/**
 * Hikari Chess Coach - Clock & Time Control Manager
 * Supports Bullet, Blitz, Rapid, Classical, and Custom time controls with increments.
 */

export const TIME_CONTROLS = {
  bullet1: { name: 'Bullet 1|0', initialSec: 60, incSec: 0, category: 'Bullet' },
  bullet2: { name: 'Bullet 2|1', initialSec: 120, incSec: 1, category: 'Bullet' },
  blitz3: { name: 'Blitz 3|0', initialSec: 180, incSec: 0, category: 'Blitz' },
  blitz3_2: { name: 'Blitz 3|2', initialSec: 180, incSec: 2, category: 'Blitz' },
  blitz5: { name: 'Blitz 5|0', initialSec: 300, incSec: 0, category: 'Blitz' },
  blitz5_3: { name: 'Blitz 5|3', initialSec: 300, incSec: 3, category: 'Blitz' },
  rapid10: { name: 'Rapid 10|0', initialSec: 600, incSec: 0, category: 'Rapid' },
  rapid15: { name: 'Rapid 15|10', initialSec: 900, incSec: 10, category: 'Rapid' },
  classical30: { name: 'Classical 30|0', initialSec: 1800, incSec: 0, category: 'Classical' },
  unlimited: { name: 'No Clock (Untimed)', initialSec: 0, incSec: 0, category: 'Unlimited' }
};

export class ChessClock {
  constructor(timeControlKey = 'blitz5', onTick, onTimeout) {
    this.timeControl = TIME_CONTROLS[timeControlKey] || TIME_CONTROLS.blitz5;
    this.whiteTimeMs = this.timeControl.initialSec * 1000;
    this.blackTimeMs = this.timeControl.initialSec * 1000;
    this.activeColor = 'w'; // 'w' or 'b'
    this.isRunning = false;
    this.intervalId = null;
    this.onTick = onTick;
    this.onTimeout = onTimeout;
    this.lastTimestamp = null;
  }

  setTimeControl(key) {
    this.stop();
    this.timeControl = TIME_CONTROLS[key] || TIME_CONTROLS.unlimited;
    this.reset();
  }

  reset() {
    this.stop();
    this.whiteTimeMs = this.timeControl.initialSec * 1000;
    this.blackTimeMs = this.timeControl.initialSec * 1000;
    this.activeColor = 'w';
    if (this.onTick) this.onTick(this.getTimeState());
  }

  startTimer(turnColor = 'w') {
    this.start(turnColor);
  }

  stopTimer() {
    this.stop();
  }

  start(turnColor = 'w') {
    if (this.timeControl.initialSec === 0) return; // Untimed
    this.activeColor = turnColor;
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTimestamp = performance.now();

    this.intervalId = setInterval(() => {
      const now = performance.now();
      const delta = now - this.lastTimestamp;
      this.lastTimestamp = now;

      if (this.activeColor === 'w') {
        this.whiteTimeMs = Math.max(0, this.whiteTimeMs - delta);
        if (this.whiteTimeMs <= 0) {
          this.stop();
          if (this.onTimeout) this.onTimeout('w');
        }
      } else {
        this.blackTimeMs = Math.max(0, this.blackTimeMs - delta);
        if (this.blackTimeMs <= 0) {
          this.stop();
          if (this.onTimeout) this.onTimeout('b');
        }
      }

      if (this.onTick) this.onTick(this.getTimeState());
    }, 100);
  }

  switchTurn(nextColor) {
    if (this.timeControl.initialSec === 0) return;

    if (!nextColor) {
      nextColor = this.activeColor === 'w' ? 'b' : 'w';
    }

    // Apply increment to player who just finished turn
    const incMs = (this.timeControl.incSec || 0) * 1000;
    if (this.activeColor === 'w') {
      this.whiteTimeMs += incMs;
    } else {
      this.blackTimeMs += incMs;
    }

    this.activeColor = nextColor;
    this.lastTimestamp = performance.now();
    if (this.onTick) this.onTick(this.getTimeState());
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  togglePause() {
    if (this.isRunning) {
      this.stop();
    } else if (this.timeControl.initialSec > 0) {
      this.start(this.activeColor);
    }
  }

  formatTime(ms) {
    if (this.timeControl.initialSec === 0) return '∞';
    const totalSec = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    if (totalSec < 20 && ms > 0) {
      // Sub-10 second precision
      const tenths = Math.floor((ms % 1000) / 100);
      return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getTimeState() {
    return {
      whiteFormatted: this.formatTime(this.whiteTimeMs),
      blackFormatted: this.formatTime(this.blackTimeMs),
      whiteMs: this.whiteTimeMs,
      blackMs: this.blackTimeMs,
      activeColor: this.activeColor,
      isRunning: this.isRunning,
      isWhiteLow: this.whiteTimeMs < 30000 && this.timeControl.initialSec > 0,
      isBlackLow: this.blackTimeMs < 30000 && this.timeControl.initialSec > 0,
      timeControlName: this.timeControl.name
    };
  }
}

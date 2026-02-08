// Keyboard input manager for PC play
// Supports 1-4 for answer selection, arrow keys for navigation, ESC for back, Enter for confirm

const KeyboardManager = {
  _enabled: true,
  _handlers: new Map(),
  _isPC: false,

  init() {
    // Detect PC vs mobile
    this._isPC = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    document.addEventListener('keydown', (e) => this._handleKey(e));
  },

  isPC() { return this._isPC; },

  _handleKey(e) {
    if (!this._enabled) return;

    // Don't intercept keys when typing in input fields
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

    const key = e.key;

    // Number keys 1-4 → answer selection
    if (key >= '1' && key <= '4') {
      e.preventDefault();
      const idx = parseInt(key) - 1;
      this._emit('answer', idx);

      // Click the corresponding answer button
      const btns = document.querySelectorAll('.g3d-ans, .game-option');
      if (btns[idx]) {
        btns[idx].click();
      }
    }

    // Arrow keys for hub navigation
    if (key === 'ArrowLeft') {
      e.preventDefault();
      this._emit('nav', 'left');
    }
    if (key === 'ArrowRight') {
      e.preventDefault();
      this._emit('nav', 'right');
    }
    if (key === 'ArrowUp') {
      e.preventDefault();
      this._emit('nav', 'up');
    }
    if (key === 'ArrowDown') {
      e.preventDefault();
      this._emit('nav', 'down');
    }

    // Enter for confirm
    if (key === 'Enter') {
      this._emit('confirm');
    }

    // Escape for back
    if (key === 'Escape') {
      e.preventDefault();
      this._emit('back');
      // Click back button if visible
      const backBtn = document.querySelector('.game-back, .g3d-btn[onclick*="showHub"]');
      if (backBtn) backBtn.click();
    }

    // Space for special actions (weightlifting gauge, etc.)
    if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      this._emit('space');
    }

    // WASD alternative for arrow keys
    if (key === 'w' || key === 'W') { e.preventDefault(); this._emit('nav', 'up'); }
    if (key === 'a' || key === 'A') { e.preventDefault(); this._emit('nav', 'left'); }
    if (key === 's' || key === 'S') { e.preventDefault(); this._emit('nav', 'down'); }
    if (key === 'd' || key === 'D') { e.preventDefault(); this._emit('nav', 'right'); }
  },

  _emit(event, data) {
    const handlers = this._handlers.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(data));
    }
  },

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(handler);
    return () => this._handlers.get(event)?.delete(handler);
  },

  off(event, handler) {
    this._handlers.get(event)?.delete(handler);
  },

  enable() { this._enabled = true; },
  disable() { this._enabled = false; },
};

export { KeyboardManager };
export default KeyboardManager;

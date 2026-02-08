import { seededShuffle } from '../utils.js';
import { ALL_HANJA } from '../data/hanja.js';

// Generate the same question set from a shared seed
export function generateSharedQuestions(seed, count = 10) {
  return seededShuffle(ALL_HANJA, seed).slice(0, count);
}

// Multiplayer score overlay HUD
export function createMultiplayerHUD(roomManager) {
  const scores = {};
  let element = null;

  roomManager.onScoreUpdate(({ userId, username, score }) => {
    scores[userId] = { username, score };
    updateDisplay();
  });

  function updateDisplay() {
    if (!element) return;
    const sorted = Object.values(scores).sort((a, b) => b.score - a.score);
    element.innerHTML = sorted.map((s, i) => `
      <div style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:rgba(255,255,255,.8);">
        <span style="font-weight:800;">${i + 1}.</span>
        <span>${s.username}</span>
        <span style="color:#FFD700;font-weight:700;">${s.score}</span>
      </div>
    `).join('');
  }

  return {
    mount(container) {
      element = document.createElement('div');
      element.style.cssText = 'position:absolute;top:50px;right:10px;background:rgba(0,0,0,.6);border-radius:12px;padding:8px 12px;backdrop-filter:blur(4px);pointer-events:none;z-index:10;min-width:100px;';
      element.innerHTML = '<div style="font-size:.7rem;color:rgba(255,255,255,.5);margin-bottom:4px;">실시간 순위</div>';
      container.appendChild(element);
    },
    updateScore(userId, username, score) {
      scores[userId] = { username, score };
      updateDisplay();
    },
    destroy() {
      if (element && element.parentNode) element.parentNode.removeChild(element);
      element = null;
    },
  };
}

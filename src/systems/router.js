import { Effects } from './effects.js';

let currentEngine = null;
let currentAbort = null;

export function setCurrentEngine(engine) { currentEngine = engine; }
export function getCurrentAbort() { return currentAbort; }

function $(id) { return document.getElementById(id); }

export const Router = {
  navigate(screenId) {
    if (currentEngine && currentEngine.cleanup) currentEngine.cleanup();
    currentEngine = null;
    if (currentAbort) currentAbort.abort();
    currentAbort = new AbortController();
    Effects.clearAll();
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.classList.remove('game-screen-active');
    });
    const target = $(screenId);
    if (target) target.classList.add('active');
    return currentAbort.signal;
  }
};

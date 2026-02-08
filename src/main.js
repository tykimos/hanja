// Hanja Olympics v2 - Main Entry Point
import Store from './systems/store.js';
import { SoundSystem } from './systems/sound.js';
import { Effects } from './systems/effects.js';
import { Router, setCurrentEngine } from './systems/router.js';
import { GE3D } from './engine/ge3d.js';
import { KeyboardManager } from './systems/keyboard.js';
import { $ } from './utils.js';
import { ALL_HANJA, getHanjaForGrade } from './data/hanja.js';
import { shuffle, seededShuffle, getDateSeed, generateDecoys, recordEncountered, getMedalForScore, recordGameResult, medalEmoji } from './utils.js';
import { logAnswer } from './systems/answer-logger.js';

// Import screens
import { initSplash } from './screens/splash.js';
import { showAuth } from './screens/auth.js';
import { showHub } from './screens/hub.js';
import { showResult } from './screens/result.js';
import { showLeaderboard } from './screens/leaderboard.js';
import { showProfile } from './screens/profile.js';
import { showStudy } from './screens/study.js';
import { showCreateRoom, showJoinRoom } from './screens/room.js';
import { showGradeSelect } from './screens/grade-select.js';
import { showStatistics } from './screens/statistics.js';

// Import games
import { createArcheryGame3D } from './games/archery.js';
import { createSwimmingGame3D } from './games/swimming.js';
import { createWeightliftingGame3D } from './games/weightlifting.js';
import { createGymnasticsGame3D } from './games/gymnastics.js';
import { createMarathonGame3D } from './games/marathon.js';
import { createAntonymGame3D } from './games/antonym.js';
import { createIdiomGame3D } from './games/idiom.js';
import { createHomonymGame3D } from './games/homonym.js';

// Make key functions available globally for inline onclick handlers
window.GE3D = GE3D;
window.SoundSystem = SoundSystem;
window.Effects = Effects;

// === Navigation Functions ===
function _showHub() {
  showHub({
    startGame: _startGame,
    startDaily: _startDaily,
    showLeaderboard: _showLeaderboard,
    showProfile: _showProfile,
    showStudy: _showStudy,
    showAuth: _showAuth,
    showRoom: _showCreateRoom,
    showRoomJoin: _showJoinRoom,
  });
}
window.showHub = _showHub;

function _showAuth() {
  showAuth(_showHub, _showGradeSelect);
}

function _showLeaderboard() {
  showLeaderboard(_showHub);
}

function _showProfile() {
  showProfile(_showHub, _showAuth, _showGradeSelect);
}

function _showGradeSelect() {
  showGradeSelect({
    onComplete: _showHub,
    showHub: _showHub,
  });
}

function _showStudy() {
  showStudy(_showHub);
}

function _showStatistics() {
  showStatistics(_showProfile);
}
window._showStatistics = _showStatistics;

function _showCreateRoom() {
  showCreateRoom({
    showHub: _showHub,
    startMultiplayerGame: _startMultiplayerGame,
  });
}

function _showJoinRoom() {
  showJoinRoom({
    showHub: _showHub,
    startMultiplayerGame: _startMultiplayerGame,
  });
}

function _showResult(gameId, gameName, score, total, medal, detail) {
  showResult(gameId, gameName, score, total, medal, detail, {
    startGame: _startGame,
    startDaily: _startDaily,
    showHub: _showHub,
    showLeaderboard: _showLeaderboard,
  });
}

// === Game Start ===
function _startGame(gameId) {
  try {
    const signal = Router.navigate('screen-' + gameId);
    SoundSystem.init();
    if (!GE3D.renderer) GE3D.init();
    let game;
    switch (gameId) {
      case 'archery': game = createArcheryGame3D(); break;
      case 'swimming': game = createSwimmingGame3D(); break;
      case 'weightlifting': game = createWeightliftingGame3D(); break;
      case 'gymnastics': game = createGymnasticsGame3D(); break;
      case 'marathon': game = createMarathonGame3D(); break;
      case 'antonym': game = createAntonymGame3D(); break;
      case 'idiom': game = createIdiomGame3D(); break;
      case 'homonym': game = createHomonymGame3D(); break;
    }
    if (!game) { console.error('Unknown game:', gameId); return; }
    game.init();
    const checkDone = setInterval(() => {
      if (game.isDone()) {
        clearInterval(checkDone); GE3D.stop();
        const r = game.getResult();
        _showResult(r.gameId, r.name, r.score, r.total, r.medal, r.detail);
      }
    }, 100);
    signal.addEventListener('abort', () => { clearInterval(checkDone); GE3D.stop(); });
    GE3D.start(game);
  } catch(e) {
    console.error('Game start error:', e);
  }
}

function _startMultiplayerGame(gameId, seed, roomManager) {
  try {
    _startGame(gameId);
  } catch(e) {
    console.error('Multiplayer game start error:', e);
  }
}

// === Daily Challenge ===
function _startDaily() {
  const signal = Router.navigate('screen-daily');
  const container = $('screen-daily');
  container.innerHTML = '';
  const engine = createDailyEngine();
  setCurrentEngine(engine);
  engine.init(container, signal);
  engine.start();
}

function createDailyEngine() {
  let questions = [], current = 0, score = 0, wrongList = [], encountered = [], container, signal;
  return {
    init(c, s) { container = c; signal = s; },
    start() {
      Store.getDailyChallenge().then(dc => {
        if (dc) {
          this._showDone(dc);
          return;
        }
        const seed = getDateSeed();
        questions = seededShuffle(getHanjaForGrade(Store.getGrade()), seed).slice(0, 10);
        current = 0; score = 0; wrongList = []; encountered = [];
        this._render();
      });
    },
    _showDone(dc) {
      Store.getDailyStreak().then(streak => {
        container.innerHTML = `
          <div class="game-header">
            <button class="game-back" id="g-back">&#8592;</button>
            <span class="game-title">일일 도전</span>
            <span style="width:44px"></span>
          </div>
          <div class="daily-done">
            <div class="daily-done-medal">${dc.medal ? medalEmoji(dc.medal) : '🎯'}</div>
            <div class="title-md">오늘의 도전 완료!</div>
            <div style="font-size:1.2rem;margin:8px 0;">점수: ${dc.score}/10</div>
            ${streak ? `<div style="color:var(--blue);font-weight:600;">연속 ${streak}일 도전 중</div>` : ''}
            <div class="daily-countdown" id="daily-countdown"></div>
          </div>
        `;
        $('g-back').addEventListener('click', () => _showHub(), { signal });
        this._updateCountdown();
      });
    },
    _updateCountdown() {
      const updateFn = () => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const el = $('daily-countdown');
        if (el) el.textContent = `다음 도전까지 ${h}시간 ${m}분 ${s}초`;
      };
      updateFn();
      const intv = setInterval(updateFn, 1000);
      if (signal) { signal.addEventListener('abort', () => clearInterval(intv)); }
    },
    _render() {
      if (current >= questions.length) { this._finish(); return; }
      const q = questions[current];
      encountered.push(q.hanja);
      const decoys = generateDecoys(q, getHanjaForGrade(Store.getGrade()), 3, 'fullHunEum');
      const options = shuffle([q, ...decoys]);
      const isPC = KeyboardManager.isPC();
      container.innerHTML = `
        <div class="game-header">
          <button class="game-back" id="g-back">&#8592;</button>
          <span class="game-title">일일 도전</span>
          <span class="game-info">${current + 1}/10</span>
        </div>
        <div class="game-progress"><div class="game-progress-bar" style="width:${current / 10 * 100}%"></div></div>
        <div class="game-question">
          <div style="font-size:.9rem;color:#888;margin-bottom:8px;">이 한자의 훈음은?</div>
          <div class="hanja-display anim-bounceIn">${q.hanja}</div>
        </div>
        <div class="game-options" id="g-opts">
          ${options.map((o, i) => `<button class="game-option" data-val="${o.fullHunEum}">${isPC ? `<span class="key-hint">[${i + 1}]</span> ` : ''}${o.fullHunEum}</button>`).join('')}
        </div>
      `;
      $('g-back').addEventListener('click', () => _showHub(), { signal });
      container.querySelectorAll('#g-opts .game-option').forEach(btn => {
        btn.addEventListener('click', () => this._answer(btn, q), { signal });
      });
    },
    _answer(btn, q) {
      const all = container.querySelectorAll('#g-opts .game-option');
      all.forEach(b => b.classList.add('disabled'));
      const isCorrect = btn.dataset.val === q.fullHunEum;

      // Log answer
      logAnswer('daily', q.hanja, isCorrect);

      if (isCorrect) {
        btn.classList.add('correct'); score++; SoundSystem.playSound('correct');
        Effects.flash('green'); Effects.shake('light');
      } else {
        btn.classList.add('wrong'); wrongList.push(q); SoundSystem.playSound('wrong');
        Effects.flash('red'); Effects.shake('medium');
        all.forEach(b => { if (b.dataset.val === q.fullHunEum) b.classList.add('correct'); });
      }
      setTimeout(() => { current++; this._render(); }, 600);
    },
    _finish() {
      recordEncountered(encountered);
      const medal = getMedalForScore('daily', score);
      recordGameResult('daily', score, 10, medal, wrongList);
      Store.saveDailyChallenge(score, medal);
      _showResult('daily', '일일 도전', score, 10, medal, `${score}/10 정답`);
    },
    cleanup() {},
    getResult() { return { score }; },
  };
}

// === INIT ===
async function init() {
  // Initialize systems
  KeyboardManager.init();
  await Store.init();

  // Start splash screen
  initSplash(() => {
    if (Store.getCurrentUser()) {
      _showHub();
    } else {
      _showAuth();
    }
  });
}

init();

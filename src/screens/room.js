import { GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';
import { RoomManager } from '../multiplayer/room-manager.js';

let roomManager = null;

export function showCreateRoom(deps) {
  const { showHub, startMultiplayerGame } = deps;
  const signal = Router.navigate('screen-room');
  const container = $('screen-room');

  container.innerHTML = `
    <div class="game-header" style="width:100%">
      <button class="game-back" id="room-back">&#8592;</button>
      <span class="game-title">방 만들기</span>
      <span style="width:44px"></span>
    </div>
    <div style="padding:20px;width:100%;max-width:500px;margin:0 auto;">
      <div class="title-md" style="margin-bottom:20px;">게임 선택</div>
      <div class="game-grid" id="room-game-grid"></div>
    </div>
  `;

  $('room-back').addEventListener('click', () => {
    if (roomManager) { roomManager.leave(); roomManager = null; }
    showHub();
  }, { signal });

  const grid = $('room-game-grid');
  GAME_LIST.filter(g => g.multi).forEach(g => {
    const div = document.createElement('div');
    div.className = 'game-card anim-fadeIn';
    div.innerHTML = `
      <div class="game-card-icon">${g.icon}</div>
      <div class="game-card-name">${g.name}</div>
    `;
    div.addEventListener('click', async () => {
      await createRoomForGame(g.id, container, signal, deps);
    }, { signal });
    grid.appendChild(div);
  });
}

async function createRoomForGame(gameId, container, signal, deps) {
  const { showHub, startMultiplayerGame } = deps;
  roomManager = new RoomManager();
  const room = await roomManager.createRoom(gameId);
  if (!room) {
    alert('방 생성에 실패했습니다.');
    return;
  }
  showLobby(container, signal, room, true, deps);
}

export function showJoinRoom(deps) {
  const { showHub } = deps;
  const signal = Router.navigate('screen-room');
  const container = $('screen-room');

  container.innerHTML = `
    <div class="game-header" style="width:100%">
      <button class="game-back" id="room-back">&#8592;</button>
      <span class="game-title">방 참가</span>
      <span style="width:44px"></span>
    </div>
    <div style="padding:20px;width:100%;max-width:400px;margin:0 auto;text-align:center;">
      <div class="title-md" style="margin-bottom:20px;">방 코드 입력</div>
      <input type="text" id="room-code-input" maxlength="4" placeholder="4자리 코드"
        style="font-size:2rem;text-align:center;letter-spacing:12px;padding:16px;border-radius:16px;border:2px solid var(--blue);width:100%;font-weight:800;">
      <button class="btn-primary full-width" id="room-join-btn" style="margin-top:16px;">참가하기</button>
      <div class="auth-error" id="room-error" style="margin-top:12px;"></div>
    </div>
  `;

  $('room-back').addEventListener('click', () => showHub(), { signal });
  $('room-join-btn').addEventListener('click', async () => {
    const code = $('room-code-input').value.trim().toUpperCase();
    if (code.length !== 4) {
      $('room-error').textContent = '4자리 코드를 입력하세요';
      return;
    }
    roomManager = new RoomManager();
    const room = await roomManager.joinRoom(code);
    if (!room) {
      $('room-error').textContent = '방을 찾을 수 없거나 이미 시작된 게임입니다';
      return;
    }
    showLobby(container, signal, room, false, deps);
  }, { signal });

  // Auto-focus and uppercase
  const input = $('room-code-input');
  input.focus();
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
  }, { signal });
}

function showLobby(container, signal, room, isHost, deps) {
  const { showHub, startMultiplayerGame } = deps;
  const gameInfo = GAME_LIST.find(g => g.id === room.game_id) || { name: '게임', icon: '🎮' };

  function renderLobby(players) {
    container.innerHTML = `
      <div class="game-header" style="width:100%">
        <button class="game-back" id="room-back">&#8592;</button>
        <span class="game-title">대기실</span>
        <span style="width:44px"></span>
      </div>
      <div style="padding:20px;width:100%;max-width:500px;margin:0 auto;text-align:center;">
        <div style="font-size:3rem;margin-bottom:8px;">${gameInfo.icon}</div>
        <div class="title-md">${gameInfo.name}</div>
        <div style="margin:16px 0;">
          <div style="font-size:0.85rem;color:#888;margin-bottom:4px;">방 코드</div>
          <div style="font-size:2.5rem;font-weight:900;letter-spacing:8px;color:var(--blue);" id="room-code-display">${room.code}</div>
          <button class="btn-outline" id="room-copy-code" style="margin-top:8px;font-size:.85rem;">코드 복사</button>
        </div>
        <div style="margin:20px 0;">
          <div style="font-size:.9rem;color:#888;margin-bottom:8px;">참가자 (${players.length}/${room.max_players})</div>
          <div id="room-players-list" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            ${players.map(p => `
              <div style="background:var(--card-bg);border-radius:12px;padding:8px 16px;box-shadow:var(--shadow);display:flex;align-items:center;gap:6px;">
                <span>${p.icon || '🇰🇷'}</span>
                <span style="font-weight:600;">${p.username}</span>
                ${p.isHost ? '<span style="font-size:.7rem;color:var(--gold);">👑</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ${isHost ? '<button class="btn-gold full-width" id="room-start-btn" style="margin-top:16px;font-size:1.1rem;">게임 시작</button>' : '<div style="color:#888;margin-top:16px;">호스트가 게임을 시작할 때까지 대기 중...</div>'}
      </div>
    `;

    $('room-back').addEventListener('click', () => {
      if (roomManager) { roomManager.leave(); roomManager = null; }
      showHub();
    }, { signal });

    $('room-copy-code').addEventListener('click', () => {
      navigator.clipboard.writeText(room.code);
      $('room-copy-code').textContent = '복사됨!';
      setTimeout(() => { const btn = $('room-copy-code'); if (btn) btn.textContent = '코드 복사'; }, 1500);
    }, { signal });

    if (isHost) {
      $('room-start-btn').addEventListener('click', async () => {
        const btn = $('room-start-btn');
        btn.disabled = true;
        btn.textContent = '시작 중...';
        try {
          await roomManager.startGame();
        } catch(e) {
          console.error('Game start error:', e);
          btn.disabled = false;
          btn.textContent = '게임 시작';
        }
      }, { signal });
    }
  }

  // Initial render
  const profile = Store.getProfile();
  renderLobby([{ username: profile.username, icon: profile.icon, isHost: isHost }]);

  // Listen for player updates
  roomManager.onPlayersUpdate((players) => {
    renderLobby(players);
  });

  // Listen for game start
  roomManager.onGameStart((data) => {
    startMultiplayerGame(room.game_id, data.seed, roomManager);
  });
}

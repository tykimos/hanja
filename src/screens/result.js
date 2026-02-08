import { Router } from '../systems/router.js';
import { SoundSystem } from '../systems/sound.js';
import { $, medalEmoji, spawnConfetti } from '../utils.js';

export function showResult(gameId, gameName, score, total, medal, detail, deps) {
  const { startGame, startDaily, showHub, showLeaderboard } = deps;
  const signal = Router.navigate('screen-result');
  const content = $('result-content');
  const medalText = medal === 'gold' ? '금메달' : medal === 'silver' ? '은메달' : medal === 'bronze' ? '동메달' : '';
  const emoji = medal ? medalEmoji(medal) : '😊';
  if (medal) setTimeout(() => { SoundSystem.playSound('medal'); spawnConfetti(); }, 300);
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;">
      <div class="result-medal">${emoji}</div>
      <div class="result-title">${gameName} ${medal ? '' : '도전'} 결과</div>
      ${medal ? `<div style="font-size:1.2rem;font-weight:700;color:${medal === 'gold' ? 'var(--gold)' : medal === 'silver' ? 'var(--silver)' : 'var(--bronze)'}">${medalText} 획득!</div>` : ''}
      <div class="result-score">${gameId === 'gymnastics' ? score + '회' : gameId === 'marathon' ? score + '%' : score + '점'}</div>
      <div class="result-detail">${detail}</div>
      <div class="result-buttons">
        <button class="btn-primary full-width" id="res-retry">다시 도전</button>
        <button class="btn-secondary full-width" id="res-hub">종목 선택</button>
        <button class="btn-outline full-width" id="res-lb">리더보드</button>
      </div>
    </div>
  `;
  $('res-retry').addEventListener('click', () => {
    if (gameId === 'daily') startDaily(); else startGame(gameId);
  }, { signal });
  $('res-hub').addEventListener('click', () => showHub(), { signal });
  $('res-lb').addEventListener('click', () => showLeaderboard(), { signal });
}

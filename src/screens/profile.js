import { ALL_HANJA, GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';

export function showProfile(showHubFn, showAuthFn, showGradeSelectFn) {
  const signal = Router.navigate('screen-profile');
  $('profile-back').addEventListener('click', () => showHubFn(), { signal });
  const profile = Store.getProfile();
  if (!profile) { showAuthFn(); return; }

  // Render sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = renderSidebar();
    updateSidebarData();
  }

  const content = $('profile-content');

  // Load data async
  Promise.all([
    Store.getBestScores(),
    Store.getDailyStreak(),
  ]).then(([bestScores, streak]) => {
    const bestHtml = [...GAME_LIST, { id: 'daily', name: '일일 도전', icon: '📅' }].map(g => {
      const b = bestScores[g.id];
      return `<div class="profile-game-row">
        <span>${g.icon} ${g.name}</span>
        <span>${b ? `${b.medal ? medalEmoji(b.medal) : ''} ${b.score}${g.id === 'gymnastics' ? '회' : g.id === 'marathon' ? '%' : '점'}` : '미도전'}</span>
      </div>`;
    }).join('');

    const currentGrade = Store.getGrade();

    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-icon">${profile.icon}</div>
        <div class="profile-name">${profile.username}</div>
        <div style="margin-top:8px;font-size:0.9rem;color:rgba(255,255,255,0.6);">현재 등급: ${currentGrade}</div>
      </div>
      ${streak ? `<div style="text-align:center;color:var(--blue);font-weight:600;margin-bottom:8px;">일일 도전 연속 ${streak}일</div>` : ''}
      <div class="profile-section" style="margin-top:16px;">
        <div class="profile-section-title">종목별 최고 기록</div>
        ${bestHtml}
      </div>
      <button class="btn-outline full-width" style="margin-top:12px;" id="profile-stats">📊 내 통계 보기</button>
      <button class="btn-outline full-width" style="margin-top:12px;" id="profile-change-grade">등급 변경</button>
      <button class="btn-red full-width" style="margin-top:12px;" id="profile-logout">로그아웃</button>
    `;

    $('profile-stats').addEventListener('click', () => {
      if (window._showStatistics) {
        window._showStatistics();
      }
    }, { signal });

    $('profile-change-grade').addEventListener('click', () => {
      if (showGradeSelectFn) {
        showGradeSelectFn();
      }
    }, { signal });

    $('profile-logout').addEventListener('click', async () => {
      await Store.logout();
      showAuthFn();
    }, { signal });
  });
}

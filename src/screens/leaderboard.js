import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';

export function showLeaderboard(showHubFn) {
  const signal = Router.navigate('screen-leaderboard');

  // Render sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = renderSidebar();
    updateSidebarData();
  }

  const tabs = ['종합', '양궁', '수영', '역도', '카드 뒤집기', '마라톤', '반의어', '사자성어', '동음이의'];
  const tabIds = ['total', 'archery', 'swimming', 'weightlifting', 'gymnastics', 'marathon', 'antonym', 'idiom', 'homonym'];
  let activeTab = 'total';
  const tabsEl = $('lb-tabs');
  tabsEl.innerHTML = tabs.map((t, i) => `<button class="lb-tab ${i === 0 ? 'active' : ''}" data-tab="${tabIds[i]}">${t}</button>`).join('');
  tabsEl.querySelectorAll('.lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      tabsEl.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLB(activeTab);
    }, { signal });
  });
  $('lb-back').addEventListener('click', () => showHubFn(), { signal });
  renderLB('total');
}

async function renderLB(tab) {
  const list = $('lb-list');
  list.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">로딩 중...</div>';
  const currentUser = Store.getCurrentUser();
  const currentGrade = Store.getGrade();
  const ranked = await Store.getLeaderboard(tab);

  if (!ranked || ranked.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">${currentGrade} 기록이 없습니다</div>`;
    return;
  }
  list.innerHTML = ranked.map((r, i) => {
    const rank = i + 1;
    const isMe = r.username === currentUser;
    let detail;
    if (tab === 'total') {
      detail = `총 ${r.totalPoints || 0}점`;
    } else {
      detail = tab === 'gymnastics' ? `${r.score}회` : tab === 'marathon' ? `${r.score}%` : `${r.score}점`;
    }
    return `<div class="lb-item ${isMe ? 'lb-me' : ''} anim-fadeIn" style="animation-delay:${i * 0.05}s">
      <span class="lb-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}">${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</span>
      <span class="lb-icon">${r.icon}</span>
      <div class="lb-info"><div class="lb-name">${r.username}</div><div class="lb-score">${detail}</div></div>
    </div>`;
  }).join('');
}

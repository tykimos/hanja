import Store from '../systems/store.js';
import { medalEmoji } from '../utils.js';

export function showSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.style.display = 'block';
}

export function hideSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.style.display = 'none';
}

export function renderSidebar() {
  const profile = Store.getProfile();
  if (!profile) return '';

  const currentGrade = Store.getGrade();
  const initials = profile.username.substring(0, 2).toUpperCase();

  return `
    <div class="sidebar-profile">
      <div class="sidebar-avatar" data-icon="${profile.icon}">
        <span class="sidebar-avatar-text">${initials}</span>
      </div>
      <div class="sidebar-username">${profile.username}</div>
      <div class="sidebar-grade">${currentGrade}</div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">ACHIEVEMENTS</div>
      <div class="sidebar-stats" id="sidebar-medals">
        <div class="sidebar-stat">
          <div class="sidebar-stat-value" data-type="gold">0</div>
          <div class="sidebar-stat-label">Gold</div>
        </div>
        <div class="sidebar-stat">
          <div class="sidebar-stat-value" data-type="silver">0</div>
          <div class="sidebar-stat-label">Silver</div>
        </div>
        <div class="sidebar-stat">
          <div class="sidebar-stat-value" data-type="bronze">0</div>
          <div class="sidebar-stat-label">Bronze</div>
        </div>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">ACTIVITY</div>
      <div class="sidebar-metric">
        <div class="sidebar-metric-label">Daily Streak</div>
        <div class="sidebar-metric-value" id="sidebar-streak">0</div>
      </div>
      <div class="sidebar-metric">
        <div class="sidebar-metric-label">Total Games</div>
        <div class="sidebar-metric-value" id="sidebar-total-games">0</div>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">RANKING</div>
      <div class="sidebar-metric">
        <div class="sidebar-metric-label">Today's Progress</div>
        <div class="sidebar-progress-bar">
          <div class="sidebar-progress-fill" id="sidebar-progress" style="width: 0%"></div>
        </div>
      </div>
      <div class="sidebar-metric">
        <div class="sidebar-metric-label">Weekly Rank</div>
        <div class="sidebar-metric-value" id="sidebar-rank">-</div>
      </div>
    </div>
  `;
}

export async function updateSidebarData() {
  try {
    const [bestScores, streak] = await Promise.all([
      Store.getBestScores(),
      Store.getDailyStreak(),
    ]);

    // Count medals
    let gold = 0, silver = 0, bronze = 0, totalGames = 0;
    Object.values(bestScores).forEach(score => {
      if (score) {
        totalGames++;
        if (score.medal === 'gold') gold++;
        else if (score.medal === 'silver') silver++;
        else if (score.medal === 'bronze') bronze++;
      }
    });

    // Update DOM
    const goldEl = document.querySelector('[data-type="gold"]');
    const silverEl = document.querySelector('[data-type="silver"]');
    const bronzeEl = document.querySelector('[data-type="bronze"]');
    const streakEl = document.getElementById('sidebar-streak');
    const totalGamesEl = document.getElementById('sidebar-total-games');
    const progressEl = document.getElementById('sidebar-progress');
    const rankEl = document.getElementById('sidebar-rank');

    if (goldEl) goldEl.textContent = gold;
    if (silverEl) silverEl.textContent = silver;
    if (bronzeEl) bronzeEl.textContent = bronze;
    if (streakEl) streakEl.textContent = streak || 0;
    if (totalGamesEl) totalGamesEl.textContent = totalGames;

    // Calculate progress (games played / total games)
    const totalAvailableGames = 9; // 8 games + daily
    const progress = Math.round((totalGames / totalAvailableGames) * 100);
    if (progressEl) progressEl.style.width = `${progress}%`;

    // Get rank (simplified - could fetch real rank later)
    if (rankEl) {
      const leaderboard = await Store.getLeaderboard('total');
      const currentUser = Store.getCurrentUser();
      const myRank = leaderboard.findIndex(r => r.username === currentUser);
      rankEl.textContent = myRank >= 0 ? `#${myRank + 1}` : '-';
    }
  } catch (err) {
    console.error('Failed to update sidebar data:', err);
  }
}

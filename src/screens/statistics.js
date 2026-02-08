import { supabase } from '../config.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';
import { ALL_HANJA, GAME_LIST, GRADE_HIERARCHY } from '../data/hanja.js';

export function showStatistics(showProfileFn) {
  const signal = Router.navigate('screen-statistics');
  $('stats-back').addEventListener('click', () => showProfileFn(), { signal });

  const content = $('statistics-content');
  content.innerHTML = '<div class="loading-spinner"></div>';

  const userId = Store.getUserId();
  if (!userId) {
    content.innerHTML = '<div style="text-align:center;color:#888;">로그인이 필요합니다</div>';
    return;
  }

  // Fetch all statistics data
  Promise.all([
    supabase
      .from('hanja_stats')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('scores')
      .select('game_id, score')
      .eq('user_id', userId),
  ]).then(([hanjaStatsRes, scoresRes]) => {
    const hanjaStats = hanjaStatsRes.data || [];
    const scores = scoresRes.data || [];

    // Process data
    const { topMissed, topCorrect, gradeAccuracy, gamePerformance } = processStatistics(hanjaStats, scores);

    // Render
    content.innerHTML = `
      <div class="stats-grid">
        ${renderTopMissedSection(topMissed)}
        ${renderTopCorrectSection(topCorrect)}
        ${renderGradeAccuracySection(gradeAccuracy)}
        ${renderGamePerformanceSection(gamePerformance)}
      </div>
    `;
  }).catch(err => {
    console.error('Failed to load statistics:', err);
    content.innerHTML = '<div style="text-align:center;color:#e74c3c;">통계 로딩 실패</div>';
  });
}

function processStatistics(hanjaStats, scores) {
  // Top 10 most missed
  const statsWithRate = hanjaStats
    .filter(s => s.wrong_count > 0)
    .map(s => {
      const total = s.correct_count + s.wrong_count;
      return {
        ...s,
        wrongRate: total > 0 ? (s.wrong_count / total * 100).toFixed(1) : 0
      };
    })
    .sort((a, b) => b.wrong_count - a.wrong_count)
    .slice(0, 10);

  const topMissed = statsWithRate.map(s => {
    const hanjaObj = ALL_HANJA.find(h => h.hanja === s.hanja_char);
    return {
      char: s.hanja_char,
      meaning: hanjaObj ? hanjaObj.fullHunEum : '?',
      count: s.wrong_count,
      rate: s.wrongRate
    };
  });

  // Top 10 most correct
  const statsCorrect = hanjaStats
    .filter(s => s.correct_count > 0)
    .map(s => {
      const total = s.correct_count + s.wrong_count;
      return {
        ...s,
        correctRate: total > 0 ? (s.correct_count / total * 100).toFixed(1) : 0
      };
    })
    .sort((a, b) => b.correct_count - a.correct_count)
    .slice(0, 10);

  const topCorrect = statsCorrect.map(s => {
    const hanjaObj = ALL_HANJA.find(h => h.hanja === s.hanja_char);
    return {
      char: s.hanja_char,
      meaning: hanjaObj ? hanjaObj.fullHunEum : '?',
      count: s.correct_count,
      rate: s.correctRate
    };
  });

  // Grade accuracy
  const gradeMap = {};
  hanjaStats.forEach(s => {
    const hanjaObj = ALL_HANJA.find(h => h.hanja === s.hanja_char);
    if (hanjaObj && hanjaObj.grade) {
      if (!gradeMap[hanjaObj.grade]) {
        gradeMap[hanjaObj.grade] = { correct: 0, wrong: 0 };
      }
      gradeMap[hanjaObj.grade].correct += s.correct_count;
      gradeMap[hanjaObj.grade].wrong += s.wrong_count;
    }
  });

  const grades = GRADE_HIERARCHY;
  const gradeAccuracy = grades.map(g => {
    const data = gradeMap[g];
    if (!data) return { grade: g, accuracy: 0, total: 0 };
    const total = data.correct + data.wrong;
    const accuracy = total > 0 ? (data.correct / total * 100).toFixed(1) : 0;
    return { grade: g, accuracy, total };
  }).filter(g => g.total > 0);

  // Game performance (average score per game)
  const gameMap = {};
  scores.forEach(s => {
    if (!gameMap[s.game_id]) {
      gameMap[s.game_id] = { total: 0, count: 0 };
    }
    gameMap[s.game_id].total += s.score;
    gameMap[s.game_id].count += 1;
  });

  const gamePerformance = [...GAME_LIST, { id: 'daily', name: '일일 도전', icon: '📅' }].map(g => {
    const data = gameMap[g.id];
    const avg = data ? (data.total / data.count).toFixed(1) : 0;
    return { ...g, avg, count: data ? data.count : 0 };
  }).filter(g => g.count > 0);

  return { topMissed, topCorrect, gradeAccuracy, gamePerformance };
}

function renderTopMissedSection(topMissed) {
  if (topMissed.length === 0) {
    return `<div class="stats-panel">
      <div class="stats-panel-title">자주 틀린 한자 TOP 10</div>
      <div style="text-align:center;color:#888;padding:20px;">데이터가 없습니다</div>
    </div>`;
  }

  return `<div class="stats-panel">
    <div class="stats-panel-title">자주 틀린 한자 TOP 10</div>
    <div class="stats-table">
      ${topMissed.map((item, idx) => `
        <div class="stats-row">
          <div class="stats-rank">${idx + 1}</div>
          <div class="stats-char">${item.char}</div>
          <div class="stats-meaning">${item.meaning}</div>
          <div class="stats-count">${item.count}회</div>
          <div class="stats-rate" style="color:var(--red);">${item.rate}%</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderTopCorrectSection(topCorrect) {
  if (topCorrect.length === 0) {
    return `<div class="stats-panel">
      <div class="stats-panel-title">자주 맞춘 한자 TOP 10</div>
      <div style="text-align:center;color:#888;padding:20px;">데이터가 없습니다</div>
    </div>`;
  }

  return `<div class="stats-panel">
    <div class="stats-panel-title">자주 맞춘 한자 TOP 10</div>
    <div class="stats-table">
      ${topCorrect.map((item, idx) => `
        <div class="stats-row">
          <div class="stats-rank">${idx + 1}</div>
          <div class="stats-char">${item.char}</div>
          <div class="stats-meaning">${item.meaning}</div>
          <div class="stats-count">${item.count}회</div>
          <div class="stats-rate" style="color:var(--green);">${item.rate}%</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderGradeAccuracySection(gradeAccuracy) {
  if (gradeAccuracy.length === 0) {
    return `<div class="stats-panel">
      <div class="stats-panel-title">급수별 정답률</div>
      <div style="text-align:center;color:#888;padding:20px;">데이터가 없습니다</div>
    </div>`;
  }

  const maxAccuracy = Math.max(...gradeAccuracy.map(g => parseFloat(g.accuracy)));

  return `<div class="stats-panel">
    <div class="stats-panel-title">급수별 정답률</div>
    <div class="stats-chart">
      ${gradeAccuracy.map(g => {
        const width = maxAccuracy > 0 ? (parseFloat(g.accuracy) / maxAccuracy * 100) : 0;
        const color = parseFloat(g.accuracy) >= 80 ? 'var(--green)' :
                      parseFloat(g.accuracy) >= 60 ? 'var(--yellow)' : 'var(--red)';
        return `
          <div class="stats-chart-row">
            <div class="stats-chart-label">${g.grade}</div>
            <div class="stats-chart-bar-container">
              <div class="stats-chart-bar" style="width:${width}%;background:${color};"></div>
            </div>
            <div class="stats-chart-value">${g.accuracy}%</div>
          </div>
        `;
      }).join('')}
    </div>
  </div>`;
}

function renderGamePerformanceSection(gamePerformance) {
  if (gamePerformance.length === 0) {
    return `<div class="stats-panel">
      <div class="stats-panel-title">종목별 평균 점수</div>
      <div style="text-align:center;color:#888;padding:20px;">데이터가 없습니다</div>
    </div>`;
  }

  return `<div class="stats-panel">
    <div class="stats-panel-title">종목별 평균 점수</div>
    <div class="stats-table">
      ${gamePerformance.map(g => `
        <div class="stats-row">
          <div style="font-size:1.5rem;">${g.icon}</div>
          <div style="flex:1;font-weight:600;">${g.name}</div>
          <div style="color:var(--gold);font-weight:700;">${g.avg}점</div>
          <div style="color:#888;font-size:.85rem;">${g.count}회</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

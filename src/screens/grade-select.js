import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';

const GRADES = [
  '8급', '7급', '6급', '준5급', '5급', '준4급', '4급', '준3급', '3급', '준2급', '2급', '준1급', '1급'
];

export function showGradeSelect(deps) {
  const { onComplete, showHub } = deps;
  const signal = Router.navigate('screen-grade-select');

  const profile = Store.getProfile();
  const currentGrade = profile?.grade || '8급';

  const container = $('grade-select-content');

  container.innerHTML = `
    <div class="grade-select-header">
      <div class="grade-select-title">나의 한자 등급 선택</div>
      <div class="grade-select-subtitle">학습할 등급을 선택해주세요</div>
    </div>

    <div class="grade-grid">
      ${GRADES.map(grade => `
        <button class="grade-btn ${grade === currentGrade ? 'grade-btn-selected' : ''}" data-grade="${grade}">
          <div class="grade-number">${grade}</div>
          <div class="grade-particles"></div>
        </button>
      `).join('')}
    </div>

    <div class="grade-actions">
      <button class="btn-primary full-width" id="grade-confirm" style="font-size:1.1rem;padding:16px;">
        확인
      </button>
    </div>
  `;

  let selectedGrade = currentGrade;

  // Grade button selection
  container.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('grade-btn-selected'));
      btn.classList.add('grade-btn-selected');
      selectedGrade = btn.dataset.grade;
    }, { signal });
  });

  // Confirm button
  $('grade-confirm').addEventListener('click', async () => {
    try {
      $('grade-confirm').disabled = true;
      $('grade-confirm').textContent = '저장 중...';

      await Store.setGrade(selectedGrade);

      if (onComplete) {
        onComplete();
      } else {
        showHub();
      }
    } catch (error) {
      console.error('Failed to save grade:', error);
      $('grade-confirm').disabled = false;
      $('grade-confirm').textContent = '확인';
      alert('등급 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, { signal });
}

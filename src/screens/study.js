import { ALL_HANJA, HANJA_BY_CATEGORY } from '../data/hanja.js';
import { ANTONYM_PAIRS } from '../data/antonyms.js';
import { IDIOMS } from '../data/idioms.js';
import { SoundSystem } from '../systems/sound.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';

export function showStudy(showHubFn) {
  const signal = Router.navigate('screen-study');
  $('study-back').addEventListener('click', () => showHubFn(), { signal });
  const content = $('study-content');

  const categories = ['전체', ...Object.keys(HANJA_BY_CATEGORY)];
  let activeFilter = '전체';
  let filteredList = [...ALL_HANJA];
  let cardIndex = 0;
  let isFlipped = false;

  function getFiltered() {
    if (activeFilter === '전체') return ALL_HANJA;
    return HANJA_BY_CATEGORY[activeFilter] || [];
  }

  function render() {
    filteredList = getFiltered();
    if (cardIndex >= filteredList.length) cardIndex = 0;
    const h = filteredList[cardIndex];
    const hasCards = filteredList.length > 0;

    content.innerHTML = `
      <div class="study-filters" id="study-filters">
        ${categories.map(c => `<button class="study-filter ${c === activeFilter ? 'active' : ''}" data-cat="${c}">${c}${HANJA_BY_CATEGORY[c] ? ` (${HANJA_BY_CATEGORY[c].length})` : c === '전체' ? ` (${ALL_HANJA.length})` : ''}</button>`).join('')}
      </div>
      ${hasCards ? `
        <div class="study-card-container" id="study-card-tap">
          <div class="study-card" id="study-card">
            <div class="study-card-face study-front">
              <div class="study-category">${h.category}</div>
              <div class="study-hanja">${h.hanja}</div>
              <div style="font-size:.85rem;color:#aaa;margin-top:8px;">탭하여 뒤집기</div>
            </div>
            <div class="study-card-face study-back">
              <div class="study-category">${h.category}</div>
              <div class="study-hanja">${h.hanja}</div>
              <div class="study-huneum">${h.fullHunEum}</div>
              <div style="font-size:.9rem;color:#666;">훈: ${h.hun} / 음: ${h.eum}</div>
            </div>
          </div>
        </div>
        <div class="study-nav">
          <button class="btn-secondary" id="study-prev" style="font-size:1.3rem;">&#8592;</button>
          <span class="study-counter">${cardIndex + 1} / ${filteredList.length}</span>
          <button class="btn-secondary" id="study-next" style="font-size:1.3rem;">&#8594;</button>
        </div>
      ` : '<div style="text-align:center;padding:40px;color:#888;">해당 한자가 없습니다</div>'}

      <div class="study-section">
        <div class="study-section-title">사자성어</div>
        ${IDIOMS.map(id => `<div class="idiom-card">
          <div class="idiom-hanja">${id.idiom}</div>
          <div class="idiom-reading">${id.reading}</div>
          <div class="idiom-meaning">${id.meaning}</div>
        </div>`).join('')}
      </div>

      <div class="study-section">
        <div class="study-section-title">반의어 짝</div>
        <div class="antonym-grid">
          ${ANTONYM_PAIRS.map(([a, b]) => {
            const ha = ALL_HANJA.find(x => x.hanja === a);
            const hb = ALL_HANJA.find(x => x.hanja === b);
            return `<div class="antonym-pair">
              <div class="antonym-hanja">${a} ↔ ${b}</div>
              <div class="antonym-reading">${ha ? ha.fullHunEum : ''} / ${hb ? hb.fullHunEum : ''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
    isFlipped = false;
    content.querySelectorAll('.study-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.cat; cardIndex = 0; render();
      }, { signal });
    });
    if (hasCards) {
      $('study-card-tap').addEventListener('click', () => {
        isFlipped = !isFlipped;
        $('study-card').classList.toggle('flipped', isFlipped);
        SoundSystem.playSound('flip');
      }, { signal });
      $('study-prev').addEventListener('click', () => {
        cardIndex = (cardIndex - 1 + filteredList.length) % filteredList.length; render();
      }, { signal });
      $('study-next').addEventListener('click', () => {
        cardIndex = (cardIndex + 1) % filteredList.length; render();
      }, { signal });
    }
  }
  render();
}

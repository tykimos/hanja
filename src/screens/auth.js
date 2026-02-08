import { FLAG_ICONS } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';

export function showAuth(showHubFn, showGradeSelectFn) {
  const signal = Router.navigate('screen-auth');
  let mode = 'login';
  renderAuthForm(mode, signal, showHubFn, showGradeSelectFn);
  $('auth-tabs').querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.tab;
      $('auth-tabs').querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderAuthForm(mode, signal, showHubFn, showGradeSelectFn);
    }, { signal });
  });
}

function renderAuthForm(mode, signal, showHubFn, showGradeSelectFn) {
  const form = $('auth-form');
  $('auth-error').textContent = '';
  if (mode === 'login') {
    form.innerHTML = `
      <div class="input-group"><label>이메일</label><input type="email" id="auth-email" autocomplete="email"></div>
      <div class="input-group"><label>비밀번호</label><input type="password" id="auth-pw" autocomplete="current-password"></div>
      <button class="btn-primary" id="auth-submit">로그인</button>
    `;
  } else {
    form.innerHTML = `
      <div class="input-group"><label>이메일</label><input type="email" id="auth-email" autocomplete="email"></div>
      <div class="input-group"><label>닉네임 (2~8자)</label><input type="text" id="auth-name" maxlength="8" autocomplete="username"></div>
      <div class="input-group"><label>비밀번호 (6자 이상)</label><input type="password" id="auth-pw" autocomplete="new-password"></div>
      <div class="input-group"><label>아이콘 선택</label>
        <div class="icon-picker" id="auth-icons">${FLAG_ICONS.map(ic => `<div class="icon-option" data-icon="${ic}">${ic}</div>`).join('')}</div>
      </div>
      <button class="btn-primary" id="auth-submit">회원가입</button>
    `;
    let selectedIcon = FLAG_ICONS[0];
    const iconEls = $('auth-icons').querySelectorAll('.icon-option');
    iconEls[0].classList.add('selected');
    iconEls.forEach(el => {
      el.addEventListener('click', () => {
        iconEls.forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        selectedIcon = el.dataset.icon;
      }, { signal });
    });
    form._getIcon = () => selectedIcon;
  }
  $('auth-submit').addEventListener('click', async () => {
    const email = $('auth-email').value.trim();
    const pw = $('auth-pw').value;
    $('auth-submit').disabled = true;
    $('auth-submit').textContent = '처리 중...';
    if (mode === 'login') {
      if (!email || !pw) { $('auth-error').textContent = '이메일과 비밀번호를 입력하세요'; $('auth-submit').disabled = false; $('auth-submit').textContent = '로그인'; return; }
      const result = await Store.login(email, pw);
      if (result.error) {
        $('auth-error').textContent = result.error;
        $('auth-submit').disabled = false;
        $('auth-submit').textContent = '로그인';
      } else {
        // Check if user has grade set
        const grade = Store.getGrade();
        if (!grade) {
          // Show grade selection for new users
          if (showGradeSelectFn) {
            showGradeSelectFn();
          } else {
            showHubFn();
          }
        } else {
          showHubFn();
        }
      }
    } else {
      const name = $('auth-name')?.value.trim();
      if (!email) { $('auth-error').textContent = '이메일을 입력하세요'; $('auth-submit').disabled = false; $('auth-submit').textContent = '회원가입'; return; }
      if (!name || name.length < 2 || name.length > 8) { $('auth-error').textContent = '닉네임은 2~8자로 입력하세요'; $('auth-submit').disabled = false; $('auth-submit').textContent = '회원가입'; return; }
      if (pw.length < 6) { $('auth-error').textContent = '비밀번호는 6자 이상이어야 합니다'; $('auth-submit').disabled = false; $('auth-submit').textContent = '회원가입'; return; }
      const icon = form._getIcon ? form._getIcon() : FLAG_ICONS[0];
      const result = await Store.signup(email, pw, name, icon);
      if (result.error) {
        $('auth-error').textContent = result.error;
        $('auth-submit').disabled = false;
        $('auth-submit').textContent = '회원가입';
      } else {
        // Always show grade selection for new signups
        if (showGradeSelectFn) {
          showGradeSelectFn();
        } else {
          showHubFn();
        }
      }
    }
  }, { signal });
}

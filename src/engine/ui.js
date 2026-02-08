import { GE3D } from './ge3d.js';

// Note: showHub is attached to window in main.js

export function g3dHUD(left,center,right){
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;pointer-events:auto;">
    <div style="display:flex;gap:8px;align-items:center;">${left}</div>
    <div style="font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.5);font-size:.95rem;">${center}</div>
    <div style="display:flex;gap:8px;align-items:center;">${right}</div>
  </div>`;
}
export function g3dBackBtn(){
  return `<button class="g3d-btn" onclick="GE3D.stop();showHub();" style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:1.2rem;display:flex;align-items:center;justify-content:center;border:none;backdrop-filter:blur(4px);cursor:pointer;pointer-events:auto;">&#8592;</button>`;
}
export function g3dBadge(text,color){
  return `<span style="background:${color||'rgba(0,0,0,.5)'};color:#fff;font-weight:800;font-size:.85rem;padding:4px 12px;border-radius:12px;text-shadow:0 1px 2px rgba(0,0,0,.5);">${text}</span>`;
}
export function g3dProgress(pct,color){
  return `<div style="position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,.15);">
    <div style="height:100%;width:${pct}%;background:${color||'#76FF03'};transition:width .3s;border-radius:0 2px 2px 0;"></div></div>`;
}
export function g3dAnswerGrid(opts,onClickFn,isHanja){
  const w=window.innerWidth;
  const isDesktop=w>=1024;
  const gridCols=isDesktop?'1fr 1fr 1fr 1fr':'1fr 1fr';
  const showNumbers=isDesktop;
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:12px;display:grid;grid-template-columns:${gridCols};gap:10px;pointer-events:auto;">
    ${opts.map((o,i)=>`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="${onClickFn}(${i})"
      style="padding:${isHanja?'14px 8px':'18px 10px'};border-radius:16px;font-size:${isHanja?'clamp(28px,7vw,44px)':'1.1rem'};font-weight:800;
      border:2px solid rgba(255,255,255,.2);color:#fff;text-align:center;
      background:rgba(255,255,255,.12);backdrop-filter:blur(8px);min-height:56px;
      cursor:pointer;transition:all .15s;text-shadow:0 1px 3px rgba(0,0,0,.4);
      font-family:inherit;position:relative;">${showNumbers?`<span style="position:absolute;top:4px;left:8px;font-size:0.7rem;opacity:0.6;">${i+1}</span>`:''}${o.label}</button>`).join('')}
  </div>`;
}
export function g3dCountdown(n){
  return `<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100;">
    <div style="font-size:6rem;font-weight:900;color:#FFD700;text-shadow:0 0 40px rgba(255,215,0,.8);">${n>0?n:'GO!'}</div></div>`;
}
export function g3dLeaderboardSidebar(topScores, currentScore, gameId, playerName) {
  const isLower = gameId === 'gymnastics';
  const allEntries = [...topScores];
  let myRank = allEntries.length + 1;
  for (let i = 0; i < allEntries.length; i++) {
    if (isLower ? currentScore <= allEntries[i].score : currentScore >= allEntries[i].score) {
      myRank = i + 1; break;
    }
  }
  let html = '<div class="g3d-lb-sidebar">';
  html += '<div class="g3d-lb-title">Ranking</div>';
  allEntries.slice(0, 5).forEach((e, i) => {
    const medals = ['&#x1F947;','&#x1F948;','&#x1F949;'];
    html += `<div class="g3d-lb-entry ${i < 3 ? 'top3' : ''}">`;
    html += `<span class="g3d-lb-rank">${i < 3 ? medals[i] : (i+1)}</span>`;
    html += `<span class="g3d-lb-name">${e.icon || ''} ${e.username || '?'}</span>`;
    html += `<span class="g3d-lb-score">${e.score}</span>`;
    html += `</div>`;
  });
  html += `<div class="g3d-lb-entry g3d-lb-me">`;
  html += `<span class="g3d-lb-rank">${myRank}</span>`;
  html += `<span class="g3d-lb-name">${playerName || '나'}</span>`;
  html += `<span class="g3d-lb-score">${currentScore}</span>`;
  html += `</div>`;
  html += '</div>';
  return html;
}
export function markAnswer(idx,correctIdx){
  const btns=document.querySelectorAll('.g3d-ans');
  btns.forEach((b,i)=>{
    b.style.pointerEvents='none';
    if(i===correctIdx){b.style.background='rgba(0,200,80,.7)';b.style.borderColor='#00A651';}
    else if(i===idx&&i!==correctIdx){b.style.background='rgba(238,51,78,.7)';b.style.borderColor='#EE334E';}
    else{b.style.opacity='.5';}
  });
}

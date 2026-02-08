import { ALL_HANJA } from './data/hanja.js';
import Store from './systems/store.js';

export function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export function seededRandom(seed){let s=seed;return function(){s=(s*16807)%2147483647;return(s-1)/2147483646;};}

export function getDateSeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}

export function seededShuffle(arr,seed){const a=[...arr];const rng=seededRandom(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export function $(id){return document.getElementById(id);}

export function formatTime(ms){const s=Math.floor(ms/1000);const m=Math.floor(s/60);return m>0?`${m}분 ${s%60}초`:`${s}초`;}

export function medalEmoji(m){return m==='gold'?'🥇':m==='silver'?'🥈':m==='bronze'?'🥉':'';}

export function spawnConfetti(){
  const colors=['#FFD700','#EE334E','#0081C8','#00A651','#FCB131','#FF69B4'];
  for(let i=0;i<40;i++){
    const el=document.createElement('div');
    el.className='confetti-piece';
    el.style.left=Math.random()*100+'vw';
    el.style.background=colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDelay=Math.random()*1.5+'s';
    el.style.animationDuration=(2+Math.random()*1.5)+'s';
    el.style.width=(6+Math.random()*8)+'px';
    el.style.height=(6+Math.random()*8)+'px';
    el.style.borderRadius=Math.random()>0.5?'50%':'2px';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }
}

export function generateDecoys(correct,pool,count,key){
  // prefer same-eum for fullHunEum key
  const decoys=[];
  const sameEum=pool.filter(h=>h.hanja!==correct.hanja&&h.eum===correct.eum);
  const others=pool.filter(h=>h.hanja!==correct.hanja&&h.eum!==correct.eum);
  const shuffledSame=shuffle(sameEum);
  const shuffledOthers=shuffle(others);
  const candidates=[...shuffledSame,...shuffledOthers];
  const usedVals=new Set();usedVals.add(correct[key]);
  for(const c of candidates){
    if(!usedVals.has(c[key])){
      decoys.push(c);usedVals.add(c[key]);
      if(decoys.length>=count)break;
    }
  }
  // fallback if not enough unique
  if(decoys.length<count){
    for(const c of shuffle(pool)){
      if(c.hanja!==correct.hanja&&!decoys.includes(c)){
        decoys.push(c);
        if(decoys.length>=count)break;
      }
    }
  }
  return decoys;
}

export function recordGameResult(gameId,score,total,medal,wrongList){
  Store.saveScore(gameId, score, total, medal, wrongList);
}

export function recordEncountered(hanjaChars){
  // Encountered tracking handled server-side through scores
}

export function getMedalForScore(gameId,score){
  switch(gameId){
    case 'archery':case 'daily':return score>=9?'gold':score>=7?'silver':score>=5?'bronze':null;
    case 'swimming':return score>=20?'gold':score>=15?'silver':score>=10?'bronze':null;
    case 'weightlifting':return score>=15?'gold':score>=10?'silver':score>=5?'bronze':null;
    case 'gymnastics':return score<=12?'gold':score<=16?'silver':score<=20?'bronze':null;
    case 'marathon':return score>=90?'gold':score>=70?'silver':score>=50?'bronze':null;
    case 'antonym':return score>=9?'gold':score>=7?'silver':score>=5?'bronze':null;
    case 'idiom':return score>=80?'gold':score>=60?'silver':score>=40?'bronze':null;
    case 'homonym':return score>=15?'gold':score>=10?'silver':score>=5?'bronze':null;
    default:return null;
  }
}

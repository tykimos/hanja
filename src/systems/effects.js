import { SoundSystem } from './sound.js';

export const Effects={
  shake(level='light'){
    const el=document.querySelector('.app-container');if(!el)return;
    el.classList.remove('shake-light','shake-medium','shake-heavy');
    void el.offsetWidth;
    el.classList.add('shake-'+level);
    if(navigator.vibrate)navigator.vibrate(level==='heavy'?[50,30,80]:level==='medium'?[40,20,40]:[30]);
    setTimeout(()=>el.classList.remove('shake-'+level),level==='heavy'?500:level==='medium'?300:200);
  },
  flash(color='green'){
    let el=document.querySelector('.flash-overlay');
    if(!el){el=document.createElement('div');el.className='flash-overlay';document.body.appendChild(el);}
    el.className='flash-overlay flash-'+color;
    void el.offsetWidth;el.classList.add('active');
    setTimeout(()=>{el.classList.remove('active');},color==='gold'?350:200);
  },
  hitStop(ms=80){
    const el=document.querySelector('.app-container');if(!el)return;
    el.classList.add('hit-stop');setTimeout(()=>el.classList.remove('hit-stop'),ms);
  },
  particles(type,x,y,count=8){
    const colors={sparkle:['#FFD700','#FF6B6B','#00E5FF','#76FF03','#FF4081','#FFEA00'],
      splash_p:['#00B4D8','#48CAE4','#90E0EF','#ADE8F4'],dust_p:['#8D6E63','#A1887F','#BCAAA4'],
      heart_break:['#EE334E','#FF6B6B']};
    const cls=type==='splash_p'?'splash-p':type==='dust_p'?'dust-p':type;
    for(let i=0;i<count;i++){
      const el=document.createElement('div');el.className='particle '+cls;
      const angle=Math.random()*Math.PI*2;const dist=30+Math.random()*50;
      const dx=Math.cos(angle)*dist,dy=Math.sin(angle)*dist;
      el.style.cssText=`left:${x}px;top:${y}px;--dx:${dx}px;--dy:${dy}px;--dx2:${dx*0.7}px;--rot:${Math.random()*360}deg;`;
      if(type==='heart_break'){el.textContent='💔';}
      else{const c=(colors[type]||colors.sparkle);el.style.background=c[Math.floor(Math.random()*c.length)];}
      document.body.appendChild(el);setTimeout(()=>el.remove(),700);
    }
  },
  comboPopup(count,container){
    if(!container)return;
    let el=container.querySelector('.combo-display');
    if(!el){el=document.createElement('div');el.className='combo-display';container.appendChild(el);}
    const tier=count>=5?'ULTRA':count>=3?'SUPER':count>=2?'COMBO':'';
    if(!tier){el.innerHTML='';return;}
    const color=count>=5?'#FFD700':count>=3?'#FF4081':'#00E5FF';
    const size=Math.min(1.5+count*0.15,3);
    el.innerHTML=`<div class="combo-text" style="font-size:${size}rem;color:${color};">${count}x ${tier}!</div>`;
  },
  textPopup(text,color,x,y,container){
    const el=document.createElement('div');el.className='text-popup';
    el.style.cssText=`left:${x}px;top:${y}px;color:${color};font-size:1.4rem;`;
    el.textContent=text;(container||document.body).appendChild(el);
    setTimeout(()=>el.remove(),800);
  },
  countdown(callback){
    const overlay=document.createElement('div');overlay.className='countdown-overlay';
    document.body.appendChild(overlay);
    const steps=['3','2','1','GO!'];
    let i=0;
    const next=()=>{
      if(i>=steps.length){overlay.remove();callback();return;}
      overlay.innerHTML=`<div class="countdown-text ${steps[i]==='GO!'?'go':''}">${steps[i]}</div>`;
      SoundSystem.playSound(steps[i]==='GO!'?'countdown_go':'countdown_tick');
      i++;setTimeout(next,700);
    };
    next();
  },
  vignette(show){
    let el=document.querySelector('.vignette-red');
    if(show&&!el){el=document.createElement('div');el.className='vignette-red';document.body.appendChild(el);}
    if(!show&&el)el.remove();
  },
  clearAll(){
    document.querySelectorAll('.flash-overlay,.particle,.countdown-overlay,.vignette-red,.combo-display,.text-popup,.obstacle-banner').forEach(e=>e.remove());
    SoundSystem.stopAllLoops();
    const el=document.querySelector('.app-container');
    if(el)el.classList.remove('shake-light','shake-medium','shake-heavy','hit-stop');
  }
};

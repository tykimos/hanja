import * as THREE from 'three';
import { getHanjaForGrade } from '../data/hanja.js';
import { SoundSystem } from '../systems/sound.js';
import { Effects } from '../systems/effects.js';
import { GE3D } from '../engine/ge3d.js';
import { voxBox, voxBoxPhong, makeVoxelChar, makeVoxelTree, makeTextCanvas, makeTextSprite, project3Dto2D } from '../engine/helpers.js';
import { g3dHUD, g3dBackBtn, g3dBadge, g3dProgress, g3dAnswerGrid, g3dCountdown, markAnswer, g3dLeaderboardSidebar } from '../engine/ui.js';
import { shuffle, generateDecoys, recordEncountered, getMedalForScore, recordGameResult } from '../utils.js';
import Store from '../systems/store.js';
import { logAnswer } from '../systems/answer-logger.js';

export function createHomonymGame3D(){
  let scene,camera,score,wrong,enc,timeLeft,curQ,answered,phase,countdown,cdT;
  let swimmers3d,buoys3d,waterPlane;
  let topScores=[];
  let allowedHanja, homSets;
  function reset(){
    // Build homonym questions from grade-filtered hanja
    allowedHanja = getHanjaForGrade(Store.getGrade());
    const eumMap={};
    allowedHanja.forEach(h=>{if(!eumMap[h.eum])eumMap[h.eum]=[];eumMap[h.eum].push(h);});
    homSets=Object.entries(eumMap).filter(([k,v])=>v.length>=2).map(([eum,chars])=>({eum,chars}));

    const qPool=shuffle(homSets).slice(0,20);
    // For each set, create a question: show chars with same reading, ask hun of one
    const questions=[];
    qPool.forEach(s=>{
      const target=s.chars[Math.floor(Math.random()*s.chars.length)];
      let opts=[target.hun];
      while(opts.length<4){const r=allowedHanja[Math.floor(Math.random()*allowedHanja.length)];if(!opts.includes(r.hun)&&r.eum!==s.eum)opts.push(r.hun);}
      opts=shuffle(opts);
      questions.push({eum:s.eum,chars:s.chars,target,opts,correctIdx:opts.indexOf(target.hun)});
    });
    curQ=questions;score=0;wrong=[];enc=[];answered=false;timeLeft=60;
    phase='countdown';countdown=3;cdT=0;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x0a2a4a);
    scene.fog=new THREE.Fog(0x0a2a4a,25,50);
    camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,8,12);camera.lookAt(0,1,0);
    scene.add(new THREE.AmbientLight(0x4488cc,0.6));
    const dL=new THREE.DirectionalLight(0xeef8ff,0.8);dL.position.set(3,10,5);scene.add(dL);
    const neon1=new THREE.PointLight(0x00ffff,1.2,15);neon1.position.set(-5,4,0);scene.add(neon1);
    const neon2=new THREE.PointLight(0xff00ff,1.2,15);neon2.position.set(5,4,0);scene.add(neon2);
    // pool walls
    const poolLen=30;
    const wallL=voxBox(0.5,1.5,poolLen,0x0081C8);wallL.position.set(-5,0.25,-poolLen/2+5);scene.add(wallL);
    const wallR=voxBox(0.5,1.5,poolLen,0x0081C8);wallR.position.set(5,0.25,-poolLen/2+5);scene.add(wallR);
    const wallF=voxBox(10.5,1.5,0.5,0x0081C8);wallF.position.set(0,0.25,5.25);scene.add(wallF);
    const wallB=voxBox(10.5,1.5,0.5,0x0081C8);wallB.position.set(0,0.25,-poolLen+5.25);scene.add(wallB);
    // water
    const wGeo=new THREE.PlaneGeometry(10,poolLen,20,40);
    const wMat=new THREE.MeshPhongMaterial({color:0x0066cc,transparent:true,opacity:0.7,shininess:80,side:THREE.DoubleSide});
    waterPlane=new THREE.Mesh(wGeo,wMat);waterPlane.rotation.x=-Math.PI/2;waterPlane.position.set(0,0.3,-poolLen/2+5);scene.add(waterPlane);
    // lane buoys
    buoys3d=[];
    for(let lane=-3;lane<=3;lane+=2){
      for(let z=4;z>=-20;z-=3){
        const b=voxBox(0.2,0.2,0.2,z%6===0?0xEE334E:0xFFFFFF);
        b.position.set(lane,0.5,z);scene.add(b);buoys3d.push(b);
      }
    }
    // swimmers (3 voxel swimmers)
    swimmers3d=[];
    [-2,0,2].forEach((x,i)=>{
      const s=makeVoxelChar([0x0081C8,0x00A651,0xEE334E][i],0xFFDDB0);
      s.rotation.x=-Math.PI/4;s.position.set(x,0.3,3);s.scale.setScalar(0.5);
      scene.add(s);swimmers3d.push({mesh:s,progress:0,speed:0.3+Math.random()*0.3,baseX:x});
    });
    // scoreboard
    const board=voxBox(6,2,0.3,0x1a1a2e);board.position.set(0,3.5,5.5);scene.add(board);
    showQuestion(0);
  }
  let qIdx=0;
  function showQuestion(i){
    if(i>=curQ.length||timeLeft<=0){phase='done';return;}
    qIdx=i;answered=false;
    const q=curQ[i];
    q.chars.forEach(c=>enc.push(c.hanja));
    updateUI();
  }
  function updateUI(){
    if(qIdx>=curQ.length){phase='done';return;}
    const q=curQ[qIdx];
    let h='';
    h+=g3dProgress(qIdx/curQ.length*100,'#00ffff');
    h+=g3dHUD(g3dBackBtn(),g3dBadge(Math.ceil(timeLeft)+'s',timeLeft<=10?'rgba(238,51,78,.6)':'rgba(0,0,0,.5)'),
      g3dBadge(score+'문제','rgba(0,255,255,.3)'));
    // show chars with same reading
    h+=`<div style="text-align:center;margin-top:6px;pointer-events:none;">
      <div style="font-size:.7rem;color:rgba(255,255,255,.5);">같은 음 "${q.eum}" - ${q.target.hanja}의 뜻(훈)은?</div>
      <div style="display:flex;justify-content:center;gap:12px;margin-top:4px;">`;
    q.chars.forEach(c=>{
      const isTarget=c.hanja===q.target.hanja;
      h+=`<span style="font-size:${isTarget?'2.5rem':'1.8rem'};font-weight:900;color:${isTarget?'#00ffff':'rgba(255,255,255,.5)'};
        text-shadow:${isTarget?'0 0 15px rgba(0,255,255,.5)':'none'};${isTarget?'border-bottom:3px solid #00ffff;padding-bottom:4px;':''}">${c.hanja}</span>`;
    });
    h+=`</div></div>`;
    // answer buttons
    h+=`<div style="position:absolute;bottom:0;left:0;right:0;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;pointer-events:auto;">`;
    q.opts.forEach((o,i)=>{
      h+=`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="window._homonymAnswer(${i})"
        style="padding:18px 10px;border-radius:16px;font-size:1.1rem;font-weight:800;
        border:2px solid rgba(255,255,255,.2);color:#fff;text-align:center;
        background:rgba(255,255,255,.12);backdrop-filter:blur(8px);min-height:56px;
        cursor:pointer;transition:all .15s;text-shadow:0 1px 3px rgba(0,0,0,.4);
        font-family:inherit;">${o}</button>`;
    });
    h+=`</div>`;
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,score,'homonym',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._homonymAnswer=function(idx){
    if(phase!=='play'||answered)return;
    answered=true;
    const q=curQ[qIdx];
    const correct=idx===q.correctIdx;
    markAnswer(idx,q.correctIdx);

    // Log answer
    logAnswer('homonym', q.target.hanja, correct);

    if(correct){
      score++;SoundSystem.playSound('correct');
      GE3D.shake(1,0.2);
      GE3D.burst3d(scene,0,2,0,0x00ffff,15,3,0.6);
      // advance swimmer
      swimmers3d.forEach(s=>{s.progress+=0.5;});
    }else{
      wrong.push(q.target.hanja+'('+q.target.hun+')');
      SoundSystem.playSound('wrong');GE3D.shake(2,0.3);
      GE3D.burst3d(scene,0,2,0,0xEE334E,10,2,0.4);
    }
    setTimeout(()=>{showQuestion(qIdx+1);},800);
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('homonym').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='play';SoundSystem.playSound('countdown_go');}updateUI();}}
      if(phase==='play'){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;phase='done';}
        if(Math.floor(timeLeft)!==Math.floor(timeLeft+dt))updateUI();
      }
      // water animation
      if(waterPlane){
        const geo=waterPlane.geometry;const pos=geo.attributes.position;
        const t=performance.now()/1000;
        for(let i=0;i<pos.count;i++){
          const x=pos.getX(i),y=pos.getY(i);
          pos.setZ(i,Math.sin(x*2+t*3)*0.08+Math.cos(y*1.5+t*2)*0.05);
        }
        pos.needsUpdate=true;
      }
      // swimmers animation
      swimmers3d.forEach((s,i)=>{
        const targetZ=3-s.progress*2;
        s.mesh.position.z+=(targetZ-s.mesh.position.z)*dt*2;
        s.mesh.position.y=0.3+Math.sin(performance.now()/300+i)*0.1;
        // arm stroke
        const arms=s.mesh.children.filter((c,j)=>j===2||j===3);
        arms.forEach((a,j)=>{a.rotation.x=Math.sin(performance.now()/200+j*Math.PI)*0.8;});
      });
      // buoys bob
      buoys3d.forEach((b,i)=>{b.position.y=0.5+Math.sin(performance.now()/500+i*0.5)*0.1;});
    },
    onTap(){},
    getResult(){
      recordEncountered(enc);
      const place=score>=15?1:score>=10?2:score>=5?3:4;
      const m=getMedalForScore('homonym',score);
      recordGameResult('homonym',score,0,m,wrong);
      return{gameId:'homonym',name:'동음이의',score,total:0,medal:m,detail:'60초 '+score+'문제 정답 ('+place+'위)'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

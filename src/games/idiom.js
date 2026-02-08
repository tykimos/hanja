import * as THREE from 'three';
import { getHanjaForGrade } from '../data/hanja.js';
import { IDIOMS } from '../data/idioms.js';
import { SoundSystem } from '../systems/sound.js';
import { Effects } from '../systems/effects.js';
import { GE3D } from '../engine/ge3d.js';
import { voxBox, voxBoxPhong, makeVoxelChar, makeVoxelTree, makeTextCanvas, makeTextSprite, project3Dto2D } from '../engine/helpers.js';
import { g3dHUD, g3dBackBtn, g3dBadge, g3dProgress, g3dAnswerGrid, g3dCountdown, markAnswer, g3dLeaderboardSidebar } from '../engine/ui.js';
import { shuffle, generateDecoys, recordEncountered, getMedalForScore, recordGameResult } from '../utils.js';
import Store from '../systems/store.js';
import { logAnswer } from '../systems/answer-logger.js';

export function createIdiomGame3D(){
  let scene,camera,qs,cur,score,wrong,enc,hp,streak,speedLv,phase,countdown,cdT,startTime;
  let runner3d,trees3d,walls3d,roadOffset,runFrame,wallZ,wallHit;
  const spdNames=['산책','걷기','달리기','전력질주!'];
  const spdCols=['#4CAF50','#FF9800','#E91E63','#FFD700'];
  let heartbeatT,curOpts,wallPhase;
  let topScores=[];
  const extraMeanings=['물과 불처럼 맞지 않음','서로 힘을 합침','옛것을 배워 새것을 앎','마음을 하나로 모음','하루가 천년 같음','어려운 일을 해냄'];
  function reset(){
    // Filter idioms to only include those where all 4 characters are in allowed hanja
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const allowedSet = new Set(allowedHanja.map(h => h.hanja));
    const filteredIdioms = IDIOMS.filter(idiom => {
      const chars = idiom.idiom.split('');
      return chars.every(c => allowedSet.has(c));
    });
    qs = shuffle(filteredIdioms);
    cur=0;score=0;wrong=[];enc=[];hp=3;streak=0;speedLv=0;
    phase='countdown';countdown=3;cdT=0;startTime=Date.now();
    roadOffset=0;runFrame=0;heartbeatT=0;wallZ=-20;wallHit=false;wallPhase='approaching';
    scene=new THREE.Scene();scene.background=new THREE.Color(0x4a2a0a);
    scene.fog=new THREE.Fog(0x4a2a0a,20,60);
    camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,4,6);camera.lookAt(0,1,-5);
    scene.add(new THREE.AmbientLight(0xaa8844,0.6));
    const sun=new THREE.DirectionalLight(0xffaa44,0.8);sun.position.set(5,10,5);scene.add(sun);
    // torches instead of sun
    const t1=new THREE.PointLight(0xff6622,1.5,15);t1.position.set(-5,3,0);scene.add(t1);
    const t2=new THREE.PointLight(0xff6622,1.5,15);t2.position.set(5,3,0);scene.add(t2);
    // road - temple path
    for(let z=10;z>=-40;z-=2){
      const g=voxBox(16,0.3,2,z%4===0?0x3a2a0a:0x2a1a00);g.position.set(0,-0.15,z);scene.add(g);
      const r=voxBox(5,0.35,2,0x8B4513);r.position.set(0,0,z);scene.add(r);
      if(z%4===0){const m=voxBox(0.8,0.36,0.15,0xFFD700);m.position.set(0,0,z);scene.add(m);}
    }
    // lantern poles along path
    trees3d=[];
    for(let i=0;i<16;i++){
      const side=i%2===0?-1:1;
      const g=new THREE.Group();
      const pole=voxBox(0.2,3,0.2,0x8B4513);pole.position.y=1.5;g.add(pole);
      const lamp=voxBox(0.5,0.5,0.5,0xEE334E);lamp.position.y=3.2;g.add(lamp);
      const glow=new THREE.PointLight(0xff6622,0.4,6);glow.position.y=3.2;g.add(glow);
      g.position.set(side*(4+Math.random()),0,8-i*3);
      scene.add(g);trees3d.push(g);
    }
    // temple gate at end
    const gate=new THREE.Group();
    gate.add(voxBox(0.5,4,0.5,0xEE334E));gate.children[0].position.set(-3,2,-30);
    gate.add(voxBox(0.5,4,0.5,0xEE334E));gate.children[1].position.set(3,2,-30);
    gate.add(voxBox(7,0.5,0.5,0xEE334E));gate.children[2].position.set(0,4,-30);
    gate.add(voxBox(7.5,0.3,0.3,0x8B4513));gate.children[3].position.set(0,4.3,-30);
    scene.add(gate);
    // runner - in traditional colors
    runner3d=makeVoxelChar(0xEE334E,0xFFDDB0);
    runner3d.position.set(0,0.5,0);runner3d.scale.setScalar(0.8);scene.add(runner3d);
    walls3d=[];
    setupQ();
  }
  function setupQ(){
    if(cur>=qs.length||hp<=0){phase='done';return;}
    const q=qs[cur];
    enc.push(...q.idiom.split(''));
    // build 4 wall options: 1 correct meaning + 3 wrong
    let opts=[{label:q.meaning,correct:true}];
    const wrongM=IDIOMS.filter(x=>x.idiom!==q.idiom).map(x=>x.meaning);
    const pool=[...wrongM,...extraMeanings];
    while(opts.length<4){
      const r=pool[Math.floor(Math.random()*pool.length)];
      if(!opts.find(o=>o.label===r))opts.push({label:r,correct:false});
    }
    curOpts=shuffle(opts);
    // create 4 walls
    walls3d.forEach(w=>scene.remove(w.group));walls3d=[];
    const positions=[-2.2,-0.75,0.75,2.2];
    curOpts.forEach((o,i)=>{
      const grp=new THREE.Group();
      const wall=voxBox(1.3,2.5,0.4,0x888888);wall.position.y=1.25;grp.add(wall);
      // scroll banner on wall
      const banner=voxBox(1.1,1.8,0.1,0xf5e6c8);banner.position.set(0,1.5,0.25);grp.add(banner);
      grp.position.set(positions[i],0,-20);
      grp.userData={correct:o.correct,idx:i,broken:false};
      scene.add(grp);walls3d.push({group:grp,correct:o.correct,broken:false});
    });
    wallZ=-20;wallHit=false;wallPhase='approaching';
    if(phase!=='countdown')phase='run';
    updateUI();
  }
  function updateUI(){
    const pct=cur/qs.length;
    let h='';
    h+=g3dProgress(pct*100,'#FFD700');
    let hearts='';for(let i=0;i<3;i++)hearts+=`<span style="font-size:1.2rem;${i>=hp?'filter:grayscale(1) opacity(.3);':''}">${i<hp?'❤️':'🖤'}</span>`;
    h+=g3dHUD(g3dBackBtn()+`<span style="display:flex;gap:2px;margin-left:8px;">${hearts}</span>`,
      `<span style="padding:4px 14px;border-radius:12px;font-size:.8rem;font-weight:800;background:${spdCols[speedLv]};color:#fff;">${spdNames[speedLv]}</span>`,
      g3dBadge(score+'점','rgba(0,0,0,.5)'));
    if(cur<qs.length&&phase==='run'){
      const q=qs[cur];
      h+=`<div style="text-align:center;margin-top:4px;pointer-events:none;">
        <div style="font-size:.7rem;color:rgba(255,255,255,.5);">이 사자성어의 뜻은?</div>
        <div style="font-size:2rem;font-weight:900;color:#FFD700;text-shadow:0 2px 8px rgba(0,0,0,.3);letter-spacing:6px;">${q.idiom}</div>
        <div style="font-size:.75rem;color:rgba(255,255,255,.5);">${q.reading}</div></div>`;
      h+=`<div style="position:absolute;bottom:12px;left:0;right:0;display:flex;flex-direction:column;gap:6px;padding:0 12px;pointer-events:auto;">`;
      curOpts.forEach((o,i)=>{
        h+=`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="window._idiomAnswer(${i})"
          style="padding:12px 8px;border-radius:14px;font-size:.85rem;font-weight:700;
          background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.2);color:#fff;
          cursor:pointer;backdrop-filter:blur(8px);text-shadow:0 1px 3px rgba(0,0,0,.4);
          font-family:inherit;text-align:center;">${o.label}</button>`;
      });
      h+=`</div>`;
    }
    if(hp===1)h+=`<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;box-shadow:inset 0 0 80px 30px rgba(238,51,78,.4);z-index:-1;"></div>`;
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,qs.length>0?Math.round(score/qs.length*100):0,'idiom',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._idiomAnswer=function(idx){
    if(phase!=='run'||wallHit)return;
    wallHit=true;
    const o=curOpts[idx];
    const correctIdx=curOpts.findIndex(x=>x.correct);
    markAnswer(idx,correctIdx);

    // Log answer - for idioms, log the idiom text itself as identifier
    logAnswer('idiom', qs[cur].idiom, o.correct);

    const targetWall=walls3d[idx];
    if(o.correct){
      score++;streak++;speedLv=Math.min(3,Math.floor(streak/2));
      SoundSystem.playSound('correct');
      setTimeout(()=>{
        if(targetWall){targetWall.broken=true;GE3D.burst3d(scene,targetWall.group.position.x,1.5,targetWall.group.position.z,0xFFD700,15,4,0.6);targetWall.group.visible=false;}
        GE3D.shake(1,0.2);SoundSystem.playSound('impact_light');
      },200);
    }else{
      wrong.push(qs[cur].idiom);streak=0;speedLv=0;hp--;
      SoundSystem.playSound('wrong');SoundSystem.playSound('impact_heavy');
      setTimeout(()=>{GE3D.shake(3,0.5);GE3D.burst3d(scene,runner3d.position.x,1,runner3d.position.z-1,0xEE334E,20,3,0.6);
        walls3d.forEach((w,i)=>{if(i===correctIdx)w.group.children[0].material=new THREE.MeshLambertMaterial({color:0x00ff00,emissive:0x00ff00,emissiveIntensity:0.3});});
      },200);
      if(hp<=0){setTimeout(()=>{phase='done';updateUI();},800);return;}
    }
    setTimeout(()=>{cur++;setupQ();},800);
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('idiom').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='run';SoundSystem.playSound('countdown_go');}updateUI();}}
      if(phase!=='run')return;
      const spd=1+speedLv*0.5;
      runFrame+=dt*6*(1+speedLv);
      if(runner3d){
        runner3d.position.y=0.5+Math.abs(Math.sin(runFrame))*0.2;
        const legs=runner3d.children.filter((c,i)=>i>=4);
        legs.forEach((l,i)=>{l.rotation.x=Math.sin(runFrame*2+i*Math.PI)*0.6;});
        const arms=runner3d.children.filter((c,i)=>i===2||i===3);
        arms.forEach((a,i)=>{a.rotation.x=Math.sin(runFrame*2+i*Math.PI+Math.PI/2)*0.5;});
      }
      if(!wallHit){wallZ+=dt*3*spd;walls3d.forEach(w=>{w.group.position.z=wallZ;});}
      trees3d.forEach(t=>{t.position.z+=dt*5*spd;if(t.position.z>10)t.position.z-=48;});
      camera.position.y=4+Math.sin(performance.now()/800)*0.05;
      if(hp===1){heartbeatT+=dt;if(heartbeatT>=0.8){heartbeatT=0;SoundSystem.playSound('heartbeat');}}
    },
    onTap(){},
    getResult(){
      recordEncountered(enc);
      const pct=Math.round(score/qs.length*100);const m=getMedalForScore('idiom',pct);
      recordGameResult('idiom',pct,100,m,wrong);
      return{gameId:'idiom',name:'사자성어',score:pct,total:100,medal:m,detail:score+'/'+qs.length+' ('+pct+'%)'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

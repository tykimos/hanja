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

export function createWeightliftingGame3D(){
  let scene,camera,streak,wrong,enc,phase,countdown,cdT,altType;
  let curQ,gaugePos,gaugeDir,gaugeSpd,failZone;
  let liftAnim,judgment,judgT,bestStreak;
  let lifter3d,barbell3d,plates3d,spotlight;
  let topScores=[];
  function reset(){
    streak=0;wrong=[];enc=[];phase='countdown';countdown=3;cdT=0;altType=0;
    gaugePos=0;gaugeDir=1;liftAnim=0;judgment='';judgT=0;
    bestStreak=0;
    // build scene
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x1a1020);
    camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,3,8);camera.lookAt(0,2,0);
    // lights
    scene.add(new THREE.AmbientLight(0x443355,0.6));
    spotlight=new THREE.SpotLight(0xffeedd,2.5,30,Math.PI/4,0.5,1);
    spotlight.position.set(0,12,3);spotlight.target.position.set(0,0,0);
    scene.add(spotlight);scene.add(spotlight.target);
    const rimLight=new THREE.PointLight(0x4488ff,0.8,15);rimLight.position.set(-5,5,-2);scene.add(rimLight);
    const fillLight=new THREE.PointLight(0xffaa66,0.5,20);fillLight.position.set(3,4,5);scene.add(fillLight);
    // stage/platform
    const platform=voxBox(5,0.4,3,0x555555);platform.position.set(0,0.2,0);scene.add(platform);
    const edge=voxBox(5.2,0.15,3.2,0x555555);edge.position.set(0,0.42,0);scene.add(edge);
    // floor
    const floor=voxBox(20,0.1,20,0x222233);floor.position.set(0,-0.05,0);scene.add(floor);
    // audience (voxel silhouettes)
    for(let i=-5;i<=5;i++){
      for(let r=0;r<2;r++){
        const s=voxBox(0.4,0.6,0.3,0x334455);
        s.position.set(i*1.2,0.3+r*0.6,-4-r*1.5);scene.add(s);
        const h=voxBox(0.3,0.3,0.3,0x553333);
        h.position.set(i*1.2,0.9+r*0.6,-4-r*1.5);scene.add(h);
      }
    }
    // lifter
    lifter3d=makeVoxelChar(0xEE334E,0xFFDDB0);
    lifter3d.position.set(0,0.5,0);scene.add(lifter3d);
    // barbell
    barbell3d=new THREE.Group();
    const bar=voxBox(3,0.12,0.12,0x888888);barbell3d.add(bar);
    barbell3d.position.set(0,2.8,0);scene.add(barbell3d);
    plates3d=[];
    nextQ();
  }
  function addPlate(){
    const colors=[0xEE334E,0x0081C8,0x00A651,0xFFD700,0x555555,0x333333,0x888888,0x444444];
    const idx=plates3d.length;
    const ph=0.3+idx*0.06;const pw=0.15+idx*0.03;
    const col=colors[idx%colors.length];
    const lp=voxBox(pw,ph,pw,col);lp.position.set(-1.5-idx*0.2,0,0);barbell3d.add(lp);
    const rp=voxBox(pw,ph,pw,col);rp.position.set(1.5+idx*0.2,0,0);barbell3d.add(rp);
    plates3d.push({l:lp,r:rp});
  }
  function nextQ(){
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const q=allowedHanja[Math.floor(Math.random()*allowedHanja.length)];enc.push(q.hanja);
    const isH=altType%2===0;altType++;
    if(isH){
      const d=generateDecoys(q,allowedHanja,3,'fullHunEum');
      curQ={q,text:'이 한자의 훈음은?',display:q.hanja,isH:true,opts:shuffle([q,...d]).map(o=>({l:o.fullHunEum,v:o.fullHunEum,ok:o.fullHunEum===q.fullHunEum}))};
    }else{
      const d=generateDecoys(q,allowedHanja,3,'hanja');
      curQ={q,text:'이 훈음의 한자는?',display:q.fullHunEum,isH:false,opts:shuffle([q,...d]).map(o=>({l:o.hanja,v:o.hanja,ok:o.hanja===q.hanja,h:true}))};
    }
    curQ.answered=false;curQ._sel=null;
    if(phase!=='countdown')phase='quiz';
    updateUI();
  }
  function updateUI(){
    const kg=40+streak*10;
    let h='';
    h+=g3dProgress(Math.min(streak/15,1)*100,'#76FF03');
    h+=g3dHUD(g3dBackBtn(),
      `<div style="text-align:center;"><div style="font-size:1.8rem;font-weight:900;color:#FFD700;text-shadow:0 0 15px rgba(255,215,0,.4);">${kg}kg</div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.5);">연속 ${streak}</div></div>`,
      (streak>=bestStreak&&streak>0?g3dBadge('🔥신기록!','rgba(238,51,78,.5)'):''));
    if(phase==='quiz'&&curQ){
      h+=`<div style="text-align:center;margin-top:8px;pointer-events:none;">
        <div style="font-size:.75rem;color:rgba(255,255,255,.5);">${curQ.text}</div>
        <div style="font-size:${curQ.isH?'2.5rem':'1.3rem'};font-weight:800;color:#fff;margin-top:4px;">${curQ.display}</div></div>`;
      h+=g3dAnswerGrid(curQ.opts.map(o=>({label:o.l})),'window._wlAnswer',curQ.opts[0]&&curQ.opts[0].h);
    }
    if(phase==='gauge'){
      failZone=Math.min(30+streak*2,50);
      h+=`<div style="position:absolute;bottom:40px;left:5%;right:5%;pointer-events:auto;">
        <div style="text-align:center;color:#FFD700;font-weight:800;font-size:.9rem;margin-bottom:8px;">탭하여 멈추세요!</div>
        <div style="height:36px;border-radius:18px;position:relative;overflow:hidden;background:#EE334E;box-shadow:inset 0 3px 6px rgba(0,0,0,.3);">
          <div style="position:absolute;left:${failZone}%;top:0;bottom:0;width:${60-failZone}%;background:#FCB131;"></div>
          <div style="position:absolute;left:60%;top:0;bottom:0;width:25%;background:#00A651;"></div>
          <div style="position:absolute;left:85%;top:0;bottom:0;width:15%;background:#FFD700;border-radius:0 18px 18px 0;"></div>
          <div style="position:absolute;top:0;bottom:0;left:${gaugePos}%;width:4px;background:#fff;box-shadow:0 0 8px #fff;z-index:2;"></div>
        </div>
        <button class="g3d-btn" onclick="window._wlGaugeStop()" style="width:100%;margin-top:10px;padding:14px;border-radius:14px;background:rgba(255,215,0,.3);border:2px solid #FFD700;color:#FFD700;font-weight:800;font-size:1.1rem;cursor:pointer;">STOP!</button>
      </div>`;
    }
    if(judgT>0&&judgment){
      const col=judgment==='perfect'?'#FFD700':judgment==='great'?'#00E5FF':judgment==='ok'?'#fff':'#EE334E';
      h+=`<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:2.5rem;font-weight:900;color:${col};text-shadow:0 0 20px ${col};">${judgment.toUpperCase()}!</div>`;
    }
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,streak,'weightlifting',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._wlAnswer=function(idx){
    if(!curQ||curQ.answered||phase!=='quiz')return;
    curQ.answered=true;curQ._sel=curQ.opts[idx].v;
    const correctIdx=curQ.opts.findIndex(o=>o.ok);
    const isCorrect = curQ.opts[idx].ok;
    markAnswer(idx,correctIdx);

    // Log answer
    logAnswer('weightlifting', curQ.q.hanja, isCorrect);

    if(isCorrect){
      SoundSystem.playSound('correct');GE3D.shake(0.5,0.15);
      phase='gauge';gaugePos=0;gaugeDir=1;
      SoundSystem.playSound('power_charge');
      setTimeout(updateUI,300);
    }else{
      wrong.push(curQ.q);SoundSystem.playSound('wrong');GE3D.shake(3,0.4);
      SoundSystem.playSound('impact_heavy');
      judgment='fail';judgT=1.5;liftAnim=0;
      GE3D.burst3d(scene,0,2,0,0xEE334E,15,3,0.6);
      setTimeout(()=>{phase='done';},1500);
    }
  };
  window._wlGaugeStop=function(){
    if(phase!=='gauge')return;
    SoundSystem.playSound('gauge_stop');
    failZone=Math.min(30+streak*2,50);
    if(gaugePos<failZone){
      judgment='fail';GE3D.shake(3,0.5);SoundSystem.playSound('impact_heavy');
      GE3D.burst3d(scene,0,2,0,0xEE334E,15,3,0.6);
      judgT=1.5;liftAnim=0;setTimeout(()=>{phase='done';},1500);
    }else if(gaugePos<60){
      judgment='ok';streak++;addPlate();GE3D.shake(1,0.2);SoundSystem.playSound('impact_light');
      judgT=1.5;liftAnim=0;setTimeout(()=>nextQ(),1200);
    }else if(gaugePos<85){
      judgment='great';streak++;addPlate();GE3D.shake(1.5,0.3);SoundSystem.playSound('metal_clang');
      GE3D.burst3d(scene,0,3,0,0x00E5FF,12,3,0.5);
      judgT=1.5;liftAnim=0;setTimeout(()=>nextQ(),1200);
    }else{
      judgment='perfect';streak++;addPlate();GE3D.shake(2,0.4);SoundSystem.playSound('metal_clang');SoundSystem.playSound('cheer');
      GE3D.burst3d(scene,0,3.5,0,0xFFD700,25,5,0.8);
      judgT=1.5;liftAnim=0;setTimeout(()=>nextQ(),1200);
    }
    phase='lift';updateUI();
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('weightlifting').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='quiz';SoundSystem.playSound('countdown_go');}updateUI();}}
      if(phase==='gauge'){
        gaugeSpd=2.5+streak*0.5;
        gaugePos+=gaugeDir*gaugeSpd*dt*60;
        if(gaugePos>=100){gaugePos=100;gaugeDir=-1;}
        if(gaugePos<=0){gaugePos=0;gaugeDir=1;}
        updateUI();
      }
      if(phase==='lift'){
        liftAnim+=dt;
        const lift=judgment==='perfect'?1.5:judgment==='great'?1:judgment==='ok'?0.6:-0.3;
        barbell3d.position.y=2.8+lift*Math.min(liftAnim/0.5,1);
        lifter3d.children[0].position.y=0.4+(lift>0?0.1:0)*Math.min(liftAnim/0.5,1);
      }else{
        barbell3d.position.y=2.8;
      }
      if(judgT>0){judgT-=dt;if(judgT<=0)updateUI();}
      // lifter idle animation
      if(lifter3d){
        lifter3d.children[0].position.y=0.4+Math.sin(performance.now()/500)*0.03;
      }
      // spotlight flicker
      if(spotlight)spotlight.intensity=1.5+Math.sin(performance.now()/300)*0.1;
    },
    onTap(x,y){},
    getResult(){
      recordEncountered(enc);const m=getMedalForScore('weightlifting',streak);
      recordGameResult('weightlifting',streak,0,m,wrong);
      return{gameId:'weightlifting',name:'역도',score:streak,total:0,medal:m,detail:'연속 '+streak+'문제 ('+(40+streak*10)+'kg)'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

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

export function createSwimmingGame3D(){
  let scene,camera,score,wrong,enc,timeLeft,curQ,answered,phase,countdown,cdT;
  let pPos,cpuPos,cpuNames=['AI-김','AI-박','AI-이'],streak,cpuBase;
  let swimmers3d,waterMesh,waterPhase;
  let topScores=[];
  function reset(){
    score=0;wrong=[];enc=[];timeLeft=60;phase='countdown';countdown=3;cdT=0;
    pPos=25;cpuPos=[5,5,5];streak=0;cpuBase=1.0;waterPhase=0;answered=false;
    // build scene
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x003459);
    scene.fog=new THREE.Fog(0x003459,15,40);
    camera=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,8,12);camera.lookAt(5,0,0);
    // lights
    scene.add(new THREE.AmbientLight(0x4488cc,0.6));
    const dL=new THREE.DirectionalLight(0xffffff,0.7);dL.position.set(5,10,5);scene.add(dL);
    const pL1=new THREE.PointLight(0x00aaff,0.8,20);pL1.position.set(0,3,0);scene.add(pL1);
    // water surface (animated)
    const wGeo=new THREE.PlaneGeometry(30,10,30,30);
    const wMat=new THREE.MeshPhongMaterial({color:0x0077B6,transparent:true,opacity:0.7,shininess:100,specular:0x4488ff});
    waterMesh=new THREE.Mesh(wGeo,wMat);waterMesh.rotation.x=-Math.PI/2;waterMesh.position.set(5,0,0);
    scene.add(waterMesh);
    // pool edges
    const edge1=voxBox(30,0.8,0.5,0xcccccc);edge1.position.set(5,0.2,-5);scene.add(edge1);
    const edge2=voxBox(30,0.8,0.5,0xcccccc);edge2.position.set(5,0.2,5);scene.add(edge2);
    // lane dividers
    for(let i=-1;i<=2;i++){
      for(let x=-5;x<20;x+=1.5){
        const buoy=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8),new THREE.MeshLambertMaterial({color:i%2===0?0xEE334E:0xFFD700}));
        buoy.position.set(x,0.15,i*2.5-1.25);scene.add(buoy);
      }
    }
    // finish line
    for(let i=0;i<8;i++){
      const fl=voxBox(0.3,0.5,1.25,i%2===0?0x000000:0xffffff);
      fl.position.set(15,0.3,i*1.25-4.375+0.625);scene.add(fl);
    }
    // swimmers (voxel characters in lanes)
    swimmers3d=[];
    const colors=[0x0081C8,0xEE334E,0x00A651,0xFCB131];
    const laneZ=[-3.75,-1.25,1.25,3.75];
    for(let i=0;i<4;i++){
      const s=makeVoxelChar(colors[i],0xFFDDB0);
      s.rotation.y=Math.PI/2;s.scale.setScalar(0.6);
      s.position.set(-5,0.3,laneZ[i]);scene.add(s);
      swimmers3d.push(s);
    }
    nextQ();
  }
  function nextQ(){
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const q=allowedHanja[Math.floor(Math.random()*allowedHanja.length)];
    curQ={...q};answered=false;enc.push(q.hanja);
    const d=generateDecoys(q,allowedHanja,3,'hanja');
    curQ.opts=shuffle([q,...d]);
    updateUI();
  }
  function updateUI(){
    let h='';
    h+=g3dProgress((1-timeLeft/60)*100,timeLeft<=10?'#EE334E':'#76FF03');
    h+=g3dHUD(g3dBackBtn(),g3dBadge(Math.ceil(timeLeft)+'s',timeLeft<=10?'rgba(238,51,78,.6)':'rgba(0,0,0,.5)'),
      g3dBadge(score+'점','rgba(255,165,0,.5)'));
    // question
    if(curQ&&phase==='race'){
      h+=`<div style="text-align:center;margin-top:4px;pointer-events:none;">
        <div style="font-size:.75rem;color:rgba(255,255,255,.5);">이 훈음의 한자는?</div>
        <div style="font-size:1.3rem;font-weight:800;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.5);">${curQ.fullHunEum}</div></div>`;
      h+=g3dAnswerGrid(curQ.opts.map(o=>({label:o.hanja})),'window._swimAnswer',true);
    }
    // rank display
    const allP=[{n:'나',p:pPos},...cpuPos.map((p,i)=>({n:cpuNames[i],p}))].sort((a,b)=>b.p-a.p);
    const myRank=allP.findIndex(a=>a.n==='나')+1;
    h+=`<div style="position:absolute;top:52px;left:14px;pointer-events:none;">
      <span style="font-size:.8rem;font-weight:800;color:${myRank===1?'#FFD700':'#fff'};text-shadow:0 2px 4px rgba(0,0,0,.5);">${myRank}위</span></div>`;
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,score,'swimming',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._swimAnswer=function(idx){
    if(!curQ||answered||phase!=='race')return;
    answered=true;
    const o=curQ.opts[idx];
    const correctIdx=curQ.opts.findIndex(x=>x.hanja===curQ.hanja);
    const isCorrect = o.hanja===curQ.hanja;
    markAnswer(idx,correctIdx);

    // Log answer
    logAnswer('swimming', curQ.hanja, isCorrect);

    if(isCorrect){
      score++;streak++;pPos=Math.min(95,pPos+6+streak*0.5);
      SoundSystem.playSound('correct');SoundSystem.playSound('splash_sfx');
      GE3D.shake(1,0.15);
      GE3D.burst3d(scene,swimmers3d[0].position.x,0.5,swimmers3d[0].position.z,0x00E5FF,10,2,0.5);
    }else{
      wrong.push(curQ);streak=0;pPos=Math.min(95,pPos+0.5);
      SoundSystem.playSound('wrong');GE3D.shake(2,0.3);
    }
    setTimeout(()=>{if(timeLeft>0)nextQ();},500);
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('swimming').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='race';SoundSystem.playSound('whistle');}updateUI();}}
      if(phase==='race'){
        timeLeft-=dt;if(timeLeft<=0){timeLeft=0;phase='done';return;}
        // cpu (slowed down to help player reach finals)
        cpuBase=0.4+(pPos/90)*0.8;
        cpuPos=cpuPos.map((p,i)=>Math.min(95,p+(cpuBase+Math.random()*0.4-0.1)*(0.7+i*0.05)*dt*60/50));
        pPos=Math.min(95,pPos+dt*0.3);
        // update timer display
        if(Math.floor(timeLeft)!==Math.floor(timeLeft+dt))updateUI();
        // panic
        if(timeLeft<=10&&Math.floor(timeLeft*2)%2===0)SoundSystem.playSound('heartbeat');
      }
      // animate water
      waterPhase+=dt;
      if(waterMesh){
        const pos=waterMesh.geometry.attributes.position;
        for(let i=0;i<pos.count;i++){
          const x=pos.getX(i),z=pos.getZ(i);
          pos.setY(i,Math.sin(x*0.5+waterPhase*2)*0.15+Math.cos(z*0.3+waterPhase*1.5)*0.1);
        }
        pos.needsUpdate=true;
      }
      // move swimmers
      if(swimmers3d){
        const allPos=[pPos,...cpuPos];
        const laneZ=[-3.75,-1.25,1.25,3.75];
        allPos.forEach((p,i)=>{
          if(swimmers3d[i]){
            swimmers3d[i].position.x=-5+p/100*20;
            swimmers3d[i].position.y=0.3+Math.sin(performance.now()/200+i)*0.1;
            // arm animation
            const arms=swimmers3d[i].children.filter((c,ci)=>ci===2||ci===3);
            arms.forEach((a,ai)=>{a.rotation.x=Math.sin(performance.now()/150+i+ai*Math.PI)*0.8;});
          }
        });
      }
    },
    onTap(x,y){},
    getResult(){
      recordEncountered(enc);
      const allP=[{n:'나',p:pPos},...cpuPos.map((p,i)=>({n:cpuNames[i],p}))].sort((a,b)=>b.p-a.p);
      const place=allP.findIndex(a=>a.n==='나')+1;
      const m=getMedalForScore('swimming',score);recordGameResult('swimming',score,0,m,wrong);
      return{gameId:'swimming',name:'수영',score,total:0,medal:m,detail:'60초 '+score+'문제 정답 ('+place+'위)'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

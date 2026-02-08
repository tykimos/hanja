import * as THREE from 'three';
import { getHanjaForGrade } from '../data/hanja.js';
import { SoundSystem } from '../systems/sound.js';
import { Effects } from '../systems/effects.js';
import { GE3D } from '../engine/ge3d.js';
import { voxBox, voxBoxPhong, makeVoxelChar, makeVoxelTree, makeTextCanvas, makeTextSprite, project3Dto2D } from '../engine/helpers.js';
import { g3dHUD, g3dBackBtn, g3dBadge, g3dProgress, g3dAnswerGrid, g3dCountdown, markAnswer, g3dLeaderboardSidebar } from '../engine/ui.js';
import { shuffle, generateDecoys, recordEncountered, getMedalForScore, recordGameResult } from '../utils.js';
import KeyboardManager from '../systems/keyboard.js';
import Store from '../systems/store.js';
import { logAnswer } from '../systems/answer-logger.js';

// Helper functions for variable difficulty
function getQuestionPointValue(qIndex){
  // Questions 1-3: 1pt, 4-6: 2pt, 7-8: 3pt, 9-10: 5pt
  if(qIndex<3)return 1;
  if(qIndex<6)return 2;
  if(qIndex<8)return 3;
  return 5;
}

function getQuestionDifficulty(qIndex){
  // Returns {bobbingSpeed, scale, rotationSpeed}
  if(qIndex<3)return{bobbingSpeed:1.5,scale:1.0,rotationSpeed:0.3}; // Normal
  if(qIndex<6)return{bobbingSpeed:2.5,scale:1.0,rotationSpeed:0.3}; // Faster
  if(qIndex<8)return{bobbingSpeed:3.0,scale:0.8,rotationSpeed:0.4}; // Smaller + faster
  return{bobbingSpeed:4.0,scale:0.6,rotationSpeed:0.5}; // Smallest + fastest
}

export function createArcheryGame3D(){
  let scene,camera,qs,cur,score,bonus,wrong,enc,phase,targets3d,arrow3d,arrowT;
  let countdown,cdT,starField,currentDifficulty;
  let topScores=[];
  const targetData=[];
  function reset(){
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    qs=shuffle(allowedHanja).slice(0,10);cur=0;score=0;bonus=0;wrong=[];enc=[];
    phase='countdown';countdown=3;cdT=0;
    // build scene
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x080820);
    scene.fog=new THREE.FogExp2(0x080820,0.02);
    camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,200);
    camera.position.set(0,3,10);camera.lookAt(0,2,0);
    // lights
    scene.add(new THREE.AmbientLight(0x334466,0.5));
    const dL=new THREE.DirectionalLight(0xffeedd,0.8);dL.position.set(5,10,5);scene.add(dL);
    const pL=new THREE.PointLight(0x4488ff,0.5,30);pL.position.set(0,5,0);scene.add(pL);
    // stars
    const sGeo=new THREE.BufferGeometry();const sPos=[];
    for(let i=0;i<500;i++)sPos.push((Math.random()-.5)*100,Math.random()*50,(Math.random()-.5)*100-20);
    sGeo.setAttribute('position',new THREE.Float32BufferAttribute(sPos,3));
    starField=new THREE.Points(sGeo,new THREE.PointsMaterial({color:0xffffff,size:0.15,transparent:true,opacity:0.8}));
    scene.add(starField);
    // ground (dark field)
    const gnd=voxBox(40,0.3,30,0x0a1a0a);gnd.position.set(0,-0.5,-5);scene.add(gnd);
    // pillars decoration
    for(let i=-3;i<=3;i+=2){
      const p=voxBox(0.3,4,0.3,0x334455);p.position.set(i*2,2,-5);scene.add(p);
      const top=voxBox(0.5,0.3,0.5,0x4488aa);top.position.set(i*2,4,-5);scene.add(top);
    }
    // bow stand
    const bowBase=voxBox(1,0.3,0.5,0x8B4513);bowBase.position.set(0,0,7);scene.add(bowBase);
    const bowArm=voxBox(0.1,2,0.1,0x654321);bowArm.position.set(0,1,7);scene.add(bowArm);
    setupQ();
  }
  function setupQ(){
    // clear old targets
    targetData.length=0;
    if(targets3d){targets3d.forEach(t=>scene.remove(t.group));}
    targets3d=[];
    if(cur>=qs.length){phase='done';return;}
    const q=qs[cur];enc.push(q.hanja);
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const d=generateDecoys(q,allowedHanja,3,'fullHunEum');
    const opts=shuffle([q,...d]);
    const positions=[[-2.5,3.5,-3],[2.5,3.5,-3],[-2.5,1.5,-3],[2.5,1.5,-3]];
    // Get difficulty for current question
    currentDifficulty=getQuestionDifficulty(cur);
    opts.forEach((o,i)=>{
      const [px,py,pz]=positions[i];
      const grp=new THREE.Group();
      // target rings (concentric boxes) - scaled by difficulty
      const s=currentDifficulty.scale;
      const r4=voxBox(1.4*s,1.4*s,0.15,0xffffff);grp.add(r4);
      const r3=voxBox(1.1*s,1.1*s,0.2,0x0081C8);grp.add(r3);
      const r2=voxBox(0.8*s,0.8*s,0.25,0xEE334E);grp.add(r2);
      const r1=voxBox(0.5*s,0.5*s,0.3,0xFFD700);grp.add(r1);
      grp.position.set(px,py,pz);scene.add(grp);
      const data={group:grp,label:o.fullHunEum,correct:o.fullHunEum===q.fullHunEum,
        bobPhase:Math.random()*Math.PI*2,baseY:py,hit:false};
      targets3d.push(data);targetData.push(data);
    });
    arrow3d=null;arrowT=0;
    if(phase!=='countdown')phase='aim';
    updateUI();
  }
  function updateUI(){
    let h='';
    h+=g3dProgress(cur/10*100,'#76FF03');
    const pointValue=cur<qs.length?getQuestionPointValue(cur):0;
    h+=g3dHUD(g3dBackBtn(),cur<qs.length?`<span style="font-size:.75rem;color:rgba(255,255,255,.5);">훈음을 맞추세요</span>`:'',
      g3dBadge((cur<qs.length?cur+1:10)+'/10','rgba(0,0,0,.5)')+' '+
      (cur<qs.length?g3dBadge(pointValue+'pts','rgba(255,215,0,.5)')+' ':'')+
      g3dBadge(score+(bonus>0?'+'+bonus:'')+'pts','rgba(255,165,0,.5)'));
    // question hanja
    if(cur<qs.length){
      h+=`<div style="text-align:center;margin-top:8px;pointer-events:none;">
        <div style="font-size:3.5rem;font-weight:900;color:rgba(255,255,255,.9);text-shadow:0 0 20px rgba(255,215,0,.3);">${qs[cur].hanja}</div>
        <div style="font-size:.8rem;color:rgba(255,255,255,.4);margin-top:4px;">정답 타겟을 탭하세요</div></div>`;
    }
    // target labels (floating)
    if(targets3d&&phase==='aim'){
      h+=`<div style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:8px;pointer-events:auto;">`;
      targets3d.forEach((t,i)=>{
        h+=`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="window._archeryTap(${i})" style="padding:10px 14px;border-radius:12px;font-size:.9rem;font-weight:700;
          background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);color:#fff;cursor:pointer;backdrop-filter:blur(4px);
          min-width:70px;text-shadow:0 1px 2px rgba(0,0,0,.4);">${KeyboardManager.isPC() ? '<span class="key-hint">[' + (i+1) + ']</span> ' : ''}${t.label}</button>`;
      });
      h+=`</div>`;
    }
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,score,'archery',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._archeryTap=function(idx){
    if(phase!=='aim')return;
    const t=targets3d[idx];if(!t||t.hit)return;
    t.hit=true;phase='flying';
    SoundSystem.playSound('whoosh');
    // create arrow
    const ag=new THREE.Group();
    const shaft=voxBox(0.08,0.08,1.5,0xdddddd);ag.add(shaft);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.3,4),new THREE.MeshLambertMaterial({color:0xEE334E}));
    tip.rotation.x=Math.PI/2;tip.position.z=-0.9;ag.add(tip);
    ag.position.set(0,1,7);scene.add(ag);
    arrow3d={mesh:ag,target:t.group.position.clone(),startPos:new THREE.Vector3(0,1,7)};arrowT=0;
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('archery').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='aim';SoundSystem.playSound('countdown_go');}updateUI();}}
      // bob targets - use current difficulty
      if(targets3d&&currentDifficulty){
        targets3d.forEach(t=>{
          if(!t.hit){
            t.bobPhase+=dt*currentDifficulty.bobbingSpeed;
            t.group.position.y=t.baseY+Math.sin(t.bobPhase)*0.3;
            t.group.rotation.y+=dt*currentDifficulty.rotationSpeed;
          }
        });
      }
      // rotate stars slowly
      if(starField)starField.rotation.y+=dt*0.01;
      // arrow flight
      if(arrow3d&&phase==='flying'){
        arrowT+=dt*2;const p=Math.min(arrowT,1);
        arrow3d.mesh.position.lerpVectors(arrow3d.startPos,arrow3d.target,p);
        arrow3d.mesh.position.y+=Math.sin(p*Math.PI)*1.5;
        arrow3d.mesh.lookAt(arrow3d.target);
        if(arrowT>=1){
          scene.remove(arrow3d.mesh);
          const t=targets3d.find(t=>t.hit);
          if(t){
            // Log answer
            logAnswer('archery', qs[cur].hanja, t.correct);

            if(t.correct){
              const pointValue=getQuestionPointValue(cur);
              score+=pointValue;const dist=arrowT;
              let bp=0,label='HIT';
              if(dist<1.05){bp=3;label='PERFECT!';}else if(dist<1.1){bp=2;label='GREAT!';}else{bp=1;label='GOOD';}
              bonus+=bp;
              GE3D.shake(bp>=3?2:bp>=2?1.5:1,bp>=3?0.4:0.3);
              GE3D.burst3d(scene,t.group.position.x,t.group.position.y,t.group.position.z,
                bp>=3?0xFFD700:bp>=2?0x00E5FF:0x00FF00,bp>=3?25:15,bp>=3?5:3,0.8);
              SoundSystem.playSound(bp>=2?'impact_heavy':'impact_light');SoundSystem.playSound('correct');
              // flash target gold
              t.group.children.forEach(c=>{c.material=new THREE.MeshLambertMaterial({color:0x00FF00,emissive:0x00FF00,emissiveIntensity:0.5});});
            }else{
              wrong.push(qs[cur]);
              GE3D.shake(2,0.3);SoundSystem.playSound('wrong');SoundSystem.playSound('impact_heavy');
              GE3D.burst3d(scene,t.group.position.x,t.group.position.y,t.group.position.z,0xEE334E,12,3,0.5);
              t.group.children.forEach(c=>{c.material=new THREE.MeshLambertMaterial({color:0xEE334E,emissive:0xEE334E,emissiveIntensity:0.3});});
              targets3d.filter(t2=>t2.correct).forEach(t2=>{t2.group.children.forEach(c=>{c.material=new THREE.MeshLambertMaterial({color:0x00FF00,emissive:0x00FF00,emissiveIntensity:0.3});});});
            }
          }
          phase='wait';arrow3d=null;updateUI();
          setTimeout(()=>{cur++;setupQ();},900);
        }
      }
    },
    onTap(x,y){},
    getResult(){
      recordEncountered(enc);const m=getMedalForScore('archery',score);
      recordGameResult('archery',score,25,m,wrong);
      return{gameId:'archery',name:'양궁',score,total:25,medal:m,detail:score+'/25 적중 (보너스 +'+bonus+')'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

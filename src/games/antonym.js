import * as THREE from 'three';
import { getHanjaForGrade } from '../data/hanja.js';
import { ANTONYM_PAIRS } from '../data/antonyms.js';
import { SoundSystem } from '../systems/sound.js';
import { Effects } from '../systems/effects.js';
import { GE3D } from '../engine/ge3d.js';
import { voxBox, voxBoxPhong, makeVoxelChar, makeVoxelTree, makeTextCanvas, makeTextSprite, project3Dto2D } from '../engine/helpers.js';
import { g3dHUD, g3dBackBtn, g3dBadge, g3dProgress, g3dAnswerGrid, g3dCountdown, markAnswer, g3dLeaderboardSidebar } from '../engine/ui.js';
import { shuffle, generateDecoys, recordEncountered, getMedalForScore, recordGameResult } from '../utils.js';
import KeyboardManager from '../systems/keyboard.js';
import Store from '../systems/store.js';
import { logAnswer } from '../systems/answer-logger.js';

export function createAntonymGame3D(){
  let scene,camera,pairs,cur,score,bonus,wrong,enc,phase,targets3d,arrow3d,arrowT;
  let countdown,cdT,starField;
  let topScores=[];
  const targetData=[];
  let allowedHanja;
  function reset(){
    allowedHanja = getHanjaForGrade(Store.getGrade());
    const allowedSet = new Set(allowedHanja.map(h => h.hanja));
    // Filter antonym pairs to only include pairs where both characters are allowed
    const filteredPairs = ANTONYM_PAIRS.filter(([a, b]) => allowedSet.has(a) && allowedSet.has(b));
    pairs = shuffle(filteredPairs).slice(0, Math.min(10, filteredPairs.length));
    cur=0;score=0;bonus=0;wrong=[];enc=[];
    phase='countdown';countdown=3;cdT=0;
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x1a0a2e);
    scene.fog=new THREE.FogExp2(0x1a0a2e,0.02);
    camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,200);
    camera.position.set(0,3,10);camera.lookAt(0,2,0);
    scene.add(new THREE.AmbientLight(0x442266,0.5));
    const dL=new THREE.DirectionalLight(0xeeddff,0.7);dL.position.set(5,10,5);scene.add(dL);
    const pL1=new THREE.PointLight(0xff44aa,0.8,20);pL1.position.set(-4,5,2);scene.add(pL1);
    const pL2=new THREE.PointLight(0x4488ff,0.8,20);pL2.position.set(4,5,2);scene.add(pL2);
    // stars
    const sGeo=new THREE.BufferGeometry();const sPos=[];
    for(let i=0;i<500;i++)sPos.push((Math.random()-.5)*100,Math.random()*50,(Math.random()-.5)*100-20);
    sGeo.setAttribute('position',new THREE.Float32BufferAttribute(sPos,3));
    starField=new THREE.Points(sGeo,new THREE.PointsMaterial({color:0xffffff,size:0.15,transparent:true,opacity:0.8}));
    scene.add(starField);
    // ground - purple arena
    const gnd=voxBox(40,0.3,30,0x1a0a1a);gnd.position.set(0,-0.5,-5);scene.add(gnd);
    // glowing pillars
    for(let i=-3;i<=3;i+=2){
      const p=voxBox(0.3,4,0.3,0x6633aa);p.position.set(i*2,2,-5);scene.add(p);
      const top=voxBox(0.5,0.3,0.5,0xff44aa);top.position.set(i*2,4,-5);scene.add(top);
    }
    // yin-yang pedestal
    const base=voxBox(2,0.3,1,0x6633aa);base.position.set(0,0,7);scene.add(base);
    setupQ();
  }
  function setupQ(){
    targetData.length=0;
    if(targets3d){targets3d.forEach(t=>scene.remove(t.group));}
    targets3d=[];
    if(cur>=pairs.length){phase='done';return;}
    const [a,b]=pairs[cur];
    const ha=allowedHanja.find(x=>x.hanja===a);
    const hb=allowedHanja.find(x=>x.hanja===b);
    enc.push(a,b);
    // correct answer is b (antonym of a)
    // generate 3 wrong options (other hanja that are NOT b)
    let decoys=allowedHanja.filter(x=>x.hanja!==b&&x.hanja!==a).sort(()=>Math.random()-0.5).slice(0,3);
    const opts=shuffle([hb,...decoys]);
    const positions=[[-2.5,3.5,-3],[2.5,3.5,-3],[-2.5,1.5,-3],[2.5,1.5,-3]];
    opts.forEach((o,i)=>{
      const [px,py,pz]=positions[i];
      const grp=new THREE.Group();
      // target rings
      const r4=voxBox(1.4,1.4,0.15,0xffffff);grp.add(r4);
      const r3=voxBox(1.1,1.1,0.2,0x6633aa);grp.add(r3);
      const r2=voxBox(0.8,0.8,0.25,0xff44aa);grp.add(r2);
      const r1=voxBox(0.5,0.5,0.3,0xFFD700);grp.add(r1);
      grp.position.set(px,py,pz);scene.add(grp);
      const label=o.hanja+' ('+o.hun+')';
      const isCorr=o.hanja===b;
      const data={group:grp,label,correct:isCorr,bobPhase:Math.random()*Math.PI*2,baseY:py,hit:false};
      targets3d.push(data);targetData.push(data);
    });
    arrow3d=null;arrowT=0;
    if(phase!=='countdown')phase='aim';
    updateUI();
  }
  function updateUI(){
    let h='';
    h+=g3dProgress(cur/pairs.length*100,'#ff44aa');
    h+=g3dHUD(g3dBackBtn(),cur<pairs.length?`<span style="font-size:.75rem;color:rgba(255,255,255,.5);">반대말을 맞추세요</span>`:'',
      g3dBadge((cur<pairs.length?cur+1:pairs.length)+'/'+pairs.length,'rgba(0,0,0,.5)')+' '+g3dBadge(score+'pts','rgba(255,68,170,.5)'));
    if(cur<pairs.length){
      const [a]=pairs[cur];const ha=allowedHanja.find(x=>x.hanja===a);
      h+=`<div style="text-align:center;margin-top:8px;pointer-events:none;">
        <div style="font-size:.8rem;color:rgba(255,255,255,.5);">반대말은?</div>
        <div style="font-size:3.5rem;font-weight:900;color:rgba(255,255,255,.9);text-shadow:0 0 20px rgba(255,68,170,.3);">${a}</div>
        <div style="font-size:.9rem;color:rgba(255,255,255,.5);">${ha?ha.hun+' '+ha.eum:''}</div></div>`;
    }
    if(targets3d&&phase==='aim'){
      h+=`<div style="position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:8px;pointer-events:auto;">`;
      targets3d.forEach((t,i)=>{
        h+=`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="window._antonymTap(${i})" style="padding:10px 14px;border-radius:12px;font-size:.9rem;font-weight:700;
          background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.2);color:#fff;cursor:pointer;backdrop-filter:blur(4px);
          min-width:70px;text-shadow:0 1px 2px rgba(0,0,0,.4);">${KeyboardManager.isPC() ? '<span class="key-hint">[' + (i+1) + ']</span> ' : ''}${t.label}</button>`;
      });
      h+=`</div>`;
    }
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,score,'antonym',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._antonymTap=function(idx){
    if(phase!=='aim')return;
    const t=targets3d[idx];if(!t||t.hit)return;
    t.hit=true;phase='flying';
    SoundSystem.playSound('whoosh');
    const ag=new THREE.Group();
    const shaft=voxBox(0.08,0.08,1.5,0xff44aa);ag.add(shaft);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.3,4),new THREE.MeshLambertMaterial({color:0xFFD700}));
    tip.rotation.x=Math.PI/2;tip.position.z=-0.9;ag.add(tip);
    ag.position.set(0,1,7);scene.add(ag);
    arrow3d={mesh:ag,target:t.group.position.clone(),startPos:new THREE.Vector3(0,1,7)};arrowT=0;
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('antonym').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='aim';SoundSystem.playSound('countdown_go');}updateUI();}}
      if(targets3d)targets3d.forEach(t=>{if(!t.hit){t.bobPhase+=dt*1.5;t.group.position.y=t.baseY+Math.sin(t.bobPhase)*0.3;t.group.rotation.y+=dt*0.3;}});
      if(starField)starField.rotation.y+=dt*0.01;
      if(arrow3d&&phase==='flying'){
        arrowT+=dt*2;const p=Math.min(arrowT,1);
        arrow3d.mesh.position.lerpVectors(arrow3d.startPos,arrow3d.target,p);
        arrow3d.mesh.position.y+=Math.sin(p*Math.PI)*1.5;
        arrow3d.mesh.lookAt(arrow3d.target);
        if(arrowT>=1){
          scene.remove(arrow3d.mesh);
          const t=targets3d.find(t=>t.hit);
          if(t){
            // Log answer - for antonyms, log the first hanja of the pair
            logAnswer('antonym', pairs[cur][0], t.correct);

            if(t.correct){
              score++;let bp=0;
              if(arrowT<1.05){bp=3;}else if(arrowT<1.1){bp=2;}else{bp=1;}
              bonus+=bp;
              GE3D.shake(bp>=3?2:bp>=2?1.5:1,bp>=3?0.4:0.3);
              GE3D.burst3d(scene,t.group.position.x,t.group.position.y,t.group.position.z,0x44ff88,bp>=3?25:15,bp>=3?5:3,0.8);
              SoundSystem.playSound(bp>=2?'impact_heavy':'impact_light');SoundSystem.playSound('correct');
              t.group.children.forEach(c=>{c.material=new THREE.MeshLambertMaterial({color:0x00FF00,emissive:0x00FF00,emissiveIntensity:0.5});});
            }else{
              wrong.push(pairs[cur].join('↔'));
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
    onTap(){},
    getResult(){
      recordEncountered(enc);const m=getMedalForScore('antonym',score);
      recordGameResult('antonym',score,10,m,wrong);
      return{gameId:'antonym',name:'반의어',score,total:10,medal:m,detail:score+'/'+pairs.length+' 적중 (보너스 +'+bonus+')'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

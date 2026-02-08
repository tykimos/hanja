import * as THREE from 'three';
import { getHanjaForGrade } from '../data/hanja.js';
import { SoundSystem } from '../systems/sound.js';
import { Effects } from '../systems/effects.js';
import { GE3D } from '../engine/ge3d.js';
import { voxBox, voxBoxPhong, makeVoxelChar, makeVoxelTree, makeTextCanvas, makeTextSprite, project3Dto2D } from '../engine/helpers.js';
import { g3dHUD, g3dBackBtn, g3dBadge, g3dProgress, g3dAnswerGrid, g3dCountdown, markAnswer, g3dLeaderboardSidebar } from '../engine/ui.js';
import { shuffle, generateDecoys, recordEncountered, getMedalForScore, recordGameResult, formatTime } from '../utils.js';
import Store from '../systems/store.js';
import { logAnswer } from '../systems/answer-logger.js';

export function createMarathonGame3D(){
  let scene,camera,qs,cur,score,wrong,enc,hp,streak,speedLv,phase,countdown,cdT,startTime;
  let runner3d,trees3d,walls3d,roadOffset,runFrame,wallZ,wallHit;
  const spdNames=['조깅','달리기','스프린트','전력질주!'];
  const spdCols=['#4CAF50','#FF9800','#E91E63','#FFD700'];
  let heartbeatT,curOpts,wallPhase;
  let topScores=[];
  function reset(){
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    qs=shuffle(allowedHanja);cur=0;score=0;wrong=[];enc=[];hp=5;streak=0;speedLv=0;
    phase='countdown';countdown=3;cdT=0;startTime=Date.now();
    roadOffset=0;runFrame=0;heartbeatT=0;wallZ=-20;wallHit=false;wallPhase='approaching';
    scene=new THREE.Scene();scene.background=new THREE.Color(0x87CEEB);
    scene.fog=new THREE.Fog(0x87CEEB,20,60);
    camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,4,6);camera.lookAt(0,1,-5);
    scene.add(new THREE.AmbientLight(0x88aacc,0.7));
    const sun=new THREE.DirectionalLight(0xffeedd,0.9);sun.position.set(5,10,5);scene.add(sun);
    // sun sphere
    const sunM=new THREE.Mesh(new THREE.SphereGeometry(2,16,16),new THREE.MeshBasicMaterial({color:0xFFDD44}));
    sunM.position.set(15,12,-25);scene.add(sunM);
    // clouds
    for(let i=0;i<6;i++){
      const cg=new THREE.Group();
      cg.add(voxBox(2,0.6,1,0xffffff));
      const c2=voxBox(1.5,0.5,0.8,0xeeeeee);c2.position.set(0.8,0.2,0);cg.add(c2);
      cg.position.set(-15+i*6,8+Math.random()*3,-15);cg.userData={speed:0.2+Math.random()*0.3};
      scene.add(cg);
    }
    // road (long)
    for(let z=10;z>=-40;z-=2){
      const g=voxBox(16,0.3,2,z%4===0?0x4CAF50:0x388E3C);g.position.set(0,-0.15,z);scene.add(g);
      const r=voxBox(5,0.35,2,0x555555);r.position.set(0,0,z);scene.add(r);
      if(z%4===0){const m=voxBox(0.8,0.36,0.15,0xFFD700);m.position.set(0,0,z);scene.add(m);}
    }
    // trees
    trees3d=[];
    for(let i=0;i<16;i++){
      const side=i%2===0?-1:1;
      const t=makeVoxelTree(side*(4+Math.random()*3),8-i*3,0.6+Math.random()*0.4);
      scene.add(t);trees3d.push(t);
    }
    // mountains
    for(let i=0;i<5;i++){
      const mw=3+Math.random()*4,mh=2+Math.random()*3;
      const mt=voxBox(mw,mh,mw,0x556B2F);mt.position.set(-12+i*6,mh/2-0.5,-30);scene.add(mt);
      const pk=voxBox(mw*0.5,mh*0.5,mw*0.5,0x778899);pk.position.set(-12+i*6,mh-0.5,-30);scene.add(pk);
    }
    // runner
    runner3d=makeVoxelChar(0x0081C8,0xFFDDB0);
    runner3d.position.set(0,0.5,0);runner3d.scale.setScalar(0.8);scene.add(runner3d);
    walls3d=[];
    setupQ();
  }
  function setupQ(){
    if(cur>=qs.length||hp<=0){phase='done';return;}
    const q=qs[cur];enc.push(q.hanja);
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const d=generateDecoys(q,allowedHanja,3,'fullHunEum');
    curOpts=shuffle([q,...d]);
    // create 4 walls ahead
    walls3d.forEach(w=>scene.remove(w.group));walls3d=[];
    const positions=[-2.2,-0.75,0.75,2.2];
    curOpts.forEach((o,i)=>{
      const grp=new THREE.Group();
      const isCorrect=o.fullHunEum===q.fullHunEum;
      const wallColor=isCorrect?0x228B22:0x8B0000;
      const wall=voxBox(1.3,2.5,0.4,0x888888);wall.position.y=1.25;grp.add(wall);
      // label sprite
      const label=makeTextSprite(o.fullHunEum,1.2,'#fff','rgba(40,40,40,0.85)');
      label.position.y=2.8;grp.add(label);
      grp.position.set(positions[i],0,-20);
      grp.userData={correct:isCorrect,idx:i,broken:false};
      scene.add(grp);walls3d.push({group:grp,correct:isCorrect,broken:false});
    });
    wallZ=-20;wallHit=false;wallPhase='approaching';
    if(phase!=='countdown')phase='run';
    updateUI();
  }
  function updateUI(){
    const pct=cur/qs.length;
    let h='';
    h+=g3dProgress(pct*100,'#76FF03');
    let hearts='';for(let i=0;i<5;i++)hearts+=`<span style="font-size:1.2rem;${i>=hp?'filter:grayscale(1) opacity(.3);':''}">${i<hp?'❤️':'🖤'}</span>`;
    h+=g3dHUD(g3dBackBtn()+`<span style="display:flex;gap:2px;margin-left:8px;">${hearts}</span>`,
      `<span style="padding:4px 14px;border-radius:12px;font-size:.8rem;font-weight:800;background:${spdCols[speedLv]};color:#fff;">${spdNames[speedLv]}</span>`,
      g3dBadge((pct*42.195).toFixed(1)+'km','rgba(0,0,0,.5)'));
    if(cur<qs.length&&phase==='run'){
      h+=`<div style="text-align:center;margin-top:4px;pointer-events:none;">
        <div style="font-size:.7rem;color:rgba(255,255,255,.5);">이 한자의 훈음은?</div>
        <div style="font-size:2.5rem;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.3);">${qs[cur].hanja}</div></div>`;
      h+=`<div style="position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:8px;padding:0 12px;pointer-events:auto;">`;
      curOpts.forEach((o,i)=>{
        h+=`<button class="g3d-btn g3d-ans" data-idx="${i}" onclick="window._marathonAnswer(${i})"
          style="flex:1;padding:14px 6px;border-radius:14px;font-size:.95rem;font-weight:800;
          background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.2);color:#fff;
          cursor:pointer;backdrop-filter:blur(8px);text-shadow:0 1px 3px rgba(0,0,0,.4);
          font-family:inherit;text-align:center;">${o.fullHunEum}</button>`;
      });
      h+=`</div>`;
    }
    if(hp<=1)h+=`<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;box-shadow:inset 0 0 80px 30px rgba(238,51,78,.4);z-index:-1;"></div>`;
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,qs.length>0?Math.round(score/qs.length*100):0,'marathon',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  window._marathonAnswer=function(idx){
    if(phase!=='run'||wallHit)return;
    wallHit=true;
    const o=curOpts[idx];const q=qs[cur];
    const isCorrect=o.fullHunEum===q.fullHunEum;
    const correctIdx=curOpts.findIndex(x=>x.fullHunEum===q.fullHunEum);
    markAnswer(idx,correctIdx);

    // Log answer
    logAnswer('marathon', q.hanja, isCorrect);
    // Move runner to selected lane
    const positions=[-2.2,-0.75,0.75,2.2];
    const targetX=positions[idx];
    const targetWall=walls3d[idx];
    if(isCorrect){
      score++;streak++;speedLv=Math.min(3,Math.floor(streak/3));
      SoundSystem.playSound('correct');
      // Runner moves to correct lane and breaks through wall
      const moveInterval=setInterval(()=>{
        const dx=targetX-runner3d.position.x;
        runner3d.position.x+=dx*0.15;
        if(Math.abs(dx)<0.1){
          clearInterval(moveInterval);
          runner3d.position.x=targetX;
        }
      },16);
      setTimeout(()=>{
        if(targetWall){
          targetWall.broken=true;
          GE3D.burst3d(scene,targetWall.group.position.x,1.5,targetWall.group.position.z,0x76FF03,15,4,0.6);
          targetWall.group.visible=false;
        }
        GE3D.shake(1,0.2);SoundSystem.playSound('impact_light');
        if(streak>0&&streak%5===0&&hp<5){hp++;SoundSystem.playSound('combo_hit');}
      },300);
    }else{
      wrong.push(q);streak=0;speedLv=0;hp--;
      SoundSystem.playSound('wrong');SoundSystem.playSound('impact_heavy');
      // Runner collides and falls
      const moveInterval=setInterval(()=>{
        const dx=targetX-runner3d.position.x;
        runner3d.position.x+=dx*0.15;
        if(Math.abs(dx)<0.1){
          clearInterval(moveInterval);
          runner3d.position.x=targetX;
        }
      },16);
      setTimeout(()=>{
        // Collision effect - runner falls
        runner3d.rotation.z=Math.PI/2;
        runner3d.position.y=0.2;
        GE3D.shake(3,0.5);
        GE3D.burst3d(scene,runner3d.position.x,1,runner3d.position.z-1,0xEE334E,20,3,0.6);
        // Show correct wall green
        walls3d.forEach((w,i)=>{if(i===correctIdx)w.group.children[0].material=new THREE.MeshLambertMaterial({color:0x00ff00,emissive:0x00ff00,emissiveIntensity:0.3});});
      },400);
      // Get back up
      setTimeout(()=>{
        runner3d.rotation.z=0;
        runner3d.position.y=0.5;
        runner3d.position.x=0;
      },1200);
      if(hp<=0){setTimeout(()=>{phase='done';updateUI();},1500);return;}
    }
    setTimeout(()=>{cur++;setupQ();},1300);
  };
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;Store.getTopScoresForGame('marathon').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='run';SoundSystem.playSound('countdown_go');}updateUI();}}
      if(phase!=='run')return;
      speedLv=Math.min(3,Math.floor(streak/3));
      const spd=1+speedLv*0.5;
      runFrame+=dt*6*(1+speedLv);
      // runner animation
      if(runner3d){
        runner3d.position.y=0.5+Math.abs(Math.sin(runFrame))*0.2;
        const legs=runner3d.children.filter((c,i)=>i>=4);
        legs.forEach((l,i)=>{l.rotation.x=Math.sin(runFrame*2+i*Math.PI)*0.6;});
        const arms=runner3d.children.filter((c,i)=>i===2||i===3);
        arms.forEach((a,i)=>{a.rotation.x=Math.sin(runFrame*2+i*Math.PI+Math.PI/2)*0.5;});
      }
      // walls approach runner
      if(!wallHit){
        wallZ+=dt*3*spd;
        walls3d.forEach(w=>{w.group.position.z=wallZ;});
        // Collision detection - if walls reach runner without answer
        if(wallZ>=0){
          // Force collision with closest wall to runner's current position
          let closestIdx=0;
          let closestDist=999;
          walls3d.forEach((w,i)=>{
            const dist=Math.abs(w.group.position.x-runner3d.position.x);
            if(dist<closestDist){closestDist=dist;closestIdx=i;}
          });
          // Auto-select the closest wall (force wrong answer if not already answered)
          if(typeof window._marathonAnswer==='function'){
            const correctIdx=curOpts.findIndex(x=>x.fullHunEum===qs[cur].fullHunEum);
            // Force collision with non-broken wall
            const collisionIdx=walls3d.findIndex(w=>!w.broken);
            if(collisionIdx!==-1&&collisionIdx!==correctIdx){
              window._marathonAnswer(collisionIdx);
            }
          }
        }
      }
      // trees scroll
      trees3d.forEach(t=>{t.position.z+=dt*5*spd;if(t.position.z>10)t.position.z-=48;});
      // clouds
      scene.children.forEach(c=>{if(c.userData&&c.userData.speed){c.position.x+=c.userData.speed*spd*dt*2;if(c.position.x>20)c.position.x=-20;}});
      camera.position.y=4+Math.sin(performance.now()/800)*0.05;
      if(hp===1){heartbeatT+=dt;if(heartbeatT>=0.8){heartbeatT=0;SoundSystem.playSound('heartbeat');}}
    },
    onTap(){},
    getResult(){
      recordEncountered(enc);
      const pct=Math.round(score/qs.length*100);const m=getMedalForScore('marathon',pct);
      const elapsed=formatTime(Date.now()-startTime);
      recordGameResult('marathon',pct,100,m,wrong);
      return{gameId:'marathon',name:'마라톤',score:pct,total:100,medal:m,detail:score+'/'+qs.length+' ('+pct+'%) - '+elapsed+(hp<=0?' [HP 소진]':'')};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}},
    isDone(){return phase==='done';}
  };
}

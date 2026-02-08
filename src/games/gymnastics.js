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

export function createGymnasticsGame3D(){
  let scene,camera,cards3d,flipped,matchCount,attempts,locked,combo,maxCombo,timeLeft,phase,countdown,cdT,peekT;
  let raycaster,mouse,clickBound=false;
  let topScores=[];
  function reset(){
    flipped=[];matchCount=0;attempts=0;locked=true;combo=0;maxCombo=0;
    timeLeft=90;phase='countdown';countdown=3;cdT=0;peekT=3;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x1a0a2e);
    scene.fog=new THREE.FogExp2(0x1a0a2e,0.03);
    camera=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.1,100);
    camera.position.set(0,8,7);camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0x332266,0.5));
    const dL=new THREE.DirectionalLight(0xeeddff,0.6);dL.position.set(3,8,5);scene.add(dL);
    scene.add(new THREE.PointLight(0x9966ff,0.8,20));
    const pGeo=new THREE.BufferGeometry();const pPos=[];
    for(let i=0;i<100;i++)pPos.push((Math.random()-.5)*20,Math.random()*10,(Math.random()-.5)*20);
    pGeo.setAttribute('position',new THREE.Float32BufferAttribute(pPos,3));
    scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({color:0x9966ff,size:0.08,transparent:true,opacity:0.5})));
    const floor=voxBox(12,0.05,8,0x150a25);floor.position.y=-0.5;scene.add(floor);
    const allowedHanja = getHanjaForGrade(Store.getGrade());
    const pool=shuffle(allowedHanja).slice(0,8);let cardData=[];
    pool.forEach(h=>{
      cardData.push({type:'hanja',pairId:h.hanja,display:h.hanja,isFaceUp:false,isMatched:false});
      cardData.push({type:'huneum',pairId:h.hanja,display:h.fullHunEum,isFaceUp:false,isMatched:false});
    });
    cardData=shuffle(cardData);cards3d=[];
    const cols=4,rows=4,cardW=1.5,cardH=2,gap=0.3;
    const totalW=cols*(cardW+gap)-gap,totalH=rows*(cardH+gap)-gap;
    const startX=-totalW/2+cardW/2,startZ=-totalH/2+cardH/2;
    cardData.forEach((cd,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const grp=new THREE.Group();
      const back=voxBoxPhong(cardW,0.08,cardH,0x6C63FF,0x3311aa);back.position.y=0.04;grp.add(back);
      const front=voxBoxPhong(cardW,0.08,cardH,0xffffff,0x000000);front.position.y=-0.04;front.visible=false;grp.add(front);
      // Add text label on front face using canvas texture
      const labelTex=makeTextCanvas(cd.display,cd.type==='hanja'?120:40,cd.type==='hanja'?'#333':'#0066cc','#ffffff',256,256);
      const labelGeo=new THREE.PlaneGeometry(cardW*0.85,cardH*0.85);
      const labelMat=new THREE.MeshBasicMaterial({map:labelTex,transparent:false,side:THREE.DoubleSide});
      const labelMesh=new THREE.Mesh(labelGeo,labelMat);
      labelMesh.rotation.x=Math.PI/2;labelMesh.position.y=-0.09;
      grp.add(labelMesh);
      // Back "?" label
      const backTex=makeTextCanvas('?',100,'rgba(255,255,255,0.6)','rgba(108,99,255,0)',256,256);
      const backLabelMesh=new THREE.Mesh(new THREE.PlaneGeometry(cardW*0.6,cardH*0.6),
        new THREE.MeshBasicMaterial({map:backTex,transparent:true,side:THREE.DoubleSide}));
      backLabelMesh.rotation.x=-Math.PI/2;backLabelMesh.position.y=0.09;grp.add(backLabelMesh);
      grp.position.set(startX+col*(cardW+gap),0,startZ+row*(cardH+gap));
      grp.userData={...cd,idx:i,front,back,flipAngle:Math.PI,targetFlip:Math.PI,labelMesh,backLabelMesh};
      scene.add(grp);cards3d.push(grp);
    });
    raycaster=new THREE.Raycaster();mouse=new THREE.Vector2();
    updateUI();
  }
  function flipCard(card,faceUp){
    card.userData.isFaceUp=faceUp;
    card.userData.targetFlip=faceUp?Math.PI:0;
    SoundSystem.playSound('flip');
  }
  function updateUI(){
    let h='';
    h+=g3dProgress(matchCount/8*100,'#E040FB');
    h+=g3dHUD(g3dBackBtn(),g3dBadge(matchCount+'/8','rgba(108,99,255,.5)'),
      g3dBadge(Math.ceil(timeLeft)+'s',timeLeft<=15?'rgba(238,51,78,.6)':'rgba(0,0,0,.5)'));
    if(combo>=2){
      const tier=combo>=5?'ULTRA':combo>=3?'SUPER':'COMBO';
      const cc=combo>=5?'#FFD700':combo>=3?'#E040FB':'#00E5FF';
      h+=`<div style="text-align:center;margin-top:8px;pointer-events:none;">
        <div style="font-size:${1+combo*0.2}rem;font-weight:900;color:${cc};text-shadow:0 0 15px ${cc};">${combo}x ${tier}!</div></div>`;
    }
    if(phase==='peek')h+=`<div style="position:absolute;bottom:30px;left:0;right:0;text-align:center;pointer-events:none;">
      <span style="font-size:1.2rem;font-weight:800;color:#FFD700;text-shadow:0 0 10px rgba(255,215,0,.5);">카드를 기억하세요! ${Math.ceil(peekT)}</span></div>`;
    if(phase==='countdown')h+=g3dCountdown(countdown);
    h+=g3dLeaderboardSidebar(topScores,attempts,'gymnastics',Store.getCurrentUser()||'나');
    GE3D.setUI(h);
  }
  function onContainerClick(e){
    if(locked||phase!=='play')return;
    const rect=GE3D.renderer.domElement.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const intersects=raycaster.intersectObjects(cards3d.flatMap(c=>c.children));
    if(intersects.length>0){
      const card=intersects[0].object.parent;
      if(!card.userData||card.userData.isMatched||card.userData.isFaceUp)return;
      if(flipped.length>=2)return;
      flipCard(card,true);flipped.push(card);
      if(flipped.length===2){
        locked=true;attempts++;
        const a=flipped[0].userData,b=flipped[1].userData;
        const isMatch = a.pairId===b.pairId&&a.type!==b.type;

        // Log answer
        logAnswer('gymnastics', a.pairId, isMatch);

        if(isMatch){
          setTimeout(()=>{
            a.isMatched=true;b.isMatched=true;matchCount++;combo++;
            if(combo>maxCombo)maxCombo=combo;
            SoundSystem.playSound('combo_hit');
            const cx=(flipped[0].position.x+flipped[1].position.x)/2;
            const cz=(flipped[0].position.z+flipped[1].position.z)/2;
            const bcol=combo>=5?0xFFD700:combo>=3?0xE040FB:0x00E5FF;
            GE3D.burst3d(scene,cx,1,cz,bcol,combo>=5?25:combo>=3?15:8,combo>=3?4:2,0.6);
            if(combo>=3)GE3D.shake(combo>=5?2:1,0.2);
            timeLeft+=combo>=4?8:5;
            [flipped[0],flipped[1]].forEach(c=>{
              c.userData.front.material=new THREE.MeshPhongMaterial({color:0x66ff66,emissive:0x00ff00,emissiveIntensity:0.3});
            });
            flipped=[];locked=false;updateUI();
            if(matchCount===8){phase='done';SoundSystem.playSound('cheer');GE3D.burst3d(scene,0,2,0,0xFFD700,40,5,1);}
          },300);
        }else{
          combo=0;SoundSystem.resetCombo();
          setTimeout(()=>{SoundSystem.playSound('wrong');flipCard(flipped[0],false);flipCard(flipped[1],false);GE3D.shake(0.5,0.15);flipped=[];locked=false;updateUI();},600);
        }
      }
    }
  }
  return{
    scene:null,camera:null,
    init(){reset();this.scene=scene;this.camera=camera;
      if(!clickBound){GE3D.container.addEventListener('pointerdown',onContainerClick);clickBound=true;}
      Store.getTopScoresForGame('gymnastics').then(d=>{topScores=d;updateUI();}).catch(()=>{});},
    update(dt){
      if(phase==='countdown'){cdT+=dt;if(cdT>=1){countdown--;cdT=0;SoundSystem.playSound('countdown_tick');if(countdown<=0){phase='peek';cards3d.forEach(c=>{flipCard(c,true);});SoundSystem.playSound('countdown_go');}updateUI();}}
      if(phase==='peek'){peekT-=dt;if(peekT<=0){phase='play';locked=false;cards3d.forEach(c=>{flipCard(c,false);});updateUI();}}
      if(phase==='play'){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;phase='done';}if(Math.floor(timeLeft)!==Math.floor(timeLeft+dt))updateUI();}
      cards3d.forEach(c=>{
        const target=c.userData.targetFlip;const current=c.userData.flipAngle||0;
        const diff=target-current;
        if(Math.abs(diff)>0.01){
          c.userData.flipAngle=current+diff*Math.min(dt*8,1);
          c.rotation.x=c.userData.flipAngle;
          const isFront=c.userData.flipAngle>Math.PI/2;
          c.userData.front.visible=isFront;c.userData.back.visible=!isFront;
          c.userData.labelMesh.visible=isFront;c.userData.backLabelMesh.visible=!isFront;
        }
        if(c.userData.isMatched){c.position.y=Math.max(c.position.y-dt*0.5,-2);}
        if(!c.userData.isMatched){c.position.y=Math.sin(performance.now()/1000+c.userData.idx)*0.05;}
      });
    },
    onTap(){},
    getResult(){
      const enc2=cards3d.filter(c=>c.userData.type==='hanja').map(c=>c.userData.pairId);recordEncountered(enc2);
      const m=getMedalForScore('gymnastics',attempts);recordGameResult('gymnastics',attempts,0,m,[]);
      return{gameId:'gymnastics',name:'카드 뒤집기',score:attempts,total:0,medal:m,detail:attempts+'회 시도 (최대콤보 '+maxCombo+', 남은시간 '+Math.ceil(timeLeft)+'초)'};
    },
    cleanup(){if(scene){while(scene.children.length>0)scene.remove(scene.children[0]);}GE3D.container.removeEventListener('pointerdown',onContainerClick);clickBound=false;},
    isDone(){return phase==='done';}
  };
}

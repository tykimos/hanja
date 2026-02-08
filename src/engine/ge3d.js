import * as THREE from 'three';

export const GE3D={
  container:null,ui:null,renderer:null,game:null,running:false,lastT:0,
  shakeIntensity:0,shakeDuration:0,shakeTime:0,shakeOffset:{x:0,y:0,z:0},
  particles3d:[],
  init(){
    this.container=document.getElementById('game3d');
    this.ui=document.getElementById('game3d-ui');
    if(!this.renderer){
      this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      this.renderer.shadowMap.enabled=true;
      this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      this.container.insertBefore(this.renderer.domElement,this.container.firstChild);
    }
    this._rsz();
    window.addEventListener('resize',()=>this._rsz());
    window.addEventListener('orientationchange',()=>{
      setTimeout(()=>this._rsz(),100);
    });
  },
  _rsz(){
    const w=window.innerWidth,h=window.innerHeight;
    this.renderer.setSize(w,h);
    // Adjust pixel ratio based on screen size
    const isMobile=w<768;
    this.renderer.setPixelRatio(isMobile?Math.min(window.devicePixelRatio,2):window.devicePixelRatio);
    if(this.game&&this.game.camera){
      this.game.camera.aspect=w/h;
      // Adjust FOV based on breakpoint
      if(this.game.camera.fov){
        if(w<768)this.game.camera.fov=60;
        else if(w<1024)this.game.camera.fov=55;
        else this.game.camera.fov=50;
      }
      this.game.camera.updateProjectionMatrix();
    }
  },
  start(g){
    this.game=g;this.running=true;this.particles3d=[];
    this.container.style.display='block';this.lastT=performance.now();
    if(!this._keyHandler){
      this._keyHandler=(e)=>this._handleKey(e);
      document.addEventListener('keydown',this._keyHandler);
    }
    this._loop();
  },
  stop(){
    this.running=false;this.container.style.display='none';
    if(this.game&&this.game.cleanup)this.game.cleanup();
    this.game=null;this.ui.innerHTML='';
    this.particles3d.forEach(p=>{if(p.parent)p.parent.remove(p);});
    this.particles3d=[];
    if(this._keyHandler){
      document.removeEventListener('keydown',this._keyHandler);
      this._keyHandler=null;
    }
  },
  _handleKey(e){
    if(!this.running||!this.game)return;
    const key=e.key;
    // Space key for special actions
    if(key===' '||key==='Spacebar'){
      e.preventDefault();
      // For weightlifting gauge stop
      if(typeof window._wlGaugeStop==='function')window._wlGaugeStop();
    }
  },
  _loop(){
    if(!this.running)return;
    const now=performance.now(),dt=Math.min((now-this.lastT)/1000,0.05);this.lastT=now;
    // shake
    if(this.shakeDuration>0){
      this.shakeTime+=dt;
      if(this.shakeTime<this.shakeDuration){
        const p=1-this.shakeTime/this.shakeDuration;
        this.shakeOffset.x=(Math.random()-0.5)*2*this.shakeIntensity*p;
        this.shakeOffset.y=(Math.random()-0.5)*2*this.shakeIntensity*p;
      }else{this.shakeOffset.x=0;this.shakeOffset.y=0;this.shakeDuration=0;}
    }
    if(this.game){
      this.game.update(dt);
      if(this.game.camera){
        this.game.camera.position.x+=this.shakeOffset.x*0.1;
        this.game.camera.position.y+=this.shakeOffset.y*0.1;
      }
      // update 3d particles
      this.particles3d=this.particles3d.filter(p=>{
        p.life-=dt;p.position.x+=p.vx*dt;p.position.y+=p.vy*dt;p.position.z+=p.vz*dt;
        p.vy-=9.8*dt;p.rotation.x+=dt*3;p.rotation.z+=dt*2;
        const s=Math.max(0,p.life/p.maxLife);p.scale.setScalar(s*p.baseScale);
        if(p.life<=0){if(p.parent)p.parent.remove(p);return false;}
        return true;
      });
      this.renderer.render(this.game.scene,this.game.camera);
      // restore camera
      if(this.game.camera){
        this.game.camera.position.x-=this.shakeOffset.x*0.1;
        this.game.camera.position.y-=this.shakeOffset.y*0.1;
      }
    }
    requestAnimationFrame(()=>this._loop());
  },
  shake(intensity,duration){this.shakeIntensity=intensity;this.shakeDuration=duration;this.shakeTime=0;},
  burst3d(scene,x,y,z,color,count,speed,life){
    // Reduce particles on mobile for performance
    const isMobile=window.innerWidth<768;
    const adjustedCount=isMobile?Math.floor(count*0.5):count;
    const geo=new THREE.BoxGeometry(0.15,0.15,0.15);
    const mat=new THREE.MeshLambertMaterial({color});
    for(let i=0;i<adjustedCount;i++){
      const m=new THREE.Mesh(geo,mat.clone());
      m.position.set(x,y,z);
      const a=Math.random()*Math.PI*2,e=Math.random()*Math.PI-Math.PI/2;
      const s=speed*(0.5+Math.random()*0.5);
      m.vx=Math.cos(a)*Math.cos(e)*s;m.vy=Math.sin(e)*s+speed*0.5;m.vz=Math.sin(a)*Math.cos(e)*s;
      m.life=life*(0.5+Math.random()*0.5);m.maxLife=m.life;m.baseScale=0.5+Math.random()*1;
      scene.add(m);this.particles3d.push(m);
    }
  },
  setUI(html){this.ui.innerHTML=html;this.ui.querySelectorAll('.g3d-btn').forEach(b=>{b.style.pointerEvents='auto';});},
};

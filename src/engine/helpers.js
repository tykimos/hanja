import * as THREE from 'three';

export function voxBox(w,h,d,color){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
}
export function voxBoxPhong(w,h,d,color,emissive){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshPhongMaterial({color,emissive:emissive||0x000000,shininess:30}));
}
export function makeVoxelChar(color,headColor){
  const g=new THREE.Group();
  const body=voxBox(0.6,0.8,0.4,color);body.position.y=0.4;g.add(body);
  const head=voxBox(0.5,0.5,0.5,headColor||0xFFDDB0);head.position.y=1.05;g.add(head);
  const lArm=voxBox(0.2,0.6,0.2,color);lArm.position.set(-0.5,0.5,0);g.add(lArm);
  const rArm=voxBox(0.2,0.6,0.2,color);rArm.position.set(0.5,0.5,0);g.add(rArm);
  const lLeg=voxBox(0.25,0.5,0.25,0x333366);lLeg.position.set(-0.15,-0.15,0);g.add(lLeg);
  const rLeg=voxBox(0.25,0.5,0.25,0x333366);rLeg.position.set(0.15,-0.15,0);g.add(rLeg);
  return g;
}
export function makeVoxelTree(x,z,scale){
  const g=new THREE.Group();
  const trunk=voxBox(0.3*scale,1.2*scale,0.3*scale,0x8B4513);trunk.position.y=0.6*scale;g.add(trunk);
  const top=voxBox(1*scale,1*scale,1*scale,0x228B22);top.position.y=1.5*scale;g.add(top);
  const top2=voxBox(0.7*scale,0.7*scale,0.7*scale,0x2E8B57);top2.position.y=2.1*scale;g.add(top2);
  g.position.set(x,0,z);return g;
}


export function makeTextCanvas(text,fontSize,color,bgColor,cw,ch){
  const canvas=document.createElement('canvas');canvas.width=cw||256;canvas.height=ch||256;
  const ctx=canvas.getContext('2d');
  if(bgColor){ctx.fillStyle=bgColor;ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.fillStyle=color||'#fff';
  ctx.font=`bold ${fontSize||80}px "Noto Sans KR",serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text,canvas.width/2,canvas.height/2);
  return new THREE.CanvasTexture(canvas);
}
export function makeTextSprite(text,scale,color,bgColor){
  const tex=makeTextCanvas(text,100,color||'#fff',bgColor||'rgba(0,0,0,0)');
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true});
  const sprite=new THREE.Sprite(mat);sprite.scale.set(scale||1,scale||1,1);return sprite;
}
export function project3Dto2D(pos,cam){
  const v=pos.clone().project(cam);
  return{x:(v.x*0.5+0.5)*window.innerWidth,y:(-v.y*0.5+0.5)*window.innerHeight};
}
// ============================
// HUD / UI HELPERS

import MESH from './v-mesh.js';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function b64(s,T){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new T(u.buffer);}
const VV=b64(MESH.v,Int16Array),FF=b64(MESH.f,Uint16Array),GG=b64(MESH.g,Uint8Array);
function vGeometry(size){
  const n=VV.length/3,pos=new Float32Array(n*6),s=size/(MESH.w*100);
  for(let i=0;i<n;i++){const x=VV[i*3]*s,y=VV[i*3+1]*s,z=VV[i*3+2]*s;pos.set([x,y,z],i*3);pos.set([x,y,-z],(n+i)*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const by=[[],[],[]];for(let i=0;i<GG.length;i++)by[GG[i]].push(i);
  const idx=[];let start=0;
  by.forEach((list,gi)=>{for(const t of list)idx.push(FF[t*3],FF[t*3+2],FF[t*3+1]);for(const t of list)idx.push(n+FF[t*3],n+FF[t*3+1],n+FF[t*3+2]);g.addGroup(start,list.length*6,gi);start+=list.length*6;});
  g.setIndex(idx);g.computeVertexNormals();return g;
}
const gloss=(c,sh,extra={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,roughness:.3,clearcoat:.9,clearcoatRoughness:.16,envMapIntensity:.9,sheen:.35,sheenColor:new THREE.Color(sh)},extra));
function playShape(){const s=new THREE.Shape();const p=[[-0.5,-0.6],[-0.5,0.6],[0.62,0]];s.moveTo(-0.38,-0.62);s.quadraticCurveTo(-0.6,-0.66,-0.6,-0.4);s.lineTo(-0.6,0.4);s.quadraticCurveTo(-0.6,0.66,-0.38,0.62);s.lineTo(0.52,0.12);s.quadraticCurveTo(0.7,0,0.52,-0.12);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.18,bevelEnabled:true,bevelThickness:.14,bevelSize:.12,bevelSegments:6});}
function stage(el,{size=8,floaters=true,cam=21}={}){
  const canvas=el.querySelector('canvas');
  let r;try{r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){el.innerHTML='<img src="assets/viddora-mark.png" alt="" style="position:absolute;inset:12%;width:76%;height:auto">';return;}
  el.classList.add('live');r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.NoToneMapping;
  const sc=new THREE.Scene();const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
  const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,0,cam);
  const key=new THREE.DirectionalLight(0xffffff,1.1);key.position.set(-5,7,6);sc.add(key);
  const rim=new THREE.DirectionalLight(0x8fd8ff,.35);rim.position.set(6,-2,4);sc.add(rim);
  const root=new THREE.Group();sc.add(root);
  const logo=new THREE.Mesh(vGeometry(size),[gloss(0x6a3cf2,0xc4b0ff),gloss(0x3dd189,0xb6f7d6),gloss(0x1d7c95,0x7fd3e6)]);root.add(logo);
  const fl=[];
  if(floaters){
    const pg=playShape(),sg=new THREE.SphereGeometry(.5,40,24);
    const defs=[[pg,gloss(0x3dd189,0xb6f7d6),[-5.6,3.2,-2],.95],[pg,gloss(0x8f72f5,0xd7ccff),[5.4,-3.4,-1],.75],[sg,gloss(0xdcd3fa,0xffffff),[4.9,3.6,-3],.8],[sg,gloss(0x9be8c2,0xffffff),[-4.8,-3.6,1],.55],[sg,gloss(0x6a3cf2,0xc4b0ff),[-2.4,4.6,-4],.4],[pg,gloss(0x1d7c95,0x7fd3e6),[2.6,-5,-3],.5]];
    for(const [g,m,p,s] of defs){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.setScalar(s);o.userData.base=p.slice();o.userData.sp=.6+Math.random()*.6;o.rotation.set(Math.random(),Math.random(),Math.random());root.add(o);fl.push(o);}
  }
  let px=0,py=0,dragging=false,dx=0,lastX=0,yaw=0;
  el.addEventListener('pointermove',e=>{const b=el.getBoundingClientRect();px=(e.clientX-b.left)/b.width*2-1;py=(e.clientY-b.top)/b.height*2-1;if(dragging){yaw+=(e.clientX-lastX)*.01;lastX=e.clientX;}});
  el.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;el.setPointerCapture?.(e.pointerId);});
  el.addEventListener('pointerup',()=>dragging=false);el.addEventListener('pointerleave',()=>{px=py=0;dragging=false;});
  let spin=0;addEventListener('lessonready',()=>spin=Math.PI*2);
  let vis=true;new IntersectionObserver(es=>vis=es[0].isIntersecting).observe(el);
  function size_(){const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;r.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(size_).observe(el);size_();
  const clock=new THREE.Clock();let T=0;
  function frame(){
    const dt=Math.min(clock.getDelta(),.05);T+=reduce?0:dt;const t=T;
    if(spin>0){const s=Math.min(spin,dt*7);spin-=s;yaw+=s;}
    logo.rotation.y+=((yaw+Math.sin(t*.45)*.38+px*.35)-logo.rotation.y)*.06;
    logo.rotation.x+=((-.06+py*.18+Math.sin(t*.6)*.04)-logo.rotation.x)*.06;
    logo.position.y=Math.sin(t*.9)*.18;
    for(const o of fl){const [x,y,z]=o.userData.base;o.position.set(x+Math.sin(t*o.userData.sp)*.25,y+Math.cos(t*o.userData.sp*1.2)*.3,z);o.rotation.x+=dt*.3*o.userData.sp;o.rotation.y+=dt*.4*o.userData.sp;}
    if(vis||reduce)r.render(sc,camera);
    if(!reduce)requestAnimationFrame(frame);
  }
  frame(); if(reduce)setTimeout(()=>{size_();r.render(sc,camera);},50);
}
document.querySelectorAll('[data-stage]').forEach(el=>{const o=el.dataset;stage(el,{size:+(o.size||8),cam:+(o.cam||21),floaters:o.floaters!=='false'});});

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
  g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const gloss=(c,sh,extra={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:c,roughness:.3,clearcoat:.9,clearcoatRoughness:.16,envMapIntensity:.9,sheen:.35,sheenColor:new THREE.Color(sh)},extra));
function playShape(){const s=new THREE.Shape();s.moveTo(-0.38,-0.62);s.quadraticCurveTo(-0.6,-0.66,-0.6,-0.4);s.lineTo(-0.6,0.4);s.quadraticCurveTo(-0.6,0.66,-0.38,0.62);s.lineTo(0.52,0.12);s.quadraticCurveTo(0.7,0,0.52,-0.12);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.18,bevelEnabled:true,bevelThickness:.14,bevelSize:.12,bevelSegments:6});}

/* frame-rate independent smoothing: move a fraction of the way that depends on dt, not on fps */
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
/* critically-damped-ish spring for the hover/click "pop" */
class Spring{constructor(k=180,d=16,v0=1){this.k=k;this.d=d;this.x=v0;this.v=0;this.target=v0;}update(dt){const f=-this.k*(this.x-this.target)-this.d*this.v;this.v+=f*dt;this.x+=this.v*dt;return this.x;}}

// Shared material set: same materials across stages means fewer shader compiles.
let MATS=null;
const mats=()=>MATS||(MATS={
  logo:[gloss(0x6a3cf2,0xc4b0ff),gloss(0x3dd189,0xb6f7d6),gloss(0x1d7c95,0x7fd3e6)],
  fl:[gloss(0x3dd189,0xb6f7d6),gloss(0x8f72f5,0xd7ccff),gloss(0xdcd3fa,0xffffff),gloss(0x9be8c2,0xffffff),gloss(0x6a3cf2,0xc4b0ff),gloss(0x1d7c95,0x7fd3e6)]
});

function stage(el,{size=8,floaters=true,cam=21}={}){
  const canvas=el.querySelector('canvas');
  let r;try{r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){return;}
  el.classList.add('live');
  r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.NoToneMapping;
  const sc=new THREE.Scene();const pm=new THREE.PMREMGenerator(r);const envRT=pm.fromScene(new RoomEnvironment(),.04);sc.environment=envRT.texture;pm.dispose();
  const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,0,cam);
  // key from top-left, cool rim from the right, and a soft mint kicker from below-left (the brand glow sits bottom-left)
  const key=new THREE.DirectionalLight(0xffffff,1.1);key.position.set(-5,7,6);sc.add(key);
  const rim=new THREE.DirectionalLight(0x8fd8ff,.35);rim.position.set(6,-2,4);sc.add(rim);
  const kick=new THREE.DirectionalLight(0x52d392,.25);kick.position.set(-6,-5,2);sc.add(kick);
  const root=new THREE.Group();sc.add(root);
  const M=mats();
  const logo=new THREE.Mesh(vGeometry(size),M.logo);root.add(logo);
  const fl=[];const geos=[logo.geometry];
  if(floaters){
    const pg=playShape(),sg=new THREE.SphereGeometry(.5,40,24);geos.push(pg,sg);
    const defs=[[pg,0,[-5.6,3.2,-2],.95],[pg,1,[5.4,-3.4,-1],.75],[sg,2,[4.9,3.6,-3],.8],[sg,3,[-4.8,-3.6,1],.55],[sg,4,[-2.4,4.6,-4],.4],[pg,5,[2.6,-5,-3],.5]];
    for(const [g,mi,p,s] of defs){const o=new THREE.Mesh(g,M.fl[mi]);o.position.set(...p);o.scale.setScalar(s);o.userData.base=p.slice();o.userData.sp=.6+Math.random()*.6;o.rotation.set(Math.random(),Math.random(),Math.random());root.add(o);fl.push(o);}
  }

  /* ---------- input: pointer parallax, drag with momentum, hover + click on the mark, keyboard ---------- */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),hitSphere=new THREE.Sphere();
  let px=0,py=0,dragging=false,moved=0,lastX=0,lastY=0,lastT=0,yaw=0,pitch=0,vel=0,spin=0,hovering=false;
  const pop=new Spring(220,18,1);
  const overLogo=e=>{const b=el.getBoundingClientRect();ndc.set((e.clientX-b.left)/b.width*2-1,-((e.clientY-b.top)/b.height)*2+1);ray.setFromCamera(ndc,camera);
    hitSphere.copy(logo.geometry.boundingSphere).applyMatrix4(logo.matrixWorld);hitSphere.radius*=.8;return ray.ray.intersectsSphere(hitSphere);};
  const setHover=h=>{if(h===hovering)return;hovering=h;pop.target=h?1.06:1;el.style.cursor=dragging?'grabbing':h?'grab':'';};
  el.addEventListener('pointermove',e=>{
    const b=el.getBoundingClientRect();px=(e.clientX-b.left)/b.width*2-1;py=(e.clientY-b.top)/b.height*2-1;
    if(dragging){const now=performance.now(),dx=e.clientX-lastX,dy=e.clientY-lastY;moved+=Math.abs(dx)+Math.abs(dy);
      yaw+=dx*.01;pitch=Math.max(-.5,Math.min(.5,pitch+dy*.006));vel=vel*.6+(dx*.01/Math.max((now-lastT)/1000,.008))*.4;lastX=e.clientX;lastY=e.clientY;lastT=now;}
    else if(e.pointerType==='mouse')setHover(overLogo(e));
    wake();
  });
  el.addEventListener('pointerdown',e=>{dragging=true;moved=0;vel=0;lastX=e.clientX;lastY=e.clientY;lastT=performance.now();el.setPointerCapture?.(e.pointerId);el.style.cursor='grabbing';wake();});
  const release=e=>{if(!dragging)return;dragging=false;el.releasePointerCapture?.(e.pointerId);
    if(moved<6&&overLogo(e)){spin+=Math.PI*2;pop.v+=2.2;}            // a click on the mark: one full turn and a little bounce
    if(performance.now()-lastT>80)vel=0;                             // held still before letting go: no fling
    el.style.cursor=hovering?'grab':'';};
  el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
  el.addEventListener('pointerleave',()=>{px=py=0;if(!dragging)setHover(false);});
  // keyboard: canvases that are announced to screen readers can also be turned with the arrow keys
  if(canvas.hasAttribute('aria-label')){canvas.tabIndex=0;canvas.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();vel+=(e.key==='ArrowRight'?1:-1)*2.5;wake();}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();spin+=Math.PI*2;pop.v+=2.2;wake();}});}
  addEventListener('lessonready',()=>{spin+=Math.PI*2;pop.v+=3;wake();});

  const render=()=>r.render(sc,camera);
  /* ---------- sizing: also refresh pixel ratio (window dragged to another screen, zoom) ---------- */
  function size_(){const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
  new ResizeObserver(size_).observe(el);

  /* ---------- loop: only runs while on screen and the tab is visible ---------- */
  let vis=false,raf=0,T=0,last=0;
  function frame(now){
    raf=0;const dt=Math.min((now-(last||now))/1000,.05);last=now;T+=reduce?0:dt;const t=T;
    if(spin>0){const s=Math.min(spin,Math.max(dt*7*spin/(Math.PI*2),dt*1.5));spin-=s;yaw+=s;}
    if(!dragging&&Math.abs(vel)>.001){yaw+=vel*dt;vel*=Math.exp(-3.2*dt);}
    if(!dragging)pitch=damp(pitch,0,2.5,dt);
    logo.rotation.y=damp(logo.rotation.y,yaw+Math.sin(t*.45)*.38+px*.35,6,dt);
    logo.rotation.x=damp(logo.rotation.x,-.06+py*.18+pitch+Math.sin(t*.6)*.04,6,dt);
    logo.position.y=Math.sin(t*.9)*.18;
    logo.scale.setScalar(pop.update(dt));
    // floaters drift, and shift a little with the pointer (nearer ones more) for depth
    for(const o of fl){const [x,y,z]=o.userData.base,d=(z+5)*.06;o.position.set(x+Math.sin(t*o.userData.sp)*.25-px*d,y+Math.cos(t*o.userData.sp*1.2)*.3+py*d,z);o.rotation.x+=dt*.3*o.userData.sp;o.rotation.y+=dt*.4*o.userData.sp;}
    render();
    // with reduced motion there is no idle drift: keep drawing only while the user is turning it
    const busy=dragging||spin>0||Math.abs(vel)>.001||Math.abs(pop.v)>.01||Math.abs(pop.x-pop.target)>.001;
    if(vis&&!document.hidden&&(!reduce||busy))raf=requestAnimationFrame(frame);
  }
  function wake(){if(!raf&&vis&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;vis?wake():(cancelAnimationFrame(raf),raf=0);}).observe(el);
  document.addEventListener('visibilitychange',()=>{document.hidden?(cancelAnimationFrame(raf),raf=0):wake();});
  size_();

  /* ---------- context loss: fall back to the flat brand mark, recover if the browser restores it ---------- */
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;el.classList.remove('live');canvas.style.visibility='hidden';});
  canvas.addEventListener('webglcontextrestored',()=>{canvas.style.visibility='';el.classList.add('live');size_();wake();});
  addEventListener('pagehide',e=>{if(e.persisted)return;geos.forEach(g=>g.dispose());envRT.dispose();r.dispose();});
}
document.querySelectorAll('[data-stage]').forEach(el=>{const o=el.dataset;stage(el,{size:+(o.size||8),cam:+(o.cam||21),floaters:o.floaters!=='false'});});

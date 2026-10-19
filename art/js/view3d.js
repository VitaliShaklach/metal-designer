/* ---------- 3D: грани-детали, швы, номера, выбор ---------- */
const stage=document.getElementById('stage');
let renderer,scene,camera,controls,labels,root,ok=true,camAnim=null,need=3;
function req3D(){need=Math.max(need,3);}
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));stage.appendChild(renderer.domElement);}catch(e){ok=false;}
if(ok){scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,5,30000);camera.position.set(700,600,1400);
  labels=new THREE.CSS2DRenderer();labels.domElement.style.cssText='position:absolute;inset:0;pointer-events:none';stage.appendChild(labels.domElement);
  controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,300,0);
  scene.add(new THREE.HemisphereLight(0xf2f4f5,0x8f8a84,.75));
  const d=new THREE.DirectionalLight(0xffffff,.85);d.position.set(900,1600,1800);scene.add(d);
  const d2=new THREE.DirectionalLight(0xbfd0e0,.35);d2.position.set(-1500,500,-900);scene.add(d2);
  root=new THREE.Group();scene.add(root);
  const grid=new THREE.GridHelper(6000,60,0xb9c0bd,0xd5dad7);grid.material.transparent=true;grid.material.opacity=.5;scene.add(grid);}
const COL={steel:[0x6b737b,0x8a929a],inox:[0x9aa3ab,0xc2c9cf],corten:[0x8a4a2a,0xa8623a],alu:[0xa9b0b6,0xd0d5d9]};
let LBL=[];
// R — результат buildParts, M3 — сетка в мм; o: {sel, small:Set, nums, mat}
function build3D(M3,R,o){if(!ok)return;req3D();while(root.children.length){const c=root.children.pop();c.geometry&&c.geometry.dispose();if(c.element)c.element.remove();}LBL=[];
  const {V,F}=M3,pos=new Float32Array(F.length*9),col=new Float32Array(F.length*9),[c0,c1]=(COL[o.mat]||COL.steel).map(x=>new THREE.Color(x)),sel=new THREE.Color(0xd0561f),red=new THREE.Color(0xd01f1f),tmp=new THREE.Color();
  F.forEach((f,fi)=>{const pi=R.partOf[fi],h=((pi*2654435761)>>>0)/4294967296;tmp.copy(c0).lerp(c1,h);if(o.small&&o.small.has(pi))tmp.copy(red);if(pi===o.sel)tmp.copy(sel);
    f.forEach((v,k)=>{pos.set(V[v],fi*9+k*3);col.set([tmp.r,tmp.g,tmp.b],fi*9+k*3);});});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,metalness:.45,roughness:.6,side:THREE.DoubleSide,flatShading:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));mesh.userData.pick=true;root.add(mesh);
  // швы между деталями — тёмные линии; открытый край — светлее
  const L=[],Lo=[];R.edges.forEach(e=>(e.open?Lo:L).push(...V[e.a],...V[e.b]));
  const seg=(arr,c,op)=>{if(!arr.length)return;const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));root.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:op})));};
  seg(L,0x15191b,.8);seg(Lo,0xd0561f,.9);
  if(o.nums)R.parts.forEach(p=>{const el=document.createElement('span');el.className='pno'+(p.id===o.sel?' on':'');el.textContent=p.no;const l=new THREE.CSS2DObject(el);
    l.position.set(...V3.add(p.c,V3.mul(p.n,3)));l.userData.n=p.n;root.add(l);LBL.push(l);});}
// номера — только у граней, повёрнутых к камере
function lblVis(){const cp=camera.position;LBL.forEach(l=>{const p=l.position,n=l.userData.n,v=(cp.x-p.x)*n[0]+(cp.y-p.y)*n[1]+(cp.z-p.z)*n[2];l.visible=v>0;});}
function flyTo(p,t){req3D();camAnim={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now()};}
function fitBox(b,instant){if(!ok)return;sizeStage();const c=new THREE.Vector3((b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2);
  let dir=camera.position.clone().sub(controls.target).normalize();if(!isFinite(dir.x))dir=new THREE.Vector3(.45,.3,.85).normalize();
  // расстояние — чтобы все 8 углов габарита влезли и по высоте, и по ширине кадра
  const up=new THREE.Vector3(0,1,0),rt=new THREE.Vector3().crossVectors(up,dir).normalize(),u2=new THREE.Vector3().crossVectors(dir,rt),tv=Math.tan(camera.fov*Math.PI/360)*.88,th=tv*camera.aspect;let dist=0;
  for(let k=0;k<8;k++){const q=new THREE.Vector3(k&1?b.max[0]:b.min[0],k&2?b.max[1]:b.min[1],k&4?b.max[2]:b.min[2]).sub(c),z=q.dot(dir);dist=Math.max(dist,Math.abs(q.dot(rt))/th+z,Math.abs(q.dot(u2))/tv+z);}
  const p=c.clone().add(dir.multiplyScalar(dist+20));if(instant){camera.position.copy(p);controls.target.copy(c);req3D();}else flyTo(p,c);}
function viewDir(k,b,inst){if(!ok)return;const D={front:[0,0,1],side:[1,0,0],top:[0,1,.0001],iso:[.45,.3,.85]}[k];camera.position.copy(controls.target.clone().add(new THREE.Vector3(...D).normalize().multiplyScalar(camera.position.distanceTo(controls.target))));fitBox(b,inst);}
// под курсором: номер треугольника
function pickTri(ev){if(!ok)return -1;const r=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,camera);
  const h=rc.intersectObjects(root.children.filter(o=>o.userData.pick),false)[0];return h?h.faceIndex:-1;}
function sizeStage(){if(!ok)return;req3D();const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);labels.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
if(ok){new ResizeObserver(sizeStage).observe(stage);sizeStage();
  (function loop(){requestAnimationFrame(loop);if(camAnim){const k=Math.min(1,(performance.now()-camAnim.s)/600),e=k<.5?2*k*k:1-(-2*k+2)**2/2;camera.position.lerpVectors(camAnim.p0,camAnim.p1,e);controls.target.lerpVectors(camAnim.t0,camAnim.t1,e);if(k>=1)camAnim=null;}
    controls.update();if(!camAnim&&need<=0)return;need--;lblVis();renderer.render(scene,camera);labels.render(scene,camera);})();
  // рисуем только когда что-то изменилось
  controls.addEventListener('change',req3D);['pointermove','pointerdown','pointerup','wheel','keydown','input','change','click'].forEach(e=>addEventListener(e,req3D,{passive:true,capture:true}));}

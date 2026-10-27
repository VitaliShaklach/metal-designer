/* ---------- 3D: грани-детали, швы, номера, выбор ---------- */
const stage=document.getElementById('stage');
let renderer,scene,camera,controls,labels,root,ok=true,camAnim=null,need=3;
function req3D(){need=Math.max(need,3);}
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));stage.appendChild(renderer.domElement);}catch(e){ok=false;}
if(ok){scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,5,30000);camera.position.set(700,600,1400);
  labels=new THREE.CSS2DRenderer();labels.domElement.style.cssText='position:absolute;inset:0;pointer-events:none';stage.appendChild(labels.domElement);
  controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,300,0);
  scene.add(new THREE.HemisphereLight(0xf2f4f5,0xb4aea6,.8));
  const d=new THREE.DirectionalLight(0xffffff,.85);d.position.set(900,1600,1800);scene.add(d);
  const d2=new THREE.DirectionalLight(0xbfd0e0,.35);d2.position.set(-1500,500,-900);scene.add(d2);
  // подсветка снизу-спереди: подбородок и низ шеи не проваливаются в черноту, детали различимы
  const d3=new THREE.DirectionalLight(0xfff4e8,.45);d3.position.set(400,-1400,1300);scene.add(d3);
  root=new THREE.Group();scene.add(root);
  const grid=new THREE.GridHelper(6000,60,0xb9c0bd,0xd5dad7);grid.material.transparent=true;grid.material.opacity=.5;scene.add(grid);}
const COL={steel:[0x6b737b,0x8a929a],inox:[0x9aa3ab,0xc2c9cf],corten:[0x8a4a2a,0xa8623a],alu:[0xa9b0b6,0xd0d5d9]};
let LBL=[];
// R — результат buildParts, M3 — сетка в мм; o: {sel, small:Set, nums, mat}
function build3D(M3,R,o){if(!ok)return;req3D();while(root.children.length){const c=root.children.pop();c.geometry&&c.geometry.dispose();if(c.element)c.element.remove();}LBL=[];
  const {V,F}=M3,pos=new Float32Array(F.length*9),col=new Float32Array(F.length*9),[c0,c1]=(COL[o.mat]||COL.steel).map(x=>new THREE.Color(x)),sel=new THREE.Color(0xd0561f),red=new THREE.Color(0xd01f1f),amb=new THREE.Color(0xe0a020),blu=new THREE.Color(0x3a6fe0),tmp=new THREE.Color();
  // калька (o.tex): грани белые — цвет даёт текстура; выделения — подкраска поверх рисунка
  const tx=o.tex,wh=new THREE.Color(1,1,1),tint=c=>tx?tmp.copy(wh).lerp(c,.6):tmp.copy(c);
  F.forEach((f,fi)=>{const pi=R.partOf[fi],h=((pi*2654435761)>>>0)/4294967296;if(tx)tmp.copy(wh);else tmp.copy(c0).lerp(c1,h);if(o.small&&o.small.has(pi))tint(red);if(o.warn&&o.warn.has(fi))tint(amb);if(o.blue&&o.blue.has(fi))tint(blu);if(o.grp&&o.grp.has(pi)&&pi!==o.sel)tint(amb);if(o.hi?o.hi.has(fi):pi===o.sel)tint(sel);
    f.forEach((v,k)=>{pos.set(V[v],fi*9+k*3);col.set([tmp.r,tmp.g,tmp.b],fi*9+k*3);});});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
  let map=null;if(tx){g.setAttribute('uv',new THREE.BufferAttribute(tx.uv,2));if(!tx.tex){tx.tex=new THREE.DataTexture(tx.data,tx.W,tx.H,THREE.RGBAFormat);tx.tex.magFilter=tx.tex.minFilter=THREE.LinearFilter;tx.tex.generateMipmaps=false;tx.tex.needsUpdate=true;}map=tx.tex;}
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map,metalness:tx?0:.45,roughness:tx?.85:.6,side:THREE.DoubleSide,flatShading:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));mesh.userData.pick=true;root.add(mesh);
  // подложки за прорезями — тёмные, утоплены внутрь
  if(o.backs&&o.backs.length){const bp=[];o.backs.forEach(P=>{const idx=P.map((_,i)=>i);earClip(P,idx).forEach(t=>t.forEach(i=>bp.push(...P[i])));});
    const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bg.computeVertexNormals();root.add(new THREE.Mesh(bg,new THREE.MeshStandardMaterial({color:0x1c1e20,metalness:.3,roughness:.8,side:THREE.DoubleSide})));}
  // швы между деталями — тёмные линии; открытый край — светлее
  // с калькой (o.diff): лишние швы — красные, недостающие швы эталона — жёлтые точки
  // с гибкой: гнутые стыки — тонким пунктиром
  const L=[],Lo=[],Lr=[],Lb=[],RS=new Set(o.diff?o.diff.red:[]);R.edges.forEach((e,i)=>(e.open?Lo:RS.has(i)?Lr:o.bent&&o.bent(e)?Lb:L).push(...V[e.a],...V[e.b]));
  const seg=(arr,c,op)=>{if(!arr.length)return;const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));root.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:op})));};
  seg(L,0x15191b,.8);seg(Lo,0xd0561f,.9);seg(Lr,0xe01818,1);
  if(Lb.length){const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Lb,3));const ln=new THREE.LineSegments(bg,new THREE.LineDashedMaterial({color:0x2a6fd0,dashSize:4,gapSize:3,transparent:true,opacity:.9}));ln.computeLineDistances();root.add(ln);}
  if(o.diff&&o.diff.yel.length){const yg=new THREE.BufferGeometry();yg.setAttribute('position',new THREE.BufferAttribute(o.diff.yel,3));root.add(new THREE.Points(yg,new THREE.PointsMaterial({color:0xffc400,size:5,sizeAttenuation:false})));}
  // редактор: точки; выбранная — крупная оранжевая
  if(o.verts){const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(V.flat(),3));root.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0x1f8fe0,size:7,sizeAttenuation:false})));
    if(o.mark&&o.mark.length){const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(o.mark.map(i=>V[i]).flat(),3));root.add(new THREE.Points(mg,new THREE.PointsMaterial({color:0xd0561f,size:13,sizeAttenuation:false,depthTest:false})));}
    if(o.sv>=0&&V[o.sv]){const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(V[o.sv],3));root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xd0561f,size:13,sizeAttenuation:false,depthTest:false})));}}
  if(o.nums)R.parts.forEach(p=>{const el=document.createElement('span');el.className='pno'+(p.id===o.sel?' on':'');el.textContent=p.no;const l=new THREE.CSS2DObject(el);
    l.position.set(...V3.add(p.c,V3.mul(p.n,3)));l.userData.n=p.n;root.add(l);LBL.push(l);});}
// номера — только у граней, повёрнутых к камере
function lblVis(){const cp=camera.position;LBL.forEach(l=>{const p=l.position,n=l.userData.n,v=(cp.x-p.x)*n[0]+(cp.y-p.y)*n[1]+(cp.z-p.z)*n[2];l.visible=v>0;});}
function flyTo(p,t){req3D();camAnim={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now()};}
// полёт по дуге вокруг цели, а не по прямой (иначе при повороте на другую сторону камера проходит сквозь фигуру)
function arcDir(A,e){const d0=A.p0.clone().sub(A.t0),d1=A.p1.clone().sub(A.t1),l=d0.length()*(1-e)+d1.length()*e,u0=d0.normalize(),u1=d1.normalize();let w=u0.angleTo(u1);
  if(w<1e-3)return u0.lerp(u1,e).normalize().multiplyScalar(l);if(w>3.1){u1.add(new THREE.Vector3(0,.05,0)).normalize();w=u0.angleTo(u1);}
  return u0.multiplyScalar(Math.sin((1-e)*w)/Math.sin(w)).add(u1.multiplyScalar(Math.sin(e*w)/Math.sin(w))).normalize().multiplyScalar(l);}
// подлететь к детали: она лицом к зрителю (partCam в mesh.js)
function focusPart(p,box){if(!ok||!p)return;const cur=camera.position.clone().sub(controls.target).normalize(),r=partCam(p.c,p.n,Math.max(p.L||0,p.W||0),box,[cur.x,cur.y,cur.z],camera.fov);flyTo(new THREE.Vector3(...r.pos),new THREE.Vector3(...r.target));}
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
// точка поверхности под курсором
function pickHit(ev){if(!ok)return null;const r=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,camera);
  const h=rc.intersectObjects(root.children.filter(o=>o.userData.pick),false)[0];return h?[h.point.x,h.point.y,h.point.z]:null;}
// точка под курсором (ближе 14 px и не за гранью)
function pickVert(ev,V){if(!ok)return -1;const r=renderer.domElement.getBoundingClientRect(),mx=ev.clientX-r.left,my=ev.clientY-r.top,m=new THREE.Vector2(mx/r.width*2-1,-my/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,camera);
  const h=rc.intersectObjects(root.children.filter(o=>o.userData.pick),false)[0],hd=h?h.distance:Infinity;let best=-1,bd=14;const q=new THREE.Vector3();
  V.forEach((p,i)=>{q.set(p[0],p[1],p[2]).project(camera);if(q.z>1)return;const d=Math.hypot((q.x+1)/2*r.width-mx,(1-q.y)/2*r.height-my);if(d>=bd)return;if(camera.position.distanceTo(new THREE.Vector3(...p))>hd+8)return;bd=d;best=i;});return best;}
// точка на плоскости, проходящей через p поперёк взгляда — для перетаскивания
function dragPoint(ev,p){const r=renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,camera);
  const n=new THREE.Vector3();camera.getWorldDirection(n);const pl=new THREE.Plane().setFromNormalAndCoplanarPoint(n,new THREE.Vector3(...p)),o=new THREE.Vector3();return rc.ray.intersectPlane(pl,o)?[o.x,o.y,o.z]:null;}
function sizeStage(){if(!ok)return;req3D();const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);labels.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
if(ok){new ResizeObserver(sizeStage).observe(stage);sizeStage();
  (function loop(){requestAnimationFrame(loop);if(camAnim){const k=Math.min(1,(performance.now()-camAnim.s)/600),e=k<.5?2*k*k:1-(-2*k+2)**2/2;controls.target.lerpVectors(camAnim.t0,camAnim.t1,e);camera.position.copy(controls.target).add(arcDir(camAnim,e));if(k>=1)camAnim=null;}
    controls.update();if(!camAnim&&need<=0)return;need--;lblVis();renderer.render(scene,camera);labels.render(scene,camera);})();
  // рисуем только когда что-то изменилось
  controls.addEventListener('change',req3D);['pointermove','pointerdown','pointerup','wheel','keydown','input','change','click'].forEach(e=>addEventListener(e,req3D,{passive:true,capture:true}));}
/* ---------- снимки куска для карт деталей: та же фигура, что в 3D, кусок — оранжевым, зеркальный — синим ---------- */
// свой рендерер и сцена — основной вид не трогаем; сетка строится один раз на фигуру (CUR.M3), на кусок меняются только цвета
let SHOT=null;
function shotScene(){const R=CUR.R,M3=CUR.M3;if(!SHOT){const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}),sc=new THREE.Scene();r.setPixelRatio(1);sc.background=new THREE.Color(0xeef1f0);
    sc.add(new THREE.HemisphereLight(0xf2f4f5,0xb4aea6,.8));[[0xffffff,.85,[900,1600,1800]],[0xbfd0e0,.35,[-1500,500,-900]],[0xfff4e8,.45,[400,-1400,1300]]].forEach(([c,i,p])=>{const d=new THREE.DirectionalLight(c,i);d.position.set(...p);sc.add(d);});
    SHOT={r,sc,cam:new THREE.PerspectiveCamera(35,1,5,30000),ray:new THREE.Raycaster(),key:null,grp:null};}
  if(SHOT.key===M3&&SHOT.R===R)return SHOT;
  if(SHOT.grp){SHOT.sc.remove(SHOT.grp);SHOT.grp.traverse(o=>o.geometry&&o.geometry.dispose());}
  const {V,F}=M3,pos=new Float32Array(F.length*9),[c0,c1]=(COL[ST.mat]||COL.steel).map(x=>new THREE.Color(x)),base=new Float32Array(F.length*9),tmp=new THREE.Color();
  F.forEach((f,fi)=>{const pi=R.partOf[fi];tmp.copy(c0).lerp(c1,((pi*2654435761)>>>0)/4294967296);f.forEach((v,k)=>{pos.set(V[v],fi*9+k*3);base.set([tmp.r,tmp.g,tmp.b],fi*9+k*3);});});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(base.slice(),3));g.computeVertexNormals();
  const grp=new THREE.Group(),mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,metalness:.45,roughness:.6,side:THREE.DoubleSide,flatShading:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));grp.add(mesh);
  // швы — тёмные линии, сгибы — синим пунктиром (как в 3D)
  const L=[],Lb=[];R.edges.forEach(e=>(e.p.length===2&&CUR.bentKey&&CUR.bentKey.has(bendKey(e.p[0],e.p[1]))?Lb:L).push(...V[e.a],...V[e.b]));
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(L,3));grp.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x15191b,transparent:true,opacity:.8})));
  if(Lb.length){const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(Lb,3));const ln=new THREE.LineSegments(bg,new THREE.LineDashedMaterial({color:0x2a6fd0,dashSize:4,gapSize:3}));ln.computeLineDistances();grp.add(ln);}
  SHOT.sc.add(grp);Object.assign(SHOT,{key:M3,R,grp,mesh,base});return SHOT;}
// элемент отдельно: лицо — оранжевым, изнанка — серо-голубым, край (швы к соседям) — красным, сгибы — синим пунктиром; hl — свет от камеры, ms — сетки (для луча)
function pieceGroup(own){const {R}=CUR,{V,F}=CUR.M3,pos=[],L=[],Lb=[];F.forEach((f,fi)=>{if(own.has(R.partOf[fi]))f.forEach(v=>pos.push(...V[v]));});
  R.edges.forEach(e=>{const a=e.p.filter(p=>own.has(p)).length;if(!a)return;(a===2?Lb:L).push(...V[e.a],...V[e.b]);});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
  const grp=new THREE.Group(),m=c=>new THREE.MeshStandardMaterial({color:c,metalness:.1,roughness:.7,side:THREE.FrontSide,flatShading:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  // изнанка — те же треугольники в обратном обходе (BackSide на общей геометрии не рисовался)
  const rv=[];for(let i=0;i<pos.length;i+=9)rv.push(...pos.slice(i,i+3),...pos.slice(i+6,i+9),...pos.slice(i+3,i+6));const gb=new THREE.BufferGeometry();gb.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));gb.computeVertexNormals();
  const ms=[new THREE.Mesh(g,m(0xe07a35)),new THREE.Mesh(gb,m(0x6f7f92))];grp.add(...ms);
  // свет от камеры (слева сверху от неё) — элемент одинаково освещён с любой стороны
  const hl=new THREE.DirectionalLight(0xffffff,.9);grp.add(hl,hl.target);
  const lg=new THREE.BufferGeometry(),G=[g,gb,lg];lg.setAttribute('position',new THREE.Float32BufferAttribute(L,3));grp.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xd01f1f})));
  if(Lb.length){const bg=new THREE.BufferGeometry();G.push(bg);bg.setAttribute('position',new THREE.Float32BufferAttribute(Lb,3));const ln=new THREE.LineSegments(bg,new THREE.LineDashedMaterial({color:0x1f5fd0,dashSize:4,gapSize:3}));ln.computeLineDistances();grp.add(ln);}
  return {grp,hl,ms,G};}
// снимаем только элемент: фигуру прячем, общий свет сцены приглушаем (со светом от камеры иначе пересвечено); → вернуть как было
function shotBegin(S,P,W,H){S.grp.visible=false;S.sc.add(P.grp);const lt=S.sc.children.filter(o=>o.isLight);lt.forEach(o=>{o.userData.i=o.intensity;o.intensity*=.55;});
  S.r.setSize(W,H,false);S.cam.aspect=W/H;S.cam.updateProjectionMatrix();
  return ()=>{S.sc.remove(P.grp);S.grp.visible=true;lt.forEach(o=>{o.intensity=o.userData.i;});P.G.forEach(g=>g.dispose());};}
// камера: вид v (d — от точки c к глазу), расстояние dist; свет — от камеры
function shotCam(S,P,v,c,dist){const eye=V3.add(c,V3.mul(v.d,dist+5));P.hl.position.set(...V3.add(eye,V3.add(V3.mul(v.up,dist*.6),V3.mul(v.r,-dist*.4))));P.hl.target.position.set(...c);
  S.cam.position.set(...eye);S.cam.up.set(...v.up);S.cam.lookAt(...c);S.cam.updateMatrixWorld();return eye;}
// расстояние, чтобы точки vs заполнили кадр с полем ~10% (asp — ширина/высота)
const shotFit=(vs,c,v,asp)=>{const tv=Math.tan(17.5*Math.PI/180);let d=0;vs.forEach(q=>{const o=V3.sub(q,c),z=V3.dot(o,v.d);d=Math.max(d,Math.abs(V3.dot(o,v.r))/(tv*asp*.88)+z,Math.abs(V3.dot(o,v.up))/(tv*.88)+z);});return d;};
// только элемент, в 3D с 4 сторон. own — номера деталей элемента; asp — ширина/высота клетки. → [{url, txt}]; нет WebGL → null
function pieceShots(own,tw,asp){if(!ok||!CUR||!CUR.M3)return null;let S;try{S=shotScene();}catch(e){return null;}
  const {R}=CUR,{V}=CUR.M3,P=pieceGroup(own),W=820,done=shotBegin(S,P,W,Math.round(W/asp));
  // ракурсы: основной, слева и справа сверху, сзади (изнанка); почти с ребра — поворот поменьше
  const ps=R.parts.filter(p=>own.has(p.id)),vs=[...new Set(ps.flatMap(p=>p.full))].map(i=>V[i]),c=vs.reduce((s,q)=>V3.add(s,V3.mul(q,1/vs.length)),[0,0,0]);
  const v0=stepView(ps),A=ps.reduce((s,p)=>s+p.area,0)||1,sc=v=>ps.reduce((s,p)=>s+p.area*Math.abs(V3.dot(p.n,v.d)),0)/A;
  const vw=[[0,0],[65,25],[-65,25],[180,0]].map(([t,u])=>{for(const k of [1,.6,.35]){const v=viewTilt(viewTurn(v0,t*k),u);if(sc(v)>.4||t===0)return v;}return viewTilt(viewTurn(v0,t*.35),u);});
  // элемент длинной стороной вдоль клетки (камеру можно повернуть на 90°)
  const out=vw.map((v0,i)=>{const v1={...v0,r:v0.up,up:V3.mul(v0.r,-1)},v=shotFit(vs,c,v1,asp)<shotFit(vs,c,v0,asp)?v1:v0;shotCam(S,P,v,c,shotFit(vs,c,v,asp));S.r.render(S.sc,S.cam);
    return {url:S.r.domElement.toDataURL('image/jpeg',.9),txt:i===3?'сзади — изнанка':'вид '+v.txt};});
  done();return out;}
/* сгиб l элемента own — крупно, элемент уже согнут; в угол вставлен уголок «У141°» (≥178° — приложена линейка, уголка нет — ничего).
   Смотрим вдоль линии сгиба под ≈35° (в сторону и со стороны клина — видны и угол, и грани), «верх» — по биссектрисе угла; кадр — уголок и грани рядом (до ~10 см от него).
   → {url, labs: [{x, y, t, k}] — подписи в долях кадра (k: no — номер детали, bend — номер сгиба, tpl — уголок), hit — уголок не встаёт}; нет WebGL → null */
function bendShot(own,l,asp){if(!ok||!CUR||!CUR.M3||!CUR.BP)return null;let S;try{S=shotScene();}catch(e){return null;}
  const {R}=CUR,{V}=CUR.M3,j=CUR.BP.J[l.id],a=Math.round(l.ang),tp=CUR.TPL&&CUR.TPL.find(o=>o.a===a),T=bendTpl(R,CUR.M3,j,own,tp?tp.pts:null),{M,u,e1,w2,b}=T,R0=95;
  const P=pieceGroup(own),W=1600,H=Math.round(W/asp),done=shotBegin(S,P,W,H),col=l.kind==='V'?0xd03030:0x3030d0;
  // линия этого сгиба — толстой (линии WebGL всегда в 1 пиксель)
  const LA=V[j.A],LB=V[j.B],ll=V3.len(V3.sub(LB,LA)),cg=new THREE.CylinderGeometry(1.1,1.1,ll,10),cy=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:col}));P.G.push(cg);
  cy.position.set(...V3.mul(V3.add(LA,LB),.5));cy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...u));P.grp.add(cy);
  // уголок: контур толщиной 2 мм поперёк линии, прижат к граням (у вершины — выемка), светлая сталь, тёмная кромка; линейка — полоса поперёк линии на гранях
  let tc=null;if(tp){// базис правый (иначе обход граней зеркальный и уголок тёмный): третья ось — u или −u
    const uz=V3.dot(V3.cross(e1,T.e2),u)>0?u:V3.mul(u,-1),sh=new THREE.Shape(tp.pts.map(([x,y])=>new THREE.Vector2(x,y))),eg=new THREE.ExtrudeGeometry(sh,{depth:2,bevelEnabled:false}),O=V3.sub(V3.add(M,T.o),uz);
    eg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(...e1),new THREE.Vector3(...T.e2),new THREE.Vector3(...uz)).setPosition(...O));const ed=new THREE.EdgesGeometry(eg);P.G.push(eg,ed);
    P.grp.add(new THREE.Mesh(eg,new THREE.MeshStandardMaterial({color:0xb4bac0,metalness:.25,roughness:.5,side:THREE.DoubleSide})),new THREE.LineSegments(ed,new THREE.LineBasicMaterial({color:0x2b2f33})));
    const c2=tp.pts.reduce((s,q)=>[s[0]+q[0]/tp.pts.length,s[1]+q[1]/tp.pts.length],[0,0]);tc=V3.add(V3.add(M,T.o),V3.add(V3.mul(e1,c2[0]),V3.mul(T.e2,c2[1])));}
  else if(a>=TPL_MAX){const dx=V3.norm(V3.sub(e1,w2)),bx=new THREE.BoxGeometry(120,1.5,20),m4=new THREE.Matrix4().makeBasis(new THREE.Vector3(...dx),new THREE.Vector3(...b),new THREE.Vector3(...u)).setPosition(...V3.add(M,V3.mul(b,1.2)));
    bx.applyMatrix4(m4);P.G.push(bx);P.grp.add(new THREE.Mesh(bx,new THREE.MeshStandardMaterial({color:0xe8cf6a,metalness:.1,roughness:.6})));tc=V3.add(M,V3.mul(b,2));}
  // кадр: уголок, грани p и q от линии до ~R0, линия сгиба, вершины элемента рядом
  const ext=(pi,w)=>Math.max(10,...R.parts[pi].full.map(i=>V3.dot(V3.sub(V[i],M),w))),Ep=Math.min(ext(j.p,e1),R0),Eq=Math.min(ext(j.q,w2),R0),near=q=>V3.len(V3.sub(q,M))<R0;
  const ps=R.parts.filter(p=>own.has(p.id)),vs=T.P3.concat([V3.add(M,V3.mul(e1,Ep)),V3.add(M,V3.mul(w2,Eq)),V3.add(M,V3.mul(u,Math.max(-R0,-ll*T.at))),V3.add(M,V3.mul(u,Math.min(R0,ll*(1-T.at))))],
    [...new Set(ps.flatMap(p=>p.full))].map(i=>V[i]).filter(near));
  // откуда смотреть: с обоих концов линии, в обе стороны — где уголок и обе грани у вершины не заслонены
  const n=V3.norm(V3.cross(u,b)),eyeHit=(eye,q)=>{const dv=V3.sub(q,eye),dl=V3.len(dv);S.ray.set(new THREE.Vector3(...eye),new THREE.Vector3(...V3.mul(dv,1/dl)));const h=S.ray.intersectObjects(P.ms);return h.length&&h[0].distance<dl-Math.max(1.5,dl*.006);};
  const probe=[tc||V3.add(M,V3.mul(b,15)),V3.add(M,V3.add(V3.mul(e1,Ep*.5),V3.mul(b,1))),V3.add(M,V3.add(V3.mul(w2,Eq*.5),V3.mul(b,1)))];
  let best=null;for(const s of [1,-1])for(const sd of [1,-1]){const d=V3.norm(V3.add(V3.add(V3.mul(u,s),V3.mul(n,sd*.5)),V3.mul(b,.42))),up=V3.norm(V3.sub(b,V3.mul(d,V3.dot(b,d)))),v={d,up,r:V3.norm(V3.cross(up,d))};
    const xs=vs.map(q=>V3.dot(V3.sub(q,M),v.r)),ys=vs.map(q=>V3.dot(V3.sub(q,M),v.up)),c=V3.add(M,V3.add(V3.mul(v.r,(Math.min(...xs)+Math.max(...xs))/2),V3.mul(v.up,(Math.min(...ys)+Math.max(...ys))/2))),dist=shotFit(vs,c,v,asp);
    const eye=V3.add(c,V3.mul(d,dist+5)),sc=probe.filter(q=>!eyeHit(eye,q)).length;if(!best||sc>best.sc)best={v,c,dist,sc};if(sc===probe.length)break;}
  const eye=shotCam(S,P,best.v,best.c,best.dist);S.r.render(S.sc,S.cam);const url=S.r.domElement.toDataURL('image/jpeg',.9);
  // подписи: номера деталей (видимые, в кадре и не ребром к нам), номер сгиба у линии, уголок
  const prj=q=>{const p=new THREE.Vector3(...q).project(S.cam);return [(p.x+1)/2,(1-p.y)/2];},inF=f=>f[0]>.05&&f[0]<.95&&f[1]>.06&&f[1]<.94,labs=[];
  ps.forEach(p=>{const q=p.id===j.p?V3.add(M,V3.mul(e1,Ep*.62)):p.id===j.q?V3.add(M,V3.mul(w2,Eq*.62)):p.c,f=prj(q),fc=Math.abs(V3.dot(p.n,V3.norm(V3.sub(eye,q))));if(inF(f)&&fc>.2&&!eyeHit(eye,V3.add(q,V3.mul(V3.norm(V3.sub(eye,q)),1))))labs.push({x:f[0],y:f[1],t:String(p.no),k:'no'});});
  const fb=prj(V3.sub(M,V3.mul(b,6)));labs.push({x:fb[0],y:fb[1],t:String(l.k),k:'bend'});
  if(tp){const f=prj(tc);labs.push({x:f[0],y:f[1],t:tplNo(a),k:'tpl'});}
  done();return {url,labs,hit:T.hit,how:tp?'tpl':a>=TPL_MAX?'ruler':'none'};}

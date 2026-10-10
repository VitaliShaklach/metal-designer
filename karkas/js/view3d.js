/* ---------- 3D: трубы с настоящими скосами и подрезкой, узлы, выделение ---------- */
const stage=document.getElementById('stage');
let renderer,scene,camera,controls,labels,group,dimGroup,ok=true,camAnim=null;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));stage.appendChild(renderer.domElement);}catch(e){ok=false;}
const MAT={};
if(ok){scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(35,1,10,60000);camera.position.set(2600,2200,3200);
  labels=new THREE.CSS2DRenderer();labels.domElement.style.cssText='position:absolute;inset:0;pointer-events:none';stage.appendChild(labels.domElement);
  controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(300,400,300);
  scene.add(new THREE.HemisphereLight(0xf2f4f5,0xb9b4ae,.9));
  const d=new THREE.DirectionalLight(0xffffff,.9);d.position.set(1500,3000,2200);scene.add(d);
  const d2=new THREE.DirectionalLight(0xbfd0e0,.4);d2.position.set(-2000,900,-1500);scene.add(d2);
  const std=(c,x={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:.5,roughness:.55,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1},x));
  MAT.steel=std(0x59616a);MAT.sel=std(0xd0561f);MAT.dim=std(0x59616a,{transparent:true,opacity:.18,depthWrite:false});
  MAT.edge=new THREE.LineBasicMaterial({color:0x1b2124,transparent:true,opacity:.55});
  MAT.node=new THREE.MeshBasicMaterial({color:0x2a7ab0});MAT.nodeSel=new THREE.MeshBasicMaterial({color:0xd0561f});
  group=new THREE.Group();scene.add(group);dimGroup=new THREE.Group();scene.add(dimGroup);
  const grid=new THREE.GridHelper(20000,200,0xb9c0bd,0xd5dad7);grid.material.transparent=true;grid.material.opacity=.5;scene.add(grid);}
// тело трубы: 4 угла сечения на каждом конце, каждый — пересечение ребра с плоскостью реза
function memberGeo(c){const f=frame(c.m),p=prof(c.m.prof),hw=p.w/2,hh=p.h/2;
  const corners=[[1,1],[-1,1],[-1,-1],[1,-1]].map(([s,t])=>V3.add(V3.mul(f.u,s*hw),V3.mul(f.v,t*hh)));
  const endPts=(N,dir,cut)=>corners.map(o=>{const q=V3.add(N,o),den=V3.dot(cut.n,dir);const s=Math.abs(den)<1e-6?0:V3.dot(cut.n,V3.sub(cut.p,q))/den;return V3.add(q,V3.mul(dir,s));});
  const A=endPts(f.A,f.d,c.ea.cut),B=endPts(f.B,f.d,c.eb.cut),pts=[...A,...B],idx=[];
  for(let i=0;i<4;i++){const j=(i+1)%4;idx.push(i,j,4+j,i,4+j,4+i);}
  idx.push(0,2,1,0,3,2,4,5,6,4,6,7);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));g.setIndex(idx);g.computeVertexNormals();return g;}
let SHOW_NODES=true,ONLY_GRP=null;
function build3D(){if(!ok)return;
  [group,dimGroup].forEach(G=>{G.traverse(o=>{if(o.element&&o.element.parentNode)o.element.parentNode.removeChild(o.element);});G.clear();});
  const cuts=memberCuts();
  cuts.forEach(c=>{const dimmed=ONLY_GRP!==null&&(c.m.grp||'')!==ONLY_GRP,sel=SEL.m.has(c.m.id);
    const g=memberGeo(c),mesh=new THREE.Mesh(g,sel?MAT.sel:dimmed?MAT.dim:MAT.steel);mesh.userData.member=c.m.id;group.add(mesh);
    if(!dimmed){const e=new THREE.LineSegments(new THREE.EdgesGeometry(g,20),MAT.edge);e.userData.member=c.m.id;group.add(e);}});
  if(SHOW_NODES){const r=Math.max(8,Math.min(30,sceneSize()*.006)),sg=new THREE.SphereGeometry(r,12,8);
    M.nodes.forEach(n=>{const s=new THREE.Mesh(sg,SEL.n.has(n.id)?MAT.nodeSel:MAT.node);s.position.set(n.x,n.y,n.z);s.userData.node=n.id;s.renderOrder=5;s.material.depthTest=true;group.add(s);});}
  dims3D();}
const sceneSize=()=>{const bb=bbox();return Math.max(400,bb.max[0]-bb.min[0],bb.max[1]-bb.min[1],bb.max[2]-bb.min[2]);};
function flyTo(p,t){camAnim={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,s:performance.now()};}
function fitAll(instant){if(!ok)return;const bb=bbox(),c=new THREE.Vector3((bb.min[0]+bb.max[0])/2,(bb.min[1]+bb.max[1])/2,(bb.min[2]+bb.max[2])/2);
  const r=Math.max(300,new THREE.Vector3(bb.max[0]-bb.min[0],bb.max[1]-bb.min[1],bb.max[2]-bb.min[2]).length()/2);
  const vf=camera.fov*Math.PI/360,hf=Math.atan(Math.tan(vf)*camera.aspect),dist=r/Math.sin(Math.min(vf,hf))*1.05;
  let dir=camera.position.clone().sub(controls.target).normalize();if(!isFinite(dir.x))dir=new THREE.Vector3(.55,.45,.7).normalize();
  const p=c.clone().add(dir.multiplyScalar(dist));if(instant){camera.position.copy(p);controls.target.copy(c);}else flyTo(p,c);}
// что под курсором: труба или узел
function pickAt(ev){if(!ok)return null;const r=renderer.domElement.getBoundingClientRect();
  const m=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,camera);rc.params.Line.threshold=4;
  const hits=rc.intersectObjects(group.children,false).filter(h=>h.object.isMesh);
  const nd=hits.find(h=>h.object.userData.node);if(nd)return {node:nd.object.userData.node};
  const mb=hits.find(h=>h.object.userData.member);return mb?{member:mb.object.userData.member,point:mb.point}:null;}
function sizeStage(){if(!ok)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);labels.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
if(ok){new ResizeObserver(sizeStage).observe(stage);sizeStage();
  (function loop(){requestAnimationFrame(loop);if(camAnim){const k=Math.min(1,(performance.now()-camAnim.s)/600),e=k<.5?2*k*k:1-(-2*k+2)**2/2;camera.position.lerpVectors(camAnim.p0,camAnim.p1,e);controls.target.lerpVectors(camAnim.t0,camAnim.t1,e);if(k>=1)camAnim=null;}
    controls.update();renderer.render(scene,camera);labels.render(scene,camera);})();}
// виды: спереди / сбоку / сверху / изометрия
function viewDir(k){if(!ok)return;const D={front:[0,0,1],side:[1,0,0],top:[0,1,.0001],iso:[.55,.45,.7]}[k];camera.position.copy(controls.target.clone().add(new THREE.Vector3(...D).normalize().multiplyScalar(camera.position.distanceTo(controls.target))));fitAll();}

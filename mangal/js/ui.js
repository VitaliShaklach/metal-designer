/* ---------- интерфейс ---------- */
// режим: заголовок, лид, группы галочек, переключатель
const LEDE={both:()=>`Три части. <b>Жаровня</b> ${L1} × ${W} × ${fmt(H1,2)} под шампуры — отдельный элемент. <b>Печь под казан</b> ${L2} × ${WK} × ${H2} слева, под покупную плиту 45 × 45 с кольцами; топка с открытого левого торца. <b>Защита от дождя</b>: трубки по углам, стойки и лист. Ручка 50 см справа. Четыре ножки с поворотными колёсами Ø100 на площадках, под печью два — с тормозом. Ножки откручиваются (М16).`,
  grill:()=>`<b>Мангал</b> ${L1} × ${W} × ${fmt(H1,2)} под шампуры: задвижки поддува, съёмная перегородка, глубокие прорези. Ручка 50 см справа. Четыре ножки на поворотных колёсах Ø100, у ручки два — с тормозом: выкатывается целиком. Ножки откручиваются (М16). <b>Защита от дождя</b>: трубки по углам, стойки и лист.`,
  stove:()=>`<b>Печь под казан</b> ${L2} × ${WK} × ${H2} под покупную плиту 45 × 45 с кольцами; топка с левого торца, труба сзади. Ручка 50 см на перегородке справа. Четыре ножки на поворотных колёсах Ø100, у ручки два — с тормозом. Ножки откручиваются (М16). <b>Защита от дождя</b>: трубки по углам, стойки и лист.`};
const TTL={both:'Мангал с казанницей',grill:'Мангал',stove:'Печь под казан'};
function modeUI(){document.getElementById('ttl').textContent=document.title=TTL[S.mode];document.getElementById('lede').innerHTML=LEDE[S.mode]();
  document.getElementById('grpGrill').hidden=!gOn();document.getElementById('grpStove').hidden=!sOn();
  document.querySelectorAll('#modeSeg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===S.mode));
  if(typeof fillEls==='function')fillEls();}
function updUI(){modeUI();
  document.getElementById('hTopV').textContent=T+' см';
  document.getElementById('hFireV').textContent=H2+' см';
  document.getElementById('hBarV').textContent=`${BAR_F} / ${BAR_B} см`;
  document.getElementById('rainSm').textContent=`стойки ${BAR_F} / ${BAR_B}, лист 0,5 мм`;
  const gap=Math.round(slopeY(W/2)-kzTop()), head=BAR_TOP_F;
  document.getElementById('fit').innerHTML=
    `<span>Верх жаровни: <b>${T}</b> см ${T>=95&&T<=100?'':'<span class="warn">· для роста 184 советую 95–100</span>'}</span>`+
    `<span>Крыша спереди: <b>${head}</b> см ${head>=190?'':'<span class="warn">· ниже головы</span>'}</span>`+
    (sOn()?`<span>Казан ${KZ.v} л в проёме Ø${fmt(KZ.open*2)}: в топке <b>${fmt(KZ.sink)}</b> из ${KZ.d} см</span>`:'')+
    (S.mode==='both'?`<span>Ножки без колёс: жаровня <b>${fmt(B-WH)}</b>, печь <b>${fmt(KB-WH)}</b></span>`:`<span>Ножки без колёс: <b>${fmt((gOn()?B:KB)-WH)}</b> см</span>`)+
    (sOn()?`<span>От крышки казана до крыши: <b class="${gap<25?'warn':''}">${gap}</b> см</span>`:'');
}
// пробел + тянуть мышью = двигать эскиз (как в Figma)
let spacePan=null,spaceHeld=false,overStage=false;
stage.addEventListener('pointerenter',()=>overStage=true);stage.addEventListener('pointerleave',()=>{if(!spacePan)overStage=false;});
addEventListener('keydown',e=>{if(e.code!=='Space'||!overStage)return;const a=document.activeElement;
  if(a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&a.type==='text')))return;
  e.preventDefault();if(a&&a.blur)a.blur();if(!spaceHeld&&ok){spaceHeld=true;controls.enabled=false;stage.style.cursor='grab';}},{capture:true});
addEventListener('keyup',e=>{if(e.code!=='Space')return;if(spaceHeld)e.preventDefault();spaceHeld=false;spacePan=null;if(ok)controls.enabled=true;stage.style.cursor='';},{capture:true});
stage.addEventListener('pointerdown',e=>{if(!spaceHeld||!ok)return;e.preventDefault();spacePan={x:e.clientX,y:e.clientY};stage.style.cursor='grabbing';stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!spacePan)return;const dx=e.clientX-spacePan.x,dy=e.clientY-spacePan.y;spacePan={x:e.clientX,y:e.clientY};
  const d=camera.position.distanceTo(controls.target),k=2*d*Math.tan(camera.fov*Math.PI/360)/renderer.domElement.clientHeight;
  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1);
  const off=right.multiplyScalar(-dx*k).add(up.multiplyScalar(dy*k));camera.position.add(off);controls.target.add(off);});
stage.addEventListener('pointerup',()=>{if(spacePan){spacePan=null;stage.style.cursor=spaceHeld?'grab':'';}});
function sizeStage(){if(!ok)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);labels.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
if(ok){new ResizeObserver(sizeStage).observe(stage);sizeStage();(function loop(){requestAnimationFrame(loop);if(camAnim){const k=Math.min(1,(performance.now()-camAnim.s)/700),e=k<.5?2*k*k:1-(-2*k+2)**2/2;camera.position.lerpVectors(camAnim.p0,camAnim.p1,e);controls.target.lerpVectors(camAnim.t0,camAnim.t1,e);if(k>=1)camAnim=null;}controls.update();renderer.render(scene,camera);labels.render(scene,camera);})();}


function render(){recompute();updUI();build3D();dimList();drawCut();}
document.querySelectorAll('#pitchSeg button').forEach(bt=>bt.addEventListener('click',()=>{
  S.pitch=+bt.dataset.p;document.querySelectorAll('#pitchSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));render();}));
const hTop=document.getElementById('hTop'),hFire=document.getElementById('hFire'),hBar=document.getElementById('hBar');
hTop.addEventListener('input',()=>{TOPH=+hTop.value;render();});
hFire.addEventListener('input',()=>{H2=+hFire.value;render();});
document.getElementById('dimList').addEventListener('change',e=>{const id=e.target.dataset.id;if(!id)return;e.target.checked?S.dims.add(id):S.dims.delete(id);build3D();});
document.getElementById('dAll').addEventListener('click',()=>{dimVisible().forEach(r=>S.dims.add(r.id));build3D();dimList();});
document.getElementById('dNone').addEventListener('click',()=>{dimVisible().forEach(r=>S.dims.delete(r.id));build3D();dimList();});
hBar.addEventListener('input',()=>{BAR_F=+hBar.value;render();});
document.querySelectorAll('#kzSeg button').forEach(bt=>bt.addEventListener('click',()=>{setKZ(+bt.dataset.v);document.querySelectorAll('#kzSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));render();}));
document.getElementById('cLegs').addEventListener('change',e=>{S.legs=e.target.checked;build3D();});
document.getElementById('cLegTw').addEventListener('change',e=>{S.legTw=e.target.checked;build3D();});
document.getElementById('cWheels').addEventListener('change',e=>{S.wheels=e.target.checked;build3D();});
document.getElementById('cKazan').addEventListener('change',e=>{S.kazan=e.target.checked;render();});
document.getElementById('cRain').addEventListener('change',e=>{S.rain=e.target.checked;render();});
[['cSheet','sheet'],['cBolt','bolt'],['cWsh1','wsh1'],['cWsh2','wsh2'],['cNut','nut']].forEach(([id,k])=>document.getElementById(id).addEventListener('change',e=>{S[k]=e.target.checked;build3D();}));
document.getElementById('cAngles').addEventListener('change',e=>{S.angles=e.target.checked;build3D();});
document.getElementById('cXray').addEventListener('change',e=>{if(!ok)return;const on=e.target.checked;M.steel.transparent=on;M.steel.opacity=on?.28:1;M.steel.depthWrite=!on;M.steel.needsUpdate=true;});
document.getElementById('cDraft').addEventListener('change',e=>{S.draft=e.target.checked;build3D();});
document.querySelectorAll('#shSeg button').forEach(bt=>bt.addEventListener('click',()=>{S.sh=bt.dataset.v;document.querySelectorAll('#shSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));build3D();}));
document.querySelectorAll('#grSeg button').forEach(bt=>bt.addEventListener('click',()=>{S.grType=bt.dataset.v;document.querySelectorAll('#grSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));render();}));
document.getElementById('cGrate').addEventListener('change',e=>{S.grate=e.target.checked;build3D();});
document.getElementById('cWood').addEventListener('change',e=>{S.wood=e.target.checked;build3D();});
document.getElementById('cGrates2').addEventListener('change',e=>{S.grates2=e.target.checked;build3D();});
document.getElementById('cGrillGrate').addEventListener('change',e=>{S.grillGrate=e.target.checked;build3D();});
document.getElementById('cGAng').addEventListener('change',e=>{S.gAng=e.target.checked;build3D();});
document.getElementById('cAirSl').addEventListener('change',e=>{S.airSl=e.target.checked;build3D();});
document.getElementById('cHook').addEventListener('change',e=>{S.hook=e.target.checked;build3D();});
document.querySelectorAll('#airSeg button').forEach(bt=>bt.addEventListener('click',()=>{S.air=bt.dataset.v;document.querySelectorAll('#airSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));build3D();}));
document.getElementById('cDiv').addEventListener('change',e=>{S.div=e.target.checked;build3D();});
document.querySelectorAll('#divSeg button').forEach(bt=>bt.addEventListener('click',()=>{S.divPos=+bt.dataset.v;document.querySelectorAll('#divSeg button').forEach(x=>x.setAttribute('aria-pressed',x===bt));build3D();}));
document.getElementById('cLogo').addEventListener('change',e=>{S.logo=e.target.checked;build3D();drawCut();});
document.getElementById('cMan').addEventListener('change',e=>{S.man=e.target.checked;build3D();});
[['cCgr','cgr'],['cCgrPlate','cgrPlate'],['cCgrAng','cgrAng']].forEach(([id,k])=>document.getElementById(id).addEventListener('change',e=>{S[k]=e.target.checked;render();}));
document.getElementById('cDeep').addEventListener('change',e=>{S.deep=e.target.checked;build3D();});
document.getElementById('cChimX').addEventListener('change',e=>{S.chimX=e.target.checked;build3D();});
document.getElementById('cObe').addEventListener('change',e=>{S.obe=e.target.checked;build3D();drawCut();});
document.getElementById('cDamper').addEventListener('change',e=>{S.damper=e.target.checked;build3D();});
document.getElementById('cFb').addEventListener('change',e=>{S.fb=e.target.checked;build3D();});
document.getElementById('cChim').addEventListener('change',e=>{S.chim=e.target.checked;build3D();});
document.getElementById('cTie').addEventListener('change',e=>{S.tie=e.target.checked;build3D();});
document.getElementById('cLintel').addEventListener('change',e=>{S.lintel=e.target.checked;build3D();});
document.getElementById('cDoor').addEventListener('change',e=>{S.door=e.target.checked;build3D();});
document.getElementById('cDoorOpen').addEventListener('change',e=>{S.doorOpen=e.target.checked;build3D();});
document.getElementById('cSkewD').addEventListener('change',e=>{S.skewD=e.target.checked;build3D();});
document.getElementById('cSkew').addEventListener('change',e=>{S.skew=e.target.checked;build3D();});
document.getElementById('cPlate').addEventListener('change',e=>{S.plate=e.target.checked;build3D();});
document.getElementById('cLift').addEventListener('change',e=>{S.lift=e.target.checked;build3D();dimList();});
/* ---------- подсказки: пояснение галочки — в значке «?», показывается при наведении (на телефоне — по нажатию) ---------- */
(()=>{let box=document.getElementById('tipBox');if(!box){box=document.createElement('div');box.id='tipBox';box.hidden=true;document.body.appendChild(box);}
  document.querySelectorAll('.controls .chk').forEach(l=>{const sm=l.querySelector('small');if(!sm)return;
    const i=document.createElement('i');i.className='tip';i.textContent='?';
    const tn=sm.previousSibling,w=document.createElement('span');w.className='nw';   // «?» приклеен к последнему слову — не переносится один
    if(tn&&tn.nodeType===3){const m=tn.textContent.match(/^(.*?)(\S+)\s*$/s);if(m){tn.textContent=m[1];w.textContent=m[2];}}
    w.appendChild(i);sm.parentNode.insertBefore(w,sm);
    const show=()=>{const tx=sm.textContent.trim();if(!tx)return;box.textContent=tx;box.hidden=false;const r=i.getBoundingClientRect(),w=box.offsetWidth;
      box.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left-w/2))+'px';box.style.top=(r.bottom+6)+'px';};
    i.addEventListener('mouseenter',show);i.addEventListener('mouseleave',()=>box.hidden=true);
    i.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();box.hidden?show():box.hidden=true;});});
  document.querySelector('.controls').addEventListener('scroll',()=>box.hidden=true);})();
/* ---------- выбор элемента и детали: на 3D, в размерах и раскрое остаётся только он ---------- */
const CAM0=[[150,190,280],[15,60,19]];   // общий вид
const selEl=document.getElementById('selEl'),selPart=document.getElementById('selPart');
function fillEls(){selEl.innerHTML=`<option value="">${({both:'Весь мангал',grill:'Весь мангал',stove:'Вся печь'})[S.mode]}</option>`+PARTS.filter(e=>elOk(e.id)).map(e=>`<option value="${e.id}">${e.name}</option>`).join('');selEl.value=S.sel.el||'';}
fillEls();
function fillParts(){const e=elOf(S.sel.el);selPart.disabled=!e;
  selPart.innerHTML='<option value="">'+(e?'Весь элемент':'—')+'</option>'+(e?e.d.filter(([id])=>partOk(id)).map(([id,n])=>`<option value="${id}">${n}</option>`).join(''):'');
  selPart.value=S.sel.part||'';}
function flyTo(p,tg){if(!ok)return;camAnim={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:tg,s:performance.now()};}
function fitSel(){if(!ok)return;
  if(!S.sel.el&&S.mode==='both'){flyTo(new THREE.Vector3(...CAM0[0]),new THREE.Vector3(...CAM0[1]));return;}   // отдельный блок — наезд на рамку всего блока
  group.updateMatrixWorld(true);const bb=new THREE.Box3();
  // мелкие детали по краям мангала (скобы задвижек) — наезжаем на один экземпляр: правый крючок на передней боковине, там же его размеры
  const one=S.sel.part==='hook'?(o=>o.position.z>W/2&&o.position.x>40):null;
  group.children.forEach(o=>{if(o.visible&&!o.userData.dim&&!o.isCSS2DObject&&(!one||one(o)))bb.expandByObject(o);});
  if(bb.isEmpty())return;
  const c=bb.getCenter(new THREE.Vector3()),r=bb.getSize(new THREE.Vector3()).length()/2;
  const vf=camera.fov*Math.PI/360,hf=Math.atan(Math.tan(vf)*camera.aspect);   // половины углов обзора
  const dir=camera.position.clone().sub(controls.target).normalize(),d=Math.max(r,8)/Math.sin(Math.min(vf,hf))*(S.sel.el?1.35:.95);
  // деталь — в верхней части картинки: смотрим чуть ниже её центра
  const up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1),tg=c.clone().sub(up.multiplyScalar(r>12&&S.sel.el?d*Math.tan(vf)*.45:0));   // мелкие детали — точно в центре, чтобы вращать вокруг них
  flyTo(tg.clone().add(dir.multiplyScalar(d)),tg);}
function applySel(){fillParts();
  document.getElementById('pickHint').textContent=S.sel.el?`Показано: ${S.sel.part?partName(S.sel.part):elOf(S.sel.el).name}. Размеры и раскрой — только для него`:'Выберите элемент — на модели, в размерах и раскрое останется только он';
  build3D();dimList();drawCut();fitSel();}
selEl.addEventListener('change',()=>{S.sel={el:selEl.value||null,part:null};applySel();});
selPart.addEventListener('change',()=>{S.sel.part=selPart.value||null;applySel();});
document.querySelectorAll('#modeSeg button').forEach(bt=>bt.addEventListener('click',()=>{if(S.mode===bt.dataset.v)return;S.mode=bt.dataset.v;S.sel={el:null,part:null};recompute();updUI();applySel();}));
fillParts();
/* ---------- «Скопировать вид»: камера + деталь + размеры + галочки одной строкой (?view=…) ---------- */
function viewString(){const r=v=>+v.toFixed(1),p=camera.position,g=controls.target;
  const f={};Object.keys(S).forEach(k=>{if(typeof S[k]==='boolean'||k==='sh'||k==='grType'||k==='mode')f[k]=S[k];});
  f.kz=KZ.v;f.H2=H2;f.TOPH=TOPH;f.BAR_F=BAR_F;
  const q=new URLSearchParams({view:[p.x,p.y,p.z,g.x,g.y,g.z].map(r).join(','),fov:camera.fov,asp:camera.aspect.toFixed(2),dims:[...S.dims].join(','),flags:JSON.stringify(f)});
  if(S.sel.el)q.set('sel',S.sel.el+(S.sel.part?'.'+S.sel.part:''));
  return '?'+q.toString();}
document.getElementById('copyView').addEventListener('click',async()=>{if(!ok)return;
  const txt=viewString(),box=document.getElementById('viewBox'),inp=document.getElementById('viewTxt'),msg=document.getElementById('viewMsg');
  inp.value=txt;box.hidden=false;let done=false;
  try{await navigator.clipboard.writeText(txt);done=true;}catch(e){}
  if(!done){inp.focus();inp.select();try{done=document.execCommand('copy');}catch(e){}}
  msg.textContent=done?'Скопировано — пришлите эту строку':'Выделено — нажмите Ctrl+C и пришлите строку';
  clearTimeout(box._t);box._t=setTimeout(()=>box.hidden=true,12000);});
// режим снимка (для PDF и проверок): ?view=cx,cy,cz,tx,ty,tz&fov=35&dims=id,id&parts=grill,stove&flags={"wood":false}
const Q=new URLSearchParams(location.search);
if(Q.has('view')&&ok){document.body.classList.add('shot');
  S.dims=new Set((Q.get('dims')||'').split(',').filter(Boolean));
  if(Q.has('parts'))S.parts=new Set(Q.get('parts').split(','));
  const f=JSON.parse(Q.get('flags')||'{}');   // размеры из ползунков и казан — отдельно, остальное — галочки S
  if('kz' in f){setKZ(f.kz);delete f.kz;}
  if('H2' in f){H2=f.H2;delete f.H2;} if('LEG' in f){TOPH=f.LEG+13;delete f.LEG;} if('TOPH' in f){TOPH=f.TOPH;delete f.TOPH;} if('BAR_F' in f){BAR_F=f.BAR_F;delete f.BAR_F;}
  if(f.xray){M.steel.transparent=true;M.steel.opacity=.22;M.steel.depthWrite=false;M.steel.needsUpdate=true;delete f.xray;}   // прозрачный корпус
  Object.assign(S,f);recompute();
  const v=Q.get('view').split(',').map(Number);camera.fov=+(Q.get('fov')||35);camera.updateProjectionMatrix();
  camera.position.set(v[0],v[1],v[2]);controls.target.set(v[3],v[4],v[5]);}
if(Q.has('sel')){const [e,pt]=Q.get('sel').split('.');S.sel={el:e||null,part:pt||null};selEl.value=e||'';fillParts();}
window.addEventListener('error',e=>document.body.classList.contains('shot')&&document.body.insertAdjacentHTML('afterbegin','<h1 style="color:red">'+e.message+' @'+e.lineno+'</h1>'));
render();
if(ok&&!Q.has('view')&&!Q.has('sel')){sizeStage();fitSel();if(camAnim){camera.position.copy(camAnim.p1);controls.target.copy(camAnim.t1);camAnim=null;}}   // старт: камера на весь блок текущего режима
if(Q.has('sel')&&ok&&(Q.has('fit')||!Q.has('view'))){sizeStage();fitSel();if(camAnim&&Q.has('view')){camera.position.copy(camAnim.p1);controls.target.copy(camAnim.t1);camAnim=null;}}   // ?sel=stove.chim — сразу показать деталь (&fit — подогнать камеру)

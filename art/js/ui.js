/* ---------- Панель, таблицы, расчёт ---------- */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(x,d=0)=>Number(x).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d});
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}};
function msg(t){$('msg').textContent=t||'';}

// состояние фигуры
const ST={edit:false,sym:true,sv:-1,sp:-1,name:'',fig:'dog',base:null,faces:260,dims:{W:0,H:600,D:0},prop:true,t:2,mat:'steel',sheet:'1250x2500',sw:1250,sl:2500,cut:'plasma',minW:30,sel:-1,nums:true,small:true};
let SIMP={key:'',m:null},CUR=null;   // CUR = {M3,R,T,small}
const DENSE=2000;                    // больше стольких треугольников — модель гладкая, упрощаем
const isDense=()=>!ST.base.P&&ST.base.F.length>DENSE;
const isPoly=()=>!!ST.base.P;   // модель из граней-многоугольников (руками / в редакторе) — живёт в мм как есть
const E=()=>({V:ST.base.V,P:ST.base.P});
// размеры многоугольной модели: тянем саму модель (x — от оси, y — от пола, z — от стены)
function setPolyDims(){ST.base=polyBase(fitMesh({V:ST.base.V,F:[]},ST.dims).V,ST.base.P);}
function syncDims(){const s=meshBox(ST.base.V).size;ST.dims={W:Math.round(s[0]),H:Math.round(s[1]),D:Math.round(s[2])};}
function natSize(){return meshBox(ST.base.V).size;}
function dimsFromH(H){const s=natSize();ST.dims={H,W:Math.round(s[0]*H/s[1]),D:Math.round(s[2]*H/s[1])};}
function sheetWL(){if(ST.sheet==='own')return [Math.max(ST.sw,ST.sl),Math.min(ST.sw,ST.sl)];const [a,b]=ST.sheet.split('x').map(Number);return [b,a];}

function loading(on,t){$('loading').hidden=!on;if(t)$('loadTxt').textContent=t;}
// тяжёлое — после отрисовки «Строю…»
function later(fn,t){loading(true,t||'Считаю…');setTimeout(()=>{try{fn();}catch(e){console.error(e);msg('Ошибка: '+e.message);}loading(false);},30);}

function compute(){const b=ST.base;let S=b;
  if(isPoly()){const M3={V:b.V,F:b.F},R=buildParts(M3,1.5,1.5),T=totals(R,{t:ST.t,mat:ST.mat,sheet:sheetWL()});
    CUR={M3,R,T,small:new Set(R.parts.filter(p=>p.minW<ST.minW-.5).map(p=>p.id)),bad:new Set(nonPlanar(E(),1.5))};if(ST.sel>=R.parts.length)ST.sel=-1;if(ST.sp>=b.P.length)ST.sp=-1;if(ST.sv>=b.V.length)ST.sv=-1;return;}
  if(isDense()&&ST.faces<b.F.length){const key=b.F.length+':'+b.V.length+':'+ST.faces+':'+b.V[0];if(SIMP.key!==key){SIMP={key,m:simplify(b,ST.faces)};}S=SIMP.m;}
  else if(!isDense()&&ST.faces<b.F.length){const key='low:'+b.F.length+':'+ST.faces+':'+b.V[0];if(SIMP.key!==key){SIMP={key,m:simplify(b,ST.faces)};}S=SIMP.m;}
  const asIs=!isDense()&&ST.faces>=b.F.length;   // гранёная как есть: грани уже плоские, не трогаем
  let M3=fitMesh(S,ST.dims);if(ST.minW>0&&!asIs)M3=fitMesh(fixSlivers(M3,ST.minW),ST.dims);   // после чистки — снова точно в размер
  const R=asIs?buildParts(M3,1.5,1.5):buildParts(M3),T=totals(R,{t:ST.t,mat:ST.mat,sheet:sheetWL()});
  const small=new Set(R.parts.filter(p=>p.minW<ST.minW-.5).map(p=>p.id));
  CUR={M3,R,T,small,bad:new Set()};if(ST.sel>=R.parts.length)ST.sel=-1;}

function renderAll(fit){if(!CUR)return;const ed=ST.edit&&isPoly(),T=ST.base.T,tri=set=>{const o=new Set();if(T)T.forEach((pi,fi)=>{if(set.has(pi))o.add(fi);});return o;};
  build3D(CUR.M3,CUR.R,{sel:ST.sel,small:ST.small?CUR.small:null,nums:ST.nums&&!ed,mat:ST.mat,verts:ed,sv:ST.sv,hi:ed&&ST.sp>=0?tri(new Set([ST.sp])):null,warn:isPoly()?tri(CUR.bad):null});edUI();if(fit)fitBox(meshBox(CUR.M3.V),fit==='instant');
  stats();sizeUI();facesUI();selUI();partsTable();sumTable();$('ttl').textContent=ST.name||'Фигура';}
function stats(){const T=CUR.T,b=meshBox(CUR.M3.V).size;
  $('stats').innerHTML=[[`${Math.round(b[0])} × ${Math.round(b[1])} × ${Math.round(b[2])}`,'Ш × В × Г, мм'],[`${T.n}`,'деталей'],[`≈ ${fmt(T.mass,1)} кг`,`${ST.t} мм, ${MATN[ST.mat]}`],[`${fmt(T.weld/1000,1)} м`,'швов']]
    .map(([b,s])=>`<div class="stat"><b>${b}</b><span>${esc(s)}</span></div>`).join('');}
// угол между листами по шву; вогнутый (больше 180°) — «внутрь»
const angT=d=>d>180.5?Math.round(360-d)+'° внутрь':Math.round(d)+'°';
const MATN={steel:'сталь',inox:'нержавейка',corten:'кортен',alu:'алюминий'};
function sizeUI(){['H','W','D'].forEach(k=>{const el=$('d'+k);if(document.activeElement!==el)el.value=ST.dims[k];});$('cProp').checked=ST.prop;}
function facesUI(){$('fRng').disabled=isPoly();if(isPoly()){$('fVal').textContent=ST.base.P.length+' (многоугольников)';$('fNote').textContent='Модель из граней-многоугольников: берём как есть, число граней меняется в редакторе. Чтобы упростить гладкую модель — откройте её заново';$('minW').value=ST.minW;$('cSmall').checked=ST.small;return;}
  const n=ST.base.F.length,r=$('fRng');r.max=Math.min(n,1500);r.min=Math.min(40,n);r.value=Math.min(ST.faces,n);$('fVal').textContent=Math.min(ST.faces,n);
  $('fNote').textContent=isDense()?`Модель гладкая: ${fmt(n)} треугольников — упрощаем до выбранного числа. 150–300 — как у фигур в мастерских, больше — глаже, но больше сварки`
    :ST.faces>=n?`Модель гранёная: ${n} треугольников — берём как есть, грани в одной плоскости сливаются в одну деталь. Ползунок влево — ещё проще`:`Модель гранёная (${n} треугольников) — упрощена до ${ST.faces}`;
  $('minW').value=ST.minW;$('cSmall').checked=ST.small;}

/* ---------- деталь: развёртка с длинами сторон и соседями ---------- */
function partSVG(p,big){const P=p.pts;if(!P.length)return '';const pad=big?Math.max(p.L,p.W)*.16+8:2,w=p.L+2*pad,h=p.W+2*pad,fs=Math.max(p.L,p.W)*.07+3;
  let s=`<svg class="${big?'flat':'mini'}" viewBox="${-pad} ${-pad} ${w} ${h}" ${big?'':'width="64" height="40"'}><polygon points="${P.map(q=>q[0].toFixed(1)+','+(p.W-q[1]).toFixed(1)).join(' ')}" class="pf" vector-effect="non-scaling-stroke"/>`;
  if(big){const cx=p.pts.reduce((s,q)=>s+q[0],0)/P.length,cy=p.pts.reduce((s,q)=>s+q[1],0)/P.length;
    p.segs.forEach((g,i)=>{const a=P[i],b=P[(i+1)%P.length],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=mx-cx,dy=my-cy,l=Math.hypot(dx,dy)||1,ox=mx+dx/l*fs*1.1,oy=my+dy/l*fs*1.1;
      const nb=g.nb>=0?CUR.R.parts[g.nb].no:null;
      s+=`<text x="${ox.toFixed(1)}" y="${(p.W-oy).toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${Math.round(g.len)}</text>`;
      if(nb)s+=`<text x="${(mx-dx/l*fs*1.2).toFixed(1)}" y="${(p.W-(my-dy/l*fs*1.2)).toFixed(1)}" font-size="${(fs*.8).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="nb">→${nb}</text>`;});
    s+=`<text x="${cx.toFixed(1)}" y="${(p.W-cy).toFixed(1)}" font-size="${(fs*1.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="no">${p.no}</text>`;}
  return s+'</svg>';}
function selUI(){const p=ST.sel>=0?CUR.R.parts[ST.sel]:null;if(!p){$('selBox').innerHTML='<p class="note">Кликните грань на модели или строку в таблице</p>';return;}
  const m=p.area*1e-6*ST.t*1e-3*(DENS[ST.mat]||7850);
  $('selBox').innerHTML=`<p class="selh">Деталь № ${p.no}${CUR.small.has(p.id)?' <span class="bad">узкая</span>':''}</p>${partSVG(p,true)}
    <p class="note">Габарит ${Math.round(p.L)} × ${Math.round(p.W)} мм · ширина ${Math.round(p.minW)} мм · ${fmt(p.area/100,1)} см² · ${fmt(m,3)} кг · рез ${Math.round(p.perim)} мм</p>
    <p class="note">Сварка: ${p.segs.filter(g=>g.nb>=0).map(g=>`к № ${CUR.R.parts[g.nb].no} — ${Math.round(g.len)} мм, угол ${angT(g.dih)}`).join('; ')||'—'}${p.segs.some(g=>g.nb<0)?'. Открытый край — '+Math.round(p.segs.filter(g=>g.nb<0).reduce((s,g)=>s+g.len,0))+' мм':''}</p>`;}
function partsTable(){const ps=[...CUR.R.parts].sort((a,b)=>a.no-b.no),dens=DENS[ST.mat]||7850;
  $('parts').innerHTML=`<thead><tr><th>№</th><th>Эскиз</th><th>Размер, мм</th><th>Ширина</th><th>Площадь, см²</th><th>Масса, кг</th><th>Рез, мм</th><th>Соседи (угол)</th></tr></thead><tbody>`+
    ps.map(p=>`<tr data-p="${p.id}" class="${p.id===ST.sel?'on':''}${CUR.small.has(p.id)?' bad':''}"><td>${p.no}</td><td>${partSVG(p)}</td><td>${Math.round(p.L)} × ${Math.round(p.W)}</td><td>${Math.round(p.minW)}</td><td>${fmt(p.area/100,1)}</td><td>${fmt(p.area*1e-9*ST.t*dens,3)}</td><td>${Math.round(p.perim)}</td>
      <td class="nbs">${p.segs.filter(g=>g.nb>=0).map(g=>`${CUR.R.parts[g.nb].no}<small> ${angT(g.dih)}</small>`).join(', ')}</td></tr>`).join('')+'</tbody>';}
function sumTable(){const T=CUR.T,[sl,sw]=sheetWL(),warn=[];
  if(CUR.small.size)warn.push(`${CUR.small.size} дет. уже ${ST.minW} мм — подсвечены красным. Уменьшите число граней или увеличьте фигуру`);
  const H=ST.dims.H;if(ST.t<=1&&H>350||ST.t<1.5&&H>700)warn.push(`Лист ${ST.t} мм на фигуре ${H} мм — поведёт от сварки. Варите короткими прихватками вразбежку или возьмите толще`);
  const holes=CUR.R.parts.filter(p=>p.holes).length;if(holes)warn.push(`У ${holes} дет. внутри дыра — проверьте модель`);
  $('warn').hidden=!warn.length;$('warn').innerHTML=warn.map(esc).join('<br>');
  const rows=[['Деталей',T.n],['Площадь металла',fmt(T.area/1e6,2)+' м²'],[`Масса (${ST.t} мм, ${MATN[ST.mat]})`,'≈ '+fmt(T.mass,1)+' кг'],['Длина реза',fmt(T.cut/1000,1)+' м'],
    ['Длина швов',fmt(T.weld/1000,1)+' м'],['Открытый край (спина, низ)',fmt(T.open/1000,1)+' м'],['Самая узкая деталь',Math.round(T.minW)+' мм'],[`Листов ${sw} × ${sl}`,'≈ '+T.sheets]];
  $('sum').innerHTML='<tbody>'+rows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')+'</tbody>';}

/* ---------- загрузка фигур и файлов ---------- */
function setBase(m,o={}){ST.base=m;SIMP={key:'',m:null};ST.sel=-1;ST.name=o.name||ST.name;$('mName').value=ST.name;
  ST.faces=o.faces||(isDense()?250:m.F.length);if(o.dims)ST.dims=o.dims;else dimsFromH(o.H||600);ST.sv=ST.sp=-1;UNDO.length=REDO.length=0;ST.edit=false;$('cEdit').checked=false;if(m.P)setPolyDims();}
function loadFigure(id){later(()=>{const f=FIGURES[id];ST.fig=id;setBase(figureMesh(id,12),{name:f.name,faces:f.faces,H:f.H});if(/edit/.test(location.hash)){ST.edit=true;$('cEdit').checked=true;}compute();renderAll('instant');store('art-fig',id);msg('');const hv=/v=([a-z]+)/.exec(location.hash);if(hv)viewDir(hv[1],meshBox(CUR.M3.V),/og/.test(location.hash));},'Строю фигуру…');}
function openFile(file){const ext=file.name.split('.').pop().toLowerCase(),name=file.name.replace(/\.[^.]+$/,'');
  file.arrayBuffer().then(buf=>later(()=>{let m,o={name};
    if(ext==='obj')m=parseOBJ(new TextDecoder().decode(buf));else if(ext==='stl')m=parseSTL(buf);else if(ext==='glb')m=parseGLB(buf);
    else if(ext==='json'){const j=JSON.parse(new TextDecoder().decode(buf));if(j.type!=='md-art')throw new Error('это не файл фигуры');m=j.P?polyBase(j.V,j.P):{V:j.V,F:j.F};o={name:j.name||name,dims:j.dims,faces:j.F.length};
      ['t','mat','sheet','sw','sl','cut','minW'].forEach(k=>{if(j[k]!==undefined)ST[k]=j[k];});metalUI();}
    else throw new Error('нужен файл OBJ, STL, GLB или JSON');
    if(!m.F.length)throw new Error('в файле нет граней');ST.fig='';$('figSel').value='';setBase(m,o);compute();renderAll('instant');
    msg(`Открыто: ${m.F.length} треугольников${isDense()?' — упрощаю до '+ST.faces:''}`);},'Читаю модель…'));}
function save(){const j={type:'md-art',v:1,name:ST.name,dims:ST.dims,t:ST.t,mat:ST.mat,sheet:ST.sheet,sw:ST.sw,sl:ST.sl,cut:ST.cut,minW:ST.minW,
    V:CUR.M3.V.map(p=>p.map(x=>Math.round(x*100)/100)),F:CUR.M3.F};if(isPoly())j.P=ST.base.P;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(j)],{type:'application/json'}));a.download=(ST.name||'figura')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function metalUI(){$('sT').value=ST.t;$('sMat').value=ST.mat;$('sSheet').value=ST.sheet;$('sCut').value=ST.cut;$('sW').value=ST.sw;$('sL').value=ST.sl;$('ownSheet').hidden=ST.sheet!=='own';}

/* ---------- события ---------- */
let RT=0;const recalc=(fit,heavy)=>{clearTimeout(RT);RT=setTimeout(()=>heavy?later(()=>{compute();renderAll(fit);}):(compute(),renderAll(fit)),heavy?150:60);};
$('figSel').addEventListener('change',e=>{if(e.target.value)loadFigure(e.target.value);});
$('bOpen').addEventListener('click',()=>$('fileIn').click());
$('fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(f)openFile(f);e.target.value='';});
$('bSave').addEventListener('click',save);
$('mName').addEventListener('input',e=>{ST.name=e.target.value;$('ttl').textContent=ST.name||'Фигура';});
['H','W','D'].forEach(k=>$('d'+k).addEventListener('change',e=>{const v=Math.max(50,+e.target.value||0);
  if(ST.prop){const r=v/ST.dims[k];['H','W','D'].forEach(q=>ST.dims[q]=Math.round(ST.dims[q]*r));}ST.dims[k]=v;if(isPoly()){pushUndo();setPolyDims();}recalc(true);}));
$('cProp').addEventListener('change',e=>{ST.prop=e.target.checked;});
$('bReset').addEventListener('click',()=>{if(isPoly()){syncDims();msg('Модель из граней — пропорции уже её собственные');return;}dimsFromH(ST.dims.H);recalc(true);});
$('fRng').addEventListener('input',e=>{ST.faces=+e.target.value;$('fVal').textContent=ST.faces;recalc(false,true);});
$('minW').addEventListener('change',e=>{ST.minW=Math.max(0,+e.target.value||0);recalc();});
$('cSmall').addEventListener('change',e=>{ST.small=e.target.checked;renderAll();});
$('cNums').addEventListener('change',e=>{ST.nums=e.target.checked;renderAll();});
document.querySelectorAll('.rot [data-r]').forEach(b=>b.addEventListener('click',()=>{const ax=b.dataset.r,H=ST.dims.H;
  const RV=ST.base.V.map(([x,y,z])=>ax==='x'?[x,-z,y]:ax==='y'?[z,y,-x]:[-y,x,z]);if(isPoly()){pushUndo();ST.base=polyBase(RV,ST.base.P);syncDims();setPolyDims();}else{ST.base={V:RV,F:ST.base.F};SIMP={key:'',m:null};dimsFromH(H);}later(()=>{compute();renderAll(true);});}));
$('sT').addEventListener('change',e=>{ST.t=+e.target.value;recalc();});
$('sMat').addEventListener('change',e=>{ST.mat=e.target.value;recalc();});
$('sSheet').addEventListener('change',e=>{ST.sheet=e.target.value;$('ownSheet').hidden=ST.sheet!=='own';recalc();});
['sW','sL'].forEach(k=>$(k).addEventListener('change',e=>{ST[k==='sW'?'sw':'sl']=Math.max(100,+e.target.value||0);recalc();}));
$('sCut').addEventListener('change',e=>{ST.cut=e.target.value;ST.minW=ST.cut==='laser'?15:30;recalc();});
$('parts').addEventListener('click',e=>{const tr=e.target.closest('tr[data-p]');if(!tr)return;ST.sel=+tr.dataset.p;renderAll();$('controls').querySelector('[data-g="sel"]').classList.remove('shut');});
document.querySelectorAll('.vbar [data-v]').forEach(b=>b.addEventListener('click',()=>CUR&&viewDir(b.dataset.v,meshBox(CUR.M3.V))));
$('bFit').addEventListener('click',()=>CUR&&fitBox(meshBox(CUR.M3.V)));
// вкладки и группы панели
const TABS=[...document.querySelectorAll('.tabbar button')];
function showTab(k){TABS.forEach(b=>{const on=b.dataset.tab===k;b.setAttribute('aria-selected',String(on));$('tab-'+b.dataset.tab).hidden=!on;});store('art-tab',k);}
TABS.forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));showTab(store('art-tab')==='sum'?'sum':'parts');
document.querySelectorAll('.controls .grp').forEach(g=>g.querySelector('.gt').addEventListener('click',()=>g.classList.toggle('shut')));
(()=>{const pn=$('controls'),bt=$('drawerBtn'),set=o=>{pn.classList.toggle('open',o);bt.setAttribute('aria-expanded',String(o));bt.textContent=o?'Готово':'Панель';};
  bt.addEventListener('click',()=>set(!pn.classList.contains('open')));$('drawerClose').addEventListener('click',()=>set(false));})();
/* ---------- редактор ---------- */
const UNDO=[],REDO=[];
function snapE(){return JSON.stringify({V:ST.base.V,P:ST.base.P});}
function pushUndo(){if(!isPoly())return;UNDO.push(snapE());if(UNDO.length>60)UNDO.shift();REDO.length=0;}
function applyE(e,keepSel){ST.base=polyBase(e.V,e.P);syncDims();if(!keepSel){ST.sp=-1;ST.sv=-1;ST.sel=-1;}compute();renderAll();}
function undo(){if(!UNDO.length)return;REDO.push(snapE());applyE(JSON.parse(UNDO.pop()));}
function redo(){if(!REDO.length)return;UNDO.push(snapE());applyE(JSON.parse(REDO.pop()));}
// перейти в редактор: любая модель становится набором граней-деталей в мм
function toPoly(){if(isPoly())return;const R=CUR.R,V=CUR.M3.V.map(p=>p.slice());ST.base=polyBase(V,R.parts.map(p=>p.full.slice()));ST.fig='';$('figSel').value='';syncDims();
  msg('Модель переведена в грани — теперь правится вручную');}
function edUI(){const on=ST.edit&&isPoly();$('hint').textContent=on?'Точку — тянуть мышкой · клик по грани — выбрать · Delete — удалить грань · Ctrl+Z — отменить':'Клик по грани — деталь · колесо — масштаб · правая кнопка — сдвиг';$('edBox').hidden=!ST.edit;stage.classList.toggle('editing',on);if(!ST.edit)return;
  const B=ST.base;let h='<p class="note">Кликните точку или грань на модели</p>';
  if(ST.sv>=0&&B.V[ST.sv]){const p=B.V[ST.sv];h=`<b>Точка</b> — тяните мышкой или введите координаты, мм<div class="xyz3"><label>X<input class="inp" id="vX" type="number" value="${Math.round(p[0])}"></label><label>Y<input class="inp" id="vY" type="number" value="${Math.round(p[1])}"></label><label>Z<input class="inp" id="vZ" type="number" value="${Math.round(p[2])}"></label></div>`;}
  else if(ST.sp>=0&&B.P[ST.sp]){const Q=B.P[ST.sp],dev=polyDev(B.V,Q);h=`<b>Грань</b> — ${Q.length} угла${Q.length>4?' (многоугольник)':''}${dev>1.5?', <span class="bad">неплоская на '+Math.round(dev)+' мм</span>':''}`;}
  $('edSel').innerHTML=h;$('edOps').querySelectorAll('button').forEach(b=>b.disabled=ST.sp<0);
  const n=CUR&&CUR.bad?CUR.bad.size:0;$('edPlan').className='note'+(n?' warn':'');$('edPlan').textContent=n?`Неплоских граней: ${n} — подсвечены жёлтым. Плоский лист так не согнёшь: выровняйте (точки сдвинутся на миллиметры) или разбейте на треугольники`:'Все грани плоские — каждая режется одним куском';
  $('bFlat').disabled=$('bTri').disabled=!n;$('bUndo').disabled=!UNDO.length;$('bRedo').disabled=!REDO.length;}
$('cEdit').addEventListener('change',e=>{ST.edit=e.target.checked;if(ST.edit&&CUR){toPoly();compute();}renderAll();});
$('cSym').addEventListener('change',e=>{ST.sym=e.target.checked;});
$('edSel').addEventListener('change',e=>{if(ST.sv<0||!['vX','vY','vZ'].includes(e.target.id))return;pushUndo();const e2={V:ST.base.V.map(p=>p.slice()),P:ST.base.P};
  moveVert(e2,ST.sv,[+$('vX').value,+$('vY').value,+$('vZ').value],ST.sym);applyE(e2,true);});
$('edOps').addEventListener('click',e=>{const b=e.target.closest('button[data-op]');if(!b||ST.sp<0)return;const d=Math.max(1,+$('edD').value||0),op=b.dataset.op;pushUndo();
  const r={extrude:()=>extrude(E(),ST.sp,d,ST.sym),inset:()=>extrude(E(),ST.sp,-d,ST.sym),bump:()=>poke(E(),ST.sp,d,ST.sym),pit:()=>poke(E(),ST.sp,-d,ST.sym),split:()=>splitPoly(E(),ST.sp,ST.sym),del:()=>delPoly(E(),ST.sp,ST.sym)}[op]();applyE(r);});
$('bFlat').addEventListener('click',()=>{pushUndo();applyE(flattenAll(E(),ST.sym),true);});
$('bTri').addEventListener('click',()=>{pushUndo();applyE(triangulateBad(E(),1.5));});
$('bUndo').addEventListener('click',undo);$('bRedo').addEventListener('click',redo);
$('bBlank').addEventListener('click',()=>{const k=$('blank').value,b=k==='box'?blankBox():blankSphere();ST.fig='';$('figSel').value='';
  const m=polyBase(b.V,b.P),s=meshBox(m.V).size;setBase(m,{name:k==='box'?'Заготовка — куб':'Заготовка — шар',dims:{W:Math.round(s[0]),H:Math.round(s[1]),D:Math.round(s[2])}});
  ST.edit=true;$('cEdit').checked=true;compute();renderAll('instant');});
addEventListener('keydown',e=>{if(!ST.edit||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&(k==='z'||k==='я')&&!e.shiftKey){e.preventDefault();undo();}else if((e.ctrlKey||e.metaKey)&&(k==='y'||k==='н'||k==='z'&&e.shiftKey)){e.preventDefault();redo();}
  else if(k==='delete'&&ST.sp>=0){pushUndo();applyE(delPoly(E(),ST.sp,ST.sym));}});

// клик по грани — выбрать деталь; в редакторе — точку или грань, точку можно тянуть
(()=>{if(!ok)return;const cv=renderer.domElement,tag=$('hovTag');let down=null,drag=null,raf=0;
  cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};if(e.button!==0||!ST.edit||!isPoly()||!CUR)return;
    const v=pickVert(e,ST.base.V);if(v<0)return;ST.sv=v;ST.sp=-1;ST.sel=-1;drag={v,snap:snapE(),moved:false};controls.enabled=false;cv.setPointerCapture(e.pointerId);renderAll();});
  cv.addEventListener('pointermove',e=>{if(drag){const p=dragPoint(e,ST.base.V[drag.v]);if(!p)return;drag.moved=true;tag.hidden=true;if(raf)return;
      raf=requestAnimationFrame(()=>{raf=0;if(!drag)return;const e2={V:ST.base.V.map(q=>q.slice()),P:ST.base.P};moveVert(e2,drag.v,dragPoint(e,ST.base.V[drag.v])||p,ST.sym);applyE(e2,true);});return;}
    if(!CUR||e.buttons){tag.hidden=true;return;}const t=pickTri(e);if(t<0){tag.hidden=true;return;}const p=CUR.R.parts[CUR.R.partOf[t]],r=stage.getBoundingClientRect();
    tag.textContent=`№ ${p.no} · ${Math.round(p.L)} × ${Math.round(p.W)} мм`;tag.style.left=(e.clientX-r.left)+'px';tag.style.top=(e.clientY-r.top)+'px';tag.hidden=false;});
  cv.addEventListener('pointerup',e=>{if(drag){const d=drag;drag=null;controls.enabled=true;if(d.moved){UNDO.push(d.snap);REDO.length=0;edUI();}down=null;return;}
    if(!down||!CUR)return;const mv=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(mv>5||e.button!==0)return;
    const t=pickTri(e),pi=t>=0?CUR.R.partOf[t]:-1;
    if(ST.edit&&isPoly()){ST.sv=-1;ST.sp=t>=0?ST.base.T[t]:-1;ST.sel=pi;renderAll();return;}
    ST.sel=pi===ST.sel?-1:pi;renderAll();
    if(pi>=0){$('controls').querySelector('[data-g="sel"]').classList.remove('shut');const tr=$('parts').querySelector(`tr[data-p="${pi}"]`);if(tr)tr.scrollIntoView({block:'nearest'});}});
  cv.addEventListener('pointerleave',()=>tag.hidden=true);})();

// старт
if(/og/.test(location.hash)){document.body.classList.add('og');ST.nums=false;ST.small=false;$('cNums').checked=false;}
metalUI();
if(typeof THREE==='undefined'){loading(true,'Не загрузилась 3D-библиотека — проверьте интернет');}
else{const hf=/f=([a-z0-9]+)/.exec(location.hash),f=hf&&FIGURES[hf[1]]?hf[1]:FIGURES[store('art-fig')]?store('art-fig'):'doberman';$('figSel').value=f;loadFigure(f);}

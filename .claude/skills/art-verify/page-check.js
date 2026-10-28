/* Сверка страницы «Искусства» в превью — одним вызовом javascript_tool:
     (await import('/.claude/skills/art-verify/page-check.js?'+Date.now())).default()
   Опции: {layout:false} — без вёрстки, {numbers:false} — без вкладок и цифр (быстро, для телефона),
   {dxf:true} — только DXF: оба файла (раскрой и детали) разобрать и проверить для цеха.
   Ходит по вкладкам «Детали», «Итого», «Раскрой», «Чертежи», «Карты» и возвращает, что не сходится.
   Трогает только открытую вкладку, вид таблицы «Детали» и разделы панели — всё возвращает как было.
   Вёрстка меряется при текущей ширине: запускать на телефоне (resize_window mobile) и на обычном экране. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms=30000)=>{const t=performance.now();while(performance.now()-t<ms){try{const v=f();if(v)return v;}catch(e){}await sleep(150);}return null;};
const $=id=>document.getElementById(id);
const cur=()=>{try{return CUR;}catch(e){return null;}};   // CUR — let страницы, на window его нет
const vis=e=>{if(!e.getClientRects().length)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none';};
const clipped=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement)if(getComputedStyle(p).overflowX!=='visible')return true;return false;};
const lbl=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+` «${(e.textContent||e.value||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,24)}»`;

// ---------- вёрстка при текущей ширине окна ----------
async function layout(){
  // на узком экране панель — выдвижная: открыть её и все разделы, после — закрыть как было
  const db=$('drawerBtn'),drawer=db&&vis(db),shut=[...document.querySelectorAll('#controls .grp.shut .gt')];
  if(drawer){db.click();await sleep(500);}shut.forEach(b=>b.click());await sleep(200);
  const W=innerWidth,out={width:W,scrollWidth:document.documentElement.scrollWidth};
  out.overflow=[...document.querySelectorAll('body *')].filter(e=>{if(!vis(e)||getComputedStyle(e).position==='fixed')return false;const r=e.getBoundingClientRect();return r.width&&r.right>W+1&&!clipped(e);}).slice(0,15).map(e=>lbl(e)+' до '+Math.round(e.getBoundingClientRect().right));
  // под палец: меньше 32 px по высоте или ширине (галочки — 24)
  const st={};[...document.querySelectorAll('button,a[href],select,input:not([type=hidden]),.tip')].filter(vis).forEach(e=>{const r=e.getBoundingClientRect(),m=e.type==='checkbox'||e.type==='radio'?24:32;if(r.height>=m&&r.width>=m)return;
    const k=(e.type==='checkbox'?'галочки':e.classList.contains('tip')?'«?»':lbl(e))+' '+Math.round(r.width)+'×'+Math.round(r.height);st[k]=(st[k]||0)+1;});
  out.smallTargets=Object.entries(st).map(([k,n])=>n>1?`${k} ×${n}`:k);
  // iPhone зумит страницу при фокусе на поле со шрифтом меньше 16 px
  out.inputFontUnder16=[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),select,textarea')].filter(vis).filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>lbl(e)+' '+getComputedStyle(e).fontSize);
  out.tinyText=[...new Set([...document.querySelectorAll('body *')].filter(e=>vis(e)&&!e.closest('svg')&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<11).map(e=>e.tagName.toLowerCase()+'.'+e.className+' '+getComputedStyle(e).fontSize))];
  const tops=[...document.querySelectorAll('.tabbar [role=tab]')].map(b=>Math.round(b.getBoundingClientRect().top));const rows=[...new Set(tops)];
  out.tabRows=rows.length+(rows.length>1?` (в последнем ряду ${tops.filter(t=>t===rows[rows.length-1]).length})`:'');
  out.lowSelects=[...document.querySelectorAll('select')].filter(vis).filter(e=>e.getBoundingClientRect().height<28).map(lbl);
  shut.forEach(b=>b.click());if(drawer)$('drawerClose').click();
  return out;}

// ---------- цифры между вкладками ----------
const tab=async k=>{document.querySelector(`[data-tab="${k}"]`).click();await sleep(300);};
const svgText=s=>[...s.querySelectorAll('text')].map(t=>t.textContent).join(' ¦ ');
const m1=(re,s)=>{const m=re.exec(s||'');return m?m.slice(1).join('/'):null;};
async function numbers(){
  if(!cur())return {error:'фигура не построена'};if(!cur().PC)prodCalc();
  await tab('parts');await until(()=>$('parts').rows.length>1);
  const PV=$('partsVw').innerText;
  await tab('sum');await until(()=>cur()&&cur().N,60000);await tab('parts');await tab('sum');
  const SUM={};[...$('sum').rows].forEach(r=>{if(r.cells.length>1)SUM[r.cells[0].innerText.trim()]=r.cells[1].innerText.trim();});
  const sum=k=>{const key=Object.keys(SUM).find(x=>x.startsWith(k));return key?SUM[key]:'';};
  await tab('nest');const NEST=await until(()=>$('nestMsg').textContent.includes('рез')&&$('nestMsg').textContent);
  await tab('sheets');const GV=await until(()=>{const s=$('sheets').querySelector('svg');return s&&svgText(s);},60000)||'';
  await tab('cards');const CD=await until(()=>$('cdMsg').textContent,60000)||'';
  const S=$('stats').innerText.replace(/\s+/g,' ');
  const dims=m1(/(\d+) × (\d+) × (\d+)/,S),inp=[$('dW').value,$('dH').value,$('dD').value].join('/');
  const gvDims=dims&&dims.split('/').every(n=>GV.split(' ¦ ').includes(n))?dims:'нет на «Общем виде»: '+dims;
  const Q={
    'габарит Ш/В/Г':[['шапка',dims],['поля «Размер»',inp],['Общий вид',gvDims]],
    'масса, кг':[['шапка',m1(/≈ ([\d,]+) кг/,S)],['Итого',m1(/([\d,]+) кг/,sum('Масса'))],['Общий вид',m1(/Масса ¦ ≈ ([\d,]+) кг/,GV)]],
    'рез, м':[['Итого',m1(/([\d,]+) м/,sum('Длина реза'))],['Раскрой',m1(/рез ([\d,]+) м/,NEST)],['Общий вид',m1(/Длина реза ¦ ([\d,]+) м/,GV)]],
    'швы, м':[['шапка',m1(/([\d,]+) м швов/,S)],['Итого',m1(/([\d,]+) м/,sum('Длина швов'))],['Общий вид',m1(/Длина швов ¦ ([\d,]+) м/,GV)]],
    'деталей':[['шапка',m1(/(\d+) →/,S)||m1(/^\S+ × \S+ × \S+ \S+ \S+ (\d+)/,S)],['Итого',sum('Деталей')],['Общий вид',m1(/Деталей ¦ (\d+)/,GV)],['Детали',m1(/все детали \((\d+)\)/,PV)]],
    'позиций на резку':[['шапка',m1(/→ (\d+)/,S)],['Итого',m1(/(\d+) позици/,sum('Гибка'))],['Детали',m1(/Позиций на резку: (\d+)/,PV)],['Карты',m1(/позиций на резку: (\d+)/,CD)],
      ['Раскрой',(m=>m&&String(+m[1]+ +m[2]))(/заготовок (\d+) \+ деталей (\d+)/.exec(NEST))],['Общий вид',(m=>m&&String(+m[1]+ +m[2]))(/Заготовок со сгибами ¦ (\d+) \(и отдельных деталей (\d+)\)/.exec(GV))]],
    'заготовок со сгибами':[['шапка',m1(/\((\d+) гнут/,S)],['Итого',m1(/заготовок со сгибами (\d+)/,sum('Гибка'))],['Детали',m1(/заготовок со сгибами (\d+)/,PV)],['Раскрой',m1(/заготовок (\d+)/,NEST)],['Общий вид',m1(/Заготовок со сгибами ¦ (\d+)/,GV)]],
    'сгибов V/m':[['Итого',m1(/V (\d+).*?m (\d+)/,sum('Сгибов'))],['Общий вид',m1(/Сгибов V \/ m ¦ (\d+) \/ (\d+)/,GV)]],
    'длина сгибов, м':[['Итого «Сгибов»',m1(/([\d,]+) м/,sum('Сгибов'))],['Итого «Линии сгиба»',m1(/([\d,]+) м/,sum('Линии сгиба'))],['Раскрой',m1(/линии сгиба ([\d,]+) м/,NEST)]],
    'гравировка, м':[['Итого',m1(/([\d,]+) м/,sum('Длина гравировки'))],['Раскрой',m1(/гравировка ([\d,]+) м/,NEST)]],
    'перфорация, прорезей':[['Итого',m1(/(\d+) прорез/,sum('Перфорация'))],['Раскрой',m1(/(\d+) прорез/,NEST)],['Общий вид',m1(/PERF\) ¦ (\d+) прорез/,GV)]],
    'листов металла':[['Итого',m1(/^(\d+)/,sum('Листов'))],['Раскрой',m1(/Листов: (\d+)/,NEST)],['Общий вид',m1(/Листов \d+×\d+ ¦ (\d+)/,GV)]],
    'заполнение листа, %':[['Общий вид «заполнение»',m1(/заполнение (\d+)%/,GV)],['Раскрой «плотность»',m1(/плотность (\d+)%/,NEST)]]};
  const diff={},same={};
  for(const [k,src] of Object.entries(Q)){const have=src.filter(s=>s[1]!=null);const vals=new Set(have.map(s=>s[1]));
    (vals.size>1?diff:same)[k]=have.map(s=>s[0]+': '+s[1]).join(' · ')||'нигде не нашлось';}
  await tab('parts');
  return {diff,same};}

// ---------- зеркальные пары и почти плоские швы в таблице «Детали» ----------
function tableRows(){const R={},h=[...$('parts').rows[0].cells].map(c=>c.innerText.trim());
  [...$('parts').rows].slice(1).forEach(r=>{const c=[...r.cells].map(x=>x.innerText.replace(/\s+/g,' ').trim());if(c[0])R[c[0]]=c;});return {R,h};}
const norm=s=>s.replace(/(\d)\.1\b/g,'$1');
const normList=s=>norm(s).split(/,\s*/).map(x=>x.trim()).sort().join(', ');
// списки соседей у зеркальных деталей идут в разном порядке — сравнивать отсортированными
function mirrors(view){const {R,h}=tableRows(),out=[],flat=new Set();const wi=h.findIndex(x=>/свар|сосед/i.test(x));
  Object.keys(R).filter(k=>/\.1$/.test(k)).forEach(k=>{const a=R[k.slice(0,-2)],b=R[k];if(!a)return;
    for(let i=2;i<a.length;i++){const same=i===wi?normList(a[i])===normList(b[i]):norm(a[i])===norm(b[i]);if(!same)out.push(`${view}: ${k.slice(0,-2)} / ${k} · ${h[i]}: ${a[i]}  ≠  ${b[i]}`);}});
  if(wi>=0)Object.entries(R).forEach(([k,c])=>(c[wi].match(/[\dГ.]+ (17[89]|180)°/g)||[]).forEach(m=>{const [n,a]=norm(m).split(' ');flat.add([norm(k),n].sort().join(' ↔ ')+' '+a);}));
  return {out,flat:[...flat]};}
async function pairs(){await tab('parts');   // со скрытой вкладки innerText склеивает строки ячейки
  const was=ST.allParts;const res=[],flat=new Set();
  for(const all of [false,true]){ST.allParts=all;partsTable();await sleep(200);const m=mirrors(all?'все детали':'позиции');res.push(...m.out);m.flat.forEach(x=>flat.add(x));}
  ST.allParts=was;partsTable();return {mirrorDiff:res,flatWelds:[...flat]};}

// ---------- тексты ----------
const FORMS=[['позиция','позиции','позиций'],['деталь','детали','деталей'],['заготовка','заготовки','заготовок'],['прорезь','прорези','прорезей'],['врезка','врезки','врезок'],
  ['карта','карты','карт'],['лист','листа','листов'],['сгиб','сгиба','сгибов'],['шов','шва','швов'],['уголок','уголка','уголков'],['грань','грани','граней']];
const plural=n=>n%10===1&&n%100!==11?0:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?1:2;
async function texts(){const out={declension:[],staleTips:[],figOrder:'',defaultFig:''};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const seen=new Set();let n;
  while((n=w.nextNode())){const t=n.textContent;for(const m of t.matchAll(/(?<![\d,.])(\d+)\s+([а-яё]+)/gi)){const f=FORMS.find(F=>F.includes(m[2].toLowerCase()));if(!f)continue;
    const want=f[plural(+m[1])];if(m[2].toLowerCase()!==want){const s=`«${m[0]}» → «${m[1]} ${want}»`;if(!seen.has(s)){seen.add(s);out.declension.push(s);}}}}
  const opts=[...$('figSel').options].filter(o=>o.value);const last=Math.max(...opts.map(o=>+(/Доберман (\d+)/.exec(o.text)||[0,0])[1]));
  out.figOrder=opts.map(o=>o.text).join(' · ');
  // подсказка к списку фигур должна называть все; остальные — с примером на свежей фигуре
  if(typeof TIPS!=='undefined')Object.entries(TIPS).forEach(([k,v])=>{
    if(k==='figSel'){const miss=[];for(let i=1;i<=last;i++)if(!new RegExp(`(^|[^\\d])${i}([^\\d]|$)`).test(v))miss.push(i);if(miss.length)out.staleTips.push(`figSel: не названы Доберманы ${miss.join(', ')}`);return;}
    const ns=[...v.matchAll(/Доберман\S* (\d+)/g)].map(m=>+m[1]);if(ns.length&&Math.max(...ns)<last)out.staleTips.push(`${k}: пример на Добермане ${Math.max(...ns)}, последний — ${last}`);});
  const src=await fetch('js/ui.js?'+Date.now()).then(r=>r.text()).catch(()=>'');const d=/store\('art-fig'\):'([a-z0-9]+)'/.exec(src);
  const lastOpt=opts.find(o=>o.text==='Доберман '+last);
  out.defaultFig=d?(lastOpt&&d[1]===lastOpt.value?'ок: '+d[1]:`новый посетитель видит «${(opts.find(o=>o.value===d[1])||{}).text||d[1]}», последняя — «Доберман ${last}»`):'не нашёл в ui.js';
  return out;}

// ---------- DXF: жмёт обе кнопки, файлы перехватывает (в «Загрузки» не падают) и разбирает ----------
function dxfParse(t){const L=t.split('\r\n'),E=[];let cur=null;
  for(let i=0;i+1<L.length;i+=2){const g=L[i].trim(),v=L[i+1];
    if(g==='0'){if(v==='VERTEX'&&cur&&cur.type==='POLYLINE'){cur._v={};continue;}if(v==='SEQEND'){cur=null;continue;}cur={type:v,lay:'',P:[]};if(['POLYLINE','LINE','TEXT'].includes(v))E.push(cur);continue;}
    if(!cur)continue;if(g==='8'&&!cur._v)cur.lay=v;if(g==='70'&&!cur._v)cur.closed=(+v&1)===1;if(g==='1')cur.text=v;
    if(cur._v){if(g==='10')cur._v.x=+v;if(g==='20'){cur.P.push([cur._v.x,+v]);}}
    else if(cur.type==='LINE'){if(g==='10')cur.a=[+v];if(g==='20')cur.a.push(+v);if(g==='11')cur.b=[+v];if(g==='21')cur.b.push(+v);}
    else if(cur.type==='TEXT'){if(g==='10')cur.a=[+v];if(g==='20')cur.a.push(+v);}}
  E.forEach(e=>delete e._v);return E;}
const dSeg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,k=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-dx*k,p[1]-a[1]-dy*k);};
const inPoly=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const dEdge=(p,P)=>Math.min(...P.map((a,i)=>dSeg(p,a,P[(i+1)%P.length])));
const out=(p,P)=>inPoly(p,P)?0:dEdge(p,P);   // насколько точка за контуром
const crossS=(a,b,c,d)=>{const o=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]));return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;};
const selfX=P=>{const n=P.length;for(let i=0;i<n;i++)for(let j=i+2;j<n;j++)if(!(i===0&&j===n-1)&&crossS(P[i],P[(i+1)%n],P[j],P[(j+1)%n]))return true;return false;};
const box=P=>{const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
const polyGap=(A,B)=>{let m=Infinity;for(let i=0;i<A.length;i++){const a=A[i],a2=A[(i+1)%A.length];for(let j=0;j<B.length;j++){const b=B[j],b2=B[(j+1)%B.length];
  if(crossS(a,a2,b,b2))return 0;m=Math.min(m,dSeg(a,b,b2),dSeg(a2,b,b2),dSeg(b,a,a2),dSeg(b2,a,a2));}}return inPoly(A[0],B)||inPoly(B[0],A)?0:m;};
const r1=v=>Math.round(v*100)/100;
function dxfCheck(name,t,nest,nos){const E=dxfParse(t),f={name,kb:Math.round(t.length/1024),problems:[]},bad=s=>f.problems.push(s);
  if(!/\r\n0\r\nEOF\r\n$/.test(t))bad('нет EOF в конце');if(/NaN|undefined|Infinity/.test(t))bad('в файле NaN / undefined');
  const C=E.map((e,i)=>({e,i})).filter(o=>o.e.type==='POLYLINE'&&o.e.lay==='CUT');f.cut=C.length;
  C.forEach(({e},k)=>{const P=e.P,id=nos&&nos.length===C.length?'деталь '+nos[k]:'CUT №'+(k+1);if(!e.closed)bad(id+' не замкнут');if(P.length<3)bad(id+' меньше 3 точек');
    P.forEach((p,i)=>{const q=P[(i+1)%P.length];if(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-3)bad(id+': точка '+(i+1)+' повторяется (нулевой отрезок)');});
    if(selfX(P))bad(id+': контур пересекает сам себя');});
  // метки (ENGRAVE, BEND_*, PERF) идут перед CUT своей детали — по этому порядку и привязываем; лежит внутри другой детали — порядок сбит
  const own={},over={},perf=[];let order=0;
  E.forEach((e,i)=>{if(e.type!=='LINE'||e.lay==='SHEET')return;const best=C.find(c=>c.i>i);if(!best){order++;return;}const mid=[(e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2];
    if(out(mid,best.e.P)>0.5&&C.some(c=>c!==best&&inPoly(mid,c.e.P)))order++;own[e.lay]=(own[e.lay]||0)+1;
    const d=Math.max(out(e.a,best.e.P),out(e.b,best.e.P));if(d>0.05){over[e.lay]=over[e.lay]||{n:0,max:0};over[e.lay].n++;over[e.lay].max=Math.max(over[e.lay].max,d);}
    if(e.lay==='PERF'){const m=Math.min(dEdge(e.a,best.e.P),dEdge(e.b,best.e.P));if(m<3)perf.push(r1(m));}});
  f.marks=own;if(order)bad(order+' меток стоят не перед CUT своей детали');
  Object.entries(over).forEach(([l,o])=>bad(`${l}: ${o.n} линий заходят за контур, до ${r1(o.max)} мм`));
  if(perf.length)bad(`PERF: ${perf.length} прорезей ближе 3 мм к кромке, от ${Math.min(...perf)} мм`);
  const N2=(()=>{try{return DXF_N2;}catch(e){return null;}})(),tig=(()=>{try{return weldOf()==='tig';}catch(e){return false;}})();
  const n2=E.filter(e=>e.type==='TEXT'&&N2&&e.text===N2);
  if(tig&&(!n2.length||n2.some(e=>e.lay!=='SHEET')||!/_N2_/.test(name)))bad('TIG: нет надписи N2 на слое SHEET или «_N2» в имени');if(!tig&&(n2.length||/_N2_/.test(name)))bad('не TIG, а N2 есть');
  if(nest){const S=E.filter(e=>e.type==='POLYLINE'&&e.lay==='SHEET').map(e=>box(e.P)),gap=(cur()&&cur().N&&cur().N.gap)||ST.ngap;f.sheets=S.length;let edge=Infinity,mg=Infinity;
    const on=S.map(()=>[]);C.forEach(c=>{const b=box(c.e.P),s=S.findIndex(q=>b[0]>=q[0]&&b[1]>=q[1]&&b[2]<=q[2]&&b[3]<=q[3]);if(s<0){bad('CUT за пределами листа');return;}on[s].push({P:c.e.P,b});
      edge=Math.min(edge,b[0]-S[s][0],b[1]-S[s][1],S[s][2]-b[2],S[s][3]-b[3]);});
    on.forEach(L=>L.forEach((A,i)=>L.slice(i+1).forEach(B=>{if(A.b[0]-gap>B.b[2]||B.b[0]-gap>A.b[2]||A.b[1]-gap>B.b[3]||B.b[1]-gap>A.b[3])return;mg=Math.min(mg,polyGap(A.P,B.P));})));
    f.minGap=r1(mg);f.minEdge=r1(edge);if(mg<gap-0.05)bad(`детали ближе зазора: ${r1(mg)} < ${gap} мм`);if(edge<10-0.05)bad(`до края листа ${r1(edge)} < 10 мм`);}
  return f;}
async function dxf(){if(!cur())return {error:'фигура не построена'};if(!cur().PC)prodCalc();
  const got=[],orig=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){got.push(fetch(this.href).then(r=>r.text()).then(t=>({name:this.download,t})));return;}return orig.call(this);};
  try{$('bDxfNest').click();await until(()=>got.length>=1,90000);$('bDxfParts').click();await until(()=>got.length>=2,10000);}finally{HTMLAnchorElement.prototype.click=orig;}
  const F=await Promise.all(got);if(F.length<2)return {error:'файлы не скачались: '+F.map(f=>f.name).join(', ')};
  // номера деталей — в том же порядке, что CUT в файле: раскрой — по листам, детали — позиции, потом уголки
  const tpl=(cur().TPL||[]).map(o=>{try{return tplNo(o.a);}catch(e){return 'уголок';}}),NOS={raskroy:cur().N?cur().N.sheets.flatMap(s=>s.items.map(o=>o.no)):null,detali:cur().PC.filter(o=>!o.bad).map(o=>o.no).concat(tpl)};
  const R=F.map(f=>{const k=/raskroy/.test(f.name)?'raskroy':'detali',r=dxfCheck(f.name,f.t,k==='raskroy',NOS[k]);if(NOS[k]&&r.cut!==NOS[k].length)r.problems.push(`CUT ${r.cut}, а позиций на резку ${NOS[k].length}`);return r;});
  return R;}

export default async function(o={}){const t0=performance.now(),keep=document.querySelector('.tabbar [aria-selected="true"]');const r={};
  if(o.dxf){r.dxf=await dxf();r.sec=Math.round((performance.now()-t0)/100)/10;return r;}
  if(o.layout!==false)r.layout=await layout();
  if(o.numbers!==false){r.numbers=await numbers();Object.assign(r,await pairs());r.texts=await texts();}
  if(keep)keep.click();r.sec=Math.round((performance.now()-t0)/100)/10;return r;}

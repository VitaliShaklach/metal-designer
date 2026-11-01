/* ---------- раскрой: листовые детали на лист металла ----------
   Детали — те же, что уходят в DXF (laserParts + partMM), в мм. Разная толщина — разные листы: 5 мм — основной, 3 / 15 — свои.
   Раскладка по внешнему контуру; отверстия и внутренние контуры только рисуются. Лист — длинной стороной по горизонтали, y вверх, как в DXF.
   Раскладка — копия из art/js/prod.js (area2, ptSegD, inPoly, segX, polyGap, polyDist, nestOrient, nestGen): общего кода у разделов нет.
   Отличия от art (помечены «мангал:»): без зеркала, клетка 5 мм, клетка ровно на ползазора свободна; для скорости — nearPoly, polyClose и шаги на подготовке. */
const area2=P=>{let a=0;P.forEach((p,i)=>{const q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];});return a/2;};
// ---------- раскладка по форме ----------
// Лист — сетка клеток cell мм. Каждая деталь пробуется во всех положениях «сторона вдоль листа»;
// ставим туда, где правый край раскладки получается ближе всего к началу листа — детали заполняют пустоты между собой.
// Занятость — клетки, которых касается деталь; проверка — та же деталь, расширенная на зазор. W — длинная сторона листа.
function ptSegD(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function inPoly(p,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function segX(a,b,c,d){const o=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]));return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;}
function polyGap(A,B){let d=Infinity;for(let i=0;i<A.length;i++){const a=A[i],a2=A[(i+1)%A.length];for(let j=0;j<B.length;j++){const b=B[j],b2=B[(j+1)%B.length];if(segX(a,a2,b,b2))return 0;d=Math.min(d,ptSegD(a,b,b2),ptSegD(b,a,a2));}}if(inPoly(A[0],B)||inPoly(B[0],A))return 0;return d;}
// мангал: есть ли сторона контура ближе d к точке — то же, что polyDist(P)(p) < d, но без Math.hypot и с ранним выходом (сетка детали в разы быстрее)
function nearPoly(P,p,d){const d2=d*d;for(let i=0,n=P.length;i<n;i++){const a=P[i],b=P[i+1<n?i+1:0],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)),ex=p[0]-a[0]-t*dx,ey=p[1]-a[1]-t*dy;if(ex*ex+ey*ey<d2)return true;}return false;}
// мангал: polyGap(A,B) < g — тот же ответ, но далёкие пары сторон отсеиваются по габариту и выход на первой близкой (боковины жаровни — 140 × 140 сторон)
function polyClose(A,B,g){for(let i=0;i<A.length;i++){const a=A[i],a2=A[(i+1)%A.length],x0=Math.min(a[0],a2[0])-g,x1=Math.max(a[0],a2[0])+g,y0=Math.min(a[1],a2[1])-g,y1=Math.max(a[1],a2[1])+g;
    for(let j=0;j<B.length;j++){const b=B[j],b2=B[(j+1)%B.length];if(Math.max(b[0],b2[0])<x0||Math.min(b[0],b2[0])>x1||Math.max(b[1],b2[1])<y0||Math.min(b[1],b2[1])>y1)continue;
      if(segX(a,a2,b,b2)||ptSegD(a,b,b2)<g||ptSegD(b,a,a2)<g)return true;}}
  return inPoly(A[0],B)||inPoly(B[0],A);}
function polyDist(P){return p=>{let d=Infinity;P.forEach((a,i)=>{d=Math.min(d,ptSegD(p,a,P[(i+1)%P.length]));});return d;};}
function nestOrient(P,cell,r,flips=[false]){const out=[],seen=new Set();
  flips.forEach(flip=>{const Q0=flip?P.map(p=>[-p[0],p[1]]):P,seenA=new Set();Q0.forEach((a,i)=>{const b=Q0[(i+1)%Q0.length];[0,Math.PI].forEach(add=>{
    const ang=-Math.atan2(b[1]-a[1],b[0]-a[0])+add,c=Math.cos(ang),s=Math.sin(ang);
    const ak=Math.round(ang*1e9);if(seenA.has(ak))return;seenA.add(ak);   // мангал: этот угол уже был — положение то же (у боковины 136 сторон, а углов 4)
    let Q=Q0.map(p=>[c*p[0]-s*p[1],s*p[0]+c*p[1]]);
    const mx=Math.min(...Q.map(q=>q[0])),my=Math.min(...Q.map(q=>q[1]));Q=Q.map(q=>[q[0]-mx,q[1]-my]);
    const key=Q.map(q=>Math.round(q[0])+','+Math.round(q[1])).sort().join(';');if(seen.has(key))return;seen.add(key);
    // клетки, чьи центры внутри детали, раздутой на ползазора (r — ползазора, мм); точный зазор проверяется отдельно
    // мангал: клетка ровно на ползазора не занята (< r, в art ≤ r) — иначе при зазоре, кратном клетке (5 мм), она занята у обеих соседних деталей и они отходят на клетку дальше
    // и клетка дальше ползазора от габарита детали — сразу свободна: до контура ещё дальше (у боковин жаровни 140 точек — без этого секунда на деталь)
    const o=Math.ceil(r/cell)+1,qw=Math.max(...Q.map(q=>q[0])),qh=Math.max(...Q.map(q=>q[1])),w=Math.ceil(qw/cell)+2*o+1,h=Math.ceil(qh/cell)+2*o+1,core=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=[(x-o+.5)*cell,(y-o+.5)*cell],bd=Math.hypot(Math.max(0,-p[0],p[0]-qw),Math.max(0,-p[1],p[1]-qh));
      if(bd<r-1e-6&&(inPoly(p,Q)||nearPoly(Q,p,r-1e-6)))core[y*w+x]=1;}
    const rows=m=>{const R=[];for(let y=0;y<h;y++){let x=0;const iv=[];while(x<w){if(m[y*w+x]){const s0=x;while(x<w&&m[y*w+x])x++;iv.push([s0,x-1]);}else x++;}R.push(iv);}return R;};
    const cr=rows(core);out.push({Q,w,h,o,core:cr,dil:cr,flip,tr:{f:flip,c,s,x:-mx,y:-my}});});});});
  return out;}
// мангал: деталь только поворачивается (flips=[false]) — на листе она такая же, как в DXF; клетка 5 мм (в art — 2,5), зазор всё равно точный (polyGap)
function* nestGen(items,W,H,gap,margin,cell=5,mode=2){const r=gap/2,GW=Math.floor((W-2*margin)/cell),GH=Math.floor((H-2*margin)/cell);
  // мангал: сетки деталей — по одной за шаг (yield), чтобы страница не замирала на подготовке
  const it=[];for(const o of items){it.push({id:o.id,no:o.no,area:Math.abs(area2(o.pts)),or:nestOrient(o.pts,cell,r,[false])});yield {done:0,of:items.length};}
  it.sort((a,b)=>mode===2?Math.max(...b.or.map(o=>o.w))-Math.max(...a.or.map(o=>o.w)):b.area-a.area);
  const sheets=[],too=[];
  const newSheet=()=>{const sh={items:[],occ:new Uint8Array(GW*GH),pre:new Int32Array((GW+1)*GH),len:0};sheets.push(sh);return sh;};
  const free=(sh,R,x,y)=>{for(let ry=0;ry<R.length;ry++){const iv=R[ry];if(!iv.length)continue;const base=(y+ry)*(GW+1);for(const [a,b] of iv)if(sh.pre[base+x+b+1]-sh.pre[base+x+a])return false;}return true;};
  const gapOK=(sh,o,x,y)=>{const ox=margin+(x+o.o)*cell,oy=margin+(y+o.o)*cell,P=o.Q.map(q=>[q[0]+ox,q[1]+oy]),bx=[Math.min(...P.map(p=>p[0]))-gap,Math.min(...P.map(p=>p[1]))-gap,Math.max(...P.map(p=>p[0]))+gap,Math.max(...P.map(p=>p[1]))+gap];
    if(bx[0]<margin-.01||bx[1]<margin-.01||bx[2]>W-margin+gap+.01||bx[3]>H-margin+gap+.01)return false;
    for(const it of sh.items){const b=it.bb;if(b[0]>bx[2]||b[2]<bx[0]||b[1]>bx[3]||b[3]<bx[1])continue;if(polyClose(P,it.pts,gap))return false;}return true;};
  const fit=(sh,o,limit)=>{for(let x=0;x+o.w<=GW;x++){if(x+o.w>=limit)return null;for(let y=0;y+o.h<=GH;y++)if(free(sh,o.dil,x,y)&&gapOK(sh,o,x,y))return {x,y};}return null;};
  const place=(sh,o,x,y)=>{o.core.forEach((iv,ry)=>{const Y=y+ry;if(Y>=GH)return;iv.forEach(([a,b])=>{for(let X=x+a;X<=x+b&&X<GW;X++)sh.occ[Y*GW+X]=1;});
      const base=Y*(GW+1);let acc=0;for(let X=0;X<GW;X++){sh.pre[base+X]=acc;acc+=sh.occ[Y*GW+X];}sh.pre[base+GW]=acc;});};
  for(let pi=0;pi<it.length;pi++){const p=it[pi];let done=false;yield {done:pi,of:it.length};
    for(const sh of sheets.concat([null])){const S=sh||newSheet();let best=null;
      p.or.forEach(o=>{if(o.w>GW||o.h>GH)return;const f=fit(S,o,best?(mode?best.x+1+o.w:best.score):Infinity);if(f){const score=mode?f.x*1e4+f.y:f.x+o.w;if(!best||score<best.score||score===best.score&&f.y<best.y)best={o,...f,score,right:f.x+o.w};}});
      if(best){place(S,best.o,best.x,best.y);const ox=margin+(best.x+best.o.o)*cell,oy=margin+(best.y+best.o.o)*cell;
        const pts=best.o.Q.map(q=>[q[0]+ox,q[1]+oy]);const t=best.o.tr;S.items.push({id:p.id,no:p.no,flip:best.o.flip,tr:{...t,x:t.x+ox,y:t.y+oy},area:p.area,x:0,y:0,pts,bb:[Math.min(...pts.map(q=>q[0])),Math.min(...pts.map(q=>q[1])),Math.max(...pts.map(q=>q[0])),Math.max(...pts.map(q=>q[1]))]});S.len=Math.max(S.len,margin+best.right*cell);done=true;break;}
      if(!sh){sheets.pop();break;}}
    if(!done)too.push({id:p.id,no:p.no});}
  sheets.forEach(s=>{const a=s.items.reduce((q,o)=>q+o.area,0);s.used=a/(W*H);s.dense=a/((s.len-margin)*(H-2*margin)||1);delete s.occ;delete s.pre;});
  return {sheets,too,W,H,gap,used:sheets.length?sheets.reduce((a,s)=>a+s.used,0)/sheets.length:0};}

/* ---------- детали для раскладки ---------- */
const NEST_SHEETS={'1000x2000':[2000,1000],'1250x2500':[2500,1250],'1500x3000':[3000,1500]},NEST_EDGE=10,NEST_CELL=5;   // [длина, ширина]; от края 10 мм — как в art
// контур → точки без повтора последней и без двойных подряд; меньше 3 точек, не числа или нулевая площадь — null
function nestLoop(l){if(!Array.isArray(l))return null;const P=[],same=(a,b)=>Math.abs(a[0]-b[0])<1e-6&&Math.abs(a[1]-b[1])<1e-6;
  for(const p of l){if(!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1]))return null;if(!P.length||!same(P[P.length-1],p))P.push([p[0],p[1]]);}
  while(P.length>1&&same(P[0],P[P.length-1]))P.pop();
  return P.length>=3&&Math.abs(area2(P))>1?P:null;}
// значения полей: зазор 1…50 мм с шагом 0,5; лист — из списка; cgr — колосник мангала на листе (галочка)
const NEST_CGR=p=>p.pt==='cgr1'||p.pt==='cgr2';
function nestOpts(){const gi=document.getElementById('nGap'),si=document.getElementById('nSheet'),ci=document.getElementById('nCgr');
  let gap=parseFloat(String(gi&&gi.value!=null?gi.value:'').replace(',','.'));if(!Number.isFinite(gap))gap=5;gap=Math.min(50,Math.max(1,Math.round(gap*2)/2));
  const v=si&&typeof si.value==='string'?si.value:'',sk=NEST_SHEETS[v]?v:'1250x2500',[W,H]=NEST_SHEETS[sk];return {gap,sk,W,H,cgr:!(ci&&ci.checked===false)};}
// задание: группы по толщине (5 мм первой), в каждой — типы деталей (номер, контур, кол-во) и штуки для раскладки; key — для кэша.
// over — поменять поля (smoke: {cgr:false}); hasCgr — есть ли колосник мангала (показать галочку)
function nestJob(over){const o=Object.assign(nestOpts(),over),all=laserParts(),hasCgr=all.some(NEST_CGR),L=o.cgr?all:all.filter(p=>!NEST_CGR(p)),ths=[...new Set(L.map(p=>p.mm))].sort((a,b)=>(b===5)-(a===5)||a-b),groups=[];let no=0;
  ths.forEach(mm=>{const G={mm,types:[],items:[]};
    L.filter(p=>p.mm===mm&&p.q>0).forEach(p=>{let m=null;try{m=partMM(p);}catch(e){}const P=m&&nestLoop(m.loops[0]);if(!P)return;   // пустой или вырожденный контур — пропускаем
      const ty={no:++no,p,m,P,q:p.q};G.types.push(ty);for(let j=0;j<p.q;j++)G.items.push({id:G.items.length,no:ty.no,pts:P,ty});});
    if(G.items.length)groups.push(G);});
  const key=JSON.stringify([o.W,o.H,o.gap,groups.map(G=>[G.mm,G.types.map(ty=>[ty.no,ty.q,ty.P.map(q=>q.map(v=>Math.round(v*10)))])])]);
  return {...o,groups,key,hasCgr};}

/* ---------- рисунок листа (SVG, мм) ---------- */
const n1=v=>Math.round(v*10)/10;
// где писать номер: точка внутри детали дальше всего от краёв и отверстий (сетка 20 × 20), при равенстве — ближе к центру.
// Отверстия часто (колосник, дно печи) и места между ними мало — пишем поверх отверстий, у цифр подложка (CSS)
function nestLabelPt(P,holes,circ){const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),cx=(x0+x1)/2,cy=(y0+y1)/2;
  const dO=polyDist(P),dH=holes.map(h=>[h,polyDist(h)]);
  const pick=withHoles=>{let best=null;for(let i=1;i<20;i++)for(let j=1;j<20;j++){const p=[x0+(x1-x0)*i/20,y0+(y1-y0)*j/20];if(!inPoly(p,P))continue;let d=dO(p);
      if(withHoles){dH.forEach(([h,f])=>{d=Math.min(d,inPoly(p,h)?-1:f(p));});circ.forEach(([x,y,r])=>{d=Math.min(d,Math.hypot(p[0]-x,p[1]-y)-r);});}
      const s=Math.min(d,60)-.01*Math.hypot(p[0]-cx,p[1]-cy);if(d>0&&(!best||s>best.s))best={p,d,s};}return best;};
  const a=pick(false)||{p:[cx,cy],d:Math.min(x1-x0,y1-y0)/2},b=holes.length||circ.length?pick(true):null;
  return b&&b.d>=Math.min(25,a.d*.6)?b:a;}
// лист: рамка и размеры, детали — полный контур с отверстиями (как в DXF), гибы пунктиром, номер; big — широкий экран (шрифт мельче, рисунок крупнее)
function nestSvg(N,G,sh,isOn,big){const W=N.W,H=N.H,fk=big?1:2,fs=Math.round(H*.035*fk),pd=Math.round(fs*1.6),Y=y=>H-y,pt=q=>n1(q[0])+','+n1(Y(q[1]));
  let g=`<rect class="sh" x="0" y="0" width="${W}" height="${H}"/><text class="dim" x="${W/2}" y="${-fs*.5}" font-size="${fs}" text-anchor="middle">${W}</text><text class="dim" transform="translate(${-fs*.5},${H/2}) rotate(-90)" font-size="${fs}" text-anchor="middle">${H}</text>`;
  sh.items.forEach(it=>{const ty=G.items[it.id].ty,m=ty.m,tr=it.tr,T=q=>[tr.c*q[0]-tr.s*q[1]+tr.x,tr.s*q[0]+tr.c*q[1]+tr.y];
    const holes=m.loops.slice(1).map(nestLoop).filter(Boolean).map(l=>l.map(T)),circ=m.circles.map(([x,y,r])=>[...T([x,y]),r]);
    let d=[it.pts,...holes].map(l=>'M'+l.map(pt).join('L')+'Z').join('');
    circ.forEach(([x,y,r])=>{d+=`M${n1(x-r)},${n1(Y(y))}a${r},${r} 0 1,0 ${n1(2*r)},0a${r},${r} 0 1,0 ${n1(-2*r)},0Z`;});
    const bd=m.bends.map(b=>{const [a,c]=b.map(T);return `<line class="bd" x1="${n1(a[0])}" y1="${n1(Y(a[1]))}" x2="${n1(c[0])}" y2="${n1(Y(c[1]))}"/>`;}).join('');
    // номер не мельче 0,8 подписи листа — у узких полос (задвижка 38 мм) он выходит за деталь, зато читается
    const L=nestLabelPt(it.pts,holes,circ),fz=n1(Math.max(fs*.8,Math.min(1.3*L.d,Math.max(24,Math.min(60,L.d))*fk)));
    g+=`<g class="np${isOn(ty)?' on':''}"><title>${ty.no} — ${ty.p.name}</title><path d="${d}"/>${bd}<text x="${n1(L.p[0])}" y="${n1(Y(L.p[1]))}" dy=".36em" font-size="${fz}" text-anchor="middle">${ty.no}</text></g>`;});
  return `<svg class="nestsv" viewBox="${-pd} ${-pd} ${W+pd+10} ${H+pd+10}" role="img" aria-label="Лист ${G.mm} мм, ${H} × ${W}, деталей ${sh.items.length}">${g}</svg>`;}
// DXF всего листа: детали стоят как на рисунке (поворот и сдвиг tr), рамка листа — слой SHEET
function nestDxf(N,G,sh){const f=v=>Math.round(v*100)/100,m={sheet:[[0,0],[N.W,0],[N.W,N.H],[0,N.H],[0,0]],loops:[],circles:[],bends:[]};
  sh.items.forEach(it=>{const d=G.items[it.id].ty.m,tr=it.tr,T=q=>[f(tr.c*q[0]-tr.s*q[1]+tr.x),f(tr.s*q[0]+tr.c*q[1]+tr.y)];
    d.loops.forEach(l=>m.loops.push(l.map(T)));d.circles.forEach(([x,y,r])=>m.circles.push([...T([x,y]),r]));d.bends.forEach(b=>m.bends.push(b.map(T)));});
  return dxfText(m);}
const nestFile=(N,G,R,si)=>`list_${G.mm}mm_${N.sk}${R.sheets.length>1?'_'+(si+1):''}.dxf`;
// вкладка: на каждую толщину (5 → 3 → 15 мм) — заголовок, над листом кнопки «DXF листа» и «Детали листа (ZIP)», лист, под ним детали этого листа (как была таблица «Лазер · DXF»);
// № в таблице — тот же, что на листе; выбранное на модели подсвечено
function nestDraw(N,res){const box=document.getElementById('nestBox');if(!box)return;box.classList.remove('busy');NST.cur={N,res};
  const isOn=ty=>!!S.sel.el&&inSel(PDF_ELEM(ty.p.pt),ty.p.pt),wide=!(box.clientWidth>0&&box.clientWidth<600);   // узкий экран (телефон): шрифт на листах крупнее — иначе номера ~4 px
  box.innerHTML=N.groups.length?N.groups.map((G,gi)=>{const R=res[gi]||{sheets:[],too:[]},main=G.mm===5,ns=R.sheets.length;
    let h=`<section class="nblock${main?' main':''}"><h3>Лист ${G.mm} мм</h3><div class="nbtns">`;
    R.sheets.forEach((sh,si)=>{h+=`<button class="dxfbtn" data-act="sheet" data-g="${gi}" data-s="${si}">DXF листа${ns>1?' '+(si+1):''}</button>`;});
    h+=`<button class="dxfbtn" data-act="parts" data-g="${gi}">Детали листа (ZIP)</button></div>`;
    R.sheets.forEach((sh,si)=>{h+=`<figure class="nsheet"><figcaption>${ns>1?`Лист ${si+1} из ${ns} · `:''}${N.H} × ${N.W} · деталей ${sh.items.length} · занято ${Math.round(sh.used*100)} % · зазор ${fmt(N.gap,1)} мм, от края ${NEST_EDGE} мм</figcaption>${nestSvg(N,G,sh,isOn,wide)}</figure>`;});
    if(R.too.length){const c={};R.too.forEach(o=>c[o.no]=(c[o.no]||0)+1);
      h+=`<p class="nwarn">Не поместилось: ${Object.keys(c).map(no=>{const ty=G.types.find(t=>t.no===+no);return `${no} ${ty.p.name}${c[no]>1?` × ${c[no]}`:''}`;}).join(', ')}</p>`;}
    let tc=0,tp=0,tq=0,t='<thead><tr><th class="r">№</th><th>Деталь</th><th>Эскиз</th><th class="r">Кол-во</th><th>Габарит, мм</th><th class="r">Рез, м</th><th class="r">Врезок</th><th></th></tr></thead><tbody>';
    G.types.forEach((ty,ti)=>{const p=ty.p,m=ty.m;tc+=m.cut*ty.q;tp+=m.pierce*ty.q;tq+=ty.q;
      t+=`<tr${isOn(ty)?' class="on"':''}><td class="n r">${ty.no}</td><td>${p.name}${p.note?`<small>${p.note}</small>`:''}<small class="fn">${dxfName(p)}</small></td><td>${dxfSketch(m)}</td><td class="n r">${ty.q}</td><td class="n">${fmt(m.w,1)} × ${fmt(m.h,1)}</td><td class="n r">${fmt(m.cut/1000,2)}</td><td class="n r">${m.pierce}</td><td class="r"><button class="dxfbtn" data-act="part" data-g="${gi}" data-t="${ti}">DXF</button></td></tr>`;});
    t+=`<tr class="tot"><td colspan="5">Итого по листу ${G.mm} мм: ${tq} шт, рез и врезки — с учётом количества</td><td class="n r">${fmt(tc/1000,2)}</td><td class="n r">${tp}</td><td></td></tr></tbody>`;
    return h+`<div class="tbl"><table class="ntbl">${t}</table></div></section>`;}).join(''):'<p class="tabnote">Листовых деталей нет</p>';}
// «Скачать всё (ZIP)»: DXF каждого листа и каждой детали — то, что на вкладке
function saveAll(){if(NST.run||!NST.cur)return;const {N,res}=NST.cur,F=[];
  N.groups.forEach((G,gi)=>{const R=res[gi];if(R)R.sheets.forEach((sh,si)=>F.push([nestFile(N,G,R,si),nestDxf(N,G,sh)]));G.types.forEach(ty=>F.push([dxfName(ty.p),dxfText(ty.m)]));});
  if(F.length)saveOut(`${MODE_FILE()}_raskroy_${N.sk}.zip`,zipFiles(F));}
// кнопки над листом и в таблице; пока идёт раскладка — не качаем (лист ещё старый)
function nestClick(e){const b=e.target.closest&&e.target.closest('button[data-act]');if(!b||NST.run||!NST.cur)return;
  const {N,res}=NST.cur,G=N.groups[+b.dataset.g],R=res[+b.dataset.g];if(!G)return;
  if(b.dataset.act==='sheet'&&R&&R.sheets[+b.dataset.s])saveDxf(nestFile(N,G,R,+b.dataset.s),nestDxf(N,G,R.sheets[+b.dataset.s]));
  else if(b.dataset.act==='parts')saveOut(`${MODE_FILE()}_${G.mm}mm_${G.types.length}_detaley.zip`,zipFiles(G.types.map(ty=>[dxfName(ty.p),dxfText(ty.m)])));
  else if(b.dataset.act==='part'&&G.types[+b.dataset.t]){const ty=G.types[+b.dataset.t];saveDxf(dxfName(ty.p),dxfText(ty.m));}}

/* ---------- когда считать: только при открытой вкладке, через 0,3 с после правки; кусками по ~60 мс, кэш по ключу ---------- */
const NST={key:'',res:null,run:null,t:0,init:false,cur:null};   // cur — что сейчас нарисовано ({N,res}): для кнопок скачивания
const nestMsg=t=>{const m=document.getElementById('nestMsg');if(m)m.textContent=t;};
// поля «Между деталями» и «Лист»: значения из памяти браузера (store — в ui.js, к первому показу вкладки он уже есть)
function nestInit(){if(NST.init)return;NST.init=true;const gi=document.getElementById('nGap'),si=document.getElementById('nSheet');if(!gi||!si)return;
  const g=store('md-ngap'),s=store('md-sheet'),c=store('md-ncgr'),ci=document.getElementById('nCgr');if(Number.isFinite(+g)&&g!==null)gi.value=g;if(s&&NEST_SHEETS[s])si.value=s;if(ci&&typeof c==='boolean')ci.checked=c;
  const ch=()=>{const o=nestOpts();store('md-ngap',o.gap);store('md-sheet',o.sk);store('md-ncgr',o.cgr);nestUI();};
  gi.addEventListener('input',ch);gi.addEventListener('change',()=>{gi.value=nestOpts().gap;ch();});si.addEventListener('change',ch);if(ci)ci.addEventListener('change',ch);
  const box=document.getElementById('nestBox'),all=document.getElementById('dxfAll');if(box)box.addEventListener('click',nestClick);if(all)all.addEventListener('click',saveAll);}
function nestUI(now){clearTimeout(NST.t);if(!now){NST.t=setTimeout(()=>nestUI(true),300);return;}
  const pane=document.getElementById('tab-cut');if(!pane||pane.hidden!==false)return;
  nestInit();const N=nestJob(),cb=document.getElementById('nCgrBox');if(cb)cb.hidden=!N.hasCgr;   // галочка колосника — только когда он есть (мангал, «Колосниковая решётка»)
  if(NST.res&&NST.key===N.key){NST.run=null;nestMsg('');nestDraw(N,NST.res);return;}   // уже посчитано (лишний счёт, если шёл, — останавливаем)
  if(NST.run&&NST.run.key===N.key)return;   // уже считается
  const run={key:N.key,res:[],gi:0,g:null,done:0},all=N.groups.reduce((a,G)=>a+G.items.length,0);NST.run=run;
  const box=document.getElementById('nestBox');if(box){if(box.querySelector('svg'))box.classList.add('busy');else box.innerHTML='<p class="tabnote">Раскладываю…</p>';}
  nestMsg('Раскладываю…');
  const step=()=>{if(NST.run!==run)return;const t0=performance.now();
    while(run.gi<N.groups.length){const G=N.groups[run.gi];if(!run.g)run.g=nestGen(G.items,N.W,N.H,N.gap,NEST_EDGE,NEST_CELL);const v=run.g.next();
      if(v.done){run.res.push(v.value);run.g=null;run.gi++;}else run.done=N.groups.slice(0,run.gi).reduce((a,G)=>a+G.items.length,0)+v.value.done;
      if(performance.now()-t0>60)break;}
    if(run.gi<N.groups.length){nestMsg(`Раскладываю… ${run.done} из ${all}`);setTimeout(step,0);return;}
    NST.key=run.key;NST.res=run.res;NST.run=null;nestMsg('');nestUI(true);};   // нарисовать; если детали сменились, пока считали, — посчитает заново
  setTimeout(step,0);}

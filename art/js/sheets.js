/* ---------- Листы А3 для производства фигуры ----------
   SVG в мм бумаги (420×297): общий вид, порядок сборки, детали (развёртки), спецификация, раскрой листа.
   Помощники — по образцу karkas/js/sheets.js. */
const SH_EMAIL='vashaklach@gmail.com',SCALES=[1,2,2.5,4,5,10,15,20,25,40,50,75,100];
const r2=x=>Math.round(x*100)/100;
const shEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const pickScale=(need,avail)=>SCALES.find(n=>need.every((v,i)=>v/n<=avail[i]))||SCALES[SCALES.length-1];
const scaleTxt=n=>'1:'+String(n).replace('.',',');
// виды: r — вправо на листе, up — вверх, d — к зрителю. Вид слева — справа от главного, вид сверху — под ним
const VIEWS={front:{r:[1,0,0],up:[0,1,0],d:[0,0,1]},left:{r:[0,0,1],up:[0,1,0],d:[-1,0,0]},top:{r:[1,0,0],up:[0,0,-1],d:[0,1,0]}};
(()=>{const d=V3.norm([1,.75,1.5]),r=V3.norm(V3.cross([0,1,0],d));VIEWS.iso={r,up:V3.cross(d,r),d};})();
const prjV=(v,p)=>[V3.dot(p,v.r),-V3.dot(p,v.up)];
const arrow=(x,y,ux,uy)=>`<path class="ar" d="M${r2(x)},${r2(y)}L${r2(x-ux*2.5-uy*.6)},${r2(y-uy*2.5+ux*.6)}L${r2(x-ux*2.5+uy*.6)},${r2(y-uy*2.5-ux*.6)}Z"/>`;
function dimH(xa,ya,xb,yb,yl,t){if(xb<xa)[xa,ya,xb,yb]=[xb,yb,xa,ya];const L=xb-xa;if(L<.3)return '';const sa=yl>ya?1:-1,sb=yl>yb?1:-1;
  let s=`<path class="t" d="M${r2(xa)},${r2(ya+sa)}V${r2(yl+sa*2)}M${r2(xb)},${r2(yb+sb)}V${r2(yl+sb*2)}M${r2(xa)},${r2(yl)}H${r2(xb)}`;
  const out=L<7;s+=out?`M${r2(xa-5)},${r2(yl)}H${r2(xa)}M${r2(xb)},${r2(yl)}H${r2(xb+5)}"/>`+arrow(xa,yl,1,0)+arrow(xb,yl,-1,0):'"/>'+arrow(xa,yl,-1,0)+arrow(xb,yl,1,0);
  return s+`<text x="${r2((xa+xb)/2)}" y="${r2(yl-1)}" text-anchor="middle">${t}</text>`;}
function dimV(xa,ya,xb,yb,xl,t){if(yb<ya)[xa,ya,xb,yb]=[xb,yb,xa,ya];const L=yb-ya;if(L<.3)return '';const sa=xl>xa?1:-1,sb=xl>xb?1:-1;
  let s=`<path class="t" d="M${r2(xa+sa)},${r2(ya)}H${r2(xl+sa*2)}M${r2(xb+sb)},${r2(yb)}H${r2(xl+sb*2)}M${r2(xl)},${r2(ya)}V${r2(yb)}"/>`+arrow(xl,ya,0,-1)+arrow(xl,yb,0,1);
  return s+`<text transform="translate(${r2(xl-1)},${r2((ya+yb)/2)}) rotate(-90)" text-anchor="middle">${t}</text>`;}
function svgTable(x,y,cols,rows,rh=7){const W=cols.reduce((s,c)=>s+c.w,0),H=rh*(rows.length+1);let s=`<rect class="l" x="${x}" y="${y}" width="${W}" height="${H}"/><path class="t" d="`;
  for(let i=1;i<=rows.length;i++)s+=`M${x},${y+i*rh}H${x+W}`;let xx=x;cols.slice(0,-1).forEach(c=>{xx+=c.w;s+=`M${xx},${y}V${y+H}`;});s+='"/>';
  [cols.map(c=>c.t),...rows].forEach((r,ri)=>{let cx=x;r.forEach((v,i)=>{const c=cols[i],mx=Math.floor(c.w/1.55);let t=String(v);if(t.length>mx)t=t.slice(0,mx-1)+'…';
    s+=`<text class="td" x="${r2(ri===0?cx+c.w/2:c.r?cx+c.w-1.2:cx+1.2)}" y="${r2(y+ri*rh+rh-2)}"${ri===0?' text-anchor="middle"':c.r?' text-anchor="end"':''}>${shEsc(t)}</text>`;cx+=c.w;});});
  return s;}
// стили листа — только внутри svg.shs: иначе .no, .bv и др. действуют на всю страницу (эскизы в панели и таблице)
const SH_STYLE='<style>'+`.l{fill:none;stroke:#000;stroke-width:.35;stroke-linejoin:round}.t{fill:none;stroke:#000;stroke-width:.18}.dash{fill:none;stroke:#000;stroke-width:.15;stroke-dasharray:1.2 .8}.fr{fill:none;stroke:#000;stroke-width:.7}.eng{fill:none;stroke:#c33;stroke-width:.12}.seam{fill:none;stroke:#d01f1f;stroke-width:.8;stroke-linecap:round}.ag{fill:none;stroke:#000;stroke-width:.3;stroke-linecap:round}.engb{stroke-opacity:.45}.pw{fill:none;stroke-width:.75;stroke-linecap:round;stroke-linejoin:round}.tw{fill:#f3d27a;stroke:#8a6d1a;stroke-width:.15}.bl3{fill:none;stroke:#1f5fd0;stroke-width:.45;stroke-dasharray:1.6 .8}.bnd{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:4 1 .4 1 .4 1}.bv{stroke:#c33}.bm{stroke:#33c}.small{fill:none;stroke:#c33;stroke-width:.35}.fc{stroke:#000;stroke-width:.15;stroke-linejoin:round}.ar{fill:#000}text{font-family:"Arial Narrow",Arial,sans-serif;font-style:italic;fill:#000;font-size:3.5px}.hd{font-size:6px}.h2{font-size:4.5px}.sm,.lb{font-size:2.3px}.td{font-size:2.8px}.no{font-size:2.6px;font-style:normal;font-weight:bold}.nb{font-size:2.1px;fill:#a33}.big{font-size:5px;font-style:normal;font-weight:bold}`.replace(/([^{}]+)\{/g,(m,sel)=>sel.split(',').map(x=>'svg.shs '+x.trim()).join(',')+'{')+'</style>';
// рамка и основная надпись (только email — по просьбе автора)
// основная надпись 185 × 16, x, y — левый верхний угол; b.mass — масса куска (на карте), иначе всей фигуры
function stamp(x,y,b,o){const c=[95,30,30,30],cell=(i,row,lab,val)=>{const xx=x+c.slice(0,i).reduce((s,v)=>s+v,0),yy=y+row*8;return `<text class="lb" x="${xx+1}" y="${yy+2.6}">${lab}</text><text class="td" x="${xx+1.2}" y="${yy+6.6}">${shEsc(val)}</text>`;};
  let xs=x,v='';c.slice(0,-1).forEach(w=>{xs+=w;v+=`M${xs},${y}V${y+16}`;});const nm=ST.name||'Фигура';
  return `<rect class="fr" x="${x}" y="${y}" width="185" height="16"/><path class="t" d="M${x},${y+8}H${x+185}${v}"/>`+cell(0,0,'Изделие',nm)+cell(1,0,'Масштаб',b.scale||'—')+cell(2,0,'Масса',`≈ ${b.mass||fmt(CUR.T.mass,1)+' кг'}`)+cell(3,0,'Металл',`${ST.t} мм`)
    +cell(0,1,'email',SH_EMAIL)+cell(1,1,'Дата',o.date)+cell(2,1,'Лист',String(o.n))+cell(3,1,'Листов',String(o.N));}
function wrapSheet(b,o){const nm=ST.name||'Фигура',tb=stamp(230,276,b,o);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="shs" viewBox="0 0 420 297" width="420mm" height="297mm">${SH_STYLE}<rect width="420" height="297" fill="#fff"/><rect class="fr" x="20" y="5" width="395" height="287"/><path class="l" d="M20,17H415"/>`
    +`<text class="hd" x="25" y="13.5">${shEsc(nm)}</text><text class="h2" x="410" y="13.5" text-anchor="end">${shEsc(b.title)}</text>${b.body}${tb}<text class="sm" x="415" y="295.6" text-anchor="end">Формат А3</text></svg>`;}

/* ---------- фигура гранями: проекция, тень по нормали, номера ---------- */
function projBox(view){const b=[1e9,1e9,-1e9,-1e9];CUR.M3.V.forEach(p=>{const q=prjV(view,p);b[0]=Math.min(b[0],q[0]);b[1]=Math.min(b[1],q[1]);b[2]=Math.max(b[2],q[0]);b[3]=Math.max(b[3],q[1]);});return b;}
const grey=v=>{const c=Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0');return '#'+c+c+c;};
function facesSVG(view,k,ox,oy,o={}){const V=CUR.M3.V,L=V3.norm(V3.add(V3.add(view.d,V3.mul(view.up,.7)),V3.mul(view.r,-.4)));
  const P=(p)=>{const q=prjV(view,p);return [ox+q[0]*k,oy+q[1]*k];};let s='';const lb=[];
  CUR.R.parts.filter(p=>(!o.only||o.only(p))&&V3.dot(p.n,view.d)>.02).sort((a,b)=>V3.dot(a.c,view.d)-V3.dot(b.c,view.d)).forEach(p=>{
    const pts=p.full.map(i=>P(V[i])),sh=.5+.45*Math.max(0,V3.dot(p.n,L));const fill=o.color?o.color(p,sh):grey(.35+.6*sh);
    s+=`<polygon class="fc" fill="${fill}" points="${pts.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;
    if(o.label&&o.label(p)){const a=Math.abs(area2(pts));if(a>12)lb.push({t:String(p.no),pts,a});}});
  return s+placeLabels(lb,2.6).map(l=>`<text class="no" x="${r2(l.x)}" y="${r2(l.y+l.h*.35)}" text-anchor="middle"${l.f<1?` style="font-size:${r2(l.h)}px"`:''}>${l.t}</text>`).join('');}
// подписи без наложений (L — {t, pts, a}, fs — высота букв): большие грани — первыми; место — самая просторная точка грани,
// занято — точки вокруг неё внутри грани, потом мельче, потом рядом снаружи; некуда — без номера. cw — ширина буквы к высоте. avoid — уже занятые прямоугольники
function placeLabels(L,fs,cw=.52,avoid=[]){const box=avoid.slice(),out=[],hit=b=>box.some(c=>b[0]<c[2]&&b[2]>c[0]&&b[1]<c[3]&&b[3]>c[1]);
  L.sort((a,b)=>b.a-a.a).forEach(l=>{const ip=innerPoint(l.pts);if(!ip)return;
    for(const f of [1,.8,.65]){const h=fs*f,w=l.t.length*h*cw,st=Math.max(w,h)*.4,cand=[ip.p];for(let r=1;r<=5;r++)for(let a=0;a<8;a++)cand.push([ip.p[0]+Math.cos(a*Math.PI/4)*st*r,ip.p[1]+Math.sin(a*Math.PI/4)*st*r]);
      for(const c of cand){if(!inPoly(c,l.pts))continue;const b=[c[0]-w/2-.2,c[1]-h/2-.1,c[0]+w/2+.2,c[1]+h/2+.1];if(hit(b))continue;box.push(b);out.push({t:l.t,x:c[0],y:c[1],h,f});return;}}
    // грань узкая (видна вскользь) — рядом с ней снаружи, мельче; и там тесно — без номера: лучше, чем номера друг на друге
    const h=fs*.65,w=l.t.length*h*cw;for(let r=1;r<=4;r++)for(let a=0;a<8;a++){const c=[ip.p[0]+Math.cos(a*Math.PI/4)*w*.55*r,ip.p[1]+Math.sin(a*Math.PI/4)*h*.9*r],b=[c[0]-w/2-.2,c[1]-h/2-.1,c[0]+w/2+.2,c[1]+h/2+.1];
      if(!hit(b)){box.push(b);out.push({t:l.t,x:c[0],y:c[1],h,f:.65});return;}}});
  return out;}

/* ---------- 1. общий вид ---------- */
function sheetGeneral(){const T=CUR.T,b=meshBox(CUR.M3.V),[W,H,D]=b.size,bf=projBox(VIEWS.front),bl=projBox(VIEWS.left),bt=projBox(VIEWS.top);
  const n=pickScale([W+D,H+D],[235,215]),k=1/n,x0=48,y0=32,fx=x0-bf[0]*k,fy=y0-bf[1]*k,gap=26;
  const lx=x0+(bf[2]-bf[0])*k+gap-bl[0]*k,ly=fy,tx=fx,ty=y0+(bf[3]-bf[1])*k+gap-bt[1]*k;
  let s=facesSVG(VIEWS.front,k,fx,fy,{label:()=>1})+facesSVG(VIEWS.left,k,lx,ly)+facesSVG(VIEWS.top,k,tx,ty);
  const F=[x0,y0,x0+(bf[2]-bf[0])*k,y0+(bf[3]-bf[1])*k],Lb=[lx+bl[0]*k,ly+bl[1]*k,lx+bl[2]*k,ly+bl[3]*k],Tb=[tx+bt[0]*k,ty+bt[1]*k,tx+bt[2]*k,ty+bt[3]*k];
  s+=dimV(F[0],F[1],F[0],F[3],F[0]-10,Math.round(H))+dimH(Tb[0],Tb[3],Tb[2],Tb[3],Tb[3]+9,Math.round(W))+dimH(Lb[0],Lb[3],Lb[2],Lb[3],Lb[3]+9,Math.round(D));
  s+=`<text class="sm" x="${r2((F[0]+F[2])/2)}" y="${r2(F[1]-3)}" text-anchor="middle">Вид спереди</text><text class="sm" x="${r2((Lb[0]+Lb[2])/2)}" y="${r2(Lb[1]-3)}" text-anchor="middle">Вид слева</text><text class="sm" x="${r2((Tb[0]+Tb[2])/2)}" y="${r2(Tb[1]-3)}" text-anchor="middle">Вид сверху</text>`;
  const [sl,sw]=sheetWL(),BS=CUR.BL&&CUR.BL.length?CUR.bendSt:null,rows=[['Материал',MATN[ST.mat]],['Толщина листа',ST.t+' мм'],['Деталей',T.n],...(BS?[['Заготовок со сгибами',`${CUR.BL.length} (и отдельных деталей ${CUR.PC.length-CUR.BL.length})`],['Сгибов V / m',`${BS.V} / ${BS.m}`]]:[]),['Площадь металла',fmt(T.area/1e6,2)+' м²'],['Масса',`≈ ${fmt(T.mass,1)} кг`],
    ['Длина реза',fmt(CUR.cutLen/1000,1)+' м'],['Длина швов',fmt((T.weld-(BS?BS.len:0))/1000,1)+' м'],['Зазор шва',ST.gap+' мм'],[`Листов ${sw}×${sl}`,CUR.N.sheets.length+` (заполнение ${Math.round(CUR.N.used*100)}%)`]];
  s+=svgTable(300,22,[{t:'Параметр',w:58},{t:'Значение',w:55}],rows,6.5);
  const bi=projBox(VIEWS.iso),ih=BS?128:160,ki=Math.min(110/(bi[2]-bi[0]),(ih-10)/(bi[3]-bi[1]));s+=facesSVG(VIEWS.iso,ki,300+(113-(bi[2]-bi[0])*ki)/2-bi[0]*ki,95+(ih-(bi[3]-bi[1])*ki)/2-bi[1]*ki);   // с гибкой — ниже технические требования
  s+=`<text class="sm" x="300" y="268">Номера на гранях — номера деталей (вид спереди). Порядок сборки — следующие листы, каждый кусок — на своей карте (PDF А4).</text>`;
  // технические требования к гибке
  if(BS)s+=['Технические требования','1. V — гнуть на себя, m — от себя, глядя на сторону','    с гравировкой (внутреннюю). Число у линии — угол между','    гранями после гибки, в скобках — порядок гибки.',
    '2. Линии сгиба — в DXF на слоях BEND_V и BEND_M. Глубину','    (разметка, гравировка в несколько проходов, перфорация)','    выбирает цех. Глубокая канавка — только на V.','3. Толстый лист: пропил болгаркой — только по V и только изнутри.']
    .map((t,i)=>`<text class="${i?'sm':'h2'}" x="300" y="${r2(229+i*3.4+(i?1.2:0))}">${shEsc(t.replace(/^ +/,m=>' '.repeat(m.length)))}</text>`).join('');
  return {title:'Общий вид',scale:scaleTxt(n),body:s};}

/* ---------- 2. порядок сборки ---------- */
// вид на детали шага: с их стороны (средняя нормаль по площади + немного изометрии), откуда смотрим — словами
function stepView(ps){let n=[0,0,0];ps.forEach(p=>{n=V3.add(n,V3.mul(p.n,p.area));});const d=V3.norm(V3.add(V3.norm(n),V3.mul(VIEWS.iso.d,.5)));
  const up0=Math.abs(d[1])>.9?[0,0,d[1]>0?-1:1]:[0,1,0],r=V3.norm(V3.cross(up0,d)),w=[];
  if(d[2]>.35)w.push('спереди');if(d[0]>.35)w.push('справа');if(d[0]<-.35)w.push('слева');if(d[1]>.35)w.push('сверху');if(d[1]<-.35)w.push('снизу');
  return {r,up:V3.cross(d,r),d,txt:w.join(', ')||'сзади'};}
// рамка шага в проекции: детали шага + 30% с каждой стороны, не меньше MINW мм по месту, не больше всей фигуры
function stepFrame(view,ps,MINW=150){const b=[1e9,1e9,-1e9,-1e9],add=(B,q)=>{B[0]=Math.min(B[0],q[0]);B[1]=Math.min(B[1],q[1]);B[2]=Math.max(B[2],q[0]);B[3]=Math.max(B[3],q[1]);};
  ps.forEach(p=>p.full.forEach(i=>add(b,prjV(view,CUR.M3.V[i]))));const all=[1e9,1e9,-1e9,-1e9];CUR.M3.V.forEach(p=>add(all,prjV(view,p)));
  const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,hw=Math.max((b[2]-b[0])*.8,MINW/2),hh=Math.max((b[3]-b[1])*.8,MINW/2);
  return [Math.max(all[0],cx-hw),Math.max(all[1],cy-hh),Math.min(all[2],cx+hw),Math.min(all[3],cy+hh)];}
// единицы сборки: отдельная деталь или заготовка (её детали — вместе, уже согнутые), по номеру первой детали
function asmUnits(){const R=CUR.R,u=new Map();[...R.parts].sort((a,b)=>a.no-b.no).forEach(p=>{const bi=CUR.blankOf?CUR.blankOf[p.id]:-1,k=bi>=0?'b'+bi:'p'+p.id;if(!u.has(k))u.set(k,{bi,ps:[]});u.get(k).ps.push(p);});
  const L=[...u.values()],of=new Map();L.forEach((x,i)=>{x.name=x.bi>=0?'Г'+CUR.BL[x.bi].no:'№'+x.ps[0].no;x.ps.forEach(p=>of.set(p.id,i));});
  // tw — зеркальный кусок: его детали — пары деталей этого, и только они; нет — −1
  L.forEach((x,i)=>{const tw=x.ps.map(p=>p.twin),j=tw.every(t=>t!=null)?of.get(tw[0]):undefined;x.tw=j!==undefined&&j!==i&&L[j].ps.length===x.ps.length&&tw.every(t=>of.get(t)===j)?j:-1;});
  return {L,of};}
// шаги сборки: кусок (деталь или заготовка); следующий — с меньшим номером из тех, что касаются собранного (ничего не касается — новое начало).
// Зеркальная пара — один шаг, если и зеркальный кусок есть к чему приварить (или оба — начало). w — к чему варить: [{nb, dih, ed}], done — собрано после шага
function asmSteps(){const {L:U,of}=asmUnits(),R=CUR.R,n=U.length,placed=new Set(),pu=new Set(),steps=[],own=U.map(x=>new Set(x.ps.map(p=>p.id))),UE=U.map(()=>[]);
  R.edges.forEach(e=>{if(e.p.length!==2)return;const a=of.get(e.p[0]),b=of.get(e.p[1]);if(a===b)return;UE[a].push(e);UE[b].push(e);});
  const weldTo=(i,set)=>{const m=new Map();UE[i].forEach(e=>{const b=own[i].has(e.p[0])?e.p[1]:e.p[0];if(!set.has(b))return;if(!m.has(b))m.set(b,{nb:b,dih:e.dih,ed:[]});m.get(b).ed.push([e.a,e.b]);});return [...m.values()].sort((a,b)=>R.parts[a.nb].no-R.parts[b.nb].no);};
  const twinOf=i=>U[i].tw;
  while(pu.size<n){let i=-1;for(let k=0;k<n&&i<0;k++)if(!pu.has(k)&&(!placed.size||U[k].ps[0].back||weldTo(k,placed).length))i=k;
    for(let k=0;k<n&&i<0;k++)if(!pu.has(k))i=k;
    const w=weldTo(i,placed),j=twinOf(i),st={u:[U[i]],ix:[i],w:[w]};pu.add(i);
    if(j>=0&&!pu.has(j)){const w2=weldTo(j,new Set([...placed,...own[i]]));if(w2.length||!w.length){st.u.push(U[j]);st.ix.push(j);st.w.push(w2);pu.add(j);}}
    st.ix.forEach(k=>own[k].forEach(p=>placed.add(p)));st.done=new Set(placed);steps.push(st);}
  return {steps,of};}
// перенос строки по словам
const wrapTxt=(t,n)=>{const out=[];let l='';t.split(' ').forEach(w=>{if((l+' '+w).trim().length>n&&l){out.push(l);l=w;}else l=(l+' '+w).trim();});if(l)out.push(l);return out;};
function sheetsAssembly(){const {steps}=asmSteps(),R=CUR.R,V=CUR.M3.V,cw=130,ch=124,out=[];
  const say=(x,w)=>{const bl=x.bi>=0;if(x.ps[0].back)return `${x.name}: подложка за прорезью глаза — приварить изнутри по краю прорези`;return `${x.name}${bl?` (дет. ${x.ps.map(p=>p.no).join(', ')})`:''}: ${bl?`согнуть по карте ${x.name}, `:''}${w.length?'приварить к '+w.map(q=>`№ ${R.parts[q.nb].no} (${angT(q.dih)})`).join(', '):'первый кусок — от него собираем'}`;};
  for(let si=0;si<steps.length;si+=6){let s='';steps.slice(si,si+6).forEach((st,j)=>{const cx=25+(j%3)*cw,cy=22+Math.floor(j/3)*ch,[x,tw]=st.u,now=new Set(st.u.flatMap(u=>u.ps.map(p=>p.id)));
      const W=st.w[0],nbs=new Set(W.map(q=>q.nb)),mine=new Set(x.ps.map(p=>p.id));
      // крупно и со стороны нового куска; собранное раньше — светло-серым, новый — оранжевым; номера — только у нового и тех, к кому варим
      const v=stepView(x.ps),fb=stepFrame(v,x.ps.concat(W.map(q=>R.parts[q.nb]))),   // в рамке — новый кусок и те, к кому его варить
        k=Math.min((cw-10)/(fb[2]-fb[0]),80/(fb[3]-fb[1])),id='asm'+(si+j),ox=cx+(cw-(fb[2]-fb[0])*k)/2-fb[0]*k,oy=cy+9+(80-(fb[3]-fb[1])*k)/2-fb[1]*k;
      s+=`<rect class="t" x="${cx}" y="${cy}" width="${cw}" height="${ch}"/><text class="h2" x="${cx+3}" y="${cy+6}">Шаг ${si+j+1} · ${shEsc(x.name+(tw?` и ${tw.name} (зеркально)`:''))}</text><text class="sm" x="${cx+cw-3}" y="${cy+6}" text-anchor="end">вид ${v.txt}</text>`;
      s+=`<clipPath id="${id}"><rect x="${cx+1}" y="${cy+8}" width="${cw-2}" height="82"/></clipPath><g clip-path="url(#${id})">`+facesSVG(v,k,ox,oy,{only:p=>st.done.has(p.id),
        color:(p,sh)=>now.has(p.id)?`rgb(${Math.round(200+50*sh)},${Math.round(110+60*sh)},${Math.round(50+40*sh)})`:grey(.7+.28*sh),label:p=>mine.has(p.id)||nbs.has(p.id)});
      // швы этого шага — толстые красные (только на гранях, повёрнутых к нам)
      const Pp=q=>{const z=prjV(v,q);return [ox+z[0]*k,oy+z[1]*k];},vis=pi=>V3.dot(R.parts[pi].n,v.d)>.02;
      s+=`<path class="seam" d="${W.filter(q=>vis(q.nb)||x.ps.some(p=>vis(p.id))).flatMap(q=>q.ed).map(([a,b])=>{const A=Pp(V[a]),B=Pp(V[b]);return `M${r2(A[0])},${r2(A[1])}L${r2(B[0])},${r2(B[1])}`;}).join('')}"/></g>`;
      // что делать — словами; пара — «то же зеркально справа»
      let ty=cy+95;const line=(t,cl)=>wrapTxt(t,78).forEach(l=>{if(ty<cy+ch-1.5){s+=`<text class="${cl}" x="${cx+3}" y="${r2(ty)}">${shEsc(l)}</text>`;ty+=3.6;}});
      line(say(x,W),'td');if(tw){ty+=.6;line('То же зеркально справа — '+say(tw,st.w[1]),'sm');}});
    s+=`<text class="sm" x="25" y="272">Оранжевое — кусок этого шага, светло-серое — собрано раньше, красная линия — шов этого шага. Номера — у нового куска и у деталей, к которым его варить. Угол — между листами по шву.</text>`;
    out.push({title:'Порядок сборки',scale:'—',body:s});}
  return out;}

/* ---------- уголки-шаблоны для сварки (галочка): все уголки 1:2 с надписью, как ставить ---------- */
function sheetsTpl(){const T=CUR.TPL||[],n=2.5,k=1/n,cw=43,ch=33,cols=9,rows=7,out=[];
  for(let i=0;i<T.length;i+=cols*rows){let s='';T.slice(i,i+cols*rows).forEach((o,j)=>{
      // буквой V: биссектриса угла — вверх, выемка у вершины — внизу
      const r=Math.PI/2-o.a*Math.PI/360,c=Math.cos(r),sn=Math.sin(r),R=o.pts.map(q=>[c*q[0]-sn*q[1],sn*q[0]+c*q[1]]),xs=R.map(q=>q[0]),ys=R.map(q=>q[1]),x0=Math.min(...xs),y1=Math.max(...ys),w=(Math.max(...xs)-x0)*k,h=(y1-Math.min(...ys))*k;
      const cx=25+(j%cols)*cw,cy=24+Math.floor(j/cols)*ch,ox=cx+(cw-w)/2,oy=cy+1+(ch-10-h)/2,Q=R.map(q=>[ox+(q[0]-x0)*k,oy+(y1-q[1])*k]);
      s+=`<polygon class="l" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/><text class="big" x="${r2(cx+cw/2)}" y="${r2(cy+ch-5)}" text-anchor="middle">${tplNo(o.a)}</text><text class="sm" x="${r2(cx+cw/2)}" y="${r2(cy+ch-1.8)}" text-anchor="middle">${[o.seams?`швов ${o.seams}${o.out?` (${o.out} снаружи)`:''}`:'',o.bends?`сгибов ${o.bends}`:''].filter(Boolean).join(', ')}</text>`;});
    s+=`<text class="sm" x="25" y="263">Уголок вырезан из того же листа, на нём гравировка «У» и угол. В чертежах у шва написан угол: «152°» — выпуклый шов, уголок У152° вставить в стык изнутри фигуры; «152° внутрь» — вогнутый, приложить снаружи.</text><text class="sm" x="25" y="268">Прижать обе детали к рабочим краям уголка (выемка — к шву), прихватить в 2–3 точках, снять уголок и переставить на следующий шов с тем же углом. Швы почти плоские (${TPL_MAX}–180°) — по линейке.</text>`;
    out.push({title:'Уголки-шаблоны для сварки',scale:scaleTxt(n),body:s});}
  return out;}

/* ---------- 4. спецификация ---------- */
function sheetsSpec(){const dens=DENS[ST.mat]||7850,R=CUR.R,cols=[{t:'№',w:15,r:1},{t:'Габарит реза, мм',w:24},{t:'Площ., см²',w:17,r:1},{t:'Масса, кг',w:16,r:1},{t:'Рез, мм',w:15,r:1},{t:'Кол.',w:9,r:1},{t:'Сваривается с (угол)',w:91}];
  // зеркальная пара (две отдельные детали или две заготовки) — одной строкой «7 / 7.1», кол. 2
  const pc=new Map(CUR.PC.map(o=>[String(o.no),o])),twinOf=o=>{const nm=String(o.no);return nm.endsWith('.1')?null:pc.get(nm+'.1')||null;};
  const rows=CUR.PC.filter(o=>!String(o.no).endsWith('.1')||!pc.has(String(o.no).slice(0,-2))).map(o=>{const tw=twinOf(o),xs=o.pts.map(q=>q[0]),ys=o.pts.map(q=>q[1]),a=Math.abs(area2(o.pts)),in_=new Set(o.parts),nb=new Map();
    o.parts.forEach(pi=>R.parts[pi].segs.forEach(g=>{if(g.nb>=0&&!in_.has(g.nb))nb.set(R.parts[g.nb].no+' '+angT(g.dih),1);}));
    // заготовка — одной строкой: габарит по развёртке, детали в ней
    const gab=o.B?`${Math.round(o.B.L)} × ${Math.round(o.B.W)}`:`${Math.round(Math.max(...xs)-Math.min(...xs))} × ${Math.round(Math.max(...ys)-Math.min(...ys))}`;
    return [tw?`${o.no} / ${tw.no}`:o.no,gab,fmt(a/100,1),fmt(a*1e-9*ST.t*dens,3),Math.round(perim(o.pts)),tw?2:1,(tw?'зеркально; ':'')+(o.B?`дет. ${o.parts.map(pi=>R.parts[pi].no).join(', ')}; `:'')+[...nb.keys()].join(', ')];});
  const per=38,out=[];for(let i=0;i<rows.length;i+=per*2){let s=svgTable(25,22,cols,rows.slice(i,i+per),6.2);if(rows.length>i+per)s+=svgTable(222,22,cols,rows.slice(i+per,i+per*2),6.2);
    if(CUR.BL&&CUR.BL.length)s+=`<text class="sm" x="25" y="272">Г — заготовка со сгибами: развёртка с размерами, гибка и швы — на её карте (PDF А4), порядок гибки — лист «Гибка — порядок».</text>`;out.push({title:'Спецификация деталей',scale:'—',body:s});}
  return out;}

/* ---------- гибка: порядок таблицей (развёртки с размерами — на картах деталей А4) ---------- */
function sheetsBend(){const BL=CUR.BL||[];if(!BL.length)return [];const R=CUR.R,out=[];
  const note=`<text class="sm" x="25" y="264">V — гнуть на себя, m — от себя, глядя на сторону с гравировкой (внутреннюю); число — угол между гранями после гибки, в скобках на гравировке — порядок гибки (сначала крайние).</text>`
    +`<text class="sm" x="25" y="268">${ST.useT?`Контур — с поправкой на толщину ${ST.t} мм у сгиба (r = t, K = 0,33) и отступом под шов на свариваемых сторонах. `:''}Развёртка каждой заготовки с размерами, вид после гибки и швы — на картах деталей (PDF А4).</text>`;
  const nm=pi=>R.parts[pi].no,rows=BL.map(b=>['Г'+b.no,b.parts.map(nm).join(', '),`${Math.round(b.L)} × ${Math.round(b.W)}`,b.lines.map(l=>`${l.k}) ${l.kind}${l.ang} ${nm(l.p)}–${nm(l.q)}`).join('   ')]);
  const cols=[{t:'Загот.',w:12},{t:'Детали',w:64},{t:'Габарит, мм',w:22},{t:'Сгибы по порядку: вид, угол между гранями, между деталями',w:292}];
  for(let i=0;i<rows.length;i+=36)out.push({title:'Гибка — порядок',scale:'—',body:svgTable(25,22,cols,rows.slice(i,i+36),6.2)+note});
  return out;}

/* ---------- для цены резки: длина реза, врезки, гравировка ---------- */
const perim=P=>P.reduce((a,q,i)=>{const z=P[(i+1)%P.length];return a+Math.hypot(z[0]-q[0],z[1]-q[1]);},0);
// кусок на листе (o.pts и o.tr — как положил раскрой): гравировка — номер; у заготовки — номера её деталей и подписи сгибов «V144 (2)»;
// V, M — линии сгиба; miss — что не влезло гравировкой. Всё в координатах листа
function itemMarks(o){const eng=ST.engrave||isTpl(o);if(o._mk&&o._mk.bl===CUR.BL&&o._mk.e===eng)return o._mk.r;let r;
  if(!isBlank(o)){const g=eng?engraveSegs(o.no,o.pts):null;r={eng:g||[],miss:eng&&!g?[itemName(o)]:[],V:[],M:[]};}
  else{const B=CUR.BL[+o.id.slice(1)],T=q=>trPt(o.tr,q);r={eng:[],miss:[],V:[],M:[],num:[],labs:[]};
    // сначала номера деталей (по ним собирают), потом подписи сгибов — не ближе 1 мм к номерам и друг к другу.
    // Подписи нет места — номера рядом с линией мельче, ступенями до 5 мм (номер остаётся в той же точке, только меньше)
    const N=B.regions.map(z=>({no:CUR.R.parts[z.pi].no,pts:z.pts.map(T),h:20})),put=n=>{n.g=engraveSegs(n.no,n.pts,{maxH:n.h});n.box=n.g?segBox(n.g,.5):null;};
    if(eng)N.forEach(put);
    B.lines.forEach(l=>{const S=l.segs.map(z=>{const a=T([z[0],z[1]]),b=T([z[2],z[3]]);return [a[0],a[1],b[0],b[1]];});(l.kind==='V'?r.V:r.M).push(...S);if(!eng||!S.length)return;
      const z=S.reduce((a,b)=>Math.hypot(b[2]-b[0],b[3]-b[1])>Math.hypot(a[2]-a[0],a[3]-a[1])?b:a),L=Math.hypot(z[2]-z[0],z[3]-z[1])||1,ux=(z[2]-z[0])/L,uy=(z[3]-z[1])/L,e=15,
        zone=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[(a<0?z[0]-ux*e:z[2]+ux*e)-uy*e*b,(a<0?z[1]-uy*e:z[3]+uy*e)+ux*e*b]);   // где искать подпись: линия ± 15 мм
      let g=null;for(const h of [20,12,8,5]){N.forEach(n=>{if(n.h>h&&n.box&&quadHit(n.box,zone)){n.h=h;put(n);}});g=bendLabel(bendTxt(l),z,o.pts,4,N.filter(n=>n.box).map(n=>n.box).concat(r.labs.map(x=>x.g.box)));if(g)break;}
      if(g)r.labs.push({t:bendTxt(l),g});else r.miss.push(o.no+' сгиб '+bendTxt(l));});
    N.forEach(n=>{r.num.push({no:n.no,g:n.g});if(n.g)r.eng.push(...n.g);else if(eng)r.miss.push('№'+n.no);});r.labs.forEach(x=>r.eng.push(...x.g));}
  o._mk={bl:CUR.BL,e:eng,r};return r;}
const segLen=S=>S.reduce((a,z)=>a+Math.hypot(z[2]-z[0],z[3]-z[1]),0);
function cutStats(items){let cut=0,eng=0,pierce=0,engN=0,bend=0;items.forEach(o=>{cut+=perim(o.pts);pierce++;const m=itemMarks(o);if(m.eng.length){engN++;eng+=segLen(m.eng);}bend+=segLen(m.V)+segLen(m.M);});return {cut,eng,pierce,engN,bend};}
const cutTxt=(c,short)=>`рез ${fmt(c.cut/1000,1)} м · врезок ${c.pierce}${ST.engrave?` · гравировка ${fmt(c.eng/1000,1)} м`:''}${c.bend&&!short?` · линии сгиба ${fmt(c.bend/1000,1)} м`:''}`;
/* ---------- 5. раскрой листа ---------- */
function sheetsNest(){const N=CUR.N,n=N.sheets.length===1?pickScale([N.W,N.H],[385,235]):pickScale([N.W,N.H],[385,108]),k=1/n,out=[],[sl,sw]=sheetWL();
  for(let i=0;i<N.sheets.length;i+=2){let s='';N.sheets.slice(i,i+2).forEach((sh,j)=>{const ox=25+(385-N.W*k)/2,oy=30+j*125;
      s+=`<text class="h2" x="25" y="${oy-3}">Лист металла ${i+j+1} из ${N.sheets.length} · ${sw} × ${sl} · ${ST.t} мм, ${MATN[ST.mat]} · ${itemsTxt(sh.items)} · детали в полосе ${sw} × ${Math.round(sh.len)} мм (плотность ${Math.round(sh.dense*100)}%), остальное свободно · зазор ${N.gap} мм · ${cutTxt(cutStats(sh.items),true)}</text><rect class="l" x="${r2(ox)}" y="${oy}" width="${r2(N.W*k)}" height="${r2(N.H*k)}"/>`;
      const T=(x,y)=>[ox+(x)*k,oy+(N.H-y)*k];   // как в DXF: y вверх
      const small=[],path=(S,c)=>S.length?`<path class="${c}" d="${S.map(z=>{const a=T(z[0],z[1]),b=T(z[2],z[3]);return 'M'+r2(a[0])+','+r2(a[1])+'L'+r2(b[0])+','+r2(b[1]);}).join('')}"/>`:'';
      sh.items.forEach(o=>{const Q=o.pts.map(q=>T(o.x+q[0],o.y+q[1])),m=itemMarks(o);small.push(...m.miss);
        s+=`<polygon class="${m.miss.length&&!isBlank(o)?'small':'t'}" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`+path(m.V,'bnd bv')+path(m.M,'bnd bm');
        if(m.eng.length)s+=path(m.eng,'eng');
        else if(!ST.engrave&&!isTpl(o)){const cx=Q.reduce((a,q)=>a+q[0],0)/Q.length,cy=Q.reduce((a,q)=>a+q[1],0)/Q.length;s+=`<text class="no" x="${r2(cx)}" y="${r2(cy+.9)}" text-anchor="middle">${o.no}</text>`;}});
      if(small.length)s+=`<text class="h2" x="25" y="${r2(oy+N.H*k+8)}" fill="#c33">Без гравировки — малы для цифр 3 мм (обведены красным): ${shEsc(small.join(', ').slice(0,300))}</text>`;});
    out.push({title:'Раскрой листа',scale:scaleTxt(n),body:s});}
  if(N.too.length)out.push({title:'Раскрой листа',scale:'—',body:`<text class="h2" x="25" y="40">Не влезают в лист: ${N.too.map(itemName).join(', ')} — выберите лист больше или уменьшите фигуру</text>`});
  return out;}

const shDate=()=>{const d=new Date();return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;};
function buildSheets(){if(!CUR||!CUR.R.parts.length)return [];const L=[sheetGeneral(),...sheetsAssembly(),...sheetsBend(),...sheetsSpec(),...(CUR.TPL&&CUR.TPL.length?sheetsTpl():[]),...sheetsNest()],date=shDate();
  return L.map((b,i)=>({title:b.title,svg:wrapSheet(b,{n:i+1,N:L.length,date})}));}

/* ---------- карты деталей: лист А4 книжный на каждый кусок (деталь или заготовка), зеркальная пара — одна карта ----------
   Глянул на лист — понял, что за кусок, где он на фигуре, как резать, гнуть и к чему варить */
function wrapA4(b,o){return `<svg xmlns="http://www.w3.org/2000/svg" class="shs" viewBox="0 0 210 297" width="210mm" height="297mm">${SH_STYLE}<rect width="210" height="297" fill="#fff"/><rect class="fr" x="20" y="5" width="185" height="287"/><path class="l" d="M20,17H205"/>`
  +`<text class="hd" x="24" y="13.5">${shEsc(b.head)}</text><text class="h2" x="201" y="13.5" text-anchor="end">${shEsc(b.title)}</text>${b.body}${stamp(20,276,b,o)}<text class="sm" x="205" y="295.6" text-anchor="end">Формат А4</text></svg>`;}
// швы куска (own — его детали): по каждому соседу снаружи — длина, угол (по самому длинному ребру), рёбра
function pieceWelds(own){const R=CUR.R,V=CUR.M3.V,m=new Map();R.edges.forEach(e=>{if(e.p.length!==2)return;const i=own.has(e.p[0]);if(i===own.has(e.p[1]))return;const nb=i?e.p[1]:e.p[0],l=V3.len(V3.sub(V[e.a],V[e.b]));
    if(!m.has(nb))m.set(nb,{nb,len:0,dih:e.dih,ml:0,ed:[]});const w=m.get(nb);w.len+=l;w.ed.push([e.a,e.b]);if(l>w.ml){w.ml=l;w.dih=e.dih;}});
  return [...m.values()].sort((a,b)=>R.parts[a.nb].no-R.parts[b.nb].no);}
// профиль шва: свой лист (оранжевый) и соседний (серый) под углом a, шов — красная точка; в угол вставлен уголок, нет его — дуга (выставить транспортиром).
// Внутри фигуры — сверху, как гравировка в клетках гибки: обычный шов — сосед вверх, уголок сверху (изнутри); out — шов «внутрь»: сосед вниз, уголок снизу (снаружи). x — левый край, y — низ
function weldGlyph(x,y,a,s,tpl,out){const r=a*Math.PI/180,c=Math.cos(r),sn=(out?-1:1)*Math.sin(r),q=s*.5,vx=x+s*Math.max(0,-c),bi=[(1+c)/2,-sn/2],bl=Math.hypot(bi[0],bi[1])||1,o=[bi[0]/bl*.35,bi[1]/bl*.35];
  if(out)y-=s;
  return `<g class="wg"${out?' data-out="1"':''}>`+(tpl?`<polygon class="tw" points="${r2(vx+o[0]+q*1.15)},${r2(y+o[1])} ${r2(vx+o[0])},${r2(y+o[1])} ${r2(vx+o[0]+q*1.15*c)},${r2(y+o[1]-q*1.15*sn)}"/>`
    :`<path class="ag" d="M${r2(vx+q)},${r2(y)}A${r2(q)},${r2(q)} 0 0 ${out?1:0} ${r2(vx+q*c)},${r2(y-q*sn)}"/>`)
    +`<path class="pw" style="stroke:#e08a3c" d="M${r2(vx+s)},${r2(y)}L${r2(vx)},${r2(y)}"/><path class="pw" style="stroke:#9a9a9a" d="M${r2(vx)},${r2(y)}L${r2(vx+s*c)},${r2(y-s*sn)}"/><circle cx="${r2(vx)}" cy="${r2(y)}" r=".45" fill="#d01f1f"/></g>`;}
// клетка сгиба: «до» — лист плашмя, гравировка сверху, стрелка — куда гнуть (V — на себя, вверх; m — от себя, вниз); «после» — профиль на угол l.ang,
// уголок — во внутреннем углу (у V — со стороны гравировки, у m — с обратной). Клетка BCW × BCH мм, x,y — левый верхний угол
const BCW=46.25,BCH=25.5;
function bendCell(x,y,l,nm){const V=l.kind==='V',k=V?1:-1,col=V?'#c33':'#33c',tp=tplSay(l.ang,true),tl=tp.startsWith('уголок'),f=(180-l.ang)*Math.PI/180,P=(a,b)=>r2(a)+','+r2(b);
  let g=`<g class="bc" data-k="${l.k}" data-kind="${l.kind}"><circle cx="${r2(x+3.6)}" cy="${r2(y+3.4)}" r="1.7" fill="#fff" stroke="${col}" stroke-width=".25"/><text class="no" x="${r2(x+3.6)}" y="${r2(y+4.3)}" text-anchor="middle" style="font-size:2.4px;fill:${col}">${l.k}</text>`
    +`<text class="td" x="${r2(x+6.4)}" y="${r2(y+4.4)}"><tspan style="fill:${col};font-weight:bold;font-style:normal">${l.kind}${l.ang}</tspan> — ${V?'на себя':'от себя'}</text>`;
  // до: лист x+2…x+19, сгиб у bx, стрелка дугой от правого крыла
  const ym=y+13,bx=x+12,R=5.5,e=[bx+R*Math.cos(1.05),ym-k*R*Math.sin(1.05)],d=[-Math.sin(1.05),-k*Math.cos(1.05)];
  g+=`<text class="lb" x="${r2(x+2)}" y="${r2(ym-1.2)}" style="font-size:1.8px">гравировка</text><path class="pw" style="stroke:#555" d="M${P(x+2,ym)}H${r2(x+19)}"/><path class="bnd ${V?'bv':'bm'}" d="M${P(bx,ym-2.4)}V${r2(ym+2.4)}"/>`
    +`<path class="t" style="stroke:${col};stroke-width:.3" d="M${P(bx+R,ym-k*.9)}A${R},${R} 0 0 ${V?0:1} ${P(e[0],e[1])}"/><polygon fill="${col}" points="${P(e[0]+d[0]*.4,e[1]+d[1]*.4)} ${P(e[0]-d[0]*1.3-d[1]*.7,e[1]-d[1]*1.3+d[0]*.7)} ${P(e[0]-d[0]*1.3+d[1]*.7,e[1]-d[1]*1.3-d[0]*.7)}"/>`
    +`<text class="h2" x="${r2(x+21.2)}" y="${r2(ym+1.3)}" style="font-size:3.4px">→</text>`;
  // после: вершина на сгибе, левое крыло лежит, правое поднято (V) или опущено (m) на 180 − угол
  const vx=x+33,vy=V?y+17.2:y+9.2,L=10,w=[Math.cos(f),-k*Math.sin(f)],b0=[w[0]-1,w[1]],bl=Math.hypot(b0[0],b0[1]),bi=bl>1e-3?[b0[0]/bl,b0[1]/bl]:[0,-k],o=[bi[0]*.45,bi[1]*.45],q=5.5;
  if(tl)g+=`<polygon class="tw" points="${P(vx+o[0]-q,vy+o[1])} ${P(vx+o[0],vy+o[1])} ${P(vx+o[0]+q*w[0],vy+o[1]+q*w[1])}"/><text class="lb" x="${r2(vx+bi[0]*7.6)}" y="${r2(vy+bi[1]*7.6+.7)}" text-anchor="middle" style="font-size:2px;fill:#7a5a10">${tplNo(l.ang)}</text>`;
  else g+=`<path class="ag" d="M${P(vx-3,vy)}A3,3 0 0 ${V?1:0} ${P(vx+3*w[0],vy+3*w[1])}"/><text class="lb" x="${r2(vx+bi[0]*6.2)}" y="${r2(vy+bi[1]*6.2+.7)}" text-anchor="middle" style="font-size:2px">${l.ang}°</text>`;
  g+=`<path class="pw" style="stroke:#555" d="M${P(vx-L,vy)}L${P(vx,vy)}L${P(vx+L*w[0],vy+L*w[1])}"/><circle cx="${r2(vx)}" cy="${r2(vy)}" r=".5" fill="${col}"/>`;
  return g+`<text class="sm" x="${r2(x+2)}" y="${r2(y+21.9)}">между № ${nm(l.p)} и ${nm(l.q)} · линия ${Math.round(l.len)} мм</text><text class="td" x="${r2(x+2)}" y="${r2(y+24.6)}" style="font-size:2.4px">${shEsc(tp)}</text></g>`;}
// чем выставить угол: уголок из комплекта (галочка «Уголки»), почти плоский — линейкой, совсем острый — по месту, иначе — транспортиром
function tplSay(d,bend){const a=Math.round(d>180.5?360-d:d);if(a>=TPL_MAX)return 'по линейке';if(a<TPL_MIN)return 'по месту';
  return CUR.TPL&&CUR.TPL.some(o=>o.a===a)?`уголок ${tplNo(a)}${bend?'':d>180.5?' снаружи':' изнутри'}`:'транспортиром';}
// x — кусок (из asmUnits), y — его зеркальный или null
function cardPiece(x,y){const R=CUR.R,V=CUR.M3.V,B=x.bi>=0?CUR.BL[x.bi]:null,o=CUR.PC.find(c=>c.id===(B?'b'+x.bi:x.ps[0].id)),own=new Set(x.ps.map(p=>p.id)),nm=pi=>R.parts[pi].no;
  const t=bendAlign(o.pts,true),P=o.pts.map(q=>trPt(t,q)),a=Math.abs(area2(o.pts)),mass=a*1e-9*ST.t*(DENS[ST.mat]||7850),W=pieceWelds(own),back=x.ps[0].back;
  // строки: гибка по порядку, потом сварка по соседям; у каждой — чертёж угла
  const rows=[],nbr=B?Math.ceil(B.lines.length/4):0,hb=B?6+nbr*BCH:0;
  rows.push({h:back?'Сварка — подложка за прорезью глаза: приварить изнутри по краю прорези':`Сварка — к чему варить · угол между листами по шву${y?` · ${y.name} — к зеркальным (с «.1»), детали посередине — те же`:''}`});
  W.forEach(w=>rows.push({w:1,o:w.dih>180.5,t:`к № ${nm(w.nb)} · шов ${Math.round(w.len)} мм`,a:Math.round(w.dih>180.5?360-w.dih:w.dih),at:angT(w.dih),tp:tplSay(w.dih)}));
  // строки по ширине листа; соседей много — швы в две колонки
  const wc=W.length>8||hb+(W.length+1)*3.8>124?2:1,ln=[];rows.forEach(r=>{const l=ln[ln.length-1];if(r.w&&l&&l[0].w&&l.length<wc)l.push(r);else ln.push([r]);});
  const maxT=Math.max(30,124-hb),rh=Math.max(3.8,Math.min(B?4.8:5.4,maxT/ln.length)),nl=Math.min(ln.length,Math.floor(maxT/rh)),ty0=274-hb-nl*rh,fy0=y?31:28,mh=pickScale([t.L,t.W],[160,ty0-fy0-78])>pickScale([t.L,t.W],[160,ty0-fy0-68])?56:66,my0=ty0-mh;
  // шапка: что внутри, металл, габарит, масса, рез, сколько штук
  let s=`<text class="td" x="23" y="22.5">${shEsc([B?`детали № ${x.ps.map(p=>p.no).join(', ')}`:back?'подложка глаза':'',`${MATN[ST.mat]||ST.mat} ${ST.t} мм`,`габарит реза ${Math.round(t.L)} × ${Math.round(t.W)} мм`,`масса ${fmt(mass,2)} кг/шт`,`рез ${Math.round(perim(o.pts))} мм`,`кол. ${y?2:1}`].filter(Boolean).join(' · '))}</text>`;
  if(y)s+=`<text class="sm" x="23" y="26.5">${shEsc(`${y.name} — зеркальная копия: развёртка зеркально (в DXF и раскрое уже так), гнуть и варить так же — на другой стороне фигуры`)}</text>`;
  // 1. развёртка, как режут: контур, линии сгиба с подписью, номера деталей, гравировка, длины сторон и габарит
  const fh=my0-2-fy0,n=pickScale([t.L,t.W],[160,fh-20]),k=1/n,ox=20+(185-t.L*k)/2,oy=fy0+7+(fh-17-t.W*k)/2,T=q=>[ox+q[0]*k,oy+(t.W-q[1])*k],Q=P.map(T),box=[],hit=b=>box.some(c=>b[0]<c[2]&&b[2]>c[0]&&b[1]<c[3]&&b[3]>c[1]);   // box — занятые места
  s+=`<text class="h2" x="23" y="${r2(fy0+3.5)}">Развёртка — как режут</text><text class="sm" x="202" y="${r2(fy0+3.5)}" text-anchor="end">вид со стороны гравировки (изнутри фигуры) · М ${scaleTxt(n)}</text><polygon class="l" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;
  const segP=(S,c)=>S.length?`<path class="${c}" d="${S.map(z=>{const A=T([z[0],z[1]]),C=T([z[2],z[3]]);return `M${r2(A[0])},${r2(A[1])}L${r2(C[0])},${r2(C[1])}`;}).join('')}"/>`:'';
  // гравировка — та же, что в DXF и раскрое (itemMarks): номера деталей — красным, подписи сгибов — бледно (читать их удобнее у кружков за контуром)
  const mk=itemMarks({id:o.id,no:o.no,pts:P,tr:t}),lb=[],eng=[],engB=B?mk.labs.flatMap(x=>x.g):[];
  (B?B.regions.map(z=>({no:nm(z.pi),pts:z.pts.map(q=>trPt(t,q))})):[{no:o.no,pts:P}]).forEach(z=>{const g=B?(mk.num.find(x=>x.no===z.no)||{}).g:mk.eng.length?mk.eng:null;if(g){eng.push(...g);const Z=g.flatMap(q=>[T([q[0],q[1]]),T([q[2],q[3]])]);box.push([Math.min(...Z.map(q=>q[0]))-.3,Math.min(...Z.map(q=>q[1]))-.3,Math.max(...Z.map(q=>q[0]))+.3,Math.max(...Z.map(q=>q[1]))+.3]);}
    if(!g)lb.push({t:String(z.no),pts:z.pts.map(T),a:Math.abs(area2(z.pts))*k*k});});   // гравировки нет (выкл. или не влезла) — номер текстом
  if(B)B.lines.forEach(l=>l.segs.forEach((z,zi)=>{const A=T(trPt(t,[z[0],z[1]])),C=T(trPt(t,[z[2],z[3]]));s+=`<path class="bnd ${l.kind==='V'?'bv':'bm'}" d="M${r2(A[0])},${r2(A[1])}L${r2(C[0])},${r2(C[1])}"/>`;
    // подпись — за контуром, у конца линии: кружок с номером по порядку и «V141» (внутри узких полос налезала бы на гравировку номеров)
    if(zi)return;const col=l.kind==='V'?'#c33':'#33c',tx=l.kind+l.ang;let done=false;
    for(const r of [2.6,4.6])for(const [E,O] of [[C,A],[A,C]]){if(done)break;const d=Math.hypot(E[0]-O[0],E[1]-O[1])||1,u=[(E[0]-O[0])/d,(E[1]-O[1])/d],c=[E[0]+u[0]*r,E[1]+u[1]*r],rt=u[0]>=-.2,w=tx.length*1.15;
      const b=[Math.min(c[0]-1.9,rt?c[0]:c[0]-2.2-w),c[1]-1.9,Math.max(c[0]+1.9,rt?c[0]+2.2+w:c[0]),c[1]+1.9];if(r<4&&hit(b))continue;box.push(b);done=true;
      s+=`<path class="t" style="stroke:${col}" d="M${r2(E[0])},${r2(E[1])}L${r2(c[0]-u[0]*1.7)},${r2(c[1]-u[1]*1.7)}"/><circle cx="${r2(c[0])}" cy="${r2(c[1])}" r="1.7" fill="#fff" stroke="${col}" stroke-width=".25"/><text class="no" x="${r2(c[0])}" y="${r2(c[1]+.9)}" text-anchor="middle" style="font-size:2.4px;fill:${col}">${l.k}</text>`
        +`<text class="nb" x="${r2(rt?c[0]+2.2:c[0]-2.2)}" y="${r2(c[1]+.8)}"${rt?'':' text-anchor="end"'} style="font-size:2.4px;fill:${col}">${tx}</text>`;}}));
  if(B)mk.labs.forEach(x=>{const Z=x.g.flatMap(z=>[T([z[0],z[1]]),T([z[2],z[3]])]);box.push([Math.min(...Z.map(q=>q[0])),Math.min(...Z.map(q=>q[1])),Math.max(...Z.map(q=>q[0])),Math.max(...Z.map(q=>q[1]))]);});   // подписи сгибов заняли место
  s+=segP(eng,'eng')+segP(engB,'eng engb')+placeLabels(lb,4.2,.55,box).map(l=>{box.push([l.x-l.t.length*l.h*.3,l.y-l.h/2,l.x+l.t.length*l.h*.3,l.y+l.h/2]);return `<text class="no" x="${r2(l.x)}" y="${r2(l.y+l.h*.35)}" text-anchor="middle" style="font-size:${r2(l.h)}px">${l.t}</text>`;}).join('');
  Q.forEach((A,i)=>{const C=Q[(i+1)%Q.length],L=Math.hypot(P[(i+1)%P.length][0]-P[i][0],P[(i+1)%P.length][1]-P[i][1]),pl=Math.hypot(C[0]-A[0],C[1]-A[1]);if(L<10||pl<4)return;
    let nx=(C[1]-A[1])/pl,ny=-(C[0]-A[0])/pl;const mx=(A[0]+C[0])/2,my=(A[1]+C[1])/2;if(inPoly([mx+nx*.6,my+ny*.6],Q)){nx=-nx;ny=-ny;}
    const tx=String(Math.round(L)),w=tx.length*1.3,c=[mx+nx*(2+Math.abs(ny)*.4),my+ny*2.4],b=[c[0]-w/2,c[1]-1.3,c[0]+w/2,c[1]+1];if(hit(b))return;box.push(b);s+=`<text class="sm" x="${r2(c[0])}" y="${r2(c[1]+.8)}" text-anchor="middle">${tx}</text>`;});
  s+=dimH(ox,oy+t.W*k,ox+t.L*k,oy+t.W*k,oy+t.W*k+8,Math.round(t.L))+dimV(ox+t.L*k,oy,ox+t.L*k,oy+t.W*k,ox+t.L*k+9,Math.round(t.W));
  // 2. где на фигуре: вся фигура со стороны куска, кусок — оранжевым, зеркальный — синим
  const v=stepView(x.ps),bf=projBox(v),tw=new Set(y?y.ps.map(p=>p.id):[]),kf=Math.min(84/(bf[2]-bf[0]),(mh-14)/(bf[3]-bf[1])),orng=sh=>`rgb(${Math.round(200+50*sh)},${Math.round(110+60*sh)},${Math.round(50+40*sh)})`;
  s+=`<path class="t" d="M20,${r2(my0)}H205M112,${r2(my0)}V${r2(ty0)}M20,${r2(ty0)}H205"/><text class="h2" x="23" y="${r2(my0+4.5)}">Где на фигуре</text><text class="sm" x="109" y="${r2(my0+4.5)}" text-anchor="end">вид ${v.txt}</text>`;
  s+=facesSVG(v,kf,20+(92-(bf[2]-bf[0])*kf)/2-bf[0]*kf,my0+7+(mh-12-(bf[3]-bf[1])*kf)/2-bf[1]*kf,{color:(p,sh)=>own.has(p.id)?orng(sh):tw.has(p.id)?`rgb(${Math.round(90+50*sh)},${Math.round(130+50*sh)},${Math.round(200+40*sh)})`:grey(.72+.25*sh)});
  // 3. готовый кусок крупно: все грани (изнанка — серо-голубым), номера деталей, сгибы синим пунктиром с номером по порядку, швы красным с номером соседа
  const bx=[1e9,1e9,-1e9,-1e9];x.ps.forEach(p=>p.full.forEach(i=>{const q=prjV(v,V[i]);bx[0]=Math.min(bx[0],q[0]);bx[1]=Math.min(bx[1],q[1]);bx[2]=Math.max(bx[2],q[0]);bx[3]=Math.max(bx[3],q[1]);}));
  const kp=Math.min(80/(bx[2]-bx[0]||1),(mh-22)/(bx[3]-bx[1]||1)),px=112+(93-(bx[2]-bx[0])*kp)/2-bx[0]*kp,py=my0+9+(mh-18-(bx[3]-bx[1])*kp)/2-bx[1]*kp,Pp=i=>{const q=prjV(v,V[i]);return [px+q[0]*kp,py+q[1]*kp];};
  const Lt=V3.norm(V3.add(V3.add(v.d,V3.mul(v.up,.7)),V3.mul(v.r,-.4))),fl=[];
  s+=`<text class="h2" x="115" y="${r2(my0+4.5)}">${B?'Готовый кусок — после гибки':'Деталь — швы и соседи'}</text>`;
  x.ps.slice().sort((a,b)=>V3.dot(a.c,v.d)-V3.dot(b.c,v.d)).forEach(p=>{const pts=p.full.map(Pp),sh=.5+.45*Math.abs(V3.dot(p.n,Lt)),fr=V3.dot(p.n,v.d)>0;
    s+=`<polygon class="fc" fill="${fr?orng(sh):`rgb(${Math.round(170+60*sh)},${Math.round(178+55*sh)},${Math.round(190+50*sh)})`}" points="${pts.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;if(Math.abs(area2(pts))>10)fl.push({t:String(p.no),pts,a:Math.abs(area2(pts))});});
  const cen=x.ps.reduce((c,p)=>V3.add(c,V3.mul(p.c,1/x.ps.length)),[0,0,0]),cc=(q=>[px+q[0]*kp,py+q[1]*kp])(prjV(v,cen)),bb=[];
  if(B)B.lines.forEach(l=>{const j=CUR.BP.J[l.id],A=Pp(j.A),C=Pp(j.B),m=[(A[0]+C[0])/2,(A[1]+C[1])/2];bb.push([m[0]-1.8,m[1]-1.8,m[0]+1.8,m[1]+1.8]);
    s+=`<path class="bl3" d="M${r2(A[0])},${r2(A[1])}L${r2(C[0])},${r2(C[1])}"/><circle cx="${r2(m[0])}" cy="${r2(m[1])}" r="1.7" fill="#fff" stroke="#1f5fd0" stroke-width=".25"/><text class="no" x="${r2(m[0])}" y="${r2(m[1]+.9)}" text-anchor="middle" style="font-size:2.4px;fill:#1f5fd0">${l.k}</text>`;});
  W.forEach(w=>{const ln=w.ed.map(([a,b])=>[Pp(a),Pp(b)]);s+=`<path class="seam" style="stroke-width:.55" d="${ln.map(([A,C])=>`M${r2(A[0])},${r2(A[1])}L${r2(C[0])},${r2(C[1])}`).join('')}"/>`;
    const [A,C]=ln.reduce((a,b)=>Math.hypot(b[1][0]-b[0][0],b[1][1]-b[0][1])>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1])?b:a),m=[(A[0]+C[0])/2,(A[1]+C[1])/2],d=Math.hypot(m[0]-cc[0],m[1]-cc[1])||1,tx='→'+nm(w.nb),hw=tx.length*.6;
    for(const r of [3,5,7.5]){const c=[m[0]+(m[0]-cc[0])/d*r,m[1]+(m[1]-cc[1])/d*r],b=[c[0]-hw,c[1]-1.2,c[0]+hw,c[1]+1];if(bb.some(z=>b[0]<z[2]&&b[2]>z[0]&&b[1]<z[3]&&b[3]>z[1]))continue;bb.push(b);s+=`<text class="nb" x="${r2(c[0])}" y="${r2(c[1]+.7)}" text-anchor="middle">${shEsc(tx)}</text>`;break;}});
  s+=placeLabels(fl,3,.52,bb).map(l=>`<text class="no" x="${r2(l.x)}" y="${r2(l.y+l.h*.35)}" text-anchor="middle" style="font-size:${r2(l.h)}px">${l.t}</text>`).join('');
  s+=`<text class="sm" x="115" y="${r2(ty0-2)}">${B?'синий пунктир — сгиб (номер по порядку), ':''}красное — шов, →№ — к какой детали</text>`;
  // 4. гибка — клетками по порядку, сварка — строками с профилем шва и чем выставить угол
  let yy=ty0;if(B){s+=`<text class="h2" x="23" y="${r2(yy+4.3)}" style="font-size:3.2px">Гибка — по порядку · V — на себя, m — от себя (глядя на гравировку) · угол между гранями после гибки, уголок — во внутренний угол</text>`;
    B.lines.forEach((l,i)=>{const cx=20+(i%4)*BCW,cy=yy+6+Math.floor(i/4)*BCH;s+=bendCell(cx,cy,l,nm)+(i%4?`<path class="t" style="stroke-width:.08" d="M${r2(cx)},${r2(cy+1)}V${r2(cy+BCH-1)}"/>`:'');});
    yy+=hb;s+=`<path class="t" style="stroke-width:.08" d="M20,${r2(yy)}H205"/>`;}ln.slice(0,nl).forEach((l,i)=>{const by=r2(yy+rh*.78),cw=l[0].w?185/wc:185,X=cw<100?[33,45,64]:[106,122,144];l.forEach((r,j)=>{const x0=20+j*cw;
      if(r.h)s+=`<text class="h2" x="23" y="${by}" style="font-size:3.2px">${shEsc(r.h)}</text>`;
      else s+=`<text class="td" x="${r2(x0+3)}" y="${by}">${shEsc(r.t)}</text>`+weldGlyph(x0+X[0],yy+rh*.85,r.a,rh*.72,r.tp.startsWith('уголок'),r.o)+`<text class="no" x="${r2(x0+X[1])}" y="${by}" style="font-size:3.1px">${shEsc(r.at)}</text><text class="td" x="${r2(x0+X[2])}" y="${by}">${shEsc(r.tp)}</text>`;});
    if(l[0].w&&wc>1)s+=`<path class="t" style="stroke-width:.08" d="M112.5,${r2(yy)}V${r2(yy+rh)}"/>`;yy+=rh;if(i<nl-1)s+=`<path class="t" style="stroke-width:.08" d="M20,${r2(yy)}H205"/>`;});
  if(nl<ln.length)s+=`<text class="sm" x="202" y="${r2(ty0-0.8)}" text-anchor="end">не влезло строк: ${ln.slice(nl).flat().length} — см. спецификацию</text>`;
  return {head:x.name+(y?` и ${y.name}`:''),title:B?'Карта заготовки со сгибами':'Карта детали',scale:scaleTxt(n),mass:fmt(mass*(y?2:1),2)+' кг',body:s,rows:rows.filter(r=>!r.h).length+(B?B.lines.length:0)};}
function buildCards(){if(!CUR||!CUR.PC||!CUR.R.parts.length)return [];const {L}=asmUnits(),C=L.filter((x,i)=>(x.tw<0||x.tw>i)&&CUR.PC.some(c=>c.id===(x.bi>=0?'b'+x.bi:x.ps[0].id)&&c.pts.length>2)).map(x=>cardPiece(x,x.tw>=0?L[x.tw]:null)),date=shDate();
  return C.map((b,i)=>({title:b.head,rows:b.rows,svg:wrapA4(b,{n:i+1,N:C.length,date})}));}

/* ---------- DXF: раскрой (все листы) и детали (сеткой) ---------- */
function segNbOf(p){return p.segs.map(g=>g.nb>=0?CUR.R.parts[g.nb].no:null);}
function dxfNest(){const N=CUR.N,e=[];N.sheets.forEach((sh,i)=>{const oy=i*(N.H+200);dxfPoly(e,[[0,0],[N.W,0],[N.W,N.H],[0,N.H]],'SHEET',0,oy);dxfTxt(e,N.W/2,N.H+60+oy,40,`SHEET ${i+1}`,"SHEET");
  sh.items.forEach(o=>{dxfPoly(e,o.pts,"CUT",o.x,o.y+oy);dxfMarksOf(e,o,o.x,o.y+oy);});});return dxfDoc(e);}
// гравировка — ENGRAVE, линии сгиба — BEND_V и BEND_M (глубину — разметка, гравировка в несколько проходов или перфорация — выбирает цех)
function dxfMarksOf(e,o,ox,oy){const m=itemMarks(o);if(m.eng.length)dxfSegs(e,m.eng,'ENGRAVE',ox,oy);if(m.V.length)dxfSegs(e,m.V,'BEND_V',ox,oy);if(m.M.length)dxfSegs(e,m.M,'BEND_M',ox,oy);}
function dxfParts(){const ps=CUR.PC.filter(o=>!o.bad),e=[];let x=0,y=0,rowH=0;
  // с гравировкой и с гибкой — зеркально, внутренней стороной вверх; заготовка — длинной стороной по X
  const it=ps.map(o=>{const f=ST.engrave||ST.bend,t=o.B?bendAlign(o.pts,f):{f,c:1,s:0,x:0,y:0},q={id:o.id,no:o.no,pts:o.pts.map(p=>trPt(t,p))};const xs=q.pts.map(p=>p[0]),ys=q.pts.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys);
    q.pts=q.pts.map(p=>[p[0]-x0,p[1]-y0]);q.tr={...t,x:t.x-x0,y:t.y-y0};q.L=Math.max(...xs)-x0;q.W=Math.max(...ys)-y0;return q;}),rowW=Math.max(1500,Math.max(...it.map(o=>o.L))+50);
  it.forEach(o=>{if(x+o.L>rowW){x=0;y+=rowH+30;rowH=0;}dxfPoly(e,o.pts,'CUT',x,y);dxfMarksOf(e,o,x,y);x+=o.L+30;rowH=Math.max(rowH,o.W);});
  // уголки-шаблоны — рядом ниже деталей
  if(CUR.TPL&&CUR.TPL.length){x=0;y+=rowH+60;rowH=0;CUR.TPL.forEach(o=>{const xs=o.pts.map(q=>q[0]),ys=o.pts.map(q=>q[1]),x0=Math.min(...xs),y0=Math.min(...ys),P=o.pts.map(q=>[q[0]-x0,q[1]-y0]),w=Math.max(...xs)-x0;
    if(x+w>rowW){x=0;y+=rowH+30;rowH=0;}dxfPoly(e,P,'CUT',x,y);{const g=engraveSegs(tplNo(o.a),P);if(g)dxfSegs(e,g,'ENGRAVE',x,y);}x+=w+30;rowH=Math.max(rowH,Math.max(...ys)-y0);});}
  return dxfDoc(e);}

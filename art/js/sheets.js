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
const SH_STYLE='<style>'+`.l{fill:none;stroke:#000;stroke-width:.35;stroke-linejoin:round}.t{fill:none;stroke:#000;stroke-width:.18}.dash{fill:none;stroke:#000;stroke-width:.15;stroke-dasharray:1.2 .8}.fr{fill:none;stroke:#000;stroke-width:.7}.eng{fill:none;stroke:#c33;stroke-width:.12}.bnd{fill:none;stroke:#000;stroke-width:.18;stroke-dasharray:4 1 .4 1 .4 1}.bv{stroke:#c33}.bm{stroke:#33c}.small{fill:none;stroke:#c33;stroke-width:.35}.fc{stroke:#000;stroke-width:.15;stroke-linejoin:round}.ar{fill:#000}text{font-family:"Arial Narrow",Arial,sans-serif;font-style:italic;fill:#000;font-size:3.5px}.hd{font-size:6px}.h2{font-size:4.5px}.sm,.lb{font-size:2.3px}.td{font-size:2.8px}.no{font-size:2.6px;font-style:normal;font-weight:bold}.nb{font-size:2.1px;fill:#a33}.big{font-size:5px;font-style:normal;font-weight:bold}`.replace(/([^{}]+)\{/g,(m,sel)=>sel.split(',').map(x=>'svg.shs '+x.trim()).join(',')+'{')+'</style>';
// рамка и основная надпись (только email — по просьбе автора)
function wrapSheet(b,o){const x=230,y=276,c=[95,30,30,30],cell=(i,row,lab,val)=>{const xx=x+c.slice(0,i).reduce((s,v)=>s+v,0),yy=y+row*8;return `<text class="lb" x="${xx+1}" y="${yy+2.6}">${lab}</text><text class="td" x="${xx+1.2}" y="${yy+6.6}">${shEsc(val)}</text>`;};
  let xs=x,v='';c.slice(0,-1).forEach(w=>{xs+=w;v+=`M${xs},${y}V${y+16}`;});const nm=ST.name||'Фигура';
  const tb=`<rect class="fr" x="${x}" y="${y}" width="185" height="16"/><path class="t" d="M${x},${y+8}H415${v}"/>`+cell(0,0,'Изделие',nm)+cell(1,0,'Масштаб',b.scale||'—')+cell(2,0,'Масса',`≈ ${fmt(CUR.T.mass,1)} кг`)+cell(3,0,'Металл',`${ST.t} мм`)
    +cell(0,1,'email',SH_EMAIL)+cell(1,1,'Дата',o.date)+cell(2,1,'Лист',String(o.n))+cell(3,1,'Листов',String(o.N));
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
  s+=`<text class="sm" x="300" y="268">Номера на гранях — номера деталей (вид спереди). Порядок сборки — следующие листы.</text>`;
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
  const L=[...u.values()],of=new Map();L.forEach((x,i)=>{x.name=x.bi>=0?'Г'+CUR.BL[x.bi].no:'№'+x.ps[0].no;x.ps.forEach(p=>of.set(p.id,i));});return {L,of};}
function sheetsAssembly(){const {L:U,of}=asmUnits(),n=U.length,g=n<=30?3:n<=90?5:8,steps=[];for(let i=0;i<n;i+=g)steps.push({lo:i,hi:Math.min(n,i+g)-1});
  const cw=130,ch=124,out=[];
  for(let si=0;si<steps.length;si+=6){let s='';steps.slice(si,si+6).forEach(({lo,hi},j)=>{const cx=25+(j%3)*cw,cy=22+Math.floor(j/3)*ch,us=U.slice(lo,hi+1),st=us.flatMap(x=>x.ps),isNew=p=>of.get(p.id)>=lo;
      // каждый шаг — крупно и со стороны своих деталей; собранное раньше — серым вокруг
      const v=stepView(st),fb=stepFrame(v,st),k=Math.min((cw-10)/(fb[2]-fb[0]),84/(fb[3]-fb[1])),id='asm'+(si+j),hd=us.length===st.length?`дет. ${st[0].no}${st.length>1?'–'+st[st.length-1].no:''}`:us.map(x=>x.name).join(', ');
      s+=`<rect class="t" x="${cx}" y="${cy}" width="${cw}" height="${ch}"/><text class="h2" x="${cx+3}" y="${cy+6}">Шаг ${si+j+1} · ${shEsc(hd.length>40?hd.slice(0,39)+'…':hd)}</text><text class="sm" x="${cx+cw-3}" y="${cy+6}" text-anchor="end">вид ${v.txt}</text>`;
      s+=`<clipPath id="${id}"><rect x="${cx+1}" y="${cy+8}" width="${cw-2}" height="86"/></clipPath><g clip-path="url(#${id})">`+facesSVG(v,k,cx+(cw-(fb[2]-fb[0])*k)/2-fb[0]*k,cy+9+(84-(fb[3]-fb[1])*k)/2-fb[1]*k,{only:p=>of.get(p.id)<=hi,color:(p,sh)=>isNew(p)?`rgb(${Math.round(200+50*sh)},${Math.round(110+60*sh)},${Math.round(50+40*sh)})`:grey(.55+.4*sh),label:isNew})+'</g>';
      // к чему варить: соседи из собранного раньше (у заготовки — по всем её деталям)
      let ty=cy+97;us.forEach(x=>{const ui=of.get(x.ps[0].id),nb=new Map();x.ps.forEach(p=>p.segs.forEach(q=>{if(q.nb<0||!(of.get(q.nb)<ui))return;nb.set(`${CUR.R.parts[q.nb].no} (${angT(q.dih)})`,1);}));
        const t=`${x.bi>=0?`${x.name} (дет. ${x.ps.map(p=>p.no).join(', ')}, согнуть)`:x.name} → ${nb.size?[...nb.keys()].join(', '):'первая — от неё собираем'}`;s+=`<text class="sm" x="${cx+3}" y="${r2(ty)}">${shEsc(t.length>78?t.slice(0,77)+'…':t)}</text>`;ty+=3.1;});});
    out.push({title:'Порядок сборки',scale:'—',body:s});}
  return out;}

/* ---------- 3. детали: развёртки с контуром реза ---------- */
function sheetsParts(){const ps=[...CUR.R.parts].filter(p=>!CUR.blankOf||CUR.blankOf[p.id]<0).sort((a,b)=>a.no-b.no);if(!ps.length)return [];const maxL=Math.max(...ps.map(p=>p.L)),maxW=Math.max(...ps.map(p=>p.W));
  const n=pickScale([maxL,maxW],[150,100]),k=1/n,out=[];let s='',x=25,y=24,rowH=0;const flush=()=>{out.push({title:'Детали — развёртки',scale:scaleTxt(n),body:s+`<text class="sm" x="25" y="272">Жирная линия — контур реза (с учётом толщины ${ST.t} мм и шва ${ST.gap} мм), пунктир — грань по поверхности. У сторон: длина реза, мм; красным — номер соседа и угол между листами.${CUR.BL&&CUR.BL.length?' Детали заготовок со сгибами — на листах «Гибка».':''}</text>`});s='';x=25;y=24;rowH=0;};
  ps.forEach(p=>{const w=p.L*k+18,h=p.W*k+16;if(x+w>415){x=25;y+=rowH;rowH=0;}if(y+h>268){flush();}
    const ox=x+9,oy=y+8,T=q=>[ox+q[0]*k,oy+(p.W-q[1])*k],c=CUR.C[p.id],P=p.pts.map(T),Q=c.pts.map(T);
    s+=`<polygon class="dash" points="${P.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/><polygon class="l" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;
    const cx=Q.reduce((a,q)=>a+q[0],0)/Q.length,cy=Q.reduce((a,q)=>a+q[1],0)/Q.length;s+=`<text class="big" x="${r2(cx)}" y="${r2(cy+1.7)}" text-anchor="middle">${p.no}</text>`;
    Q.forEach((a,i)=>{const b=Q[(i+1)%Q.length],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=mx-cx,dy=my-cy,l=Math.hypot(dx,dy)||1,len=Math.hypot(c.pts[(i+1)%Q.length][0]-c.pts[i][0],c.pts[(i+1)%Q.length][1]-c.pts[i][1]);
      const pl=Math.hypot(b[0]-a[0],b[1]-a[1]);if(pl>5)s+=`<text class="sm" x="${r2(mx+dx/l*3)}" y="${r2(my+dy/l*3+.8)}" text-anchor="middle">${Math.round(len)}</text>`;const g=p.segs[i];
      if(g&&g.nb>=0&&pl>16)s+=`<text class="nb" x="${r2(mx-dx/l*3.2)}" y="${r2(my-dy/l*3.2+.7)}" text-anchor="middle">→${CUR.R.parts[g.nb].no} ${angT(g.dih)}</text>`;});
    if(c.bad)s+=`<text class="nb" x="${r2(ox)}" y="${r2(oy-2)}">выродилась — проверьте</text>`;
    x+=w;rowH=Math.max(rowH,h);});
  if(s)flush();return out;}

/* ---------- уголки-шаблоны для сварки (галочка): все уголки 1:2 с надписью, как ставить ---------- */
function sheetsTpl(){const T=CUR.TPL||[],n=2.5,k=1/n,cw=43,ch=33,cols=9,rows=7,out=[];
  for(let i=0;i<T.length;i+=cols*rows){let s='';T.slice(i,i+cols*rows).forEach((o,j)=>{
      // буквой V: биссектриса угла — вверх, выемка у вершины — внизу
      const r=Math.PI/2-o.a*Math.PI/360,c=Math.cos(r),sn=Math.sin(r),R=o.pts.map(q=>[c*q[0]-sn*q[1],sn*q[0]+c*q[1]]),xs=R.map(q=>q[0]),ys=R.map(q=>q[1]),x0=Math.min(...xs),y1=Math.max(...ys),w=(Math.max(...xs)-x0)*k,h=(y1-Math.min(...ys))*k;
      const cx=25+(j%cols)*cw,cy=24+Math.floor(j/cols)*ch,ox=cx+(cw-w)/2,oy=cy+1+(ch-10-h)/2,Q=R.map(q=>[ox+(q[0]-x0)*k,oy+(y1-q[1])*k]);
      s+=`<polygon class="l" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/><text class="big" x="${r2(cx+cw/2)}" y="${r2(cy+ch-5)}" text-anchor="middle">${tplNo(o.a)}</text><text class="sm" x="${r2(cx+cw/2)}" y="${r2(cy+ch-1.8)}" text-anchor="middle">швов ${o.seams}${o.out?` (${o.out} снаружи)`:''}</text>`;});
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
    if(CUR.BL&&CUR.BL.length)s+=`<text class="sm" x="25" y="272">Г — заготовка со сгибами (гнутая) (развёртка и порядок гибки — на листах «Гибка»).</text>`;out.push({title:'Спецификация деталей',scale:'—',body:s});}
  return out;}

/* ---------- гибка: заготовки с линиями сгиба (вид изнутри — со стороны гравировки) и порядок гибки ---------- */
function sheetsBend(){const BL=CUR.BL||[];if(!BL.length)return [];const R=CUR.R,A=BL.map(b=>bendAlign(b.pts,true)),n=pickScale([Math.max(...A.map(t=>t.L)),Math.max(...A.map(t=>t.W))],[185,105]),k=1/n,out=[];
  const note=`<text class="sm" x="25" y="264">Вид изнутри — со стороны гравировки. V — гнуть на себя, m — от себя; число — угол между гранями после гибки, в скобках — порядок гибки (сначала крайние). Линия сгиба — тонкая штрихпунктирная с двумя точками (ГОСТ 2.303).</text>`
    +`<text class="sm" x="25" y="268">${ST.useT?`Контур — с поправкой на толщину ${ST.t} мм у сгиба (r = t, K = 0,33) и отступом под шов на свариваемых сторонах.`:'Без поправки на толщину листа.'} Внутри заготовки — номера её деталей по спецификации и порядку сборки.</text>`;
  let s='',x=25,y=24,rowH=0;const flush=()=>{out.push({title:'Гибка — заготовки',scale:scaleTxt(n),body:s+note});s='';x=25;y=24;rowH=0;};
  BL.forEach((b,i)=>{const t=A[i],w=t.L*k+16,h=t.W*k+18;if(x+w>415){x=25;y+=rowH;rowH=0;}if(y+h>258)flush();
    const ox=x+8,oy=y+9,P=q=>{const z=trPt(t,q);return [ox+z[0]*k,oy+(t.W-z[1])*k];},pts=b.pts.map(P),pl=Q=>Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ');
    s+=`<text class="h2" x="${r2(x+2)}" y="${r2(y+5)}">Г${b.no} · ${Math.round(t.L)} × ${Math.round(t.W)} мм · сгибов: ${b.lines.length}</text><polygon class="l" points="${pl(pts)}"/>`;
    b.lines.forEach(l=>l.segs.forEach((z,zi)=>{const a=P([z[0],z[1]]),c=P([z[2],z[3]]);s+=`<path class="bnd" d="M${r2(a[0])},${r2(a[1])}L${r2(c[0])},${r2(c[1])}"/>`;
      if(zi)return;let an=Math.atan2(c[1]-a[1],c[0]-a[0])*180/Math.PI;if(an>90)an-=180;if(an<-90)an+=180;const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2;
      s+=`<text class="nb" transform="translate(${r2(mx)},${r2(my)}) rotate(${r2(an)})" y="-.8" text-anchor="middle">${shEsc(bendTxt(l))}</text>`;}));
    b.regions.forEach(z=>{const ip=innerPoint(z.pts.map(q=>trPt(t,q)));if(!ip)return;const c=[ox+ip.p[0]*k,oy+(t.W-ip.p[1])*k];s+=`<text class="no" x="${r2(c[0])}" y="${r2(c[1]+.9)}" text-anchor="middle">${R.parts[z.pi].no}</text>`;});
    x+=w;rowH=Math.max(rowH,h);});
  if(s)flush();
  // порядок гибки — таблицей
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
  else{const B=CUR.BL[+o.id.slice(1)],T=q=>trPt(o.tr,q);r={eng:[],miss:[],V:[],M:[]};
    B.lines.forEach(l=>{const S=l.segs.map(z=>{const a=T([z[0],z[1]]),b=T([z[2],z[3]]);return [a[0],a[1],b[0],b[1]];});(l.kind==='V'?r.V:r.M).push(...S);
      if(eng&&S.length){const z=S.reduce((a,b)=>Math.hypot(b[2]-b[0],b[3]-b[1])>Math.hypot(a[2]-a[0],a[3]-a[1])?b:a),g=bendLabel(bendTxt(l),z,o.pts);if(g)r.eng.push(...g);else r.miss.push(o.no+' сгиб '+bendTxt(l));}});
    if(eng)B.regions.forEach(z=>{const no=CUR.R.parts[z.pi].no,g=engraveSegs(no,z.pts.map(T));if(g)r.eng.push(...g);else r.miss.push('№'+no);});}
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

function buildSheets(){if(!CUR||!CUR.R.parts.length)return [];const L=[sheetGeneral(),...sheetsAssembly(),...sheetsParts(),...sheetsBend(),...sheetsSpec(),...(CUR.TPL&&CUR.TPL.length?sheetsTpl():[]),...sheetsNest()],d=new Date(),date=`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  return L.map((b,i)=>({title:b.title,svg:wrapSheet(b,{n:i+1,N:L.length,date})}));}

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

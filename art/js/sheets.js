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
const SH_STYLE=`<style>.l{fill:none;stroke:#000;stroke-width:.35;stroke-linejoin:round}.t{fill:none;stroke:#000;stroke-width:.18}.dash{fill:none;stroke:#000;stroke-width:.15;stroke-dasharray:1.2 .8}.fr{fill:none;stroke:#000;stroke-width:.7}.eng{fill:none;stroke:#c33;stroke-width:.12}.small{fill:none;stroke:#c33;stroke-width:.35}.fc{stroke:#000;stroke-width:.15;stroke-linejoin:round}.ar{fill:#000}text{font-family:"Arial Narrow",Arial,sans-serif;font-style:italic;fill:#000;font-size:3.5px}.hd{font-size:6px}.h2{font-size:4.5px}.sm,.lb{font-size:2.3px}.td{font-size:2.8px}.no{font-size:2.6px;font-style:normal;font-weight:bold}.nb{font-size:2.1px;fill:#a33}.big{font-size:5px;font-style:normal;font-weight:bold}</style>`;
// рамка и основная надпись (только email — по просьбе автора)
function wrapSheet(b,o){const x=230,y=276,c=[95,30,30,30],cell=(i,row,lab,val)=>{const xx=x+c.slice(0,i).reduce((s,v)=>s+v,0),yy=y+row*8;return `<text class="lb" x="${xx+1}" y="${yy+2.6}">${lab}</text><text class="td" x="${xx+1.2}" y="${yy+6.6}">${shEsc(val)}</text>`;};
  let xs=x,v='';c.slice(0,-1).forEach(w=>{xs+=w;v+=`M${xs},${y}V${y+16}`;});const nm=ST.name||'Фигура';
  const tb=`<rect class="fr" x="${x}" y="${y}" width="185" height="16"/><path class="t" d="M${x},${y+8}H415${v}"/>`+cell(0,0,'Изделие',nm)+cell(1,0,'Масштаб',b.scale||'—')+cell(2,0,'Масса',`≈ ${fmt(CUR.T.mass,1)} кг`)+cell(3,0,'Металл',`${ST.t} мм`)
    +cell(0,1,'email',SH_EMAIL)+cell(1,1,'Дата',o.date)+cell(2,1,'Лист',String(o.n))+cell(3,1,'Листов',String(o.N));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm">${SH_STYLE}<rect width="420" height="297" fill="#fff"/><rect class="fr" x="20" y="5" width="395" height="287"/><path class="l" d="M20,17H415"/>`
    +`<text class="hd" x="25" y="13.5">${shEsc(nm)}</text><text class="h2" x="410" y="13.5" text-anchor="end">${shEsc(b.title)}</text>${b.body}${tb}<text class="sm" x="415" y="295.6" text-anchor="end">Формат А3</text></svg>`;}

/* ---------- фигура гранями: проекция, тень по нормали, номера ---------- */
function projBox(view){const b=[1e9,1e9,-1e9,-1e9];CUR.M3.V.forEach(p=>{const q=prjV(view,p);b[0]=Math.min(b[0],q[0]);b[1]=Math.min(b[1],q[1]);b[2]=Math.max(b[2],q[0]);b[3]=Math.max(b[3],q[1]);});return b;}
const grey=v=>{const c=Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0');return '#'+c+c+c;};
function facesSVG(view,k,ox,oy,o={}){const V=CUR.M3.V,L=V3.norm(V3.add(V3.add(view.d,V3.mul(view.up,.7)),V3.mul(view.r,-.4)));
  const P=(p)=>{const q=prjV(view,p);return [ox+q[0]*k,oy+q[1]*k];};let s='',lb='';
  CUR.R.parts.filter(p=>(!o.only||o.only(p))&&V3.dot(p.n,view.d)>.02).sort((a,b)=>V3.dot(a.c,view.d)-V3.dot(b.c,view.d)).forEach(p=>{
    const pts=p.full.map(i=>P(V[i])),sh=.5+.45*Math.max(0,V3.dot(p.n,L));const fill=o.color?o.color(p,sh):grey(.35+.6*sh);
    s+=`<polygon class="fc" fill="${fill}" points="${pts.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;
    if(o.label&&o.label(p)){const c=P(p.c),a=Math.abs(area2(pts));if(a>12)lb+=`<text class="no" x="${r2(c[0])}" y="${r2(c[1]+.9)}" text-anchor="middle">${p.no}</text>`;}});
  return s+lb;}

/* ---------- 1. общий вид ---------- */
function sheetGeneral(){const T=CUR.T,b=meshBox(CUR.M3.V),[W,H,D]=b.size,bf=projBox(VIEWS.front),bl=projBox(VIEWS.left),bt=projBox(VIEWS.top);
  const n=pickScale([W+D,H+D],[235,215]),k=1/n,x0=48,y0=32,fx=x0-bf[0]*k,fy=y0-bf[1]*k,gap=26;
  const lx=x0+(bf[2]-bf[0])*k+gap-bl[0]*k,ly=fy,tx=fx,ty=y0+(bf[3]-bf[1])*k+gap-bt[1]*k;
  let s=facesSVG(VIEWS.front,k,fx,fy,{label:()=>1})+facesSVG(VIEWS.left,k,lx,ly)+facesSVG(VIEWS.top,k,tx,ty);
  const F=[x0,y0,x0+(bf[2]-bf[0])*k,y0+(bf[3]-bf[1])*k],Lb=[lx+bl[0]*k,ly+bl[1]*k,lx+bl[2]*k,ly+bl[3]*k],Tb=[tx+bt[0]*k,ty+bt[1]*k,tx+bt[2]*k,ty+bt[3]*k];
  s+=dimV(F[0],F[1],F[0],F[3],F[0]-10,Math.round(H))+dimH(Tb[0],Tb[3],Tb[2],Tb[3],Tb[3]+9,Math.round(W))+dimH(Lb[0],Lb[3],Lb[2],Lb[3],Lb[3]+9,Math.round(D));
  s+=`<text class="sm" x="${r2((F[0]+F[2])/2)}" y="${r2(F[1]-3)}" text-anchor="middle">Вид спереди</text><text class="sm" x="${r2((Lb[0]+Lb[2])/2)}" y="${r2(Lb[1]-3)}" text-anchor="middle">Вид слева</text><text class="sm" x="${r2((Tb[0]+Tb[2])/2)}" y="${r2(Tb[1]-3)}" text-anchor="middle">Вид сверху</text>`;
  const [sl,sw]=sheetWL(),rows=[['Материал',MATN[ST.mat]],['Толщина листа',ST.t+' мм'],['Деталей',T.n],['Площадь металла',fmt(T.area/1e6,2)+' м²'],['Масса',`≈ ${fmt(T.mass,1)} кг`],
    ['Длина реза',fmt(CUR.cutLen/1000,1)+' м'],['Длина швов',fmt(T.weld/1000,1)+' м'],['Зазор шва',ST.gap+' мм'],[`Листов ${sw}×${sl}`,CUR.N.sheets.length+` (заполнение ${Math.round(CUR.N.used*100)}%)`]];
  s+=svgTable(300,22,[{t:'Параметр',w:58},{t:'Значение',w:55}],rows,6.5);
  const bi=projBox(VIEWS.iso),ki=Math.min(110/(bi[2]-bi[0]),150/(bi[3]-bi[1]));s+=facesSVG(VIEWS.iso,ki,300+(113-(bi[2]-bi[0])*ki)/2-bi[0]*ki,95+(160-(bi[3]-bi[1])*ki)/2-bi[1]*ki);
  s+=`<text class="sm" x="300" y="268">Номера на гранях — номера деталей (вид спереди). Порядок сборки — следующие листы.</text>`;
  return {title:'Общий вид',scale:scaleTxt(n),body:s};}

/* ---------- 2. порядок сборки ---------- */
function sheetsAssembly(){const ps=[...CUR.R.parts].sort((a,b)=>a.no-b.no),n=ps.length,g=n<=30?3:n<=90?5:8,steps=[];for(let i=0;i<n;i+=g)steps.push(ps.slice(i,i+g));
  const bi=projBox(VIEWS.iso),cw=130,ch=124,k=Math.min((cw-10)/(bi[2]-bi[0]),84/(bi[3]-bi[1])),out=[];
  for(let si=0;si<steps.length;si+=6){let s='';steps.slice(si,si+6).forEach((st,j)=>{const cx=25+(j%3)*cw,cy=22+Math.floor(j/3)*ch,hi=st[st.length-1].no,lo=st[0].no,isNew=p=>p.no>=lo&&p.no<=hi;
      s+=`<rect class="t" x="${cx}" y="${cy}" width="${cw}" height="${ch}"/><text class="h2" x="${cx+3}" y="${cy+6}">Шаг ${si+j+1} · дет. ${lo}${hi>lo?'–'+hi:''}</text>`;
      s+=facesSVG(VIEWS.iso,k,cx+(cw-(bi[2]-bi[0])*k)/2-bi[0]*k,cy+9-bi[1]*k,{only:p=>p.no<=hi,color:(p,sh)=>isNew(p)?`rgb(${Math.round(200+50*sh)},${Math.round(110+60*sh)},${Math.round(50+40*sh)})`:grey(.55+.4*sh),label:isNew});
      let ty=cy+97;st.forEach(p=>{const nb=p.segs.filter(q=>q.nb>=0&&CUR.R.parts[q.nb].no<p.no).map(q=>`${CUR.R.parts[q.nb].no} (${angT(q.dih)})`);
        const t=`№${p.no} → ${nb.length?nb.join(', '):'первая — от неё собираем'}`;s+=`<text class="sm" x="${cx+3}" y="${r2(ty)}">${shEsc(t.length>78?t.slice(0,77)+'…':t)}</text>`;ty+=3.1;});});
    out.push({title:'Порядок сборки',scale:'—',body:s});}
  return out;}

/* ---------- 3. детали: развёртки с контуром реза ---------- */
function sheetsParts(){const ps=[...CUR.R.parts].sort((a,b)=>a.no-b.no),maxL=Math.max(...ps.map(p=>p.L)),maxW=Math.max(...ps.map(p=>p.W));
  const n=pickScale([maxL,maxW],[150,100]),k=1/n,out=[];let s='',x=25,y=24,rowH=0;const flush=()=>{out.push({title:'Детали — развёртки',scale:scaleTxt(n),body:s+`<text class="sm" x="25" y="272">Жирная линия — контур реза (с учётом толщины ${ST.t} мм и шва ${ST.gap} мм), пунктир — грань по поверхности. У сторон: длина реза, мм; красным — номер соседа и угол между листами.</text>`});s='';x=25;y=24;rowH=0;};
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

/* ---------- 4. спецификация ---------- */
function sheetsSpec(){const ps=[...CUR.R.parts].sort((a,b)=>a.no-b.no),dens=DENS[ST.mat]||7850,cols=[{t:'№',w:9,r:1},{t:'Габарит реза, мм',w:28},{t:'Площ., см²',w:17,r:1},{t:'Масса, кг',w:16,r:1},{t:'Рез, мм',w:15,r:1},{t:'Кол.',w:9,r:1},{t:'Сваривается с (угол)',w:91}];
  const rows=ps.map(p=>{const c=CUR.C[p.id],xs=c.pts.map(q=>q[0]),ys=c.pts.map(q=>q[1]),a=Math.abs(area2(c.pts));let per=0;c.pts.forEach((q,i)=>{const z=c.pts[(i+1)%c.pts.length];per+=Math.hypot(z[0]-q[0],z[1]-q[1]);});
    return [p.no,`${Math.round(Math.max(...xs)-Math.min(...xs))} × ${Math.round(Math.max(...ys)-Math.min(...ys))}`,fmt(a/100,1),fmt(a*1e-9*ST.t*dens,3),Math.round(per),1,p.segs.filter(g=>g.nb>=0).map(g=>CUR.R.parts[g.nb].no+' '+angT(g.dih)).join(', ')];});
  const per=38,out=[];for(let i=0;i<rows.length;i+=per*2){let s=svgTable(25,22,cols,rows.slice(i,i+per),6.2);if(rows.length>i+per)s+=svgTable(222,22,cols,rows.slice(i+per,i+per*2),6.2);out.push({title:'Спецификация деталей',scale:'—',body:s});}
  return out;}

/* ---------- для цены резки: длина реза, врезки, гравировка ---------- */
const perim=P=>P.reduce((a,q,i)=>{const z=P[(i+1)%P.length];return a+Math.hypot(z[0]-q[0],z[1]-q[1]);},0);
function cutStats(items){let cut=0,eng=0,pierce=0,engN=0;items.forEach(o=>{cut+=perim(o.pts);pierce++;if(ST.engrave){const g=engraveSegs(o.no,o.pts);if(g){engN++;g.forEach(z=>eng+=Math.hypot(z[2]-z[0],z[3]-z[1]));}}});return {cut,eng,pierce,engN};}
const cutTxt=c=>`рез ${fmt(c.cut/1000,1)} м · врезок ${c.pierce}${ST.engrave?` · гравировка ${fmt(c.eng/1000,1)} м`:''}`;
/* ---------- 5. раскрой листа ---------- */
function sheetsNest(){const N=CUR.N,n=N.sheets.length===1?pickScale([N.W,N.H],[385,235]):pickScale([N.W,N.H],[385,108]),k=1/n,out=[],[sl,sw]=sheetWL();
  for(let i=0;i<N.sheets.length;i+=2){let s='';N.sheets.slice(i,i+2).forEach((sh,j)=>{const ox=25+(385-N.W*k)/2,oy=30+j*125;
      s+=`<text class="h2" x="25" y="${oy-3}">Лист металла ${i+j+1} из ${N.sheets.length} · ${sw} × ${sl} · ${ST.t} мм, ${MATN[ST.mat]} · деталей ${sh.items.length} · детали в полосе ${sw} × ${Math.round(sh.len)} мм (плотность ${Math.round(sh.dense*100)}%), остальное свободно · зазор ${N.gap} мм · ${cutTxt(cutStats(sh.items))}</text><rect class="l" x="${r2(ox)}" y="${oy}" width="${r2(N.W*k)}" height="${r2(N.H*k)}"/>`;
      const T=(x,y)=>[ox+(x)*k,oy+(N.H-y)*k];   // как в DXF: y вверх
      const small=[];sh.items.forEach(o=>{const Q=o.pts.map(q=>T(o.x+q[0],o.y+q[1]));const g=ST.engrave?engraveSegs(o.no,o.pts):null;if(ST.engrave&&!g)small.push(o.no);
        s+=`<polygon class="${ST.engrave&&!g?'small':'t'}" points="${Q.map(q=>r2(q[0])+','+r2(q[1])).join(' ')}"/>`;
        if(g)s+=`<path class="eng" d="${g.map(z=>{const a=T(z[0],z[1]),b=T(z[2],z[3]);return 'M'+r2(a[0])+','+r2(a[1])+'L'+r2(b[0])+','+r2(b[1]);}).join('')}"/>`;
        else if(!ST.engrave){const cx=Q.reduce((a,q)=>a+q[0],0)/Q.length,cy=Q.reduce((a,q)=>a+q[1],0)/Q.length;s+=`<text class="no" x="${r2(cx)}" y="${r2(cy+.9)}" text-anchor="middle">${o.no}</text>`;}});
      if(small.length)s+=`<text class="h2" x="25" y="${r2(oy+N.H*k+8)}" fill="#c33">Без гравировки — малы для цифр 3 мм (обведены красным): ${small.map(n=>'№'+n).join(', ')}</text>`;});
    out.push({title:'Раскрой листа',scale:scaleTxt(n),body:s});}
  if(N.too.length)out.push({title:'Раскрой листа',scale:'—',body:`<text class="h2" x="25" y="40">Не влезают в лист: ${N.too.map(o=>'№'+o.no).join(', ')} — выберите лист больше или уменьшите фигуру</text>`});
  return out;}

function buildSheets(){if(!CUR||!CUR.R.parts.length)return [];const L=[sheetGeneral(),...sheetsAssembly(),...sheetsParts(),...sheetsSpec(),...sheetsNest()],d=new Date(),date=`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  return L.map((b,i)=>({title:b.title,svg:wrapSheet(b,{n:i+1,N:L.length,date})}));}

/* ---------- DXF: раскрой (все листы) и детали (сеткой) ---------- */
function segNbOf(p){return p.segs.map(g=>g.nb>=0?CUR.R.parts[g.nb].no:null);}
function dxfNest(){const N=CUR.N,e=[];N.sheets.forEach((sh,i)=>{const oy=i*(N.H+200);dxfPoly(e,[[0,0],[N.W,0],[N.W,N.H],[0,N.H]],'SHEET',0,oy);dxfTxt(e,N.W/2,N.H+60+oy,40,`SHEET ${i+1}`,"SHEET");
  sh.items.forEach(o=>{dxfPoly(e,o.pts,"CUT",o.x,o.y+oy);if(ST.engrave){const g=engraveSegs(o.no,o.pts);if(g)dxfSegs(e,g,"ENGRAVE",o.x,o.y+oy);}});});return dxfDoc(e);}
function dxfParts(){const ps=[...CUR.R.parts].sort((a,b)=>a.no-b.no),e=[];let x=0,y=0,rowH=0;const rowW=Math.max(1500,Math.max(...ps.map(p=>p.L))+50);
  ps.forEach(p=>{const c=CUR.C[p.id];if(x+p.L>rowW){x=0;y+=rowH+30;rowH=0;}// с гравировкой — зеркально, внутренней стороной вверх
    const P=ST.engrave?c.pts.map(q=>[p.L-q[0],q[1]]):c.pts;dxfPoly(e,P,'CUT',x,y);if(ST.engrave){const g=engraveSegs(p.no,P);if(g)dxfSegs(e,g,'ENGRAVE',x,y);}x+=p.L+30;rowH=Math.max(rowH,p.W);});return dxfDoc(e);}

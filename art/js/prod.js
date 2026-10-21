/* ---------- Производство: контур реза под толщину и шов, раскладка на лист, DXF ----------
   Деталь лежит лицом на поверхности фигуры, рез перпендикулярный.
   Выпуклый шов (угол между листами θ < 180°): сторона уходит внутрь на gap/2 + t/tan(θ/2) — внутренние кромки сходятся,
   снаружи остаётся V-канавка под сварку. Вогнутый — на gap/2. Открытый край — на месте. */

function edgeSetback(g,t,gap,useT){if(g.nb<0)return 0;let s=gap/2;if(useT&&g.dih<179.5)s+=Math.min(2*t,t/Math.tan(g.dih*Math.PI/360));return s;}   // на острых углах — не больше 2t, остальное заберёт шов
const area2=P=>{let a=0;P.forEach((p,i)=>{const q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];});return a/2;};
// контур реза детали p в тех же координатах, что p.pts; bad — деталь выродилась
function cutContour(p,t,gap,useT){const P=p.pts,n=P.length;if(n<3)return {pts:[],bad:true,s:[]};const ccw=area2(P)>0?1:-1;
  const s=p.segs.map(g=>edgeSetback(g,t,gap,useT));
  const L=P.map((a,i)=>{const b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*ccw,ny=dx/l*ccw;return {p:[a[0]+nx*s[i],a[1]+ny*s[i]],d:[dx/l,dy/l]};});
  // стороны сдвинуты внутрь; соседние пересекаем. Короткая сторона между острыми углами при сдвиге выворачивается — её убираем, соседи сходятся
  const meet=(pr,cur)=>{const den=pr.d[0]*cur.d[1]-pr.d[1]*cur.d[0];if(Math.abs(den)<1e-9)return cur.p.slice();const w=[cur.p[0]-pr.p[0],cur.p[1]-pr.p[1]],k=(w[0]*cur.d[1]-w[1]*cur.d[0])/den;return [pr.p[0]+pr.d[0]*k,pr.p[1]+pr.d[1]*k];};
  const act=L.map((_,i)=>i);let Q;
  for(;;){const m=act.length;Q=act.map((ci,k)=>meet(L[act[(k+m-1)%m]],L[ci]));
    let worst=-1,wv=0;act.forEach((ci,k)=>{const a=Q[k],b=Q[(k+1)%m],v=(b[0]-a[0])*L[ci].d[0]+(b[1]-a[1])*L[ci].d[1];if(v<wv){wv=v;worst=k;}});
    if(worst<0||m<=3)break;act.splice(worst,1);}
  // выродилась: сторона всё равно перевернулась или площадь ≤ 0
  let bad=act.length<3||area2(Q)*ccw<=1;Q.forEach((a,i)=>{const b=Q[(i+1)%Q.length];if((b[0]-a[0])*L[act[i]].d[0]+(b[1]-a[1])*L[act[i]].d[1]<=0)bad=true;});
  return {pts:Q,bad,s};}

/* ---------- подложка за прорезью (глаз): открытая петля не у стены → плоская деталь ----------
   Контур — выпуклая оболочка прорези + нахлёст BACK_LAP; приваривается изнутри по краю прорези, утоплена на BACK_DEPTH */
const BACK_LAP=8,BACK_DEPTH=8;
function openLoops(V,F){const E=new Set();F.forEach(f=>{for(let k=0;k<3;k++)E.add(f[k]+'_'+f[(k+1)%3]);});const nx=new Map();F.forEach(f=>{for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3];if(!E.has(b+'_'+a))nx.set(a,b);}});
  const used=new Set(),L=[];nx.forEach((_,s)=>{if(used.has(s))return;const Q=[];let v=s;while(v!==undefined&&!used.has(v)){used.add(v);Q.push(v);v=nx.get(v);}if(Q.length>=3)L.push(Q);});return L;}
// выпуклый многоугольник шире на d (стороны сдвинуты наружу)
function growConvex(P,d){const n=P.length,ccw=area2(P)>0?1:-1,L=P.map((a,i)=>{const b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return {p:[a[0]+dy/l*ccw*d,a[1]-dx/l*ccw*d],d:[dx/l,dy/l]};});
  return L.map((cur,i)=>{const pr=L[(i+n-1)%n],den=pr.d[0]*cur.d[1]-pr.d[1]*cur.d[0];if(Math.abs(den)<1e-9)return cur.p.slice();const w=[cur.p[0]-pr.p[0],cur.p[1]-pr.p[1]],k=(w[0]*cur.d[1]-w[1]*cur.d[0])/den;return [pr.p[0]+pr.d[0]*k,pr.p[1]+pr.d[1]*k];});}
// добавить подложки в R.parts; вернуть длину их швов (по краю прорези)
function addBacking(R,M3){const {V,F}=M3;if(!V.length)return 0;const ctr=V3.mul(V.reduce((s,p)=>V3.add(s,p),[0,0,0]),1/V.length);let wl=0;
  openLoops(V,F).forEach(Q=>{if(Q.every(i=>Math.abs(V[i][2])<1))return;   // край у стены — не прорезь
    let n=[0,0,0];Q.forEach((i,j)=>{const a=V[i],b=V[Q[(j+1)%Q.length]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);});n=V3.norm(n);
    const c=V3.mul(Q.reduce((s,i)=>V3.add(s,V[i]),[0,0,0]),1/Q.length);if(V3.dot(n,V3.sub(c,ctr))<0)n=V3.mul(n,-1);
    let u=V3.sub(V[Q[0]],c);u=V3.norm(V3.sub(u,V3.mul(n,V3.dot(u,n))));const w=V3.cross(n,u);
    const G=growConvex(convexHull(Q.map(i=>{const d=V3.sub(V[i],c);return [V3.dot(d,u),V3.dot(d,w)];})),BACK_LAP);
    // как у flatten: узкая сторона — по Y, от нуля
    let bw=Infinity,ba=0;G.forEach((p,i)=>{const q=G[(i+1)%G.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),cs=Math.cos(a),sn=Math.sin(a);let mn=1e9,mx=-1e9;G.forEach(h=>{const y=-sn*h[0]+cs*h[1];mn=Math.min(mn,y);mx=Math.max(mx,y);});if(mx-mn<bw){bw=mx-mn;ba=a;}});
    const cs=Math.cos(-ba),sn=Math.sin(-ba);let pts=G.map(p=>[cs*p[0]-sn*p[1],sn*p[0]+cs*p[1]]);const mnx=Math.min(...pts.map(p=>p[0])),mny=Math.min(...pts.map(p=>p[1]));pts=pts.map(p=>[p[0]-mnx,p[1]-mny]);
    const segs=pts.map((p,i)=>({len:Math.hypot(pts[(i+1)%pts.length][0]-p[0],pts[(i+1)%pts.length][1]-p[1]),nb:-1}));
    Q.forEach((i,j)=>{wl+=V3.len(V3.sub(V[Q[(j+1)%Q.length]],V[i]));});
    R.parts.push({id:R.parts.length,no:R.parts.length+1,back:true,tris:[],n,c,area:Math.abs(area2(pts)),loop:[],full:Q.slice(),holes:0,adj:[],pts,segs,L:Math.max(...pts.map(p=>p[0])),W:Math.max(...pts.map(p=>p[1])),minW:bw,perim:segs.reduce((a,g)=>a+g.len,0)});});
  return wl;}

// ---------- раскладка по форме ----------
// Лист — сетка клеток cell мм. Каждая деталь пробуется во всех положениях «сторона вдоль листа» (и перевёрнутой);
// ставим туда, где правый край раскладки получается ближе всего к началу листа — детали заполняют пустоты между собой.
// Занятость — клетки, которых касается деталь; проверка — та же деталь, расширенная на зазор. W — длинная сторона листа.
function ptSegD(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function inPoly(p,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function segX(a,b,c,d){const o=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]));return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;}
function polyGap(A,B){let d=Infinity;for(let i=0;i<A.length;i++){const a=A[i],a2=A[(i+1)%A.length];for(let j=0;j<B.length;j++){const b=B[j],b2=B[(j+1)%B.length];if(segX(a,a2,b,b2))return 0;d=Math.min(d,ptSegD(a,b,b2),ptSegD(b,a,a2));}}if(inPoly(A[0],B)||inPoly(B[0],A))return 0;return d;}
function polyDist(P){return p=>{let d=Infinity;P.forEach((a,i)=>{d=Math.min(d,ptSegD(p,a,P[(i+1)%P.length]));});return d;};}
function nestOrient(P,cell,r,flips=[false,true]){const out=[],seen=new Set();
  flips.forEach(flip=>{const Q0=flip?P.map(p=>[-p[0],p[1]]):P;Q0.forEach((a,i)=>{const b=Q0[(i+1)%Q0.length];[0,Math.PI].forEach(add=>{
    const ang=-Math.atan2(b[1]-a[1],b[0]-a[0])+add,c=Math.cos(ang),s=Math.sin(ang);let Q=Q0.map(p=>[c*p[0]-s*p[1],s*p[0]+c*p[1]]);
    const mx=Math.min(...Q.map(q=>q[0])),my=Math.min(...Q.map(q=>q[1]));Q=Q.map(q=>[q[0]-mx,q[1]-my]);
    const key=Q.map(q=>Math.round(q[0])+','+Math.round(q[1])).sort().join(';');if(seen.has(key))return;seen.add(key);
    // клетки, чьи центры внутри детали, раздутой на ползазора (r — ползазора, мм); точный зазор проверяется отдельно
    const o=Math.ceil(r/cell)+1,w=Math.ceil(Math.max(...Q.map(q=>q[0]))/cell)+2*o+1,h=Math.ceil(Math.max(...Q.map(q=>q[1]))/cell)+2*o+1,core=new Uint8Array(w*h),dist=polyDist(Q);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=[(x-o+.5)*cell,(y-o+.5)*cell];if(inPoly(p,Q)||dist(p)<=r)core[y*w+x]=1;}
    const rows=m=>{const R=[];for(let y=0;y<h;y++){let x=0;const iv=[];while(x<w){if(m[y*w+x]){const s0=x;while(x<w&&m[y*w+x])x++;iv.push([s0,x-1]);}else x++;}R.push(iv);}return R;};
    const cr=rows(core);out.push({Q,w,h,o,core:cr,dil:cr,flip});});});});
  return out;}
function nest(...a){const g=nestGen(...a);let v;do{v=g.next();}while(!v.done);return v.value;}
// innerUp: деталь кладём зеркально — внутренней стороной вверх, гравировка номера уйдёт внутрь фигуры (лазер гравирует верх листа).
// Развёртка p.pts смотрит наружной стороной на нас (нормаль к зрителю), поэтому «внутрь вверх» = только зеркальные положения.
function* nestGen(items,W,H,gap,margin,cell=2.5,mode=2,innerUp=false){const r=gap/2,GW=Math.floor((W-2*margin)/cell),GH=Math.floor((H-2*margin)/cell);
  const it=items.map(o=>({id:o.id,no:o.no,area:Math.abs(area2(o.pts)),or:nestOrient(o.pts,cell,r,innerUp?[true]:[false,true])})).sort((a,b)=>mode===2?Math.max(...b.or.map(o=>o.w))-Math.max(...a.or.map(o=>o.w)):b.area-a.area);
  const sheets=[],too=[];
  const newSheet=()=>{const sh={items:[],occ:new Uint8Array(GW*GH),pre:new Int32Array((GW+1)*GH),len:0};sheets.push(sh);return sh;};
  const free=(sh,R,x,y)=>{for(let ry=0;ry<R.length;ry++){const iv=R[ry];if(!iv.length)continue;const base=(y+ry)*(GW+1);for(const [a,b] of iv)if(sh.pre[base+x+b+1]-sh.pre[base+x+a])return false;}return true;};
  const gapOK=(sh,o,x,y)=>{const ox=margin+(x+o.o)*cell,oy=margin+(y+o.o)*cell,P=o.Q.map(q=>[q[0]+ox,q[1]+oy]),bx=[Math.min(...P.map(p=>p[0]))-gap,Math.min(...P.map(p=>p[1]))-gap,Math.max(...P.map(p=>p[0]))+gap,Math.max(...P.map(p=>p[1]))+gap];
    if(bx[0]<margin-.01||bx[1]<margin-.01||bx[2]>W-margin+gap+.01||bx[3]>H-margin+gap+.01)return false;
    for(const it of sh.items){const b=it.bb;if(b[0]>bx[2]||b[2]<bx[0]||b[1]>bx[3]||b[3]<bx[1])continue;if(polyGap(P,it.pts)<gap)return false;}return true;};
  const fit=(sh,o,limit)=>{for(let x=0;x+o.w<=GW;x++){if(x+o.w>=limit)return null;for(let y=0;y+o.h<=GH;y++)if(free(sh,o.dil,x,y)&&gapOK(sh,o,x,y))return {x,y};}return null;};
  const place=(sh,o,x,y)=>{o.core.forEach((iv,ry)=>{const Y=y+ry;if(Y>=GH)return;iv.forEach(([a,b])=>{for(let X=x+a;X<=x+b&&X<GW;X++)sh.occ[Y*GW+X]=1;});
      const base=Y*(GW+1);let acc=0;for(let X=0;X<GW;X++){sh.pre[base+X]=acc;acc+=sh.occ[Y*GW+X];}sh.pre[base+GW]=acc;});};
  for(let pi=0;pi<it.length;pi++){const p=it[pi];let done=false;yield {done:pi,of:it.length};
    for(const sh of sheets.concat([null])){const S=sh||newSheet();let best=null;
      p.or.forEach(o=>{if(o.w>GW||o.h>GH)return;const f=fit(S,o,best?(mode?best.x+1+o.w:best.score):Infinity);if(f){const score=mode?f.x*1e4+f.y:f.x+o.w;if(!best||score<best.score||score===best.score&&f.y<best.y)best={o,...f,score,right:f.x+o.w};}});
      if(best){place(S,best.o,best.x,best.y);const ox=margin+(best.x+best.o.o)*cell,oy=margin+(best.y+best.o.o)*cell;
        const pts=best.o.Q.map(q=>[q[0]+ox,q[1]+oy]);S.items.push({id:p.id,no:p.no,flip:best.o.flip,area:p.area,x:0,y:0,pts,bb:[Math.min(...pts.map(q=>q[0])),Math.min(...pts.map(q=>q[1])),Math.max(...pts.map(q=>q[0])),Math.max(...pts.map(q=>q[1]))]});S.len=Math.max(S.len,margin+best.right*cell);done=true;break;}
      if(!sh){sheets.pop();break;}}
    if(!done)too.push({id:p.id,no:p.no});}
  sheets.forEach(s=>{const a=s.items.reduce((q,o)=>q+o.area,0);s.used=a/(W*H);s.dense=a/((s.len-margin)*(H-2*margin)||1);delete s.occ;delete s.pre;});
  return {sheets,too,W,H,gap,used:sheets.length?sheets.reduce((a,s)=>a+s.used,0)/sheets.length:0};}

/* ---------- DXF (R12, ASCII): LINE по контуру, TEXT — номера ---------- */
function dxfDoc(ents){return ['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$INSUNITS','70',4,'0','ENDSEC','0','SECTION','2','ENTITIES',...ents,'0','ENDSEC','0','EOF'].join('\r\n')+'\r\n';}
const dn=v=>Math.round(v*100)/100;
function dxfPoly(e,P,lay,ox=0,oy=0){P.forEach((a,i)=>{const b=P[(i+1)%P.length];e.push('0','LINE','8',lay,'10',dn(a[0]+ox),'20',dn(a[1]+oy),'30',0,'11',dn(b[0]+ox),'21',dn(b[1]+oy),'31',0);});}
function dxfTxt(e,x,y,h,t,lay='MARK'){e.push('0','TEXT','8',lay,'10',dn(x),'20',dn(y),'30',0,'40',dn(h),'1',t,'72',1,'73',2,'11',dn(x),'21',dn(y),'31',0);}
// номер в центре и номера соседей у сторон — для разметки
function dxfMarks(e,o,pts,ox,oy,segNb){const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length,cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),m=Math.min(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  dxfTxt(e,cx+ox,cy+oy,Math.max(4,Math.min(20,m*.25)),String(o.no));
  if(segNb)pts.forEach((a,i)=>{const nb=segNb[i];if(nb==null)return;const b=pts[(i+1)%pts.length],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=cx-mx,dy=cy-my,l=Math.hypot(dx,dy)||1,k=Math.min(8,l*.35);
    dxfTxt(e,mx+dx/l*k+ox,my+dy/l*k+oy,Math.max(2.5,Math.min(6,m*.08)),String(nb));});}

/* ---------- гравировка номера: цифры из линий (как на табло), лазер проходит их на малой мощности ----------
   Цифра — клетка 1×2 (y вверх, как в DXF), между цифрами 0,5. Под номером черта — видно, где низ (6 и 9 не перепутать). */
const DIGITS={0:[[[0,0],[1,0],[1,2],[0,2],[0,0]]],1:[[[.5,0],[.5,2],[.2,1.7]],[[.2,0],[.8,0]]],2:[[[0,2],[1,2],[1,1],[0,1],[0,0],[1,0]]],3:[[[0,2],[1,2],[1,0],[0,0]],[[0,1],[1,1]]],
  4:[[[0,2],[0,1],[1,1]],[[1,2],[1,0]]],5:[[[1,2],[0,2],[0,1],[1,1],[1,0],[0,0]]],6:[[[1,2],[0,2],[0,0],[1,0],[1,1],[0,1]]],7:[[[0,2],[1,2],[1,0]]],
  8:[[[0,0],[1,0],[1,2],[0,2],[0,0]],[[0,1],[1,1]]],9:[[[1,1],[0,1],[0,2],[1,2],[1,0],[0,0]]]};
// самое просторное место внутри детали: точка, дальше всего от кромок (перебор по сетке + уточнение)
function innerPoint(P){const d=polyDist(P),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);let best=null,bd=-1,step=Math.max(x1-x0,y1-y0)/24;
  for(let x=x0+step/2;x<x1;x+=step)for(let y=y0+step/2;y<y1;y+=step){const p=[x,y];if(!inPoly(p,P))continue;const v=d(p);if(v>bd){bd=v;best=p;}}
  if(!best)return null;for(let k=0;k<3;k++){step/=3;const c=best;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const p=[c[0]+i*step,c[1]+j*step];if(!inPoly(p,P))continue;const v=d(p);if(v>bd){bd=v;best=p;}}}
  return {p:best,r:bd};}
// отрезки гравировки номера внутри детали P (координаты те же, y вверх); null — деталь слишком узкая (меньше 3 мм высоты цифр)
function engraveSegs(no,P,o={}){const ip=innerPoint(P);if(!ip)return null;const t=String(no),n=t.length,uw=n*1.5-.5,uh=2.5,  // ширина/высота блока в единицах (с чертой)
    clear=o.clear??2,u=Math.min((o.maxH||20)/2,(ip.r-clear)/Math.hypot(uw/2,uh/2));if(2*u<(o.minH||3))return null;
  const ox=ip.p[0]-uw*u/2,oy=ip.p[1]-uh*u/2+.5*u,seg=[];
  [...t].forEach((ch,i)=>(DIGITS[ch]||[]).forEach(L=>{for(let k=0;k+1<L.length;k++)seg.push([ox+(i*1.5+L[k][0])*u,oy+L[k][1]*u,ox+(i*1.5+L[k+1][0])*u,oy+L[k+1][1]*u]);}));
  seg.push([ox,oy-.5*u,ox+uw*u,oy-.5*u]);return seg;}
function dxfSegs(e,S,lay,ox=0,oy=0){S.forEach(s=>e.push('0','LINE','8',lay,'62',lay==='ENGRAVE'?1:7,'10',dn(s[0]+ox),'20',dn(s[1]+oy),'30',0,'11',dn(s[2]+ox),'21',dn(s[3]+oy),'31',0));}

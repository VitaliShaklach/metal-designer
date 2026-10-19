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
  const Q=L.map((cur,i)=>{const pr=L[(i+n-1)%n],den=pr.d[0]*cur.d[1]-pr.d[1]*cur.d[0];
    if(Math.abs(den)<1e-9)return cur.p.slice();const w=[cur.p[0]-pr.p[0],cur.p[1]-pr.p[1]],k=(w[0]*cur.d[1]-w[1]*cur.d[0])/den;return [pr.p[0]+pr.d[0]*k,pr.p[1]+pr.d[1]*k];});
  // выродилась: перевернулась сторона или площадь стала ≤ 0
  let bad=area2(Q)*ccw<=1;Q.forEach((a,i)=>{const b=Q[(i+1)%n];if((b[0]-a[0])*L[i].d[0]+(b[1]-a[1])*L[i].d[1]<=0)bad=true;});
  return {pts:Q,bad,s};}

// раскладка полками: детали длинной стороной вдоль листа; W×H — лист (W — длинная сторона)
function nest(items,W,H,gap,margin){const it=items.map(o=>{const xs=o.pts.map(p=>p[0]),ys=o.pts.map(p=>p[1]),mx=Math.min(...xs),my=Math.min(...ys);
    let pts=o.pts.map(p=>[p[0]-mx,p[1]-my]),w=Math.max(...xs)-mx,h=Math.max(...ys)-my;if(h>w){pts=pts.map(p=>[p[1],w-p[0]]);[w,h]=[h,w];}
    return {id:o.id,no:o.no,pts,w,h,area:Math.abs(area2(o.pts))};}).sort((a,b)=>b.h-a.h||b.w-a.w);
  const sheets=[],too=[];let sh=null,x=0,y=0,rowH=0;const newSheet=()=>{sh={items:[]};sheets.push(sh);x=margin;y=margin;rowH=0;};
  it.forEach(o=>{if(o.w>W-2*margin||o.h>H-2*margin){too.push(o);return;}
    if(!sh)newSheet();if(x+o.w>W-margin){x=margin;y+=rowH+gap;rowH=0;}if(y+o.h>H-margin){newSheet();}
    sh.items.push({...o,x,y});x+=o.w+gap;rowH=Math.max(rowH,o.h);});
  sheets.forEach(s=>{s.used=s.items.reduce((a,o)=>a+o.area,0)/(W*H);});
  return {sheets,too,W,H,used:sheets.length?sheets.reduce((a,s)=>a+s.used,0)/sheets.length:0};}

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

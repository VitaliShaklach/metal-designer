/* ---------- Редактор: модель из граней-многоугольников E={V,P} ----------
   Операции: двигать точку, выдавить, поднять/вдавить центр, разрезать, удалить грань.
   Симметрия — по плоскости x=0: всё, что делаем справа, повторяется слева. */

// модель для расчёта: треугольники + какой треугольник из какой грани
function polyBase(V,P){const F=[],T=[];P.forEach((Q,pi)=>earClip(V,Q).forEach(t=>{F.push(t);T.push(pi);}));return {V,P,F,T};}
const ecopy=E=>({V:E.V.map(p=>p.slice()),P:E.P.map(Q=>Q.slice())});
function polyNorm(V,Q){let n=[0,0,0];Q.forEach((i,j)=>{const a=V[i],b=V[Q[(j+1)%Q.length]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);});return V3.norm(n);}
const polyC=(V,Q)=>V3.mul(Q.reduce((s,i)=>V3.add(s,V[i]),[0,0,0]),1/Q.length);
// насколько грань не плоская, мм
function polyDev(V,Q){if(Q.length<4)return 0;const n=polyNorm(V,Q),c=polyC(V,Q);return Math.max(...Q.map(i=>Math.abs(V3.dot(V3.sub(V[i],c),n))));}
// зеркальные точки: i ↔ j, если j = (−x, y, z); на середине — сама себе
function mirrorMap(V,tol=.6){const key=p=>Math.round(p[0]/tol)+','+Math.round(p[1]/tol)+','+Math.round(p[2]/tol),M=new Map();V.forEach((p,i)=>M.set(key(p),i));
  return V.map(p=>{if(Math.abs(p[0])<tol)return -2;const j=M.get(key([-p[0],p[1],p[2]]));return j===undefined?-1:j;});}  // -2 — на середине
function mirrorPoly(E,pi,mm){const Q=E.P[pi],t=Q.map(i=>mm[i]===-2?i:mm[i]);if(t.some(i=>i<0))return -1;const k=[...t].sort((a,b)=>a-b).join();
  return E.P.findIndex(R=>R.length===t.length&&[...R].sort((a,b)=>a-b).join()===k);}
function compact(E){const used=new Map(),V=[];const P=E.P.filter(Q=>Q.length>=3).map(Q=>Q.map(i=>{let j=used.get(i);if(j===undefined){j=V.length;V.push(E.V[i]);used.set(i,j);}return j;}));return {V,P};}
// точка на ребре: если уже есть — берём её
function vAt(E,p){const i=E.V.findIndex(q=>Math.abs(q[0]-p[0])<.05&&Math.abs(q[1]-p[1])<.05&&Math.abs(q[2]-p[2])<.05);if(i>=0)return i;E.V.push(p);return E.V.length-1;}
// вставить точку m в ребро a–b у всех граней (чтобы не было «щелей»)
function insertOnEdge(E,a,b,m){E.P.forEach(Q=>{for(let k=0;k<Q.length;k++){const x=Q[k],y=Q[(k+1)%Q.length];if(x===a&&y===b||x===b&&y===a){if(!Q.includes(m))Q.splice(k+1,0,m);return;}}});}

// сдвинуть точку; симметрия — зеркальную тоже; на середине x остаётся 0; край у стены (z=0) остаётся на стене
function moveVert(E,i,p,sym){const mm=sym?mirrorMap(E.V):null,open=openVerts(E),q=p.slice();
  if(sym&&mm[i]===-2)q[0]=0;if(open.has(i)&&Math.abs(E.V[i][2])<.5)q[2]=0;
  E.V[i]=q;if(sym&&mm[i]>=0)E.V[mm[i]]=[-q[0],q[1],q[2]];return E;}
function openVerts(E){const c=new Map();E.P.forEach(Q=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],key=a<b?a+'_'+b:b+'_'+a;c.set(key,(c.get(key)||0)+1);}));const s=new Set();c.forEach((n,k)=>{if(n===1)k.split('_').forEach(x=>s.add(+x));});return s;}

// операция над гранью и её зеркалом
function withMirror(E,pi,sym,fn){const mp=sym?mirrorPoly(E,pi,mirrorMap(E.V)):-1;const list=[pi];if(mp>=0&&mp!==pi)list.push(mp);
  const Qs=list.map(k=>E.P[k]);list.sort((a,b)=>b-a).forEach(k=>E.P.splice(k,1));Qs.forEach(Q=>fn(Q));return compact(E);}
// выдавить: грань уходит на d мм по нормали, по краям — боковые грани (d<0 — вдавить карман)
function extrude(E,pi,d,sym){E=ecopy(E);return withMirror(E,pi,sym,Q=>{const n=polyNorm(E.V,Q),nq=Q.map(i=>{E.V.push(V3.add(E.V[i],V3.mul(n,d)));return E.V.length-1;});
  Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];E.P.push([a,b,nq[(k+1)%Q.length],nq[k]]);});E.P.push(nq);});}
// центр грани поднять (d>0) или вдавить (d<0): грань становится «пирамидкой» из треугольников
function poke(E,pi,d,sym){E=ecopy(E);return withMirror(E,pi,sym,Q=>{const c=V3.add(polyC(E.V,Q),V3.mul(polyNorm(E.V,Q),d));E.V.push(c);const ci=E.V.length-1;
  Q.forEach((a,k)=>E.P.push([a,Q[(k+1)%Q.length],ci]));});}
// разрезать пополам: по середине самой длинной стороны и противоположной
function splitPoly(E,pi,sym){E=ecopy(E);const mp=sym?mirrorPoly(E,pi,mirrorMap(E.V)):-1;const Qs=[E.P[pi]];if(mp>=0&&mp!==pi)Qs.push(E.P[mp]);const keep=Qs.map(Q=>Q.slice());
  keep.forEach(Q0=>{const idx=E.P.findIndex(R=>R.length===Q0.length&&R.every((v,k)=>v===Q0[k]));if(idx<0)return;const Q=E.P[idx],n=Q.length;
    let li=0,ll=-1;Q.forEach((a,k)=>{const L=V3.len(V3.sub(E.V[Q[(k+1)%n]],E.V[a]));if(L>ll+1e-6){ll=L;li=k;}});
    const a=Q[li],b=Q[(li+1)%n],m1=vAt(E,V3.mul(V3.add(E.V[a],E.V[b]),.5));
    if(n===3){const c=Q[(li+2)%3];E.P.splice(idx,1);insertOnEdge(E,a,b,m1);E.P.push([a,m1,c],[m1,b,c]);return;}
    const lj=(li+Math.floor(n/2))%n,c=Q[lj],d=Q[(lj+1)%n],m2=vAt(E,V3.mul(V3.add(E.V[c],E.V[d]),.5));
    const A=[m1],B=[m2];for(let k=(li+1)%n;;k=(k+1)%n){A.push(Q[k]);if(k===lj)break;}A.push(m2);for(let k=(lj+1)%n;;k=(k+1)%n){B.push(Q[k]);if(k===li)break;}B.push(m1);
    E.P.splice(idx,1);insertOnEdge(E,a,b,m1);insertOnEdge(E,c,d,m2);E.P.push(A,B);});
  return compact(E);}
function delPoly(E,pi,sym){E=ecopy(E);return withMirror(E,pi,sym,()=>{});}
// неплоские → выровнять (точки сдвигаются чуть-чуть) или разбить на треугольники
function nonPlanar(E,tol=.8){const r=[];E.P.forEach((Q,i)=>{if(polyDev(E.V,Q)>tol)r.push(i);});return r;}
function flattenAll(E,sym,pin){const mm=sym?mirrorMap(E.V):null,open=openVerts(E);
  const fix=(i,q)=>{if(pin!==undefined&&(i===pin||mm&&mm[pin]===i))return E.V[i].slice();if(mm&&mm[i]===-2)q[0]=0;if(open.has(i)&&Math.abs(E.V[i][2])<.5)q[2]=0;return q;};
  let V=planarize(E.V,E.P,fix,300);if(mm)V=V.map((p,i)=>mm[i]>=0&&i>mm[i]?[-V[mm[i]][0],V[mm[i]][1],V[mm[i]][2]]:p);return {V,P:E.P.map(Q=>Q.slice())};}
function triangulateBad(E,tol=.8){const bad=new Set(nonPlanar(E,tol));const P=[];E.P.forEach((Q,i)=>{if(!bad.has(i)){P.push(Q.slice());return;}for(let k=1;k+1<Q.length;k++)P.push([Q[0],Q[k],Q[k+1]]);});return {V:E.V.map(p=>p.slice()),P};}

// заготовки: куб и шар (икосаэдр, разбитый один раз), мм, спина на z=0
function blankBox(W=300,H=400,D=260){const x=W/2,V=[[-x,0,0],[x,0,0],[x,H,0],[-x,H,0],[-x,0,D],[x,0,D],[x,H,D],[-x,H,D]];
  return {V,P:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]]};}
function blankSphere(R=220){const t=(1+Math.sqrt(5))/2;let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>V3.mul(V3.norm(p),R));
  let F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const mid=new Map(),m=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(!mid.has(k)){V.push(V3.mul(V3.norm(V3.add(V[a],V[b])),R));mid.set(k,V.length-1);}return mid.get(k);};
  F=F.flatMap(([a,b,c])=>{const ab=m(a,b),bc=m(b,c),ca=m(c,a);return [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]];});
  // повернуть так, чтобы была симметрия по x=0, и поставить на пол
  V=V.map(([x,y,z])=>[y,z,x]);const b=meshBox(V);V=V.map(p=>[p[0],p[1]-b.min[1],p[2]-b.min[2]]);return {V,P:F};}

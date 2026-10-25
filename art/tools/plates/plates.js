// конвейер: модель Meshy с текстурой → плиты (геометрия + швы текстуры + глаза), симметрично → многогранник {V,P}
// node art/tools/plates/plates.js [ang=4] [mm=3] [seam=185] [merge=4] [mina=6e-4] [pen=0.5] [clean=13] [tag=_x] [dump=1] — после prep.js; результат и картинки в out/
// dump=1 — замеры «швы на изломах эталона» по стадиям (creases.js): метки после VSA, после выпрямления, итог; углы до выравнивания; готовый многогранник
const fs=require('fs'),vm=require('vm'),path=require('path'),OUT=path.join(__dirname,'out'),JS=path.join(__dirname,'../../js/'),O=f=>path.join(OUT,f);const {render}=require('./rend.js');
const c={console,Math};vm.createContext(c);vm.runInContext(fs.readFileSync(JS+'mesh.js','utf8')+';'+fs.readFileSync(JS+'edit.js','utf8'),c);
const g=n=>vm.runInContext(n,c),V3=g('V3'),triN=g('triN');
const ARG=Object.fromEntries(process.argv.slice(2).map(s=>s.split('=')).map(([k,v])=>[k,k==='tag'?v:+v]));
const ANG=ARG.ang??4,MM=ARG.mm??3,SEAM=ARG.seam??185,MERGE=ARG.merge??4,MINA=ARG.mina??6e-4,PEN=ARG.pen??.5,CL=ARG.cl??6,TAG=ARG.tag??'';
const M=JSON.parse(fs.readFileSync(O('mesh.json'),'utf8')),TM=JSON.parse(fs.readFileSync(O('tex.json'),'utf8'));c.M0={V:M.V,F:M.F};
const {V,F}=g(`b=meshBox(M0.V);fitMesh(M0,{W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]})`);
const NT=F.length,N=F.map(f=>V3.norm(triN(V,f))),A=F.map(f=>V3.len(triN(V,f))/2),Cn=F.map(f=>V3.mul(V3.add(V3.add(V[f[0]],V[f[1]]),V[f[2]]),1/3)),tot=A.reduce((a,b)=>a+b,0);
const ek=(a,b)=>a<b?a*1e6+b:b*1e6+a,E=new Map();F.forEach((f,fi)=>{for(let k=0;k<3;k++){const key=ek(f[k],f[(k+1)%3]);const e=E.get(key);if(e)e.push(fi);else E.set(key,[fi]);}});
const NB=F.map(()=>[]);E.forEach(fs=>{if(fs.length===2){NB[fs[0]].push(fs[1]);NB[fs[1]].push(fs[0]);}});
const dark=TM.map(t=>t[1]<45),seam=TM.map((t,i)=>t[0]>SEAM||dark[i]);
// ---------- глаза: крупные связные пятна тёмной текстуры ----------
const eye=new Uint8Array(NT);{const seen=new Uint8Array(NT);for(let s=0;s<NT;s++){if(!dark[s]||seen[s])continue;const q=[s];seen[s]=1;let a=0;for(let i=0;i<q.length;i++){a+=A[q[i]];NB[q[i]].forEach(o=>{if(dark[o]&&!seen[o]){seen[o]=1;q.push(o);}});}
  if(a>250){const cc=V3.mul(q.reduce((s2,t)=>V3.add(s2,V3.mul(Cn[t],A[t])),[0,0,0]),1/a);if(cc[2]>200){q.forEach(t=>eye[t]=1);console.log('глаз: площадь',Math.round(a),'мм², центр',cc.map(Math.round).join(','));}}}}
// ---------- зеркальный треугольник (для левой половины — ближайший справа) ----------
const cell=6,HS=new Map(),hk=(x,y,z)=>x+','+y+','+z;F.forEach((_,t)=>{if(Cn[t][0]<0)return;const p=Cn[t],k=hk(Math.floor(p[0]/cell),Math.floor(p[1]/cell),Math.floor(p[2]/cell));(HS.get(k)||HS.set(k,[]).get(k)).push(t);});
const MT=new Int32Array(NT).fill(-1);F.forEach((_,t)=>{if(Cn[t][0]>=0)return;const p=[-Cn[t][0],Cn[t][1],Cn[t][2]],X=Math.floor(p[0]/cell),Y=Math.floor(p[1]/cell),Z=Math.floor(p[2]/cell);let bd=1e9,bt=-1;
  for(let r=1;r<=4&&bt<0;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++)for(let e=-r;e<=r;e++)(HS.get(hk(X+a,Y+b,Z+e))||[]).forEach(o=>{const d=V3.len(V3.sub(Cn[o],p))-.3*V3.dot(N[o],[-N[t][0],N[t][1],N[t][2]]);if(d<bd){bd=d;bt=o;}});MT[t]=bt;});
// ---------- 1. рост областей: плоскость затравки, швы и глаза — барьер ----------
let lab=new Int32Array(NT).fill(-1);{const cos=Math.cos(ANG*Math.PI/180);let id=0;
  [...Array(NT).keys()].filter(t=>Cn[t][0]>=-2).sort((a,b)=>A[b]-A[a]).forEach(s=>{if(lab[s]>=0||seam[s]&&!eye[s])return;const q=[s];lab[s]=id;let ns=V3.mul(N[s],A[s]),cs=V3.mul(Cn[s],A[s]),as=A[s];
    for(let i=0;i<q.length;i++){const n=V3.norm(ns),cc=V3.mul(cs,1/as);NB[q[i]].forEach(o=>{if(lab[o]>=0||eye[o]!==eye[s]||seam[o]&&!eye[o]||Cn[o][0]<-2||V3.dot(N[o],n)<cos)return;if(F[o].some(v=>Math.abs(V3.dot(V3.sub(V[v],cc),n))>MM))return;
      lab[o]=id;q.push(o);ns=V3.add(ns,V3.mul(N[o],A[o]));cs=V3.add(cs,V3.mul(Cn[o],A[o]));as+=A[o];});}id++;});}
// плиты-затравки: крупные области правой половины (и средние)
const PL=[];{const ar=new Map();F.forEach((_,t)=>{if(lab[t]>=0)ar.set(lab[t],(ar.get(lab[t])||0)+A[t]);});
  const fitL=l=>{let n=[0,0,0],cc=[0,0,0],a=0,e=0;F.forEach((_,t)=>{if(lab[t]!==l)return;n=V3.add(n,V3.mul(N[t],A[t]));cc=V3.add(cc,V3.mul(Cn[t],A[t]));a+=A[t];e+=eye[t];});return {n:V3.norm(n),c:V3.mul(cc,1/a),a,eye:e>0};};
  ar.forEach((a,l)=>{if(a<tot*(eye.some((x,t)=>x&&lab[t]===l)?1e-4:1e-3))return;const p=fitL(l);p.l=l;p.mid=Math.abs(p.c[0])<10&&Math.abs(p.n[0])<.15;if(p.c[0]<0&&!p.mid)return;PL.push(p);});}
{const rm=new Map(PL.map((p,i)=>[p.l,i]));lab=lab.map(l=>rm.has(l)?rm.get(l):-1);}
console.log('затравок',PL.length,'из них средних',PL.filter(p=>p.mid).length,'глаз',PL.filter(p=>p.eye).length);
// ---------- 2. VSA на правой половине; левая — зеркало ----------
let ALL=false;const R=t=>ALL||Cn[t][0]>=0;const isEye=l=>P[l<P.length?l:l-P.length].eye;
const heap=()=>{const H=[];return {push(x){H.push(x);let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p].e<=x.e)break;H[i]=H[p];i=p;}H[i]=x;},pop(){const top=H[0],x=H.pop();if(H.length){let i=0;for(;;){let c2=2*i+1;if(c2>=H.length)break;if(c2+1<H.length&&H[c2+1].e<H[c2].e)c2++;if(H[c2].e>=x.e)break;H[i]=H[c2];i=c2;}H[i]=x;}return top;},get size(){return H.length;}};};
let P=PL;
const cost=(t,p)=>{if(!!eye[t]!==p.eye)return 1e9;const d=V3.sub(N[t],p.n);return A[t]*V3.dot(d,d)+(seam[t]?PEN*A[t]:0)+A[t]*2e-3*Math.abs(V3.dot(V3.sub(Cn[t],p.c),p.n));};
const refit=()=>{const S=P.map(()=>({n:[0,0,0],c:[0,0,0],a:0}));F.forEach((_,t)=>{if(!R(t)||lab[t]<0)return;const s=S[lab[t]];s.n=V3.add(s.n,V3.mul(N[t],A[t]));s.c=V3.add(s.c,V3.mul(Cn[t],A[t]));s.a+=A[t];});
  P=P.map((p,i)=>{const s=S[i];if(!s.a)return {...p,a:0};let n=V3.norm(s.n),cc=V3.mul(s.c,1/s.a);if(p.mid){n=V3.norm([0,n[1],n[2]]);cc=[0,cc[1],cc[2]];}return {...p,n,c:cc,a:s.a};});};
const flood=()=>{const seed=P.map(()=>-1),se=P.map(()=>1e18);F.forEach((_,t)=>{if(!R(t)||lab[t]<0)return;const e=cost(t,P[lab[t]])/A[t];if(e<se[lab[t]]){se[lab[t]]=e;seed[lab[t]]=t;}});
  const nl=new Int32Array(NT).fill(-1),H=heap();seed.forEach((t,l)=>{if(t<0)return;nl[t]=l;NB[t].forEach(o=>{if(R(o))H.push({e:cost(o,P[l]),t:o,l});});});
  while(H.size){const x=H.pop();if(nl[x.t]>=0||x.e>=1e9)continue;nl[x.t]=x.l;NB[x.t].forEach(o=>{if(nl[o]<0&&R(o))H.push({e:cost(o,P[x.l]),t:o,l:x.l});});}
  lab=nl;};
// метки: правые 0..K-1, левые зеркальные K..2K-1, средние — сами себе
const mirrorLab=()=>{const K=P.length;F.forEach((_,t)=>{if(Cn[t][0]>=0||lab[t]===-2)return;const m=MT[t],l=m>=0?lab[m]:-1;lab[t]=l<0?l:l>=K?l-K:P[l].mid?l:l+K;});};
const fillUn=()=>{let ch=true;while(ch){ch=false;F.forEach((_,t)=>{if(lab[t]>=0||!R(t))return;const o=NB[t].find(x=>lab[x]>=0&&R(x)&&(!!eye[x]===!!eye[t]));if(o!==undefined){lab[t]=lab[o];ch=true;}});}};
for(let it=0;it<6;it++){if(it)refit();flood();fillUn();}
// ---------- 3. чистка: сглаживание краёв, куски, крохотные, слияние почти копланарных ----------
const modeF=k=>{for(let r=0;r<k;r++){const nl=lab.slice();F.forEach((_,t)=>{if(!R(t))return;const m=new Map();NB[t].forEach(o=>{if(R(o))m.set(lab[o],(m.get(lab[o])||0)+1);});m.forEach((n,l)=>{if(n>=2&&l!==lab[t]&&l>=0&&isEye(l)===!!eye[t])nl[t]=l;});});lab=nl;}};
const comps=()=>{const seen=new Int32Array(NT).fill(-1),cs=[];F.forEach((_,s)=>{if(!R(s)||seen[s]>=0||lab[s]<-1)return;const q=[s];seen[s]=cs.length;let a=0;for(let i=0;i<q.length;i++){a+=A[q[i]];NB[q[i]].forEach(o=>{if(R(o)&&seen[o]<0&&lab[o]===lab[s]){seen[o]=cs.length;q.push(o);}});}cs.push({l:lab[s],a,q});});
  const best=new Map();cs.forEach((cp,i)=>{const b=best.get(cp.l);if(b===undefined||cs[b].a<cp.a)best.set(cp.l,i);});cs.forEach((cp,i)=>{if(best.get(cp.l)!==i)cp.q.forEach(t=>lab[t]=-1);});fillUn();};
modeF(6);comps();
for(let r=0;r<3;r++){refit();P.forEach((p,l)=>{if(p.a<tot*MINA/2&&!(p.eye&&p.a>40))F.forEach((_,t)=>{if(lab[t]===l)lab[t]=-1;});});fillUn();comps();}
for(let r=0;r<60;r++){refit();const adj=new Set();E.forEach(fs=>{if(fs.length!==2||!R(fs[0])||!R(fs[1]))return;const a=lab[fs[0]],b=lab[fs[1]];if(a!==b&&a>=0&&b>=0)adj.add(a<b?a+'_'+b:b+'_'+a);});
  let best=null,bc=-1;adj.forEach(k=>{const [a,b]=k.split('_').map(Number);if(P[a].eye!==P[b].eye)return;const d=V3.dot(P[a].n,P[b].n);if(d>Math.cos(MERGE*Math.PI/180)&&d>bc){bc=d;best=[a,b];}});
  if(!best)break;const [a,b]=best;P[a].mid=P[a].mid||P[b].mid;F.forEach((_,t)=>{if(lab[t]===b)lab[t]=a;});}
modeF(3);comps();refit();
// сжать номера
{const used=[...new Set([...lab].filter((l,t)=>l>=0&&R(t)))].sort((a,b)=>a-b),rm=new Map(used.map((l,i)=>[l,i]));P=used.map(l=>P[l]);lab=lab.map((l,t)=>R(t)&&l>=0?rm.get(l):-1);}
// средние плиты: та, что заметно заходит за середину с обеих сторон
mirrorLab();ALL=true;modeF(4);comps();modeF(2);comps();
const K=P.length;console.log('плит справа+середина',K,'средних',P.filter(p=>p.mid).length,'всего',K+P.filter(p=>!p.mid).length);
// ---------- 4. углы и многоугольники ----------
const allP=l=>l<K?P[l]:{...P[l-K],n:[-P[l-K].n[0],P[l-K].n[1],P[l-K].n[2]],c:[-P[l-K].c[0],P[l-K].c[1],P[l-K].c[2]]};
const ML=l=>l<K?(P[l].mid?l:l+K):l-K;
// глаз — прорезь: его треугольники убираем (-2), края прорези ложатся в плоскости соседних плит
F.forEach((_,t)=>{if(lab[t]>=0&&isEye(lab[t]))lab[t]=-2;});
// плоскости правой половины заново (после слияний)
const refitR=()=>{const S=P.map(()=>({n:[0,0,0],c:[0,0,0],a:0}));F.forEach((_,t)=>{const l=lab[t];if(l<0||l>=K||Cn[t][0]<0)return;const s=S[l];s.n=V3.add(s.n,V3.mul(N[t],A[t]));s.c=V3.add(s.c,V3.mul(Cn[t],A[t]));s.a+=A[t];});
  S.forEach((s,i)=>{if(!s.a)return;let n=V3.norm(s.n),cc=V3.mul(s.c,1/s.a);if(P[i].mid){n=V3.norm([0,n[1],n[2]]);cc=[0,cc[1],cc[2]];}P[i]={...P[i],n,c:cc,a:s.a};});};
const rv=l=>l<K?l:l-K;
// прямые границы: треугольник у границы — той плите, к чьей плоскости он ближе (по расстоянию); граница ложится по линии пересечения плоскостей
const nearEye=new Uint8Array(NT);{let fr=[];F.forEach((_,t)=>{if(eye[t]){nearEye[t]=1;fr.push(t);}});for(let r=0;r<(ARG.eyering??6);r++){const nx=[];fr.forEach(t=>NB[t].forEach(o=>{if(!nearEye[o]){nearEye[o]=1;nx.push(o);}}));fr=nx;}}
const straighten=(sweeps)=>{let ch=0;for(let sw=0;sw<sweeps;sw++){let c1=0;const nl=lab.slice();F.forEach((_,t)=>{const l=lab[t];if(l<0||Cn[t][0]<0||nearEye[t])return;const cand=new Set();NB[t].forEach(o=>{const m=lab[o];if(m>=0&&m!==l)cand.add(m);});if(!cand.size)return;
    const d=m=>{const p=allP(m);return Math.max(...F[t].map(v=>Math.abs(V3.dot(V3.sub(V[v],p.c),p.n))));};let best=l,bd=d(l);cand.forEach(m=>{if(isEye(m)!==isEye(l))return;const x=d(m);if(x<bd-.05){bd=x;best=m;}});if(best!==l){nl[t]=best;c1++;}});
  lab=nl;ch+=c1;if(!c1)break;}mirrorLab();comps();return ch;};
// каждая грань в своей плоскости: самопересечение контура и ширина (по выпуклой оболочке)
const flat2=(W,Q)=>{const n=g('polyNorm')(W,Q),o=W[Q[0]];let u=V3.sub(W[Q[1]],o);u=V3.norm(V3.sub(u,V3.mul(n,V3.dot(u,n))));const w=V3.cross(n,u);return Q.map(i=>{const d=V3.sub(W[i],o);return [V3.dot(d,u),V3.dot(d,w)];});};
const segX=(a,b,c2,d)=>{const cr=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);const d1=cr(c2,d,a),d2=cr(c2,d,b),d3=cr(a,b,c2),d4=cr(a,b,d);return (d1>0)!==(d2>0)&&(d3>0)!==(d4>0);};
const selfX=pts=>{const n=pts.length;for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(segX(pts[i],pts[(i+1)%n],pts[j],pts[(j+1)%n]))return true;}return false;};
const widthOf=pts=>{const h=g('convexHull')(pts);let bw=Infinity;h.forEach((p,i)=>{const q=h[(i+1)%h.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),c3=Math.cos(a),s3=Math.sin(a);let mn=1e9,mx=-1e9;h.forEach(z=>{const y=-s3*z[0]+c3*z[1];mn=Math.min(mn,y);mx=Math.max(mx,y);});bw=Math.min(bw,mx-mn);});return bw;};
const MINW0=ARG.minw??15;
// многогранник из текущих меток: углы → многоугольники → симметрия → выравнивание
function build(loud){const say=(...a)=>{if(loud)console.log(...a);};
  const VL=V.map(()=>new Set());F.forEach((f,t)=>{if(lab[t]>=0)f.forEach(v=>VL[v].add(lab[t]));});
  const HV=new Set();F.forEach((f,t)=>{if(lab[t]===-2)f.forEach(v=>HV.add(v));});
  // край прорези: цепочки между стыками плит упрощаем (Дуглас–Пекер, 1,5 мм) — оставшиеся точки тоже углы
  const extra=new Set();{const nx=new Map();F.forEach((f,t)=>{if(lab[t]<0)return;for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],o=E.get(ek(a,b)).find(x=>x!==t);if(o!==undefined&&lab[o]===-2)nx.set(a,b);}});
    const used=new Set();nx.forEach((_,s0)=>{if(used.has(s0))return;const L=[];let v=s0;while(v!==undefined&&!used.has(v)){used.add(v);L.push(v);v=nx.get(v);}
      const brk=L.map((v,i)=>i).filter(i=>VL[L[i]].size>=2);if(brk.length<2){brk.length=0;brk.push(0,Math.floor(L.length/3),Math.floor(2*L.length/3));}
      brk.forEach(i=>extra.add(L[i]));
      const W=k=>L[k%L.length],dp=(i,j)=>{if(j-i<2)return;const a=V[W(i)],b=V[W(j)];let bd=0,bk=-1;for(let k=i+1;k<j;k++){const p=V[W(k)],ab=V3.sub(b,a),t2=Math.max(0,Math.min(1,V3.dot(V3.sub(p,a),ab)/(V3.dot(ab,ab)||1))),d=V3.len(V3.sub(p,V3.add(a,V3.mul(ab,t2))));if(d>bd){bd=d;bk=k;}}
        if(bd>1.5){extra.add(W(bk));dp(i,bk);dp(bk,j);}};
      brk.forEach((i,k)=>{const j=k+1<brk.length?brk[k+1]:brk[0]+L.length;dp(i,j);});});}
  say('точек на краях глаз',extra.size);{const nl=new Set();F.forEach((_,t)=>{if(lab[t]!==-2)return;NB[t].forEach(o=>{if(lab[o]>=0)nl.add(lab[o]+(Cn[o][0]>0?'R':'L'));});});say('соседи глаз:',[...nl].join(' '));}
  const VN=V.map(()=>new Set());F.forEach(f=>{for(let k=0;k<3;k++){VN[f[k]].add(f[(k+1)%3]);VN[f[(k+1)%3]].add(f[k]);}});
  const jun=[];VL.forEach((s,v)=>{if(s.size>=3||extra.has(v)&&s.size>=1)jun.push(v);});const isJ=new Set(jun),cl=new Map(),CLU=[];
  jun.forEach(s=>{if(cl.has(s))return;const id=CLU.length,q=[s];cl.set(s,id);for(let i=0;i<q.length;i++)VN[q[i]].forEach(o=>{if(isJ.has(o)&&!cl.has(o)&&V3.len(V3.sub(V[o],V[s]))<CL){cl.set(o,id);q.push(o);}});
    const L=new Set();q.forEach(v=>VL[v].forEach(l=>L.add(l)));CLU.push({vs:q,L:[...L]});});
  const solve=(u,w)=>{const c0=V3.mul(u.vs.reduce((s,v)=>V3.add(s,V[v]),[0,0,0]),1/u.vs.length),Am=[[w,0,0],[0,w,0],[0,0,w]],b=V3.mul(c0,w);
    u.L.forEach(l=>{const p=allP(l),n=p.n,d=V3.dot(n,p.c);for(let i=0;i<3;i++){for(let j=0;j<3;j++)Am[i][j]+=n[i]*n[j];b[i]+=n[i]*d;}});
    const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]),D=det(Am),col=i=>Am.map((r,k)=>r.map((x,j)=>j===i?b[k]:x));
    return {p:[det(col(0))/D,det(col(1))/D,det(col(2))/D],c0};};
  CLU.forEach(u=>{let w=.02,r;do{r=solve(u,w);w*=4;}while(V3.len(V3.sub(r.p,r.c0))>8&&w<50);u.p=r.p;u.mv=V3.len(V3.sub(r.p,r.c0));});
  say('углов',CLU.length,'сдвиг: макс',Math.max(...CLU.map(u=>u.mv)).toFixed(1),'мм, средн',(CLU.reduce((a,u)=>a+u.mv,0)/CLU.length).toFixed(1));
  const ids=[...new Set(lab)].filter(l=>l>=0),polys=[],bad=[];
  ids.forEach(l=>{const nxt=new Map();F.forEach((f,t)=>{if(lab[t]!==l)return;for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],o=E.get(ek(a,b)).find(x=>x!==t);if(o===undefined||lab[o]!==l)nxt.set(a,b);}});
    const loops=[],used=new Set();nxt.forEach((_,s)=>{if(used.has(s))return;const L=[];let v=s;while(v!==undefined&&!used.has(v)){used.add(v);L.push(v);v=nxt.get(v);}loops.push(L);});loops.sort((a,b)=>b.length-a.length);
    const Q=[];loops[0].forEach(v=>{if(cl.has(v)){const id=cl.get(v);if(Q[Q.length-1]!==id)Q.push(id);}});while(Q.length>1&&Q[0]===Q[Q.length-1])Q.pop();
    if(loops.length>1)bad.push('дыр у '+l);if(Q.length<3){bad.push('углов '+Q.length+' у '+l);return;}if(new Set(Q).size!==Q.length)bad.push('угол дважды у '+l);polys.push({l,Q});});
  say('многоугольников',polys.length,'замечаний',bad.length,bad.slice(0,10).join('; '));
  // симметрия по построению: берём правую половину и плиты по середине, левую — зеркалом
  const key=L=>[...L].sort((a,b)=>a-b).join(',');
  const side=CLU.map(u=>{if(key(u.L.map(ML))===key(u.L))return 'M';const r=u.L.some(l=>l<K&&!P[l].mid),lf=u.L.some(l=>l>=K);return r&&lf?'M':lf?'L':'R';});
  CLU.forEach((u,i)=>{if(side[i]==='M')u.p=[0,u.p[1],u.p[2]];});
  const byKey=new Map();CLU.forEach((u,i)=>{if(side[i]==='L')return;const k=key(u.L);(byKey.get(k)||byKey.set(k,[]).get(k)).push(i);});
  const toR=i=>{if(side[i]!=='L')return i;const u=CLU[i],mp=[-u.p[0],u.p[1],u.p[2]];let cs=byKey.get(key(u.L.map(ML)))||[];if(!cs.length)cs=CLU.map((_,j)=>j).filter(j=>side[j]!=='L');let bj=-1,bd=1e9;cs.forEach(j=>{const d=V3.len(V3.sub(CLU[j].p,mp));if(d<bd){bd=d;bj=j;}});return bj;};
  const NC=[],ri=new Map(),mi=new Map();CLU.forEach((u,i)=>{if(side[i]==='L')return;ri.set(i,NC.length);NC.push({p:u.p.slice(),vs:u.vs,L:u.L,mid:side[i]==='M',eye:u.vs.some(v=>HV.has(v))});});
  CLU.forEach((u,i)=>{if(side[i]!=='R')return;const j=NC.length;mi.set(i,j);NC.push({p:[-u.p[0],u.p[1],u.p[2]],vs:[],L:u.L.map(ML),mate:ri.get(i),eye:u.vs.some(v=>HV.has(v))});NC[ri.get(i)].mate=j;});
  const mir=i=>side[i]==='M'?ri.get(i):mi.get(i);
  const dedupe=Q=>{const R2=[];Q.forEach(x=>{if(x!==undefined&&R2[R2.length-1]!==x)R2.push(x);});while(R2.length>1&&R2[0]===R2[R2.length-1])R2.pop();return R2;};
  const NP=[];let skipped=0;polys.forEach(p=>{const l=p.l;if(l>=K)return;const Q0=p.Q.map(toR);
    if(!P[l].mid){const Q=dedupe(Q0.map(i=>ri.get(i))),M2=dedupe(Q0.map(mir)).reverse();if(Q.length>=3&&new Set(Q).size===Q.length){NP.push({l,Q});NP.push({l:ML(l),Q:M2});}else skipped++;return;}
    const n=p.Q.length,S=p.Q.map(i=>side[i]);let st=-1;for(let k=0;k<n;k++)if(S[k]==='M'&&S[(k+1)%n]==='R'){st=k;break;}
    if(st<0){const Q=dedupe(p.Q.filter(i=>side[i]!=='L').map(i=>ri.get(i)));if(Q.length>=3)NP.push({l,Q});else skipped++;return;}
    const ch=[p.Q[st]];for(let k=1;k<n;k++){const i=p.Q[(st+k)%n];if(side[i]==='L')continue;ch.push(i);if(side[i]==='M')break;}
    const Q=dedupe([...ch.map(i=>ri.get(i)),...ch.slice(1,-1).reverse().map(mir)]);if(Q.length>=3&&new Set(Q).size===Q.length)NP.push({l,Q});else skipped++;});
  say('симметрично: точек',NC.length,'(было',CLU.length+'), граней',NP.length,'пропущено',skipped);
  CLU.length=0;NC.forEach(u=>CLU.push(u));polys.length=0;NP.forEach(p=>polys.push(p));const paired=CLU.filter(u=>u.mid||u.mate!==undefined).length;
  say('углов в паре/на середине',paired,'из',CLU.length);
  // выровнять грани (симметрия сохраняется), проверить
  const ec=new Map();polys.forEach(({Q})=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],kk=a<b?a+'_'+b:b+'_'+a;ec.set(kk,(ec.get(kk)||0)+1);}));const hist={};ec.forEach(n=>hist[n]=(hist[n]||0)+1);say('рёбер по числу граней',JSON.stringify(hist));
  // стянуть пары углов в один — вместе с зеркальными (mate) и с учётом середины (mid)
  const collapse=pairs=>{const par=CLU.map((_,i)=>i),fd=i=>par[i]===i?i:(par[i]=fd(par[i])),un=(a,b)=>{a=fd(a);b=fd(b);if(a!==b)par[b]=a;};
    pairs.forEach(([a,b])=>{un(a,b);const ma=CLU[a].mate,mb=CLU[b].mate;if(ma!==undefined&&mb!==undefined)un(ma,mb);else if(CLU[a].mid&&mb!==undefined)un(a,mb);else if(CLU[b].mid&&ma!==undefined)un(b,ma);});
    const grp=new Map();CLU.forEach((_,i)=>{const r=fd(i);(grp.get(r)||grp.set(r,[]).get(r)).push(i);});
    const NC=[],idx=new Map();grp.forEach((ms,r)=>{const p=V3.mul(ms.reduce((a,i)=>V3.add(a,CLU[i].p),[0,0,0]),1/ms.length),mid=ms.some(i=>CLU[i].mid)||ms.some(i=>ms.includes(CLU[i].mate));if(mid)p[0]=0;idx.set(r,NC.length);NC.push({p,mid,eye:ms.some(i=>CLU[i].eye),vs:[].concat(...ms.map(i=>CLU[i].vs)),L:[...new Set([].concat(...ms.map(i=>CLU[i].L)))],m0:ms});});
    NC.forEach(u=>{if(u.mid)return;const m=u.m0.map(i=>CLU[i].mate).find(x=>x!==undefined);if(m!==undefined){const j=idx.get(fd(m));if(j!==undefined&&!NC[j].mid)u.mate=j;}});
    NC.forEach((u,i)=>{if(u.mate!==undefined&&u.mate>i){const a=u.p,b=NC[u.mate].p,m=[(a[0]-b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];u.p=m;NC[u.mate].p=[-m[0],m[1],m[2]];}});
    const before=CLU.length;polys.forEach(p=>{const Q=[];p.Q.forEach(a=>{const j=idx.get(fd(a));if(Q[Q.length-1]!==j)Q.push(j);});while(Q.length>1&&Q[0]===Q[Q.length-1])Q.pop();p.Q=Q;});
    for(let i=polys.length-1;i>=0;i--)if(polys[i].Q.length<3||new Set(polys[i].Q).size!==polys[i].Q.length)polys.splice(i,1);
    CLU.length=0;NC.forEach(u=>CLU.push(u));return before-CLU.length;};
  // выравнивание: точка — среднее проекций на плоскости её граней; пары — зеркально, средние — на x=0
  const planar=()=>{let W=c.EP.V.map(p=>p.slice());const PP=c.EP.P,pn=g('polyNorm'),pc=g('polyC');const W0=W.map(p=>p.slice()),IT=ARG.it??800;for(let it=0;it<IT;it++){const lam=(ARG.anchor??.6)*Math.max(0,1-it/(IT*.8)),acc=W.map((p,i)=>V3.mul(W0[i],lam)),cnt=W.map(()=>lam);
    PP.forEach((Q,qi)=>{const n=ARG.fixn&&polys[qi].l>=0?allP(polys[qi].l).n:pn(W,Q),cc=pc(W,Q);Q.forEach(i=>{const d=V3.dot(V3.sub(W[i],cc),n);acc[i]=V3.add(acc[i],V3.sub(W[i],V3.mul(n,d)));cnt[i]++;});});
    W=W.map((p,i)=>cnt[i]?V3.mul(acc[i],1/cnt[i]):p);CLU.forEach((u,i)=>{if(u.mid)W[i][0]=0;else if(u.mate!==undefined&&u.mate>i){const a=W[i],b=W[u.mate],m=[(a[0]-b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];W[i]=m;W[u.mate]=[-m[0],m[1],m[2]];}});}
    return {V:W,P:PP.map(Q=>Q.slice())};};
  // близкие углы (короче SHORT мм по ребру) — в один; иначе после выравнивания «бантики»
  {const SHORT=ARG.short??6,pr=[];polys.forEach(({Q})=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];if(!CLU[a].eye&&!CLU[b].eye&&V3.len(V3.sub(CLU[a].p,CLU[b].p))<SHORT)pr.push([a,b]);}));const n=collapse(pr);say('близкие углы: слито',n,', граней',polys.length);}
  // дыры (кроме глаз) — заделать гранью: открытая петля, пройденная в обратную сторону
  {const ES=new Set();polys.forEach(({Q})=>Q.forEach((a,k)=>ES.add(a+'_'+Q[(k+1)%Q.length])));const nx=new Map();polys.forEach(({Q})=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];if(!ES.has(b+'_'+a))nx.set(a,b);}));
    const used=new Set();let n=0;nx.forEach((_,s0)=>{if(used.has(s0))return;const L=[];let v=s0;while(v!==undefined&&!used.has(v)){used.add(v);L.push(v);v=nx.get(v);}if(L.length>=3&&!L.some(i=>CLU[i].eye)){polys.push({l:-3,Q:L.slice().reverse()});n++;}});say('дыр заделано',n);}
  c.EP={V:CLU.map(u=>u.p),P:polys.map(p=>p.Q)};let E2=planar();
  // ремонт: грань самопересекается или узкая щепка (3–4 угла) — стянуть её самое короткое ребро и выровнять снова
  for(let r=0;r<(ARG.fix??6);r++){const W=E2.V,pr=[];let nx=0,nn=0;polys.forEach(({Q})=>{const pts=flat2(W,Q),sx=selfX(pts),nar=!sx&&Q.length<=4&&widthOf(pts)<MINW0;if(!sx&&!nar)return;if(sx)nx++;else nn++;
      let best=null,bl=1e9;Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];const l=V3.len(V3.sub(W[a],W[b]));if((CLU[a].eye||CLU[b].eye)&&l>=(ARG.eyeshort??9))return;if(l<bl){bl=l;best=[a,b];}});if(best)pr.push(best);});
    say('ремонт',r,': самопересечений',nx,', узких щепок',nn);if(!pr.length)break;CLU.forEach((u,i)=>{u.p=W[i].slice();});collapse(pr);c.EP={V:CLU.map(u=>u.p),P:polys.map(p=>p.Q)};E2=planar();}
  c.E2=E2;
  const dev=g(`Math.max(...E2.P.map(Q=>polyDev(E2.V,Q)))`),npl=g(`nonPlanar(E2,1).length`),mov=Math.max(...E2.V.map((p,i)=>V3.len(V3.sub(p,c.EP.V[i])))),asym=g(`mirrorMap(E2.V,1).filter(j=>j===-1).length`);
  say('после выравнивания: неплоскость макс',dev.toFixed(2),'мм, неплоских >1мм',npl,', точки сдвинулись до',mov.toFixed(1),'мм, без пары',asym);
  return {CLU,polys,E2,EP:c.EP};}
// замеры «швы на изломах» по стадиям (dump=1; калька — TRACE_ID, по умолчанию doberman7): границы меток на сетке эталона, углы до и после выравнивания
const KZ=ARG.dump?require('./creases.js')(process.env.TRACE_ID||'doberman7'):null;
const stageLab=tag=>{if(!KZ)return;const S=[];let k=0;E.forEach((fs2,kk)=>{if(fs2.length!==2)return;const [t1,t2]=fs2,a=lab[t1],b=lab[t2];if(a<0||b<0||a===b||Cn[t1][0]<0)return;if(k++%4)return;
    const n1=allP(a).n,n2=allP(b).n;if(V3.dot(n1,n2)>Math.cos(10*Math.PI/180))return;const v1=Math.floor(kk/1e6),v2=kk%1e6;S.push({m:V3.mul(V3.add(V[v1],V[v2]),.5),u:V3.norm(V3.cross(n1,n2)),n1,n2});});
  KZ.show('стадия «'+tag+'»',KZ.samples(S));};
stageLab('метки после VSA');
for(let r=0;r<(ARG.str??3);r++){const n=straighten(15);refitR();console.log('прямые границы: перекрашено',n);}
stageLab('метки после выпрямления');
// слить соседние плиты, если между ними на текстуре НЕТ шва (настоящий шов виден на текстуре, мнимый — нет)
const dS=new Int32Array(NT).fill(99);{let fr=[];F.forEach((_,t)=>{if(seam[t]){dS[t]=0;fr.push(t);}});for(let r=1;r<=4;r++){const nx=[];fr.forEach(t=>NB[t].forEach(o=>{if(dS[o]>r){dS[o]=r;nx.push(o);}}));fr=nx;}}
const seamMerge=()=>{let merged=0;for(let it=0;it<200;it++){const st=new Map();F.forEach((_,t)=>{const a=lab[t];if(a<0||Cn[t][0]<0)return;NB[t].forEach(o=>{const b=lab[o];if(b<0||b===a)return;const ka=rv(a),kb=rv(b);if(ka===kb)return;
      const k=ka<kb?ka+'_'+kb:kb+'_'+ka;let x=st.get(k);if(!x)st.set(k,x={n:0,c:0});x.n++;if(dS[t]<=(ARG.band??2))x.c++;});});
    let best=null,bf=1;st.forEach((x,k)=>{if(x.n<6)return;const [a,b]=k.split('_').map(Number);if(isEye(a)||isEye(b))return;const f=x.c/x.n;if(f<(ARG.seamf??0)&&V3.dot(P[a].n,P[b].n)>Math.cos((ARG.sang??25)*Math.PI/180)&&f<bf){bf=f;best=[a,b];}});
    if(!best)break;let [a,b]=best;if(P[b].mid&&!P[a].mid)[a,b]=[b,a];   // средняя плита остаётся средней
    F.forEach((_,t)=>{const l=lab[t];if(l<0||rv(l)!==b)return;lab[t]=P[a].mid||Cn[t][0]>=0?a:ML(a);});refitR();merged++;}
  mirrorLab();comps();return merged;};
{const m=seamMerge();console.log('слито плит без шва на текстуре:',m);if(m)for(let r=0;r<2;r++){straighten(15);refitR();}}
// узкие плиты (уже 15 мм) вливаем в соседа с ближайшей нормалью — сразу с зеркальной; повторяем
const MINW=ARG.minw??15;let B;
for(let round=0;round<(ARG.rounds??4);round++){B=build(false);const PB=g('polyBase')(B.E2.V,B.E2.P),R=g('buildParts')(PB,1.5,1.5);
  const nar=new Set();R.parts.forEach(p=>{if(p.minW<MINW){const l=B.polys[PB.T[p.tris[0]]].l;nar.add(rv(l));}});
  console.log('круг',round,'плит',B.polys.length,'узких',nar.size);if(!nar.size)break;
  const nbs=new Map();E.forEach(fs=>{if(fs.length!==2)return;const a=lab[fs[0]],b=lab[fs[1]];if(a===b||a<0||b<0)return;[[a,b],[b,a]].forEach(([x,y])=>{const k=rv(x);if(!nar.has(k))return;if(!nbs.has(k))nbs.set(k,new Map());const m=nbs.get(k),ry=x<K===y<K||P[rv(y)].mid||P[k].mid?rv(y):rv(y);m.set(ry,(m.get(ry)||0)+1);});});
  const tgt=new Map();nar.forEach(k=>{const m=nbs.get(k);if(!m)return;let best=-1,bd=-2;m.forEach((cnt,y)=>{if(y===k||nar.has(y))return;const d=V3.dot(P[k].n,P[y].n);if(d>bd){bd=d;best=y;}});if(best>=0&&bd>Math.cos((ARG.mang??30)*Math.PI/180))tgt.set(k,best);});
  console.log('   сливаю',tgt.size,'из',nar.size);if(!tgt.size)break;
  // цепочки: цель сама уходит — идём до конца
  const fin=k=>{let x=k,s=0;while(tgt.has(x)&&s++<20)x=tgt.get(x);return x;};
  F.forEach((_,t)=>{const l=lab[t];if(l<0)return;const k=rv(l);if(!tgt.has(k))return;const m=fin(k);lab[t]=Cn[t][0]>=0||P[m].mid?m:ML(m);if(P[k].mid&&!P[m].mid&&Cn[t][0]<0)lab[t]=ML(m);});
  tgt.forEach((m,k)=>{if(P[k].mid)P[fin(k)].mid=P[fin(k)].mid;});refitR();}
B=build(true);const {CLU,polys,E2}=B;c.E2=E2;
// короткие рёбра (короче clean мм, по умолчанию 13) — в одну точку: хвостики и «ступеньки», где швы сходятся не в точку (clean.js); clean=0 — выключить
if(ARG.clean!==0){const L=ARG.clean??13,r=require('./clean.js')(g).collapseShort(E2,{maxLen:L,keep:true}),n=r.log.filter(x=>x.done).length;E2.V=r.E.V;E2.P=r.E.P;const kp=r.I.map(i=>polys[i]);polys.length=0;polys.push(...kp);
  console.log('короткие рёбра <'+L+' мм: схлопнуто',n,', пропущено',r.log.length-n,r.log.filter(x=>!x.done).map(x=>'@'+x.at+' '+x.why).join('; '));}
if(KZ){stageLab('метки итог');KZ.show('стадия «углы до выравнивания»',KZ.poly(B.EP.V,B.EP.P));KZ.show('стадия «итог»',KZ.poly(E2.V,E2.P));}
// где выравнивание сильно двигает точки
{const mv=E2.V.map((p,i)=>V3.len(V3.sub(p,B.EP.V[i])));const bad2=polys.map((p,i)=>({l:p.l,m:Math.max(...p.Q.map(q=>mv[q])),c:g('polyC')(E2.V,p.Q)})).filter(x=>x.m>10).sort((a,b)=>b.m-a.m);
  console.log('плиты, где точки сдвинулись >10 мм:',bad2.length,bad2.slice(0,10).map(x=>'пл'+x.l+' '+x.m.toFixed(0)+'мм @'+x.c.map(Math.round).join(',')).join('; '));}
fs.writeFileSync(O('plates'+TAG+'.json'),JSON.stringify({V:E2.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:E2.P,lab:[...lab],L:polys.map(p=>p.l),eye:polys.map(p=>(p.l>=0&&allP(p.l).eye))}));
// картинки: разбивка на сетке модели и готовый многогранник
const rnd=i=>{let x=Math.sin(i*12.9898+1)*43758.5453;x-=Math.floor(x);return x;};
const T=[],TG=[];E2.P.forEach((Q,i)=>g('earClip')(E2.V,Q).forEach(t=>{T.push(t);TG.push(i);}));
const EYE=polys.map(p=>(p.l>=0&&allP(p.l).eye));
{const mv=E2.V.map((p,i)=>V3.len(V3.sub(p,B.EP.V[i])));const h=[0,0,0,0,0];mv.forEach(m=>h[m<2?0:m<5?1:m<10?2:m<20?3:4]++);console.log('сдвиг точек при выравнивании <2/2-5/5-10/10-20/>20 мм:',h.join('/'));
  console.log('самые большие:',mv.map((m,i)=>[m,i]).sort((a,b)=>b[0]-a[0]).slice(0,8).map(([m,i])=>m.toFixed(0)+'@'+B.EP.V[i].map(Math.round).join(',')+' пл'+CLU[i].L.join('/')).join('  '));}
const XS=new Set();E2.P.forEach((Q,i)=>{if(selfX(flat2(E2.V,Q)))XS.add(i);});console.log('самопересекающихся граней',XS.size,[...XS].map(i=>{const Q=E2.P[i];return Q.length+'уг@'+g('polyC')(E2.V,Q).map(Math.round).join(',')+(Q.some(q=>CLU[q].eye)?' (глаз)':'')+' рёбра '+Q.map((a,k)=>Math.round(V3.len(V3.sub(E2.V[a],E2.V[Q[(k+1)%Q.length]])))).join('/');}).join(' | '));
const NAR=new Set();{E2.P.forEach((Q,i)=>{if(widthOf(flat2(E2.V,Q))<MINW)NAR.add(i);});
  console.log('узких плит (<'+MINW+' мм):',NAR.size,[...NAR].slice(0,40).map(i=>{const c2=g('polyC')(E2.V,E2.P[i]);return c2.map(Math.round).join(',');}).join(' | '));}
for(const v of ['front','side','iso','bottom'])render(O('pl'+TAG+'_'+v+'.png'),E2.V,T,i=>XS.has(TG[i])?[60,90,220]:NAR.has(TG[i])?[220,60,50]:[175,165,155],v,{shade:true,group:i=>TG[i]});
render(O('pl'+TAG+'_lab.png'),V,F,t=>lab[t]<0?[255,255,255]:eye[t]?[20,20,20]:[50+rnd(ML(lab[t])<lab[t]?ML(lab[t]):lab[t])*200|0,50+rnd((ML(lab[t])<lab[t]?ML(lab[t]):lab[t])+.31)*200|0,50+rnd((ML(lab[t])<lab[t]?ML(lab[t]):lab[t])+.77)*200|0],'front');

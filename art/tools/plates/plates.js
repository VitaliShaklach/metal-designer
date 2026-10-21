// конвейер: модель Meshy с текстурой → плиты (геометрия + швы текстуры + глаза), симметрично → многогранник {V,P}
// node art/tools/plates/plates.js [ang=4] [mm=3] [seam=185] [merge=4] [mina=6e-4] [pen=0.5] — после prep.js; результат и картинки в out/
const fs=require('fs'),vm=require('vm'),path=require('path'),OUT=path.join(__dirname,'out'),JS=path.join(__dirname,'../../js/'),O=f=>path.join(OUT,f);const {render}=require('./rend.js');
const c={console,Math};vm.createContext(c);vm.runInContext(fs.readFileSync(JS+'mesh.js','utf8')+';'+fs.readFileSync(JS+'edit.js','utf8'),c);
const g=n=>vm.runInContext(n,c),V3=g('V3'),triN=g('triN');
const ARG=Object.fromEntries(process.argv.slice(2).map(s=>s.split('=')).map(([k,v])=>[k,+v]));
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
const mirrorLab=()=>{const K=P.length;F.forEach((_,t)=>{if(R(t))return;const m=MT[t],l=m>=0?lab[m]:-1;lab[t]=l<0?-1:P[l].mid?l:l+K;});};
const fillUn=()=>{let ch=true;while(ch){ch=false;F.forEach((_,t)=>{if(lab[t]>=0||!R(t))return;const o=NB[t].find(x=>lab[x]>=0&&R(x)&&(!!eye[x]===!!eye[t]));if(o!==undefined){lab[t]=lab[o];ch=true;}});}};
for(let it=0;it<6;it++){if(it)refit();flood();fillUn();}
// ---------- 3. чистка: сглаживание краёв, куски, крохотные, слияние почти копланарных ----------
const modeF=k=>{for(let r=0;r<k;r++){const nl=lab.slice();F.forEach((_,t)=>{if(!R(t))return;const m=new Map();NB[t].forEach(o=>{if(R(o))m.set(lab[o],(m.get(lab[o])||0)+1);});m.forEach((n,l)=>{if(n>=2&&l!==lab[t]&&l>=0&&isEye(l)===!!eye[t])nl[t]=l;});});lab=nl;}};
const comps=()=>{const seen=new Int32Array(NT).fill(-1),cs=[];F.forEach((_,s)=>{if(!R(s)||seen[s]>=0)return;const q=[s];seen[s]=cs.length;let a=0;for(let i=0;i<q.length;i++){a+=A[q[i]];NB[q[i]].forEach(o=>{if(R(o)&&seen[o]<0&&lab[o]===lab[s]){seen[o]=cs.length;q.push(o);}});}cs.push({l:lab[s],a,q});});
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
// отладка: соседи глаз
{const nb=new Map();E.forEach(fs=>{if(fs.length!==2)return;const a=lab[fs[0]],b=lab[fs[1]];if(a===b||a<0||b<0)return;[[a,b],[b,a]].forEach(([x,y])=>{if(!nb.has(x))nb.set(x,new Set());nb.get(x).add(y);});});
  [...new Set(lab)].filter(l=>l>=0&&isEye(l)).forEach(l=>{let a=0;F.forEach((_,t)=>{if(lab[t]===l)a+=A[t];});console.log('глаз-плита',l,'площадь',Math.round(a),'соседи',[...(nb.get(l)||[])].join(','));});}
// ---------- 4. углы и многоугольники ----------
const allP=l=>l<K?P[l]:{...P[l-K],n:[-P[l-K].n[0],P[l-K].n[1],P[l-K].n[2]],c:[-P[l-K].c[0],P[l-K].c[1],P[l-K].c[2]]};
const ML=l=>l<K?(P[l].mid?l:l+K):l-K;
// глаз — прорезь: его треугольники убираем (-2), края прорези ложатся в плоскости соседних плит
F.forEach((_,t)=>{if(lab[t]>=0&&isEye(lab[t]))lab[t]=-2;});
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
console.log('точек на краях глаз',extra.size);
const VN=V.map(()=>new Set());F.forEach(f=>{for(let k=0;k<3;k++){VN[f[k]].add(f[(k+1)%3]);VN[f[(k+1)%3]].add(f[k]);}});
const jun=[];VL.forEach((s,v)=>{if(s.size>=3||extra.has(v)&&s.size>=1)jun.push(v);});const isJ=new Set(jun),cl=new Map(),CLU=[];
jun.forEach(s=>{if(cl.has(s))return;const id=CLU.length,q=[s];cl.set(s,id);for(let i=0;i<q.length;i++)VN[q[i]].forEach(o=>{if(isJ.has(o)&&!cl.has(o)&&V3.len(V3.sub(V[o],V[s]))<CL){cl.set(o,id);q.push(o);}});
  const L=new Set();q.forEach(v=>VL[v].forEach(l=>L.add(l)));CLU.push({vs:q,L:[...L]});});
const solve=(u,w)=>{const c0=V3.mul(u.vs.reduce((s,v)=>V3.add(s,V[v]),[0,0,0]),1/u.vs.length),Am=[[w,0,0],[0,w,0],[0,0,w]],b=V3.mul(c0,w);
  u.L.forEach(l=>{const p=allP(l),n=p.n,d=V3.dot(n,p.c);for(let i=0;i<3;i++){for(let j=0;j<3;j++)Am[i][j]+=n[i]*n[j];b[i]+=n[i]*d;}});
  const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]),D=det(Am),col=i=>Am.map((r,k)=>r.map((x,j)=>j===i?b[k]:x));
  return {p:[det(col(0))/D,det(col(1))/D,det(col(2))/D],c0};};
CLU.forEach(u=>{let w=.02,r;do{r=solve(u,w);w*=4;}while(V3.len(V3.sub(r.p,r.c0))>8&&w<50);u.p=r.p;u.mv=V3.len(V3.sub(r.p,r.c0));});
console.log('углов',CLU.length,'сдвиг: макс',Math.max(...CLU.map(u=>u.mv)).toFixed(1),'мм, средн',(CLU.reduce((a,u)=>a+u.mv,0)/CLU.length).toFixed(1));
const ids=[...new Set(lab)].filter(l=>l>=0),polys=[],bad=[];
ids.forEach(l=>{const nxt=new Map();F.forEach((f,t)=>{if(lab[t]!==l)return;for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],o=E.get(ek(a,b)).find(x=>x!==t);if(o===undefined||lab[o]!==l)nxt.set(a,b);}});
  const loops=[],used=new Set();nxt.forEach((_,s)=>{if(used.has(s))return;const L=[];let v=s;while(v!==undefined&&!used.has(v)){used.add(v);L.push(v);v=nxt.get(v);}loops.push(L);});loops.sort((a,b)=>b.length-a.length);
  const Q=[];loops[0].forEach(v=>{if(cl.has(v)){const id=cl.get(v);if(Q[Q.length-1]!==id)Q.push(id);}});while(Q.length>1&&Q[0]===Q[Q.length-1])Q.pop();
  if(loops.length>1)bad.push('дыр у '+l);if(Q.length<3){bad.push('углов '+Q.length+' у '+l);return;}if(new Set(Q).size!==Q.length)bad.push('угол дважды у '+l);polys.push({l,Q});});
console.log('многоугольников',polys.length,'замечаний',bad.length,bad.slice(0,10).join('; '));
// симметрия углов: пара по зеркальному набору плит
const key=L=>[...L].sort((a,b)=>a-b).join(','),byKey=new Map();CLU.forEach((u,i)=>{const k=key(u.L);(byKey.get(k)||byKey.set(k,[]).get(k)).push(i);});
let paired=0;CLU.forEach((u,i)=>{if(u.done)return;const mk=key(u.L.map(ML));if(mk===key(u.L)){u.p=[0,u.p[1],u.p[2]];u.done=true;u.mid=true;paired++;return;}
  const cand=(byKey.get(mk)||[]).filter(j=>!CLU[j].done);if(!cand.length)return;let bj=cand[0],bd=1e9;cand.forEach(j=>{const q=CLU[j].p,d=Math.hypot(q[0]+u.p[0],q[1]-u.p[1],q[2]-u.p[2]);if(d<bd){bd=d;bj=j;}});
  const m=CLU[bj],avg=[(u.p[0]-m.p[0])/2,(u.p[1]+m.p[1])/2,(u.p[2]+m.p[2])/2];u.p=avg;m.p=[-avg[0],avg[1],avg[2]];u.done=m.done=true;u.mate=bj;m.mate=i;paired+=2;});
console.log('углов в паре/на середине',paired,'из',CLU.length);
// выровнять грани (симметрия сохраняется), проверить
const ec=new Map();polys.forEach(({Q})=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],kk=a<b?a+'_'+b:b+'_'+a;ec.set(kk,(ec.get(kk)||0)+1);}));const hist={};ec.forEach(n=>hist[n]=(hist[n]||0)+1);console.log('рёбер по числу граней',JSON.stringify(hist));
c.EP={V:CLU.map(u=>u.p),P:polys.map(p=>p.Q)};{const d0=c.EP.P.map((Q,i)=>({i,d:g('polyDev')(c.EP.V,Q),n:Q.length,l:polys[i].l}));d0.sort((a,b)=>b.d-a.d);console.log('до выравнивания: худшие',d0.slice(0,8).map(x=>x.d.toFixed(1)+'мм/'+x.n+'уг/пл'+x.l).join(' '),'; >2мм:',d0.filter(x=>x.d>2).length);}// выравнивание: точка — среднее проекций на плоскости её граней; пары — зеркально, средние — на x=0
const E2=(()=>{let W=c.EP.V.map(p=>p.slice());const PP=c.EP.P,pn=g('polyNorm'),pc=g('polyC');for(let it=0;it<500;it++){const acc=W.map(()=>[0,0,0]),cnt=W.map(()=>0);
  PP.forEach(Q=>{const n=pn(W,Q),cc=pc(W,Q);Q.forEach(i=>{const d=V3.dot(V3.sub(W[i],cc),n);acc[i]=V3.add(acc[i],V3.sub(W[i],V3.mul(n,d)));cnt[i]++;});});
  W=W.map((p,i)=>cnt[i]?V3.mul(acc[i],1/cnt[i]):p);CLU.forEach((u,i)=>{if(u.mid)W[i][0]=0;else if(u.mate!==undefined&&u.mate>i){const a=W[i],b=W[u.mate],m=[(a[0]-b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];W[i]=m;W[u.mate]=[-m[0],m[1],m[2]];}});}
  return {V:W,P:PP.map(Q=>Q.slice())};})();c.E2=E2;
const dev=g(`Math.max(...E2.P.map(Q=>polyDev(E2.V,Q)))`),npl=g(`nonPlanar(E2,1).length`),mov=Math.max(...E2.V.map((p,i)=>V3.len(V3.sub(p,c.EP.V[i])))),asym=g(`mirrorMap(E2.V,1).filter(j=>j===-1).length`);
console.log('после выравнивания: неплоскость макс',dev.toFixed(2),'мм, неплоских >1мм',npl,', точки сдвинулись до',mov.toFixed(1),'мм, без пары',asym);
fs.writeFileSync(O('plates'+TAG+'.json'),JSON.stringify({V:E2.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:E2.P,lab:[...lab],eye:polys.map(p=>allP(p.l).eye)}));
// картинки: разбивка на сетке модели и готовый многогранник
const rnd=i=>{let x=Math.sin(i*12.9898+1)*43758.5453;x-=Math.floor(x);return x;};
const T=[],TG=[];E2.P.forEach((Q,i)=>g('earClip')(E2.V,Q).forEach(t=>{T.push(t);TG.push(i);}));
const EYE=polys.map(p=>allP(p.l).eye);
for(const v of ['front','side','iso'])render(O('pl'+TAG+'_'+v+'.png'),E2.V,T,i=>EYE[TG[i]]?[40,40,40]:[175,165,155],v,{shade:true,group:i=>TG[i]});
render(O('pl'+TAG+'_lab.png'),V,F,t=>lab[t]<0?[255,255,255]:eye[t]?[20,20,20]:[50+rnd(ML(lab[t])<lab[t]?ML(lab[t]):lab[t])*200|0,50+rnd((ML(lab[t])<lab[t]?ML(lab[t]):lab[t])+.31)*200|0,50+rnd((ML(lab[t])<lab[t]?ML(lab[t]):lab[t])+.77)*200|0],'front');

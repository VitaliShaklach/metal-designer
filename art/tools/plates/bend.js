// расчёт гибки: какие стыки гнуть, какие варить — по общим правилам, на любой фигуре; только цифры и картинка развёрток
// node art/tools/plates/bend.js [id=doberman8] [ang=135] [face=25] [max=300] [min=20] [bends=5] [sheet=1250x2500] [trace=1] [convex=1] [png=bend_x]
//   ang — наименьший угол между гранями после гибки; face — грань у сгиба не уже; max/min — длина линии сгиба; bends — сгибов на заготовку
//   trace=1 — при выборе сначала гнуть там, где у эталона нет нарисованного шва (сварка — где шов нарисован); convex=1 — только выпуклые (V)
// как модуль: require('./bend.js')(g).plan({V,P,S},o) → {blanks, joints, st}
// Правило вершины (вокруг вершины с дефектом угла хотя бы один стык — сварной) выполняется само: гнутые стыки не замыкаются в кольцо (лес).
module.exports=function(g){const V3=g('V3');
  // стыки деталей: пара деталей, линия (крайние точки A, B), длина, угол между гранями, V — выпуклый снаружи (изнутри гнуть на себя), m — вогнутый
  function joints(E){const B=g('polyBase')(E.V,E.P,E.S),R=g('buildParts')(B,1.5,1.5),V=E.V,J=new Map();
    R.edges.forEach(e=>{if(e.open||e.p.length!==2)return;const [p,q]=e.p[0]<e.p[1]?e.p:[e.p[1],e.p[0]],k=p+'_'+q;let j=J.get(k);if(!j)J.set(k,j={p,q,seg:[],dih:e.dih,convex:e.convex});j.seg.push([e.a,e.b]);});
    const L=[...J.values()].map((j,id)=>{const vs=[...new Set(j.seg.flat())],u=V3.norm(V3.sub(V[vs[1]],V[vs[0]])),t=i=>V3.dot(V3.sub(V[i],V[vs[0]]),u);
      let A=vs[0],Bv=vs[0];vs.forEach(i=>{if(t(i)<t(A))A=i;if(t(i)>t(Bv))Bv=i;});const ang=j.convex?j.dih:360-j.dih,len=j.seg.reduce((s,[a,b])=>s+V3.len(V3.sub(V[b],V[a])),0);
      // грань у сгиба: насколько деталь отходит от линии
      const uu=V3.norm(V3.sub(V[Bv],V[A])),off=pi=>Math.max(...R.parts[pi].full.map(i=>{const d=V3.sub(V[i],V[A]);return V3.len(V3.sub(d,V3.mul(uu,V3.dot(d,uu))));}));
      return {id,p:j.p,q:j.q,A,B:Bv,len,ang,kind:j.convex?'V':'m',face:Math.min(off(j.p),off(j.q)),seg:j.seg};});
    return {R,J:L};}
  // деталь на плоскости, вид снаружи: точка → [x,y]
  const flat=(V,P)=>{const o=V[P.full[0]],n=P.n;let u=Math.abs(n[0])<.9?[1,0,0]:[0,1,0];u=V3.norm(V3.sub(u,V3.mul(n,V3.dot(u,n))));const w=V3.cross(n,u),m=new Map();P.full.forEach(i=>{const d=V3.sub(V[i],o);m.set(i,[V3.dot(d,u),V3.dot(d,w)]);});return m;};
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const inside=(p,Q)=>{let c=false;for(let i=0,j=Q.length-1;i<Q.length;j=i++){const a=Q[i],b=Q[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
  const dSeg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
  // две детали развёртки налезают: стороны пересекаются насквозь или точка одной глубже 0,5 мм внутри другой
  function overlap(P,Q,eps=.5){for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];for(let j=0;j<Q.length;j++){const c=Q[j],d=Q[(j+1)%Q.length],d1=cr(c,d,a),d2=cr(c,d,b),d3=cr(a,b,c),d4=cr(a,b,d),s=Math.hypot(d[0]-c[0],d[1]-c[1])*eps,t=Math.hypot(b[0]-a[0],b[1]-a[1])*eps;
      if((d1>s&&d2<-s||d1<-s&&d2>s)&&(d3>t&&d4<-t||d3<-t&&d4>t))return true;}}
    const deep=(X,Y)=>X.some((p,i)=>{const m=[(p[0]+X[(i+1)%X.length][0])/2,(p[1]+X[(i+1)%X.length][1])/2];return [p,m].some(r=>inside(r,Y)&&Y.every((y,k)=>dSeg(r,y,Y[(k+1)%Y.length])>eps));});
    return deep(P,Q)||deep(Q,P);}
  // габарит развёртки: можно ли повернуть так, чтобы влезла в лист W × L
  const fits=(pts,W,L)=>{const h=g('convexHull')(pts);if(h.length<3)return true;return h.some((p,i)=>{const q=h[(i+1)%h.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),c=Math.cos(a),s=Math.sin(a);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    h.forEach(r=>{const x=c*r[0]+s*r[1],y=-s*r[0]+c*r[1];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);});const w=Math.min(x1-x0,y1-y0),l=Math.max(x1-x0,y1-y0);return w<=W&&l<=L;});};
  function plan(E,o){o=o||{};const ANG=o.ang??135,FACE=o.face??25,MAX=o.max??300,MIN=o.min??20,NB=o.bends??5,[SW,SL]=o.sheet||[1250,2500];
    const {R,J}=joints(E),V=E.V,N=R.parts.length,F2=R.parts.map(P=>flat(V,P)),mm=g('mirrorMap')(V);
    // зеркальный стык — по зеркальным концам
    const key=(a,b)=>a<b?a+'_'+b:b+'_'+a,byAB=new Map(J.map(j=>[key(j.A,j.B),j])),mi=i=>mm[i]===-2?i:mm[i];J.forEach(j=>{const m=byAB.get(key(mi(j.A),mi(j.B)));j.mate=m&&m!==j?m.id:-1;});
    const why=new Map();J.forEach(j=>{const w=j.ang<ANG?'угол':j.len>MAX?'длинная линия':j.len<MIN?'короткая линия':j.face<FACE?'узкая грань':o.convex&&j.kind!=='V'?'вогнутый':null;if(w)why.set(j.id,w);});
    // лучшие стыки — первыми: пологие и длинные; с калькой — где у эталона нарисован шов, в конец
    const score=j=>(180-j.ang)-j.len/10+(o.line&&o.line(j)?1000:0),order=J.filter(j=>!why.has(j.id)).sort((a,b)=>score(a)-score(b));
    // заготовки: детали, их место на развёртке (поворот, сдвиг), сгибы
    let T=R.parts.map((_,i)=>({parts:[i],bends:[],pl:new Map([[i,{c:1,s:0,x:0,y:0}]])})),of=R.parts.map((_,i)=>i);
    const at=(t,pi,v)=>{const f=t.pl.get(pi),p=F2[pi].get(v);return [f.c*p[0]-f.s*p[1]+f.x,f.s*p[0]+f.c*p[1]+f.y];},poly=(t,pi)=>R.parts[pi].full.map(v=>at(t,pi,v));
    const tryJoin=(T,of,j)=>{const a=of[j.p],b=of[j.q];if(a===b)return 'кольцо';const ta=T[a],tb=T[b];if(ta.bends.length+tb.bends.length+1>NB)return 'много сгибов';
      const a1=at(ta,j.p,j.A),b1=at(ta,j.p,j.B),a2=at(tb,j.q,j.A),b2=at(tb,j.q,j.B),th=Math.atan2(b1[1]-a1[1],b1[0]-a1[0])-Math.atan2(b2[1]-a2[1],b2[0]-a2[0]),c=Math.cos(th),s=Math.sin(th);
      const pl=new Map(ta.pl);tb.pl.forEach((f,pi)=>{const x0=c*f.x-s*f.y,y0=s*f.x+c*f.y,ax=c*a2[0]-s*a2[1],ay=s*a2[0]+c*a2[1];pl.set(pi,{c:c*f.c-s*f.s,s:s*f.c+c*f.s,x:x0-ax+a1[0],y:y0-ay+a1[1]});});
      const t={parts:ta.parts.concat(tb.parts),bends:ta.bends.concat(tb.bends,[j.id]),pl};
      for(const p of ta.parts)for(const q of tb.parts)if(overlap(poly(t,p),poly(t,q)))return 'налезает';
      if(!fits(t.parts.flatMap(pi=>poly(t,pi)),SW,SL))return 'не влезает в лист';
      const T2=T.slice(),of2=of.slice();T2[a]=t;T2[b]=null;t.parts.forEach(pi=>of2[pi]=a);return {T:T2,of:of2};};
    const done=new Set();order.forEach(j=>{if(done.has(j.id))return;done.add(j.id);const m=j.mate>=0?J[j.mate]:null;if(m)done.add(m.id);
      let r=tryJoin(T,of,j);if(typeof r==='string'){why.set(j.id,r);if(m)why.set(m.id,r);return;}
      if(m&&!why.has(m.id)){const r2=tryJoin(r.T,r.of,m);if(typeof r2==='string'){why.set(j.id,'зеркальный: '+r2);why.set(m.id,r2);return;}r=r2;}
      T=r.T;of=r.of;});
    const blanks=T.filter(Boolean).map(t=>({...t,net:t.parts.map(pi=>({pi,pts:poly(t,pi),full:R.parts[pi].full}))})),bent=new Set(blanks.flatMap(b=>b.bends));
    const weld=J.filter(j=>!bent.has(j.id)),cnt={};J.forEach(j=>{if(!bent.has(j.id)){const w=why.get(j.id)||'?';cnt[w]=(cnt[w]||0)+1;}});
    const dims=b=>{const P=b.net.flatMap(x=>x.pts),h=g('convexHull')(P);let best=[1e9,0];h.forEach((p,i)=>{const q=h[(i+1)%h.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),c=Math.cos(a),s=Math.sin(a);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;h.forEach(r=>{const x=c*r[0]+s*r[1],y=-s*r[0]+c*r[1];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);});if((x1-x0)*(y1-y0)<best[0]*best[1]||best[1]===0)best=[Math.min(x1-x0,y1-y0),Math.max(x1-x0,y1-y0)];});return best;};
    blanks.forEach(b=>{[b.W,b.L]=dims(b);});
    const st={parts:N,blanks:blanks.length,V:J.filter(j=>bent.has(j.id)&&j.kind==='V').length,m:J.filter(j=>bent.has(j.id)&&j.kind==='m').length,weld:weld.length,weldLen:weld.reduce((s,j)=>s+j.len,0),joints:J.length,
      longest:Math.max(...blanks.map(b=>b.L)),maxBends:Math.max(...blanks.map(b=>b.bends.length)),why:cnt,single:blanks.filter(b=>b.parts.length===1).length};
    return {blanks,joints:J,R,st,bent};}
  return {joints,plan,overlap};};

// ---------- запуск: цифры и картинка развёрток ----------
if(require.main===module){const fs=require('fs'),path=require('path'),vm=require('vm'),JS=path.join(__dirname,'../../js/'),{writePNG}=require('./png.js');
  const c={Math};vm.createContext(c);['mesh','edit','models-poly','figures'].forEach(f=>vm.runInContext(fs.readFileSync(JS+f+'.js','utf8'),c));const g=n=>vm.runInContext(n,c),V3=g('V3');
  const args=process.argv.slice(2),id=args.find(a=>!a.includes('='))||'doberman8',A=Object.fromEntries(args.filter(a=>a.includes('=')).map(a=>a.split('=')));
  let E,f=null;if(/\.json$/i.test(id)){const j=JSON.parse(fs.readFileSync(id,'utf8'));E={V:j.V,P:j.P,S:j.S||[]};f={ref:j.ref,frame:j.frame};}else{E=g(`modelPoly('${id}')`);f=g('FIGURES')[id]||{};}
  const o={ang:+(A.ang||135),face:+(A.face||25),max:+(A.max||300),min:+(A.min||20),bends:+(A.bends||5),sheet:(A.sheet||'1250x2500').split('x').map(Number),convex:A.convex==='1'};
  // калька: шов нарисован у эталона — линия в 3 мм хотя бы в двух пробах из трёх
  const rid=f.ref||id;if(A.trace==='1'){const K=require('./creases.js')(rid);let map=p=>p;if(f.frame){const rb=g('meshBox')(g('modelPoly')(rid).V),F0=f.frame[0],F1=f.frame[1];map=p=>p.map((x,i)=>(x-F0[i])*rb.size[i]/(F1[i]-F0[i])+rb.min[i]);}
    o.line=j=>{const P=o._R.parts,n1=P[j.p].n,n2=P[j.q].n,a=E.V[j.A],b=E.V[j.B],u=V3.norm(V3.sub(b,a));return [.25,.5,.75].filter(t=>{const r=K.profile(map(V3.add(a,V3.mul(V3.sub(b,a),t))),u,n1,n2);return r.line!==null&&Math.abs(r.line)<3;}).length>=2;};}
  const B=require('./bend.js')(g);o._R=B.joints(E).R;const r=B.plan(E,o),s=r.st;
  if(o.line){const lb=r.joints.filter(j=>o.line(j));console.log('стыков с нарисованным швом у эталона:',lb.length,'из них гнутых',lb.filter(j=>r.bent.has(j.id)).length);}
  console.log(`деталей ${s.parts} → заготовок ${s.blanks} (из них одиночных ${s.single}); сгибов V ${s.V}, m ${s.m}; сварных швов ${s.weld} из ${s.joints}, ${(s.weldLen/1000).toFixed(2)} м; самая длинная развёртка ${Math.round(s.longest)} мм; сгибов на заготовку до ${s.maxBends}`);
  console.log('почему варим:',Object.entries(s.why).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', '));
  // картинка: развёртки полками, сгибы V — красным пунктиром, m — синим, резка — чёрным
  if(A.png){const S=+(A.size||1600),pad=12,bl=r.blanks.filter(b=>b.parts.length>1).sort((a,b)=>b.L-a.L);let x=pad,y=pad,row=0;const items=[];
    const sc=Math.min(1.2,(S-2*pad)/Math.max(...bl.map(b=>b.L+pad),1));bl.forEach(b=>{const P=b.net.flatMap(n=>n.pts),h=g('convexHull')(P);let ba=0,bw=1e9;h.forEach((p,i)=>{const q=h[(i+1)%h.length],a=Math.atan2(q[1]-p[1],q[0]-p[0]),cc=Math.cos(a),ss=Math.sin(a);let y0=1e9,y1=-1e9;h.forEach(t=>{const yy=-ss*t[0]+cc*t[1];y0=Math.min(y0,yy);y1=Math.max(y1,yy);});if(y1-y0<bw){bw=y1-y0;ba=a;}});
      const cc=Math.cos(-ba),ss=Math.sin(-ba),rot=p=>[cc*p[0]-ss*p[1],ss*p[0]+cc*p[1]],R2=P.map(rot),x0=Math.min(...R2.map(p=>p[0])),y0=Math.min(...R2.map(p=>p[1])),w=(Math.max(...R2.map(p=>p[0]))-x0)*sc,hh=(Math.max(...R2.map(p=>p[1]))-y0)*sc;
      if(x+w>S-pad){x=pad;y+=row+pad;row=0;}const X=x,Y=y;items.push({b,tr:p=>{const q=rot(p);return [X+(q[0]-x0)*sc,Y+(q[1]-y0)*sc];}});x+=w+pad;row=Math.max(row,hh);});
    const H=Math.ceil(y+row+pad),px=Buffer.alloc(S*H*3,255),dot=(X,Y,cl)=>{X=Math.round(X);Y=Math.round(Y);for(let d=0;d<2;d++){if(X+d<0||X+d>=S||Y<0||Y>=H)continue;const i=(Y*S+X+d)*3;px[i]=cl[0];px[i+1]=cl[1];px[i+2]=cl[2];}};
    const line=(a,b,cl,dash)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let k=0;k<=n;k++){if(dash&&(k%8)>4)continue;dot(a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n,cl);}};
    items.forEach(({b,tr})=>{const bend=new Map();b.bends.forEach(id=>{const j=r.joints[id];j.seg.forEach(([p,q])=>bend.set(p<q?p+'_'+q:q+'_'+p,j.kind));});
      b.net.forEach(n=>n.pts.forEach((p,k)=>{const v=n.full[k],w2=n.full[(k+1)%n.full.length],kd=bend.get(v<w2?v+'_'+w2:w2+'_'+v);line(tr(p),tr(n.pts[(k+1)%n.pts.length]),kd==='V'?[220,40,30]:kd==='m'?[30,80,220]:[0,0,0],!!kd);}));});
    const out=path.join(__dirname,'out',A.png+'.png');writePNG(out,S,H,px);console.log('картинка',path.relative(process.cwd(),out),'—',bl.length,'заготовок со сгибами');}}

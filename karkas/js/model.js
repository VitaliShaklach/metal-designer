/* ---------- модель каркаса: узлы + трубы + стыки (всё в мм) ----------
   M = {meta, nodes:[{id,x,y,z}], members:[{id,a,b,prof,rot,endA,endB,grp}], groups:[{id,name,qty,mirror}]}
   ось Y — вверх. Узел — точка пересечения осей труб.
   Конец трубы: 'auto' | 'miter' (скос с парной трубой) | 'butt' (встык, упирается в грань другой) | 'cap' (сквозная, накрывает торцы других) | 'free' (ровный, без подрезки) */
const V3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]),norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}};
let M=emptyModel();
function emptyModel(){return {v:1,meta:{name:'Новый каркас',rev:1,steel:'Ст3, труба х/к',paint:''},nodes:[],members:[],groups:[]};}
const nodeById=id=>M.nodes.find(n=>n.id===id);
const P3=n=>[n.x,n.y,n.z];
const nextId=(arr,p)=>{let i=1;while(arr.some(o=>o.id===p+i))i++;return p+i;};

// оси сечения трубы: d — вдоль оси (от a к b), u — ширина w, v — высота h. По умолчанию h смотрит вверх (или вдоль Z для вертикальных труб); rot — поворот вокруг оси, градусы
function frame(m){const A=P3(nodeById(m.a)),B=P3(nodeById(m.b)),d=V3.norm(V3.sub(B,A));
  let up=Math.abs(d[1])>.95?[0,0,1]:[0,1,0];
  let u=V3.norm(V3.cross(up,d)),v=V3.cross(d,u);
  const r=(m.rot||0)*Math.PI/180;if(r){const c=Math.cos(r),s=Math.sin(r);const u2=V3.add(V3.mul(u,c),V3.mul(v,s)),v2=V3.add(V3.mul(u,-s),V3.mul(v,c));u=u2;v=v2;}
  return {A,B,d,u,v,L:V3.len(V3.sub(B,A))};}
// половина размера сечения трубы m в направлении dir (перпендикулярно её оси)
function halfExt(m,dir){const f=frame(m),p=prof(m.prof);return (Math.abs(V3.dot(dir,f.u))*p.w+Math.abs(V3.dot(dir,f.v))*p.h)/2;}
// ширина сечения трубы в плоскости, где лежат она и направление dir (для скоса)
function inPlaneW(m,dir){const f=frame(m),p=prof(m.prof),n=V3.cross(f.d,dir);if(V3.len(n)<1e-9)return p.w;const nn=V3.norm(n);
  return Math.abs(V3.dot(nn,f.u))<Math.abs(V3.dot(nn,f.v))?p.w:p.h;}
// лежит ли точка P на теле трубы m (не на её концах) — Т-стык
function throughAt(m,P){const f=frame(m),ap=V3.sub(P,f.A),s=V3.dot(ap,f.d);if(s<1||s>f.L-1)return false;return V3.len(V3.sub(ap,V3.mul(f.d,s)))<.5;}

// концы всех труб: для каждого конца — тип, подрезка и угол реза
// ext — насколько наружная (длинная) грань выходит за узел (+) или не доходит (−); cut — плоскость реза для 3D: {p:точка, n:нормаль наружу}; ang — угол реза к оси (90 — прямой)
function resolveEnds(){const res={};
  const ends=new Map();M.members.forEach(m=>['a','b'].forEach(k=>{const id=m[k];if(!ends.has(id))ends.set(id,[]);ends.get(id).push({m,k});}));
  const outDir=(e)=>{const f=frame(e.m);return e.k==='a'?f.d:V3.mul(f.d,-1);};   // от узла внутрь трубы
  ends.forEach((E,nid)=>{const N=P3(nodeById(nid));
    const T=M.members.filter(m=>m.a!==nid&&m.b!==nid&&throughAt(m,N));
    const type=e=>e.m[e.k==='a'?'endA':'endB']||'auto';
    // auto: сквозная труба есть → встык; 2 конца не по одной прямой → скос; 2 по прямой → ровно; 3 и больше → главная (вертикальная) накрывает, остальные встык
    let main=null;
    const auto=E.map(e=>{const t=type(e);if(t!=='auto')return t;
      if(T.length)return 'butt';
      if(E.length===1)return 'free';
      if(E.length===2){const c=V3.dot(outDir(E[0]),outDir(E[1]));if(c<-.999)return 'free';
        const pa=prof(E[0].m.prof),pb=prof(E[1].m.prof);if(pa.w===pb.w&&pa.h===pb.h)return 'miter';   // одинаковое сечение — скос
        const me=prof(e.m.prof),ot=E[0]===e?pb:pa;return me.w*me.h>=ot.w*ot.h?'cap':'butt';}   // разное — толстая сквозная, тонкая встык
      return null;});
    if(E.length>=3&&!T.length){const mit=E.filter((e,i)=>auto[i]==='miter');
      if(mit.length<2){main=E.find((e,i)=>auto[i]===null&&Math.abs(outDir(e)[1])>.9)||E.find((e,i)=>auto[i]===null);}
      E.forEach((e,i)=>{if(auto[i]===null)auto[i]=e===main?'cap':'butt';});}
    E.forEach((e,i)=>{const t=auto[i],a=outDir(e),key=e.m.id+':'+e.k,p=prof(e.m.prof);
      const others=E.filter(o=>o!==e).map(o=>o.m).concat(T);
      if(t==='miter'){const partner=E.find((o,j)=>o!==e&&auto[j]==='miter');
        if(partner){const b=outDir(partner),th=Math.acos(Math.max(-1,Math.min(1,V3.dot(a,b)))),w=inPlaneW(e.m,b);
          res[key]={type:'miter',ext:Math.round(w/2/Math.tan(th/2)*10)/10,ang:th/2*180/Math.PI,cut:{p:N,n:V3.norm(V3.sub(b,a))},with:partner.m.id};return;}}
      if(t==='butt'||t==='miter'){   // упирается в грань самой «поперечной» трубы
        let tgt=null,best=-1;others.forEach(o=>{const s=1-Math.abs(V3.dot(frame(o).d,a));if(s>best){best=s;tgt=o;}});
        if(!tgt){res[key]={type:'free',ext:0,ang:90,cut:{p:N,n:V3.mul(a,-1)}};return;}
        // грань сквозной трубы, в которую упираемся: её нормаль n (к нашей трубе), расстояние от оси до грани sh; рез — по плоскости грани
        const tf=frame(tgt),tp=prof(tgt.prof),cu=V3.dot(a,tf.u),cv=V3.dot(a,tf.v);
        const useU=Math.abs(cu)>=Math.abs(cv),n=V3.mul(useU?tf.u:tf.v,(useU?cu:cv)>=0?1:-1),sh=(useU?tp.w:tp.h)/2,c=Math.max(.05,V3.dot(n,a));
        const phi=Math.acos(Math.min(1,c)),w=inPlaneW(e.m,n);
        res[key]={type:'butt',ext:Math.round((-sh/c+w/2*Math.tan(phi))*10)/10,ang:90-phi*180/Math.PI,cut:{p:V3.add(N,V3.mul(n,sh)),n:V3.mul(n,-1)},with:tgt.id};return;}
      if(t==='cap'){const ex=Math.max(0,...others.map(o=>halfExt(o,a)));res[key]={type:'cap',ext:ex,ang:90,cut:{p:V3.add(N,V3.mul(a,-ex)),n:V3.mul(a,-1)}};return;}
      res[key]={type:'free',ext:0,ang:90,cut:{p:N,n:V3.mul(a,-1)}};});});
  return res;}
// длина реза каждой трубы (по наружным граням) и углы
function memberCuts(){const R=resolveEnds();return M.members.map(m=>{const f=frame(m),ea=R[m.id+':a'],eb=R[m.id+':b'];
  return {m,ea,eb,L:Math.round(f.L+ea.ext+eb.ext),angA:Math.round(ea.ang),angB:Math.round(eb.ang)};});}
// группы: количество сборок (без группы — 1)
const grpOf=id=>M.groups.find(g=>g.id===id);
const grpQty=id=>{const g=grpOf(id);return g?(g.qty||1):1;};
// позиции: одинаковые (профиль, длина, углы) в одной группе — одна позиция; номера «группа.позиция»
function positions(){const cuts=memberCuts(),gl=[...M.groups.map(g=>g.id),''],out=[];
  gl.forEach((gid,gi)=>{const mine=cuts.filter(c=>(c.m.grp||'')===gid);if(!mine.length)return;const map=new Map();
    mine.forEach(c=>{const an=[c.angA,c.angB].sort((x,y)=>x-y),k=[c.m.prof,c.L,an[0],an[1]].join('|');if(!map.has(k))map.set(k,{prof:c.m.prof,L:c.L,ang:an,ids:[],grp:gid});map.get(k).ids.push(c.m.id);});
    [...map.values()].sort((a,b)=>prof(b.prof).w*prof(b.prof).h-prof(a.prof).w*prof(a.prof).h||b.L-a.L).forEach((p,i)=>{
      p.no=(gid?gi+1:M.groups.length+1)+'.'+(i+1);p.qty=p.ids.length;p.total=p.qty*grpQty(gid);p.kg=p.L/1000*prof(p.prof).kgm*p.total;out.push(p);});});
  return out;}
const massTotal=()=>positions().reduce((s,p)=>s+p.kg,0);
// раскрой хлыстов: первый подходящий по убыванию, рез 2 мм; хлыст 6000
function nesting(stock=6000,kerf=2){const by={};positions().forEach(p=>{(by[p.prof]=by[p.prof]||[]);for(let i=0;i<p.total;i++)by[p.prof].push({L:p.L,no:p.no});});
  return Object.entries(by).map(([pid,list])=>{list.sort((a,b)=>b.L-a.L);const bars=[];
    list.forEach(it=>{if(it.L>stock){bars.push({cuts:[it],left:0,long:true});return;}let bar=bars.find(b=>!b.long&&b.left>=it.L+kerf);if(!bar){bar={cuts:[],left:stock};bars.push(bar);}bar.cuts.push(it);bar.left-=it.L+kerf;});
    const need=list.reduce((s,i)=>s+i.L,0);return {prof:pid,bars,need,waste:bars.reduce((s,b)=>s+Math.max(0,b.left),0)};});}
// габарит по осям труб с учётом сечения
function bbox(){if(!M.nodes.length)return {min:[0,0,0],max:[0,0,0]};const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
  M.members.forEach(m=>{const f=frame(m),p=prof(m.prof);[f.A,f.B].forEach(P=>[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([s,t])=>{const q=V3.add(P,V3.add(V3.mul(f.u,s*p.w/2),V3.mul(f.v,t*p.h/2)));for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],q[i]);mx[i]=Math.max(mx[i],q[i]);}}));});
  M.nodes.forEach(n=>{const q=P3(n);if(!M.members.length)for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],q[i]);mx[i]=Math.max(mx[i],q[i]);}});
  return {min:mn,max:mx};}
// правка
function addNode(x,y,z){const ex=M.nodes.find(n=>Math.hypot(n.x-x,n.y-y,n.z-z)<.5);if(ex)return ex;const n={id:nextId(M.nodes,'n'),x:Math.round(x),y:Math.round(y),z:Math.round(z)};M.nodes.push(n);return n;}
function addMember(a,b,pr,grp){if(a===b||M.members.some(m=>(m.a===a&&m.b===b)||(m.a===b&&m.b===a)))return null;const m={id:nextId(M.members,'m'),a,b,prof:pr||'40x40x1.5',rot:0,endA:'auto',endB:'auto',grp:grp||''};M.members.push(m);return m;}
function delMember(id){M.members=M.members.filter(m=>m.id!==id);gcNodes();}
function delNode(id){M.members=M.members.filter(m=>m.a!==id&&m.b!==id);M.nodes=M.nodes.filter(n=>n.id!==id);}
function gcNodes(){const used=new Set(M.members.flatMap(m=>[m.a,m.b]));M.nodes=M.nodes.filter(n=>used.has(n.id));}
// копия набора труб со сдвигом (×n) — новые узлы и трубы; grp — группа копий
function copyMembers(ids,dx,dy,dz,n,grp){const made=[];for(let k=1;k<=n;k++){const map={};
  ids.forEach(id=>{const m=M.members.find(x=>x.id===id);if(!m)return;const nn=['a','b'].map(e=>{const o=nodeById(m[e]);return addNode(o.x+dx*k,o.y+dy*k,o.z+dz*k).id;});
    const c=addMember(nn[0],nn[1],m.prof,grp!==undefined?grp:m.grp);if(c){c.rot=m.rot;c.endA=m.endA;c.endB=m.endB;made.push(c.id);}});}
  return made;}
// зеркальная копия относительно плоскости axis=c
function mirrorMembers(ids,axis,c,grp){const i='xyz'.indexOf(axis),made=[];
  ids.forEach(id=>{const m=M.members.find(x=>x.id===id);if(!m)return;const nn=['a','b'].map(e=>{const o=nodeById(m[e]),q=[o.x,o.y,o.z];q[i]=2*c-q[i];return addNode(q[0],q[1],q[2]).id;});
    const cpy=addMember(nn[0],nn[1],m.prof,grp!==undefined?grp:m.grp);if(cpy){cpy.rot=m.rot;cpy.endA=m.endA;cpy.endB=m.endB;made.push(cpy.id);}});return made;}
// проверка и починка загруженной модели
function normModel(o){const r=Object.assign(emptyModel(),o||{});r.meta=Object.assign(emptyModel().meta,r.meta||{});
  r.nodes=(r.nodes||[]).map(n=>({id:String(n.id),x:+n.x||0,y:+n.y||0,z:+n.z||0}));const ids=new Set(r.nodes.map(n=>n.id));
  r.members=(r.members||[]).filter(m=>ids.has(String(m.a))&&ids.has(String(m.b))&&m.a!==m.b).map(m=>({id:String(m.id),a:String(m.a),b:String(m.b),prof:PROFILES[m.prof]?m.prof:'40x40x1.5',rot:+m.rot||0,endA:m.endA||'auto',endB:m.endB||'auto',grp:m.grp||''}));
  r.groups=(r.groups||[]).map(g=>({id:String(g.id),name:g.name||String(g.id),qty:Math.max(1,+g.qty||1),mirror:!!g.mirror}));return r;}
// ---------- касания: труба лежит на другой (гранью, без общего узла) — приварить; пересечение насквозь — ошибка модели ----------
// ближайшие точки двух отрезков: P = A0 + s·u (0…La), Q = B0 + t·v (0…Lb)
function segClosest(A0,u,La,B0,v,Lb){const w=V3.sub(A0,B0),b=V3.dot(u,v),d=V3.dot(u,w),e=V3.dot(v,w),den=1-b*b;
  let s,t;if(den<1e-9){s=0;t=e;}else{s=(b*e-d)/den;t=(e-b*d)/den;}
  const cl=(x,L)=>Math.max(0,Math.min(L,x));s=cl(s,La);t=cl(b*s+e,Lb);s=cl(b*t-d,La);t=cl(b*s+e,Lb);
  const P=V3.add(A0,V3.mul(u,s)),Q=V3.add(B0,V3.mul(v,t));return {P,Q,s,t,dist:V3.len(V3.sub(Q,P))};}
// tol — зазор до 2 мм ещё касание; sink — врезание до 5 мм (ровная труба на наклонной) тоже «лежит»
function contacts(tol=2,sink=5){const out=[],ms=M.members;
  for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++){const a=ms[i],b=ms[j];
    if(a.a===b.a||a.a===b.b||a.b===b.a||a.b===b.b)continue;   // общий узел — это стык, его считают концы
    const fa=frame(a),fb=frame(b);
    if([a.a,a.b].some(n=>throughAt(b,P3(nodeById(n))))||[b.a,b.b].some(n=>throughAt(a,P3(nodeById(n)))))continue;   // Т-узел
    const c=segClosest(fa.A,fa.d,fa.L,fb.A,fb.d,fb.L);if(c.dist<1e-6)continue;
    const n=V3.norm(V3.sub(c.Q,c.P)),need=halfExt(a,n)+halfExt(b,n);
    // касание должно быть в теле обеих труб (не за концами)
    const inA=c.s>-1&&c.s<fa.L+1,inB=c.t>-1&&c.t<fb.L+1;if(!inA||!inB)continue;
    const gap=c.dist-need;
    if(gap<=tol&&gap>=-sink)out.push({type:'rest',a:a.id,b:b.id,p:V3.add(c.P,V3.mul(n,halfExt(a,n))),n});
    else if(gap<-sink)out.push({type:'clash',a:a.id,b:b.id,p:V3.mul(V3.add(c.P,c.Q),.5),gap:Math.round(gap)});}
  return out;}
// на чём лежит / что лежит на трубе (id труб)
const touching=id=>contacts().filter(c=>c.type==='rest'&&(c.a===id||c.b===id)).map(c=>c.a===id?c.b:c.a);

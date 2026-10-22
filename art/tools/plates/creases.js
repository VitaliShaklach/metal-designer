// мерило «швы на изломах»: насколько наши швы отстоят от настоящих изломов поверхности эталона и от нарисованных на ней линий
// node art/tools/plates/creases.js [id=doberman7 | файл.json {V,P}]   — после prep.js (нужен out/mesh.json) и tracing.js (облако линий)
// как модуль: const K=require('./creases.js')(id); K.poly(V,P) / K.samples([{m,u,n1,n2}]) → {n,in3,crease:[гистограмма],line:[…],worst}
const fs=require('fs'),path=require('path'),vm=require('vm'),D=__dirname,JS=path.join(D,'../../js/');
module.exports=function(id){id=id||'doberman7';const c={Math,Buffer,atob};c.window=c;vm.createContext(c);
  ['mesh','edit','models-poly','trace','trace-'+id].forEach(f=>vm.runInContext(fs.readFileSync(JS+f+'.js','utf8'),c));
  const g=n=>vm.runInContext(n,c),V3=g('V3');
  // эталон в мм сайта; нормали треугольников в клетках 3 мм
  const M=JSON.parse(fs.readFileSync(path.join(D,'out/mesh.json'),'utf8'));c.M0={V:M.V,F:M.F};
  const Mf=g(`(b=>fitMesh(M0,{W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(M0.V))`);
  const H=new Map(),CS=3,key=(i,j,k)=>((i+256)*512+j+256)*512+k+256,TN=[],TC=[],TA=[];
  Mf.F.forEach((f,i)=>{const a=Mf.V[f[0]],b=Mf.V[f[1]],cc=Mf.V[f[2]],n=V3.cross(V3.sub(b,a),V3.sub(cc,a)),ar=V3.len(n)/2;TN.push(ar?V3.mul(n,1/(2*ar)):[0,0,0]);TA.push(ar);
    const ce=[(a[0]+b[0]+cc[0])/3,(a[1]+b[1]+cc[1])/3,(a[2]+b[2]+cc[2])/3];TC.push(ce);const k=key(...ce.map(x=>Math.floor(x/CS)));let h=H.get(k);if(!h)H.set(k,h=[]);h.push(i);});
  // нормаль эталона у точки: по площади, треугольники в R мм; null — поверхности рядом нет
  const nearN=(p,R=2.5)=>{const g0=p.map(x=>Math.floor(x/CS));let s=[0,0,0],w=0,dmin=1e9;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const h=H.get(key(g0[0]+dx,g0[1]+dy,g0[2]+dz));if(h)for(const i of h){const d=Math.hypot(TC[i][0]-p[0],TC[i][1]-p[1],TC[i][2]-p[2]);dmin=Math.min(dmin,d);if(d<=R){s=V3.add(s,V3.mul(TN[i],TA[i]));w+=TA[i];}}}
    return w&&dmin<5?V3.norm(s):null;};
  // расстояние от точки до поверхности эталона (по плоскости ближайшего треугольника, поиск в 9 мм); 99 — далеко
  const surfD=p=>{const g0=p.map(x=>Math.floor(x/CS));let bi=-1,bd=1e9;for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)for(let dz=-3;dz<=3;dz++){const h=H.get(key(g0[0]+dx,g0[1]+dy,g0[2]+dz));if(h)for(const i of h){const d=Math.hypot(TC[i][0]-p[0],TC[i][1]-p[1],TC[i][2]-p[2]);if(d<bd){bd=d;bi=i;}}}
    return bi<0?99:Math.min(bd,Math.abs(V3.dot(V3.sub(p,TC[bi]),TN[bi]))+Math.max(0,bd-3));};
  const T=g(`traceLoad(TRACE['${id}'])`),tn=g('traceNear');
  // поперёк шва в точке m (u — вдоль шва, n1/n2 — нормали граней, dir — к грани 1): где нормаль эталона переходит от n2 к n1; где ближайшая нарисованная линия
  // знак: + — сторона грани 1; излом — смена знака «похожесть на n1 минус на n2», ближайшая к шву
  const profile=(m,u,n1,n2)=>{const dir=V3.norm(V3.cross(u,V3.norm(V3.add(n1,n2))));let prev=null;const cr=[],ln=[];
    for(let s=-14;s<=14;s+=.5){const p=V3.add(m,V3.mul(dir,s)),nr=nearN(p);if(nr){const sc=V3.dot(nr,n1)-V3.dot(nr,n2);if(prev&&(prev[1]<0)!==(sc<0)&&Math.abs(sc-prev[1])>.02)cr.push(prev[0]+(s-prev[0])*(-prev[1])/(sc-prev[1]));prev=[s,sc];}
      const j=tn(T,p[0],p[1],p[2],1,1);if(j>=0&&Math.hypot(T.P[j*3]-p[0],T.P[j*3+1]-p[1],T.P[j*3+2]-p[2])<1.6)ln.push(s);}
    const nz=a=>a.length?a.reduce((x,y)=>Math.abs(y)<Math.abs(x)?y:x):null;return {cross:nz(cr),line:nz(ln)};};
  const hist=a=>{const b=[0,0,0,0,0];a.forEach(x=>b[Math.min(4,Math.floor(Math.abs(x)/3))]++);return b;};
  const sum=rows=>{const cr=rows.filter(r=>r.crease!==null),li=rows.filter(r=>r.line!==null);
    return {n:rows.length,nc:cr.length,in3:cr.length?cr.filter(r=>Math.abs(r.crease)<3).length/cr.length:0,crease:hist(cr.map(r=>r.crease)),nl:li.length,line3:li.length?li.filter(r=>Math.abs(r.line)<3).length/li.length:0,line:hist(li.map(r=>r.line)),
      worst:cr.slice().sort((a,b)=>Math.abs(b.crease)-Math.abs(a.crease)).slice(0,10).map(r=>({at:r.m.map(Math.round),crease:+r.crease.toFixed(1),line:r.line===null?null:+r.line.toFixed(1),dih:Math.round(r.dih)}))};};
  // многогранник: каждое общее ребро двух граней с изломом > MIN°, длиннее 25 мм — 3 профиля
  const poly=(V,P,MIN=10)=>{const EF=new Map();P.forEach((Q,fi)=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],kk=a<b?a+'_'+b:b+'_'+a;if(!EF.has(kk))EF.set(kk,[]);EF.get(kk).push(fi);}));
    const pn=g('polyNorm'),rows=[];EF.forEach((fs,kk)=>{if(fs.length!==2)return;const [a,b]=kk.split('_').map(Number),n1=pn(V,P[fs[0]]),n2=pn(V,P[fs[1]]),dih=Math.acos(Math.max(-1,Math.min(1,V3.dot(n1,n2))))*180/Math.PI;if(dih<MIN)return;
      const L=V3.len(V3.sub(V[b],V[a]));if(L<25)return;const u=V3.norm(V3.sub(V[b],V[a])),cs=[],ls=[];
      [.3,.5,.7].forEach(fr=>{const r=profile(V3.add(V[a],V3.mul(V3.sub(V[b],V[a]),fr)),u,n1,n2);if(r.cross!==null)cs.push(r.cross);if(r.line!==null)ls.push(r.line);});
      rows.push({m:V3.mul(V3.add(V[a],V[b]),.5),dih,crease:cs.length?cs.reduce((x,y)=>x+y,0)/cs.length:null,line:ls.length?ls.reduce((x,y)=>Math.abs(y)<Math.abs(x)?y:x):null});});
    return sum(rows);};
  // отдельные места шва: [{m — точка, u — вдоль шва, n1, n2 — нормали плит}] (для границ меток в plates.js)
  const samples=S=>sum(S.map(s=>{const r=profile(s.m,s.u,s.n1,s.n2);return {m:s.m,dih:Math.acos(Math.max(-1,Math.min(1,V3.dot(s.n1,s.n2))))*180/Math.PI,crease:r.cross,line:r.line};}));
  const show=(tag,r)=>console.log(`${tag}: рёбер ${r.n}, излом найден у ${r.nc}: в 3 мм ${Math.round(r.in3*100)}% [${r.crease.join('/')}]; линия у ${r.nl}: в 3 мм ${Math.round(r.line3*100)}% [${r.line.join('/')}]  (0-3/3-6/6-9/9-12/12+ мм)`);
  return {poly,samples,show,nearN,profile,surfD,V3};};
if(require.main===module){const a=process.argv[2]||'doberman7',K=module.exports(/\.json$/i.test(a)?(process.argv[3]||'doberman7'):a);
  let V,P;if(/\.json$/i.test(a)){const j=JSON.parse(fs.readFileSync(a,'utf8'));V=j.V;P=j.P;}else{const c={Math};vm.createContext(c);vm.runInContext(fs.readFileSync(JS+'mesh.js','utf8')+';'+fs.readFileSync(JS+'edit.js','utf8')+';'+fs.readFileSync(JS+'models-poly.js','utf8'),c);const m=vm.runInContext(`modelPoly('${a}')`,c);V=m.V;P=m.P;}
  const r=K.poly(V,P);K.show(path.basename(a),r);console.log('худшие:',r.worst.map(w=>`${w.at.join(',')} излом ${w.crease} линия ${w.line} (${w.dih}°)`).join(' | '));}

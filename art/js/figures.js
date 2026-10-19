/* ---------- Встроенные фигуры: гладкая форма из эллипсоидов → сетка → упрощение до граней ----------
   Мм, Y вверх, морда на +Z. Голова на стену — открытая спина (срез по плоскости стены). */
const SDF={
  ell:(p,c,r)=>{const x=(p[0]-c[0])/r[0],y=(p[1]-c[1])/r[1],z=(p[2]-c[2])/r[2];return (Math.hypot(x,y,z)-1)*Math.min(r[0],r[1],r[2]);},
  // эллипсоид, повёрнутый вокруг Z (a) и X (b), градусы
  ellR:(p,c,r,a=0,b=0)=>{let x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2];const ca=Math.cos(-a*Math.PI/180),sa=Math.sin(-a*Math.PI/180);[x,y]=[ca*x-sa*y,sa*x+ca*y];
    const cb=Math.cos(-b*Math.PI/180),sb=Math.sin(-b*Math.PI/180);[y,z]=[cb*y-sb*z,sb*y+cb*z];return SDF.ell([x,y,z],[0,0,0],r);},
  cap:(p,a,b,r)=>{const ab=V3.sub(b,a),ap=V3.sub(p,a),t=Math.max(0,Math.min(1,V3.dot(ap,ab)/V3.dot(ab,ab)));return V3.len(V3.sub(ap,V3.mul(ab,t)))-r(t);},
  smin:(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k/4;},
  U:(k,...d)=>d.reduce((a,b)=>SDF.smin(a,b,k))};
// два уха / рога — зеркально по X
const sym=(f)=>p=>Math.min(f(p),f([-p[0],p[1],p[2]]));

const FIGURES={
  dog:{name:'Голова собаки (на стену)',H:600,faces:260,back:-150,
    sdf:p=>{const ear=sym(q=>SDF.ellR(q,[125,545,-25],[62,150,26],-18,-8))(p);
      return SDF.U(45,
        SDF.ell(p,[0,360,0],[175,185,170]),          // череп
        SDF.ell(p,[0,252,205],[88,84,195]),            // морда
        SDF.ell(p,[0,268,385],[50,42,40]),              // нос
        sym(q=>SDF.ell(q,[95,250,60],[95,105,110]))(p), // щёки
        SDF.ell(p,[0,178,215],[60,38,140]),             // нижняя челюсть
        SDF.ell(p,[0,110,-30],[150,170,140]),           // шея
        ear);},
    box:[[-330,-20,-150],[330,720,460]]},
  bull:{name:'Голова быка (на стену)',H:620,faces:300,back:-150,
    sdf:p=>{const horn=sym(q=>SDF.U(30,SDF.cap(q,[150,470,0],[300,520,10],t=>48-14*t),SDF.cap(q,[300,520,10],[400,640,30],t=>34-22*t)))(p);
      const ear=sym(q=>SDF.ellR(q,[235,410,-20],[85,40,28],-12,0))(p);
      return SDF.U(40,
        SDF.ell(p,[0,420,0],[170,140,160]),            // лоб
        SDF.ell(p,[0,270,110],[135,190,130]),          // морда вниз
        SDF.ell(p,[0,140,200],[118,82,112]),           // нос — широкий
        sym(q=>SDF.ell(q,[52,150,292],[30,26,20]))(p), // ноздри
        SDF.ell(p,[0,180,-40],[170,190,130]),          // шея
        Math.min(horn,ear));},
    box:[[-460,-20,-150],[460,720,360]]}};

// построить фигуру: формула → плотная сетка → открытая спина
function figureMesh(id,cell=12){const f=FIGURES[id];if(f.poly)return f.build();const sd=p=>Math.max(f.sdf(p),f.back-p[2],-p[1]);   // срез стеной сзади и снизу
  let m=sdfMesh(sd,f.box[0],f.box[1],cell);m=openCut(m,2,f.back,-1,cell*.8);return m;}

/* ---------- Доберман: модель руками, как у мастеров — крупные плоские грани ----------
   Голова и шея — 6 сечений от стены (z=0) к носу; между соседними — четырёхугольные грани.
   Уши — острые пирамиды, глаза — впадина. Точки задаём справа (x ≥ 0), левая половина — зеркало. */
function buildDoberman(){
  const R=[[0,[[0,0],[80,15],[135,190],[138,335],[118,415],[0,435]]],
    [110,[[0,60],[85,60],[130,195],[135,340],[110,428],[0,450]]],
    [210,[[0,215],[88,222],[120,280],[122,345],[88,410],[0,428]]],
    [290,[[0,200],[62,208],[78,250],[76,315],[52,356],[0,372]]],
    [370,[[0,195],[50,200],[58,240],[54,298],[36,322],[0,334]]],
    [405,[[0,205],[36,208],[42,240],[40,275],[28,300],[0,308]]]];
  const V=[],fixd=[],mir=[];const add=(p,f)=>{V.push(p);fixd.push(f||{});return V.length-1;};
  // вершина справа и её зеркало (на середине — одна)
  const pt=(p,f)=>{const i=add(p,Object.assign({mid:p[0]===0},f));mir[i]=p[0]===0?i:add([-p[0],p[1],p[2]],f);if(p[0]!==0)mir[mir[i]]=i;return i;};
  const ring=R.map(([z,ps],ri)=>ps.map(([x,y])=>pt([x,y,z],ri===0?{wall:1}:ri===R.length-1?{cap:z}:{})));
  const P=[];const quad=(i,j)=>[ring[i][j],ring[i][j+1],ring[i+1][j+1],ring[i+1][j]];
  for(let i=0;i<R.length-1;i++)for(let j=0;j<5;j++){
    if(i===0&&j===4){ // макушка у стены — тут стоит ухо
      const A=ring[0][4],B=ring[0][5],C=ring[1][5],D=ring[1][4],G=pt([48,450,55]),T=pt([150,660,50]);
      // ушная раковина: точка K утоплена внутрь уха — передняя грань становится воронкой из трёх
      const c3=V3.mul(V3.add(V3.add(V[G],V[D]),V[T]),1/3),K=pt(V3.add(V3.mul(c3,.55),V3.mul(V[A],.45)));
      P.push([G,A,B],[G,B,C],[G,C,D],[G,D,K],[D,T,K],[T,G,K],[A,D,T],[G,A,T]);continue;}
    if(i===2&&j===3){ // глаз — впадина посреди грани
      const q=quad(i,j),c=V3.mul(q.reduce((s,k)=>V3.add(s,V[k]),[0,0,0]),.25),n=V3.norm(V3.cross(V3.sub(V[q[2]],V[q[0]]),V3.sub(V[q[3]],V[q[1]])));
      const E=pt(V3.add(c,V3.mul(n,V3.dot(n,V3.sub(c,[0,300,120]))>0?-18:18)));q.forEach((k,m)=>P.push([k,q[(m+1)%4],E]));continue;}
    P.push(quad(i,j));}
  const cap=ring[R.length-1];P.push([...cap,...cap.slice(1,5).reverse().map(k=>mir[k])]);
  // левая половина
  const all=P.concat(P.filter(Q=>!(Q.length>4)).map(Q=>Q.map(k=>mir[k]).reverse()).filter(Q=>Q.some((k,m)=>k!==P[0][m])));
  // убираем повторы (грани на середине у зеркала совпадают с исходными)
  const seen=new Set(),polys=[];all.forEach(Q=>{const k=[...Q].sort((a,b)=>a-b).join();if(seen.has(k))return;seen.add(k);polys.push(Q);});
  const fix=(i,q)=>{const f=fixd[i];if(f.mid)q[0]=0;if(f.wall)q[2]=0;if(f.cap!==undefined)q[2]=f.cap;return q;};
  const or=orientPolys(V,polys,[0,300,120]);
  return polyBase(planarize(V,or,fix),or);}
FIGURES.doberman={name:'Доберман (на стену)',H:620,poly:true,build:buildDoberman};

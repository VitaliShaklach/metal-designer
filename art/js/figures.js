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
function figureMesh(id,cell=12){const f=FIGURES[id];const sd=p=>Math.max(f.sdf(p),f.back-p[2],-p[1]);   // срез стеной сзади и снизу
  let m=sdfMesh(sd,f.box[0],f.box[1],cell);m=openCut(m,2,f.back,-1,cell*.8);return m;}

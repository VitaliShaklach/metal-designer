// Доберман 8 в координатах страницы (как в редакторе) + луч → точка на модели
const fs=require('fs'),vm=require('vm'),JS='C:/dev/metal-designer/art/js/';
const c={Math};vm.createContext(c);['mesh','edit','models-poly'].forEach(f=>vm.runInContext(fs.readFileSync(JS+f+'.js','utf8'),c));
const g=n=>vm.runInContext(n,c),m=g("modelPoly('doberman7')");
const mn=[0,1,2].map(k=>Math.min(...m.V.map(p=>p[k]))),mx=[0,1,2].map(k=>Math.max(...m.V.map(p=>p[k]))),T=[291,600,395];
const toPage=p=>[p[0]*T[0]/(mx[0]-mn[0]),(p[1]-mn[1])*T[1]/(mx[1]-mn[1]),(p[2]-mn[2])*T[2]/(mx[2]-mn[2])];
const E={V:m.V.map(toPage),P:m.P.map(Q=>Q.slice()),S:(m.S||[]).map(s=>s.slice())};
function tris(E){const b=g('polyBase')(E.V,E.P,E.S);return b;}
// пересечение луча с треугольниками: {p, t, poly}
function hit(E,o,d){const b=tris(E);let best=null;b.F.forEach((f,i)=>{const a=b.V[f[0]],e1=[0,1,2].map(k=>b.V[f[1]][k]-a[k]),e2=[0,1,2].map(k=>b.V[f[2]][k]-a[k]);
  const p=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]],det=e1[0]*p[0]+e1[1]*p[1]+e1[2]*p[2];if(Math.abs(det)<1e-9)return;
  const s=[o[0]-a[0],o[1]-a[1],o[2]-a[2]],u=(s[0]*p[0]+s[1]*p[1]+s[2]*p[2])/det;if(u<0||u>1)return;const q=[s[1]*e1[2]-s[2]*e1[1],s[2]*e1[0]-s[0]*e1[2],s[0]*e1[1]-s[1]*e1[0]],v=(d[0]*q[0]+d[1]*q[1]+d[2]*q[2])/det;if(v<0||u+v>1)return;
  const t=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])/det;if(t>0&&(!best||t<best.t))best={t,p:[o[0]+d[0]*t,o[1]+d[1]*t,o[2]+d[2]*t],poly:b.T[i]};});return best;}
const fromPage=p=>[p[0]*(mx[0]-mn[0])/T[0],p[1]*(mx[1]-mn[1])/T[1]+mn[1],p[2]*(mx[2]-mn[2])/T[2]+mn[2]];
module.exports={E,g,c,hit,toPage,fromPage};

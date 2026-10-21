// калька для редактора: поверхность эталона (модель Meshy с текстурой) → облако точек с цветом → art/js/trace-<id>.js
// кадр — те же мм, что у plates.js/export.js: высота 600, x по центру, y от низа, z от стены
// точка: x,y,z int16 (мм×10) + r,g,b — 9 байт, всё в base64; по клетке CELL мм — одна точка
// node art/tools/plates/tracing.js [id=doberman7] [src/<id>.obj] [CELL=2] [SEAMF=.12]
const fs=require('fs'),path=require('path'),vm=require('vm'),{readPNG}=require('./png.js');
const D=__dirname,JS=path.join(D,'../../js/'),id=process.argv[2]||'doberman7',objF=process.argv[3]||path.join(D,'src/'+id+'.obj'),pngF=objF.replace(/\.obj$/i,'.png'),CELL=+process.argv[4]||2,SEAMF=+process.argv[5]||.12;
const c={Math};vm.createContext(c);vm.runInContext(fs.readFileSync(JS+'mesh.js','utf8'),c);
const V=[],T=[],F=[],FT=[];for(const l of fs.readFileSync(objF,'utf8').split(/\r?\n/)){const s=l.split(/\s+/);
  if(s[0]==='v')V.push([+s[1],+s[2],+s[3]]);else if(s[0]==='vt')T.push([+s[1],+s[2]]);
  else if(s[0]==='f'){const ix=s.slice(1).filter(Boolean).map(w=>w.split('/').map(n=>+n-1));for(let k=1;k+1<ix.length;k++){F.push([ix[0][0],ix[k][0],ix[k+1][0]]);FT.push([ix[0][1],ix[k][1],ix[k+1][1]]);}}}
c.M0={V,F};const Mf=vm.runInContext(`(b=>fitMesh(M0,{W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(M0.V))`,c);
const I=readPNG(pngF);console.log(id+': треугольников',F.length,'текстура',I.W+'×'+I.H);
const px=(x,y)=>{x=Math.min(I.W-1,Math.max(0,x|0));y=Math.min(I.H-1,Math.max(0,y|0));const o=(y*I.W+x)*3;return [I.px[o],I.px[o+1],I.px[o+2]];};
// шов — светлый серый или тёмный (те же признаки, что в конвейере); в клетке шов побеждает, если его выборок ≥ SEAMF (линия тонкая, ~1 мм) — чтобы линии не размывались
const seam=q=>{const l=.3*q[0]+.59*q[1]+.11*q[2],s=Math.max(...q)-Math.min(...q);return l>185&&s<70||l<45;};
const cells=new Map();
F.forEach((f,t)=>{const A=Mf.V[f[0]],B=Mf.V[f[1]],C=Mf.V[f[2]],uv=FT[t].map(i=>[T[i][0]*I.W,(1-T[i][1])*I.H]);
  const n=Math.max(1,Math.ceil(Math.max(Math.hypot(...A.map((x,k)=>x-B[k])),Math.hypot(...B.map((x,k)=>x-C[k])),Math.hypot(...C.map((x,k)=>x-A[k])))/.7));
  for(let i=0;i<=n;i++)for(let j=0;i+j<=n;j++){const a=i/n,b=j/n,w=1-a-b,p=[0,1,2].map(k=>A[k]*w+B[k]*a+C[k]*b),q=px(uv[0][0]*w+uv[1][0]*a+uv[2][0]*b,uv[0][1]*w+uv[1][1]*a+uv[2][1]*b);
    const key=p.map(x=>Math.floor(x/CELL)).join();let e=cells.get(key);if(!e)cells.set(key,e={p:[0,0,0],n:0,c:[0,0,0],sc:[0,0,0],sn:0});
    e.p[0]+=p[0];e.p[1]+=p[1];e.p[2]+=p[2];e.n++;if(seam(q)){e.sn++;e.sc[0]+=q[0];e.sc[1]+=q[1];e.sc[2]+=q[2];}else{e.c[0]+=q[0];e.c[1]+=q[1];e.c[2]+=q[2];}}});
const buf=Buffer.alloc(cells.size*9);let o=0,ns=0;
cells.forEach(e=>{const p=e.p.map(x=>Math.round(x/e.n*10)),s=e.sn>=SEAMF*e.n,k=s?e.sn:e.n-e.sn,col=(s?e.sc:e.c).map(x=>Math.round(x/k));if(s)ns++;
  buf.writeInt16LE(p[0],o);buf.writeInt16LE(p[1],o+2);buf.writeInt16LE(p[2],o+4);buf[o+6]=col[0];buf[o+7]=col[1];buf[o+8]=col[2];o+=9;});
const TF=JS+'trace-'+id+'.js';
fs.writeFileSync(TF,'/* калька эталона для редактора (сгенерировано art/tools/plates/tracing.js): base64, на точку 9 байт — x,y,z int16 мм×10, r,g,b */\nvar TRACE=window.TRACE||{};window.TRACE=TRACE;TRACE.'+id+'=\''+buf.toString('base64')+'\';\n');
console.log('точек',cells.size,'из них швов',ns,'→',path.relative(process.cwd(),TF),Math.round(fs.statSync(TF).size/1024)+' КБ');

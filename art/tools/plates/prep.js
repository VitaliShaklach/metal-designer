// подготовка: модель Meshy с текстурой → out/mesh.json {V,F,C} и out/tex.json [[макс. светлая, средняя яркость] на треугольник]
// node art/tools/plates/prep.js [src/doberman7.obj] [src/doberman7.png]
const fs=require('fs'),path=require('path'),{readPNG}=require('./png.js');
const D=__dirname,OUT=path.join(D,'out');fs.mkdirSync(OUT,{recursive:true});
const objF=process.argv[2]||path.join(D,'src/doberman7.obj'),pngF=process.argv[3]||objF.replace(/\.obj$/i,'.png');
const V=[],T=[],F=[],FT=[];for(const l of fs.readFileSync(objF,'utf8').split(/\r?\n/)){const s=l.split(/\s+/);
  if(s[0]==='v')V.push([+s[1],+s[2],+s[3]]);else if(s[0]==='vt')T.push([+s[1],+s[2]]);
  else if(s[0]==='f'){const ix=s.slice(1).filter(Boolean).map(w=>w.split('/').map(n=>+n-1));for(let k=1;k+1<ix.length;k++){F.push([ix[0][0],ix[k][0],ix[k+1][0]]);FT.push([ix[0][1],ix[k][1],ix[k+1][1]]);}}}
const I=readPNG(pngF);console.log('треугольников',F.length,'текстура',I.W+'×'+I.H);
const px=(x,y)=>{x=Math.min(I.W-1,Math.max(0,x|0));y=Math.min(I.H-1,Math.max(0,y|0));const o=(y*I.W+x)*3;return [I.px[o],I.px[o+1],I.px[o+2]];};
// по каждому треугольнику — сетка выборок по его UV-площади: средний цвет, самая светлая серая точка (шов), средняя яркость (тёмное — глаза)
const C=[],X=[];FT.forEach(f=>{const p=f.map(i=>[T[i][0]*I.W,(1-T[i][1])*I.H]);const n=Math.max(2,Math.min(12,Math.ceil(Math.max(...[0,1,2].map(k=>Math.hypot(p[k][0]-p[(k+1)%3][0],p[k][1]-p[(k+1)%3][1]))))));
  let mx=0,sum=0,cnt=0,col=[0,0,0];for(let i=0;i<=n;i++)for(let j=0;i+j<=n;j++){const a=i/n,b=j/n,w=1-a-b,q=px(p[0][0]*w+p[1][0]*a+p[2][0]*b,p[0][1]*w+p[1][1]*a+p[2][1]*b),l=.3*q[0]+.59*q[1]+.11*q[2],s=Math.max(...q)-Math.min(...q);
    sum+=l;cnt++;col=col.map((x,k)=>x+q[k]);if(s<70&&l>mx)mx=l;}
  C.push(col.map(x=>Math.round(x/cnt)));X.push([Math.round(mx),Math.round(sum/cnt)]);});
fs.writeFileSync(path.join(OUT,'mesh.json'),JSON.stringify({V,F,C}));fs.writeFileSync(path.join(OUT,'tex.json'),JSON.stringify(X));console.log('готово: out/mesh.json, out/tex.json');

// встроенные модели из файлов: node art/tools/make-models.js <obj> — пишет art/js/models.js
// Meshy «Geometric Doberman» (130 тыс. треугольников) → высота 600 мм, морда на +Z, стена z=0 → упрощаем до запаса 5000
const fs=require('fs'),vm=require('vm'),P=__dirname+'/../js/';const c={console,TextDecoder,Math};vm.createContext(c);
vm.runInContext(['mesh','edit'].map(f=>fs.readFileSync(P+f+'.js','utf8')).join('\n;\n'),c);
c.TXT=fs.readFileSync(process.argv[2],'utf8');c.FLIP=process.argv[3]==='flip';
const t0=Date.now();
vm.runInContext(`let m=parseOBJ(TXT);const b=meshBox(m.V),s=600/b.size[1];
  m={V:m.V.map(p=>[(p[0]-(b.min[0]+b.max[0])/2)*s,(p[1]-b.min[1])*s,(FLIP?-1:1)*(p[2]-(b.min[2]+b.max[2])/2)*s]),F:FLIP?m.F.map(f=>[f[0],f[2],f[1]]):m.F};
  const b2=meshBox(m.V);m.V=m.V.map(p=>[p[0],p[1],p[2]-b2.min[2]]);
  OUT=simplify(m,5000,{noCluster:true});`,c);
const O=c.OUT,V=O.V.flat().map(x=>Math.round(x*10)),F=O.F.flat();
fs.writeFileSync(P+'models.js','/* встроенные модели (сгенерировано art/tools/make-models.js): V — мм×10, F — тройки индексов */\nconst MODELS={doberman4:{V:['+V.join(',')+'],F:['+F.join(',')+']}};\n'
 +'function modelMesh(id){const m=MODELS[id],V=[],F=[];for(let i=0;i<m.V.length;i+=3)V.push([m.V[i]/10,m.V[i+1]/10,m.V[i+2]/10]);for(let i=0;i<m.F.length;i+=3)F.push([m.F[i],m.F[i+1],m.F[i+2]]);return {V,F};}\n');
console.log('tris',O.F.length,'verts',O.V.length,'size',fs.statSync(P+'models.js').size,'ms',Date.now()-t0);

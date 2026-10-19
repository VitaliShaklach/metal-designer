// проверка ядра «Искусства»: node art/tools/smoke.js
const fs=require('fs'),vm=require('vm'),P=__dirname+'/../js/';const c={console,TextDecoder,Math};vm.createContext(c);
vm.runInContext(['mesh','figures'].map(f=>fs.readFileSync(P+f+'.js','utf8')).join('\n;\n'),c);
const run=s=>vm.runInContext(s,c);let bad=0;const ok=(b,t)=>{console.log((b?'ok  ':'FAIL')+' '+t);if(!b)bad++;};
// куб из OBJ: 12 треугольников → 6 деталей-квадратов
run(`cube=parseOBJ("v 0 0 0\\nv 100 0 0\\nv 100 100 0\\nv 0 100 0\\nv 0 0 100\\nv 100 0 100\\nv 100 100 100\\nv 0 100 100\\nf 1 4 3 2\\nf 5 6 7 8\\nf 1 2 6 5\\nf 2 3 7 6\\nf 3 4 8 7\\nf 4 1 5 8")`);
run(`R=buildParts(cube)`);ok(run('R.parts.length')===6&&run('R.parts.every(p=>p.loop.length===4&&Math.abs(p.area-1e4)<1e-6)'),'куб: 6 квадратных деталей по 100×100');
ok(run('R.edges.filter(e=>!e.open).every(e=>Math.abs(e.dih-90)<1e-6&&e.convex)'),'куб: углы между гранями 90°');
ok(run('R.parts.every(p=>p.segs.length===4&&p.segs.every(s=>Math.abs(s.len-100)<1e-6&&s.nb>=0&&Math.abs(s.dih-90)<1e-6))'),'куб: у каждой детали 4 стороны по 100, у каждой — сосед');
// растяжение: плоское остаётся плоским, площади растут как надо
run(`R2=buildParts(fitMesh(cube,{W:200,H:100,D:100}))`);ok(run('R2.parts.length')===6&&Math.abs(run('R2.parts.reduce((s,p)=>s+p.area,0)')-(4*2e4+2*1e4))<1e-6,'куб 200×100×100: 6 деталей, площадь 100 000');
for(const id of ['dog','bull']){const t0=Date.now();run(`D=figureMesh('${id}')`);const t1=Date.now();run(`S=simplify(D,FIGURES['${id}'].faces)`);const t2=Date.now();
  run(`F=fitMesh(S,(b=>({W:b.size[0]*FIGURES['${id}'].H/b.size[1],H:FIGURES['${id}'].H,D:b.size[2]*FIGURES['${id}'].H/b.size[1]}))(meshBox(S.V)));RR=buildParts(F);T=totals(RR,{t:2,mat:'steel',sheet:[2500,1250]})`);
  const T=run('T'),b=run('meshBox(F.V).size');
  console.log(`     ${id}: плотная ${run('D.F.length')} тр (${t1-t0} мс) → ${run('S.F.length')} тр (${t2-t1} мс) → деталей ${T.n}, габарит ${b.map(Math.round).join('×')}, площадь ${(T.area/1e6).toFixed(2)} м², масса ${T.mass.toFixed(1)} кг, рез ${(T.cut/1000).toFixed(1)} м, швы ${(T.weld/1000).toFixed(1)} м, мелкая ${T.minW.toFixed(0)} мм, дыр ${run('RR.parts.filter(p=>p.holes).length')}`);
  ok(T.n>100&&T.n<=run(`FIGURES["${id}"].faces`)&&Math.abs(run('RR.parts.reduce((s,p)=>s+p.area,0)')-T.area)<1,id+': детали собраны');
  // манифолд: каждое внутреннее ребро — ровно 2 грани
  ok(run(`(()=>{const m=new Map();S.F.forEach(f=>{for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+'_'+b:b+'_'+a;m.set(key,(m.get(key)||0)+1);}});return [...m.values()].every(n=>n<=2);})()`),id+': сетка без «лишних» рёбер');}
run(`B0=meshBox(F.V).size;FX=fitMesh(fixSlivers(F,30),{W:B0[0],H:B0[1],D:B0[2]});RX=buildParts(FX)`);console.log("     узких после чистки: "+run(`RX.parts.filter(p=>p.minW<29.5).length`)+", деталей "+run(`RX.parts.length`));ok(run('RX.parts.filter(p=>p.minW<29.5).length')<=5&&Math.abs(run('meshBox(FX.V).size[1]')-620)<1e-6,"бык после чистки иголок: узких ≤5, высота ровно 620");
console.log(bad?'ОШИБОК: '+bad:'всё ок');process.exit(bad?1:0);

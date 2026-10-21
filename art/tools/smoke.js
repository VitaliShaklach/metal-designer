// проверка ядра «Искусства»: node art/tools/smoke.js
const fs=require('fs'),vm=require('vm'),P=__dirname+'/../js/';const c={console,TextDecoder,Math};vm.createContext(c);
vm.runInContext(['mesh','edit','models','figures','prod'].map(f=>fs.readFileSync(P+f+'.js','utf8')).join('\n;\n'),c);
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
run(`DB=figureMesh("doberman");FD=fitMesh(DB,(b=>({W:b.size[0]*620/b.size[1],H:620,D:b.size[2]*620/b.size[1]}))(meshBox(DB.V)));RD=buildParts(FD,1.5,1.5);TD=totals(RD,{t:2,mat:"steel",sheet:[2500,1250]})`);
console.log("     доберман: треугольников "+run("DB.F.length")+", деталей "+run("RD.parts.length")+", четырёхугольников "+run("RD.parts.filter(p=>p.loop.length===4).length")+", габарит "+run("meshBox(FD.V).size.map(Math.round).join('×')")+", масса "+run("TD.mass").toFixed(1)+" кг, швы "+(run("TD.weld")/1000).toFixed(1)+" м");
ok(run("RD.parts.length")>=55&&run("RD.parts.length")<=100&&run("RD.parts.filter(p=>p.loop.length===4).length")>30,"доберман: 55–100 деталей, грани — плоские четырёхугольники");
run(`FD2=fitMesh(DB,{W:400,H:700,D:300});RD2=buildParts(FD2,1.5,1.5)`);ok(run("RD2.parts.length")===run("RD.parts.length"),"доберман растянут 400×700×300 — деталей столько же, грани остались плоскими");
// редактор
run(`E0=blankBox(300,400,260);mmB=mirrorMap(E0.V)`);ok(run("mmB.every(j=>j>=0)"),"куб: у каждой точки есть зеркальная");
run(`top=E0.P.findIndex(Q=>Q.every(i=>E0.V[i][1]===400));E1=extrude(E0,top,50,true);RB=buildParts(polyBase(E1.V,E1.P),1.5,1.5)`);
ok(run("E1.P.length")===10&&run("RB.parts.length")===6&&Math.abs(run("meshBox(E1.V).size[1]")-450)<1e-6,"куб: выдавили верх на 50 — 10 граней, бока продолжают стенки куба (6 деталей), высота 450");
run(`side=E0.P.findIndex(Q=>Q.every(i=>E0.V[i][0]===150));E2=extrude(E0,side,40,true)`);ok(run("E2.P.length")===14&&Math.abs(run("meshBox(E2.V).size[0]")-380)<1e-6,"куб: выдавили бок с симметрией — оба бока, ширина 380");
run(`E3=splitPoly(E0,top,true);R3=buildParts(polyBase(E3.V,E3.P),.5,.3)`);ok(run("E3.P.length")===7&&run("R3.parts.length")===6,"куб: разрезали верх — 7 граней (две половинки в одной плоскости — одна деталь)");
run(`E4=poke(E0,side,30,true)`);ok(run("E4.P.length")===6-2+8,"куб: бугор на боку с симметрией — 12 граней");
run(`E5=ecopy(E0);vi=E5.P[side][0];moveVert(E5,vi,[E5.V[vi][0]+40,E5.V[vi][1],E5.V[vi][2]],true);np=nonPlanar(E5);E6=flattenAll(E5,true,vi);np2=nonPlanar(E6,1)`);
ok(run("np.length")>0&&run("np2.length")===0&&Math.abs(run("E5.V[mmB[vi]][0]")+run("E5.V[vi][0]"))<1e-9,"точку сдвинули — зеркальная тоже, неплоские выровнялись");
run(`E7=delPoly(E0,top,true)`);ok(run("E7.P.length")===5,"удалили грань");
run(`S0=blankSphere();mS=mirrorMap(S0.V)`);ok(run("S0.P.length")===80&&run("mS.every(j=>j!==-1)"),"шар: 80 граней, симметричный");
run(`DBb=figureMesh("doberman");EDB={V:DBb.V,P:DBb.P};ED2=extrude(EDB,0,10,true)`);ok(run("mirrorMap(EDB.V).filter(j=>j===-1).length")===0,"доберман симметричный — редактор видит пары точек");
run(`D2=figureMesh("doberman2");R2d=buildParts(D2,1.5,1.5);E2d=new Map();D2.F.forEach(f=>{for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+"_"+b:b+"_"+a;E2d.set(key,(E2d.get(key)||0)+1);}})`);
console.log("     доберман 2: деталей "+run("R2d.parts.length")+", габарит "+run("meshBox(D2.V).size.map(Math.round).join('×')"));
ok(run("R2d.parts.length")>=55&&run("R2d.parts.length")<=120&&run("nonPlanar({V:D2.V,P:D2.P},1.5).length")===0,"доберман 2: 55–120 деталей, все плоские");
ok(run("[...E2d.values()].every(n=>n===2)")&&run("mirrorMap(D2.V).every(j=>j!==-1)"),"доберман 2: сетка замкнута (спина — пластина), симметричен");
ok(run("R2d.parts.filter(p=>p.tris.every(t=>D2.F[t].every(i=>Math.abs(D2.V[i][2])<.01))).length")===1,"доберман 2: пластина крепления — одна деталь на стене");
ok(run("buildParts(fitMesh(D2,{W:400,H:700,D:300}),1.5,1.5).parts.length")===run("R2d.parts.length"),"доберман 2 растянут 400×700×300 — деталей столько же");
// производство
run(`RC=buildParts(polyBase(blankBox(100,100,100).V,blankBox(100,100,100).P));CC=RC.parts.map(p=>cutContour(p,2,1,true))`);
ok(run("CC.every(c=>!c.bad&&Math.abs(Math.abs(area2(c.pts))-95*95)<1e-6)"),"куб 100, t=2, шов 1: каждая деталь 95×95");
run(`RO=buildParts(polyBase(delPoly(blankBox(100,100,100),0,false).V,delPoly(blankBox(100,100,100),0,false).P));CO=RO.parts.map(p=>cutContour(p,2,1,true))`);
ok(run("CO.some(c=>c.s.includes(0))&&CO.every(c=>!c.bad)"),"открытый край — без сдвига");
ok(Math.abs(run("edgeSetback({nb:1,dih:225},2,1,true)")-0.5)<1e-9,"вогнутый шов — сдвиг только на полшва");
run(`D3=figureMesh("doberman2");R3=buildParts(D3,1.5,1.5);C3=R3.parts.map(p=>({id:p.id,no:p.no,...cutContour(p,2,1,true)}));N3=nest(C3.filter(c=>!c.bad),2500,1250,3,10,2.5,2,true)`);
console.log("     доберман 3: вырожденных "+run("C3.filter(c=>c.bad).length")+", листов "+run("N3.sheets.length")+", заполнение "+Math.round(run("N3.used")*100)+"%");
ok(run("C3.filter(c=>!c.bad).reduce((a,c)=>a+Math.abs(area2(c.pts)),0)")<run("R3.parts.reduce((a,p)=>a+p.area,0)"),"доберман 3: контуры реза меньше поверхности");
ok(run(`(()=>{let m=Infinity;N3.sheets.forEach(sh=>sh.items.forEach((a,i)=>sh.items.forEach((b,j)=>{if(j>i)m=Math.min(m,polyGap(a.pts,b.pts));})));return m;})()`)>=3-1e-9&&run("N3.sheets.every(sh=>sh.items.every(o=>o.pts.every(p=>p[0]>=10-1e-6&&p[1]>=10-1e-6&&p[0]<=2490+1e-6&&p[1]<=1240+1e-6)))")&&run("N3.too.length")===0,"доберман 3: раскладка по форме — зазор между деталями не меньше 3 мм, всё внутри листа");
console.log("     доберман 3: занято "+Math.round(run("N3.sheets[0].len"))+" мм длины листа, плотность "+Math.round(run("N3.sheets[0].dense")*100)+"%");
ok(run("N3.sheets.every(sh=>sh.items.every(o=>Math.sign(area2(o.pts))===-Math.sign(area2(C3.find(c=>c.id===o.id).pts))))"),"гравировка внутрь: каждая деталь в раскрое зеркальна развёртке — вверх смотрит внутренняя сторона");
ok(run("N3.sheets[0].dense")>.55,"доберман 3: плотность раскладки больше 55%");
run(`EG=N3.sheets[0].items.map(o=>({o,g:engraveSegs(o.no,o.pts)}))`);
ok(run("EG.filter(x=>x.g).length")>=run("EG.length")*.9&&run("EG.every(x=>!x.g||x.g.every(s=>inPoly([s[0],s[1]],x.o.pts)&&inPoly([s[2],s[3]],x.o.pts)))"),"гравировка номера: у 90%+ деталей, все линии внутри детали");
run(`DE=[];C3.forEach((c,i)=>{dxfPoly(DE,c.pts,"CUT",i*300,0);const g=engraveSegs(i+1,c.pts);if(g)dxfSegs(DE,g,"ENGRAVE",i*300,0);});DX=dxfDoc(DE)`);
ok(run("(DX.match(/LINE\\r\\n8\\r\\nCUT\\r\\n/g)||[]).length")===run("C3.reduce((a,c)=>a+c.pts.length,0)")&&run("/LINE\\r\\n8\\r\\nENGRAVE\\r\\n/.test(DX)&&DX.startsWith('0\\r\\nSECTION')&&DX.trimEnd().endsWith('EOF')"),"DXF: все стороны контуров — линии CUT, номера — линии ENGRAVE, файл замкнут");
{const t0=Date.now();run(`D4=figureMesh("doberman4");S4=simplify(D4,200);F4=fitMesh(S4,(b=>({W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(S4.V)));F4=fixSlivers(F4,30);R4=buildParts(F4);T4=totals(R4,{t:2,mat:"steel",sheet:[2500,1250]})`);
console.log("     доберман 4 (Meshy): запас "+run("D4.F.length")+" тр → 200 за "+(Date.now()-t0)+" мс → деталей "+run("R4.parts.length")+", габарит "+run("meshBox(F4.V).size.map(Math.round).join('×')")+", масса "+run("T4.mass").toFixed(1)+" кг, швы "+(run("T4.weld")/1000).toFixed(1)+" м, открытый край "+Math.round(run("T4.open"))+" мм");
ok(run("R4.parts.length")>=90&&run("R4.parts.length")<=200&&run("T4.open")===0,"доберман 4: 90–200 деталей, сетка замкнута");}
run(`D5=figureMesh("doberman5");S5=simplify(D5,200);F5=fitMesh(S5,(b=>({W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(S5.V)));R5=buildParts(fixSlivers(F5,30));T5=totals(R5,{t:2,mat:"steel",sheet:[2500,1250]})`);
console.log("     доберман 5 (Meshy Smart Topology): "+run("D5.F.length")+" тр → 200 → деталей "+run("R5.parts.length")+", масса "+run("T5.mass").toFixed(1)+" кг, швы "+(run("T5.weld")/1000).toFixed(1)+" м");
ok(run("D5.F.length")===508&&run("R5.parts.length")>=90&&run("R5.parts.length")<=200&&run("T5.open")===0,"доберман 5: 508 треугольников, после упрощения 90–200 деталей, сетка замкнута");
run(`D6=figureMesh("doberman6");S6=simplify(D6,200);F6=fitMesh(S6,(b=>({W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(S6.V)));R6=buildParts(fixSlivers(F6,30));T6=totals(R6,{t:2,mat:"steel",sheet:[2500,1250]})`);
console.log("     доберман 6 (агент Meshy, ремеш): "+run("D6.F.length")+" тр → 200 → деталей "+run("R6.parts.length")+", масса "+run("T6.mass").toFixed(1)+" кг, швы "+(run("T6.weld")/1000).toFixed(1)+" м");
ok(run("D6.F.length")===1028&&run("R6.parts.length")>=90&&run("R6.parts.length")<=200&&run("T6.open")===0,"доберман 6: 1028 треугольников, после упрощения 90–200 деталей, сетка замкнута");
// слить почти плоские грани
run(`LV=[[0,0,0],[200,0,0],[200,100,0],[100,100,0],[100,200,0],[0,200,0]];LT=earClip(LV,[0,1,2,3,4,5]);LA=LT.reduce((a,t)=>a+V3.len(triN(LV,t))/2,0)`);
ok(run("LT.length")===4&&Math.abs(run("LA")-30000)<1e-6&&run("LT.every(t=>triN(LV,t)[2]>0)"),"невыпуклая грань (буква Г) режется на треугольники без перехлёста");
run(`SPH=blankSphere(200);SG=dissolve(polyBase(SPH.V,SPH.P),1,1)`);ok(run("SG.P.length")===80,"шар: соседние грани под углом больше порога — не сливаются");
for(const [id,n0] of [['doberman5',508],['doberman6',1028]]){run(`DM=figureMesh("${id}");SM=simplify(DM,300);FM=fitMesh(SM,(b=>({W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(SM.V)));FM=fixSlivers(FM,15);n1=buildParts(FM).parts.length;
  G=dissolve(FM,12,6);op=openVerts(G);VG=planarize(G.V,G.P,(i,q)=>{if(op.has(i)&&Math.abs(G.V[i][2])<.5)q[2]=0;return q;},400);MG=fitMesh(polyMesh(VG,G.P),meshBox(FM.V).size.reduce((o,v,i)=>(o['WHD'[i]]=v,o),{}));RG=buildParts(MG,1.5,1.5);
  EG2=new Map();MG.F.forEach(f=>{for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+"_"+b:b+"_"+a;EG2.set(key,(EG2.get(key)||0)+1);}})`);
  console.log(`     ${id}: упрощение до 300 → деталей ${run('n1')}, слить 12° → многоугольников ${run('G.P.length')}, деталей ${run('RG.parts.length')}, неплоских ${run('nonPlanar({V:VG,P:G.P},.5).length')}`);
  ok(run('RG.parts.length')<run('n1')*.8&&run('nonPlanar({V:VG,P:G.P},.5).length')===0&&run('[...EG2.values()].every(n=>n===2)')&&Math.abs(run('meshBox(MG.V).size[1]')-run('meshBox(FM.V).size[1]'))<1e-6,id+': слить 12° — деталей меньше на 20%+, все грани плоские, сетка замкнута, размер тот же');}
console.log(bad?'ОШИБОК: '+bad:'всё ок');process.exit(bad?1:0);

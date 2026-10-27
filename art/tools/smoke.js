// проверка ядра «Искусства»: node art/tools/smoke.js
const fs=require('fs'),vm=require('vm'),P=__dirname+'/../js/';const c={console,TextDecoder,Math};vm.createContext(c);
vm.runInContext(['mesh','edit','models','models-poly','figures','prod','sheets','bend'].map(f=>fs.readFileSync(P+f+'.js','utf8')).join('\n;\n'),c);
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
ok(run("(DX.match(/POLYLINE\\r\\n8\\r\\nCUT\\r\\n66\\r\\n1\\r\\n10\\r\\n0\\r\\n20\\r\\n0\\r\\n30\\r\\n0\\r\\n70\\r\\n1\\r\\n/g)||[]).length")===run("C3.length")&&run("(DX.match(/VERTEX\\r\\n8\\r\\nCUT\\r\\n/g)||[]).length")===run("C3.reduce((a,c)=>a+c.pts.length,0)")&&run("(DX.match(/SEQEND/g)||[]).length")===run("C3.length")&&run("/LINE\\r\\n8\\r\\nENGRAVE\\r\\n/.test(DX)&&DX.startsWith('0\\r\\nSECTION')&&DX.trimEnd().endsWith('EOF')"),"DXF: контур каждой детали — одна замкнутая полилиния CUT со всеми углами, номера — линии ENGRAVE, файл замкнут");
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
// швы в редакторе: убрать и провести
run(`EB=blankBox(300,400,260);tp=EB.P.findIndex(Q=>Q.every(i=>EB.V[i][1]===400));ES=splitPoly(EB,tp,true);hv=ES.P.map((Q,i)=>i).filter(i=>ES.P[i].every(q=>ES.V[q][1]===400));EM=mergePolys(ES,hv[0],hv[1],true)`);
ok(run("ES.P.length")===7&&run("EM.P.length")===6&&run("nonPlanar(EM).length")===0,"убрать шов: две половинки верха куба снова одна грань");
run(`EC=cutPoly(EB,tp,EB.P[tp][0],EB.P[tp][2],true);sd=EB.P.findIndex(Q=>Q.every(i=>EB.V[i][0]===150));EC2=cutPoly(EB,sd,EB.P[sd][0],EB.P[sd][2],true)`);
ok(run("EC.P.length")===7&&run("nonPlanar(EC).length")===0&&run("EC2.P.length")===8,"провести шов: верх по диагонали — 7 граней, бок с симметрией — разрезан и зеркальный (8)");
run(`ea=EB.P[sd][0];eb=EB.P[sd][1];EP=addEdgePoint(EB,ea,eb,V3.mul(V3.add(EB.V[ea],EB.V[eb]),.5),true)`);ok(run("EP.E.V.length")===10&&run("mirrorMap(EP.E.V).every(j=>j!==-1)"),"точка на ребре — и зеркальная, симметрия цела");
run(`SC=cutPoly(EB,tp,EB.P[tp][0],EB.P[tp][2],true);SR=buildParts(polyBase(SC.V,SC.P,SC.S),1.5,1.5);sh=SC.P.map((Q,i)=>i).filter(i=>SC.P[i].every(q=>SC.V[q][1]===400));SM=mergePolys(SC,sh[0],sh[1],true)`);
ok(run("SR.parts.length")===7&&run("SR.edges.filter(e=>!e.open).length")===13&&run("SM.S.length")===0&&run("buildParts(polyBase(SM.V,SM.P,SM.S),1.5,1.5).parts.length")===6,"шов, проведённый руками, — отдельные детали даже в одной плоскости; «убрать шов» снимает его");
// Доберман 7 — плиты сняты с модели Meshy
run(`D7=figureMesh("doberman7");R7=buildParts(D7,1.5,1.5);C7=R7.parts.map(p=>({id:p.id,no:p.no,...cutContour(p,2,1,true)}));N7=nest(C7.filter(c=>!c.bad),2500,1250,3,10,2.5,2,true);
  ES7=new Set();D7.P.forEach(Q=>Q.forEach((a,k)=>ES7.add(a+"_"+Q[(k+1)%Q.length])));open7=D7.P.reduce((n,Q)=>n+Q.filter((a,k)=>!ES7.has(Q[(k+1)%Q.length]+"_"+a)).length,0)`);
console.log("     доберман 7: граней "+run("D7.P.length")+", деталей "+run("R7.parts.length")+", габарит "+run("meshBox(D7.V).size.map(Math.round).join('×')")+", самопересечений "+run("selfXPolys(D7).length")+", открытых рёбер (глаза) "+run("open7")+", листов "+run("N7.sheets.length"));
ok(run("nonPlanar({V:D7.V,P:D7.P},1).length")===0&&run("mirrorMap(D7.V).every(j=>j!==-1)")&&run("selfXPolys(D7).length")<=2&&run("R7.parts.every(p=>p.minW>=14.5)"),"доберман 7: все грани плоские, симметричен, самопересечений не больше 2, узких нет");
ok(run("C7.filter(c=>c.bad).length")===0&&run("N7.too.length")===0&&run(`(()=>{let m=Infinity;N7.sheets.forEach(sh=>sh.items.forEach((a,i)=>sh.items.forEach((b,j)=>{if(j>i)m=Math.min(m,polyGap(a.pts,b.pts));})));return m;})()`)>=3-1e-9,"доберман 7: контуры реза целые, раскладка без наложений");
ok(run("open7")>0&&run("open7")<=40&&run("buildParts(polyBase(fitMesh(D7,{W:400,H:700,D:300}).V,D7.P),1.5,1.5).parts.length")===run("R7.parts.length"),"доберман 7: открыты только прорези глаз; растянут 400×700×300 — деталей столько же");
// калька: облако эталона на гранях Добермана 7, магнит к швам
c.atob=atob;c.window=c;vm.runInContext(fs.readFileSync(P+'trace.js','utf8')+'\n;\n'+fs.readFileSync(P+'trace-doberman7.js','utf8'),c);
run(`TT=traceLoad(TRACE.doberman7);B7=meshBox(D7.V);AT=traceAtlas(D7.V,D7.P,D7.F,D7.T,traceMap(B7,B7),TT);
  EC7=new Map();D7.P.forEach(Q=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],key=a<b?a+"_"+b:b+"_"+a;EC7.set(key,(EC7.get(key)||0)+1);}));
  E2=[...EC7].filter(e=>e[1]===2).map(e=>e[0].split("_").map(Number));
  near7=E2.filter(([a,b])=>{const p=V3.mul(V3.add(D7.V[a],D7.V[b]),.5);return traceNear(TT,p[0],p[1],p[2],3,1)>=0;}).length/E2.length;
  D7s=polyBase(fitMesh(D7,{W:400,H:700,D:300}).V,D7.P);AT2=traceAtlas(D7s.V,D7s.P,D7s.F,D7s.T,traceMap(B7,meshBox(D7s.V)),TT);`);
console.log("     калька: точек "+run("TT.n")+", швов "+run("TT.seams")+", атлас "+run("AT.W+'×'+AT.H")+", окрашено "+run("(AT.cover*100).toFixed(1)")+"%, рёбер у шва эталона "+run("(near7*100).toFixed(0)")+"%");
ok(run("TT.n")>80000&&run("TT.seams")>3000,"калька: облако эталона загружено, швы найдены");
ok(run("AT.uv.every(x=>x>=0&&x<=1)")&&run("AT.cover")>.95&&run("Math.abs(AT2.cover-AT.cover)")<.02,"калька: uv в атласе, окрашено больше 95% граней, растянутая фигура — так же");
ok(run("near7")>=.6,"калька совпадает с фигурой: у 60%+ наших рёбер рядом шов эталона");
// магнит на плоской кальке: серое поле, светлый шов по x=51; ребро поперёк шва, ребро вдоль шва, клик вдали
{const pts=[];for(let x=1;x<200;x+=2)for(let y=1;y<200;y+=2){const s=x===51?225:128;pts.push([x,y,0,s,s,s]);}const bf=Buffer.alloc(pts.length*9);pts.forEach((p,i)=>{for(let k=0;k<3;k++)bf.writeInt16LE(p[k]*10,i*9+k*2);bf[i*9+6]=p[3];bf[i*9+7]=p[4];bf[i*9+8]=p[5];});c.B64=bf.toString('base64');}
run(`TP=traceLoad(B64);ID=p=>p.slice();ID.s=[1,1,1];mg1=seamOnEdge([10,40,0],[110,60,0],[60,52,0],ID,TP);mg2=seamOnEdge([51,20,0],[51,180,0],[51,100,0],ID,TP);mg3=seamOnEdge([10,40,0],[110,60,0],[90,56,0],ID,TP);`);
ok(run("TP.seams")===100&&run("mg1&&Math.abs(mg1[0]-51)<1.5&&Math.abs(mg1[1]-48.2)<1")&&run("mg2")===null&&run("mg3")===null,"магнит: точка встаёт туда, где шов эталона пересекает ребро; шов вдоль ребра и далёкий клик — без притяжения");
// сверка с калькой: плоскость z=50, шов эталона по x=51; наш шов по шву — совпал, в 70 мм от него — лишний; шов эталона без нашего — жёлтый участок
{const pts=[];for(let x=1;x<200;x+=2)for(let y=1;y<200;y+=2){const s=x===51?225:128;pts.push([x,y,50,s,s,s]);}const bf=Buffer.alloc(pts.length*9);pts.forEach((p,i)=>{for(let k=0;k<3;k++)bf.writeInt16LE(p[k]*10,i*9+k*2);bf[i*9+6]=p[3];bf[i*9+7]=p[4];bf[i*9+8]=p[5];});c.B64P=bf.toString('base64');}
run(`TQ=traceLoad(B64P);VQ=[[0,0,50],[200,0,50],[200,200,50],[0,200,50],[51,5,50],[51,195,50],[121,5,50],[121,195,50]];FQ=[[0,1,2],[0,2,3]];ID2=p=>p.slice();ID2.s=[1,1,1];ID2.inv=p=>p.slice();
  dq1=traceDiff([{a:4,b:5},{a:6,b:7}],VQ,FQ,ID2,TQ);dq2=traceDiff([{a:6,b:7}],VQ,FQ,ID2,TQ);
  DD=traceDiff(R7.edges,D7.V,D7.F,traceMap(B7,B7),TT);`);
console.log("     сверка доберман 7: на шве эталона "+run("Math.round(DD.on*100)")+"%, рядом "+run("Math.round(DD.near*100)")+"%, лишних швов "+run("DD.red.length")+", недостающих участков "+run("DD.parts"));
ok(run("JSON.stringify(dq1.red)")==="[1]"&&run("dq1.parts")===0&&Math.abs(run("dq1.on")-.5)<1e-9&&run("JSON.stringify(dq2.red)")==="[0]"&&run("dq2.parts")===1&&run("dq2.yel.length/3")>=90,"сверка: шов на шве эталона — совпал, далёкий — лишний (красный), шов эталона без нашего — жёлтый участок");
ok(run("DD.near")>=.65&&run("DD.red.length")<120&&run("DD.parts")>0,"сверка доберман 7: рядом со швами эталона 65%+ наших швов, лишние и недостающие найдены");
// доберман 8 — правка 7-го по пометкам Виталия; калька — по рамке (габарит 7-го), а не по габариту 8-го: нос стал короче на 11 мм
run(`D8=figureMesh("doberman8");R8=buildParts(D8,1.5,1.5);F8=FIGURES.doberman8.frame;FB8={min:F8[0],max:F8[1],size:F8[1].map((x,k)=>x-F8[0][k])};
  DD8=traceDiff(R8.edges,D8.V,D8.F,traceMap(B7,FB8),TT);DB8=traceDiff(R8.edges,D8.V,D8.F,traceMap(B7,meshBox(D8.V)),TT);`);
console.log("     доберман 8: граней "+run("D8.P.length")+", деталей "+run("R8.parts.length")+", самопересечений "+run("selfXPolys(D8).length")+"; сверка по рамке: на шве "+run("Math.round(DD8.on*100)")+"%, рядом "+run("Math.round(DD8.near*100)")+"% (по габариту 8-го было бы "+run("Math.round(DB8.near*100)")+"%), лишних "+run("DD8.red.length"));
ok(run("nonPlanar({V:D8.V,P:D8.P},1).length")===0&&run("mirrorMap(D8.V).every(j=>j!==-1)")&&run("selfXPolys(D8).length")<=2&&run("R8.parts.every(p=>p.minW>=14.5)"),"доберман 8: все грани плоские, симметричен, самопересечений не больше 2, узких нет");
ok(run("DD8.near")>=run("DD.near")&&run("DD8.red.length")<run("DD.red.length")&&run("DD8.on")>run("DD.on"),"доберман 8: калька по рамке — на шве эталона больше, лишних швов меньше, чем у 7-го");
// уголки-шаблоны для сварки: угол рабочих краёв, выемка у вершины, контур без самопересечений, гравировка «У152°»
run(`TS=[37,90,152,177].map(a=>{const P=tplShape(a,1.2,15),n=P.length,ang=(p,q)=>Math.atan2(q[1]-p[1],q[0]-p[0]),d=(ang(P[n-2],P[n-3])-ang(P[0],P[1]))*180/Math.PI;
    let x=false;for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(segX(P[i],P[(i+1)%n],P[j],P[(j+1)%n]))x=true;}
    return {a,d,x,area:area2(P),near:Math.min(...P.map(p=>Math.hypot(p[0],p[1]))),eng:!!engraveSegs(tplNo(a),P)};});
  TP8=weldTemplates(R8,1.2,15);C8=R8.parts.map(p=>({id:p.id,no:p.no,...cutContour(p,1.2,1,true)}));
  N8=nest(C8.filter(c=>!c.bad).concat(TP8.map(o=>({id:'t'+o.a,no:tplNo(o.a),pts:o.pts}))),2500,1250,3,10,2.5,2,true);`);
console.log("     уголки доберман 8: "+run("TP8.length")+" шт ("+run("TP8[0].a")+"°…"+run("TP8[TP8.length-1].a")+"°), швов "+run("TP8.reduce((s,o)=>s+o.seams,0)")+"; раскрой с ними: листов "+run("N8.sheets.length")+", "+run("itemsTxt(N8.sheets.flatMap(s=>s.items))"));
ok(run("TS.every(t=>Math.abs(t.d-t.a)<.05&&!t.x&&t.area>0&&t.near>=4-1e-9&&t.eng)"),"уголок-шаблон: рабочие края точно под углом (37°, 90°, 152°, 177°), у вершины выемка, контур целый, гравировка «У…°» влезает");
ok(run("TP8.length")>=60&&run("TP8.every(o=>o.a>=TPL_MIN&&o.a<TPL_MAX&&engraveSegs(tplNo(o.a),o.pts))")&&run("new Set(TP8.map(o=>o.a)).size")===run("TP8.length"),"доберман 8: по уголку на каждый угол швов (без почти плоских), на всех гравировка");
ok(run("N8.too.length")===0&&run("N8.sheets.flatMap(s=>s.items).filter(isTpl).length")===run("TP8.length")&&run(`(()=>{let m=Infinity;N8.sheets.forEach(sh=>sh.items.forEach((a,i)=>sh.items.forEach((b,j)=>{if(j>i)m=Math.min(m,polyGap(a.pts,b.pts));})));return m;})()`)>=3-1e-9,"доберман 8: раскрой с уголками — все на листе, зазор ≥ 3 мм");
// клик по детали в таблице — камера на неё лицом; шаги сборки — каждый со стороны своих деталей и крупнее общего вида
run(`PC=partCam([10,300,200],[1,0,0],60,meshBox(D8.V),[0,0,1]);CUR={M3:D8,R:R8};
  AS=(()=>{const ps=[...R8.parts].sort((a,b)=>a.no-b.no),all=projBox(VIEWS.iso);return [0,1,2,3,4].map(i=>{const st=ps.slice(i*8,i*8+8),v=stepView(st),fb=stepFrame(v,st);let n=[0,0,0];st.forEach(p=>{n=V3.add(n,V3.mul(p.n,p.area));});
    return {dot:V3.dot(v.d,V3.norm(n)),k:Math.min(120/(fb[2]-fb[0]),84/(fb[3]-fb[1]))/Math.min(120/(all[2]-all[0]),84/(all[3]-all[1])),txt:v.txt};});})();`);
console.log("     шаги сборки доберман 8: "+run("AS.map((a,i)=>'шаг '+(i+1)+' ×'+a.k.toFixed(1)+' '+a.txt).join('; ')"));
ok(run("Math.abs(PC.pos[1]-300)<1e-6&&PC.pos[0]>10&&Math.abs(PC.pos[2]-200)<70&&PC.target[0]===10&&PC.dist>=250&&PC.dist<=Math.max(...meshBox(D8.V).size)*.6/Math.tan(17.5*Math.PI/180)+1e-6"),"деталь из таблицы: камера напротив детали (по её нормали), цель — центр детали, 250 мм … вся фигура");
ok(run("AS.every(a=>a.dot>.5)")&&run("AS[0].k")>=2,"порядок сборки: каждый шаг смотрит на свои детали, шаг 1 крупнее общего вида в 2+ раза");
// доберман 9 — 8-й без коротких рёбер и лишних швов (plates/marks/round2.js); короткие рёбра остались только у глаз
run(`D9=figureMesh("doberman9");R9=buildParts(D9,1.5,1.5);DD9=traceDiff(R9.edges,D9.V,D9.F,traceMap(B7,FB8),TT);OV9=openVerts(D9);
  SH9=[];D9.P.forEach(Q=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];if(a<b&&V3.len(V3.sub(D9.V[a],D9.V[b]))<13)SH9.push([a,b]);}));`);
console.log("     доберман 9: граней "+run("D9.P.length")+", деталей "+run("R9.parts.length")+" (у 8-го "+run("R8.parts.length")+"), коротких рёбер "+run("SH9.length")+"; сверка по рамке: на шве "+run("Math.round(DD9.on*100)")+"%, рядом "+run("Math.round(DD9.near*100)")+"%, лишних "+run("DD9.red.length"));
ok(run("nonPlanar({V:D9.V,P:D9.P},1).length")===0&&run("mirrorMap(D9.V).every(j=>j!==-1)")&&run("selfXPolys(D9).length")<=2&&run("R9.parts.every(p=>p.minW>=14.5)")&&run("R9.parts.length<R8.parts.length"),"доберман 9: плоский, симметричен, самопересечений не больше 2, узких нет, деталей меньше, чем у 8-го");
ok(run("SH9.every(([a,b])=>OV9.has(a)||OV9.has(b))")&&run("DD9.near")>=run("DD8.near")&&run("DD9.red.length")<run("DD8.red.length"),"доберман 9: рёбра короче 13 мм — только на краю глаз; калька по рамке: рядом со швами эталона не меньше, лишних швов меньше, чем у 8-го");
// доберман 10 — 9-й без лишних швов второго круга (щёки, темя, лоб): marks/round3.js
run(`D10=figureMesh("doberman10");R10=buildParts(D10,1.5,1.5);DD10=traceDiff(R10.edges,D10.V,D10.F,traceMap(B7,FB8),TT);`);
console.log("     доберман 10: граней "+run("D10.P.length")+", деталей "+run("R10.parts.length")+" (у 9-го "+run("R9.parts.length")+"); сверка по рамке: на шве "+run("Math.round(DD10.on*100)")+"%, рядом "+run("Math.round(DD10.near*100)")+"%, лишних "+run("DD10.red.length"));
ok(run("nonPlanar({V:D10.V,P:D10.P},1).length")===0&&run("mirrorMap(D10.V).every(j=>j!==-1)")&&run("selfXPolys(D10).length")<=2&&run("R10.parts.every(p=>p.minW>=14.5)")&&run("R10.parts.length<R9.parts.length")&&run("DD10.red.length")<=run("DD9.red.length"),"доберман 10: плоский, симметричен, самопересечений не больше 2, узких нет, деталей и лишних швов не больше, чем у 9-го");
// номер детали в 3D (partLabelPt): на самой грани, не ближе 3 мм к кромке — у вогнутых деталей среднее углов p.c уходит за контур (лоб 22 у Д10)
run(`LPin=(M,R)=>R.parts.filter(p=>!p.back&&p.tris.length).filter(p=>{const q=partLabelPt(p,M),n=p.n,ins=p.tris.some(fi=>{const f=M.F[fi],[a,b,c]=f.map(i=>M.V[i]),s=(x,y)=>V3.dot(V3.cross(V3.sub(y,x),V3.sub(q,x)),n);return s(a,b)>=-1e-6&&s(b,c)>=-1e-6&&s(c,a)>=-1e-6;});
  if(!ins)return true;const ec=new Map();p.tris.forEach(fi=>{const f=M.F[fi];for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+"_"+b:b+"_"+a;ec.set(key,(ec.get(key)||0)+1);}});
  return [...ec].filter(([,c])=>c===1).some(([k])=>{const [a,b]=k.split("_").map(i=>M.V[+i]),ab=V3.sub(b,a),t=Math.max(0,Math.min(1,V3.dot(V3.sub(q,a),ab)/V3.dot(ab,ab)));return V3.len(V3.sub(q,V3.add(a,V3.mul(ab,t))))<3;});}).map(p=>p.no);
  CIN=(M,R)=>R.parts.filter(p=>!p.back&&p.tris.length).filter(p=>{const q=p.c,n=p.n;return !p.tris.some(fi=>{const [a,b,c]=M.F[fi].map(i=>M.V[i]),s=(x,y)=>V3.dot(V3.cross(V3.sub(y,x),V3.sub(q,x)),n);return s(a,b)>=-1e-6&&s(b,c)>=-1e-6&&s(c,a)>=-1e-6;});}).length;
  M10={V:D10.V,F:D10.F,T:D10.T,S:D10.S};R10n=buildParts(M10,1.5,1.5);addBacking(R10n,M10);pairNumbers(R10n,M10.V);M9={V:D9.V,F:D9.F,T:D9.T,S:D9.S};R9n=buildParts(M9,1.5,1.5);addBacking(R9n,M9);pairNumbers(R9n,M9.V);`);
console.log("     номер в 3D: среднее углов за контуром — Д9 "+run("CIN(M9,R9n)")+", Д10 "+run("CIN(M10,R10n)")+" деталей; точка номера мимо или у кромки — Д9 ["+run("LPin(M9,R9n)")+"], Д10 ["+run("LPin(M10,R10n)")+"]");
ok(run("LPin(M9,R9n).length")===0&&run("LPin(M10,R10n).length")===0&&run("CIN(M10,R10n)")>0,"номер детали в 3D — на самой грани, не ближе 3 мм к кромке, и у вогнутых (у Д10 среднее углов уходит за контур)");
// чистка: у куба срезаны два угла крошечными треугольниками (рёбра 4 мм) — сводятся обратно в точку, куб снова из 6 граней
{const C=require('./plates/clean.js')(run);run(`CB=blankBox(300,400,260);[[6,1],[7,-1]].forEach(([v,s])=>{const p=CB.V[v],n=CB.V.length;CB.V.push([p[0]-s*3,p[1],p[2]],[p[0],p[1]-3,p[2]],[p[0],p[1],p[2]-3]);
    CB.P=CB.P.map(Q=>{const k=Q.indexOf(v);if(k<0)return Q;const nb=[Q[(k+Q.length-1)%Q.length],Q[(k+1)%Q.length]],pick=w=>{const d=V3.sub(CB.V[w],p);return Math.abs(d[0])>1?n:Math.abs(d[1])>1?n+1:n+2;};
      const r=Q.slice();r.splice(k,1,pick(nb[0]),pick(nb[1]));return r;});const tri=[n,n+1,n+2];CB.P.push(s>0?tri:tri.reverse());});CB.S=[];`);
  const r=C.collapseShort(run('CB'));run('CB2='+JSON.stringify(r.E));
  ok(run("CB.P.length")===8&&run("CB2.P.length")===6&&run("CB2.V.length")===8&&r.log.filter(x=>x.done).length>=1&&run("nonPlanar(CB2,.01).length")===0,"чистка коротких рёбер: срезанные углы куба (рёбра 3–4 мм) сведены в точку, 6 граней и 8 вершин, грани плоские");}
// гибка: коробка при угле от 90° — одна развёртка, 5 сгибов без налезаний; налезание квадратов находится
{const B=require('./plates/bend.js')(run),bx=run('blankBox(300,400,260)');bx.S=[];const r=B.plan(bx,{ang:90,corner:false}),sq=(x,y)=>[[x,y],[x+100,y],[x+100,y+100],[x,y+100]];
  ok(r.st.blanks===1&&r.st.V===5&&r.st.weld===7&&!B.overlap(sq(0,0),sq(100,0))&&B.overlap(sq(0,0),sq(50,30))&&B.plan(bx,{}).st.blanks===6,"гибка: коробка — одна развёртка из 6 граней, 5 сгибов V, 7 швов; при угле от 135° коробку не гнём; соседние квадраты не налезают, сдвинутые — налезают");}
// гибка на сайте: коробка — крест из 6 граней с 5 линиями сгиба; поправка на толщину; Доберман 9 — заготовки, каждая деталь ровно в одной, контуры целые
run(`BXE=blankBox(300,400,260);BXR=buildParts(polyBase(BXE.V,BXE.P),1.5,1.5);BXP=bendPlan(BXR,BXE.V,{ang:90,corner:false});BXB=bendBlank(BXP.blanks[0],BXR,BXE.V,BXP,{t:0,gap:0,useT:false})`);
ok(run("BXP.blanks.length")===1&&!run("BXB.bad")&&Math.abs(run("BXB.area")-run("BXR.parts.reduce((s,p)=>s+p.area,0)"))<1&&run("BXB.lines.length")===5&&run("BXB.lines.every(l=>l.segs.length===1&&Math.abs(Math.hypot(l.segs[0][2]-l.segs[0][0],l.segs[0][3]-l.segs[0][1])-l.len)<.01)")&&run("BXB.lines.map(l=>l.k).join()")==="1,2,3,4,5",
  "гибка: коробка — контур-крест площадью 6 граней, 5 линий сгиба во всю длину, порядок 1…5");
run(`BXB2=bendBlank(BXP.blanks[0],BXR,BXE.V,BXP,{t:2,gap:1,useT:true})`);ok(!run("BXB2.bad")&&run("BXB2.area")<run("BXB.area")&&run("BXB2.lines.every(l=>l.segs.length===1)"),"гибка: коробка с толщиной 2 мм и швом — контур целый, меньше креста, линии сгиба внутри");
ok(Math.abs(run("bendDeduct(1.5,135,'V')")-.92)<.02&&run("bendDeduct(1.5,135,'m')")<0&&run("bendDeduct(2,180,'V')")===0,"гибка: поправка на сгиб 45° при 1,5 мм — 0,9 мм (V), у m — чуть меньше нуля, без сгиба — 0");
run(`D9=modelPoly('doberman9');R9=buildParts(polyBase(D9.V,D9.P,D9.S),1.5,1.5);P9=bendPlan(R9,D9.V,{sheet:[1250,2500]});B9=P9.blanks.filter(b=>b.parts.length>1).map(b=>bendBlank(b,R9,D9.V,P9,{t:1.5,gap:1,useT:true}))`);
console.log('     Д9 с гибкой: '+JSON.stringify(run("P9.st"),['parts','blanks','multi','single','V','m','weld']));
ok(run("P9.st.blanks")>=50&&run("P9.st.blanks")<=56&&run("(()=>{const c=new Array(R9.parts.length).fill(0);P9.blanks.forEach(b=>b.parts.forEach(p=>c[p]++));return c.every(x=>x===1);})()")&&run("B9.every(b=>!b.bad&&b.lines.every(l=>l.segs.length>0))")&&run("P9.st.maxBends")<=7,
  "гибка: Доберман 9 — 50–56 кусков на резку, каждая деталь ровно в одной заготовке, все контуры целые, линии сгиба внутри, сгибов на заготовку ≤ 7");
// угол коробки: на одной детали две гнутые линии не сходятся в вершине (коробку при 90° — только полосами), на Д9 тоже
run(`BXC=bendPlan(BXR,BXE.V,{ang:90});corner=P=>{const L=[...P.bent].map(id=>P.J[id]);return L.some((a,i)=>L.some((b,k)=>k>i&&[a.p,a.q].some(x=>x===b.p||x===b.q)&&[a.A,a.B].some(v=>v===b.A||v===b.B)));}`);
ok(run("BXC.blanks.length")>1&&!run("corner(BXC)")&&!run("corner(P9)"),"гибка: две линии сгиба на одной детали не сходятся в вершине — коробка распадается на полосы, у Д9 таких нет");
// DXF заготовки: сгибы — на слоях BEND_V / BEND_M, подписи «V144 (2)» — гравировкой
run(`CUR={R:R9,BL:P9.blanks.filter(b=>b.parts.length>1).map((b,i)=>Object.assign({},b,B9[i]))};ST={engrave:true}`);
run(`BI={id:'b0',no:'Г1',pts:CUR.BL[0].pts.map(p=>[-p[0],p[1]]),tr:{f:true,c:1,s:0,x:0,y:0}};MK=itemMarks(BI);DXB=[];dxfPoly(DXB,BI.pts,'CUT');dxfMarksOf(DXB,BI,0,0);DXB=dxfDoc(DXB)`);
ok(run("MK.V.length+MK.M.length")===run("CUR.BL[0].lines.reduce((a,l)=>a+l.segs.length,0)")&&run("MK.eng.length")>0&&run("/BEND_(V|M)/.test(DXB)&&/POLYLINE\\r\\n8\\r\\nCUT/.test(DXB)&&/LINE\\r\\n8\\r\\nENGRAVE/.test(DXB)"),"гибка: DXF заготовки — контур полилинией CUT, линии сгиба на BEND_V/BEND_M, номера и подписи — ENGRAVE");
// зеркальные пары: «7» слева (смотрим спереди), «7.1» — её зеркальная справа, площади равны; номеров почти вдвое меньше; гравировка с точкой
run(`MP=figureMesh('doberman9',12);MP3={V:MP.V,F:MP.F,T:MP.T,S:MP.S};RP=buildParts(MP3,1.5,1.5);addBacking(RP,MP3);NP0=RP.parts.length;pairNumbers(RP,MP3.V);
  NUM=new Set(RP.parts.map(p=>Math.floor(p.no))).size;TW=RP.parts.filter(p=>p.no%1);`);
console.log('     Д9 пары: деталей '+run('NP0')+', номеров '+run('NUM')+', «.1» — '+run('TW.length'));
ok(run("NUM")>=64&&run("NUM")<=70&&run("TW.every(p=>{const q=RP.parts[p.twin];return q&&q.no===Math.floor(p.no)&&Math.abs(q.area-p.area)<.01*p.area&&q.c[0]<=p.c[0];})")&&run("new Set(RP.parts.map(p=>p.no)).size")===run("NP0")&&run("String(RP.parts.find(p=>p.no%1).no)").endsWith('.1')&&run("!!engraveSegs('7.1',[[0,0],[60,0],[60,30],[0,30]])"),
  "зеркальные пары: Д9 — 64–70 номеров на 126 деталей, у каждой «.1» пара слева, площади равны (±1%), номера не повторяются, гравировка «7.1»");
// шаги сборки: каждый кусок ровно в одном шаге, пара — в одном шаге, каждый шаг (кроме первого и подложек) варится к собранному раньше
run(`CUR={R:RP,M3:MP3,blankOf:null,BL:[]};AS=asmSteps();ASU=AS.steps.flatMap(s=>s.u.flatMap(u=>u.ps.map(p=>p.id)))`);
ok(run("ASU.length")===run("RP.parts.length")&&run("new Set(ASU).size")===run("RP.parts.length")&&run("AS.steps.filter((s,i)=>i&&s.w.some(w=>!w.length)&&!s.u[0].ps[0].back).length")<=2&&run("AS.steps.filter(s=>s.u.length===2).length")>=50&&run("AS.steps.length")<=75,
  "шаги сборки: Д9 — каждая деталь ровно в одном шаге, зеркальные пары — вместе, почти каждый шаг варится к собранному раньше (новых начал не больше 2)");
console.log('     шагов сборки Д9 без гибки: '+run('AS.steps.length'));
// карты деталей: по карте на кусок, зеркальная пара — одна карта; у каждой — контур, размеры, сварка; у заготовки — гибка; у каждой строки — чертёж угла, при уголках — чем выставить
run(`fmt=(x,d=0)=>Number(x).toFixed(d).replace('.',',');angT=d=>d>180.5?Math.round(360-d)+'° внутрь':Math.round(d)+'°';MATN={steel:'сталь'};
  ST={t:2,gap:1,useT:true,engrave:true,mat:'steel',name:'Д9',tpl:true,bend:true,pairs:true,minW:15};CUR={R:RP,M3:MP3,T:{mass:1},C:RP.parts.map(p=>cutContour(p,2,1,true))};
  CUR.BP=bendPlan(RP,MP3.V,{sheet:[1250,2500]});CUR.BL=CUR.BP.blanks.filter(b=>b.parts.length>1).map(b=>Object.assign(b,bendBlank(b,RP,MP3.V,CUR.BP,{t:2,gap:1,useT:true}))).filter(b=>!b.bad);blankNumbers(CUR.BL,RP);
  CUR.blankOf=new Int32Array(RP.parts.length).fill(-1);CUR.BL.forEach((b,i)=>b.parts.forEach(pi=>CUR.blankOf[pi]=i));CUR.bentKey=new Set(CUR.BL.flatMap(b=>b.bends.map(id=>bendKey(CUR.BP.J[id].p,CUR.BP.J[id].q))));
  CUR.PC=RP.parts.filter(p=>CUR.blankOf[p.id]<0).map(p=>({id:p.id,no:p.no,pts:CUR.C[p.id].pts,parts:[p.id],key:p.no})).concat(CUR.BL.map((b,i)=>({id:'b'+i,no:'Г'+b.no,pts:b.pts,parts:b.parts,key:RP.parts[b.parts[0]].no,B:b}))).sort((a,b)=>a.key-b.key);
  CUR.TPL=weldTemplates(RP,2,15,(p,q)=>CUR.bentKey.has(bendKey(p,q)),CUR.BL.flatMap(b=>b.lines.map(l=>l.ang)));CD=buildCards();
  CNT=(s,re)=>(s.match(re)||[]).length;BLC=CD.filter(c=>c.svg.includes('Карта заготовки'));`);
console.log('     карты Д9: '+run('CD.length')+' (кусков '+run('CUR.PC.length')+', «.1» '+run("CUR.PC.filter(o=>String(o.no).endsWith('.1')).length")+', заготовок на картах '+run('BLC.length')+'), уголков '+run('CUR.TPL.length')+' (под сгибы '+run('CUR.TPL.filter(o=>o.bends).length')+')');
ok(run("CD.length")===run("CUR.PC.length-CUR.PC.filter(o=>String(o.no).endsWith('.1')).length")&&run("CD.every(c=>c.svg.includes('viewBox=\"0 0 210 297\"')&&c.svg.includes('<polygon class=\"l\"')&&c.svg.includes('Развёртка')&&c.svg.includes('Сварка')&&CNT(c.svg,/<text class=\"sm\"[^>]*text-anchor=\"middle\">[0-9]+</g)>=2)")
  &&run("BLC.length")>0&&run("BLC.every(c=>c.svg.includes('Гибка — по порядку')&&c.svg.includes('class=\"bnd'))")&&run("CD.every(c=>CNT(c.svg,/class=\"wg\"/g)+CNT(c.svg,/class=\"br\"/g)===c.rows)")&&run("CD.every(c=>!c.svg.includes('транспортиром'))")&&run("CD.some(c=>c.svg.includes('уголок У'))"),
  "карты деталей: Д9 — по карте на кусок (пара «.1» — на той же), А4, у каждой контур, длины сторон, сварка; у заготовок — гибка и линии сгиба; у каждой строки — чертёж угла; при уголках каждый угол — уголком, линейкой или по месту");
run(`ST.tpl=false;CUR.TPL=null;CD2=buildCards();`);ok(run("CD2.every(c=>CNT(c.svg,/class=\"wg\"/g)+CNT(c.svg,/class=\"br\"/g)===c.rows)")&&run("CD2.some(c=>c.svg.includes('транспортиром'))")&&run("!CD2.some(c=>c.svg.includes('уголок У'))"),"карты деталей без уголков: чертёж угла всё равно у каждой строки, выставлять транспортиром");
// v0.11.0: гибка клетками — клеток столько, сколько сгибов; уголок во внутреннем углу: у V — со стороны гравировки (выше вершины), у m — ниже
run(`ST.tpl=true;CUR.TPL=weldTemplates(RP,2,15,(p,q)=>CUR.bentKey.has(bendKey(p,q)),CUR.BL.flatMap(b=>b.lines.map(l=>l.ang)));CD4=buildCards();BS={cells:0,lines:0,tw:0,bad:0};
  CD4.filter(c=>c.svg.includes('Карта заготовки')).forEach(c=>{const gs=c.svg.split('<g class="br"').slice(1);BS.cells+=gs.length;gs.map(g=>g.slice(0,g.indexOf('</g>'))).forEach(g=>{const m=g.match(/<polygon class="tw" points="([^"]+)"/);if(!m)return;BS.tw++;
    const cy=m[1].split(' ').map(p=>+p.split(',')[1]).reduce((a,b)=>a+b,0)/3,vy=+g.match(/cy="([0-9.]+)" r=".5"/)[1];if(g.includes('data-kind="V"')?cy>=vy:cy<=vy)BS.bad++;});});
  BS.wo=0;BS.wbad=0;CD4.forEach(c=>c.svg.split('<g class="wg"').slice(1).map(g=>g.slice(0,g.indexOf('</g>'))).forEach(g=>{const m=g.match(/<polygon class="tw" points="([^"]+)"/);if(!m)return;const out=g.startsWith(' data-out');if(out)BS.wo++;
    const cy=m[1].split(' ').map(p=>+p.split(',')[1]).reduce((a,b)=>a+b,0)/3,vy=+g.match(/cy="([0-9.]+)" r=".45"/)[1];if(out?cy<=vy:cy>=vy)BS.wbad++;}));
  BS.pv=CD4.every(c=>c.svg.includes('Где на фигуре')&&!c.svg.includes('<image'));globalThis.pieceShots=(own,tw,a)=>[1,2,3,4].map(i=>({url:'data:image/jpeg;base64,AA',txt:'вид '+i}));BS.sh=buildCards().every(c=>CNT(c.svg,/<image class="shot"/g)===4)&&buildCards().every(c=>c.svg.includes('где на фигуре'));delete globalThis.pieceShots;
  BS.lines=asmUnits().L.filter((x,i,L)=>(x.tw<0||x.tw>i)&&x.bi>=0).reduce((a,x)=>a+CUR.BL[x.bi].lines.length,0);`);
console.log('     гибка строками: '+run('BS.cells')+' (сгибов на картах '+run('BS.lines')+'); швов «внутрь» с уголком '+run('BS.wo')+', уголок сварки не с той стороны '+run('BS.wbad'));
ok(run('BS.cells===BS.lines&&BS.wo>0&&BS.wbad===0&&BS.pv&&BS.sh'),'карты: гибка — строка на каждый сгиб; в профиле шва уголок сверху (изнутри), у шва «внутрь» — снизу (снаружи); «Где на фигуре» — 4 снимка 3D-модели (без WebGL — схема)');
// v0.14.0: гибка картинками — уголок в угле готового элемента: кромки в плоскостях граней, угол между ними = угол сгиба, у V — изнутри (против наружных нормалей), у m — снаружи
run(`BT={n:0,plane:0,ang:0,side:0,hit:0,none:0};CUR.BL.forEach(B=>{const own=new Set(B.parts);B.lines.forEach(l=>{const j=CUR.BP.J[l.id],tp=CUR.TPL.find(o=>o.a===Math.round(l.ang));if(!tp){BT.none++;return;}BT.n++;
    const T=bendTpl(RP,MP3,j,own,tp.pts),np=RP.parts[j.p].n,nq=RP.parts[j.q].n;if(Math.abs(V3.dot(np,T.e1))>.02||Math.abs(V3.dot(nq,T.w2))>.02||Math.abs(V3.dot(T.u,T.e1))>.02||Math.abs(V3.dot(T.u,T.e2))>.02)BT.plane++;
    if(Math.abs(Math.acos(Math.max(-1,Math.min(1,V3.dot(T.e1,T.w2))))*180/Math.PI-l.ang)>1)BT.ang++;const sg=l.kind==='V'?-1:1;if(V3.dot(T.b,np)*sg<=0||V3.dot(T.b,nq)*sg<=0)BT.side++;if(T.hit)BT.hit++;
    const a2=tp.pts[1],q=T.P3[1],o=V3.sub(V3.sub(q,T.M),T.o),gp=V3.len(T.o)*Math.sin(Math.acos(V3.dot(T.e1,T.w2))/2);if(Math.abs(gp-.3)>.01)BT.plane++;if(Math.abs(V3.dot(o,T.e1)-a2[0])>.01||Math.abs(V3.dot(o,T.u))>.01)BT.plane++;});});`);
console.log('     уголки в углах сгибов Д9: '+run('BT.n')+' (без уголка '+run('BT.none')+'), не встают в готовом элементе '+run('BT.hit'));
ok(run('BT.n>0&&BT.plane===0&&BT.ang===0&&BT.side===0'),'гибка картинками: уголок в угле сгиба — кромки по граням, угол = углу сгиба, у V изнутри фигуры, у m снаружи, прижат к граням (зазор 0,3 мм)');
// снимки сгибов (заглушка вместо WebGL): 1–2 сгиба — на карте элемента, 3 и больше — лист «Гибка» сразу после карты (до 8 на лист); номера листов в штампе — по порядку
run(`globalThis.bendShot=(own,l,a)=>({url:'data:image/jpeg;base64,AA',labs:[{x:.5,y:.5,t:'7',k:'no'},{x:.4,y:.6,t:String(l.k),k:'bend'}],hit:false,how:'tpl'});CD5=buildCards();delete globalThis.bendShot;
  BG={img:0,bad:0,sheets:0,want:0,num:0,rows:0};const U=asmUnits().L.filter((x,i,L)=>(x.tw<0||x.tw>i)&&CUR.PC.some(c=>c.id===(x.bi>=0?'b'+x.bi:x.ps[0].id)&&c.pts.length>2));
  CD5.forEach((c,i)=>{BG.img+=CNT(c.svg,/<image class="bsh"/g);const m=c.svg.match(/>Лист<\\/text><text[^>]*>([0-9]+)</);if(!m||+m[1]!==i+1||!c.svg.includes('>'+CD5.length+'</text>'))BG.num++;if(CNT(c.svg,/class="wg"/g)+CNT(c.svg,/class="br"/g)!==c.rows)BG.rows++;});
  let k=0;U.forEach(x=>{const c=CD5[k++],n=x.bi>=0?CUR.BL[x.bi].lines.length:0;if(n&&n<=2&&CNT(c.svg,/<image class="bsh"/g)!==n)BG.bad++;
    if(n>2){const pg=Math.ceil(n/8);BG.want+=pg;for(let p=0;p<pg;p++){const b=CD5[k++];if(!b||!b.title.startsWith('Гибка '+x.name)||!b.svg.includes('Гибка — проверка уголком')||CNT(b.svg,/<image class="bsh"/g)!==Math.min(8,n-p*8)||CNT(b.svg,/<g class="bs"/g)!==Math.min(8,n-p*8))BG.bad++;else BG.sheets++;}}});
  if(k!==CD5.length)BG.bad++;`);
console.log('     снимков сгибов '+run('BG.img')+', листов «Гибка» '+run('BG.sheets')+' из '+run('BG.want')+', всего листов '+run('CD5.length'));
ok(run('BG.img===BS.lines&&BG.bad===0&&BG.sheets===BG.want&&BG.want>0&&BG.num===0&&BG.rows===0&&!CD4.some(c=>c.svg.includes(\'class="bsh"\'))'),'гибка картинками: снимок на каждый сгиб — 1–2 на карте, больше — лист «Гибка» после карты; листы в штампе по порядку; без WebGL — только строки');
// уголков нет — на снимке дуга угла: листы «Гибка — проверка угла», слова «уголком» нет
run(`globalThis.bendShot=(own,l,a)=>({url:'data:image/jpeg;base64,AA',labs:[],hit:false,how:'none'});CD6=buildCards().filter(c=>c.svg.includes('class="bsh"'));delete globalThis.bendShot;`);
ok(run("CD6.length>0&&CD6.filter(c=>c.title.startsWith('Гибка ')).every(c=>c.svg.includes('Гибка — проверка угла')&&!c.svg.includes('уголком'))&&CD6.filter(c=>!c.title.startsWith('Гибка ')).every(c=>c.svg.includes('дуга угла'))"),'гибка картинками без уголков: лист «Гибка — проверка угла», на карте — «дуга угла»');
// v0.15.0: порядок сборки снимками (заглушка вместо WebGL) — снимок в каждой клетке шага, схемы гранями нет; номера поверх снимка — в клетке
run(`globalThis.stepShot=(st,a)=>({url:'data:image/jpeg;base64,AA',txt:'спереди',labs:[{x:.5,y:.5,t:String(st.u[0].ps[0].no),k:'new'},{x:.5,y:.5,t:'99',k:'nb'},{x:.99,y:.99,t:'77',k:'nb'}]});AA1=sheetsAssembly();delete globalThis.stepShot;
  AN=asmSteps().steps.length;AA2=sheetsAssembly();AQ={img:0,fc:0,lab:0,out:0};AA1.forEach(o=>{AQ.img+=CNT(o.body,/<image class="ash"/g);AQ.fc+=CNT(o.body,/class="fc"/g);AQ.lab+=CNT(o.body,/<text class="no"/g);AQ.out+=CNT(o.body,/>77</g);});
  // без WebGL — схема: оранжевые только грани самого элемента (зеркальная пара — серым)
  AQ.or=AA2.reduce((s,o)=>s+CNT(o.body,/fill="rgb[(]/g),0);AQ.want=asmSteps().steps.reduce((s,st)=>{const v=stepView(st.u[0].ps);return s+st.u[0].ps.filter(p=>V3.dot(p.n,v.d)>.02).length;},0);`);
console.log('     порядок сборки Д9: шагов '+run('AN')+', листов '+run('AA1.length')+', снимков '+run('AQ.img')+'; без WebGL оранжевых граней '+run('AQ.or')+' из '+run('AQ.want'));
ok(run('AQ.img===AN&&AQ.fc===0&&AQ.lab===AN*2&&AQ.out===0&&AA2.length===AA1.length&&AQ.or===AQ.want&&!AA2.some(o=>o.body.includes(\'class="ash"\'))'),'порядок сборки снимками: в каждой клетке шага снимок, номера поверх (наезжают — сдвиг, за краем — нет); без WebGL — схема, оранжевый только сам элемент, зеркальная пара серым');
// гравировка заготовок (как в DXF): подписи сгибов не ближе 1 мм к номерам деталей и друг к другу; всё влезло; номер мельчит не меньше 5 мм; на карте — та же гравировка
run(`ST.engrave=true;SEGD=(a,b)=>{const d=(p,s)=>{const vx=s[2]-s[0],vy=s[3]-s[1],L=vx*vx+vy*vy||1e-9,t=Math.max(0,Math.min(1,((p[0]-s[0])*vx+(p[1]-s[1])*vy)/L));return Math.hypot(s[0]+vx*t-p[0],s[1]+vy*t-p[1]);};
    const cr=(o,p,q)=>(p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0]),A=[a[0],a[1]],B=[a[2],a[3]],C=[b[0],b[1]],D=[b[2],b[3]];if(cr(A,B,C)*cr(A,B,D)<0&&cr(C,D,A)*cr(C,D,B)<0)return 0;return Math.min(d(A,b),d(B,b),d(C,a),d(D,a));};
  GD=(G,H)=>{let m=1e9;G.forEach(a=>H.forEach(b=>{m=Math.min(m,SEGD(a,b));}));return m;};HT=g=>{const ys=g.flatMap(q=>[q[1],q[3]]);return Math.max(...ys)-Math.min(...ys);};
  EG={close:0,miss:0,shrunk:0,tiny:0,labs:0};CUR.BL.forEach((B,i)=>{const t=bendAlign(B.pts,true),P=B.pts.map(q=>trPt(t,q)),m=itemMarks({id:'b'+i,no:'Г'+B.no,pts:P,tr:t});EG.miss+=m.miss.length;EG.labs+=m.labs.length;
    m.labs.forEach((L,k)=>{m.num.forEach(n=>{if(n.g&&GD(L.g,n.g)<1)EG.close++;});m.labs.forEach((L2,k2)=>{if(k2>k&&GD(L.g,L2.g)<1)EG.close++;});});
    m.num.forEach((n,j)=>{const g0=engraveSegs(n.no,B.regions[j].pts.map(q=>trPt(t,q)));if(!n.g||!g0)return;const h=HT(n.g),h0=HT(g0);if(h<h0-.01){EG.shrunk++;if(h<Math.min(h0,5)-.01)EG.tiny++;}});});
  ST.tpl=true;CD3=buildCards();`);
console.log('     гравировка заготовок Д9: подписей сгибов '+run('EG.labs')+', номеров уменьшено '+run('EG.shrunk'));
ok(run("EG.close")===0&&run("EG.miss")===0&&run("EG.tiny")===0&&run("EG.labs")===run("CUR.BL.reduce((a,b)=>a+b.lines.filter(l=>l.segs.length).length,0)")&&run("CD3.filter(c=>c.svg.includes('Карта заготовки')).every(c=>c.svg.includes('eng engb'))"),
  "гравировка заготовок: Д9 — каждая подпись сгиба выгравирована и не ближе 1 мм к номерам деталей и другим подписям, номер мельчит не меньше 5 мм; на карте — та же гравировка, подписи сгибов бледно");
// перфорация линий сгиба: прорези 2 мм на каждой линии, центры крайних — 10 мм от концов, шаг не больше 20, все внутри заготовки; в метраже — отдельно от реза и врезок;
// в DXF — слой PERF, у каждой детали контур CUT после её меток; без галочки и при плазме прорезей нет
run(`ST.perf=true;ST.cut='laser';ST.perfL=2;ST.perfStep=20;ST.perfEdge=10;PF={segs:0,holes:0,bad:0,stray:0,out:0};PI=[];
  CUR.BL.forEach((B,i)=>{const t=bendAlign(B.pts,true),P=B.pts.map(q=>trPt(t,q)),o={id:'b'+i,no:'Г'+B.no,pts:P,tr:t},m=itemMarks(o);PI.push(o);let got=0;
    m.P.forEach(h=>{if(!inPoly([(h[0]+h[2])/2,(h[1]+h[3])/2],P))PF.out++;});
    B.lines.forEach(l=>l.segs.forEach(z=>{const a=trPt(t,[z[0],z[1]]),b=trPt(t,[z[2],z[3]]),L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,pr=p=>(p[0]-a[0])*ux+(p[1]-a[1])*uy;PF.segs++;
      const C=m.P.filter(h=>[[h[0],h[1]],[h[2],h[3]]].every(p=>Math.abs((p[0]-a[0])*uy-(p[1]-a[1])*ux)<1e-6&&pr(p)>-1e-6&&pr(p)<L+1e-6)).map(h=>{if(Math.abs(Math.hypot(h[2]-h[0],h[3]-h[1])-2)>.01)PF.bad++;return pr([(h[0]+h[2])/2,(h[1]+h[3])/2]);}).sort((x,y)=>x-y);
      got+=C.length;PF.holes+=C.length;
      if(L<6){if(C.length)PF.bad++;return;}if(L<=20){if(C.length!==1||Math.abs(C[0]-L/2)>.01)PF.bad++;return;}
      if(Math.abs(C[0]-10)>.01||Math.abs(C[C.length-1]-(L-10))>.01||C.some((c,k)=>k&&c-C[k-1]>20+1e-6))PF.bad++;}));
    if(got!==m.P.length)PF.stray++;});
  PS0=cutStats(PI);ST.perf=false;PS1=cutStats(PI);ST.perf=true;ST.cut='plasma';PS2=cutStats(PI);ST.cut='laser';
  NI=PI.map((o,i)=>{const xs=o.pts.map(q=>q[0]),ys=o.pts.map(q=>q[1]);return Object.assign({},o,{x:i*3000-Math.min(...xs),y:-Math.min(...ys)});});
  N0=CUR.N;CUR.N={W:3000*NI.length,H:3000,gap:3,sheets:[{items:NI}]};
  DXP=t=>{const TK=t.split('\\r\\n'),EN=[];let cur=null,vx=false;for(let i=0;i+1<TK.length;i+=2){const c=TK[i].trim(),v=TK[i+1].trim();
      if(c==='0'){vx=v==='VERTEX';if(v==='LINE'||v==='POLYLINE'){cur={t:v,lay:'',x:null};EN.push(cur);}else if(!vx)cur=null;}
      else if(cur){if(c==='8'&&!vx&&!cur.lay)cur.lay=v;else if(c==='10'&&cur.x===null&&(cur.t==='LINE'||vx))cur.x=+v;}}return EN;};
  EN1=DXP(dxfNest());DO={bad:0,perf:0};CI=[];EN1.forEach((en,j)=>{if(en.lay==='SHEET')return;const k=Math.floor((en.x+1)/3000);(CI[k]=CI[k]||{m:[],c:[]})[en.lay==='CUT'?'c':'m'].push(j);if(en.lay==='PERF')DO.perf++;});
  CI.forEach((g,k)=>{if(!g||g.c.length!==1||g.m.some(j=>j>g.c[0]||(k&&CI[k-1]&&j<CI[k-1].c[0])))DO.bad++;});
  ST.perf=false;EN2=DXP(dxfNest());ST.perf=true;ST.cut='plasma';EN3=DXP(dxfNest());ST.cut='laser';ST.perf=false;CUR.N=N0;`);
console.log('     перфорация Д9: линий сгиба '+run('PF.segs')+', прорезей '+run('PF.holes')+' ('+run("perfTxt(PS0)")+'), DXF: PERF '+run('DO.perf'));
ok(run("PF.holes")>0&&run("PF.bad+PF.stray+PF.out")===0&&run("PS0.perf===PF.holes&&PS0.perfPierce===PF.holes&&Math.abs(PS0.perfLen-2*PF.holes)<.1&&PS0.pierce===PS1.pierce&&Math.abs(PS0.cut-PS1.cut)<1e-6&&PS1.perf===0&&PS2.perf===0"),
  "перфорация: Д9 — на каждой линии сгиба прорези 2 мм, крайние центры 10 мм от концов, шаг не больше 20, все внутри заготовки; рез и врезки контуров не меняются, перфорация считается отдельно; без галочки и при плазме — нет");
ok(run("DO.perf")===run("PF.holes")&&run("DO.bad")===0&&run("CI.filter(Boolean).length")===run("NI.length")&&run("!EN2.some(e=>e.lay==='PERF')&&!EN3.some(e=>e.lay==='PERF')")&&run("EN2.some(e=>e.lay==='BEND_V')"),
  "перфорация в DXF: слой PERF, у каждой заготовки гравировка, сгибы и прорези раньше её контура CUT; без галочки и при плазме слоя PERF нет");
// v0.17.0 сварка: TIG — зазор 0,5; полуавтомат — 1, лист до 1,5 мм — 0,5; свой зазор при смене толщины не сбивается; меньше зазор — деталь больше (кромка у шва ближе на четверть разницы)
ok(run("weldGap('tig',2)===0.5&&weldGap('tig',3)===0.5&&weldGap('mig',2)===1&&weldGap('mig',3)===1&&weldGap('mig',1.5)===0.5&&weldGap('mig',1)===0.5")
  &&run("gapAfterT(1,'mig',2,1.5)===0.5&&gapAfterT(0.5,'mig',1.5,2)===1&&gapAfterT(1.5,'mig',2,1)===1.5&&gapAfterT(0.8,'tig',2,3)===0.8&&gapAfterT(0.5,'tig',2,1)===0.5"),
  "сварка: рекомендуемый зазор TIG 0,5, полуавтомат 1 (лист до 1,5 мм — 0,5); при смене толщины свой зазор остаётся");
run(`WG={big:0,n:0,sb:0};RP.parts.forEach(p=>{const a=cutContour(p,2,0.5,true),b=cutContour(p,2,1,true);if(a.bad||b.bad)return;WG.n++;const sa=Math.abs(area2(a.pts)),sb=Math.abs(area2(b.pts));if(p.segs.some(g=>g.nb>=0)?sa>sb:Math.abs(sa-sb)<1e-9)WG.big++;
    p.segs.forEach(g=>{if(g.nb>=0&&Math.abs(edgeSetback(g,2,1,true)-edgeSetback(g,2,0.5,true)-0.25)>1e-9)WG.sb++;});});`);
ok(run("WG.n>0&&WG.big===WG.n&&WG.sb===0"),"сварка: при зазоре 0,5 каждая деталь Д9 со швами больше, чем при 1 (без швов — та же) — кромка у шва на 0,25 мм дальше, открытый край на месте");
run(`ST.weld='tig';ST.gap=0.5;TQ1=techReq(true);TQ2=techReq(false);ST.weld='mig';ST.gap=1;TQ3=techReq(true);ST.engrave=false;TQ4=techReq(false);ST.engrave=true;TJ=Q=>Q.join(' ').replace(/[  ]+/g,' ');`);
ok(run("TQ1.some(l=>l.includes('Сварка TIG')&&l.startsWith('5.'))&&TJ(TQ1).includes('азотом')&&TJ(TQ1).includes('зазором 0,5 мм')&&!TQ1.some(l=>l.includes('MIG'))")
  &&run("TQ2[1].startsWith('1. Порядок на лазере')&&TQ2.some(l=>l.startsWith('2. Сварка TIG'))&&TQ3.some(l=>l.startsWith('5. Сварка полуавтоматом'))&&TQ3.some(l=>l.includes('Ar+CO₂'))&&TJ(TQ3).includes('зазором 1 мм')&&!TQ3.some(l=>l.includes('азот'))")
  &&run("TQ4[1].startsWith('1. Сварка полуавтоматом')&&[TQ1,TQ2,TQ3,TQ4].every(Q=>Q.every(l=>l.length<=TR_W+4))"),
  "техтребования: всегда есть пункт сварки под её вид (TIG — азот и зазор 0,5, полуавтомат — Ar+CO₂ и зазор 1), без гибки — нумерация с 1, строки по ширине столбца");
const DT=t=>[...t.matchAll(/\r\nTEXT\r\n8\r\n([^\r]+)\r\n[\s\S]*?\r\n1\r\n([^\r]*)/g)].map(m=>({lay:m[1],t:m[2]}));
run(`N0=CUR.N;CUR.N={W:3000,H:3000,gap:3,sheets:[{items:[NI[0]]}]};ST.weld='tig';`);const W1=DT(run('dxfNest()')),W2=DT(run('dxfParts()'));run(`ST.weld='mig';`);const W3=DT(run('dxfNest()')),W4=DT(run('dxfParts()'));run(`CUR.N=N0;ST.weld='tig';`);
const N2=run('DXF_N2'),hasN2=W=>W.filter(x=>x.t===N2);
ok(hasN2(W1).length===1&&hasN2(W1)[0].lay==='SHEET'&&hasN2(W2).length===1&&hasN2(W2)[0].lay==='SHEET'&&!hasN2(W3).length&&!hasN2(W4).length&&/^[\x20-\x7e]+$/.test(N2),
  "DXF под TIG: надпись «резать азотом N2» латиницей на слое SHEET (не CUT/ENGRAVE) — в раскрое и в деталях; под полуавтомат — нет");
// v0.17.0 шаг сборки: другая половина фигуры — призраком (не металлом), элемент и соседи — всегда; элемент посередине — всё собранное
run(`SW={steps:0,cut:0,bad:0,mid:0};asmSteps().steps.forEach(st=>{const S=stepShown(st),x=st.u[0],A=x.ps.reduce((s,p)=>s+p.area,0),cx=x.ps.reduce((s,p)=>s+p.c[0]*p.area,0)/A;SW.steps++;
  if(x.ps.some(p=>!S.has(p.id))||st.w[0].some(q=>!S.has(q.nb))||[...S].some(pi=>!st.done.has(pi)))SW.bad++;if(Math.abs(cx)<15){SW.mid++;if(S.size!==st.done.size)SW.bad++;return;}
  const gone=[...st.done].filter(pi=>!S.has(pi));SW.cut+=gone.length;if(gone.some(pi=>RP.parts[pi].c[0]*Math.sign(cx)>-15))SW.bad++;if(st.u[1]&&st.u[1].ps.some(p=>Math.abs(p.c[0])>=15&&S.has(p.id)))SW.bad++;});`);
console.log('     шаги сборки Д9: '+run('SW.steps')+' (посередине '+run('SW.mid')+'), деталей другой половины призраком всего '+run('SW.cut'));
ok(run('SW.steps>0&&SW.cut>0&&SW.bad===0'),'шаг сборки: другая половина фигуры (зеркальная пара) — призраком, элемент и соседи — металлом, посередине — всё собранное');
console.log(bad?'ОШИБОК: '+bad:'всё ок');process.exit(bad?1:0);

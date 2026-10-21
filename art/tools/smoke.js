// проверка ядра «Искусства»: node art/tools/smoke.js
const fs=require('fs'),vm=require('vm'),P=__dirname+'/../js/';const c={console,TextDecoder,Math};vm.createContext(c);
vm.runInContext(['mesh','edit','models','models-poly','figures','prod'].map(f=>fs.readFileSync(P+f+'.js','utf8')).join('\n;\n'),c);
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
console.log(bad?'ОШИБОК: '+bad:'всё ок');process.exit(bad?1:0);

// дымовой тест: весь код модели в Node, Three.js и DOM — пустышки. Ловит ReferenceError/TypeError в сборке, размерах, раскрое
const fs=require('fs'),vm=require('vm'),path=require('path');
const P=path.join(__dirname,'..');
const dimIds=[...fs.readFileSync(P+'/js/dims.js','utf8').matchAll(/^\s*\['([A-Za-z]\w*)',/gm)].map(m=>m[1]);
const mk=()=>{const U=new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>0;if(k===Symbol.iterator)return function*(){};if(k==='then')return undefined;return U;},apply:()=>U,construct:()=>U,set:()=>true});return U;};
let fails=0,airMM=null,hookMM=null;   // габариты развёртки задвижки и скобы из partMM — для раскладки на прямоугольниках
for(const mode of ['both','grill','stove'])for(const extra of [{},{cgr:true,div:true,gAng:false},{man:true,cgr:true,div:true,obe:true,grType:'rebar',skew:true,skewD:true,grates2:true,grillGrate:true}]){
  const U=mk(),errs=[];
  const flags=JSON.stringify(Object.assign({rain:true,mode},extra));
  const ctx={THREE:U,document:U,window:{addEventListener:()=>{}},location:{hash:'',href:'http://x/',search:'?view=1,1,1,0,0,0&dims='+dimIds.join(',')+'&flags='+encodeURIComponent(flags)},
    addEventListener:()=>{},requestAnimationFrame:()=>{},ResizeObserver:U,MutationObserver:U,devicePixelRatio:1,performance:{now:()=>0},navigator:U,URLSearchParams,console,Math,JSON,Set,Object,Array,Number,String,Symbol,setTimeout,clearTimeout};
  vm.createContext(ctx);
  // классические скрипты делят одну лексическую область — склеиваем
  const src=['params','parts','model','dims','cut','dxf','nest','ui'].map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n');
  try{vm.runInContext(src,ctx,{filename:'all.js'});
      vm.runInContext("dimVisible().forEach(r=>{try{r.fn()}catch(e){throw new Error('dim '+r.id+': '+e.message)}});drawCut();",ctx);
      // раскрой листа: детали для раскладки (у боковин в Node контур пустой — пропускаются), раскладка и рисунок
      vm.runInContext("{const N=nestJob(),res=N.groups.map(G=>{const g=nestGen(G.items,N.W,N.H,N.gap,NEST_EDGE,NEST_CELL);let v;do{v=g.next();}while(!v.done);return v.value;});nestDraw(N,res);nestUI();nestUI(true);}",ctx);
      // колосник мангала: на листе 5 мм, когда он есть на модели; галочка «на листе» снята — нет; у половины 18 × 19 отверстий Ø10
      vm.runInContext(`{const has=N=>N.groups.some(G=>G.types.some(t=>NEST_CGR(t.p))),a=nestJob(),b=nestJob({cgr:false}),want=gOn()&&S.cgr;
        if(has(a)!==want||a.hasCgr!==want)throw new Error('колосник мангала: на листе '+has(a)+', ждали '+want);if(has(b))throw new Error('колосник мангала остался при снятой галочке');
        if(want){const ty=a.groups.flatMap(G=>G.types).filter(t=>NEST_CGR(t.p));if(ty.length!==2||ty.some(t=>t.p.mm!==5||t.m.circles.length!==342||t.m.circles.some(c=>c[2]!==5)))throw new Error('колосник мангала: не те половины/отверстия');}}`,ctx);
      // площадка под колесо — 5 мм, на основном листе; листа 6 мм нет
      vm.runInContext(`{const N=nestJob(),ps=laserParts().filter(p=>p.pt==='pads');if(ps.some(p=>p.mm!==5))throw new Error('площадка под колесо не 5 мм');if(N.groups.some(G=>G.mm===6))throw new Error('остался лист 6 мм');
        if(S.legs&&ps.length&&!N.groups.some(G=>G.mm===5&&G.types.some(t=>t.p.pt==='pads')))throw new Error('площадки под колесо нет на листе 5 мм');}`,ctx);
      // задвижки поддува и скобы задвижек — лист 5 мм, на листе 5 мм, когда есть на модели; скоб 4, контур 12 × 30; в режиме «мангал» листа 3 мм нет
      const ah=vm.runInContext(`(()=>{const N=nestJob(),lp=laserParts(),on5=pt=>N.groups.some(G=>G.mm===5&&G.types.some(t=>t.p.pt===pt)),r={};
        [['air',gOn()&&S.airSl,2],['hook',gOn()&&S.hook,4]].forEach(([pt,want,q])=>{const ps=lp.filter(p=>p.pt===pt);
          if(ps.length!==(want?1:0))throw new Error(pt+': деталей '+ps.length+', ждали '+(want?1:0));if(!want)return;const p=ps[0],m=partMM(p);
          if(p.mm!==5)throw new Error(pt+': толщина '+p.mm+', ждали 5');if(p.q!==q)throw new Error(pt+': '+p.q+' шт, ждали '+q);
          if(!on5(pt))throw new Error(pt+': нет на листе 5 мм');if(N.groups.some(G=>G.mm!==5&&G.types.some(t=>t.p.pt===pt)))throw new Error(pt+': лежит не на листе 5 мм');r[pt]=[m.w,m.h];});
        if(r.hook){const m=partMM(lp.find(p=>p.pt==='hook')),P=m.loops[0];
          if(m.w!==12||m.h!==30)throw new Error('скоба: габарит '+m.w+' × '+m.h+', ждали 12 × 30');
          if(m.loops.length!==1||m.circles.length||m.bends.length)throw new Error('скоба: лишние контуры, отверстия или гибы');
          if(JSON.stringify(P)!==JSON.stringify([[0,0],[12,0],[12,30],[7,30],[7,8],[0,8],[0,0]]))throw new Error('скоба: контур '+JSON.stringify(P));
          if(Math.abs(Math.abs(area2(P.slice(0,-1)))-206)>1e-6)throw new Error('скоба: площадь не 206 мм²');}
        if(r.air){const m=partMM(lp.find(p=>p.pt==='air'));if(m.w!==Math.round((AIR_L+2*AIR_TH)*10)||m.h!==30||m.bends.some(b=>Math.abs(b[0][0]-30)>1e-6&&Math.abs(b[0][0]-(m.w-30))>1e-6))throw new Error('задвижка: развёртка '+m.w+' × '+m.h+', гибы '+JSON.stringify(m.bends));}
        // скоба держит задвижку: полка — на уровне низа задвижки, вырез шире планки, ухо выше середины задвижки
        if(AH_Y0+AH_HEEL!==HOLE_Y-AIR_H/2||AH_GAP<=AIR_T||AH_Y0+AH_H<=HOLE_Y)throw new Error('скоба не держит задвижку');
        if(S.mode==='grill'&&N.groups.some(G=>G.mm===3))throw new Error('мангал: остался лист 3 мм');
        // целые мм: габариты листовых деталей, строки задвижки и скобы в «Массе», подписи их размеров
        lp.forEach(p=>{const m=partMM(p);if(!Number.isFinite(m.w))return;   // боковины — из THREE.Shape, в Node контура нет
          if(!Number.isInteger(m.w)||!Number.isInteger(m.h))throw new Error('не целые мм: '+p.name+' '+m.w+' × '+m.h);});
        const txt=[];cutRows().filter(c=>c.pt==='air'||c.pt==='hook').forEach(c=>txt.push(c.n,c.s,c.note));lp.filter(p=>p.pt==='air'||p.pt==='hook').forEach(p=>txt.push(p.name,p.note));
        const d0=dim3,l0=lab;dim3=(a,b,o,t)=>txt.push(String(t));lab=t=>txt.push(String(t));
        try{dimRows().filter(d=>d.id&&/^(air|hk)/.test(d.id)).forEach(d=>{txt.push(d.name,String(d.val));d.fn();});}finally{dim3=d0;lab=l0;}
        const bad=txt.find(t=>/[0-9],[0-9]/.test(t));if(bad)throw new Error('дробные мм в подписи: '+bad.slice(0,80));
        return r;})()`,ctx);
      if(ah.air)airMM=ah.air;if(ah.hook)hookMM=ah.hook;
      // DXF всего листа: рамка — 4 отрезка SHEET, все точки CUT/BEND внутри рамки с краем 10 мм, контуры замкнуты (каждый конец CUT — у чётного числа отрезков), окружностей — сколько у деталей
      const dx=vm.runInContext(`(()=>{const N=nestJob(),out=[];N.groups.forEach(G=>{const g=nestGen(G.items,N.W,N.H,N.gap,NEST_EDGE,NEST_CELL);let v;do{v=g.next();}while(!v.done);
        v.value.sheets.forEach(sh=>out.push({mm:G.mm,W:N.W,H:N.H,txt:nestDxf(N,G,sh),circ:sh.items.reduce((a,it)=>a+G.items[it.id].ty.m.circles.length,0)}));});return out;})()`,ctx);
      if(!dx.length)throw new Error('DXF листа: нет листов');
      dx.forEach(d=>{const t=d.txt.split(/\r?\n/),E=[];for(let i=0;i<t.length-1;i+=2)if(t[i]==='0'&&(t[i+1]==='LINE'||t[i+1]==='CIRCLE')){const e={k:t[i+1]};let j=i+2;while(j<t.length-1&&t[j]!=='0'){e[t[j]]=t[j+1];j+=2;}E.push(e);}
        const sheet=E.filter(e=>e['8']==='SHEET'),cut=E.filter(e=>e['8']==='CUT'&&e.k==='LINE'),circ=E.filter(e=>e.k==='CIRCLE'),deg={};
        if(sheet.length!==4)throw new Error(`DXF листа ${d.mm} мм: рамка ${sheet.length} отрезков`);
        if(circ.length!==d.circ)throw new Error(`DXF листа ${d.mm} мм: окружностей ${circ.length}, ждали ${d.circ}`);
        E.filter(e=>e['8']!=='SHEET').forEach(e=>{const pts=e.k==='LINE'?[[+e['10'],+e['20']],[+e['11'],+e['21']]]:[[+e['10']-+e['40'],+e['20']-+e['40']],[+e['10']+ +e['40'],+e['20']+ +e['40']]];
          pts.forEach(([x,y])=>{if(!(x>=10-.02&&y>=10-.02&&x<=d.W-10+.02&&y<=d.H-10+.02))throw new Error(`DXF листа ${d.mm} мм: точка ${x},${y} вне листа`);});});
        cut.forEach(e=>[e['10']+','+e['20'],e['11']+','+e['21']].forEach(k=>deg[k]=(deg[k]||0)+1));
        const odd=Object.keys(deg).filter(k=>deg[k]%2);if(odd.length)throw new Error(`DXF листа ${d.mm} мм: незамкнутый контур у ${odd[0]}`);});}
  catch(e){errs.push(e.message+' '+(e.stack.split('\n')[1]||''));}
  console.log(mode,JSON.stringify(extra).slice(0,30),errs.length?'FAIL '+errs.join(' | '):'ok');fails+=errs.length;}

// раскладка на прямоугольниках: 5-мм детали «печь + мангал» — все на одном листе 1250 × 2500; зазор между деталями и край листа — точно (polyGap)
{const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(P+'/js/nest.js','utf8'),ctx,{filename:'nest.js'});
  if(!airMM||!hookMM){console.log('раскладка: нет размеров задвижки/скобы из partMM FAIL');fails++;}
  const R=(w,h)=>[[0,0],[w,0],[w,h],[0,h]],set=[[800,195,2],[800,420,1],[410,195,1],[600,495,2],[600,440,1],[430,495,1],[150,430,1],[430,145,1],[300,160,1],[80,80,4],[150,150,4],[...(airMM||[800,30]),2],[...(hookMM||[12,30]),4]];   // [150,150,4] — площадки под колесо (с v1.2 — 5 мм); задвижки поддува и их скобы (с v1.3 — 5 мм), размеры — из partMM
  const mkItems=S=>{const I=[];S.forEach(([w,h,q],k)=>{for(let j=0;j<q;j++)I.push({id:I.length,no:k+1,pts:R(w,h)});});return I;};
  // и с колосником мангала (2 половины 382 × 390 — тоже лист 5 мм)
  for(const [gap,items,one,cg] of [[5,mkItems(set),1,0],[20,mkItems(set),0,0],[5,mkItems([...set,[382,390,2]]),1,1]]){const errs=[];let N;
    try{const g=ctx.nestGen(items,2500,1250,gap,10,5);let v;do{v=g.next();}while(!v.done);N=v.value;}catch(e){errs.push(e.message);}
    if(N){const all=N.sheets.flatMap(s=>s.items);
      if(N.too.length)errs.push('не поместилось '+N.too.length);if(all.length!==items.length)errs.push('на листах '+all.length+' из '+items.length);
      if(one&&N.sheets.length!==1)errs.push('листов '+N.sheets.length+', ждали 1');
      N.sheets.forEach(s=>{const A=s.items;
        A.forEach(o=>{const xs=o.pts.map(p=>p[0]),ys=o.pts.map(p=>p[1]);if(Math.min(...xs)<10-1e-6||Math.min(...ys)<10-1e-6||Math.max(...xs)>2490+1e-6||Math.max(...ys)>1240+1e-6)errs.push('деталь '+o.no+' ближе 10 мм к краю');});
        for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const d=ctx.polyGap(A[i].pts,A[j].pts);if(d<gap-1e-6)errs.push(`зазор ${A[i].no}–${A[j].no} ${d.toFixed(2)} < ${gap}`);}});}
    console.log(`раскладка, зазор ${gap}${cg?', с колосником мангала':''}:`,N?`${N.sheets.length} лист, ${N.sheets.reduce((a,s)=>a+s.items.length,0)} деталей, занято ${Math.round(N.used*100)} %`:'',errs.length?'FAIL '+errs.slice(0,5).join(' | '):'ok');fails+=errs.length;}}
process.exit(fails?1:0);

// дымовой тест: весь код модели в Node, Three.js и DOM — пустышки. Ловит ReferenceError/TypeError в сборке, размерах, раскрое
const fs=require('fs'),vm=require('vm'),path=require('path');
const P=path.join(__dirname,'..');
const dimIds=[...fs.readFileSync(P+'/js/dims.js','utf8').matchAll(/^\s*\['([A-Za-z]\w*)',/gm)].map(m=>m[1]);
const mk=()=>{const U=new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>0;if(k===Symbol.iterator)return function*(){};if(k==='then')return undefined;return U;},apply:()=>U,construct:()=>U,set:()=>true});return U;};
let fails=0;
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
      vm.runInContext("{const N=nestJob(),res=N.groups.map(G=>{const g=nestGen(G.items,N.W,N.H,N.gap,NEST_EDGE,NEST_CELL);let v;do{v=g.next();}while(!v.done);return v.value;});nestDraw(N,res);nestUI();nestUI(true);}",ctx);}
  catch(e){errs.push(e.message+' '+(e.stack.split('\n')[1]||''));}
  console.log(mode,JSON.stringify(extra).slice(0,30),errs.length?'FAIL '+errs.join(' | '):'ok');fails+=errs.length;}

// раскладка на прямоугольниках: 5-мм детали «печь + мангал» — все на одном листе 1250 × 2500; зазор между деталями и край листа — точно (polyGap)
{const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(P+'/js/nest.js','utf8'),ctx,{filename:'nest.js'});
  const R=(w,h)=>[[0,0],[w,0],[w,h],[0,h]],set=[[800,195,2],[800,420,1],[410,195,1],[600,495,2],[600,440,1],[430,495,1],[150,430,1],[430,145,1],[300,160,1],[80,80,4]];
  const items=[];set.forEach(([w,h,q],k)=>{for(let j=0;j<q;j++)items.push({id:items.length,no:k+1,pts:R(w,h)});});
  for(const gap of [5,20]){const errs=[];let N;
    try{const g=ctx.nestGen(items,2500,1250,gap,10,5);let v;do{v=g.next();}while(!v.done);N=v.value;}catch(e){errs.push(e.message);}
    if(N){const all=N.sheets.flatMap(s=>s.items);
      if(N.too.length)errs.push('не поместилось '+N.too.length);if(all.length!==items.length)errs.push('на листах '+all.length+' из '+items.length);
      if(gap===5&&N.sheets.length!==1)errs.push('листов '+N.sheets.length+', ждали 1');
      N.sheets.forEach(s=>{const A=s.items;
        A.forEach(o=>{const xs=o.pts.map(p=>p[0]),ys=o.pts.map(p=>p[1]);if(Math.min(...xs)<10-1e-6||Math.min(...ys)<10-1e-6||Math.max(...xs)>2490+1e-6||Math.max(...ys)>1240+1e-6)errs.push('деталь '+o.no+' ближе 10 мм к краю');});
        for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const d=ctx.polyGap(A[i].pts,A[j].pts);if(d<gap-1e-6)errs.push(`зазор ${A[i].no}–${A[j].no} ${d.toFixed(2)} < ${gap}`);}});}
    console.log(`раскладка, зазор ${gap}:`,N?`${N.sheets.length} лист, ${N.sheets.reduce((a,s)=>a+s.items.length,0)} деталей, занято ${Math.round(N.used*100)} %`:'',errs.length?'FAIL '+errs.slice(0,5).join(' | '):'ok');fails+=errs.length;}}
process.exit(fails?1:0);

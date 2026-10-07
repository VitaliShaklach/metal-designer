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
  const src=['params','parts','model','dims','cut','dxf','ui'].map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n');
  try{vm.runInContext(src,ctx,{filename:'all.js'});
      vm.runInContext("dimVisible().forEach(r=>{try{r.fn()}catch(e){throw new Error('dim '+r.id+': '+e.message)}});drawCut();",ctx);}
  catch(e){errs.push(e.message+' '+(e.stack.split('\n')[1]||''));}
  console.log(mode,JSON.stringify(extra).slice(0,30),errs.length?'FAIL '+errs.join(' | '):'ok');fails+=errs.length;}
process.exit(fails?1:0);

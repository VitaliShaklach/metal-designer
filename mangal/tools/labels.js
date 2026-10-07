// все подписи размеров (список и 3D) текстом — проверить единицы: node tools/labels.js [mode] [mm|cm]
const fs=require('fs'),vm=require('vm'),path=require('path');
const P=path.join(__dirname,'..'),mode=process.argv[2]||'both',unit=process.argv[3]||'mm';
const mk=()=>{const U=new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>0;if(k===Symbol.iterator)return function*(){};if(k==='then')return undefined;return U;},apply:()=>U,construct:()=>U,set:()=>true});return U;};
const U=mk();
const ctx={THREE:U,document:U,window:{addEventListener:()=>{}},location:{hash:'',href:'http://x/',search:'?view=1,1,1,0,0,0&flags='+encodeURIComponent(JSON.stringify({mode,rain:true,man:true,div:true,obe:true,logo:true}))},
  localStorage:{getItem:()=>unit,setItem:()=>{}},addEventListener:()=>{},requestAnimationFrame:()=>{},ResizeObserver:U,MutationObserver:U,devicePixelRatio:1,performance:{now:()=>0},navigator:U,URLSearchParams,console,Math,JSON,Set,Object,Array,Number,String,Symbol,setTimeout,clearTimeout};
vm.createContext(ctx);
const src=['params','parts','model','dims','cut','dxf','ui'].map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n');
vm.runInContext(src,ctx,{filename:'all.js'});
vm.runInContext(`lab=function(t){__out.push('   3D: '+t);};
  dimVisible().forEach(r=>{__out.push(r.id+' | '+r.name+' | '+(typeof r.val==='number'?u(r.val):r.val));r.fn();});`,Object.assign(ctx,{__out:[]}));
console.log(ctx.__out.join('\n'));

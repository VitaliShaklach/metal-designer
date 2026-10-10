// дымовой тест «Каркаса»: геометрия стыков на эталонах МК-16 + сборка всего кода с пустышками THREE/DOM. node tools/smoke.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const P=path.join(__dirname,'..');let fails=0;
const ok=(c,msg)=>{console.log((c?'ok   ':'FAIL ')+msg);if(!c)fails++;};
const core=['profiles','model'].map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n');
function ctxCore(){const c={console,Math,JSON,Set,Map,Object,Array,Number,String};vm.createContext(c);vm.runInContext(core,c);return c;}
// 1. тумба 1СБ: стойки 790, царга 1 685 (45°/45°), царга 2 520, царга 3 605 (20×20 встык)
{const c=ctxCore();c.M=c.normModel(JSON.parse(fs.readFileSync(P+'/examples/mk16-1sb.json','utf8')));vm.runInContext('M=this.M',c);
 const pos=vm.runInContext('positions()',c),f=(pr,L)=>pos.find(p=>p.prof===pr&&p.L===L);
 const st=f('40x40x1.5',790),c1=f('40x40x1.5',685),c2=f('40x40x1.5',520),c3=f('20x20x1.5',605);
 ok(st&&st.qty===4&&st.total===8&&st.ang.join()==='45,90','стойка 790, скос 45°, 4 шт на тумбу, 8 всего');
 ok(c1&&c1.qty===2&&c1.ang.join()==='45,45','царга 1 685, 45°/45°');
 ok(c2&&c2.qty===2&&c2.ang.join()==='90,90','царга 2 520 встык');
 ok(c3&&c3.qty===6,'царга 3 20×20 — 605 встык, 6 шт');
 console.log('     позиции:',pos.map(p=>`${p.no} ${p.prof} L${p.L} ${p.ang.join('/')}° ×${p.qty}`).join(' | '));}
// 2. рама со стропилом под 8°: одинаковое сечение — скосы 41° / 49°; столбы 60×60 и стропило 40×40 — стропило встык по грани, рез 82°
for(const [post,want,msg] of [['40x40x1.5','41,49','скосы 41° / 49°'],['60x60x2','82,82','встык по грани столба, рез 82° / 82°']]){const c=ctxCore();vm.runInContext(`M=emptyModel();const s=Math.tan(8*Math.PI/180);
  const a=addNode(0,0,0),b=addNode(0,2100,0),d=addNode(2000,0,0),e=addNode(2000,2100+Math.round(2000*s),0);
  addMember(a.id,b.id,'${post}');addMember(d.id,e.id,'${post}');addMember(b.id,e.id,'40x40x1.5');`,c);
 const cut=vm.runInContext('memberCuts().find(x=>x.m.a==="n2")',c),pc=vm.runInContext('memberCuts().find(x=>x.m.a==="n1")',c);
 ok(cut&&[cut.angA,cut.angB].sort().join()===want,`стропило (столбы ${post}): ${msg} — получилось ${[cut.angA,cut.angB]}°, L ${cut.L}, столб L ${pc.L}`);}
// касания: прогоны навеса лежат на двух стропилах (по 2 касания), пересечений нет
{const c=ctxCore();c.M=c.normModel(JSON.parse(fs.readFileSync(P+'/examples/naves-3x2.json','utf8')));vm.runInContext('M=this.M',c);
 const cs=vm.runInContext('contacts()',c),rest=cs.filter(x=>x.type==='rest'),clash=cs.filter(x=>x.type==='clash');
 ok(rest.length===6&&!clash.length,`навес: прогоны лежат на стропилах — касаний ${rest.length}, пересечений ${clash.length}`);}
// 3. раскрой хлыстов
{const c=ctxCore();c.M=c.normModel(JSON.parse(fs.readFileSync(P+'/examples/mk16-1sb.json','utf8')));vm.runInContext('M=this.M',c);
 const n=vm.runInContext('nesting()',c);ok(n.length===2&&n.every(x=>x.bars.length>0),'раскрой: '+n.map(x=>`${x.prof} — ${x.bars.length} хлыст(а)`).join(', '));}
// 4. весь код страницы с пустышками (ловит ReferenceError)
if(fs.existsSync(P+'/js/ui.js')){const mk=()=>{const U=new Proxy(function(){},{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>0;if(k===Symbol.iterator)return function*(){};if(k==='then')return undefined;return U;},apply:()=>U,construct:()=>U,set:()=>true});return U;};
 const U=mk(),c={THREE:U,document:U,window:{addEventListener:()=>{}},location:{hash:'',search:'',href:'http://x/'},addEventListener:()=>{},requestAnimationFrame:()=>{},ResizeObserver:U,MutationObserver:U,devicePixelRatio:1,performance:{now:()=>0},navigator:U,URLSearchParams,TextEncoder,TextDecoder,console,Math,JSON,Set,Map,Object,Array,Number,String,Symbol,setTimeout,clearTimeout,Blob:function(){},URL:U,atob:U,btoa:U,localStorage:{getItem:()=>null,setItem:()=>{}},prompt:()=>{},Response:U,CompressionStream:undefined,fetch:()=>({then:()=>({catch:()=>{}})})};
 vm.createContext(c);const src=['profiles','model','dims','view3d','edit','examples','ui','help'].filter(f=>fs.existsSync(P+'/js/'+f+'.js')).map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n');
 try{vm.runInContext(src,c,{filename:'all.js'});vm.runInContext(`M=normModel(${fs.readFileSync(P+'/examples/mk16-1sb.json','utf8')});renderAll();`,c);ok(true,'страница собирается');}catch(e){ok(false,'страница: '+e.message+' '+(e.stack.split('\n')[1]||''));}}
process.exit(fails?1:0);

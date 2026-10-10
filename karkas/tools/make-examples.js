// собирает примеры: навес 3×2 по текстовому описанию; пишет examples/*.json и js/examples.js. node tools/make-examples.js
const fs=require('fs'),vm=require('vm'),path=require('path');const P=path.join(__dirname,'..');
const c={console,Math,JSON,Set,Map,Object,Array,Number,String};vm.createContext(c);
vm.runInContext(['profiles','model'].map(f=>fs.readFileSync(P+'/js/'+f+'.js','utf8')).join('\n;\n'),c);
vm.runInContext(`M=emptyModel();M.meta.name='Навес 3×2 м';
M.meta.note='навес 3×2 м, столбы 60×60, высота 2100 спереди и 2394 сзади, фермы из 40×40, стыки под 45°, 2 одинаковые фермы, крыша — профнастил';
M.groups=[{id:'g1',name:'Ферма',qty:1,mirror:false},{id:'g2',name:'Обвязка и прогоны',qty:1,mirror:false}];
const W=3000,D=2000,HF=2100,HB=2394;
[30,W-30].forEach(x=>{const b0=addNode(x,0,30),b1=addNode(x,HB-20,30),f0=addNode(x,0,D-30),f1=addNode(x,HF-20,D-30);
  addMember(b0.id,b1.id,'60x60x2','g1');addMember(f0.id,f1.id,'60x60x2','g1');addMember(b1.id,f1.id,'40x40x1.5','g1');});
const top=z=>{const t=(z-30)/(D-60);return HB-20+(HF-HB)*t;};
// обвязка поверху между столбами (сзади и спереди)
[[30,HB-20],[D-30,HF-20]].forEach(([z,y])=>addMember(addNode(30,y,z).id,addNode(W-30,y,z).id,'40x40x1.5','g2'));
// прогоны на стропилах: 3 шт, лежат сверху, во всю ширину
[120,D/2,D-120].forEach(z=>{const y=Math.round(top(z)+40);addMember(addNode(0,y,z).id,addNode(W,y,z).id,'40x40x1.5','g2');});`,c);
const naves=JSON.parse(vm.runInContext('JSON.stringify(M)',c));
fs.writeFileSync(P+'/examples/naves-3x2.json',JSON.stringify(naves));
// ферма 4.1СБ из МК-16 (листы 18–19): столбы 60×60 2100 / 2394, рамка фермы 40×40 на склоне 8°, 3 распорки
vm.runInContext(`M=emptyModel();M.meta.name='Ферма 4.1СБ (МК-16)';M.meta.note='ферма под крышу: 2 шт, столбы 60×60, рамка 40×40 под 8°, распорки 150';
M.groups=[{id:'g1',name:'Ферма 4.1СБ',qty:2,mirror:false}];
const k=Math.tan(8*Math.PI/180),cs=Math.cos(8*Math.PI/180);
const p1=addNode(30,0,0),p2=addNode(30,2100,0),p3=addNode(2106,0,0),p4=addNode(2106,2394,0);
addMember(p1.id,p2.id,'60x60x2');addMember(p3.id,p4.id,'60x60x2');
const yL=x=>1879.74+20/cs+(x-60)*k,dU=190/cs;
const a=addNode(80,yL(80),0),b=addNode(2056,yL(2056),0),cc=addNode(2056,yL(2056)+dU,0),d=addNode(80,yL(80)+dU,0);
addMember(a.id,b.id,'40x40x1.5');addMember(b.id,cc.id,'40x40x1.5');addMember(cc.id,d.id,'40x40x1.5');addMember(d.id,a.id,'40x40x1.5');
// распорки 4.1.3: перпендикулярно поясам, между гранями поясов 150; от внутренней грани стойки 487, затем 431 и 467
const ux=b.x-a.x,uy=b.y-a.y,ul=Math.hypot(ux,uy),dx=ux/ul,dy=uy/ul,nx=-dy,ny=dx,dist=(P,Q,R)=>Math.abs((R.x-P.x)*(Q.y-P.y)-(R.y-P.y)*(Q.x-P.x))/Math.hypot(Q.x-P.x,Q.y-P.y);
const best=(tx,ty,P,Q)=>{let bb=null,bd=9;for(let x=Math.round(tx)-6;x<=Math.round(tx)+6;x++)for(let y=Math.round(ty)-6;y<=Math.round(ty)+6;y++){const e=dist(P,Q,{x,y})+Math.hypot(x-tx,y-ty)*.02;if(e<bd){bd=e;bb={x,y};}}return bb;};
// целые мм на склоне 8°: перебираем пары узлов на осях поясов, чтобы распорка вышла перпендикулярной
const near=(tx,ty,P,Q)=>{const r=[];for(let x=Math.round(tx)-8;x<=Math.round(tx)+8;x++)for(let y=Math.round(ty)-8;y<=Math.round(ty)+8;y++)if(dist(P,Q,{x,y})<.35)r.push({x,y});return r;};
const t0=(100-a.x)/dx;[507,978,1485].forEach(s=>{const t=t0+s;let L=null,U=null,be=1e9;
  near(a.x+dx*t,a.y+dy*t,a,b).forEach(l=>near(l.x+nx*190.1,l.y+ny*190.1,d,cc).forEach(u=>{const e=Math.abs((u.x-l.x)*dx+(u.y-l.y)*dy)+Math.abs((l.x-a.x)*dx+(l.y-a.y)*dy-t)*.01;if(e<be){be=e;L=l;U=u;}}));
  const n1=addNode(L.x,L.y,0),n2=addNode(U.x,U.y,0);addMember(n1.id,n2.id,'40x40x1.5');});
M.members.forEach(m=>m.grp='g1');`,c);
const ferma=JSON.parse(vm.runInContext('JSON.stringify(M)',c));
fs.writeFileSync(P+'/examples/mk16-ferma.json',JSON.stringify(ferma));
const ex={'mk16-1sb':JSON.parse(fs.readFileSync(P+'/examples/mk16-1sb.json','utf8')),'mk16-ferma':ferma,'naves-3x2':naves};
fs.writeFileSync(P+'/js/examples.js','/* примеры моделей (собраны tools/make-examples.js из examples/*.json) */\nconst EXAMPLES='+JSON.stringify(ex)+';\n');
vm.runInContext('console.log(positions().map(p=>`${p.no} ${p.prof} L${p.L} ${p.ang.join("/")}° ×${p.total}`).join(" | "))',c);

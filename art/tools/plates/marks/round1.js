// правки Виталия по пометкам (01-спереди, 04-сверху, 06-нос) → Доберман 8
const fs=require('fs'),{E:E0,g}=require('./base.js'),solve=require('./solve.js')(g),V3=g('V3');
const only=(process.argv[2]||'bridge,brow,under,crown').split(',');
let E={V:E0.V.map(p=>p.slice()),P:E0.P.map(Q=>Q.slice()),S:E0.S.map(s=>s.slice())};const pins=new Map(),log=[];
const sameQ=(Q,R)=>Q.length===R.length&&Q.every((v,k)=>v===R[k]);const idxOf=R=>E.P.findIndex(Q=>sameQ(Q,R));
if(only.includes('bridge')){// спинка носа: шов 114–0 поперёк; асимметричные швы 0–2 и 0–5 убрать; угол 114 (и 0) — на излом нарисованной линии
  const rm=[[0,1,2],[3,4,0,5],[95,114,5,0,2]].map(idxOf);if(rm.some(i=>i<0))throw 'нос: грани не те';rm.sort((a,b)=>b-a).forEach(i=>E.P.splice(i,1));
  E.P.push([95,114,0,1,2],[3,4,0,114,5]);
  // ребро 0–106 (и 113–114) длиной 2,5 мм — одна точка: после сдвига угла иначе плита перекручивается
  if(!process.env.KEEP106)[[106,0],[113,114]].forEach(([x,y])=>{E.P=E.P.map(Q=>Q.map(i=>i===x?y:i).filter((v,k,a)=>v!==a[(k+1)%a.length]));E.S=E.S.map(e=>e.map(i=>i===x?y:i));});const B=[-18.25,248.75,341.6];pins.set(114,B);if(!process.env.FREE5)pins.set(5,E.V[5].slice());if(!process.env.FREE86)pins.set(86,E.V[86].slice());log.push('спинка: шов поперёк, угол 114 → '+B);}
if(only.includes('brow')){// лоб: шов 94–93–92 ниже, на светлую линию
  const r0=[-47.8,347.8,233.5],a=E.V[93],b=E.V[94],ab=V3.sub(b,a),t=V3.dot(V3.sub(r0,a),ab)/V3.dot(ab,ab),d=V3.sub(r0,V3.add(a,V3.mul(ab,t)));
  if(!process.env.FREE94)pins.set(94,V3.add(E.V[94],d));pins.set(93,[-30.0,347.7,235.0]);pins.set(92,[0,308.6,255.3]);log.push('лоб: 94 сдвиг '+V3.len(d).toFixed(1)+' мм, 93 и 92 — на линию');}
if(only.includes('crown')){// макушка: 6 плит между ушами — одна
  const grp=[[47,48,49,50],[51,52,48,47],[64,65,66,59,58],[58,63,67,68,64],[64,47,50,69,65],[64,68,70,51,47]];const ids=grp.map(idxOf);if(ids.some(i=>i<0))throw 'макушка: грани не те';
  let cur=grp[2],rest=grp.filter((_,k)=>k!==2);for(let n=0;n<10&&rest.length;n++){rest=rest.filter(R=>{const L=g('mergeTwo')([cur,R],0,1);if(L){cur=L;return false;}return true;});}
  if(rest.length)throw 'макушка: не слилось';ids.sort((a,b)=>b-a).forEach(i=>E.P.splice(i,1));E.P.push(cur);log.push('макушка: '+cur.length+' углов');}
if(only.includes('under')){// низ носа: новый шов от 86 до середины ребра 3–80 (зеркально — от 87)
  const A=[0,190.9,374.2],r=g('addEdgePoint')(E,3,80,A,true);E=r.E;const pi=E.P.findIndex(Q=>Q.includes(86)&&Q.includes(r.m));const c=g('cutPoly')(E,pi,86,r.m,true);if(!c)throw 'низ носа: не разрезалось';E=c;log.push('низ носа: шов 86–'+r.m+' (и зеркальный)');}
// низ носа: плоскости половинок — по нормали эталона (излом ~9°), через их центр
const fix=new Map();if(only.includes('under')&&!process.env.NOFIX){const {fromPage}=require('./base.js'),K=require('C:/dev/metal-designer/art/tools/plates/creases.js')('doberman7'),am=E.V.findIndex(p=>Math.abs(p[0])<.1&&Math.abs(p[1]-190.9)<.5&&Math.abs(p[2]-374.2)<.6);
  E.P.forEach((Q,k)=>{if(!Q.includes(am))return;const c=g('polyC')(E.V,Q),n0=g('polyNorm')(E.V,Q),rn=Q.map(i=>K.nearN(fromPage(V3.add(V3.mul(E.V[i],.4),V3.mul(c,.6))),4)).filter(x=>x);let n=V3.norm(rn.reduce((a,x)=>V3.add(a,x),[0,0,0]));if(V3.dot(n,n0)<0)n=V3.mul(n,-1);fix.set(k,{n,d:V3.dot(n,c)});});log.push('низ носа: плоскости по эталону у '+fix.size+' граней');}
if(process.env.PINTIP)[3,4,5].forEach(i=>pins.set(i,E0.V[i].slice()));
// цели — на поверхность эталона: сдвиг вдоль средней нормали плит точки, где ближе всего к эталону
if(!process.env.NOPROJ){const {fromPage}=require('./base.js'),K=require('C:/dev/metal-designer/art/tools/plates/creases.js')('doberman7');
  pins.forEach((q,i)=>{const n=V3.norm(E.P.filter(Q=>Q.includes(i)).reduce((a,Q)=>V3.add(a,g('polyNorm')(E.V,Q)),[0,0,0]));let bt=0,bd=1e9;for(let t=-8;t<=8;t+=.25){const d=K.surfD(fromPage(V3.add(q,V3.mul(n,t))));if(d<bd){bd=d;bt=t;}}
    const p=V3.add(q,V3.mul(n,bt));if(Math.abs(q[0])<.01)p[0]=0;pins.set(i,p);log.push('  цель '+i+' на эталон: '+bt.toFixed(2)+' мм (остаток '+bd.toFixed(1)+')');});}
const np0=g('nonPlanar')(E,.5).length;
const R=solve(E,pins,{lmin:+(process.env.LMIN||1e-5),it:+(process.env.IT||800),lam:+(process.env.LAM||.05),fix});const out=g('compact')(R);
const mv=R.V.map((p,i)=>i<E0.V.length?[i,V3.len(V3.sub(p,E0.V[i]))]:[i,0]).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]);
console.log(log.join('\n'));console.log('до выравнивания неплоских >0.5:',np0,'→ после: ',g('nonPlanar')(R,.5).length,'макс неплоскость',Math.max(...R.P.map(Q=>g('polyDev')(R.V,Q))).toFixed(2));
console.log('самопересечения',JSON.stringify(g('selfXPolys')(E0)),'→',JSON.stringify(g('selfXPolys')(R)));
console.log('сдвинуто >1 мм:',mv.length,'(закреплённые '+[...pins.keys()].join(',')+'):',mv.slice(0,16).map(([i,d])=>i+':'+d.toFixed(1)).join(' '));
console.log('граней',E0.P.length,'→',out.P.length,'точек',out.V.length);
fs.writeFileSync('d8.json',JSON.stringify({type:'md-art',v:1,name:'Доберман 8',ref:'doberman7',frame:[[-145.5,0,0],[145.5,600,395]],V:out.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:out.P,S:out.S}));
if(process.env.EVAL){const {fromPage}=require('./base.js'),K=require('C:/dev/metal-designer/art/tools/plates/creases.js')('doberman7');
  const ids=mv.map(x=>x[0]),sd=V=>ids.map(i=>K.surfD(fromPage(V[i]))).filter(x=>x<99),av=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);
  console.log('сдвинутые точки от поверхности эталона: ср',av(sd(E0.V)),'→',av(sd(R.V)),' макс',Math.max(...sd(E0.V)).toFixed(1),'→',Math.max(...sd(R.V)).toFixed(1));
  K.show('сверка до',K.poly(E0.V.map(fromPage),E0.P));K.show('сверка после',K.poly(out.V.map(fromPage),out.P));}
if(process.env.EVAL){const {fromPage}=require('./base.js'),K=require('C:/dev/metal-designer/art/tools/plates/creases.js')('doberman7');
  console.log('кончик носа и соседи (до → после, мм от эталона):',[3,4,86,0,106,92,94].map(i=>i+': '+K.surfD(fromPage(E0.V[i])).toFixed(1)+'→'+K.surfD(fromPage(R.V[i])).toFixed(1)).join('  '));}
if(process.env.EVAL){const r0=[-47.8,347.8,233.5],a=R.V[93],b=R.V[94],ab=V3.sub(b,a),t=V3.dot(V3.sub(r0,a),ab)/V3.dot(ab,ab);console.log('лоб: шов 93–94 от красной линии у x=-47.8:',V3.len(V3.sub(r0,V3.add(a,V3.mul(ab,t)))).toFixed(1),'мм; v94',R.V[94].map(x=>x.toFixed(1)).join(','));}

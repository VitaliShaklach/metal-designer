// Доберман 9 → Доберман 10: лишние швы, второй круг (28.10 Виталий: слить 2, 6, 7, 8; оставить 1, 3, 4, 5 — уже гнутся, излом 5–11°)
// node art/tools/plates/marks/round3.js → out/d10.json, затем: node art/tools/plates/fromjson.js doberman10 art/tools/plates/out/d10.json "Доберман 10"
const fs=require('fs'),path=require('path'),{g}=require('./base.js'),C=require('../clean.js')(g);
const E9=g("modelPoly('doberman9')");
// места из списка check.js (грани Д9; номера деталей — как на сайте у Д9); зеркальная пара сливается сама, №8 — зеркало №7
// порядок важен: №6 раньше №2 — и №2 уже не найти (22 и 22.1 станут одной плитой)
const SEAMS=[[7,[104,106],'щека 35.1–28.1 (и 35–28)'],[2,[24,26],'темя 27.1–22.1 (и 27–22)'],[6,[26,27],'лоб 22–22.1']];
let E={...E9,S:E9.S||[]};const key=E9.P.map(Q=>Q.slice()),log=[];
const find=Q=>{let bi=-1,bn=0;E.P.forEach((R,i)=>{const n=R.filter(x=>Q.includes(x)).length;if(n>bn){bn=n;bi=i;}});return bi;};
SEAMS.forEach(([k,[a,b],at])=>{const fa=find(key[a]),fb=find(key[b]);if(fa===fb){log.push('№'+k+': уже одна плита');return;}
  const r=C.mergeSeam(E,fa,fb,{keep:true});if(r.why)throw '№'+k+': '+r.why;E=r.E;log.push('шов №'+k+' ('+at+') убран (×'+r.n+'), сдвиг до '+r.moved.toFixed(1)+' мм');});
// после щёк новая плита 35+28 ложится в плоскость с 26 (излом 6,7° → 0,2°, у эталона он есть) — выровнять заново, 26 и 26.1 держат плоскость Д9
const same=(Q,R)=>Q.length===R.length&&Q.every((v,k)=>v===R[k]),V3=g('V3'),fix=new Map();
[100,101].forEach(i=>{const f=E.P.findIndex(Q=>same(Q,E9.P[i]));if(f<0)throw 'грань '+i+' (№26) не найдена';fix.set(f,{n:g('polyNorm')(E9.V,E9.P[i])});});
E=C.solve(E,new Map(),{fix,anchor:E9.V,it:600});log.push('выровнено заново, №26 и 26.1 — в плоскости Д9; сдвиг точек до '+Math.max(...E.V.map((v,i)=>V3.len(V3.sub(v,E9.V[i])))).toFixed(1)+' мм');
const c2=C.collapseShort(g('compact')(E));c2.log.filter(x=>x.done).forEach(x=>log.push('короткое ребро после слияний '+x.L.toFixed(1)+' мм @'+x.at));
const out=c2.E,st=C.stats(out),st9=C.stats(E9);console.log(log.join('\n'));
console.log('граней',E9.P.length,'→',out.P.length,'точек',E9.V.length,'→',out.V.length,'неплоскость',st.dev.toFixed(3),'самопересечений',st.sx,'(у Д9',st9.sx+')','узких плит',st.nar);
const F=path.join(__dirname,'../out/d10.json');
fs.writeFileSync(F,JSON.stringify({type:'md-art',v:1,name:'Доберман 10',ref:'doberman7',frame:[[-145.5,0,0],[145.5,600,395]],V:out.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:out.P,S:out.S}));console.log('→',F);

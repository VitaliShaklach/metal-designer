// Доберман 8 → Доберман 9: короткие рёбра в точку (clean.js), лишние швы по решению Виталия (26.10: все, кроме №2 — щека 94–73)
// node art/tools/plates/marks/round2.js → d9.json, затем: node art/tools/plates/fromjson.js doberman9 d9.json "Доберман 9"
const fs=require('fs'),{g}=require('./base.js'),C=require('../clean.js')(g);
const E8=g("modelPoly('doberman8')");
// места из списка check.js (грани Д8; номера деталей — как на сайте у Д8); зеркальная пара сливается сама
const SEAMS={1:[116,122],3:[87,135],4:[17,45],5:[58,66],6:[10,14],7:[113,135],8:[76,90],9:[54,64],10:[102,108]};   // №2 [98,118] — нет
const c1=C.collapseShort(E8),log=c1.log.map(x=>(x.done?'короткое ребро ':'пропущено ')+x.L.toFixed(1)+' мм @'+x.at+(x.done?'':' — '+x.why));
let E={...c1.E,S:c1.E.S||[]};const key=c1.I.map(()=>null);c1.I.forEach((f8,k)=>key[f8]=E.P[k].slice());
const find=Q=>{let bi=-1,bn=0;E.P.forEach((R,i)=>{const n=R.filter(x=>Q.includes(x)).length;if(n>bn){bn=n;bi=i;}});return bi;};
Object.entries(SEAMS).forEach(([k,[a,b]])=>{const fa=find(key[a]),fb=find(key[b]);if(fa===fb){log.push('№'+k+': уже одна плита');return;}
  const r=C.mergeSeam(E,fa,fb,{keep:true});if(r.why)throw '№'+k+': '+r.why;E=r.E;log.push('шов №'+k+' убран (×'+r.n+'), сдвиг до '+r.moved.toFixed(1)+' мм');});
const c2=C.collapseShort(g('compact')(E));c2.log.filter(x=>x.done).forEach(x=>log.push('короткое ребро после слияний '+x.L.toFixed(1)+' мм @'+x.at));
const out=c2.E,st=C.stats(out);console.log(log.join('\n'));console.log('граней',E8.P.length,'→',out.P.length,'точек',E8.V.length,'→',out.V.length,'неплоскость',st.dev.toFixed(3),'самопересечений',st.sx,'узких плит',st.nar);
fs.writeFileSync('d9.json',JSON.stringify({type:'md-art',v:1,name:'Доберман 9',ref:'doberman7',frame:[[-145.5,0,0],[145.5,600,395]],V:out.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:out.P,S:out.S}));

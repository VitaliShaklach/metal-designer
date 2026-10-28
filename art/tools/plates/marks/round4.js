// Доберман 10 → Доберман 11: плоский шов 31–30 (и 31.1–30.1) — 180°, излом 0,26° (28.10 Виталий: «зачем внутри что-то варить?»)
// заодно уходит плита-«бантик» 31: её вывернутый палец лежал поверх 30 (BACKLOG № 17)
// node art/tools/plates/marks/round4.js → out/d11.json, затем: node art/tools/plates/fromjson.js doberman11 art/tools/plates/out/d11.json "Доберман 11"
// 24–24.1 (178°) не сливаем: точки уходят до 1,5 мм, изломы 8 соседних швов меняются до 1,4°, появляется новый «бантик» 37
const fs=require('fs'),path=require('path'),{g}=require('./base.js'),C=require('../clean.js')(g);
const E10=g("modelPoly('doberman10')");
// грани Д10: 33 — деталь 30, 53 — деталь 31; зеркальная пара сливается сама
const F30=33,F31=53;
const r=C.mergeSeam({...E10,S:E10.S||[]},F30,F31,{keep:true});if(r.why)throw '30+31: '+r.why;
const c2=C.collapseShort(g('compact')(r.E)),log=['шов 31–30 (и 31.1–30.1) убран (×'+r.n+'), сдвиг до '+r.moved.toFixed(2)+' мм'];
c2.log.filter(x=>x.done).forEach(x=>log.push('короткое ребро после слияния '+x.L.toFixed(1)+' мм @'+x.at));
const out=c2.E,st=C.stats(out),st10=C.stats(E10);console.log(log.join('\n'));
console.log('граней',E10.P.length,'→',out.P.length,'точек',E10.V.length,'→',out.V.length,'неплоскость',st.dev.toFixed(3),'самопересечений',st.sx,'(у Д10',st10.sx+')','узких плит',st.nar);
const F=path.join(__dirname,'../out/d11.json');
fs.writeFileSync(F,JSON.stringify({type:'md-art',v:1,name:'Доберман 11',ref:'doberman7',frame:[[-145.5,0,0],[145.5,600,395]],V:out.V.map(p=>p.map(x=>Math.round(x*100)/100)),P:out.P,S:out.S}));console.log('→',F);

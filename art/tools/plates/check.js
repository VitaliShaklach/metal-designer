// проверка готовой фигуры из models-poly.js так, как её увидит сайт: детали, дыры, узкие, развалившиеся грани
// node art/tools/plates/check.js [doberman7] [грань…]
const fs=require('fs'),path=require('path'),vm=require('vm'),JS=path.join(__dirname,'../../js/');
const c={console,Math};vm.createContext(c);vm.runInContext(['mesh','edit','models','models-poly','figures','prod'].map(f=>fs.readFileSync(JS+f+'.js','utf8')).join('\n;\n'),c);
const g=n=>vm.runInContext(n,c),V3=g('V3'),triN=g('triN');
const id=process.argv[2]||'doberman7',B=g('figureMesh')(id),R=g('buildParts')(B,1.5,1.5);
console.log('граней',B.P.length,'деталей',R.parts.length,'неплоских',g('nonPlanar')({V:B.V,P:B.P},1).length);
const per=new Map();B.T.forEach((pi,t)=>{(per.get(pi)||per.set(pi,new Set()).get(pi)).add(R.partOf[t]);});
const split=[...per].filter(([,s])=>s.size>1);console.log('граней на нескольких деталях:',split.length,split.slice(0,12).map(([pi,s])=>pi+':'+B.P[pi].length+'уг/'+s.size).join(' '));
// открытые края — петли
const E=new Set();B.P.forEach(Q=>Q.forEach((a,k)=>E.add(a+'_'+Q[(k+1)%Q.length])));const nx=new Map();B.P.forEach(Q=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length];if(!E.has(b+'_'+a))nx.set(a,b);}));
const used=new Set(),loops=[];nx.forEach((_,s)=>{if(used.has(s))return;const L=[];let v=s;while(v!==undefined&&!used.has(v)){used.add(v);L.push(v);v=nx.get(v);}loops.push(L);});
console.log('открытые петли:',loops.map(L=>L.length+'@'+V3.mul(L.reduce((s,i)=>V3.add(s,B.V[i]),[0,0,0]),1/L.length).map(Math.round).join(',')).join(' | '));
console.log('узкие детали:',R.parts.filter(p=>p.minW<15).length);
process.argv.slice(3).map(Number).forEach(pi=>{const Q=B.P[pi];console.log('грань',pi,'углы',Q.map(i=>B.V[i].map(x=>x.toFixed(1)).join(',')).join(' ; '));
  B.F.forEach((f,t)=>{if(B.T[t]!==pi)return;const n=triN(B.V,f);console.log('   треуг',f.join(','),'S',(V3.len(n)/2).toFixed(1),'n',V3.norm(n).map(x=>x.toFixed(2)).join(','),'деталь',R.partOf[t]);});});

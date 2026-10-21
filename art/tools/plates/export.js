// экспорт в сайт: out/plates.json → art/js/models-poly.js (MODELS_POLY.<id> = {V: мм×10, P: углы через -1})
// node art/tools/plates/export.js [id=doberman7]
const fs=require('fs'),path=require('path'),vm=require('vm');
const D=__dirname,JS=path.join(D,'../../js/'),O=f=>path.join(D,'out',f),id=process.argv[2]||'doberman7';
const c={Math};vm.createContext(c);vm.runInContext(fs.readFileSync(JS+'mesh.js','utf8')+';'+fs.readFileSync(JS+'edit.js','utf8'),c);const g=n=>vm.runInContext(n,c),V3=g('V3');
// многогранник: лишние точки выкинуть, грани — наружу
const PL=JSON.parse(fs.readFileSync(O('plates.json'),'utf8'));c.E0={V:PL.V,P:PL.P};const E=g('compact(E0)');
const b=g('meshBox')(E.V),ctr=[(b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2];const P=g('orientPolys')(E.V,E.P,ctr);
const r10=x=>Math.round(x*10);
const poly={V:[].concat(...E.V.map(p=>p.map(r10))),P:[].concat(...P.map(Q=>[...Q,-1]))};
// файл моделей-многогранников: читаем, что уже есть, и заменяем/добавляем эту
const MF=JS+'models-poly.js';let all={};if(fs.existsSync(MF)){const cx={};vm.createContext(cx);vm.runInContext(fs.readFileSync(MF,'utf8')+';this.M=MODELS_POLY;',cx);all=cx.M;}
all[id]=poly;
fs.writeFileSync(MF,'/* модели из плит-многоугольников (сгенерировано art/tools/plates/export.js): V — мм×10, P — углы граней, -1 — конец грани */\nconst MODELS_POLY={'
  +Object.entries(all).map(([k,m])=>k+':{V:['+m.V.join(',')+'],P:['+m.P.join(',')+']}').join(',\n')+'};\n'
  +'function modelPoly(id){const m=MODELS_POLY[id],V=[],P=[];let Q=[];for(let i=0;i<m.V.length;i+=3)V.push([m.V[i]/10,m.V[i+1]/10,m.V[i+2]/10]);m.P.forEach(x=>{if(x<0){P.push(Q);Q=[];}else Q.push(x);});return polyBase(V,P);}\n');
console.log(id+': точек',E.V.length,'граней',P.length,'→',path.relative(process.cwd(),MF),Math.round(fs.statSync(MF).size/1024)+' КБ');
// калька эталона для редактора — отдельно: node art/tools/plates/tracing.js

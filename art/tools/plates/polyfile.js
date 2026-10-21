// файл art/js/models-poly.js: прочитать все модели, заменить/добавить одну, записать
// модель: V — мм×10 подряд, P — углы граней, -1 — конец грани, S — швы, проведённые руками (пары точек подряд), если есть
const fs=require('fs'),path=require('path'),vm=require('vm'),MF=path.join(__dirname,'../../js/models-poly.js');
function putPoly(id,m){let all={};if(fs.existsSync(MF)){const cx={};vm.createContext(cx);vm.runInContext(fs.readFileSync(MF,'utf8')+';this.M=MODELS_POLY;',cx);all=cx.M;}
  all[id]=m;
  fs.writeFileSync(MF,'/* модели из плит-многоугольников (сгенерировано art/tools/plates/export.js и fromjson.js): V — мм×10, P — углы граней, -1 — конец грани, S — швы, проведённые руками (пары точек) */\nconst MODELS_POLY={'
    +Object.entries(all).map(([k,m])=>k+':{V:['+m.V.join(',')+'],P:['+m.P.join(',')+']'+(m.S&&m.S.length?',S:['+m.S.join(',')+']':'')+'}').join(',\n')+'};\n'
    +'function modelPoly(id){const m=MODELS_POLY[id],V=[],P=[],S=[];let Q=[];for(let i=0;i<m.V.length;i+=3)V.push([m.V[i]/10,m.V[i+1]/10,m.V[i+2]/10]);m.P.forEach(x=>{if(x<0){P.push(Q);Q=[];}else Q.push(x);});\n'
    +'  if(m.S)for(let i=0;i<m.S.length;i+=2)S.push([m.S[i],m.S[i+1]]);return polyBase(V,P,S);}\n');
  return MF;}
module.exports={putPoly,MF};

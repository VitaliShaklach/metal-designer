// экспорт в сайт: out/plates.json → art/js/models-poly.js (MODELS_POLY.<id> = {V: мм×10, P: углы через -1})
// и швы эталона → art/js/ref-<id>.js (REFS.<id> = точки мм×10, грузится в редакторе по галочке)
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
// швы эталона: центры «шовных» треугольников исходной модели в тех же мм, на 3 мм наружу, по одной точке на клетку 4 мм
const M=JSON.parse(fs.readFileSync(O('mesh.json'),'utf8')),TX=JSON.parse(fs.readFileSync(O('tex.json'),'utf8'));
c.M0={V:M.V,F:M.F};const Mf=g(`(b=>fitMesh(M0,{W:b.size[0]*600/b.size[1],H:600,D:b.size[2]*600/b.size[1]}))(meshBox(M0.V))`);
const seen=new Set(),pts=[];Mf.F.forEach((f,t)=>{const x=TX[t];if(!(x[0]>185||x[1]<45))return;const a=Mf.V[f[0]],bb=Mf.V[f[1]],cc=Mf.V[f[2]],n=V3.norm(g('triN')(Mf.V,f));
  const p=V3.add(V3.mul(V3.add(V3.add(a,bb),cc),1/3),V3.mul(n,3)),k=p.map(v=>Math.floor(v/4)).join();if(seen.has(k))return;seen.add(k);pts.push(...p.map(r10));});
const RF=JS+'ref-'+id+'.js';fs.writeFileSync(RF,'/* швы эталона для редактора (сгенерировано art/tools/plates/export.js): точки мм×10 */\nvar REFS=window.REFS||{};window.REFS=REFS;REFS.'+id+'=['+pts.join(',')+'];\n');
console.log('швы эталона: точек',pts.length/3,'→',path.relative(process.cwd(),RF),Math.round(fs.statSync(RF).size/1024)+' КБ');

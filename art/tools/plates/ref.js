// сверка: эталон (модель Meshy с текстурой) и наш многогранник с одних ракурсов → out/cmp_<вид>.png
const fs=require('fs'),path=require('path'),{render}=require('./rend.js'),{hcat}=require('./png.js'),O=f=>path.join(__dirname,'out',f);
const M=JSON.parse(fs.readFileSync(O('mesh.json'),'utf8')),PL=JSON.parse(fs.readFileSync(O(process.argv[2]||'plates.json'),'utf8'));
// эталон — в тех же мм, что и многогранник (по высоте 600, x по центру, z от стены)
const b=(()=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];M.V.forEach(p=>{for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],p[i]);mx[i]=Math.max(mx[i],p[i]);}});return {mn,mx};})(),k=600/(b.mx[1]-b.mn[1]),cx=(b.mn[0]+b.mx[0])/2;
const VR=M.V.map(p=>[(p[0]-cx)*k,(p[1]-b.mn[1])*k,(p[2]-b.mn[2])*k]);
const vm=require('vm'),c={Math};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js/mesh.js'),'utf8'),c);const earClip=vm.runInContext('earClip',c);
const T=[],TG=[];PL.P.forEach((Q,i)=>earClip(PL.V,Q).forEach(t=>{T.push(t);TG.push(i);}));
for(const v of ['front','side','iso','bottom']){render(O('r_'+v+'.png'),VR,M.F,i=>M.C[i],v,{S:600});render(O('p_'+v+'.png'),PL.V,T,()=>[175,165,155],v,{S:600,shade:true,group:i=>TG[i]});hcat(O('cmp_'+v+'.png'),[O('r_'+v+'.png'),O('p_'+v+'.png')]);}
console.log('готово: out/cmp_front|side|iso|bottom.png');

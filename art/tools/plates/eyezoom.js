// крупно: грани у правого глаза (спереди), с номерами углов
const fs=require('fs'),path=require('path'),{render}=require('./rend.js'),O=f=>path.join(__dirname,'out',f);
const PL=JSON.parse(fs.readFileSync(O('plates.json'),'utf8'));const vm=require('vm'),c={Math};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js/mesh.js'),'utf8'),c);const earClip=vm.runInContext('earClip',c);
const C=[+process.argv[2]||65,+process.argv[3]||285],R=+process.argv[4]||60;
const keep=PL.P.map((Q,i)=>i).filter(i=>PL.P[i].some(q=>Math.hypot(PL.V[q][0]-C[0],PL.V[q][1]-C[1])<R&&PL.V[q][2]>150));
const T=[],TG=[];keep.forEach(i=>earClip(PL.V,PL.P[i]).forEach(t=>{T.push(t);TG.push(i);}));
const rnd=i=>{let x=Math.sin(i*12.9898+1)*43758.5453;x-=Math.floor(x);return x;};
render(O('eye.png'),PL.V,T,i=>[80+rnd(TG[i])*160|0,80+rnd(TG[i]+.3)*160|0,80+rnd(TG[i]+.6)*160|0],'front',{S:700,group:i=>TG[i]});console.log(keep.length,'граней');

// правленая фигура из редактора (файл «Сохранить» .json) → встроенная фигура сайта с калькой эталона
// node art/tools/plates/fromjson.js <id> <файл.json> "<Название>"   — например: doberman8 Доберман7-правка.json "Доберман 8"
// швы, проведённые руками (S), сохраняются; калька — та же, что у исходной фигуры (ref из файла)
const fs=require('fs'),path=require('path'),{putPoly}=require('./polyfile.js'),ART=path.join(__dirname,'../..');
const [id,file,name]=process.argv.slice(2);
if(!id||!/^[a-z][a-z0-9]*$/.test(id)||!file||!name){console.log('нужно: node art/tools/plates/fromjson.js <id латиницей> <файл.json> "<Название>"');process.exit(1);}
const j=JSON.parse(fs.readFileSync(file,'utf8'));if(!j.P||!j.V)throw new Error('в файле нет граней-многоугольников (P) — это не фигура из плит');
const r10=x=>Math.round(x*10),S=(j.S||[]).flat();
putPoly(id,{V:[].concat(...j.V.map(p=>p.map(r10))),P:[].concat(...j.P.map(Q=>[...Q,-1])),S});
console.log(id+': точек',j.V.length,'граней',j.P.length,'ручных швов',S.length/2,j.ref?'калька '+j.ref:'без кальки');
const FG=path.join(ART,'js/figures.js'),IX=path.join(ART,'index.html');let fg=fs.readFileSync(FG,'utf8'),ix=fs.readFileSync(IX,'utf8');
// рамка кальки — габарит эталона в координатах файла: без неё калька подгонялась бы по габариту правленой фигуры и съезжала
const fr=j.ref&&j.frame?`,frame:${JSON.stringify(j.frame)}`:'',line=`FIGURES.${id}={name:'${name.replace(/'/g,"\'")}',H:600,poly:true,build:()=>modelPoly('${id}')${j.ref?`,ref:'${j.ref}'`:''}${fr}};`;
if(!fg.includes('FIGURES.'+id+'=')){fg=fg.replace(/\s*$/,'\n')+`// ${name} — правка в редакторе (${path.basename(file)}), art/tools/plates/fromjson.js\n${line}\n`;fs.writeFileSync(FG,fg);console.log('+ figures.js:',id);}
else{fg=fg.replace(new RegExp('FIGURES\\.'+id+'=.*'),()=>line);fs.writeFileSync(FG,fg);console.log('~ figures.js:',id,fr?'(рамка кальки)':'');}
if(!ix.includes(`<option value="${id}">`)){const k=ix.indexOf('</select>',ix.indexOf('id="figSel"'));ix=ix.slice(0,k)+`<option value="${id}">${name}</option>`+ix.slice(k);fs.writeFileSync(IX,ix);console.log('+ index.html: пункт «'+name+'»');}

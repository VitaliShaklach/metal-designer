// новое изделие одной командой: модель Meshy с текстурой (OBJ + PNG) → плиты → фигура на сайте с калькой
// node art/tools/plates/make.js <id> <модель.obj> "<Название>" [текстура.png] [параметры plates.js: seam=185 ang=4 …]
// id — латиницей (bull1), он же имя в адресе #f=<id>. Исходник копируется в src/ (в репозиторий не идёт).
// шаги: prep → plates → export → tracing → регистрация в figures.js и index.html → check → ref (картинки сверки в out/)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const D=__dirname,ART=path.join(D,'../..'),SRC=path.join(D,'src');
const [id,obj,name,...rest]=process.argv.slice(2);
if(!id||!/^[a-z][a-z0-9]*$/.test(id)||!obj||!name){console.log('нужно: node art/tools/plates/make.js <id латиницей> <модель.obj> "<Название>" [текстура.png] [seam=… ang=…]');process.exit(1);}
const png0=rest[0]&&/\.png$/i.test(rest[0])?rest.shift():null,args=rest.filter(a=>/^[a-z]+=[-\d.e]+$/.test(a));
// текстура: указана, или рядом с тем же именем, или из .mtl (map_Kd)
let png=png0||obj.replace(/\.obj$/i,'.png');
if(!fs.existsSync(png)){const mtl=obj.replace(/\.obj$/i,'.mtl');const m=fs.existsSync(mtl)&&/map_Kd\s+(.+)/.exec(fs.readFileSync(mtl,'utf8'));png=m?path.join(path.dirname(obj),m[1].trim()):'';}
if(!fs.existsSync(obj)||!png||!fs.existsSync(png)){console.log('не нашёл',fs.existsSync(obj)?'текстуру (PNG) — укажите её 4-м аргументом':'модель '+obj);process.exit(1);}
fs.mkdirSync(SRC,{recursive:true});const so=path.join(SRC,id+'.obj'),sp=path.join(SRC,id+'.png');
if(path.resolve(obj)!==so)fs.copyFileSync(obj,so);if(path.resolve(png)!==sp)fs.copyFileSync(png,sp);
const run=(f,...a)=>{console.log('\n▶',f,a.join(' '));execFileSync(process.execPath,['--max-old-space-size=6000',path.join(D,f),...a],{stdio:'inherit',cwd:path.join(ART,'..')});};
run('prep.js',so,sp);run('plates.js',...args);run('export.js',id);run('tracing.js',id,so);
// регистрация на сайте (если ещё нет)
const FG=path.join(ART,'js/figures.js'),IX=path.join(ART,'index.html');let fg=fs.readFileSync(FG,'utf8'),ix=fs.readFileSync(IX,'utf8');
if(!fg.includes('FIGURES.'+id+'=')){fg=fg.replace(/\s*$/,'\n')+`// ${name} — плиты сняты с модели Meshy с текстурой (art/tools/plates/make.js)\nFIGURES.${id}={name:'${name.replace(/'/g,"\\'")}',H:600,poly:true,build:()=>modelPoly('${id}'),ref:'${id}'};\n`;fs.writeFileSync(FG,fg);console.log('\n+ figures.js:',id);}
if(!ix.includes(`<option value="${id}">`)){const k=ix.indexOf('</select>',ix.indexOf('id="figSel"'));ix=ix.slice(0,k)+`<option value="${id}">${name}</option>`+ix.slice(k);fs.writeFileSync(IX,ix);console.log('+ index.html: пункт «'+name+'»');}
run('check.js',id);run('ref.js');
console.log(`\nготово: «${name}» — откройте art/index.html#f=${id}&edit&trace; картинки сверки «эталон | наша» — art/tools/plates/out/cmp_*.png`);

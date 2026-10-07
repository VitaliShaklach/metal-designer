// DXF боковины жаровни из той же функции grillWall, что строит 3D. node dxf_side.js back|front [flags-json]
const fs=require('fs'),vm=require('vm'),path=require('path');
const P=require('path').join(__dirname,'..');
const back=(process.argv[2]||'back')==='back',flags=JSON.parse(process.argv[3]||'{}');
let shape=null;
class Shape{constructor(){this.pts=[];this.holes=[];}moveTo(x,y){this.pts.push([x,y]);}lineTo(x,y){this.pts.push([x,y]);}}
class Path{absarc(x,y,r){this.c=[x,y,r];}}
const THREE={Shape,Path};
const ctx={THREE,console,Math,JSON,Set,Object,Array,Number,String,document:{},location:{search:''}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(P+'/js/params.js','utf8')+'\n;\n'+fs.readFileSync(P+'/js/parts.js','utf8'),ctx);
vm.runInContext('Object.assign(S,'+JSON.stringify(flags)+');recompute();',ctx);
const m=fs.readFileSync(P+'/js/model.js','utf8').replace(/\r\n/g,'\n'),i0=m.indexOf('function grillWall'),src=m.slice(i0,m.indexOf('\n}\n',i0)+3);
ctx.__cap=s=>{shape=s;};
vm.runInContext('const M={steel:0},group={add(){}};function ext(s){__cap(s);return {position:{set(){}}};}\n'+src+'\ngrillWall(0,'+back+');',ctx);
const k=10,r2=v=>Math.round(v*k*100)/100;   // см → мм
const pts=shape.pts.map(([x,y])=>[r2(x),r2(y)]);
let ent=[];
const line=(a,b)=>ent.push('0','LINE','8','CUT','10',a[0],'20',a[1],'30','0','11',b[0],'21',b[1],'31','0');
for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(a[0]!==b[0]||a[1]!==b[1])line(a,b);}
shape.holes.forEach(h=>{const [x,y,r]=h.c;ent.push('0','CIRCLE','8','CUT','10',r2(x),'20',r2(y),'30','0','40',r2(r));});
const dxf=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','ENTITIES',...ent,'0','ENDSEC','0','EOF'].join('\r\n')+'\r\n';
const out=path.join(P,'dxf');fs.mkdirSync(out,{recursive:true});
const name=back?'grill_side_back_5mm':'grill_side_front_5mm';
fs.writeFileSync(path.join(out,name+'.dxf'),dxf);
// превью SVG
const W=r2(vm.runInContext('L1',ctx)),H=r2(vm.runInContext('H1-t',ctx)),pad=20;
const poly=pts.map(([x,y])=>`${x},${H-y}`).join(' ');
const circ=shape.holes.map(h=>`<circle cx="${r2(h.c[0])}" cy="${H-r2(h.c[1])}" r="${r2(h.c[2])}"/>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${W+2*pad} ${H+2*pad+30}" width="${(W+2*pad)*1.6}"><rect x="${-pad}" y="${-pad}" width="${W+2*pad}" height="${H+2*pad+30}" fill="#fff"/><g fill="none" stroke="#c0501c" stroke-width="0.8"><polygon points="${poly}"/>${circ}</g><text x="0" y="${H+22}" font-family="Arial" font-size="11" fill="#333">${name}.dxf · ${W} × ${H} мм · лист 5 мм · ${shape.holes.length} отв. Ø${r2(shape.holes[0].c[2])*2} · ${pts.length-1} отрезков контура</text></svg>`;
fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);
console.log(name,W,'x',H,'holes',shape.holes.length,'segments',pts.length-1);
// вариант для готовой заготовки: без внешнего прямоугольника — только прорези/вырез (без верхней кромки) и отверстия
{const ent2=[];const ln=(a,b)=>ent2.push('0','LINE','8','CUT','10',a[0],'20',a[1],'30','0','11',b[0],'21',b[1],'31','0');
 const onEdge=(a,b)=>(a[1]===0&&b[1]===0)||(a[0]===0&&b[0]===0)||(a[0]===W&&b[0]===W)||(a[1]===H&&b[1]===H);
 let len=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if((a[0]!==b[0]||a[1]!==b[1])&&!onEdge(a,b)){ln(a,b);len+=Math.hypot(b[0]-a[0],b[1]-a[1]);}}
 // уголки заготовки — тонкие метки 0 длины не ставим; базирование: левый нижний угол заготовки = (0,0)
 shape.holes.forEach(h=>{const [x,y,r]=h.c;ent2.push('0','CIRCLE','8','CUT','10',r2(x),'20',r2(y),'30','0','40',r2(r));len+=2*Math.PI*r2(r);});
 const d2=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','ENTITIES',...ent2,'0','ENDSEC','0','EOF'].join('\r\n')+'\r\n';
 fs.writeFileSync(path.join(out,name+'_cutouts_only.dxf'),d2);console.log('cutouts only: rez',(len/1000).toFixed(2),'m');}

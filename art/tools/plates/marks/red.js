// красные пиксели (новые относительно исходного снимка) → связные куски
const {readPNG}=require('C:/dev/metal-designer/art/tools/plates/png.js'),D='C:/dev/доберман8-пометки/';
module.exports=function(name){const a=readPNG(D+name+'.png'),b=readPNG(D+name+'-красное.png');if(a.W!==b.W||a.H!==b.H)throw 'размер '+a.W+'x'+a.H+' vs '+b.W+'x'+b.H;
  const W=a.W,H=a.H,m=new Uint8Array(W*H);for(let i=0;i<W*H;i++){const r=b.px[i*3],g=b.px[i*3+1],bb=b.px[i*3+2],ch=Math.abs(r-a.px[i*3])+Math.abs(g-a.px[i*3+1])+Math.abs(bb-a.px[i*3+2]);if(r>170&&g<90&&bb<90&&ch>60)m[i]=1;}
  const lab=new Int32Array(W*H).fill(-1),comps=[];for(let i=0;i<W*H;i++){if(!m[i]||lab[i]>=0)continue;const q=[i],px=[];lab[i]=comps.length;while(q.length){const k=q.pop();px.push([k%W,(k/W)|0]);const x=k%W,y=(k/W)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const kk=yy*W+xx;if(m[kk]&&lab[kk]<0){lab[kk]=comps.length;q.push(kk);}}}comps.push(px);}
  return {W,H,comps:comps.filter(c=>c.length>15)};};
if(require.main===module){const r=module.exports(process.argv[2]);console.log(r.W,r.H);r.comps.forEach((c,i)=>{const xs=c.map(p=>p[0]),ys=c.map(p=>p[1]);console.log(i,c.length,'x',Math.min(...xs),Math.max(...xs),'y',Math.min(...ys),Math.max(...ys));});}

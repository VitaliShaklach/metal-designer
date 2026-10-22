// пометки → 3D: каждый кусок — точки на модели, грань, ближайшие рёбра
const {E,g,hit}=require('./base.js'),C=require('./cam.js'),red=require('./red.js');
const view=process.argv[2],cam=C(require('C:/dev/доберман8-пометки/_камеры/'+view+'.json'),1800,1800),R=red(view);
const dseg=(p,a,b)=>{const ab=[0,1,2].map(k=>b[k]-a[k]),ap=[0,1,2].map(k=>p[k]-a[k]),t=Math.max(0,Math.min(1,(ap[0]*ab[0]+ap[1]*ab[1]+ap[2]*ab[2])/(ab[0]**2+ab[1]**2+ab[2]**2)));return Math.hypot(...[0,1,2].map(k=>ap[k]-ab[k]*t));};
const edges=[];const seen=new Set();E.P.forEach(Q=>Q.forEach((a,k)=>{const b=Q[(k+1)%Q.length],kk=a<b?a+'_'+b:b+'_'+a;if(!seen.has(kk)){seen.add(kk);edges.push([Math.min(a,b),Math.max(a,b)]);}}));
R.comps.forEach((px,ci)=>{const step=Math.max(1,Math.floor(px.length/40)),pts=[];for(let i=0;i<px.length;i+=step){const h=hit(E,cam.pos,cam.ray(px[i][0]+.5,px[i][1]+.5));if(h)pts.push({px:px[i],p:h.p,poly:h.poly});}
  const polys={};pts.forEach(q=>polys[q.poly]=(polys[q.poly]||0)+1);
  // рёбра, к которым куски ближе 3 мм
  const ne={};pts.forEach(q=>edges.forEach(([a,b])=>{const d=dseg(q.p,E.V[a],E.V[b]);if(d<3){const k=a+'-'+b;ne[k]=(ne[k]||0)+1;}}));
  const xs=pts.map(q=>q.p);console.log(`кусок ${ci}: ${px.length} пикс, попало ${pts.length}; грани ${JSON.stringify(polys)}; рёбра<3мм ${JSON.stringify(ne)}`);
  console.log('   точки:',xs.filter((_,i)=>i%Math.max(1,Math.floor(xs.length/8))===0).map(p=>p.map(v=>v.toFixed(0)).join(',')).join(' | '));});

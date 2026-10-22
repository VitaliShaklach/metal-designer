// камера снимка: мир → пиксель и пиксель → луч
const V=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nz=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
module.exports=function(j,W,H){W=W||j.rect[2];H=H||j.rect[3];const f=nz(V(j.tgt,j.pos)),r=nz(cr(f,[0,1,0])),u=cr(r,f),t=Math.tan(j.fov*Math.PI/360),asp=W/H;
  return {pos:j.pos,proj:p=>{const q=V(p,j.pos),z=dot(q,f);return [(dot(q,r)/z/(t*asp)+1)/2*W,(1-dot(q,u)/z/t)/2*H];},
    ray:(px,py)=>{const x=px/W*2-1,y=1-py/H*2;return nz([f[0]+x*t*asp*r[0]+y*t*u[0],f[1]+x*t*asp*r[1]+y*t*u[1],f[2]+x*t*asp*r[2]+y*t*u[2]]);}};};

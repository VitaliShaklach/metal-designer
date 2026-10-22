// выравнивание с минимальной правкой: точки pins стоят на месте; плиты плоские; прочие точки — как можно ближе к прежним (вес LAM, затухает)
module.exports=function(g){const V3=g('V3'),polyNorm=g('polyNorm'),polyC=g('polyC'),mirrorMap=g('mirrorMap'),openVerts=g('openVerts');
  const solve3=(M,r)=>{const d=(a,b,c)=>a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);const c0=[M[0][0],M[1][0],M[2][0]],c1=[M[0][1],M[1][1],M[2][1]],c2=[M[0][2],M[1][2],M[2][2]],D=d(c0,c1,c2);if(Math.abs(D)<1e-12)return null;return [d(r,c1,c2)/D,d(c0,r,c2)/D,d(c0,c1,r)/D];};
  return function(E,pins,o){o=o||{};const LAM0=o.lam??.05,IT=o.it||400,DEC=o.dec??.985,PIN=50,sym=o.sym!==false;
    const mm=sym?mirrorMap(E.V):null,open=openVerts(E),VP=E.V.map(()=>[]);E.P.forEach((Q,fi)=>Q.forEach(i=>VP[i].push(fi)));
    const tgt=new Map();pins.forEach((q,i)=>{tgt.set(i,q);if(mm&&mm[i]>=0&&!pins.has(mm[i]))tgt.set(mm[i],[-q[0],q[1],q[2]]);});
    let V=E.V.map(p=>p.slice());tgt.forEach((q,i)=>V[i]=q.slice());const V0=o.anchor||E.V;
    for(let it=0;it<IT;it++){const LAM=Math.max(o.lmin??1e-5,LAM0*Math.pow(DEC,it)),PL=E.P.map((Q,f)=>{if(o.fix&&o.fix.has(f)){const n=o.fix.get(f).n;return {n,d:V3.dot(n,polyC(V,Q))};}const n=polyNorm(V,Q);return {n,d:V3.dot(n,polyC(V,Q))};});
      V=V.map((p,i)=>{const M=[[LAM,0,0],[0,LAM,0],[0,0,LAM]],r=V3.mul(V0[i],LAM),add=(n,d,w=1)=>{for(let x=0;x<3;x++){for(let y=0;y<3;y++)M[x][y]+=w*n[x]*n[y];r[x]+=w*n[x]*d;}};
        VP[i].forEach(f=>{if(E.P[f].length>3)add(PL[f].n,PL[f].d);});
        if(mm&&mm[i]===-2)add([1,0,0],0,10);if(open.has(i)&&Math.abs(E.V[i][2])<.5)add([0,0,1],0,10);
        if(tgt.has(i)){const q=tgt.get(i);for(let x=0;x<3;x++){M[x][x]+=PIN;r[x]+=PIN*q[x];}}
        return solve3(M,r)||p;});}
    if(mm)V=V.map((p,i)=>mm[i]===-2?[0,p[1],p[2]]:mm[i]>=0&&i>mm[i]?[-V[mm[i]][0],V[mm[i]][1],V[mm[i]][2]]:p);
    return {V,P:E.P.map(Q=>Q.slice()),S:(E.S||[]).map(s=>s.slice())};};};

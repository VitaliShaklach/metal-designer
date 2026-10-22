// временная: снимок Добермана крупно (общий вид или часть: c=x,y,z r=радиус d=направление) + параметры камеры в body[data-out]
(function(){const D={front:[0,0,1],iso:[.6,.18,.78],side:[1,.02,.05],top:[0,1,.35],low:[.25,-.45,.86],back34:[.8,.25,.3]};
  const h=location.hash,num=(n)=>{const m=new RegExp('[&#]'+n+'=([-0-9.,]+)').exec(h);return m?m[1].split(',').map(Number):null;};
  const k=(/mk=([a-z0-9]+)/.exec(h)||[])[1]||'front';
  const go=()=>{if(!CUR||!TRC.at||!camera){setTimeout(go,200);return;}
    const b=meshBox(CUR.M3.V),cc=num('c'),r=num('r'),dd=num('d');
    const c=cc?new THREE.Vector3(...cc):new THREE.Vector3((b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2),dir=new THREE.Vector3(...(dd||D[k])).normalize();
    const up=new THREE.Vector3(0,1,0),rt=new THREE.Vector3().crossVectors(up,dir).normalize(),u2=new THREE.Vector3().crossVectors(dir,rt),tv=Math.tan(camera.fov*Math.PI/360)*.96,th=tv*camera.aspect;
    let dist=0;if(r)dist=r[0]/Math.min(tv,th);else CUR.M3.V.forEach(p=>{const q=new THREE.Vector3(...p).sub(c),z=q.dot(dir);dist=Math.max(dist,Math.abs(q.dot(rt))/th+z,Math.abs(q.dot(u2))/tv+z);});
    controls.target.copy(c);camera.position.copy(c.clone().add(dir.multiplyScalar(dist)));camera.lookAt(c);controls.update();camAnim=null;req3D();need=10;
    setTimeout(()=>{camera.updateMatrixWorld();const R=renderer.domElement.getBoundingClientRect();document.body.dataset.out=JSON.stringify({k,hash:h,pos:camera.position.toArray(),tgt:controls.target.toArray(),fov:camera.fov,aspect:camera.aspect,rect:[R.left,R.top,R.width,R.height],win:[innerWidth,innerHeight],box:b,nv:CUR.M3.V.length,v0:CUR.M3.V[0],np:ST.base.P.length,bv0:ST.base.V[0]});},500);};
  setTimeout(go,500);})();

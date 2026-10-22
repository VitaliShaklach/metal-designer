// вырезать кусок снимка и увеличить: node crop.js файл x0 y0 x1 y1 k out
const {readPNG,writePNG}=require('C:/dev/metal-designer/art/tools/plates/png.js');const [f,x0,y0,x1,y1,k,out]=process.argv.slice(2);const a=readPNG(f),K=+k,w=(x1-x0)*K,h=(y1-y0)*K,px=Buffer.alloc(w*h*3);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=+x0+Math.floor(x/K),sy=+y0+Math.floor(y/K),s=(sy*a.W+sx)*3,d=(y*w+x)*3;px[d]=a.px[s];px[d+1]=a.px[s+1];px[d+2]=a.px[s+2];}writePNG(out,w,h,px);

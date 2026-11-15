// Separable binomial smoothing, Sobel gradients, non-maximum suppression
// and hysteresis keep thin, connected marks at different contrast levels.
export function stencil(rgba,w,h,{mode='line',detail=55,weight=1}={}){
 const n=w*h;
 let gray=new Float32Array(n),tmp=new Float32Array(n);
 for(let i=0;i<n;i++){const p=i*4;gray[i]=.2126*rgba[p]+.7152*rgba[p+1]+.0722*rgba[p+2];}
 const rounds=1+Math.round((100-detail)/24);
 for(let pass=0;pass<rounds;pass++){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x;tmp[i]=(gray[i-(x>0)]+2*gray[i]+gray[i+(x<w-1)])/4;
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x;gray[i]=(tmp[i-(y>0?w:0)]+2*tmp[i]+tmp[i+(y<h-1?w:0)])/4;
  }
 }
 const mag=new Float32Array(n),step=new Int32Array(n);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x,a=gray[i-w-1],b=gray[i-w+1],c=gray[i+w-1],d=gray[i+w+1];
  const gx=b+d-a-c+2*(gray[i+1]-gray[i-1]),gy=c+d-a-b+2*(gray[i+w]-gray[i-w]);
  mag[i]=Math.hypot(gx,gy);
  const ax=Math.abs(gx),ay=Math.abs(gy);
  step[i]=ay<ax*.414?1:ax<ay*.414?w:gx*gy>0?w+1:w-1;
 }
 const mask=new Uint8Array(n),stack=new Int32Array(n);
 let top=0;
 const strong=115-detail,weak=strong*.42;
 for(let i=w+1;i<n-w-1;i++){
  const s=step[i],m=mag[i];
  if(m>=weak&&m>mag[i-s]&&m>=mag[i+s]){
   mask[i]=m>=strong?2:1;if(mask[i]===2)stack[top++]=i;
  }
 }
 const offsets=[-w-1,-w,-w+1,-1,1,w-1,w,w+1];
 while(top){const i=stack[--top];for(const delta of offsets){const j=i+delta;if(mask[j]===1){mask[j]=2;stack[top++]=j;}}}
 const ink=new Uint8Array(n);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;
  if(mode==='black'&&gray[i]<45+detail*1.45)ink[i]=1;
  if(mode==='shade'&&x&&y){
   const interval=100-detail*.55;
   const band=Math.floor(gray[i]/interval);
   if(band!==Math.floor(gray[i-1]/interval)||band!==Math.floor(gray[i-w]/interval))ink[i]=1;
  }
  if(mask[i]===2)ink[i]=1;
 }
 const out=new Uint8ClampedArray(n*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let black=ink[y*w+x];
  for(let dy=1-weight;!black&&dy<weight;dy++)for(let dx=1-weight;dx<weight;dx++){
   if(dx*dx+dy*dy>(weight-1)**2||x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;
   if(ink[(y+dy)*w+x+dx]){black=1;break;}
  }
  const p=(y*w+x)*4;out[p]=out[p+1]=out[p+2]=black?0:255;out[p+3]=255;
 }
 return out;
}

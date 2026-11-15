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
  const localLight=(a+b+c+d+4*gray[i])/8;
  mag[i]=Math.hypot(gx,gy)*(1+3*Math.exp(-localLight/52));
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
 const ink=new Uint8Array(n), guide=new Uint8Array(n);
 // Use a broad local average for tonal bands, keeping sharp feature edges
 // in the continuous layer. Integral sums make the radius independent of cost.
 const stride=w+1, sums=new Float64Array(stride*(h+1));
 for(let y=0;y<h;y++){
  let row=0;
  for(let x=0;x<w;x++){
   const i=y*w+x;
   row+=gray[i];
   sums[(y+1)*stride+x+1]=sums[y*stride+x+1]+row;
   ink[i]=Number(mask[i]===2);
  }
 }
 const radius=Math.max(2,Math.round(Math.min(w,h)/180));
 const bands=new Uint8Array(n);
 const spacing=(mode==='shade'?45:mode==='black'?96:70)-detail*.22;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x, left=Math.max(0,x-radius), right=Math.min(w,x+radius+1);
  const top=Math.max(0,y-radius), bottom=Math.min(h,y+radius+1);
  const mean=(sums[bottom*stride+right]-sums[bottom*stride+left]-sums[top*stride+right]+sums[top*stride+left])/((right-left)*(bottom-top));
  bands[i]=Math.floor(mean/spacing);
  if(!x||!y||x===w-1||y===h-1)continue;
  if(bands[i]===bands[i-1] && bands[i]===bands[i-w])continue;
  if(Math.abs(gray[i]-mean)<=5 && !ink[i])guide[i]=1;
 }
 // Pair the opposite flanks of narrow dark strokes. Keep the valley
 // centre as a single mark; broad dark areas retain their boundary.
 const ridge=new Uint8Array(n);
 for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){
  const i=y*w+x, threshold=(17-detail*.08)/(1+2*Math.exp(-gray[i]/52));
  for(const step of [1,w,w+1,w-1]){
   if(gray[i]>=gray[i-step]||gray[i]>gray[i+step])continue;
   if(Math.min(gray[i-3*step],gray[i+3*step])-gray[i]<threshold)continue;
   ridge[i]=1;
   for(let k=-2;k<=2;k++){ink[i+k*step]=0;guide[i+k*step]=0;}
   break;
  }
 }
 for(let i=0;i<n;i++)if(ridge[i])ink[i]=1;
 // Walk each guide to measure dash length along the curve, including
 // vertical and diagonal contours. Solid feature pixels always take priority.
 const moves=[1,-1,w,-w,w-1,w+1,-w-1,-w+1];
 const dash=6+2*weight, period=dash+4+2*weight;
 for(let start=w;start<n-w;start++){
  if(!guide[start])continue;
  let i=start;
  while(guide[i]===1){
   guide[i]=2;
   const next=moves.find(delta=>guide[i+delta]===1);
   if(next===undefined)break;
   i+=next;
  }
  let distance=0;
  while(guide[i]){
   if(distance%period<dash)ink[i]=1;
   guide[i]=0;
   const next=moves.find(delta=>guide[i+delta]===2) ?? moves.find(delta=>guide[i+delta]===1);
   if(next===undefined)break;
   distance+=Math.abs(next)===1||Math.abs(next)===w?1:Math.SQRT2;
   i+=next;
  }
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

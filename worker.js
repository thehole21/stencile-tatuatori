import {stencil} from './engine.js';
self.onmessage=({data:{pixels,w,h,settings}})=>{
 const out=stencil(pixels,w,h,settings);
 self.postMessage(out,[out.buffer]);
};

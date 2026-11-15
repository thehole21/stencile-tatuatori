import test from 'node:test';
import assert from 'node:assert/strict';
import {stencil} from './engine.js';
const w=80,h=80;
const picture=fn=>Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:fn(Math.floor(i/4)%w,Math.floor(i/4/w)));
const count=out=>out.filter((v,i)=>i%4===0&&v===0).length;
test('uniform white stays white in every mode',()=>{
 for(const mode of ['line','shade','black'])assert.equal(count(stencil(picture(()=>255),w,h,{mode})),0);
});
test('stroke grows and modes produce different masks',()=>{
 const photo=picture((x,y)=>Math.min(255,Math.hypot(x-39,y-41)*6));
 const run=(mode,weight=1)=>stencil(photo,w,h,{mode,weight,detail:85});
 assert.ok(count(run('line'))>0);
 assert.ok(count(run('line',3))>count(run('line')));
 assert.notDeepEqual(run('shade'),run('line'));assert.notDeepEqual(run('shade'),run('black'));
});

test('shadow detail inside a dark fill remains visible and the fill stays open',()=>{
 const photo=picture((x,y)=>x<8||x>71||y<8||y>71?175:Math.hypot(x-40,y-40)<9?26:12);
 for(const mode of ['line','black','shade']){
  const out=stencil(photo,w,h,{mode});
  assert.equal(out[(20*w+20)*4],255);
  assert.ok(Array.from({length:9},(_,dx)=>out[(40*w+27+dx)*4]).includes(0));
 }
});
test('a soft tonal ramp produces interrupted guides',()=>{
 const out=stencil(picture(x=>100+x),w,h,{mode:'shade'});
 assert.ok(Array.from({length:w-8},(_,i)=>{
  const pixels=Array.from({length:h-8},(_,y)=>out[((y+4)*w+i+4)*4]);
  return pixels.filter(v=>v===0).length>12 && pixels.filter(v=>v===255).length>12;
 }).some(Boolean));
});
test('narrow dark stroke has a continuous centre line',()=>{
 const out=stencil(picture(x=>x===39?20:140),w,h);
 for(let y=5;y<h-5;y++)assert.equal(out[(y*w+39)*4],0);
});

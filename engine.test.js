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

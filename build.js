import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['index.html','style.css','app.js','engine.js','worker.js','mark.svg','manifest.webmanifest'];
await mkdir('dist',{recursive:true});
for(const file of files) await copyFile(file,'dist/'+file);
for(const pkg of ['react','react-dom']){
  const file=pkg+'.production.min.js';
  await copyFile('node_modules/'+pkg+'/umd/'+file,'dist/'+file);
  files.push(file);
}
const hash=createHash('sha256');
for(const file of files) hash.update(await readFile('dist/'+file));
const cache='inkline-'+hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`const name=${JSON.stringify(cache)};
const assets=${JSON.stringify(files.map(f=>'/'+f))};
self.addEventListener('install',e=>e.waitUntil(caches.open(name).then(c=>c.addAll(assets))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('inkline-')&&k!==name).map(k=>caches.delete(k)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.open(name).then(async c=>(await c.match(e.request.mode==='navigate'?'/index.html':e.request))||fetch(e.request)));
});`);


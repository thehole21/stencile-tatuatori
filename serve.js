import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=path==='/'?'index.html':path.slice(1);
 if(!/^[\w.-]+$/.test(file)){res.writeHead(404).end();return;}
 try{const data=await readFile('dist/'+file);res.writeHead(200,{'Content-Type':mime[extname(file)]}).end(data);}
 catch{res.writeHead(404).end();}
}).listen(Number(process.env.PORT||4173),'127.0.0.1');


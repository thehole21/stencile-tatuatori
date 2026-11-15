const {createElement:h,useEffect,useState,useRef}=React;
const modes=[['line','Fine line','Contorni sottili e continui'],['shade','Mappa tonale','Guide tratteggiate fitte'],['black','Blackwork','Profili delle masse scure']];
function sample(){
 const c=document.createElement('canvas');c.width=720;c.height=780;
 const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,720,780);
 g.translate(360,285);g.strokeStyle='#282527';g.lineCap='round';g.lineWidth=4;
 function curve(points){g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.bezierCurveTo(...p);g.stroke();}
 curve([[0,26],[20,140,-90,280,-80,408]]);
 for(const [x,y,k,rot] of [[-48,266,1,-.65],[-70,331,-.78,-.34],[2,115,-.65,.2]]){
  g.save();g.translate(x,y);g.scale(k,Math.abs(k));g.rotate(rot);
  curve([[0,0],[42,-89,116,-94,150,-101],[119,-45,63,2,0,0]]);
  curve([[0,0],[55,-40,98,-72,150,-101]]);
  for(let j=1;j<6;j++){const a=j*21,b=-j*15;curve([[a,b],[a+6,b-10,a+6,b-16,a+10,b-23]]);}
  g.restore();
 }
 for(let ring=0;ring<4;ring++){
  const count=9-ring,r=170-ring*35;
  for(let j=0;j<count;j++){g.save();g.rotate(j*2*Math.PI/count+ring*.35);
   g.beginPath();g.moveTo(-.25*r,-.18*r);g.bezierCurveTo(-.96*r,-.45*r,-.66*r,-1.35*r,-.18*r,-1.14*r);
   g.bezierCurveTo(.22*r,-1.41*r,.78*r,-.80*r,.22*r,-.16*r);g.fillStyle='white';g.fill();g.stroke();
   g.lineWidth=1.5;curve([[-.52*r,-.86*r],[-.5*r,-1.08*r,-.3*r,-1.1*r,-.18*r,-1.02*r]]);
   g.restore();
  }
 }
 g.beginPath();g.arc(0,0,14,0,Math.PI*2);g.fillStyle='#282527';g.fill();
 return c;
}
function App(){
 const [src,setSrc]=useState(()=>({canvas:sample(),name:'Peonia · esempio'}));
 const [mode,M]=useState('line'),[detail,D]=useState(55),[weight,W]=useState(1),[mirror,F]=useState(false);
 const [view,V]=useState('Stencil'),[result,R]=useState(null),[msg,E]=useState(''),[offline,O]=useState(false),[drag,G]=useState(false),[loading,L]=useState(false);
 const file=useRef(),display=useRef(),serial=useRef(0);
 const settingsKey=[mode,detail,weight].join('-');
 const ready=result?.src===src&&result.key===settingsKey&&!loading;
 useEffect(()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>O(true)).catch(()=>O(false));},[]);
 useEffect(()=>{
  let worker;const timer=setTimeout(()=>{
   try{worker=new Worker('/worker.js',{type:'module'});
   const c=src.canvas,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   worker.onmessage=({data})=>{const out=document.createElement('canvas');out.width=c.width;out.height=c.height;out.getContext('2d').putImageData(new ImageData(data,c.width,c.height),0,0);R({canvas:out,key:settingsKey,src});worker.terminate();};
   worker.onerror=()=>E('Elaborazione interrotta. Prova una foto più piccola.');
   worker.postMessage({pixels,w:c.width,h:c.height,settings:{mode,detail,weight}},[pixels.buffer]);}
   catch{E('Impossibile elaborare la foto in questo browser.');}
  },100);return()=>{clearTimeout(timer);worker?.terminate();};
 },[src,mode,detail,weight]);
 function paint(c,source,flip){c.width=source.width;c.height=source.height;const g=c.getContext('2d');if(flip){g.translate(c.width,0);g.scale(-1,1);}g.drawImage(source,0,0);}
 useEffect(()=>{const c=view==='Originale'?src.canvas:result?.src===src?result.canvas:null;if(c)paint(display.current,c,mirror);else display.current.width=1;},[view,src,result,mirror]);
 async function open(f){
  if(!f)return;const id=++serial.current;L(true);E('');const url=URL.createObjectURL(f);
  try{const im=new Image();im.src=url;await im.decode();if(id!==serial.current)return;
   const s=Math.min(1,2048/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));
   const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
   setSrc({canvas:c,name:f.name});V('Stencil');
  }catch{if(id===serial.current)E('Foto illeggibile. Scegli un file JPG, PNG o WebP.');}
  finally{URL.revokeObjectURL(url);if(id===serial.current)L(false);}
 }
 function save(){if(!ready)return;const c=document.createElement('canvas');paint(c,result.canvas,mirror);c.toBlob(blob=>{if(!blob){E('Esportazione non riuscita.');return;}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=src.name.replace(/\.[^.]+$/,'')+'-stencil.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);});}
 const btn=(label,fn,props={})=>h('button',{onClick:fn,...props},label);
 const range=(label,value,fn,min,max)=>h('label',{className:'range'},h('span',null,label,h('output',null,value)),h('input',{type:'range',min,max,value,onChange:e=>fn(+e.target.value)}));
 return h(React.Fragment,null,
 h('header',null,h('div',{className:'brand'},h('img',{src:'/mark.svg',alt:''}),'Inkline'),h('span',{className:'status'},'●  '+(offline?'Pronto offline':'Studio locale'))),
 h('main',null,h('div',{className:'intro'},h('div',null,h('h1',null,'Studio stencil'),h('p',null,'Dalla fotografia al disegno da trasferire.')),btn('↑  Importa foto',()=>file.current.click(),{className:'dark'})),
 h('input',{ref:file,type:'file',accept:'image/*',hidden:true,onChange:e=>{open(e.target.files[0]);e.target.value='';}}),
 h('div',{className:'layout'},h('section',{className:'preview',onDragOver:e=>{e.preventDefault();G(true);},onDragLeave:()=>G(false),onDrop:e=>{e.preventDefault();G(false);open(e.dataTransfer.files[0]);}},
 h('div',{className:'bar'},h('b',null,'Anteprima'),h('div',{className:'tabs'},...['Originale','Stencil'].map(t=>btn(t,()=>V(t),{key:t,'aria-pressed':view===t})))),
 h('div',{className:'board'+(drag?' dragging':'')},h('canvas',{ref:display,'aria-label':'Anteprima '+view}),drag&&h('strong',null,'Rilascia la foto')),
 h('footer',null,h('span',null,src.name),h('span',null,src.canvas.width+' × '+src.canvas.height+' px'))),
 h('aside',null,h('h2',null,'Impostazioni'),h('h3',null,'Metodo di generazione'),
 ...modes.map(([id,title,sub],i)=>btn(h(React.Fragment,null,h('i',null,['〰','≋','◐'][i]),h('span',null,h('b',null,title),h('small',null,sub)),h('em',null,mode===id?'●':'○')),()=>M(id),{key:id,className:'mode','aria-pressed':mode===id})),
 range('Livello di dettaglio',detail,D,0,100),range('Spessore del tratto',weight,W,1,4),
 h('label',{className:'flip'},'Specchia per il transfer',h('input',{type:'checkbox',checked:mirror,onChange:e=>F(e.target.checked)})),
 btn(ready?'↓  Esporta PNG':'Elaborazione…',save,{className:'export',disabled:!ready}),msg&&h('p',{role:'alert'},msg)))));
}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));

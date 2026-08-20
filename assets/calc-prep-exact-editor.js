(function(){
'use strict';
const E={};
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function mount(opts){
 const input=typeof opts.input==='string'?document.querySelector(opts.input):opts.input;
 const editor=typeof opts.editor==='string'?document.querySelector(opts.editor):opts.editor;
 const keypad=typeof opts.keypad==='string'?document.querySelector(opts.keypad):opts.keypad;
 let raw='',locked=false,fractionMode=false,fractionPrefix='',num='',den='',part='num';
 function sync(){input.value=raw;input.dispatchEvent(new Event('input',{bubbles:true}))}
 function renderSimple(piece){
  const slash=piece.indexOf('/');
  if(slash<=0||piece.indexOf('/',slash+1)!==-1)return BMPrep.inlineMathHTML(esc(piece).replace(/pi/g,'π').replace(/&amp;/g,'&'));
  let n=piece.slice(0,slash),d=piece.slice(slash+1),pre='',post='';
  if(n.startsWith('(')){pre='(';n=n.slice(1)}if(d.endsWith(')')){post=')';d=d.slice(0,-1)}
  return esc(pre)+`<span class="answer-frac"><span class="num">${n?BMPrep.inlineMathHTML(n.replace(/pi/g,'π')):'<span class="placeholder">□</span>'}</span><span class="bar"></span><span class="den">${d?BMPrep.inlineMathHTML(d.replace(/pi/g,'π')):'<span class="placeholder">□</span>'}</span></span>`+esc(post);
 }
 function render(){
  if(fractionMode){
   const n=num?BMPrep.inlineMathHTML(num.replace(/pi/g,'π')):'<span class="placeholder">□</span>';
   const d=den?BMPrep.inlineMathHTML(den.replace(/pi/g,'π')):'<span class="placeholder">□</span>';
   const pref=fractionPrefix.split(',').map(renderSimple).join('<span>, </span>');
   editor.innerHTML=pref+`<span class="answer-frac"><span class="num ${part==='num'?'active-part':''}">${n}</span><span class="bar"></span><span class="den ${part==='den'?'active-part':''}">${d}</span></span>`;
   editor.classList.remove('empty');
  }else if(!raw){editor.innerHTML='';editor.classList.add('empty')}
  else{editor.innerHTML=raw.split(',').map(renderSimple).join('<span>, </span>');editor.classList.remove('empty')}
  sync();
 }
 function syncFraction(){if(fractionMode)raw=`${fractionPrefix}${num}/${den}`}
 function exitFraction(){if(!fractionMode)return;syncFraction();fractionMode=false;fractionPrefix='';num='';den='';part='num';render()}
 function startFraction(){
  if(locked)return;
  if(fractionMode){part=part==='num'?'den':'num';render();return}
  const comma=raw.lastIndexOf(',');let current=comma>=0?raw.slice(comma+1):raw;fractionPrefix=comma>=0?raw.slice(0,comma+1):'';
  if(current.startsWith('(')){fractionPrefix+='(';current=current.slice(1)}
  num=current;den='';part=num?'den':'num';fractionMode=true;syncFraction();render();
 }
 function add(k){
  if(locked)return;
  if(k===','){if(fractionMode)exitFraction();raw+=',';render();return}
  if(k===')'&&fractionMode){exitFraction();raw+=')';render();return}
  if(fractionMode){if(part==='num')num+=k;else den+=k;syncFraction();render();return}
  raw+=k;render();
 }
 function backspace(){if(locked)return;if(fractionMode){if(part==='num')num=num.slice(0,-1);else den=den.slice(0,-1);syncFraction()}else raw=raw.slice(0,-1);render()}
 function clear(){if(locked)return;raw='';fractionMode=false;fractionPrefix='';num='';den='';part='num';render()}
 function move(dir){
  if(locked)return;
  if(fractionMode){if(dir<0){if(part==='den')part='num';else exitFraction()}else{if(part==='num')part='den';else exitFraction()}render();return}
  if(dir<0){
   const comma=raw.lastIndexOf(',');const prefix=comma>=0?raw.slice(0,comma+1):'';let p=comma>=0?raw.slice(comma+1):raw;let open='';if(p.startsWith('(')){open='(';p=p.slice(1)}let close='';if(p.endsWith(')')){close=')';p=p.slice(0,-1)}const slash=p.indexOf('/');if(slash>0&&p.indexOf('/',slash+1)===-1){fractionPrefix=prefix+open;num=p.slice(0,slash);den=p.slice(slash+1);part='den';fractionMode=true;syncFraction();render()}
  }
 }
 function build(){
  keypad.innerHTML='';
  const defs=[
   ['7','7'],['8','8'],['9','9'],['π','pi','math'],['√','sqrt','math'],['⌫',null,'action','back'],
   ['4','4'],['5','5'],['6','6'],['a⁄b',null,'math','frac'],['−','-','math'],['Clear',null,'action','clear'],
   ['1','1'],['2','2'],['3','3'],['(','(','math'],[')',')','math'],['Undefined','undefined','small'],
   ['0','0'],[',',',','math'],['°','°','math'],['←',null,'action','left'],['→',null,'action','right'],['Check',null,'check','check']
  ];
  defs.forEach(([label,key,cls,action])=>{const b=document.createElement('button');b.type='button';b.className='key'+(cls?' '+cls:'');b.textContent=label;b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{if(key!=null)add(key);else if(action==='back')backspace();else if(action==='clear')clear();else if(action==='frac')startFraction();else if(action==='left')move(-1);else if(action==='right')move(1);else if(action==='check')opts.onCheck?.()});keypad.appendChild(b)});
 }
 function onKey(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Enter'){e.preventDefault();opts.onCheck?.();return}if(locked)return;
  if(e.key==='ArrowLeft'){e.preventDefault();move(-1);return}if(e.key==='ArrowRight'){e.preventDefault();move(1);return}if(e.key==='ArrowUp'&&fractionMode){e.preventDefault();part='num';render();return}if(e.key==='ArrowDown'&&fractionMode){e.preventDefault();part='den';render();return}if(e.key==='Tab'&&fractionMode){e.preventDefault();move(1);return}if(e.key==='/'){e.preventDefault();startFraction();return}if(e.key==='Backspace'){e.preventDefault();backspace();return}if(e.key==='Escape'){e.preventDefault();clear();return}if(/^[0-9(),.\-]$/.test(e.key)){add(e.key);return}if(e.key.toLowerCase()==='p'){add('pi');return}if(e.key.toLowerCase()==='u'){raw='undefined';fractionMode=false;render();return}if(e.key==='√'){add('sqrt');return}
 }
 build();editor.tabIndex=0;editor.setAttribute('role','textbox');editor.addEventListener('click',()=>editor.focus());document.addEventListener('keydown',onKey);render();
 return {get raw(){return raw},set(v){raw=String(v||'');fractionMode=false;render()},clear,lock(v=true){locked=v;keypad.style.opacity=v?'.55':'1'},focus(){editor.focus()}};
}
E.mount=mount;window.BMExactEditor=E;
})();

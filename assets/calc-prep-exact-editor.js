(function(){
'use strict';
const E={};
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function mount(opts){
 const input=typeof opts.input==='string'?document.querySelector(opts.input):opts.input;
 const editor=typeof opts.editor==='string'?document.querySelector(opts.editor):opts.editor;
 const keypad=typeof opts.keypad==='string'?document.querySelector(opts.keypad):opts.keypad;
 let raw='',cursor=0,locked=false;
 const atomicWords=['undefined','sqrt','pi'];
 function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
 function sync(){input.value=raw;input.dispatchEvent(new Event('input',{bubbles:true}))}
 function caret(){return '<span class="bm-exact-caret" aria-hidden="true"></span>'}
 function token(text,start,end,cls=''){
  return `<span class="bm-exact-token${cls?' '+cls:''}" data-start="${start}" data-end="${end}">${esc(text)}</span>`;
 }
 function findClose(open,end){let d=0;for(let i=open;i<end;i++){if(raw[i]==='(')d++;else if(raw[i]===')'){d--;if(d===0)return i}}return -1}
 function sqrtShellAt(start){
  if(!raw.startsWith('sqrt(',start))return null;
  const close=findClose(start+4,raw.length);
  return {start,prefixEnd:start+5,close,end:close>=0?close+1:null};
 }
 function atomicAt(start){
  const w=atomicWords.find(word=>raw.startsWith(word,start));
  return w?{word:w,start,end:start+w.length}:null;
 }
 function normalizeCursor(pos,dir=0){
  let p=clamp(Number(pos)||0,0,raw.length);
  // A function/root prefix is one semantic boundary: never allow the caret in
  // hidden raw positions such as s|q|r|t|(.  Move directly between outside and
  // the first editable position inside the radical.
  for(let start=0;start<raw.length;start++){
   const sh=sqrtShellAt(start);
   if(sh&&p>sh.start&&p<sh.prefixEnd){
    if(dir>0)return sh.prefixEnd;
    if(dir<0)return sh.start;
    return (p-sh.start)<=(sh.prefixEnd-p)?sh.start:sh.prefixEnd;
   }
  }
  // Standalone semantic words/symbols are atomic too.  This covers the root key
  // before a radicand is typed, pi, and Undefined.
  for(let start=0;start<raw.length;start++){
   const a=atomicAt(start);if(!a)continue;
   // sqrt( is handled by the structural rule above; its visible token endpoint
   // before the opening parenthesis is intentionally not a cursor stop.
   if(a.word==='sqrt'&&raw[a.end]==='(')continue;
   if(p>a.start&&p<a.end){
    if(dir>0)return a.end;
    if(dir<0)return a.start;
    return (p-a.start)<=(a.end-p)?a.start:a.end;
   }
  }
  return p;
 }
 function renderRange(start,end){
  let out='',i=start;
  while(i<end){
   if(cursor===i)out+=caret();
   if(raw.startsWith('sqrt(',i)&&i+5<=end){
    const close=findClose(i+4,end);
    if(close>=0){
     let body=renderRange(i+5,close);if(i+5===close)body+='<span class="placeholder">□</span>';
     out+=`<span class="math-root bm-exact-token bm-exact-root" data-start="${i}" data-end="${close+1}"><span class="root-symbol">√</span><span class="root-body">${body}</span></span>`;
     i=close+1;continue;
    }
   }
   if(raw.startsWith('undefined',i)&&i+9<=end){out+=token('Undefined',i,i+9,'word');i+=9;continue}
   if(raw.startsWith('sqrt',i)&&i+4<=end){out+=token('√',i,i+4,'math');i+=4;continue}
   if(raw.startsWith('pi',i)&&i+2<=end){out+=token('π',i,i+2,'math');i+=2;continue}
   const ch=raw[i];
   out+=token(ch==='-'?'−':ch,i,i+1,ch==='°'?'math':'');
   i++;
  }
  if(cursor===end)out+=caret();
  return out;
 }
 function pieceBounds(pos){
  const p=clamp(pos,0,raw.length);
  const left=raw.lastIndexOf(',',Math.max(0,p-1));
  const right=raw.indexOf(',',p);
  return {start:left<0?0:left+1,end:right<0?raw.length:right};
 }
 function fractionInfo(pos=cursor){
  const b=pieceBounds(pos),piece=raw.slice(b.start,b.end);
  const slashRel=piece.indexOf('/');
  if(slashRel<0||piece.indexOf('/',slashRel+1)!==-1)return null;
  const slash=b.start+slashRel;
  return {pieceStart:b.start,pieceEnd:b.end,slash,numStart:b.start,numEnd:slash,denStart:slash+1,denEnd:b.end};
 }
 function renderPiece(start,end){
  const piece=raw.slice(start,end),slashRel=piece.indexOf('/');
  if(slashRel<0||piece.indexOf('/',slashRel+1)!==-1)return renderRange(start,end);
  const slash=start+slashRel;
  let num=renderRange(start,slash),den=renderRange(slash+1,end);
  if(start===slash)num+='<span class="placeholder">□</span>';
  if(slash+1===end)den+='<span class="placeholder">□</span>';
  const active=cursor<=slash?'num':'den';
  return `<span class="answer-frac" data-frac-start="${start}" data-frac-slash="${slash}" data-frac-end="${end}"><span class="num ${active==='num'?'active-part':''}" data-zone="num">${num}</span><span class="bar"></span><span class="den ${active==='den'?'active-part':''}" data-zone="den">${den}</span></span>`;
 }
 function render(){
  cursor=normalizeCursor(cursor,0);
  editor.classList.toggle('empty',!raw);
  if(!raw){editor.innerHTML=caret();}
  else{
   let out='',start=0;
   for(let i=0;i<=raw.length;i++){
    if(i===raw.length||raw[i]===','){
     out+=renderPiece(start,i);
     if(i<raw.length){
      if(cursor===i)out+=caret();
      out+=token(',',i,i+1);
      if(cursor===i+1)out+=caret();
     }
     start=i+1;
    }
   }
   editor.innerHTML=out;
  }
  editor.setAttribute('aria-valuetext',raw||'blank');
  sync();
 }
 function setRaw(v,pos){raw=String(v||'');cursor=normalizeCursor(pos==null?raw.length:pos,0);render()}
 function add(k){
  if(locked)return;
  cursor=normalizeCursor(cursor,0);
  raw=raw.slice(0,cursor)+k+raw.slice(cursor);
  cursor=normalizeCursor(cursor+k.length,1);render();editor.focus();
 }
 function backspace(){
  if(locked||cursor<=0)return;cursor=normalizeCursor(cursor,-1);if(cursor<=0)return;
  // Never delete one hidden character from a semantic token or structural root.
  for(let start=Math.max(0,cursor-12);start<cursor;start++){
   const sh=sqrtShellAt(start);
   if(sh&&sh.end===cursor){
    if(sh.close===sh.prefixEnd){raw=raw.slice(0,sh.start)+raw.slice(sh.end);cursor=sh.start;}
    else cursor=sh.close;
    render();editor.focus();return;
   }
   if(sh&&sh.prefixEnd===cursor){
    if(sh.close===sh.prefixEnd){raw=raw.slice(0,sh.start)+raw.slice(sh.end);cursor=sh.start;}
    else cursor=sh.start;
    render();editor.focus();return;
   }
   const a=atomicAt(start);
   if(a&&a.end===cursor&&!(a.word==='sqrt'&&raw[a.end]==='(')){raw=raw.slice(0,a.start)+raw.slice(a.end);cursor=a.start;render();editor.focus();return;}
  }
  raw=raw.slice(0,cursor-1)+raw.slice(cursor);cursor=normalizeCursor(cursor-1,-1);render();editor.focus();
 }
 function del(){
  if(locked||cursor>=raw.length)return;cursor=normalizeCursor(cursor,1);if(cursor>=raw.length)return;
  const sh=sqrtShellAt(cursor);
  if(sh){
   if(sh.close===sh.prefixEnd){raw=raw.slice(0,sh.start)+raw.slice(sh.end);cursor=sh.start;}
   else cursor=sh.prefixEnd;
   render();editor.focus();return;
  }
  for(let start=Math.max(0,cursor-12);start<=cursor;start++){
   const shell=sqrtShellAt(start);
   if(shell&&shell.close===cursor){cursor=shell.end;render();editor.focus();return;}
  }
  const a=atomicAt(cursor);
  if(a&&!(a.word==='sqrt'&&raw[a.end]==='(')){raw=raw.slice(0,a.start)+raw.slice(a.end);cursor=a.start;render();editor.focus();return;}
  raw=raw.slice(0,cursor)+raw.slice(cursor+1);cursor=normalizeCursor(cursor,1);render();editor.focus();
 }
 function clear(){if(locked)return;raw='';cursor=0;render();editor.focus()}
 function logicalLeft(){
  cursor=normalizeCursor(cursor,-1);
  if(cursor<=0)return 0;
  const fi=fractionInfo(cursor);
  if(fi&&cursor===fi.denStart)return normalizeCursor(fi.numEnd,-1);
  if(raw.slice(Math.max(0,cursor-5),cursor)==='sqrt(')return cursor-5;
  for(const w of atomicWords){
   if(w==='sqrt'&&raw[cursor]==='(')continue;
   if(cursor>=w.length&&raw.slice(cursor-w.length,cursor)===w)return cursor-w.length;
  }
  return normalizeCursor(cursor-1,-1);
 }
 function logicalRight(){
  cursor=normalizeCursor(cursor,1);
  if(cursor>=raw.length)return raw.length;
  const fi=fractionInfo(cursor);
  if(fi&&cursor===fi.numEnd)return normalizeCursor(fi.denStart,1);
  if(raw.startsWith('sqrt(',cursor))return Math.min(raw.length,cursor+5);
  const a=atomicAt(cursor);
  if(a&&!(a.word==='sqrt'&&raw[a.end]==='('))return a.end;
  return normalizeCursor(cursor+1,1);
 }
 function move(dir){
  if(locked)return;
  cursor=dir<0?logicalLeft():logicalRight();render();editor.focus();
 }
 function moveVertical(dir){
  if(locked)return;
  cursor=normalizeCursor(cursor,dir);
  const fi=fractionInfo(cursor);if(!fi)return;
  if(dir<0 && cursor>=fi.denStart&&cursor<=fi.denEnd){
   const off=cursor-fi.denStart;cursor=fi.numStart+Math.min(off,fi.numEnd-fi.numStart);
  }else if(dir>0 && cursor>=fi.numStart&&cursor<=fi.numEnd){
   const off=cursor-fi.numStart;cursor=fi.denStart+Math.min(off,fi.denEnd-fi.denStart);
  }else return;
  cursor=normalizeCursor(cursor,dir);render();editor.focus();
 }
 function startFraction(){
  if(locked)return;
  cursor=normalizeCursor(cursor,0);
  const fi=fractionInfo(cursor);
  if(fi){moveVertical(cursor<=fi.numEnd?1:-1);return}
  const b=pieceBounds(cursor);
  const numerator=raw.slice(b.start,cursor);
  raw=raw.slice(0,b.start)+numerator+'/'+raw.slice(cursor);
  cursor=numerator?b.start+numerator.length+1:b.start;
  cursor=normalizeCursor(cursor,1);render();editor.focus();
 }
 function clickPlace(e){
  if(locked)return;
  const tok=e.target.closest?.('.bm-exact-token');
  if(tok&&editor.contains(tok)){
   const a=Number(tok.dataset.start),b=Number(tok.dataset.end),r=tok.getBoundingClientRect();
   if(tok.classList?.contains('bm-exact-root')){
    const inside=a+5;
    cursor=(e.clientX<r.left+r.width*.32)?a:(e.clientX>r.left+r.width*.84?b:inside);
   }else cursor=(e.clientX<r.left+r.width/2)?a:b;
   cursor=normalizeCursor(cursor,e.clientX<r.left+r.width/2?-1:1);render();editor.focus();return;
  }
  const frac=e.target.closest?.('.answer-frac');
  if(frac&&editor.contains(frac)){
   const slash=Number(frac.dataset.fracSlash),end=Number(frac.dataset.fracEnd);
   const zone=e.target.closest?.('[data-zone]')?.dataset.zone;
   cursor=zone==='num'?slash:(zone==='den'?end:slash+1);cursor=normalizeCursor(cursor,0);render();editor.focus();return;
  }
  cursor=raw.length;render();editor.focus();
 }
 function build(){
  keypad.innerHTML='';
  const defs=[
   ['7','7'],['8','8'],['9','9'],['π','pi','math'],['√','sqrt','math'],['⌫',null,'action','back'],
   ['4','4'],['5','5'],['6','6'],['a⁄b',null,'math','frac'],['−','-','math'],['Clear',null,'action','clear'],
   ['1','1'],['2','2'],['3','3'],['(','(','math'],[')',')','math'],['Undefined','undefined','small'],
   ['0','0'],['.','.','math'],[',',',','math'],['°','°','math'],['↑',null,'action','up'],['↓',null,'action','down'],
   ['←',null,'action','left'],['→',null,'action','right'],['Del',null,'action','del'],['Check',null,'check','check']
  ];
  defs.forEach(([label,key,cls,action])=>{
   const b=document.createElement('button');b.type='button';b.className='key'+(cls?' '+cls:'');b.textContent=label;
   b.addEventListener('pointerdown',e=>e.preventDefault());
   b.addEventListener('click',()=>{if(key!=null)add(key);else if(action==='back')backspace();else if(action==='del')del();else if(action==='clear')clear();else if(action==='frac')startFraction();else if(action==='left')move(-1);else if(action==='right')move(1);else if(action==='up')moveVertical(-1);else if(action==='down')moveVertical(1);else if(action==='check')opts.onCheck?.()});
   keypad.appendChild(b);
  });
 }
 function onKey(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Enter'){e.preventDefault();opts.onCheck?.();return}if(locked)return;
  if(e.key==='ArrowLeft'){e.preventDefault();move(-1);return}
  if(e.key==='ArrowRight'){e.preventDefault();move(1);return}
  if(e.key==='ArrowUp'){e.preventDefault();moveVertical(-1);return}
  if(e.key==='ArrowDown'){e.preventDefault();moveVertical(1);return}
  if(e.key==='Tab'){const fi=fractionInfo(cursor);if(fi){e.preventDefault();moveVertical(cursor<=fi.numEnd?1:-1)}return}
  if(e.key==='/'){e.preventDefault();startFraction();return}
  if(e.key==='Backspace'){e.preventDefault();backspace();return}
  if(e.key==='Delete'){e.preventDefault();del();return}
  if(e.key==='Escape'){e.preventDefault();clear();return}
  if(/^[0-9(),.°\-]$/.test(e.key)){e.preventDefault();add(e.key);return}
  if(e.key.toLowerCase()==='p'){e.preventDefault();add('pi');return}
  if(e.key.toLowerCase()==='u'){e.preventDefault();setRaw('undefined');return}
  if(e.key==='√'){e.preventDefault();add('sqrt');return}
 }
 build();editor.tabIndex=0;editor.setAttribute('role','textbox');editor.setAttribute('aria-label',editor.getAttribute('aria-label')||'Exact answer');
 editor.addEventListener('click',clickPlace);editor.addEventListener('keydown',onKey);render();
 return {get raw(){return raw},get cursor(){return cursor},set(v){setRaw(v)},clear,lock(v=true){locked=v;keypad.style.opacity=v?'.55':'1'},focus(){editor.focus()},move,moveVertical,setCursor(v){cursor=normalizeCursor(Number(v)||0,0);render()}};
}
E.mount=mount;window.BMExactEditor=E;
})();

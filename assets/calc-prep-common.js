(function(){
'use strict';
const BM={};
BM.$=id=>document.getElementById(id);
BM.pick=a=>a[Math.floor(Math.random()*a.length)];
BM.shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a};
BM.randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
BM.gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
BM.reduce=(n,d)=>{if(d<0){n=-n;d=-d}const g=BM.gcd(n,d);return [n/g,d/g]};
BM.fracText=(n,d)=>{[n,d]=BM.reduce(n,d);if(d===1)return String(n);return `${n}/${d}`};
BM.fracHTML=(n,d)=>{[n,d]=BM.reduce(n,d);if(d===1)return String(n);let sign=n<0?'−':'',an=Math.abs(n);return `${sign}<span class="math-frac"><span class="num">${an}</span><span class="bar"></span><span class="den">${d}</span></span>`};
BM.escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
BM.stripOuterParens=function(s){
 s=String(s).trim();if(!(s.startsWith('(')&&s.endsWith(')')))return s;let d=0;
 for(let i=0;i<s.length;i++){if(s[i]==='(')d++;else if(s[i]===')')d--;if(d===0&&i<s.length-1)return s}
 return s.slice(1,-1).trim();
};
BM.inlineMathHTML=function(raw){
 const s=String(raw??'');let out='',i=0;
 const esc=BM.escape;
 function rootMarkup(body,index){return `<span class="math-root">${index?`<span class="root-index">${index}</span>`:''}<span class="root-symbol">√</span><span class="root-body">${BM.inlineMathHTML(body)}</span></span>`}
 while(i<s.length){
  let idx='',advance=0;
  if(s.startsWith('sqrt',i)){advance=4}
  else if(s[i]==='√'){advance=1}
  else if(s[i]==='∛'){advance=1;idx='3'}
  else if(s[i]==='∜'){advance=1;idx='4'}
  if(advance){
   let j=i+advance,body='';
   if(s[j]==='('){let d=1,k=j+1;for(;k<s.length&&d;k++){if(s[k]==='(')d++;else if(s[k]===')')d--}body=s.slice(j+1,d===0?k-1:k);i=d===0?k:s.length}
   else{let k=j;while(k<s.length&&/[A-Za-z0-9π._]/.test(s[k]))k++;body=s.slice(j,k)||' ';i=k}
   out+=rootMarkup(body,idx);continue;
  }
  if(s.startsWith('log_',i)){
   let j=i+4,base='';
   if(s[j]==='{'){const k=s.indexOf('}',j+1);if(k>=0){base=s.slice(j+1,k);j=k+1}}
   else{while(j<s.length&&/[A-Za-z0-9π]/.test(s[j])){base+=s[j];j++}}
   if(base){out+=`log<sub>${esc(base)}</sub>`;i=j;continue}
  }
  if(s[i]==='^'){
   let j=i+1,exp='';
   if(s[j]==='{'){const k=s.indexOf('}',j+1);if(k>=0){exp=s.slice(j+1,k);j=k+1}}
   else{while(j<s.length&&/[0-9−-]/.test(s[j])){exp+=s[j];j++}}
   if(exp){if(exp!=='1')out+=`<sup>${esc(exp)}</sup>`;i=j;continue}
  }
  if(s[i]==='∞'){out+='<span class="math-infinity" aria-label="infinity">∞</span>';i++;continue}
  out+=esc(s[i]);i++;
 }
 return out;
};
BM.fracHTMLText=function(n,d,extra=''){return `<span class="math-frac ${extra}"><span class="num">${BM.inlineMathHTML(BM.stripOuterParens(n))}</span><span class="bar"></span><span class="den">${BM.inlineMathHTML(BM.stripOuterParens(d))}</span></span>`};
BM.topLevelSlash=function(s){let d=0,found=-1;for(let i=0;i<s.length;i++){const c=s[i];if(c==='('||c==='['||c==='{')d++;else if(c===')'||c===']'||c==='}')d=Math.max(0,d-1);else if(c==='/'&&d===0){if(found>=0)return -1;found=i}}return found};
BM.hasMathMarkup=s=>/(?:<span\s+class=["'][^"']*(?:math-frac|math-root|answer-frac|bm-math)|<sub\b|<sup\b|\\\(|\\\[)/i.test(String(s||''));

BM.ensureMathJax=function(){
 if(window.MathJax&&window.MathJax.typesetPromise)return Promise.resolve(window.MathJax);
 if(!window.__BM_MATHJAX_LOADING__){
  window.MathJax=window.MathJax||{tex:{inlineMath:[["\\(","\\)"]],displayMath:[["\\[","\\]"]]},chtml:{scale:1.0},options:{enableMenu:false,menuOptions:{settings:{explorer:false,zoom:'NoZoom',inTabOrder:false}}}};
  window.__BM_MATHJAX_LOADING__=new Promise(resolve=>{
   const existing=document.querySelector('script[data-bm-mathjax="1"]');
   if(existing){existing.addEventListener('load',()=>resolve(window.MathJax),{once:true});return;}
   const s=document.createElement('script');
   s.defer=true;s.src='https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';s.dataset.bmMathjax='1';
   s.addEventListener('load',()=>resolve(window.MathJax),{once:true});
   s.addEventListener('error',()=>resolve(null),{once:true});
   document.head.appendChild(s);
  });
 }
 return window.__BM_MATHJAX_LOADING__;
};
BM.typeset=function(nodes){
 return BM.ensureMathJax().then(()=>{
  if(!(window.MathJax&&MathJax.typesetPromise))return;
  const list=(nodes||[]).filter(Boolean);
  if(!list.length)return;
  if(MathJax.typesetClear)try{MathJax.typesetClear(list)}catch(e){}
  return MathJax.typesetPromise(list).catch(()=>{});
 });
};

BM.readGroup=function(s,start,open='(',close=')'){
 if(s[start]!==open)return {body:'',end:start};
 let d=1,i=start+1;
 for(;i<s.length&&d;i++){
  if(s[i]===open)d++;
  else if(s[i]===close)d--;
 }
 return {body:s.slice(start+1,d===0?i-1:i),end:d===0?i:s.length};
};
BM.readAtom=function(s,start){
 const c=s[start];
 if(c==='('||c==='['||c==='{'){
  const pair=c==='('?')':c===']'?'[':'}';
 }
 if(c==='('){const g=BM.readGroup(s,start,'(',')');return {body:'('+g.body+')',end:g.end};}
 if(c==='['){const g=BM.readGroup(s,start,'[',']');return {body:'['+g.body+']',end:g.end};}
 if(c==='{'){const g=BM.readGroup(s,start,'{','}');return {body:'{'+g.body+'}',end:g.end};}
 let i=start;
 while(i<s.length&&/[A-Za-z0-9π∞._]/.test(s[i]))i++;
 return {body:s.slice(start,i),end:i};
};

BM.findFractionSpan=function(s){
 const text=String(s||'');
 const depth=[];let d=0;
 for(let i=0;i<text.length;i++){
  depth[i]=d;
  const c=text[i];
  if(c==='('||c==='['||c==='{')d++;
  else if(c===')'||c===']'||c==='}')d=Math.max(0,d-1);
 }
 const boundary=c=>'+-−–—=<>;,∪≤≥≠'.includes(c);
 for(let slash=0;slash<text.length;slash++){
  if(text[slash]!=='/'||depth[slash]!==0)continue;
  const target=0;
  let start=0;
  for(let j=slash-1;j>=0;j--){
   if(depth[j]<target){start=j+1;break;}
   if(depth[j]===target&&boundary(text[j])){start=j+1;break;}
   if(j===0)start=0;
  }
  let end=text.length;
  let firstNonSpace=-1;
  for(let j=slash+1;j<text.length;j++){
   if(firstNonSpace<0&&!/\s/.test(text[j]))firstNonSpace=j;
   if(depth[j]<target){end=j;break;}
   if((text[j]===')'||text[j]===']'||text[j]==='}')&&depth[j]===target){end=j;break;}
   if(depth[j]===target&&boundary(text[j])){
    if((text[j]==='-'||text[j]==='+')&&j===firstNonSpace)continue;
    end=j;break;
   }
  }
  while(start<slash&&/\s/.test(text[start]))start++;
  let leftEnd=slash;while(leftEnd>start&&/\s/.test(text[leftEnd-1]))leftEnd--;
  let rightStart=slash+1;while(rightStart<end&&/\s/.test(text[rightStart]))rightStart++;
  let rightEnd=end;while(rightEnd>rightStart&&/\s/.test(text[rightEnd-1]))rightEnd--;
  const num=text.slice(start,leftEnd),den=text.slice(rightStart,rightEnd);
  if(num&&den)return {start,leftEnd,rightStart,rightEnd,end,num,den};
 }
 return null;
};
BM.readExponentToken=function(s,start){
 let i=start;
 if(i>=s.length)return {raw:'',end:i};
 if(s[i]==='+'||s[i]==='-'){
  const sign=s[i++];
  if(/\d/.test(s[i]||'')){let j=i;while(j<s.length&&/\d/.test(s[j]))j++;return {raw:sign+s.slice(i,j),end:j};}
  const rest=BM.readExponentToken(s,i);return {raw:sign+rest.raw,end:rest.end};
 }
 if(/\d/.test(s[i])){let j=i;while(j<s.length&&/\d/.test(s[j]))j++;return {raw:s.slice(i,j),end:j};}
 const funcs=['arcsin','arccos','arctan','sin','cos','tan','csc','sec','cot','ln','log'];
 const fn=funcs.find(f=>s.startsWith(f,i));
 if(fn){
  let j=i+fn.length;
  if(fn==='log'&&s[j]==='_'){
   j++;if(s[j]==='{'){const g=BM.readGroup(s,j,'{','}');j=g.end;}else while(j<s.length&&/[A-Za-z0-9]/.test(s[j]))j++;
  }
  if(s[j]==='('){const g=BM.readGroup(s,j,'(',')');j=g.end;return {raw:s.slice(i,j),end:j};}
  if(s.startsWith('theta',j)){j+=5;return {raw:s.slice(i,j),end:j};}
  if(s.startsWith('pi',j)){j+=2;return {raw:s.slice(i,j),end:j};}
  if(s[j]==='θ'){j++;return {raw:s.slice(i,j),end:j};}
  if(/[A-Za-z]/.test(s[j]||'')){j++;return {raw:s.slice(i,j),end:j};}
  return {raw:s.slice(i,j),end:j};
 }
 if(s.startsWith('sqrt',i)){
  let j=i+4;if(s[j]==='('){const g=BM.readGroup(s,j,'(',')');j=g.end;}else{const a=BM.readAtom(s,j);j=a.end;}return {raw:s.slice(i,j),end:j};
 }
 if(s.startsWith('theta',i))return {raw:'theta',end:i+5};
 if(s.startsWith('alpha',i))return {raw:'alpha',end:i+5};
 if(s.startsWith('beta',i))return {raw:'beta',end:i+4};
 if(s.startsWith('pi',i))return {raw:'pi',end:i+2};
 if(s[i]==='θ')return {raw:'θ',end:i+1};
 if(/[A-Za-z]/.test(s[i])){
  let end=i+1,raw=s.slice(i,end);
  if(s[end]==='^'){
   const nested=BM.readExponentToken(s,end+1);
   if(nested.raw){raw+=`^${nested.raw}`;end=nested.end;}
  }
  return {raw,end};
 }
 return {raw:s[i],end:i+1};
};

BM.simpleFracTeX=function(tex){
 const atom=String.raw`(?:\\(?:pi|infty|cup|le|ge|ne|mathbb\{Z\}|sin|cos|tan|csc|sec|cot|arcsin|arccos|arctan|ln|log)(?:_\{[^}]+\})?|-?\d+(?:\.\d+)?(?:\^\{[^}]+\})?|[A-Za-z]+(?:_\{[^}]+\})?(?:\^\{[^}]+\})?|\\sqrt(?:\[[^\]]+\])?\{[^{}]+\}|\([^()]+\)|\[[^\[\]]+\])`;
 const re=new RegExp(`(${atom})\\/(${atom})`,'g');
 let prev='';
 while(tex!==prev){prev=tex;tex=tex.replace(re,'\\frac{$1}{$2}');}
 return tex;
};
BM.toTeX=function(raw){
 let s=String(raw??'').trim();
 if(!s)return '';
 const frac=BM.findFractionSpan(s);
 if(frac){
  const prefix=s.slice(0,frac.start),suffix=s.slice(frac.rightEnd);
  const num=BM.stripOuterParens(frac.num),den=BM.stripOuterParens(frac.den);
  return `${BM.toTeX(prefix)}\\frac{${BM.toTeX(num)}}{${BM.toTeX(den)}}${BM.toTeX(suffix)}`.replace(/\s+/g,' ').trim();
 }
 const supMap={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
 s=s.replace(/[−–—]/g,'-').replace(/[×·]/g,'\\cdot ').replace(/π/g,'pi').replace(/∞/g,'infty').replace(/∪/g,' cup ').replace(/∈/g,' in ').replace(/±/g,' pm ').replace(/≤/g,' <= ').replace(/≥/g,' >= ').replace(/≠/g,' != ').replace(/ℤ/g,'mathbb{Z}').replace(/°/g,'@DEG@').replace(/%/g,'@PERCENT@').replace(/#/g,'@HASH@');
 s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+m.split('').map(ch=>supMap[ch]).join(''));
 let out='',i=0;
 while(i<s.length){
  if(s[i]==='('){const g=BM.readGroup(s,i,'(',')');out+=`(${BM.toTeX(g.body)})`;i=g.end;continue;}
  if(s[i]==='['){const g=BM.readGroup(s,i,'[',']');out+=`[${BM.toTeX(g.body)}]`;i=g.end;continue;}
  if(s.startsWith('sqrt',i)||s[i]==='√'||s[i]==='∛'||s[i]==='∜'){
   let idx='';
   if(s.startsWith('sqrt',i))i+=4;
   else if(s[i]==='√')i+=1;
   else if(s[i]==='∛'){idx='[3]';i+=1;}
   else if(s[i]==='∜'){idx='[4]';i+=1;}
   let atom;
   if(s[i]==='('){atom=BM.readGroup(s,i,'(',')');i=atom.end;out+=`\\sqrt${idx}{${BM.toTeX(atom.body)}}`;continue;}
   atom=BM.readAtom(s,i);i=atom.end;out+=`\\sqrt${idx}{${BM.toTeX(atom.body)}}`;continue;
  }
  if(s.startsWith('log_',i)){
   let j=i+4,base='';
   if(s[j]==='{'){const g=BM.readGroup(s,j,'{','}');base=g.body;j=g.end;}
   else{while(j<s.length&&/[A-Za-z0-9pi]/.test(s[j])){base+=s[j];j++;}}
   out+=base?`\\log_{${BM.toTeX(base)}}`:'\\log';
   i=j;continue;
  }
  if(s.startsWith('log',i)){
   const next=s[i+3]||'';
   if(/\d/.test(next)){
    let j=i+3,base='';while(j<s.length&&/\d/.test(s[j])){base+=s[j];j++;}
    out+=`\\log_{${base}}`;i=j;continue;
   }
   if(next===''||next==='('||/\s/.test(next)){out+='\\log';i+=3;continue;}
  }
  if(s.startsWith('arcsin',i)){out+='\\arcsin';i+=6;continue;}
  if(s.startsWith('arccos',i)){out+='\\arccos';i+=6;continue;}
  if(s.startsWith('arctan',i)){out+='\\arctan';i+=6;continue;}
  if(s.startsWith('sin',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\sin';i+=3;continue;}
  if(s.startsWith('cos',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\cos';i+=3;continue;}
  if(s.startsWith('tan',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\tan';i+=3;continue;}
  if(s.startsWith('csc',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\csc';i+=3;continue;}
  if(s.startsWith('sec',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\sec';i+=3;continue;}
  if(s.startsWith('cot',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\cot';i+=3;continue;}
  if(s.startsWith('ln',i)&&!/[A-Za-z]/.test(s[i+2]||'')){out+='\\ln';i+=2;continue;}
  if(s.startsWith('infty',i)){out+='\\infty';i+=5;continue;}
  if(s.startsWith('mathbb{Z}',i)){out+='\\mathbb{Z}';i+=10;continue;}
  if(s.startsWith('pi',i)&&!/[A-Za-z]/.test(s[i+2]||'')){out+='\\pi';i+=2;continue;}
  if(s[i]==='θ'){out+='\\theta';i++;continue;}
  if(s.startsWith('cup',i)&&!/[A-Za-z]/.test(s[i+3]||'')){out+='\\cup';i+=3;continue;}
  if(s.startsWith('in',i)&&!/[A-Za-z]/.test(s[i+2]||'')){out+='\\in ';i+=2;continue;}
  if(s.startsWith('pm',i)&&!/[A-Za-z]/.test(s[i+2]||'')){out+='\\pm ';i+=2;continue;}
  if(s.startsWith('<=',i)){out+='\\le ';i+=2;continue;}
  if(s.startsWith('>=',i)){out+='\\ge ';i+=2;continue;}
  if(s.startsWith('!=',i)){out+='\\ne ';i+=2;continue;}
  const ch=s[i];
  if(ch==='^'){
   i++;
   if(s[i]==='{'){const g=BM.readGroup(s,i,'{','}');const expTex=BM.toTeX(g.body);if(expTex!=='1')out+=`^{${expTex}}`;i=g.end;continue;}
   if(s[i]==='('){const g=BM.readGroup(s,i,'(',')');const expTex=BM.toTeX(g.body);if(expTex!=='1')out+=`^{${expTex}}`;i=g.end;continue;}
   const tok=BM.readExponentToken(s,i);i=tok.end;
   if(tok.raw&&tok.raw!=='1')out+=`^{${BM.toTeX(tok.raw)}}`;
   continue;
  }
  if(ch==='*'){out+='\\cdot ';i++;continue;}
  out+=ch;i++;
 }
 // Keep ordinary parentheses around function arguments. Avoid inserting \left/\right
 // with regexes because nested functions can create mismatched MathJax delimiters.
 // MathJax still typesets function names, fractions, roots, exponents, pi, infinity, etc.
 out=out.replace(/(^|[^\\])theta/g,'$1\\theta');
 out=out.replace(/(^|[^\\])alpha/g,'$1\\alpha');
 out=out.replace(/(^|[^\\])beta/g,'$1\\beta');
 out=out.replace(/(^|[^\\A-Za-z])(sin|cos|tan|csc|sec|cot|arcsin|arccos|arctan)(?=(x|y|z|t|n|pi|theta|alpha|beta|θ|\\pi|\\theta|\\alpha|\\beta))/g,'$1\\$2 ');
 out=out.replace(/@DEG@/g,'^{\\circ}').replace(/@PERCENT@/g,'\\%').replace(/@HASH@/g,'\\#');
 // Fractions are handled from the raw expression before token conversion.
 out=out.replace(/\s+/g,' ').trim();
 return out;
};
BM.legacyHTMLToTeX=function(raw){
 const html=String(raw??'').trim();if(!html)return '';
 if(!/[<>]/.test(html))return BM.toTeX(html);
 const box=document.createElement('div');box.innerHTML=html;
 function walk(node){
  if(node.nodeType===3)return BM.toTeX(node.nodeValue||'');
  if(node.nodeType!==1)return '';
  const el=node,cls=el.classList||{contains:()=>false};
  if(cls.contains('math-frac')||cls.contains('answer-frac')){
   const num=[...el.children].find(x=>x.classList.contains('num'));
   const den=[...el.children].find(x=>x.classList.contains('den'));
   if(num&&den)return `\\frac{${walk(num)}}{${walk(den)}}`;
  }
  if(cls.contains('math-root')){
   const idx=[...el.children].find(x=>x.classList.contains('root-index'));
   const body=[...el.children].find(x=>x.classList.contains('root-body'));
   const index=idx?walk(idx):'';return `\\sqrt${index?`[${index}]`:''}{${body?walk(body):''}}`;
  }
  if(el.tagName==='SUP')return `^{${[...el.childNodes].map(walk).join('')}}`;
  if(el.tagName==='SUB')return `_{${[...el.childNodes].map(walk).join('')}}`;
  return [...el.childNodes].map(walk).join('');
 }
 return [...box.childNodes].map(walk).join('').replace(/\s+/g,' ').trim();
};
BM.texHTML=raw=>`<span class="bm-math">\\(${BM.toTeX(raw)}\\)</span>`;
BM.displayMathHTML=function(raw){
 const s=String(raw??'').trim();if(!s)return '';
 if(/\\\(|\\\[/.test(s))return s;
 const tex=BM.legacyHTMLToTeX(s);
 return `<span class="bm-math">\\(${tex}\\)</span>`;
};
BM.displayMethodHTML=s=>BM.hasMathMarkup(s)?String(s):BM.inlineMathHTML(s);
BM.mathHTML=raw=>BM.displayMathHTML(raw);
BM.renderMath=function(el,raw){if(!el)return;el.innerHTML=BM.displayMathHTML(raw);BM.typeset([el]);};
BM.renderHTML=function(el,html){if(!el)return;el.innerHTML=BM.displayMathHTML(html);BM.typeset([el]);};

BM.normalize=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,'').replace(/[−–—]/g,'-').replace(/[⁄∕]/g,'/').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/°/g,'').replace(/·/g,'*');
BM.normalizeRadicals=s=>s.replace(/sqrt\((\d+(?:\.\d+)?)(?=$|[+\-*/])/g,'sqrt($1)').replace(/sqrt(\d+(?:\.\d+)?)/g,'sqrt($1)');
BM.safeExactEval=function(raw){
 let s=BM.normalizeRadicals(BM.normalize(raw));
 if(!s)return NaN;
 if(/[^0-9+\-*/().a-z]/.test(s))return NaN;
 s=s.replace(/pi/g,`(${Math.PI})`).replace(/sqrt\(/g,'Math.sqrt(');
 s=s.replace(/(\d|\))(?=Math\.sqrt|\()/g,'$1*');
 s=s.replace(/(\d|\))(?=\()/g,'$1*');
 if(/[a-z]/i.test(s.replace(/Math\.sqrt/g,'')))return NaN;
 try{return Function(`"use strict";return (${s})`)()}catch(e){return NaN}
};
BM.prepareXExpr=function(raw){
 let s=String(raw||'').trim().toLowerCase().replace(/[−–—]/g,'-').replace(/·/g,'*').replace(/\s+/g,'');
 s=s.replace(/\^/g,'**');
 if(/[^0-9x+\-*/().*]/.test(s))throw Error('bad chars');
 s=s.replace(/(\d|x|\))(?=x|\()/g,'$1*');
 s=s.replace(/\)(?=\d)/g,')*');
 return s;
};
BM.evalX=function(raw,x){try{const s=BM.prepareXExpr(raw);return Function('x',`"use strict";return (${s})`)(x)}catch(e){return NaN}};
BM.exprEquivalent=function(a,b){
 const pts=[-3.2,-2.1,-1.3,-.4,.6,1.4,2.7,3.3];let used=0;
 for(const x of pts){const va=BM.evalX(a,x),vb=BM.evalX(b,x);if(!Number.isFinite(va)||!Number.isFinite(vb))continue;used++;if(Math.abs(va-vb)>1e-7*Math.max(1,Math.abs(vb)))return false}
 return used>=4;
};
BM.factors=n=>{n=Math.abs(n);const out=[];for(let i=1;i<=n;i++)if(n%i===0)out.push(i);return out};
BM.updateStats=function(correct,attempted){
 const c=BM.$('correct'),a=BM.$('attempted'),acc=BM.$('accuracy');if(c)c.textContent=correct;if(a)a.textContent=attempted;if(acc)acc.textContent=attempted?`${Math.round(100*correct/attempted)}%`:'—';
};
BM.showFeedback=function(ok,correctText,method){
 const f=BM.$('feedback');if(!f)return;f.className='feedback '+(ok?'correct':'wrong');
 f.innerHTML=ok?'<div class="status">✓ Correct</div>':`<div class="status">✗ Incorrect</div>${correctText?`<div class="correct-answer-text">Correct answer: ${BM.displayMathHTML(correctText)}</div>`:''}${method?`<div class="method">${BM.displayMethodHTML(method)}</div>`:''}`;
 BM.typeset([f]);
};
BM.disableMathJaxInteractionInControls=function(){
 if(document.getElementById('bm-mathjax-control-style'))return;
 const style=document.createElement('style');style.id='bm-mathjax-control-style';
 style.textContent='button mjx-container,button mjx-container *,.choice mjx-container,.choice mjx-container *,.choice-grid mjx-container,.choice-grid mjx-container *{pointer-events:none!important;user-select:none!important;-webkit-user-select:none!important}';
 document.head.appendChild(style);
};
BM.setupMenu=function(){
 const b=document.querySelector('.menu-toggle'),m=document.querySelector('.dropdown');if(!b||!m)return;
 const sync=()=>b.setAttribute('aria-expanded',m.classList.contains('open')?'true':'false');
 b.addEventListener('click',e=>{e.stopPropagation();m.classList.toggle('open');sync()});document.addEventListener('click',()=>{m.classList.remove('open');sync()});m.addEventListener('click',e=>e.stopPropagation());document.addEventListener('keydown',e=>{if(e.key==='Escape'){m.classList.remove('open');sync()}});sync();
};
BM.localPreview=function(){
 if(location.protocol!=='file:')return;
 function fix(v){if(!v||/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(v))return v;let hash='',q='';const hi=v.indexOf('#');if(hi>=0){hash=v.slice(hi);v=v.slice(0,hi)}const qi=v.indexOf('?');if(qi>=0){q=v.slice(qi);v=v.slice(0,qi)}if(v.endsWith('/'))v+='index.html';return v+q+hash}
 document.querySelectorAll('a[href]').forEach(a=>a.setAttribute('href',fix(a.getAttribute('href'))));document.querySelectorAll('option[value]').forEach(o=>o.setAttribute('value',fix(o.getAttribute('value'))));
};
BM.choiceButtons=function(container,choices,onPick){
 container.innerHTML='';let selected=null;BM.shuffle(choices).forEach(choice=>{const b=document.createElement('button');b.type='button';b.className='choice';b.innerHTML=BM.displayMathHTML(choice.html??choice.text??choice.value);b.dataset.value=choice.value;b.addEventListener('click',()=>{if(container.dataset.locked==='1')return;container.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selected=choice.value;onPick?.(choice.value,b)});container.appendChild(b)});BM.typeset([container]);return ()=>selected;
};
BM.choiceEnter=function(){
 if(document.documentElement.dataset.bmChoiceEnter==='1')return;document.documentElement.dataset.bmChoiceEnter='1';
 document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
  const submit=BM.$('submit'),next=BM.$('next');
  if(next&&next.style.display&&next.style.display!=='none'&&getComputedStyle(next).display!=='none'){
   const locked=document.querySelector('[data-locked="1"]');
   if(locked){e.preventDefault();next.click();return}
  }
  if(!submit||submit.disabled||getComputedStyle(submit).display==='none')return;
  const selected=document.querySelector('.choice-grid .choice.selected'),active=document.activeElement;
  if(selected&&(active===selected||active?.closest?.('.choice-grid'))){e.preventDefault();submit.click();return}

  if(active&&active.matches('.feature-grid select')){
   const sels=[...document.querySelectorAll('.feature-grid select')].filter(x=>getComputedStyle(x).display!=='none');
   if(sels.length&&sels.every(x=>x.value)){e.preventDefault();submit.click()}
  }
 },true);
};
BM.exactListEqual=function(raw,expected,modulo){
 if(String(raw).includes('.'))return false;
 const parts=String(raw).split(/[,;]+/).map(s=>s.trim()).filter(Boolean);if(parts.length!==expected.length)return false;
 const vals=parts.map(BM.safeExactEval);if(vals.some(v=>!Number.isFinite(v)))return false;
 const norm=v=>modulo?((v%modulo)+modulo)%modulo:v;
 const A=vals.map(norm).sort((a,b)=>a-b),B=expected.map(norm).sort((a,b)=>a-b);
 return A.every((v,i)=>Math.abs(v-B[i])<1e-7);
};
window.BMPrep=BM;
document.addEventListener('DOMContentLoaded',()=>{BM.setupMenu();BM.localPreview();BM.choiceEnter();BM.disableMathJaxInteractionInControls();BM.ensureMathJax()});
})();

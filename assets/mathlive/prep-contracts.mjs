import {parseInput,batchmathToLatex} from './answer-adapter.mjs';
import {applicationExpression} from './applications-contracts.mjs';
import {im1Value,im1ToLatex} from './im1-contracts.mjs';
const degree=s=>String(s).replace(/\^\s*\{?\\circ\}?|\\degree|°/g,'°');
export function prepExact(source){
 const s=degree(source),word=s.trim().replace(/\\text\{([^{}]*)\}/g,'$1');
 if(/^(?:undefined|undef|dne)$/i.test(word))return{status:'complete',input:word};
 const result=applicationExpression(s.replace(/°/g,''));return{...result,input:result.input===null?null:result.input+(s.includes('°')?'°':'')};
}
export function prepExactToLatex(source){const s=String(source).trim();if(/^(?:undefined|undef|dne)$/i.test(s))return{status:'complete',latex:'\\text{'+s+'}'};const out=batchmathToLatex(s.replace(/°/g,''));return{...out,latex:out.latex===null?null:out.latex+(s.includes('°')?'^{\\circ}':'')};}
// Split lists only at the top level. Fraction groups stay with their item.
function split(s){let depth=0,parts=[],start=0;for(let i=0;i<s.length;i++){if('({['.includes(s[i]))depth++;else if(')}]'.includes(s[i]))depth--;else if(',;'.includes(s[i])&&!depth){parts.push(s.slice(start,i));start=i+1;}}parts.push(s.slice(start));return parts;}
function list(source,item){const parts=split(String(source)).map(item);return parts.some(p=>p.input===null)?{status:'incomplete',input:null}:{status:'complete',input:parts.map(p=>p.input).join(',')};}
function listLatex(source,item){const parts=split(String(source)).map(item);return parts.some(p=>p.latex===null)?{status:'unsupported',latex:null}:{status:'complete',latex:parts.map(p=>p.latex).join(',')};}
export const exactContract={translate:prepExact,toLatex:prepExactToLatex};
export const exactListContract={translate:s=>list(s,prepExact),toLatex:s=>listLatex(s,prepExactToLatex)};
export const coordinateContract={
 translate(source){const s=String(source).replace(/\\(?:left|right)/g,'').trim();if(!s||/^\\placeholder\{\}$/.test(s))return{status:'complete',input:''};const wrapped=s.startsWith('(')&&s.endsWith(')'),result=list(wrapped?s.slice(1,-1):s,prepExact);return{...result,input:result.input===null?null:'('+result.input+')'};},
 toLatex(source){const s=String(source).trim(),wrapped=s.startsWith('(')&&s.endsWith(')'),r=listLatex(wrapped?s.slice(1,-1):s,prepExactToLatex);return{...r,latex:r.latex===null?null:(wrapped?'(':'')+r.latex+(wrapped?')':'')};}
};
export const rrtContract={
 translate:s=>list(s,part=>{const value=part.trim().replace(/^\\pm\s*/,'±'),pm=value.startsWith('±'),r=im1Value(pm?value.slice(1):value);return{...r,input:r.input===null?null:(pm?'±':'')+r.input};}),
 toLatex:s=>listLatex(s,part=>{const value=part.trim().replace(/^\+\/-/,'±'),pm=value.startsWith('±'),r=im1ToLatex(pm?value.slice(1):value);return{...r,latex:r.latex===null?null:(pm?'\\pm ':'')+r.latex};})
};
export const coefficientContract={translate:s=>list(s,im1Value),toLatex:s=>listLatex(String(s).trim().replace(/[,;\s]+/g,','),im1ToLatex)};
export const polynomialContract={translate:applicationExpression,toLatex:batchmathToLatex};
export const literalContract={translate:im1Value,toLatex:im1ToLatex};
export const prepProfiles={
 'ml-prep-value':{fraction:true,decimal:true,radical:true,parentheses:true,arithmetic:true,operators:[['Undefined','undefined']]},
 'ml-prep-coordinates':{fraction:true,decimal:true,radical:true,parentheses:true,arithmetic:true,list:true},
 'ml-prep-radians':{fraction:true,decimal:true,parentheses:true,arithmetic:true,constants:['pi']},
 'ml-prep-degrees':{fraction:true,decimal:true,parentheses:true,arithmetic:true,operators:[['°','°']]},
 'ml-prep-solutions':{fraction:true,decimal:true,parentheses:true,arithmetic:true,constants:['pi'],list:true},
 'ml-prep-factor':{fraction:true,decimal:true,parentheses:true,arithmetic:true,exponent:true,variables:['x']},
 'ml-prep-algebra':{decimal:true,parentheses:true,arithmetic:true,variables:['x']},
 'ml-prep-coefficients':{decimal:true,list:true},
 'ml-prep-rrt':{fraction:true,decimal:true,list:true,operators:[['±','±']]},
 'ml-prep-quotient':{fraction:true,decimal:true,parentheses:true,arithmetic:true,exponent:true,variables:['x']},
 'ml-prep-remainder':{decimal:true}
};

// Factoring uses a syntactic parenthesis-count gate. Do not let generic
// fraction serialization invent two factor groups around numeric operands.
export function factoredTranslate(source){
 const parsed=parseInput(source,'latex');if(!String(source).trim()||parsed.tree?.type==='empty')return{...parsed,input:''};if(!parsed.tree)return{...parsed,input:null};
 function emit(n){
  if(n.type==='num')return{s:n.raw,p:5};if(n.type==='sym')return{s:n.name,p:5};
  if(n.type==='group'){const x=emit(n.value);return n.open==='{'?x:{s:n.open+x.s+n.close,p:5};}
  if(n.type==='unary'){const x=emit(n.value);return{s:n.op+(x.p<2?'('+x.s+')':x.s),p:2};}
  if(n.type==='fraction'||n.type==='binary'){
   const op=n.type==='fraction'?'/':n.op,a=emit(n.numerator||n.left),b=emit(n.denominator||n.right),p=op==='='?0:op==='+'||op==='-'?1:op==='^'?4:2;
   const left=a.p<p||op==='^'&&a.p===p?'('+a.s+')':a.s,right=b.p<p||(op==='/'||op==='-')&&b.p===p?'('+b.s+')':b.s;
   return{s:left+op+right,p};
  }
  throw Error('Unsupported polynomial notation');
 }
 try{return{...parsed,input:emit(parsed.tree).s};}catch{return{status:'unsupported',input:null};}
}
export const factoredContract={translate:factoredTranslate,toLatex:s=>String(s).trim()?im1ToLatex(s):{status:'complete',latex:''}};

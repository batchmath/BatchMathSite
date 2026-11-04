import {parseInput,toLatex,batchmathToLatex} from './answer-adapter.mjs';
import {applicationExpression} from './applications-contracts.mjs';
import {translateInterval,intervalToLatex} from './interval-adapter.mjs';
// Original IM1 value checkers accept literal numbers/fractions, not evaluated
// expressions. Preserve numerator and denominator, including unreduced forms.
function literal(n){
 if(n.type==='num')return n.raw;
 if(n.type==='unary'&&['+','-'].includes(n.op)){const v=literal(n.value);return v===null?null:n.op+v;}
 if(n.type==='fraction'||n.type==='binary'&&n.op==='/'){
  const a=n.numerator||n.left,b=n.denominator||n.right;
  const number=x=>x.type==='num'?x.raw:x.type==='unary'&&x.value.type==='num'?x.op+x.value.raw:null;
  const left=number(a),right=number(b);return left===null||right===null?null:left+'/'+right;
 }
 if(n.type==='binary'&&n.op==='='&&n.left.type==='sym'){const right=literal(n.right);return right===null?null:n.left.name+'='+right;}
 return null;
}
const text=s=>String(s).trim().replace(/\\(?:text|operatorname)\{([^{}]*)\}/g,'$1');
export function im1Value(source){
 const s=text(source).replace(/\\(?:varnothing|emptyset)(?![A-Za-z])/g,'∅'),prefix=s.match(/^[a-z]\s*=\s*/i)?.[0]||'',body=s.slice(prefix.length),word=body.toLowerCase().replace(/\s+/g,'');
 if(['nosolution','nosolutions','none','∅'].includes(word))return{status:'complete',input:s};
 if(['infinitesolutions','infinitelymanysolutions','allrealnumbers','allreals','undefined'].includes(word))return{status:'complete',input:s};
 // Keep currency/grouping marks: each unchanged checker owns their acceptance.
 const currency=s.replace(/\\\$/g,'$').replace(/\{,\}/g,',');
 if(/^\$?[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?$/.test(currency)&&/[,$]/.test(currency))return{status:'complete',input:currency};
 const parsed=parseInput(source,'latex');if(!parsed.tree)return{...parsed,input:null};if(!String(source).trim())return{...parsed,input:''};
 const result=literal(parsed.tree);return result===null?applicationExpression(source):{...parsed,input:result};
}
export function im1ToLatex(source){
 const s=String(source).trim(),prefix=s.match(/^[a-z]\s*=\s*/i)?.[0]||'',body=s.slice(prefix.length),word=body.toLowerCase().replace(/\s+/g,'');
 if(['nosolution','nosolutions','none','∅'].includes(word))return{status:'complete',latex:prefix+'\\text{No Solution}'};
 if(['infinitesolutions','infinitelymanysolutions','allrealnumbers','allreals'].includes(word))return{status:'complete',latex:prefix+'\\text{Infinite Solutions}'};
 if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/.test(s))return{status:'unsupported',latex:null,message:'Keep a legacy scientific numeric literal in its original editor.'};
 if(/^\$?[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?$/.test(s)&&/[,$]/.test(s))return{status:'complete',latex:s.replace(/\$/g,'\\$').replace(/,/g,'{,}')};
 const parsed=parseInput(source);
 if(!parsed.tree)return{...parsed,latex:null};
 function keepGroups(n){
  if(n.type==='binary'&&n.op==='/')return{type:'fraction',numerator:keepGroups(n.left),denominator:keepGroups(n.right)};
  const out={...n};for(const key of ['left','right','value','numerator','denominator'])if(n[key]&&typeof n[key]==='object')out[key]=keepGroups(n[key]);if(n.args)out.args=n.args.map(keepGroups);return out;
 }
 return{...parsed,latex:toLatex(keepGroups(parsed.tree))};
}
export const im1ValueContract={translate:im1Value,toLatex:im1ToLatex};
export const im1PolynomialContract={translate:applicationExpression,toLatex:batchmathToLatex};
export const im1IntervalContract={translate:s=>translateInterval(s,{translateEndpoint:im1Value}),toLatex:intervalToLatex};

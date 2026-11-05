import {im1Value,im1ValueContract,im1ToLatex} from './im1-contracts.mjs';
import {applicationExpression} from './applications-contracts.mjs';
// Protect only the sequence identifiers accepted by the original checker.
// The expression translator preserves operations and groups; it never solves
// a formula or combines terms. Source case is normalized before internal aliases.
function protect(source){
 let s=String(source).toLowerCase().replace(/\\quad/g,',').replace(/\\,/g,'').replace(/[−–—]/g,'-');
 return s.replace(/a(?:_\{n-1\}|_\(n-1\)|\(n-1\)|ₙ₋₁)/g,'P').replace(/a(?:_\{n\}|_?n|\(n\)|ₙ)/g,'A').replace(/a(?:_\{1\}|_?1|\(1\)|₁)/g,'B');
}
const restore=s=>s.replace(/P/g,'a_{n-1}').replace(/A/g,'a_n').replace(/B/g,'a_1');
function sequenceTranslate(source){
 const s=protect(source);if(s===null)return{status:'unsupported',input:null};
 const parts=s.split(/[,;]/).map(p=>{
  const initial=p.match(/^B\s*=\s*(.*)$/s),rule=p.match(/^A\s*=\s*P\s*([+-])(.*)$/s);
  if(initial){const r=im1Value(initial[1]);return{...r,input:r.input===null?null:'B='+r.input};}
  if(rule){const r=im1Value(rule[2]);return{...r,input:r.input===null?null:'A=P'+rule[1]+r.input};}
  return /[APBny=]/.test(p)?applicationExpression(p):im1Value(p);
 });
 return parts.some(p=>p.input===null)?{status:'incomplete',input:null}:{status:parts.every(p=>p.status==='complete')?'complete':'incomplete',input:restore(parts.map(p=>p.input).join(','))};
}
function sequenceToLatex(source){
 const s=protect(source);if(s===null)return{status:'unsupported',latex:null};
 const parts=s.split(/[,;]/).map(p=>im1ToLatex(p));
 return parts.some(p=>p.latex===null)?{status:'unsupported',latex:null}:{status:'complete',latex:restore(parts.map(p=>p.latex).join(','))};
}
export const sequenceContract={translate:sequenceTranslate,toLatex:sequenceToLatex};
function lineTranslate(source){
 const result=applicationExpression(source);
 // The line checker accepts literal a/b coefficients and -(a/b), but does
 // not accept the generic serializer's nested -((a)/(b)) spelling.
 // Remove only its numeric-operand wrappers; retain every operation/group.
 return{...result,input:result.input?.replace(/\(([+-]?(?:\d+(?:\.\d*)?|\.\d+))\)\/\(([+-]?(?:\d+(?:\.\d*)?|\.\d+))\)/g,'$1/$2')??null};
}
export const lineContract={translate:lineTranslate,toLatex:im1ToLatex};
export function unit3Contract(input){
 const kind=input.dataset.bmStructuredKind;
 if(['formula','recursive','recursive-rule','initial-term'].includes(kind))return{...sequenceContract,keypad:'ml-im1-u3-'+kind};
 if(kind==='line')return{...lineContract,keypad:input.id==='answer-model'?'ml-im1-u3-line-function':'ml-im1-u3-line'};
 return{...im1ValueContract,keypad:'ml-im1-u3-number'};
}
export const unit3Keypads={
 'ml-im1-u3-number':{fraction:true,decimal:true},
 'ml-im1-u3-initial-term':{fraction:true,decimal:true,operators:[['a₁','a₁']],equality:true},
 'ml-im1-u3-formula':{fraction:true,decimal:true,exponent:true,operators:[['aₙ','aₙ'],['f(n)','f(n)']],variables:['n','y'],arithmetic:true,parentheses:true,equality:true},
 'ml-im1-u3-recursive-rule':{fraction:true,decimal:true,operators:[['aₙ','aₙ'],['aₙ₋₁','aₙ₋₁']],arithmetic:true,equality:true},
 'ml-im1-u3-recursive':{fraction:true,decimal:true,recursive:true,arithmetic:true,equality:true},
 'ml-im1-u3-line-function':{fraction:true,decimal:true,equation:true,variables:['x','y'],arithmetic:true,parentheses:true,equality:true},
 'ml-im1-u3-line':{fraction:true,decimal:true,variables:['x','y'],arithmetic:true,parentheses:true,equality:true}
};

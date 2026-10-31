import {translateAdvancedExpression,batchmathToLatex} from './answer-adapter.mjs';
// Only interval punctuation is handled here; endpoints use the restricted
// expression translator. The original checker owns order, brackets and domain.
function convert(source,latex){
 let s=String(source).trim();if(!s)return '';
 s=s.replace(/\\(?:left|right|displaystyle)/g,'').replace(/\\(?:,|;|!| )/g,'').replace(/\\(?:leq|le)(?![A-Za-z])/g,'<=').replace(/\\(?:geq|ge)(?![A-Za-z])/g,'>=').replace(/\\theta(?![A-Za-z])/g,'θ').replace(/[−–]/g,'-');
 const endpoint=value=>{
  if(!value.trim())throw Error('Complete both endpoints.');
  const r=latex?translateAdvancedExpression(value):batchmathToLatex(value);
  if(r.status!=='complete')throw Error(r.message||'Complete the endpoint.');
  return latex?r.input:r.latex;
 };
 return s.split(/\\cup|∪|\s+U\s+/).map(piece=>{
  const p=piece.trim();
  if(/^[([]/.test(p)&&/[)\]]$/.test(p)){
   const inner=p.slice(1,-1);let depth=0,comma=-1;
   for(let i=0;i<inner.length;i++){const c=inner[i];if('({['.includes(c))depth++;else if(')}]'.includes(c))depth--;else if(c===','&&depth===0){if(comma!==-1)throw Error('Use two endpoints.');comma=i;}if(depth<0)throw Error('Finish the endpoint grouping.');}
   if(depth||comma<0)throw Error('Complete the interval.');
   return p[0]+endpoint(inner.slice(0,comma))+','+endpoint(inner.slice(comma+1))+p.at(-1);
  }
  const m=p.replace(/\s+/g,'').match(/^(?:(.+?)(<=|<))?([xytθ])(?:(<=|<|>=|>)(.+))?$/);
  if(m&&(m[1]!==undefined||m[4]!==undefined))return (m[1]!==undefined?endpoint(m[1])+m[2]:'')+m[3]+(m[4]!==undefined?m[4]+endpoint(m[5]):'');
  throw Error('Use interval or supported inequality notation.');
 }).join(latex?'∪':'\\cup ');
}
export function translateInterval(source){
 try{return {status:'complete',input:convert(source,true)};}
 catch(error){return {status:'unsupported',input:null,message:error.message};}
}
export function intervalToLatex(source){
 try{return {status:'complete',latex:convert(source,false)};}
 catch(error){return {status:'unsupported',latex:null,message:error.message};}
}

import {translateAdvancedExpression,batchmathToLatex} from './answer-adapter.mjs';
const allowed=new Set(['lim','sum','frac','dfrac','tfrac','sqrt','sin','cos','tan','sec','csc','cot','ln','log','exp','pi','infty','to','rightarrow','cdot','times','left','right','displaystyle','textstyle','limits','nolimits',',',';','!',' ']);
// Canonicalize only TeX argument shells. In particular \frac12 remains 1/2;
// no bound, factor, index or differential is discarded or evaluated.
export function canonicalNewtonLatex(source){
  const s=String(source);if(s.length>5000)throw Error('Expression is too long.');let at=0,missing=false;
  const spaces=()=>{while(/\s/.test(s[at]||'')&&at<s.length)at++;};
  function argument(){
    spaces();if(at>=s.length){missing=true;return '';}
    if(s[at]==='{'){at++;return sequence(true);}
    if(s[at]==='\\')return command();
    return s[at++];
  }
  function command(){
    const match=/^\\([A-Za-z]+|.)/.exec(s.slice(at));if(!match)throw Error('Finish the command.');at+=match[0].length;const name=match[1];
    if(name==='placeholder'){argument();missing=true;return '\\placeholder{}';}
    if(!allowed.has(name))throw Error('This notation is not accepted by the Newton answer checker.');
    if(['frac','dfrac','tfrac'].includes(name))return '\\frac{'+argument()+'}{'+argument()+'}';
    if(name==='sqrt'){
      spaces();if(s[at]==='[')throw Error('Use fractional powers for indexed roots in this field.');
      return '\\sqrt{'+argument()+'}';
    }
    if(['limits','nolimits','displaystyle','textstyle'].includes(name))return '';
    return '\\'+name;
  }
  function sequence(group=false){
    let out='';while(at<s.length){
      const c=s[at];if(c==='}'){if(!group)throw Error('Unexpected closing group.');at++;if(!out.trim())missing=true;return out;}
      if(c==='\\'){out+=command();continue;}
      // Bare TeX groups are grouping, not fraction/header argument shells.
      // Parentheses keep that scope while allowing the existing normalizer to
      // process arbitrarily nested fractions from MathLive's serialization.
      if(c==='{'){at++;out+='('+sequence(true)+')';continue;}
      if(c==='^'||c==='_'){at++;out+=c+'{'+argument()+'}';continue;}
      out+=c;at++;
    }
    if(group)missing=true;return out;
  }
  const latex=sequence().replace(/\\(sum|lim)\s+(?=[_^])/g,'\\$1');return {latex,missing};
}
export function translateNewtonLatex(source,normalize){
  if(!/\\(?:lim|sum)(?![A-Za-z])/.test(source))return translateAdvancedExpression(source);
  try{
    const {latex,missing}=canonicalNewtonLatex(source);
    if(missing)return {status:'incomplete',input:null,message:'Complete the bounds and summand.'};
    const input=normalize(latex);
    if(/[_\\]/.test(input))return {status:'unsupported',input:null,message:'Use the explicit expression in k and n required by this checker.'};
    return {status:'complete',input,latex};
  }catch(error){return {status:'unsupported',input:null,message:error.message};}
}
export function newtonToLatex(source,read){
  if(!/\b(?:sum|lim)\s*\(/i.test(source))return batchmathToLatex(source);
  try{
    const parsed=read(source);if(!parsed.complete||parsed.outer!=='@')throw Error('Keep this legacy notation in the standard editor.');
    const part=value=>{const r=batchmathToLatex(value);if(r.latex===null)throw Error(r.message);return r.latex;};
    let latex=`\\sum_{${part(parsed.index[0])}=${part(parsed.index[1])}}^{${part(parsed.upper)}}${part(parsed.body)}`;
    if(parsed.limit)latex=`\\lim_{${part(parsed.limit[0])}\\to ${part(parsed.limit[1])}}`+latex;
    return {status:'complete',latex};
  }catch(error){return {status:'unsupported',latex:null,message:error.message};}
}

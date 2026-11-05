import {batchmathToLatex,translateAdvancedExpression} from './answer-adapter.mjs';
import {translateInterval,intervalToLatex} from './interval-adapter.mjs';
const plain=s=>String(s).trim().replace(/\\(?:text|mathrm)\{([^{}]*)\}/g,'$1').replace(/\\(?:,|;|!| )/g,' ').replace(/[−–]/g,'-');
const none=/^(?:none|never|no\s*(?:times?|values?|solutions?|intervals?)|∅|\{\s*\})$/i;
const dna=/^(?:does\s*not\s*apply|dna|none)$/i;
// Preserve punctuation and spelling; unchanged checkers own set equality,
// duplicates, exactness, rounding and whether an empty set is correct.
export function exactList(source,{doesNotApply=false,rounded=false,itemTranslate=translateAdvancedExpression}={}){
 const text=plain(source);if(!text)return{status:'complete',input:''};
 if((doesNotApply?dna:none).test(text))return{status:'complete',input:text};
 let normalized=String(source).replace(/\\(?:left|right)/g,'').replace(/\\(?:lbrace|\{)/g,'{').replace(/\\(?:rbrace|\})/g,'}').replace(/\\(?:text|operatorname)\{and\}|\band\b/gi,',');
 // Strip a set wrapper only when its opening brace encloses the whole list.
 // MathLive also emits adjacent braced bases/exponents: {e}^{...}.
 if(normalized[0]==='{'){let level=0,close=-1;for(let i=0;i<normalized.length;i++){if(normalized[i]==='{')level++;else if(normalized[i]==='}'&&!--level){close=i;break;}}if(close===normalized.length-1)normalized=normalized.slice(1,-1);}
 const segments=[];let depth=0,start=0;
 for(let i=0;i<normalized.length;i++){if('({['.includes(normalized[i]))depth++;else if(')}]'.includes(normalized[i]))depth--;else if(!depth&&',;'.includes(normalized[i])){segments.push(normalized.slice(start,i));start=i+1;}}
 segments.push(normalized.slice(start));
 const convert=item=>{
  if(!item.trim())return{status:'incomplete',input:''};
  const pm=item.split(/\\pm(?![A-Za-z])|±/);
  if(doesNotApply&&pm.length===2&&!/Q/.test(item)){
   // Carry the operator through fraction/group serialization. No expansion:
   // the original exact-list checker still interprets ± itself.
   const result=translateAdvancedExpression(item.replace(/\\pm(?![A-Za-z])|±/,'+Q*'));
   if(result.input===null)return result;
   const input=result.input.replace(/\+Q\*/g,'±');
   return input.includes('Q')?{status:'unsupported',input:null,message:'Complete the ± expression.'}:{...result,input};
  }
  return(rounded?roundedNumber:itemTranslate)(item);
 };
 const converted=segments.map(convert),bad=converted.find(x=>x.input===null);if(bad)return bad;
 return{status:converted.every(x=>x.status==='complete')?'complete':'incomplete',input:converted.map(x=>x.input).join(',')};
}
export function intervalsWithNone(source){const s=plain(source);return none.test(s)?{status:'complete',input:s}:translateInterval(source);}
export function intervalsWithNoneToLatex(source){return none.test(String(source).trim())?{status:'complete',latex:'\\text{'+source+'}'}:intervalToLatex(source);}
export function listToLatex(source){const s=String(source).trim();return none.test(s)||dna.test(s)?{status:'complete',latex:'\\text{'+s+'}'}:batchmathToLatex(source);}
export function roundedNumber(source){
 const s=plain(source).replace(/\\([$%])/g,'$1');
 // Retain optional decorations already accepted by the numeric checker.
 // Never evaluate a fraction, power or calculator expression into a decimal.
 if(/^[+-]?\s*\$?\s*[+-]?\s*(?:\d{1,3}(?:,\d{3})+|\d*)(?:\.\d*)?\s*(?:dollars?|years?|weeks?|days?|hours?|minutes?|mg|milligrams?|grams?|units?|%|percent|°\s*[CF]?|degrees?)?$/i.test(s)&&/\d/.test(s))return{status:'complete',input:s};
 return translateAdvancedExpression(source);
}

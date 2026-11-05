import {parseInput,toLatex,batchmathToLatex,translateAdvancedExpression} from './answer-adapter.mjs';
import {exactList} from './structured-contracts.mjs';
import {translateInterval,intervalToLatex} from './interval-adapter.mjs';
// Make implicit products explicit. The numeric renderer tries Number() first,
// so emitting adjacent e/digits would otherwise mean scientific notation.
// Preserve groups, decimal spelling and operations; never evaluate or simplify.
export function applicationExpression(source,{line=false}={}){
 const approximate=String(source).trim().match(/^(?:\\approx(?![A-Za-z])|≈)\s*(.*)$/s);
 if(approximate){const r=applicationExpression(approximate[1],{line});return{...r,input:r.input===null?null:'≈'+r.input};}
 const parsed=parseInput(source,'latex',{logBases:true});if(!String(source).trim())return{...parsed,input:''};if(!parsed.tree)return{...parsed,input:null};
 function lower(n){
  if(n.type==='call'&&(n.name==='root'||n.name==='cbrt'||line&&n.name==='sqrt')){
   const index=n.name==='root'?lower(n.args[0]):{type:'num',raw:n.name==='cbrt'?'3':'2'},value=lower(n.args[n.name==='root'?1:0]);
   return{type:'binary',op:'^',left:{type:'group',open:'(',close:')',value},right:{type:'fraction',numerator:{type:'num',raw:'1'},denominator:index}};
  }
  const out={...n};if(n.type==='binary'&&n.op==='*')out.implicit=false;
  for(const k of ['left','right','value','numerator','denominator'])if(n[k]&&typeof n[k]==='object')out[k]=lower(n[k]);if(n.args)out.args=n.args.map(lower);if(n.items)out.items=n.items.map(lower);
  return out;
 }
 return translateAdvancedExpression(toLatex(lower(parsed.tree)));
}
export function numericToLatex(source){
 const approximate=String(source).trim().match(/^≈\s*(.*)$/s);if(approximate){const r=numericToLatex(approximate[1]);return{...r,latex:r.latex===null?null:'\\approx '+r.latex};}
 const infinity=String(source).trim().match(/^([+-]?)inf(?:inity)?$/i);
 if(infinity)return{status:'complete',latex:(infinity[1]==='-'?'-':'')+'\\infty'};
 const s=String(source).trim(),science=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[eE]([+-]?\d+)$/);
 if(/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(s))return{status:'complete',latex:s.replace(/,/g,'{,}')};
 return science?{status:'complete',latex:science[1]+'\\cdot 10^{'+science[2]+'}'}:batchmathToLatex(source);
}
export function applicationNumber(source){
 const s=String(source).trim().replace(/^\\approx(?![A-Za-z])\s*/,'≈').replace(/\{,\}/g,',');
 if(/^≈?\s*[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(s))return{status:'complete',input:s};
 return applicationExpression(source);
}
const unionAlias=source=>String(source).replace(/([)\]])U(?=[([])/g,'$1∪');
export function applicationInterval(source){return translateInterval(unionAlias(source),{translateEndpoint:applicationExpression});}
export function applicationIntervalToLatex(source){return intervalToLatex(unionAlias(source),{formatEndpoint:numericToLatex});}
export function applicationList(source){return exactList(source,{itemTranslate:applicationExpression});}
export function applicationListToLatex(source){
 // Only top-level legacy numerical scientific literals have Number semantics.
 const parts=String(source).split(/[,;]/),out=parts.map(p=>{const m=p.trim().match(/^([a-z]\s*=\s*)?(.*)$/i),r=numericToLatex(m[2]);return r.latex===null?null:(m[1]||'')+r.latex;});
 return out.some(x=>x===null)?{status:'unsupported',latex:null}:{status:'complete',latex:out.join(',')};
}
export function applicationPair(source){
 const s=String(source).trim().replace(/\\(?:left|right)/g,'');if(!s)return{status:'complete',input:''};
 if(s[0]!=='('||s.at(-1)!==')')return{status:'unsupported',input:null,message:'Enter an ordered pair.'};
 const body=s.slice(1,-1);let depth=0,comma=-1;
 for(let i=0;i<body.length;i++){if('({['.includes(body[i]))depth++;else if(')}]'.includes(body[i]))depth--;else if(body[i]===','&&!depth){if(comma>=0)return{status:'unsupported',input:null,message:'Enter two coordinates.'};comma=i;}}
 if(comma<0)return{status:'incomplete',input:null,message:'Enter both coordinates.'};
 const a=applicationExpression(body.slice(0,comma)),b=applicationExpression(body.slice(comma+1));return a.input===null||b.input===null?{status:'unsupported',input:null}:{status:a.status==='complete'&&b.status==='complete'?'complete':'incomplete',input:'('+a.input+','+b.input+')'};
}

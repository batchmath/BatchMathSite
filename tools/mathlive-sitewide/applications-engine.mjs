import fs from 'node:fs';import vm from 'node:vm';import {root,rng} from './unit2-engine.mjs';import {instrument} from '../mathlive-advanced-pilot/engine.mjs';export {root,rng};
export const routes=fs.readdirSync(root+'ap-calculus/unit-3-applications-derivative/topics',{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name!=='comprehensive-review').flatMap(x=>fs.readdirSync(root+'ap-calculus/unit-3-applications-derivative/topics/'+x.name,{withFileTypes:true}).filter(v=>v.isDirectory()&&v.name.endsWith('practice')).map(v=>({path:'ap-calculus/unit-3-applications-derivative/topics/'+x.name+'/'+v.name+'/index.html',slug:x.name,mode:v.name==='calculator-practice'||x.name==='using-your-graphing-calculator'||x.name.startsWith('newton-')?'calculator':'noncalculator'})));
export class Node{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.dataset={};this.listeners={};this.attributes={};this.value='';this.className='';this.disabled=false;this.hidden=false;this._html='';}
 get innerHTML(){return this._html}set innerHTML(s){this._html=s;this.children=[];}
 get classList(){const node=this;return{contains:v=>node.className.split(/\s+/).includes(v),add:(...v)=>node.className=[...new Set([...node.className.split(/\s+/),...v])].filter(Boolean).join(' '),remove:(...v)=>node.className=node.className.split(/\s+/).filter(x=>!v.includes(x)).join(' '),toggle(v,b){b??=!this.contains(v);b?this.add(v):this.remove(v);}}}
 append(...items){for(const x of items){if(!x||typeof x==='string')continue;x.parentElement=this;this.children.push(x);}}appendChild(x){this.append(x);return x;}prepend(x){x.parentElement=this;this.children.unshift(x);}insertBefore(x,b){x.parentElement=this;this.children.splice(this.children.indexOf(b),0,x);}
 setAttribute(k,v){this.attributes[k]=v;if(k==='id')this.id=v;}getAttribute(k){return this.attributes[k]??null;}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}click(){for(const fn of this.listeners.click||[])fn({target:this,preventDefault(){},stopPropagation(){}});}
 focus(){}matches(s){if(s.includes(','))return s.split(',').some(x=>this.matches(x.trim()));const tag=s.match(/^[a-z]+/i)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;const classes=[...s.matchAll(/\.([\w-]+)/g)].map(x=>x[1]);return classes.every(x=>this.classList.contains(x));}
 querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
const clone=v=>v&&typeof v==='object'?Array.isArray(v)?v.map(clone):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clone(x)])):v;
export function engine(route){const els={};const el=id=>els[id]??=Object.assign(new Node(),{id,textContent:id.includes('count')?'0':''});
 const b={console,Math:Object.create(Math),URLSearchParams,Promise,requestAnimationFrame(){},NodeFilter:{SHOW_TEXT:4},setTimeout(){},location:{search:''},BM_TOPIC_PRACTICE:{slug:route.slug,defaultMode:route.mode,unit3:true},BatchMathRNG:{random:rng(1)},document:{createTreeWalker(){return{nextNode(){return false}}},getElementById:el,createElement:t=>new Node(t),querySelectorAll(){return[]},addEventListener(){}}};b.window=b;b.Math.random=()=>b.BatchMathRNG.random();b.document.activeElement=null;vm.createContext(b);
 for(const n of ['answer-normalization','derivative-expression-checker','line-equation-checker','unit4-exact-answers','ap-topic-generators','unit3-applications-generators','unit3-optimization-related-rates']){
  let source=fs.readFileSync(root+'assets/'+n+'.js','utf8');
  if(n==='unit3-optimization-related-rates')source=source.replace('})();','window.unit3FamilyQA={optimization:optimizationAssignment.concat(optimizationTest,optimizationExtension),related:relatedAssignment.concat(relatedTest,relatedExtension)};})();');
  vm.runInContext(source,b,{filename:n+'.js'});
 }
 let mount;b.BatchMathCalculusKeypad={mountInputs(inputs,host,options){mount={inputs,host,options};},focus(){},reset(){}};
 vm.runInContext(instrument(fs.readFileSync(root+'assets/ap-topic-practice.js','utf8')),b,{filename:'ap-topic-practice.js'});
 return{b,el,get mount(){return mount},load(problem){mount=null;b.advancedQA.load(clone(problem));},generate(seed,extra={}){b.BatchMathRNG={random:rng(seed)};return b.BatchMathAPTopicGenerators.get(route.slug)({mode:route.mode,...extra});},snapshot(){return{feedback:el('feedback').innerHTML+el('choices').querySelectorAll('.staged-feedback').map(n=>n.innerHTML).join(''),disabled:mount?.inputs.map(x=>x.disabled),answered:b.advancedQA.current.answered};}};
}
export function expected(problem){const first=v=>Array.isArray(v)?v[0]:v;
 switch(problem.answerType){
 case 'numeric':return [Number(problem.requiredDecimals)?Number(problem.numericAnswer).toFixed(Number(problem.requiredDecimals)):String(problem.numericAnswer)];
 case 'exact-expression':return [String(first(problem.acceptedExpressions||problem.expressionAnswer))];
 case 'line-equation':return [problem.lineAnswer?.equation||problem.answerTex];
 case 'value-list':return [(problem.valueList?.values||[]).join(',')||'None'];
 case 'interval-answer':{const spec=problem.intervalAnswer,places=Number(spec.requiredDecimals||0);return [places?spec.expected.replace(/([(\[,])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(?=[,\])])/gi,(_,open,value)=>open+Number(value).toFixed(places)):spec.expected];}
 case 'rounded-line-fields':return problem.roundedLines.map(f=>f.variable+'='+f.answerText);
 case 'coordinate-fields':return ['x','y'].map(k=>String(first(problem.pointAnswer[k])));
 case 'ordered-pair':return ['('+first(problem.pointAnswer.x)+','+first(problem.pointAnswer.y)+')'];
 case 'extremum-fields':return ['value','location'].map(k=>String(first(problem.extremumAnswer[k])));
 case 'calculus-fields':return problem.fields.map(f=>Number(f.requiredDecimals)?Number(f.numericAnswer??f.answer).toFixed(Number(f.requiredDecimals)):String(first(f.acceptedExpressions??f.answer??f.numericAnswer)));
 default:return null;
 }
}

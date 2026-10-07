(function(global){
'use strict';

/*
 * Small, purpose-built linear-equation parser for typed Unit 3 answers.
 * It accepts equivalent slope-intercept, point-slope, and standard forms,
 * including fractions, pi/e constants, and implicit multiplication.
 */
const EPS=1e-8;
const V=(x=0,y=0,c=0)=>({x:Number(x),y:Number(y),c:Number(c)});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.c+b.c);
const neg=a=>V(-a.x,-a.y,-a.c);
const sub=(a,b)=>add(a,neg(b));
const scale=(a,k)=>V(a.x*k,a.y*k,a.c*k);
const constant=a=>Math.abs(a.x)<EPS&&Math.abs(a.y)<EPS;

function balancedGroup(source,start){
  if(source[start]!=='{')return null;
  let depth=0;
  for(let i=start;i<source.length;i++){
    if(source[i]==='{')depth++;
    else if(source[i]==='}'&&--depth===0)return{body:source.slice(start+1,i),end:i+1};
  }
  return null;
}
function expandTexFractions(source){
  let s=String(source),guard=0;
  while(/\\(?:d?frac|tfrac)\s*\{/.test(s)&&guard++<20){
    const match=/\\(?:d?frac|tfrac)\s*\{/.exec(s);if(!match)break;
    const firstStart=s.indexOf('{',match.index),a=balancedGroup(s,firstStart);if(!a)break;
    let secondStart=a.end;while(/\s/.test(s[secondStart]||''))secondStart++;
    const b=balancedGroup(s,secondStart);if(!b)break;
    s=s.slice(0,match.index)+`((${expandTexFractions(a.body)})/(${expandTexFractions(b.body)}))`+s.slice(b.end);
  }
  return s;
}
function normalize(raw){
  let s=global.BatchMathAnswers?.normalizeFractionSigns?.(String(raw??''))??String(raw??'');
  s=expandTexFractions(s)
    .replace(/\\left|\\right/g,'')
    .replace(/\\(?:,|;|!)/g,'')
    .replace(/\\cdot|\\times|·|×/g,'*')
    .replace(/\\pi|π/g,'pi')
    .replace(/[−–—]/g,'-')
    .replace(/\^\{([^{}]+)\}/g,'^($1)')
    .replace(/[{}]/g,m=>m==='{'?'(':')')
    .replace(/\s+/g,'')
    .toLowerCase();
  return s;
}
function rawTokens(source){
  const out=[];let s=source;
  while(s.length){
    const m=s.match(/^(?:\d+(?:\.\d*)?|\.\d+|pi|[exy]|[()+\-*/^])/);
    if(!m)throw new Error('Use only x, y, numbers, fractions, pi, e, and arithmetic symbols.');
    const value=m[0];s=s.slice(value.length);
    out.push(/^\d|^\./.test(value)?{type:'number',value:Number(value)}:/^(?:pi|e|x|y)$/.test(value)?{type:'name',value}:{type:value,value});
  }
  return out;
}
function tokenize(source){
  const raw=rawTokens(source),out=[];
  const ends=t=>t&&(t.type==='number'||t.type==='name'||t.type===')');
  const starts=t=>t&&(t.type==='number'||t.type==='name'||t.type==='(');
  for(const token of raw){if(ends(out.at(-1))&&starts(token))out.push({type:'*',value:'*'});out.push(token);}
  return out;
}
function parseExpression(source){
  const tokens=tokenize(source);let i=0;
  const peek=()=>tokens[i],take=type=>peek()?.type===type?tokens[i++]:null;
  function primary(){
    const n=take('number');if(n)return V(0,0,n.value);
    const name=take('name');if(name){if(name.value==='x')return V(1,0,0);if(name.value==='y')return V(0,1,0);return V(0,0,name.value==='pi'?Math.PI:Math.E);}
    if(take('(')){const value=expression();if(!take(')'))throw new Error('A parenthesis is not closed.');return value;}
    throw new Error('Enter a complete equation.');
  }
  function power(){
    let left=primary();
    if(take('^')){const right=unary();if(!constant(left)||!constant(right))throw new Error('The submitted equation is not linear in x and y.');left=V(0,0,Math.pow(left.c,right.c));}
    return left;
  }
  function unary(){if(take('+'))return unary();if(take('-'))return neg(unary());return power();}
  function term(){
    let left=unary();
    while(peek()?.type==='*'||peek()?.type==='/'){
      const op=tokens[i++].type,right=unary();
      if(op==='*'){
        if(constant(left))left=scale(right,left.c);
        else if(constant(right))left=scale(left,right.c);
        else throw new Error('The submitted equation is not linear in x and y.');
      }else{
        if(!constant(right)||Math.abs(right.c)<EPS)throw new Error('A line may only be divided by a nonzero constant.');
        left=scale(left,1/right.c);
      }
    }
    return left;
  }
  function expression(){let left=term();while(peek()?.type==='+'||peek()?.type==='-'){const op=tokens[i++].type,right=term();left=op==='+'?add(left,right):sub(left,right);}return left;}
  const value=expression();if(i!==tokens.length)throw new Error('The equation contains an unsupported symbol.');
  if(![value.x,value.y,value.c].every(Number.isFinite))throw new Error('The equation does not have finite coefficients.');
  return value;
}
function parseEquation(raw){
  const s=normalize(raw),parts=s.split('=');
  if(parts.length!==2||!parts[0]||!parts[1])return{ok:false,error:'Enter a complete equation containing exactly one equals sign.'};
  try{
    const line=sub(parseExpression(parts[0]),parseExpression(parts[1]));
    if(Math.hypot(line.x,line.y)<EPS)return{ok:false,error:'Enter an equation of a line, not an identity or constant statement.'};
    return{ok:true,line,normalized:s};
  }catch(error){return{ok:false,error:error.message||'Enter a valid linear equation.'};}
}
function normalizedLine(line){
  const length=Math.hypot(line.x,line.y,line.c);if(length<EPS)return null;
  let out=V(line.x/length,line.y/length,line.c/length);
  const first=[out.x,out.y,out.c].find(v=>Math.abs(v)>EPS)||1;if(first<0)out=scale(out,-1);
  return out;
}
function equivalent(a,b){
  const A=normalizedLine(a),B=normalizedLine(b);return!!A&&!!B&&Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.c-B.c))<2e-7;
}
function requiredPrefix(raw,variable){
  if(!variable)return true;
  const compact=String(raw??'').replace(/[−–—]/g,'-').replace(/\\left|\\right/g,'').replace(/\s+/g,'').toLowerCase();
  return compact.startsWith(variable+'=')&&compact.indexOf('=')===compact.lastIndexOf('=');
}
function check(raw,answer){
  const submitted=parseEquation(raw);if(!submitted.ok)return{valid:false,correct:false,message:submitted.error};
  const expected=parseEquation(answer?.equation||'');if(!expected.ok)return{valid:false,correct:false,message:'This generated answer could not be checked.'};
  const variable=answer?.requiredVariable||'';
  const prefixCorrect=requiredPrefix(raw,variable);
  const sameLine=equivalent(submitted.line,expected.line);
  let message='';
  if(!prefixCorrect)message=variable==='y'?'Write a horizontal tangent line in the form y = constant.':'Write a vertical tangent line in the form x = constant.';
  return{valid:true,correct:prefixCorrect&&sameLine,prefixCorrect,sameLine,message,line:submitted.line};
}

global.BatchMathLineEquations=Object.freeze({normalize,parseEquation,equivalent,check});
})(window);

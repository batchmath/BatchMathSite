// Unit 6 integral setups typed as ONE MathLive expression (v12.9.C), e.g. \pi\int_{0}^{3}\left(R^2-r^2\right)\,dx or a
// sum of definite integrals. Structural translation only: each integral's coefficient, limits, integrand and variable
// are found in the LaTeX, each piece is translated by the shared expression translator, and the setup is written in
// the linear form the Unit 6 checker reads (unit6-core parseSetup):
//   [coefficient*]int(lower,upper,integrand,x) ± ...
// Nothing is graded or simplified here. Limits keep their typed digits (calculator precision). A piece that is still a
// placeholder is left empty and a piece the translator cannot read becomes "?", so the checker can say what to fix;
// the status is then "incomplete" rather than "unsupported", which keeps the student in this field.
import {translateAdvancedExpression,batchmathToLatex} from './answer-adapter.mjs';

const SPACING=new Set([',',';','!',' ','quad','qquad','thinspace','medspace','thickspace']);
// LaTeX -> tokens: {kind:'cmd',name} | {kind:'group',raw,inner} | {kind:'ch',ch}; raw keeps the source text
function lex(source){
  const s=String(source),out=[];let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue;}
    if(ch==='\\'){const m=/^\\([a-zA-Z]+|.)/.exec(s.slice(i));if(!m)return null;out.push({kind:'cmd',name:m[1],raw:m[0]});i+=m[0].length;continue;}
    if(ch==='{'){let d=0,j=i;for(;j<s.length;j++){if(s[j]==='\\'){j++;continue;}if(s[j]==='{')d++;else if(s[j]==='}'){d--;if(!d)break;}}
      if(j>=s.length)return null;out.push({kind:'group',raw:s.slice(i,j+1),inner:s.slice(i+1,j)});i=j+1;continue;}
    out.push({kind:'ch',ch,raw:ch});i++;
  }
  return out;
}
// rejoin tokens; a command name is followed by a space so \cos x does not become \cosx
const raw=ts=>ts.map(t=>t.kind==='cmd'&&/^[a-zA-Z]+$/.test(t.name)?t.raw+' ':t.raw).join('');
const isSpace=t=>t?.kind==='cmd'&&SPACING.has(t.name);
const isInt=t=>t?.kind==='cmd'&&['int','intop'].includes(t.name);
// a differential d at k (d, \mathrm{d}, \operatorname{d}, \text{d}, \mathit{d}, \differentialD): the index after it, or -1
function differentialAt(ts,k){
  const t=ts[k];
  if(t?.kind==='ch'&&t.ch==='d')return k+1;
  if(t?.kind==='cmd'&&t.name==='differentialD')return k+1;
  if(t?.kind==='cmd'&&['mathrm','operatorname','text','mathit','textrm'].includes(t.name)&&ts[k+1]?.kind==='group'&&ts[k+1].inner.trim()==='d')return k+2;
  return -1;
}
// one piece of LaTeX -> linear text: '' when empty or only placeholders, '?' when unreadable
function piece(ts){
  const src=raw(ts).trim();
  if(!src.replace(/\\placeholder\{[^{}]*\}/g,'').replace(/\\[,;! ]/g,'').trim())return{text:'',complete:false};
  const r=translateAdvancedExpression(src);
  if(r.status==='complete'&&r.input!=null&&r.input!=='')return{text:r.input,complete:true};
  return{text:'?',complete:false};
}
// a subscript or superscript argument: a braced group or a single token (\int_0^2, \int_{-1}^{\pi})
function argument(ts,k){
  const t=ts[k];if(!t)return{ts:[],next:k};
  if(t.kind==='group')return{ts:lex(t.inner)||[],next:k+1};
  if(t.kind==='cmd'&&t.name==='placeholder'&&ts[k+1]?.kind==='group')return{ts:[t,ts[k+1]],next:k+2};
  return{ts:[t],next:k+1};
}

export function translateIntegralSetup(source){
  const text=String(source??'');
  if(!text.trim()||!text.replace(/\\placeholder\{[^{}]*\}/g,'').trim())return{status:'complete',input:''};
  const ts=lex(text.replace(/\\(?:displaystyle|limits|nolimits)/g,''));
  if(!ts)return{status:'incomplete',input:'?',message:'Finish the expression.'};
  if(!ts.some(isInt)){ // not an integral at all: pass the expression on, so the checker can say to write an integral
    const p=piece(ts);return{status:p.complete?'complete':'incomplete',input:p.text||'?'};
  }
  const terms=[];let k=0,complete=true;
  const depthDelta=t=>t.kind==='ch'?('(['.includes(t.ch)?1:')]'.includes(t.ch)?-1:0):t.kind==='cmd'?(t.name==='left'?1:t.name==='right'?-1:0):0;
  while(k<ts.length){
    // optional sign, then the coefficient up to \int
    let sign='+';
    while(k<ts.length&&(isSpace(ts[k])||ts[k].kind==='ch'&&'+-'.includes(ts[k].ch))){if(ts[k].kind==='ch'&&ts[k].ch==='-')sign=sign==='-'?'+':'-';k++;}
    const coef=[];let depth=0;
    while(k<ts.length&&!(depth===0&&isInt(ts[k]))){
      const t=ts[k];depth+=depthDelta(t);
      if(depth===0&&t.kind==='ch'&&'+-'.includes(t.ch)&&coef.length)break; // a term with no integral
      coef.push(t);k++;
    }
    if(k>=ts.length||!isInt(ts[k])){ // no integral in this term: pass the term through as plain text
      const p=piece(coef);terms.push({sign,linear:p.text||'?'});complete=false;continue;
    }
    k++;
    // limits: _lower ^upper in either order
    let lower=null,upper=null;
    for(let r=0;r<2;r++){
      while(isSpace(ts[k]))k++;
      const t=ts[k];
      if(t?.kind==='ch'&&t.ch==='_'&&lower===null){const a=argument(ts,k+1);lower=a.ts;k=a.next;}
      else if(t?.kind==='ch'&&t.ch==='^'&&upper===null){const a=argument(ts,k+1);upper=a.ts;k=a.next;}
    }
    // integrand up to the differential (at depth 0)
    const body=[];depth=0;let v='';
    while(k<ts.length){
      const t=ts[k];
      if(depth===0){
        if(isInt(t))break; // the next integral began before this one had dx or dy
        const after=differentialAt(ts,k);
        if(after>0){let j=after;while(isSpace(ts[j]))j++;const w=ts[j];
          const name=w?.kind==='ch'?w.ch:w?.kind==='group'?w.inner.trim():'';
          if(name==='x'||name==='y'){v=name;k=j+1;break;}}
      }
      depth+=depthDelta(t);body.push(t);k++;
    }
    while(body.length&&isSpace(body[body.length-1]))body.pop();
    // after dx: only spacing, then + or - (the next term) or the end
    while(isSpace(ts[k]))k++;
    let trailing='';
    if(v&&k<ts.length&&!(ts[k].kind==='ch'&&'+-'.includes(ts[k].ch))){
      // something multiplies the integral from the right: keep it visible to the checker as an error
      const rest=[];while(k<ts.length&&!(ts[k].kind==='ch'&&'+-'.includes(ts[k].ch)))rest.push(ts[k++]);trailing='*'+(piece(rest).text||'?');
    }
    const c=piece(coef),lo=piece(lower||[]),up=piece(upper||[]),f=piece(body);
    if(!lo.complete||!up.complete||!f.complete||!v||coef.length&&!c.complete)complete=false;
    const co=coef.length?(c.text||'?'):'';
    terms.push({sign,linear:`${co?`(${co})*`:''}int(${lo.text},${up.text},${f.text},${v})${trailing}`});
  }
  const input=terms.map((t,i)=>(t.sign==='-'?'-':i?'+':'')+t.linear).join('');
  return{status:complete?'complete':'incomplete',input};
}

// linear form -> LaTeX (to restore a saved entry in the field)
export function setupToLatex(source){
  const s=String(source??'').trim();if(!s)return{status:'complete',latex:''};
  const out=[];let i=0,ok=true;
  const tex=t=>{if(!t)return '\\placeholder{}';const r=batchmathToLatex(t);if(r.latex===null){ok=false;return '';}return r.latex;};
  while(i<s.length){
    const at=s.indexOf('int(',i);
    if(at<0){out.push(tex(s.slice(i)));break;}
    let pre=s.slice(i,at).replace(/\*\s*$/,''),sign='';
    if(/^[+-]/.test(pre)){sign=pre[0];pre=pre.slice(1);}
    pre=pre.replace(/^\((.*)\)$/,'$1');
    let d=0,end=-1;for(let j=at+3;j<s.length;j++){if(s[j]==='(')d++;else if(s[j]===')'){d--;if(!d){end=j;break;}}}
    if(end<0){ok=false;break;}
    const args=[];let from=at+4;d=0;for(let j=at+4;j<end;j++){if(s[j]==='(')d++;else if(s[j]===')')d--;else if(s[j]===','&&!d){args.push(s.slice(from,j));from=j+1;}}
    args.push(s.slice(from,end));if(args.length!==4){ok=false;break;}
    out.push(`${sign==='-'?'-':out.length?'+':''}${pre?tex(pre):''}\\int_{${tex(args[0])}}^{${tex(args[1])}}${tex(args[2])}\\,d${args[3]||'\\placeholder{}'}`);
    i=end+1;
  }
  return ok?{status:'complete',latex:out.join('')}:{status:'unsupported',latex:null};
}

// The integral key: an editable definite integral at the cursor; dx / dy are separate keys (or typed).
export const integralTemplate='\\int_{#?}^{#?}#?';

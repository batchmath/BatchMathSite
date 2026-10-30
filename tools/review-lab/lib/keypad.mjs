// Turning a displayed answer (TeX) into what a student enters: the linear keypad form ("(1)/(3)x^(3)+C"),
// the on-screen key presses for it, and the physical-keyboard strokes ("/" and "^" open a slot, → leaves it).
export function keypadForm(tex){
 let s=String(tex).replace(/\\left|\\right|\\,|\\displaystyle/g,'').replace(/\\cdot/g,'*').replace(/\\theta/g,'θ').replace(/\\pi/g,'pi');
 const brace=(str,i)=>{let d=0;for(let j=i;j<str.length;j++){if(str[j]==='{')d++;else if(str[j]==='}'&&--d===0)return j;}throw Error('brace');};
 for(let g=0;g<200;g++){
  let i=s.indexOf('\\frac');if(i>=0){const a=s.indexOf('{',i),ae=brace(s,a),be=brace(s,ae+1);s=s.slice(0,i)+`(${s.slice(a+1,ae)})/(${s.slice(ae+2,be)})`+s.slice(be+1);continue;}
  i=s.indexOf('\\sqrt[');if(i>=0){const c=s.indexOf(']',i),n=s.slice(i+6,c),a=c+1,ae=brace(s,a);s=s.slice(0,i)+`(${s.slice(a+1,ae)})^((1)/(${n}))`+s.slice(ae+1);continue;}
  i=s.indexOf('\\sqrt{');if(i>=0){const a=i+5,ae=brace(s,a);s=s.slice(0,i)+`sqrt(${s.slice(a+1,ae)})`+s.slice(ae+1);continue;}
  i=s.indexOf('^{');if(i>=0){const ae=brace(s,i+1);s=s.slice(0,i)+`^(${s.slice(i+2,ae)})`+s.slice(ae+1);continue;}
  break;}
 return s.replace(/\\(sin|cos|tan)\^\(-1\)/g,'a$1').replace(/\\(sin|cos|tan|sec|csc|cot|ln)/g,'$1').replace(/\|([^|]*)\|/g,'abs($1)').replace(/\s+/g,'');
}
// linear keypad form -> structure the keypad can enter
export function parse(s){
 let i=0;
 const group=()=>{i++;const g=seq(')');i++;return g;};
 function seq(stop){const out=[];while(i<s.length&&s[i]!==stop)out.push(item());return out;}
 function bare(){if(/[0-9]/.test(s[i])){let j=i;while(j<s.length&&/[0-9]/.test(s[j]))j++;const v=s.slice(i,j);i=j;return [...v].map(d=>({t:'atom',v:d}));}if(s[i]==='(')return group();return [item()];}
 function item(){
  const ch=s[i];
  if(ch==='('){const g=group();if(s[i]==='/'&&s[i+1]==='('){i++;return{t:'frac',n:g,d:group()};}return{t:'group',g};}
  if(ch==='^'){i++;return{t:'pow',g:s[i]==='('?group():[{t:'atom',v:s[i++]}]};}
  const w=s.slice(i).match(/^(infinity|asin|acos|atan|sqrt|abs|sin|cos|tan|sec|csc|cot|ln|pi)/);
  if(w){i+=w[0].length;if(w[0]==='pi')return{t:'atom',v:'π'};if(w[0]==='infinity')return{t:'atom',v:'∞'};let power=null;if(s[i]==='^'&&s[i+1]==='('){i++;power=group();}const f={t:'func',name:w[0],arg:bare()};return power?{t:'powfunc',f,p:power}:f;}
  i++;return{t:'atom',v:ch};
 }
 return seq(undefined);
}
const FKEY={sqrt:'√',ln:'ln',abs:'|u|',sin:'sin',cos:'cos',tan:'tan',sec:'sec',csc:'csc',cot:'cot',asin:'sin⁻¹',acos:'cos⁻¹',atan:'tan⁻¹'};
const AKEY={'-':'−','*':'·','U':'∪'};
const esc=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// On-screen keypad driver for one page; scope selects which staged part's keypad is used.
export function keypad(p,scope='#choices'){
 const k={scope};
 k.key=async text=>{const b=p.locator(`${k.scope} .bm-calc-keypad button`).filter({hasText:new RegExp(`^${esc(text)}$`)}).first();if(!(await b.count()))throw Error(`no key "${text}" on ${await p.$eval(`${k.scope} .bm-calc-keypad`,e=>e.className)}`);await b.click();};
 k.emit=async nodes=>{for(const n of nodes){
  if(n.t==='atom')await k.key(AKEY[n.v]||n.v);
  else if(n.t==='group'){await k.key('(');await k.emit(n.g);await k.key(')');}
  else if(n.t==='frac'){await k.key('ab');await k.emit(n.n);await k.key('↓');await k.emit(n.d);await k.key('→');}
  else if(n.t==='pow'){await k.key('xⁿ');await k.emit(n.g);await k.key('→');}
  else if(n.t==='func'){await k.key(FKEY[n.name]);await k.emit(n.arg);await k.key('→');}
  else if(n.t==='powfunc'){await k.key('(');await k.emit([n.f]);await k.key(')');await k.key('xⁿ');await k.emit(n.p);await k.key('→');}
 }};
 k.source=()=>p.$eval(`${k.scope} .bm-calc-source`,e=>e.value);
 return k;
}
// physical-keyboard strokes for a linear form; θ has no keyboard key and is pressed on the keypad
export function strokes(lin){
 const out=[];const close=(s,i)=>{let d=0;for(let j=i;j<s.length;j++){if(s[j]==='(')d++;else if(s[j]===')'&&--d===0)return j;}throw Error('paren '+s);};
 const walk=s=>{for(let i=0;i<s.length;i++){const ch=s[i];
  if((ch==='/'||ch==='^')&&s[i+1]==='('){const e=close(s,i+1);out.push({key:ch});walk(s.slice(i+2,e));out.push({key:'ArrowRight'});i=e;continue;}
  if(ch==='θ'){out.push({pad:'θ'});continue;}
  out.push({text:ch});}};
 walk(lin);return out;
}
export const readResult=(p,scope)=>p.evaluate(sc=>{const f=document.querySelector(`${sc} .staged-feedback`);return f?{result:f.querySelector('.result')?.innerText.trim()||'',note:f.querySelector('.answer-format-note')?.innerText.trim()||'',message:''}:{result:'',note:'',message:document.querySelector(`${sc} .staged-input-message`)?.innerText.trim()||''};},scope);
export const isCorrect=t=>/^(Correct\.|Part \d is correct\.)$/.test(t||'');

// Keypad "all and only" audit for the Unit 5 profiles: every key a generated answer needs must be on its part's
// keypad, and every key on a profile should be needed by some answer that uses it (a short list of deliberate
// extras is reported, not failed). Needs are read from each answer's displayed form. Parentheses are not
// audited (function keys and grouping use them); decimal is a deliberate extra on the growth exact/formula pads,
// where a student may legitimately write a given ratio such as 0.8 as a decimal inside the logarithm.
// Usage: node tools/review-lab/unit5/qa/keypad-audit.mjs [N]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||1500);const profiles={};
const ENG=[['basic-first-order-differential-equations','unit5-basic.js'],['motion-problems','unit5-motion.js'],['slope-fields','unit5-slope-fields.js'],['separable-differential-equations','unit5-separable.js'],['exponential-growth-and-decay-interest-newton-s-law-of-cooling','unit5-growth.js'],['rate-problems','unit5-rate.js']];
const used={},count={},missing=[];
const needs=(part)=>{const a=part.answer;let tex=String(part.answerTex).replace(/^[A-Za-z](\([a-zθ]\))?\s*=\s*/,'').replace(/\\text\{[^}]*\}/g,'').replace(/\\\$|\{,\}/g,'');
 if(a.kind==='list')tex=tex.replace(/[a-z]=/g,'').replace(/\\ /g,'');
 const lin=keypadForm(tex.replace(/\\left|\\right|\\,/g,'').replace(/\\infty/g,'infinity').replace(/\\cup/g,'U'));const n=new Set();
 if(/\)\/\(|\d\/\d/.test(lin)||/\\frac/.test(tex))n.add('fraction');if(/\^\(\(1\)\/\(3\)\)/.test(lin))n.add('cubeRoot');else if(/\^/.test(lin))n.add('exponent');if(/sqrt/.test(lin))n.add('radical');if(/(?<![a-z])ln/.test(lin))n.add('logarithm');
 if(/(?<![a-z])e(?![a-z])/.test(lin.replace(/infinity/g,'')))n.add('constant e');if(/pi/.test(lin))n.add('constant pi');for(const f of ['asin','acos','atan','abs']){if(lin.includes(f))n.add('function '+f);}
 for(const f of ['sin','cos','tan','sec','csc','cot'])if(new RegExp(`(?<![a-z])${f}`).test(lin))n.add('function '+f);
 const bare=lin.replace(/infinity|asin|acos|atan|sqrt|abs|sin|cos|tan|sec|csc|cot|ln|pi/g,' ');for(const v of ['x','t','θ','y','C'])if(bare.includes(v))n.add('variable '+v);
 if(a.kind==='interval'){n.add('interval');n.add('list');}
 if(/infinity/.test(lin))n.add('infinity');if(/[\[\]]/.test(lin))n.add('brackets');if(/U/.test(lin))n.add('union');if(a.kind==='list'&&a.values.length>1)n.add('list');if(a.kind==='list'&&!a.values.length)n.add('none');
 if(/\d\.\d/.test(lin))n.add('decimal');if(/[-+*]/.test(lin.replace(/(^|[(\[,U])-/g,'$1')))n.add('arithmetic');if(/(^|[(\[,U])-/.test(lin))n.add('minus');return n;};
const has=(spec,need)=>{const [k,arg]=need.split(' ');
 if(k==='function'){const f=(spec.functions||[]).map(x=>x[1]);return f.includes(arg)||(arg==='abs'&&f.includes('abs'));}
 if(k==='constant')return (spec.constants||[]).includes(arg);if(k==='variable')return (spec.variables||[]).includes(arg);
 if(k==='minus')return true; // every profile has a minus key
 if(k==='union')return !!spec.interval&&spec.union!==false;if(k==='brackets')return !!spec.interval&&spec.brackets!==false;return !!spec[k];};
const KP={registerProfile:(name,spec)=>{profiles[name]=spec;}};
for(const [slug,file] of ENG){const L2=load([file],{BatchMathCalculusKeypad:KP});const gen=L2.G.get(slug);
 for(let i=1;i<=N;i++){L2.seed(i*389);const p=gen({});for(const part of p.parts){if(!part.answer||!part.keypadMode)continue;const spec=profiles[part.keypadMode];
  if(!spec){missing.push(`${p.id}: keypad profile ${part.keypadMode} is not registered`);continue;}
  const u=used[part.keypadMode]=used[part.keypadMode]||new Set();count[part.keypadMode]=(count[part.keypadMode]||0)+1;for(const n of needs(part)){u.add(n);
   if(!has(spec,n)&&missing.length<30)missing.push(`${p.id}: needs ${n} but ${part.keypadMode} lacks it (${part.answerTex})`);}}}}
console.log('profiles used by generated answers:',Object.keys(used).length);
for(const [name,u] of Object.entries(used).sort()){const spec=profiles[name]||{};const offered=[];
 for(const [k,v] of Object.entries(spec)){if(v===true)offered.push(k);else if(Array.isArray(v))for(const x of v)offered.push(`${k==='functions'?'function':k==='constants'?'constant':'variable'} ${Array.isArray(x)?x[1]:x}`);}
 const unused=offered.filter(o=>!['parentheses','decimal'].includes(o)&&![...u].some(n=>n===o||(o==='list'&&n==='list')));
 console.log(`${name.padEnd(26)} ${String(count[name]).padStart(5)} answers; needed: ${[...u].sort().join(', ')}${unused.length?`  | offered but not needed in this sample: ${unused.join(', ')}`:''}`);}
console.log(missing.length?`MISSING KEYS:\n${missing.join('\n')}`:'No answer needs a key its keypad lacks.');process.exitCode=missing.length?1:0;

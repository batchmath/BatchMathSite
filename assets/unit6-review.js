/* BatchMath v12.9.A — Unit 6 Comprehensive Review (Calculator Review and Non-Calculator Review pages).
   Each problem comes from a topic's own engine with its usual answer entry, checking and explanations:
   Non-Calculator Review — Area Between Curves 14, Area in Terms of y 10, Volume by Cross Sections 12, Disks and
     Washers 12, Shells 9, Area and Volume Free Response 18, Graph Free Response 20, Piecewise Integrals 5;
   Calculator Review — Area Between Curves 20, Volume by Cross Sections 18, Solids of Revolution 27, Area and Volume
     Free Response 35.
   The topic is chosen first; the difficulty is chosen separately (foundational 40, intermediate 40, challenging 20,
   renormalized over the tiers the topic has: free-response problems are intermediate or challenging).
   Practice Types: all review problems, Area and Volume Free Response, Graph Free Response (non-calculator only) and
   Shorter Problems (every topic except the free-response problems). */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const A=()=>window.BatchMathUnit6Area,Vol=()=>window.BatchMathUnit6Volume,F=()=>window.BatchMathUnit6FRQ;
const ALL=['foundational','intermediate','challenging'];
// the old Integrals on Piecewise Defined Functions generator (multiple choice); a problem with two choices of equal
// value is skipped (its trig variant can repeat the correct value as "(c - 1) + 1")
function texValue(t){
 let s=String(t).replace(/\\left|\\right/g,'').replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'(($1)/($2))').replace(/\\pi/g,'pi').replace(/\\ln\s*/g,'ln').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)').replace(/[{}]/g,'').replace(/\\cdot/g,'*').replace(/\s+/g,'');
 s=s.replace(/ln(\d+)/g,'ln($1)').replace(/(\d)(pi|ln|sqrt|\()/g,'$1*$2').replace(/\)(\(|pi|ln|\d)/g,')*$1');
 try{const I=window.BatchMathUnit4Integrals,v=I.evaluate(I.parseInput(s,null),{});return Number.isFinite(v)?v:null;}catch(_){return null;}
}
function piecewise(){
 const gen=window.BatchMathAPTopicGenerators.get('integrals-on-piecewise-defined-functions');
 for(let i=0;i<30;i++){
  const p=gen(),vals=(p.choices||[]).map(texValue);
  if(vals.some((v,j)=>v!==null&&vals.some((w,k)=>k!==j&&w!==null&&Math.abs(v-w)<1e-9)))continue;
  return p;
 }
 throw Error('unit6-review: no piecewise problem with distinct choices');
}
// src: the engine's families and, for a Practice Type of that engine, the families it uses
const TOPICS=[
 {key:'area',label:'Area Between Curves',w:{noncalculator:14,calculator:20},group:'short',src:()=>[A().FAMILIES],make:(tier,calc)=>A().make({tier,calc})},
 {key:'area_y',label:'Area in Terms of y',w:{noncalculator:10},group:'short',src:()=>[A().FAMILIES_Y],make:(tier,calc)=>A().makeY({tier,calc})},
 {key:'cross_sections',label:'Volume by Cross Sections',w:{noncalculator:12,calculator:18},group:'short',src:()=>[Vol().FAMILIES_CS],make:(tier,calc)=>Vol().makeCS({tier,calc})},
 {key:'washers',label:'Disks and Washers',w:{noncalculator:12},group:'short',src:()=>[Vol().FAMILIES_SOLID,Vol().MODES_SOLID.disks_washers.families],make:(tier,calc)=>Vol().makeSolid({tier,calc,mode:'disks_washers'})},
 {key:'shells',label:'Cylindrical Shells',w:{noncalculator:9},group:'short',src:()=>[Vol().FAMILIES_SOLID,Vol().MODES_SOLID.shells.families],make:(tier,calc)=>Vol().makeSolid({tier,calc,mode:'shells'})},
 {key:'solids',label:'Solids of Revolution',w:{calculator:27},group:'short',src:()=>[Vol().FAMILIES_SOLID],make:(tier,calc)=>Vol().makeSolid({tier,calc})},
 {key:'frq_region',label:'Area and Volume Free Response',w:{noncalculator:18,calculator:35},group:'frq_region',src:()=>[F().FAMILIES,F().MODES.region.families],make:(tier,calc)=>F().make({tier,calc,mode:'region'})},
 {key:'frq_graph',label:'Graph Free Response',w:{noncalculator:20},group:'frq_graph',src:()=>[F().FAMILIES,F().MODES.graph.families],make:(tier,calc)=>F().make({tier,calc,mode:'graph'})},
 {key:'piecewise',label:'Integrals on Piecewise Defined Functions',w:{noncalculator:5},group:'short',tiers:()=>['foundational'],make:()=>piecewise()},
];
const kindTiers=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
// the tiers a topic offers on a calculator or non-calculator review
function tiersOf(topic,kind){
 if(topic.tiers)return topic.tiers();
 const [fams,only]=topic.src(),out=new Set();
 for(const [k,f] of Object.entries(fams)){if(only&&!(k in only))continue;for(const t of kindTiers(f)[kind])if(!only||only[k]===true||only[k].includes(t))out.add(t);}
 return ALL.filter(t=>out.has(t));
}
const TIER_WEIGHTS={foundational:40,intermediate:40,challenging:20};
const TIER_LABEL={foundational:'Foundational',intermediate:'Intermediate',challenging:'Challenging'};
const KINDS={calculator:'calculator','non-calculator':'noncalculator'};
const MODES={frq_region:'frq_region',frq_graph:'frq_graph',short:'short'};
function topicsFor(calc,mode){
 const kind=KINDS[calc];
 return TOPICS.filter(t=>t.w[kind]&&tiersOf(t,kind).length&&(!mode||(mode==='short'?t.group==='short':t.group===mode)));
}
function make(opts={}){
 const calc=KINDS[opts.calc]?opts.calc:'non-calculator',kind=KINDS[calc];
 if(opts.calc&&!KINDS[opts.calc])throw Error(`unit6-review: unknown calculator mode ${opts.calc}`);
 let mode=opts.mode&&opts.mode!=='mixed'&&opts.mode!=='all'?opts.mode:null;
 if(mode&&!MODES[mode]){console.warn(`unit6 review: Practice Type "${mode}" is not offered; using all review problems`);mode=null;}
 let pool=topicsFor(calc,mode);
 if(!pool.length){console.warn(`unit6 review: Practice Type "${mode}" is not offered on the ${calc} review; using all review problems`);mode=null;pool=topicsFor(calc,null);}
 const key=U.weighted(Object.fromEntries(pool.map(t=>[t.key,t.w[kind]]))),topic=TOPICS.find(t=>t.key===key);
 const tiers=tiersOf(topic,kind),tier=opts.tier&&tiers.includes(opts.tier)?opts.tier:U.weighted(Object.fromEntries(tiers.map(t=>[t,TIER_WEIGHTS[t]])));
 const p=topic.make(tier,calc);
 if(p.answerType==='unit5-staged'&&p.calculatorActive!==(calc==='calculator'))throw Error(`unit6-review: ${topic.label} gave the wrong calculator kind`);
 const tag=`<div class="u5-review-tag">${topic.label}${topic.key==='piecewise'?'':` · ${TIER_LABEL[tier]}`}</div>`,html=p.questionHtml;
 p.questionHtml=html.replace(/^<div class="[^"]*\bu5-question\b[^"]*">/,open=>open+tag);
 if(p.questionHtml===html)p.questionHtml=tag+html;
 p.variant=`${topic.key}/${p.variant}`;
 const meta={...(p.unit5Meta||{}),review:true,reviewTopic:topic.key,reviewTier:tier,reviewCalc:calc,reviewMode:mode||'all'};
 if(p.unit5Meta)p.unit5Meta=meta;p.unit6Review=meta;
 return p;
}
window.BatchMathUnit6Review=Object.freeze({make,TOPICS,TIER_WEIGHTS,topicsFor,tiersOf,texValue});
U.register('unit6-comprehensive-review',o=>make(o||{}));
})();

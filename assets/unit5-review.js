/* BatchMath v12.8.X — Unit 5 Comprehensive Review (Mixed, Calculator and Non-Calculator Review pages).
   Mixed Review draws from all six Unit 5 engines with two independent distributions:
   topic — Basic First-Order 20%, Motion 20%, Slope Fields 20%, Separable 20%, Growth/Decay 10%, Rate 10%;
   difficulty — foundational 40%, intermediate 40%, challenging 20%.
   The topic is chosen first and the difficulty separately; the topic's own engine then builds a problem of that
   difficulty with its usual families, input methods and explanations (Slope Fields keeps its 50% drawing /
   50% matching and analysis split). Practice Type can fix one topic or one difficulty; the other distribution
   still applies. v12.8.X: the Calculator Review (BM_TOPIC_PRACTICE.calculator) uses Basic, Motion, Growth and Rate
   (weights 20:20:10:10, about 33/33/17/17%) and the Non-Calculator Review uses Basic, Motion, Slope Fields,
   Separable and Rate (20:20:20:20:10, about 22/22/22/22/11%), with the same 40/40/20 difficulty. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const TOPICS=[
 {key:'basic',label:'Basic First-Order Differential Equations',weight:20,engine:()=>window.BatchMathUnit5Basic},
 {key:'motion',label:'Motion Problems',weight:20,engine:()=>window.BatchMathUnit5Motion},
 {key:'slope',label:'Slope Fields',weight:20,engine:()=>window.BatchMathUnit5Slope},
 {key:'separable',label:'Separable Differential Equations',weight:20,engine:()=>window.BatchMathUnit5Separable},
 {key:'growth',label:"Growth, Decay, Interest and Newton's Law",weight:10,engine:()=>window.BatchMathUnit5Growth},
 {key:'rate',label:'Rate Problems',weight:10,engine:()=>window.BatchMathUnit5Rate},
];
const TIER_WEIGHTS={foundational:40,intermediate:40,challenging:20};
const TIER_LABEL={foundational:'Foundational',intermediate:'Intermediate',challenging:'Challenging'};

// v12.8.X calculator and non-calculator reviews: a topic takes part when its engine has families of that kind
// (Calculator Review: Basic, Motion, Growth, Rate; Non-Calculator Review: Basic, Motion, Slope Fields, Separable,
// Rate), with the original weights renormalized over those topics; difficulty stays 40/40/20 and independent.
const KINDS={calculator:'calculator','non-calculator':'noncalculator'};
const kindTiers=F=>F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
function eligible(topic,calc){
 const eng=topic.engine();if(!eng)return false;if(!calc)return true;
 return Object.values(eng.FAMILIES).some(F=>kindTiers(F)[KINDS[calc]].length>0);
}
function topicsFor(calc){return TOPICS.filter(t=>eligible(t,calc));}
function make(opts={}){
 const calc=opts.calc&&KINDS[opts.calc]?opts.calc:null;
 if(opts.calc&&!calc)throw Error(`unit5-review: unknown calculator mode ${opts.calc}`);
 const pool=topicsFor(calc);
 const mode=opts.mode&&opts.mode!=='mixed'?opts.mode:null;
 const fixedTopic=TOPICS.find(t=>t.key===mode),fixedTier=TIER_WEIGHTS[mode]?mode:null;
 if(fixedTopic&&!pool.includes(fixedTopic))throw Error(`unit5-review: ${fixedTopic.label} has no ${calc} problems`);
 const topicKey=fixedTopic?fixedTopic.key:U.weighted(Object.fromEntries(pool.map(t=>[t.key,t.weight])));
 const tier=fixedTier||U.weighted(TIER_WEIGHTS);
 const topic=TOPICS.find(t=>t.key===topicKey),engine=topic.engine();
 if(!engine)throw Error(`unit5-review: the ${topic.label} engine is not loaded`);
 const p=engine.make(calc?{tier,calc}:{tier});
 if(calc&&p.calculatorActive!==(calc==='calculator'))throw Error(`unit5-review: ${topic.label} gave the wrong calculator kind`);
 p.questionHtml=`<div class="u5-review-tag">${topic.label} · ${TIER_LABEL[tier]}</div>`+p.questionHtml;
 p.variant=`${topic.key}/${p.variant}`;
 p.unit5Meta={...p.unit5Meta,review:true,reviewTopic:topic.key,reviewTier:tier,reviewCalc:calc||'mixed'};
 return p;
}
window.BatchMathUnit5Review=Object.freeze({make,TOPICS,TIER_WEIGHTS,topicsFor});
U.register('unit5-comprehensive-review',o=>make(o||{}));
})();

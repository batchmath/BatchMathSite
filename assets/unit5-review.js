/* BatchMath v12.8.W — Unit 5 Comprehensive Review.
   Draws from all six Unit 5 engines with two independent distributions:
   topic — Basic First-Order 20%, Motion 20%, Slope Fields 20%, Separable 20%, Growth/Decay 10%, Rate 10%;
   difficulty — foundational 40%, intermediate 40%, challenging 20%.
   The topic is chosen first and the difficulty separately; the topic's own engine then builds a problem of that
   difficulty with its usual families, input methods and explanations (Slope Fields keeps its 50% drawing /
   50% matching and analysis split). Practice Type can fix one topic or one difficulty; the other distribution
   still applies. */
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

function make(opts={}){
 const mode=opts.mode&&opts.mode!=='mixed'?opts.mode:null;
 const fixedTopic=TOPICS.find(t=>t.key===mode),fixedTier=TIER_WEIGHTS[mode]?mode:null;
 const topicKey=fixedTopic?fixedTopic.key:U.weighted(Object.fromEntries(TOPICS.map(t=>[t.key,t.weight])));
 const tier=fixedTier||U.weighted(TIER_WEIGHTS);
 const topic=TOPICS.find(t=>t.key===topicKey),engine=topic.engine();
 if(!engine)throw Error(`unit5-review: the ${topic.label} engine is not loaded`);
 const p=engine.make({tier});
 p.questionHtml=`<div class="u5-review-tag">${topic.label} · ${TIER_LABEL[tier]}</div>`+p.questionHtml;
 p.variant=`${topic.key}/${p.variant}`;
 p.unit5Meta={...p.unit5Meta,review:true,reviewTopic:topic.key,reviewTier:tier};
 return p;
}
window.BatchMathUnit5Review=Object.freeze({make,TOPICS,TIER_WEIGHTS});
U.register('unit5-comprehensive-review',o=>make(o||{}));
})();

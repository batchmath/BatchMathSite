import fs from 'node:fs';

const basicPath = 'ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html';
const basicSource = fs.readFileSync(basicPath, 'utf8').split(/\n/);
const basicLegacy = [...basicSource.slice(111, 150), ...basicSource.slice(172, 436)].join('\n');
const basicTail = String.raw`
  const core=window.BMUnit1CoreExpansions;
  const legacy={factoring,substitution,rationalizing,complex:complexFraction};
  const mixedWeights=['continuous',...Array(3).fill('factoring'),...Array(3).fill('substitution'),...Array(3).fill('rationalizing'),...Array(3).fill('complex')];
  const generators={
    continuous:()=>core.continuous('core'),
    factoring:()=>BatchMathRNG.random()<.5?legacy.factoring():core.factoring(),
    substitution:()=>BatchMathRNG.random()<.7?legacy.substitution():core.substitution(),
    rationalizing:()=>BatchMathRNG.random()<.5?legacy.rationalizing():core.rationalizing(),
    complex:()=>BatchMathRNG.random()<.8?legacy.complex():core.complex()
  };
  function generate(mode='all'){
    const resolved=mode==='all'?pick(mixedWeights):mode;
    const generator=generators[resolved];
    if(!generator)throw new Error('Unknown Basic Techniques mode: '+mode);
    return generator();
  }
  window.BMUnit1BasicTechniques={generate,generators,mixedWeights:[...mixedWeights]};
})();
`;
fs.writeFileSync('assets/unit1-basic-techniques.js', `(function(){'use strict';\n${basicLegacy}${basicTail}`);

const infinityPath = 'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html';
const infinitySource = fs.readFileSync(infinityPath, 'utf8').split(/\n/);
const infinityHelpers = infinitySource.slice(111, 150).join('\n');
const infinityLegacy = infinitySource.slice(477, 586).join('\n');
const infinityTail = String.raw`
  window.BMUnit1InfinityLegacy={generate:infinityLimit,resetDirections:()=>{infinityDirBag=[];}};
})();
`;
fs.writeFileSync('assets/unit1-infinity-legacy.js', `(function(){'use strict';\n${infinityHelpers}\n${infinityLegacy}${infinityTail}`);

console.log(JSON.stringify({
  basic: 'assets/unit1-basic-techniques.js',
  infinity: 'assets/unit1-infinity-legacy.js'
}, null, 2));

// Export the displayed TeX (question formula and answers) of the four typed Unit 4 engines for the SymPy
// cross-check, using the same seeds as the audit. Usage: node sympy/export-sample.mjs <per-engine> <out.json>
import fs from 'node:fs';import {load,rng} from '../lib/engines.mjs';
const L=load(),N=Number(process.argv[2]||500),SL={basic:'basic-integrals',usub:'u-substitution-integrals',log:'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions',mvt:'mean-value-theorem-for-integrals'};
const out=[];
for(const [k,slug] of Object.entries(SL)){const E=Object.keys(SL).indexOf(k);
 for(let i=1;i<=N;i++){L.ctx.window.BatchMathRNG={random:rng(i*7919+E*104729)};const p=L.G.get(slug)({});
  const formula=p.questionHtml.match(/<div class="u4-formula">\\\(\\displaystyle ([\s\S]*)\\\)<\/div>/)[1];
  out.push({engine:k,variant:p.variant,id:p.id,formula,mode:p.unit4Meta.mode,variable:p.unit4Meta.variable||'x',stages:[p.stage1,p.stage2].filter(Boolean).map(s=>({kind:s.unit4Answer.kind,tex:s.answerTex,components:s.unit4Answer.components||null}))});}}
fs.writeFileSync(process.argv[3],JSON.stringify(out));console.log('exported',out.length,'problems');

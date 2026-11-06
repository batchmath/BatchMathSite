// Semantic future-answer checks use the site's unchanged structural/expression
// graders. Numeric coincidences are candidates for contextual review, not failures.
import {translateIntegralSetup} from '../../assets/mathlive/integral-setup.mjs';
import {translateAdvancedExpression} from '../../assets/mathlive/answer-adapter.mjs';
import {plain,maths} from './model.mjs';
const norm=s=>plain(s).replace(/\\(?:left|right|displaystyle|,|\(|\))/g,'').replace(/[\s{}\\]/g,'').toLowerCase();
export function disclosures(p,C){
 const leaks=[],candidates=[];
 for(let earlier=0;earlier<p.parts.length;earlier++)for(let later=earlier+1;later<p.parts.length;later++){
  const a=p.parts[earlier],b=p.parts[later],text=plain(a.explanation),formulae=maths(a.explanation);
  if(b.control==='u6-integral')for(const tex of formulae.filter(t=>t.includes('\\int'))){
   const expression=tex.replace(/^[A-Za-z](?:\([^)]*\))?\s*=/,'');
   try{const translated=translateIntegralSetup(expression);if(translated.input){const parsed=C.parseSetup(translated.input);if(!parsed.error&&C.checkIntegral(parsed.rows,b.answer).ok)leaks.push({earlier,later,kind:'complete-future-integral',formula:tex});}}catch{}
  }
  if(b.control==='u6-expr')for(const tex of formulae){
   const prefix=b.prefix||'',split=tex.indexOf('=');
   if(split<0||norm(tex.slice(0,split+1))!==norm(prefix))continue;
   try{const rhs=translateAdvancedExpression(tex.slice(split+1));if(rhs.input&&C.checkExpr(rhs.input,b.answer).ok)leaks.push({earlier,later,kind:'complete-future-expression',formula:tex});}catch{}
  }
  if(b.control==='choice'){
   const normalized=norm(text),right=norm(b.choices[b.correctIndex]);
   const inflection=/point of inflection/.test(b.prompt);
   const extrema=/local (maximum|minimum)/.test(b.prompt);
   const hasDerivative=inflection?normalized.includes("g''=f'"):normalized.includes("g'=f");
   const hasReason=inflection?/changes (?:from )?increasing to decreasing|changes direction/.test(text):/changes from (?:positive to negative|negative to positive)/.test(text);
   if(right.length>15&&normalized.includes(right)||hasDerivative&&hasReason&&(inflection||extrema))leaks.push({earlier,later,kind:'future-justification',correctChoice:b.choices[b.correctIndex]});
  }
  // Incorrect entry can accidentally be a future answer. Do not confirm its
  // future role in the earlier part's grader hint.
  if(b.control==='u6-expr')for(const hint of a.answer?.notes||[]){
   const future=b.prefix?.startsWith('h(')?'height':'inner radius';
   if(new RegExp('That is the '+future,'i').test(hint.note||''))leaks.push({earlier,later,kind:'wrong-feedback-confirms-future-expression',note:hint.note});
  }
  if(['exact','numeric'].includes(b.answer?.kind))for(const tex of formulae){
   const split=tex.lastIndexOf('=');if(split<0||tex.includes('\\int'))continue;
   const rhs=tex.slice(split+1).replace(/\\approx.*$/,'');
   try{const parsed=translateAdvancedExpression(rhs);const fn=parsed.input&&C.readExpr(parsed.input,null);if(fn&&!fn.error){const value=fn.f(0);if(Number.isFinite(value)&&Math.abs(value-b.answer.value)<1e-7*Math.max(1,Math.abs(value)))candidates.push({earlier,later,kind:'same-numeric-value-needs-context',formula:tex,laterPrompt:b.prompt});}}catch{}
  }
 }
 return{leaks,candidates};
}

import {translateAdvancedExpression} from './answer-adapter.mjs';
import {exactList,listToLatex,intervalsWithNone,intervalsWithNoneToLatex,roundedNumber} from './structured-contracts.mjs';
const expression={translate:translateAdvancedExpression},rounded={translate:roundedNumber},interval={translate:intervalsWithNone,toLatex:intervalsWithNoneToLatex};
const list={translate:exactList,toLatex:listToLatex},roundedList={translate:s=>exactList(s,{rounded:true}),toLatex:listToLatex};
export const stagedProfiles=Object.fromEntries([
 ...['unit4-usub-x','unit4-usub-t','unit4-usub-theta','unit4-usub-r','unit4-usub-def','unit4-log-indef','unit4-log-def','unit4-mvt-avg','unit4-sigma','unit4-exact','unit4-geometry',
 'unit5-basic-x','unit5-basic-t','unit5-basic-x-c','unit5-basic-t-c','unit5-growth-exact','unit5-growth-formula','unit5-motion-value','unit5-motion-value-e','unit5-motion-value-r','unit5-motion-t','unit5-rate-exact','unit5-rate-exact-pi','unit5-rate-exact-ln','unit5-slope-exact','unit5-slope-line'].map(k=>[k,expression]),
 ...['unit5-number','unit5-money'].map(k=>[k,rounded]),
 ...['unit5-interval-basic','unit5-motion-intervals','unit5-motion-intervals-dec','unit5-slope-interval'].map(k=>[k,interval]),
 ...['unit5-motion-list','unit5-slope-list'].map(k=>[k,list]),['unit5-motion-list-dec',roundedList],
 ...['x','t'].map(v=>['unit5-basic-'+v+'-c',{...expression,keypad:'ml-unit5-basic-'+v+'-c'}]),
 ...['unit4-mvt-c','unit4-mvt-c-trig'].map(k=>[k,{translate:s=>exactList(s,{doesNotApply:true}),toLatex:listToLatex,...(k==='unit4-mvt-c'?{keypad:'ml-unit4-mvt-c'}:{})}])
]);
export const stagedKeypads=Object.fromEntries(['x','t'].map(v=>['ml-unit5-basic-'+v+'-c',{fraction:true,radical:true,exponent:true,constants:['e'],variables:[v,'C'],functions:[['sin','sin'],['cos','cos'],['tan','tan'],['tan⁻¹','atan']],arithmetic:true,parentheses:true}]));
Object.assign(stagedKeypads,{'ml-unit4-mvt-c':{fraction:true,radical:true,nthRoot:true,exponent:true,logarithm:true,constants:['e'],arithmetic:true,parentheses:true,list:true,dna:true,operators:[['±','±']]}});

// Controls for accepted evaluation/solution forms, not just preferred reduced values.
const exact={fraction:true,exponent:true,arithmetic:true,parentheses:true};
const trig6=['sin','cos','tan','sec','csc','cot'].map(f=>[f,f]);
Object.assign(stagedKeypads,{
 'ml-unit4-geometry':{...exact,constants:['pi']},
 'ml-unit4-usub-def':{...exact,radical:true,logarithm:true,constants:['pi','e'],functions:trig6},
 'ml-unit4-log-def':{...exact,radical:true,logarithm:true,constants:['pi','e'],functions:[['sin','sin'],['cos','cos'],['|u|','abs']]},
 'ml-unit4-mvt-avg':{...exact,radical:true,logarithm:true,constants:['pi','e'],functions:trig6},
 'ml-unit4-approx-exact':{...exact,radical:true,logarithm:true,constants:['pi','e'],functions:[['sin','sin'],['cos','cos']]},
 'ml-unit4-sigma-value':{...exact},
 'ml-unit5-growth-formula':{...exact,logarithm:true,decimal:true,constants:['e'],variables:['t']},
 'ml-unit5-motion-value':{...exact},
 'ml-unit5-motion-value-e':{...exact,constants:['e']},
 'ml-unit5-motion-value-r':{...exact,radical:true},
 'ml-unit5-motion-list':{...exact,radical:true,list:true},
 'ml-unit5-motion-intervals':{...exact,radical:true,list:true,interval:true,brackets:false},
 'ml-unit5-rate-exact':{...exact,radical:true},
 'ml-unit5-rate-exact-pi':{...exact,constants:['pi']},
 'ml-unit5-slope-exact':{...exact},
 'ml-unit5-slope-line':{...exact,variables:['x']}
});
for(const name of Object.keys(stagedKeypads)){
 const original=name.replace(/^ml-/,'');
 if(stagedProfiles[original])stagedProfiles[original]={...stagedProfiles[original],keypad:name};
}
const inverseBasic=[...trig6,['sin⁻¹','asin'],['tan⁻¹','atan'],['|u|','abs']];
for(const v of ['x','t']){
 stagedKeypads['ml-unit5-basic-'+v]={...exact,decimal:true,radical:true,nthRoot:true,logarithm:true,constants:['pi','e'],variables:[v],functions:inverseBasic};
 stagedProfiles['unit5-basic-'+v]={...expression,keypad:'ml-unit5-basic-'+v};
}
stagedKeypads['ml-unit5-motion-t']={...exact,decimal:true,variables:['t']};
stagedProfiles['unit5-motion-t']={...expression,keypad:'ml-unit5-motion-t'};
stagedKeypads['ml-unit5-interval-basic']={fraction:true,decimal:true,constants:['pi'],arithmetic:true,parentheses:true,list:true,interval:true,union:false,infinity:true};
stagedKeypads['ml-unit5-slope-interval']={fraction:true,decimal:true,arithmetic:true,parentheses:true,list:true,interval:true,union:true,infinity:true};
for(const name of ['unit5-interval-basic','unit5-slope-interval'])stagedProfiles[name]={...stagedProfiles[name],keypad:'ml-'+name};
for(const [name,spec]of Object.entries(stagedKeypads))if(name.startsWith('ml-unit5-')&&!name.endsWith('-c'))spec.decimal=true;

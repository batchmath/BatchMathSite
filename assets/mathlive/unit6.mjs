// Unit 6 (Applications of Integration) MathLive fields, v12.9.C. Every typed Unit 6 answer uses the shared dynamic
// MathLive adapter; the checkers are unchanged (they read the same linear text as before).
//   unit6-exact, unit6-integral (radius, height, A(x)) : expressions          unit5-number : rounded decimals
//   unit6-list, unit6-list-dec : lists of values                              unit6-intervals : intervals
//   unit6-setup, unit6-setup-calc : a whole integral setup in ONE blank field (translated by integral-setup.mjs and
//   read by unit6-core parseSetup -> checkIntegral, the structural checker)
import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
import {exactList,listToLatex,intervalsWithNone,intervalsWithNoneToLatex,roundedNumber} from './structured-contracts.mjs';
import {translateIntegralSetup,setupToLatex} from './integral-setup.mjs';

const api=window.BatchMathCalculusKeypad;
// The setup keypad: only what Unit 6 integral setups use (fractions, roots, ln, sin, cos, pi, e, powers, x, y),
// plus the integral, dx and dy keys; a decimal point on calculator setups (decimal limits)
const setupKeys={fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],variables:['x','y'],functions:[['sin','sin'],['cos','cos']],arithmetic:true,parentheses:true};
// Canonical non-calculator setups and slice/radius expressions can contain cube
// roots (for example x = cube-root(y)). Keep the original expression controls and
// use the existing cube-root template in those profiles and their legacy modes.
api.registerProfile('unit6-integral',{...setupKeys,cubeRoot:true,functions:[['sin','sin'],['cos','cos'],['tan','tan'],['sec','sec'],['tan⁻¹','atan'],['|u|','abs']]});
api.registerProfile('unit6-setup',{...setupKeys,cubeRoot:true,list:true});
api.registerProfile('ml-unit6-setup',{...setupKeys,cubeRoot:true});
api.registerProfile('ml-unit6-setup-calc',{...setupKeys,decimal:true});
const INTEGRAL_PADS=new Set(['ml-unit6-setup','ml-unit6-setup-calc']);
// add the three keys to those pads (the shared keypad renderer is not changed)
const createPad=api.createPad;
api.createPad=function(mode,...rest){
  const pad=createPad.call(api,mode,...rest);
  if(INTEGRAL_PADS.has(mode)&&pad){
    const row=pad.querySelector('.bm-calc-special-row')||pad.firstElementChild,model=row?.querySelector('.bm-calc-key');
    const make=(label,aria,html)=>{const b=document.createElement('button');b.type='button';b.className=(model?.className||'bm-calc-key function').replace(/\bfraction\b/,'').trim()+' bm-u6-integral-key';if(html)b.innerHTML=html;else b.textContent=label;b.setAttribute('aria-label',aria);b.dataset.u6Key=label;return b;};
    row?.prepend(make('∫','Insert definite integral','<span aria-hidden="true">∫</span>'),make('dx','Insert dx'),make('dy','Insert dy'));
  }
  return pad;
};

const expression={translate:translateAdvancedExpression};
export const profiles={
  'unit6-exact':expression,
  'unit6-integral':expression,
  'unit5-number':{translate:roundedNumber},
  'unit6-list':{translate:exactList,toLatex:listToLatex},
  'unit6-list-dec':{translate:s=>exactList(s,{rounded:true}),toLatex:listToLatex},
  'unit6-intervals':{translate:intervalsWithNone,toLatex:intervalsWithNoneToLatex},
  'unit6-setup':{translate:translateIntegralSetup,toLatex:setupToLatex,keypad:'ml-unit6-setup'},
  'unit6-setup-calc':{translate:translateIntegralSetup,toLatex:setupToLatex,keypad:'ml-unit6-setup-calc'}
};
installDynamicFields({label:'Applications of Integration',profiles});

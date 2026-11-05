import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
import {translateInterval,intervalToLatex} from './interval-adapter.mjs';
// Keep the original interval profile, including exact endpoint functions.
window.BatchMathCalculusKeypad.registerProfile('unit5-sep-interval',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],functions:[['sin⁻¹','asin']],arithmetic:true,parentheses:true,list:true,interval:true,brackets:true,union:true,infinity:true});
installDynamicFields({label:'Separable Differential Equations',profiles:{
  'unit5-sep-x':{translate:translateAdvancedExpression},
  'unit5-sep-t':{translate:translateAdvancedExpression},
  'unit5-sep-theta':{translate:translateAdvancedExpression},
  'unit5-sep-interval':{translate:translateInterval,toLatex:intervalToLatex}
}});

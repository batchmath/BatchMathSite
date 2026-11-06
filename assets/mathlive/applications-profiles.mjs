import {batchmathToLatex} from './answer-adapter.mjs';
import {applicationExpression,applicationNumber,numericToLatex,applicationList,applicationListToLatex,applicationInterval,applicationIntervalToLatex,applicationPair} from './applications-contracts.mjs';
const check='button.choice',expression={translate:applicationExpression,submitSelector:check};
const numeric=({inputs})=>inputs[0]?.id==='numeric-answer'?{translate:applicationNumber,toLatex:numericToLatex,submitSelector:check}:expression;
export function applicationProfiles({calculator=false,algebraic=false}={}){
 const exactPad=algebraic?'ml-unit3-algebraic-exact':'ml-unit3-exact';
 const intervalContract={translate:applicationInterval,toLatex:applicationIntervalToLatex,submitSelector:check};
 const intervalPad=input=>input.dataset?.bmIntervalDecimals===undefined?(calculator?'ml-unit3-rounded-interval':'ml-unit3-interval'):(Number(input.dataset.bmIntervalDecimals)>0?'ml-unit3-rounded-interval':'ml-unit3-interval');
 return{
  'unit3-number':numeric,
  'unit3-rounded':numeric,
  'unit3-exact':{...expression,keypad:exactPad,fieldContract:input=>({...expression,keypad:input.dataset?.bmAllowDecimal==='true'?exactPad+'-decimal':exactPad})},
  'unit3-geometry-exact':{...expression,keypad:'ml-unit3-geometry-exact'},
  'unit3-equation':{translate:s=>applicationExpression(s,{line:true}),submitSelector:check,keypad:'ml-unit3-equation'},
  'unit3-rounded-line':expression,
  'unit3-list':{translate:applicationList,toLatex:applicationListToLatex,submitSelector:check,keypad:'ml-unit3-list'},
  'unit3-theorem':{translate:applicationList,toLatex:applicationListToLatex,submitSelector:check,keypad:'ml-unit3-theorem'},
  'unit3-interval':{...intervalContract,keypad:calculator?'ml-unit3-rounded-interval':'ml-unit3-interval',fieldContract:input=>({...intervalContract,keypad:intervalPad(input)})},
  'unit3-pair':{translate:applicationPair,toLatex:batchmathToLatex,submitSelector:check,keypad:'ml-unit3-pair'},
  'unit3-coordinate':{...expression,keypad:'ml-unit3-coordinate'},
  'unit3-approximation':{...expression,keypad:'ml-unit3-approximation'},
  'unit3-limit':{...expression,keypad:'ml-unit3-limit'}
 };
}
const exact={fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],arithmetic:true,parentheses:true};
const sinCos=[['sin','sin'],['cos','cos']],inverse=[['sin⁻¹','asin'],['cos⁻¹','acos'],['tan⁻¹','atan']];
export const applicationKeypads={
 'ml-unit3-equation':{fraction:true,radical:true,exponent:true,decimal:true,equation:true,variables:['x','y'],constants:['pi','e'],arithmetic:true,parentheses:true,equality:true},
 'ml-unit3-exact':{...exact,functions:sinCos},
 'ml-unit3-algebraic-exact':{fraction:true,radical:true,exponent:true,constants:['pi'],arithmetic:true,parentheses:true},
 'ml-unit3-geometry-exact':{fraction:true,radical:true,nthRoot:true,exponent:true,constants:['pi'],arithmetic:true,parentheses:true},
 'ml-unit3-coordinate':{...exact,decimal:true,functions:[...sinCos,...inverse]},
 'ml-unit3-pair':{...exact,decimal:true,pair:true,functions:[...sinCos,...inverse]},
 'ml-unit3-list':{fraction:true,radical:true,exponent:true,decimal:true,arithmetic:true,parentheses:true,list:true},
 'ml-unit3-theorem':{...exact,list:true,functions:[...sinCos,['tan','tan'],['sec','sec'],...inverse]},
 'ml-unit3-interval':{...exact,list:true,interval:true,infinity:true,functions:inverse},
 'ml-unit3-rounded-interval':{decimal:true,parentheses:true,list:true,interval:true,infinity:true},
 'ml-unit3-approximation':{...exact,functions:[...sinCos,['tan','tan'],['sec','sec']]},
 'ml-unit3-limit':{...exact,functions:[...sinCos,['tan','tan'],['sec','sec'],['cot','cot'],['csc','csc']]}
};

for(const name of ['ml-unit3-exact','ml-unit3-algebraic-exact'])applicationKeypads[name+'-decimal']={...applicationKeypads[name],decimal:true};

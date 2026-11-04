import {translateAdvancedExpression,batchmathToLatex} from './answer-adapter.mjs';
export function translateLimit(source){
 const plain=String(source).trim().replace(/\\(?:text|operatorname)\{([^{}]*)\}/g,'$1');
 if(/^(?:DNE|does\s*not\s*exist|undefined)$/i.test(plain))return{status:'complete',input:plain};
 return translateAdvancedExpression(source);
}
export const unit1Profiles={
 'migration-limit-finite':{fraction:true,decimal:true,radical:true,cubeRoot:true,nthRoot:true,exponent:true,logarithm:true,functions:[['log','log']],constants:['pi','e'],arithmetic:true,parentheses:true},
 'migration-limit-signed':{fraction:true,decimal:true,radical:true,cubeRoot:true,nthRoot:true,exponent:true,logarithm:true,functions:[['log','log']],constants:['pi','e'],arithmetic:true,parentheses:true,infinity:true,dne:true},
 'ml-unit1-trig-value':{fraction:true,decimal:true,radical:true,exponent:true,arithmetic:true,parentheses:true},
 'ml-unit1-rational-value':{fraction:true,decimal:true,arithmetic:true,parentheses:true}
};
export const limitContract={translate:translateLimit,toLatex:batchmathToLatex};

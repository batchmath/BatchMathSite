import {applicationProfiles,applicationKeypads} from './applications-profiles.mjs';
import {stagedProfiles,stagedKeypads} from './staged-profiles.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
import {translateInterval,intervalToLatex} from './interval-adapter.mjs';
import {translateNewtonLatex,newtonToLatex} from './newton-notation.mjs';
export const reviewKeypads={...applicationKeypads,...stagedKeypads,
 'unit5-sep-interval':{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],functions:[['sin⁻¹','asin']],arithmetic:true,parentheses:true,list:true,interval:true,brackets:true,union:true,infinity:true}
};
export function reviewProfiles({calculator=false,newton=()=>window.BatchMathNewtonNotation}={}){
 const expression={translate:translateAdvancedExpression};
 return{...applicationProfiles({calculator}),...stagedProfiles,
  'unit4-exact':{...expression,keypad:'ml-unit4-approx-exact'},
  'unit4-basic-indef':expression,'unit4-basic-def':expression,'unit4-ftc':expression,
  'unit4-newton':{translate:s=>translateNewtonLatex(s,newton().normalize),toLatex:s=>newtonToLatex(s,newton().read)},'unit4-newton-value':expression,
  'unit5-sep-x':expression,'unit5-sep-t':expression,'unit5-sep-theta':expression,
  'unit5-sep-interval':{translate:translateInterval,toLatex:intervalToLatex}
 };
}

import {unit3Contract,sequenceContract,lineContract} from './im1-unit3-contracts.mjs';
import {im1Value,im1ValueContract} from './im1-contracts.mjs';
// IM1 Unit 4 answer kinds, named by a field's `mathKind` (data-bm-math-kind), and the keys each kind's answers need:
//   explicit     a_n = 4(2)^(n-1)            digits, fraction, decimal, exponent, aₙ, n, + · ( ) =
//   rule         a_n = 2a_(n-1)              digits, fraction, decimal, aₙ, aₙ₋₁, + · ( ) =
//   exponential  y = f(x) = (12)(1/4)^(x-1)  digits, fraction, decimal, exponent, f(x), x, y, + · ( ) =
//   percent      20 (or 20%)                 the number keypad
// Every other field keeps its Unit 3 contract and keypad. The typed growth/decay word is a plain text field and is
// never a MathLive field.
export const unit4Keypads={
 'ml-im1-u4-explicit':{fraction:true,decimal:true,exponent:true,operators:[['aₙ','aₙ']],variables:['n'],arithmetic:true,parentheses:true,equality:true},
 'ml-im1-u4-rule':{fraction:true,decimal:true,operators:[['aₙ','aₙ'],['aₙ₋₁','aₙ₋₁']],arithmetic:true,parentheses:true,equality:true},
 'ml-im1-u4-exponential':{fraction:true,decimal:true,exponent:true,equation:true,variables:['x','y'],arithmetic:true,parentheses:true,equality:true}
};
export const percentContract={translate:source=>im1Value(String(source).trim().replace(/\\?%$/,'')),toLatex:im1ValueContract.toLatex};
export function unit4Contract(input){
 const kind=input.dataset.bmMathKind;
 if(kind==='explicit')return{...sequenceContract,keypad:'ml-im1-u4-explicit'};
 if(kind==='rule')return{...sequenceContract,keypad:'ml-im1-u4-rule'};
 if(kind==='exponential')return{...lineContract,keypad:'ml-im1-u4-exponential'};
 if(kind==='percent')return{...percentContract,keypad:'ml-im1-u3-number'};
 return unit3Contract(input);
}

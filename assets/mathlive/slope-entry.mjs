import {installNativeFields} from './native-fields.mjs';
import {im1ValueContract} from './im1-contracts.mjs';
// Drawing remains primary. Only the existing optional typed slope/point fields
// use the native bridge; the original input listeners keep the board in sync.
export function installSlopeEntry(){
 const api=window.BatchMathCalculusKeypad;
 api.registerProfile('ml-slope-entry',{fraction:true,decimal:true,operators:[['Undefined','undefined']]});
 api.registerProfile('ml-curve-point',{decimal:true});
 const check='.staged-part:not(.staged-completed) .staged-check';
 const start=()=>installNativeFields({hostSelector:'.u5-slope-entry',inputSelector:'input',whenVisible:true,submitSelector:check,onSubmit:()=>document.querySelector(check)?.click(),
  contract:{...im1ValueContract,onInput:input=>input.dispatchEvent(new Event('input',{bubbles:true}))},
  profile:({input})=>input.placeholder==='slope'?'ml-slope-entry':'ml-curve-point',label:'Graph value'});
 if(document.readyState==='complete')start();else document.addEventListener('DOMContentLoaded',start,{once:true});
}

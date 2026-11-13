import {installDynamicFields} from './dynamic-fields.mjs';
import {installNativeFields} from './native-fields.mjs';
import {unit3Keypads} from './im1-unit3-contracts.mjs';
import {im1ValueContract} from './im1-contracts.mjs';
import {unit4Keypads,unit4Contract} from './im1-unit4-contracts.mjs';
// IM1 Unit 4 practice pages: the Unit 3 answer fields and keypads, plus the Unit 4 answer kinds (explicit formulas,
// recursive rules, exponential equations, percents; see im1-unit4-contracts.mjs).
for(const [name,spec]of Object.entries({...unit3Keypads,...unit4Keypads}))window.BatchMathCalculusKeypad.registerProfile(name,spec);
const contract={fieldContract:unit4Contract};
installDynamicFields({label:'IM1 Unit 4',profiles:Object.fromEntries(['unit3-equation','unit3-formula','unit3-recursive','unit3-number'].map(name=>[name,contract]))});
const start=()=>installNativeFields({hostSelector:'#answerArea',inputSelector:'input:not([data-bm-calc-dynamic-ready])',padSelector:'.bm-keypad,.bm-fraction-editor',contract:{...im1ValueContract,fieldContract:unit4Contract},profile:'ml-im1-u3-number'});
if(document.readyState==='complete')start();else document.addEventListener('DOMContentLoaded',start,{once:true});

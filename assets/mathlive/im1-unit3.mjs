import {installDynamicFields} from './dynamic-fields.mjs';
import {installNativeFields} from './native-fields.mjs';
import {unit3Contract,unit3Keypads} from './im1-unit3-contracts.mjs';
import {im1ValueContract} from './im1-contracts.mjs';
for(const [name,spec]of Object.entries(unit3Keypads))window.BatchMathCalculusKeypad.registerProfile(name,spec);
const contract={fieldContract:unit3Contract};
installDynamicFields({label:'IM1 Unit 3',profiles:Object.fromEntries(['unit3-equation','unit3-formula','unit3-recursive','unit3-number'].map(name=>[name,contract]))});
const start=()=>installNativeFields({hostSelector:'#answerArea',inputSelector:'input:not([data-bm-calc-dynamic-ready])',padSelector:'.bm-keypad,.bm-fraction-editor',contract:im1ValueContract,profile:'ml-im1-u3-number'});
if(document.readyState==='complete')start();else document.addEventListener('DOMContentLoaded',start,{once:true});

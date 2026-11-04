import {installNativeFields} from './native-fields.mjs';
import {limitContract,unit1Profiles} from './unit1-contracts.mjs';
import {translateDerivative,batchmathToLatex} from './answer-adapter.mjs';
const api=window.BatchMathCalculusKeypad,limits=location.pathname.includes('/unit-1-');
for(const [name,spec]of Object.entries(unit1Profiles))api.registerProfile(name,spec);
api.registerProfile('ml-review-difference',{fraction:true,radical:true,exponent:true,variables:['x','h'],arithmetic:true,parentheses:true});
const source=document.getElementById('answer');
if(new URLSearchParams(location.search).get('editor')!=='legacy'){
 const reset=api.reset;api.reset=()=>{reset();source.dispatchEvent(new Event('batchmath:mathlive-reset'));};
 const focus=api.focus;api.focus=()=>{if(source.dataset.editor==='mathlive'&&!source.hidden)source.dispatchEvent(new FocusEvent('focus'));else focus();};
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.repeat&&(event.target.matches?.('math-field,#answer,#submit,#next')||event.target.closest?.('#u1-options'))){event.preventDefault();event.stopImmediatePropagation();}},true);
 const derivative={translate:s=>translateDerivative(s,{inverseTrig:true,variables:document.getElementById('question').dataset.mathliveFamily==='difference'?['x','h']:['x','y']}),toLatex:batchmathToLatex};
 const profile=()=>{
  if(limits)return /u1-review-question-(?:oneSided|infinity)\b/.test(document.getElementById('question').className)?'migration-limit-signed':'migration-limit-finite';
  const cat=document.getElementById('question').dataset.mathliveFamily;
  return({difference:'ml-review-difference',basic:'derivative-power',product:'derivative-product',quotient:'derivative-product',trig:'migration-derivative-trig',chain:'migration-derivative-exp',exponential:'migration-derivative-exp',implicit:'migration-derivative-implicit',log:'migration-derivative-log',logdiff:'migration-derivative-log',invtrig:'migration-derivative-inverse',inverse:'migration-derivative-rational',point:'migration-derivative-comprehensive-value'})[cat]||'derivative-product';
 };
 installNativeFields({hostSelector:'.practice-shell',inputSelector:'#answer',padSelector:'.bm-calc-editor,.bm-calc-keypad:not([data-experimental-bridge])',whenVisible:true,submitSelector:'#submit',contract:{...(limits?limitContract:derivative),visible:input=>!input.hidden},profile,onRestore:(input,value)=>api.setRaw(value),label:limits?'Review limit':'Review derivative'});
 if(limits)installNativeFields({hostSelector:'#u1-options',inputSelector:'input.practice-answer-input',padSelector:'.u1-keypad',contract:limitContract,profile:'ml-unit1-rational-value',label:'Review numerical part'});
}

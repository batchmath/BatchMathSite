import {installNativeFields} from './native-fields.mjs';
import {prepProfiles,exactContract,exactListContract,coordinateContract,rrtContract,coefficientContract,polynomialContract,factoredContract,literalContract} from './prep-contracts.mjs';
if(new URLSearchParams(location.search).get('editor')!=='legacy'){
 const api=window.BatchMathCalculusKeypad;for(const [name,spec]of Object.entries(prepProfiles))api.registerProfile(name,spec);
 const raw=document.getElementById('answerRaw'),binding=raw&&window.BMExactEditor?.bindings.get(raw);
 if(binding){const e=binding.api,get=Object.getOwnPropertyDescriptor(e,'raw').get,lock=e.lock,focus=e.focus;
  Object.defineProperty(e,'raw',{configurable:true,get(){return raw.dataset.editor==='mathlive'?raw.value:get.call(e);}});
  e.lock=function(v=true){lock.call(e,v);raw.disabled=v;};raw.disabled=binding.locked;
  e.focus=function(){if(raw.dataset.editor==='mathlive')raw.dispatchEvent(new FocusEvent('focus'));else focus.call(e);};
 }
 function exactKey(event,field){if(event.ctrlKey||event.metaKey||event.altKey)return false;if(event.key.toLowerCase()==='p'){field.insert('\\pi ');return true;}if(event.key.toLowerCase()==='u'){field.setValue('\\text{undefined}',{mode:'math'});return true;}if(event.key==='Escape'){field.setValue(' ',{mode:'math'});field.mode='math';return true;}return false;}
 function fieldContract(input){
  if(input.id==='answerRaw'){if(location.pathname.includes('trig-equations'))return exactListContract;if(document.getElementById('prompt')?.textContent.includes('point'))return coordinateContract;return exactContract;}
  return input.id==='factorAnswer'?factoredContract:input.id==='rrtAnswer'?rrtContract:input.id==='pascalAnswer'?coefficientContract:input.id==='remainder'?literalContract:polynomialContract;
 }
 function profile({input}){
  const names={freeAnswer:'algebra',factorAnswer:'factor',pascalAnswer:'coefficients',rrtAnswer:'rrt',quotient:'quotient',remainder:'remainder'};
  if(names[input.id])return'ml-prep-'+names[input.id];
  if(location.pathname.includes('unit-circle-values'))return'ml-prep-value';if(location.pathname.includes('trig-equations'))return'ml-prep-solutions';
  const prompt=document.getElementById('prompt').textContent,question=document.getElementById('question').textContent;
  return'ml-prep-'+(prompt.includes('point')?'coordinates':prompt.includes('degrees')||!prompt.includes('radians')&&question.includes('°')?'degrees':'radians');
 }
 installNativeFields({hostSelector:'.practice-shell',inputSelector:'#answerRaw,#freeAnswer,#factorAnswer,#pascalAnswer,#rrtAnswer,#quotient,#remainder',padSelector:'#exactEditor,#exactKeypad,#submit,#insertPM,#insertComma',whenVisible:true,
  contract:{fieldContract:input=>({onKey:input.id==='answerRaw'?exactKey:undefined,translate:s=>fieldContract(input).translate(s),toLatex:s=>fieldContract(input).toLatex(s)})},profile,submitSelector:'#submit',onSubmit:()=>binding?binding.onCheck():document.getElementById('submit').click(),onRestore:(input,value)=>{if(input===raw){binding.api.set(value);if(!binding.locked)binding.api.focus();}},label:'Calculus Prep answer'});
}

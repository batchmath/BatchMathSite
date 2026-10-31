import {mountMathLiveAnswer} from './answer-field.mjs';
import {translateDerivative} from './answer-adapter.mjs';

// Explicit imports on the two pilot pages only. No global preference, registry
// or route-based migration. Each unchanged engine owns its source and controls.
export async function startDerivativePilot(label){
  const source=document.getElementById('answer');
  if(new URLSearchParams(location.search).get('editor')==='legacy'){
    source.dataset.editor='legacy';return;
  }
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  try {
    if(getComputedStyle(document.documentElement).getPropertyValue('--bm-mathlive-pilot-ready').trim()!=='1')throw Error('MathLive pilot styling is unavailable.');
    await mountMathLiveAnswer({source,legacy:window.BatchMathCalculusKeypad,submit:document.getElementById('submit'),translate:translateDerivative,label});
  } catch(error) {
    source.dataset.editor='legacy';
    const notice=document.createElement('p');notice.className='bm-mathlive-notice';notice.setAttribute('role','status');
    notice.textContent='The standard answer editor is active. You can continue answering here.';
    source.closest('.answer-row').after(notice);
    console.warn(label+' MathLive initialization fallback:',error);
  }
}

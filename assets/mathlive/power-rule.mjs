import {mountMathLiveAnswer} from './answer-field.mjs';
import {translatePowerRule} from './answer-adapter.mjs';

// Imported only by the Power Rule practice page. No global preference/storage.
const source=document.getElementById('answer');
if(new URLSearchParams(location.search).get('editor')==='legacy')source.dataset.editor='legacy';
else {
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  try {
    if(getComputedStyle(document.documentElement).getPropertyValue('--bm-mathlive-pilot-ready').trim()!=='1')throw Error('MathLive pilot styling is unavailable.');
    await mountMathLiveAnswer({source,legacy:window.BatchMathCalculusKeypad,submit:document.getElementById('submit'),translate:translatePowerRule});
  } catch(error) {
    source.dataset.editor='legacy';
    const notice=document.createElement('p');notice.className='bm-mathlive-notice';notice.setAttribute('role','status');
    notice.textContent='The standard answer editor is active. You can continue answering here.';
    source.closest('.answer-row').after(notice);
    console.warn('Power Rule MathLive initialization fallback:',error);
  }
}

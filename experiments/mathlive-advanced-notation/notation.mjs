import {loadMathLive,verifyFonts} from '../../assets/mathlive/runtime.mjs';
import {insertTemplate} from '../../assets/mathlive/templates.mjs';
import {focusMathfield} from '../../assets/mathlive/keypad-bridge.mjs';
try{
  const {MathfieldElement}=await loadMathLive(),field=new MathfieldElement();field.className='bm-mathlive-answer';field.setAttribute('aria-label','Notation scratchpad');field.mathVirtualKeyboardPolicy='manual';field.smartSuperscript=false;field.smartFence=false;field.removeExtraneousParentheses=false;document.getElementById('field').append(field);await verifyFonts(()=>field.isConnected);
  const refresh=()=>document.getElementById('latex').value=field.value;
  field.addEventListener('input',refresh);
  for(const id of ['insert','clear','slot'])document.getElementById(id).addEventListener('pointerdown',e=>e.preventDefault());
  document.getElementById('insert').onclick=()=>{focusMathfield(field);insertTemplate(field,document.getElementById('template').value);refresh();};
  document.getElementById('clear').onclick=()=>{field.executeCommand('deleteAll');focusMathfield(field);refresh();};
  document.getElementById('slot').onclick=()=>{focusMathfield(field);field.executeCommand('moveToNextPlaceholder');};document.documentElement.dataset.ready='true';focusMathfield(field);
}catch(error){document.getElementById('status').textContent='MathLive could not load. '+error.message;}

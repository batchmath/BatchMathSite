// Scope extra controls to Newton's construction field in both editor modes.
export function installNewtonControls(){
 const api=window.BatchMathCalculusKeypad,prior=api.mountInputs;
 api.mountInputs=function(inputs,host,options={}){
  const mount=prior.call(api,inputs,host,options);
  if(options.mode!=='unit4-newton'||!mount)return mount;
  const row=mount.pad.querySelector('.bm-calc-main-grid');
  for(const [label,raw,aria] of [['∞','infinity','Insert infinity'],['−∞','-infinity','Insert negative infinity'],['lim','\\lim','Insert bare limit operator'],['xₙ','_{}','Insert subscript'],['→','\\to ','Insert approach arrow']]){
   const b=document.createElement('button');b.type='button';b.className='bm-calc-key function';b.textContent=label;b.setAttribute('aria-label',aria);
   b.addEventListener('pointerdown',e=>e.preventDefault());
   b.onclick=()=>{const binding=mount.bindings[0];binding.editor.focus();const data=new DataTransfer();data.setData('text/plain',raw);binding.editor.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));if(raw==='_{}')api.setCursor(api.cursor-1);};row.insertBefore(b,row.querySelector('.navigation'));
  }
  return mount;
 };
}
